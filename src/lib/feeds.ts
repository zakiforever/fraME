import { XMLParser } from "fast-xml-parser";

export interface Article {
  title: string;
  url: string;
  date: Date;
  source: string;
}

export interface StoryGroup {
  headline: string;
  url: string;
  date: Date;
  articles: Article[];
  sources: string[];
}

// Google News RSS — query already scoped to Finland
const GOOGLE_NEWS_FEEDS = [
  {
    name: "google",
    url: "https://news.google.com/rss/search?q=muslimi+suomi+OR+islam+suomi+OR+moskeija+suomi+OR+muslimeja+suomi&hl=fi-FI&gl=FI&ceid=FI:fi",
  },
];

// Direct Finnish RSS feeds — filter by keyword
const DIRECT_SOURCES = [
  { name: "Yle Uutiset",       url: "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&limit=100" },
  { name: "Helsingin Sanomat", url: "https://www.hs.fi/rss/tuoreimmat.xml" },
  { name: "Ilta-Sanomat",      url: "https://www.is.fi/rss/tuoreimmat.xml" },
  { name: "Ilta-Sanomat",      url: "https://www.is.fi/rss/kotimaa.xml" },
  { name: "Ilta-Sanomat",      url: "https://www.is.fi/rss/ulkomaat.xml" },
  { name: "Iltalehti",         url: "https://www.iltalehti.fi/rss/uutiset.xml" },
  { name: "MTV Uutiset",       url: "https://www.mtvuutiset.fi/rss/uutiset.rss" },
  { name: "Aamulehti",         url: "https://www.aamulehti.fi/rss.xml" },
  { name: "Turun Sanomat",     url: "https://www.ts.fi/rss.xml" },
  { name: "Suomen Kuvalehti",  url: "https://suomenkuvalehti.fi/feed/" },
  { name: "Kaleva",            url: "https://www.kaleva.fi/rss/tuoreimmat/" },
];

const SUBSTR_KEYWORDS = [
  "islam", "muslimi", "muslim", "muslimien", "muslimeja", "moskeija", "mosque",
  "koraani", "quran", "sharia", "ramadan", "hijab",
  "imami", "jihaad", "jihad", "islamist", "mekka",
  "medina", "muhammed", "minareetti", "islamofobia",
  "islamophobi", "islamismia", "islamistinen", "islaminuskoinen", "islaminuskoisia",
  "burkha", "eid-juhla", "niqab", "rukoushuone", "halal",
];

const WORD_PATTERNS = ["imam", "eid", "sunni", "shiia"].map(
  (kw) => new RegExp(`(?:^|[^a-zäöåA-ZÄÖÅ])${kw}(?:[^a-zäöåA-ZÄÖÅ]|$)`, "i")
);

function matchesKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  if (SUBSTR_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  return WORD_PATTERNS.some((re) => re.test(lower));
}

const FINLAND_KEYWORDS = [
  // Country-level
  "suomi", "suomessa", "suomeen", "suomesta", "suomen", "suomalainen",
  "suomalaisia", "suomalaiset", "suomalaisten", "suomalaisille", "finland", "finnish",
  // Major cities & regions
  "helsinki", "tampere", "oulu", "turku", "espoo", "vantaa", "jyväskylä",
  "lahti", "kuopio", "joensuu", "pori", "rovaniemi", "kotka", "kouvola",
  "lappeenranta", "hämeenlinna", "mikkeli", "seinäjoki", "porvoo", "hyvinkää",
  "järvenpää", "nurmijärvi", "kirkkonummi", "lohja", "uusimaa", "pirkanmaa",
  "varsinais-suomi", "pohjois-suomi", "etelä-suomi",
];

function matchesFinland(text: string): boolean {
  const lower = text.toLowerCase();
  return FINLAND_KEYWORDS.some((kw) => lower.includes(kw));
}

const parser = new XMLParser({ ignoreAttributes: false });

function rawText(val: unknown): string {
  if (typeof val === "string") return val.replace(/<!\[CDATA\[|\]\]>/g, "").trim();
  if (typeof val === "object" && val !== null) {
    const v = val as Record<string, unknown>;
    return rawText(v["#text"] ?? v["_"] ?? "");
  }
  return String(val ?? "");
}

async function fetchXML(url: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; fraMEFeed/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
    return Array.isArray(items) ? items : [items];
  } catch {
    return [];
  }
}

const BLOCKED_SOURCES = ["anteryasa.fi"];

// Articles that fell outside the RSS window, added here at their original date
const ARCHIVE_ARTICLES: Article[] = [
  {
    title: "Luvaton moskeija paljastui Espoossa",
    url: "https://www.is.fi/kotimaa/art-2000012079036.html",
    date: new Date("2026-06-15"),
    source: "Ilta-Sanomat",
  },
];

// Parse a Google News RSS item — title format: "Headline - Source Name"
async function fetchGoogleNews(): Promise<Article[]> {
  const articles: Article[] = [];
  for (const feed of GOOGLE_NEWS_FEEDS) {
    const items = await fetchXML(feed.url);
    for (const item of items) {
      const rawTitle = rawText(item.title);
      const dashIdx = rawTitle.lastIndexOf(" - ");
      const title = dashIdx > 0 ? rawTitle.slice(0, dashIdx).trim() : rawTitle.trim();
      const source = dashIdx > 0 ? rawTitle.slice(dashIdx + 3).trim() : "Uutismedia";
      const url = rawText(item.link ?? item.guid ?? "").trim();
      const raw = rawText(item.pubDate ?? item.published ?? "");
      const date = raw ? new Date(raw) : new Date(0);
      const desc = rawText(item.description ?? "");
      if (title.length > 5 && matchesFinland(title + " " + desc) && !BLOCKED_SOURCES.some((b) => source.toLowerCase().includes(b))) {
        articles.push({ title, url, date, source });
      }
    }
  }
  return articles;
}

async function fetchDirectFeed(src: { name: string; url: string }): Promise<Article[]> {
  const items = await fetchXML(src.url);
  return items
    .filter((item) => {
      const title = rawText(item.title);
      const desc = rawText(item.description ?? item.summary ?? "");
      const text = title + " " + desc;
      return (matchesKeyword(title) || matchesKeyword(desc)) && matchesFinland(text);
    })
    .map((item) => {
      const title = rawText(item.title).trim();
      const linkVal = item.link;
      const url =
        typeof linkVal === "string"
          ? linkVal.trim()
          : (linkVal as Record<string, unknown>)?.["@_href"]?.toString().trim() ??
            rawText(item.guid).trim();
      const raw = rawText(item.pubDate ?? item.published ?? item.updated ?? "");
      const date = raw ? new Date(raw) : new Date(0);
      return { title, url, date, source: src.name };
    })
    .filter((a) => a.title.length > 5);
}

const STOP_WORDS = new Set([
  "ja", "on", "ei", "se", "jo", "kun", "tai", "van", "että", "oli", "olla",
  "the", "and", "of", "in", "is", "to", "a", "for", "was", "with", "as",
  "kuin", "myös", "vaan", "mutta", "sekä", "joka", "jossa", "joten", "mikä",
]);

function significantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-zäöå\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
  );
}

function wordOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const w of a) if (b.has(w)) n++;
  return n;
}

function groupArticles(articles: Article[]): StoryGroup[] {
  const used = new Set<number>();
  const groups: StoryGroup[] = [];

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;
    const wordsI = significantWords(articles[i].title);
    const group: Article[] = [articles[i]];
    used.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;
      if (wordOverlap(wordsI, significantWords(articles[j].title)) >= 2) {
        group.push(articles[j]);
        used.add(j);
      }
    }

    groups.push({
      headline: group[0].title,
      url: group[0].url,
      date: group[0].date,
      articles: group,
      sources: [...new Set(group.map((a) => a.source))],
    });
  }

  return groups;
}

export async function getStoryGroups(): Promise<StoryGroup[]> {
  const [googleArticles, ...directResults] = await Promise.all([
    fetchGoogleNews(),
    ...DIRECT_SOURCES.map(fetchDirectFeed),
  ]);

  const directArticles = directResults.flat();

  // Merge: prefer Google News for breadth, direct feeds for validation
  const all = [...googleArticles, ...directArticles, ...ARCHIVE_ARTICLES];

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = all.filter((a) => {
    if (!a.url || seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  unique.sort((a, b) => b.date.getTime() - a.date.getTime());
  return groupArticles(unique);
}
