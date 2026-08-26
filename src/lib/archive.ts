import { head, put } from "@vercel/blob";
import {
  ARCHIVE_ARTICLES,
  Article,
  StoryGroup,
  dedupeByUrl,
  fetchLiveArticles,
  groupArticles,
} from "@/lib/feeds";

// Every article this file has ever matched, kept forever — so an item that
// later scrolls off a source's RSS window (which only ever exposes a recent
// slice) doesn't silently disappear from the site.
const ARCHIVE_PATHNAME = "frame/archive.json";

interface StoredArticle {
  title: string;
  url: string;
  date: string;
  source: string;
}

function serialize(articles: Article[]): StoredArticle[] {
  return articles.map((a) => ({ ...a, date: a.date.toISOString() }));
}

function deserialize(stored: StoredArticle[]): Article[] {
  return stored.map((a) => ({ ...a, date: new Date(a.date) }));
}

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function loadArchive(): Promise<Article[]> {
  if (!blobConfigured()) return [];
  try {
    const blob = await head(ARCHIVE_PATHNAME);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return [];
    const stored = (await res.json()) as StoredArticle[];
    return deserialize(stored);
  } catch {
    // No archive written yet, or the store isn't reachable — start empty.
    return [];
  }
}

async function saveArchive(articles: Article[]): Promise<void> {
  if (!blobConfigured()) return;
  await put(ARCHIVE_PATHNAME, JSON.stringify(serialize(articles)), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// Fetches every source, merges anything new into the persisted archive, and
// returns the full merged list plus how much changed. Safe to call often —
// it only writes to the blob store when new articles were actually found.
async function scrapeAndPersist(): Promise<{ articles: Article[]; added: number }> {
  const [existing, fresh] = await Promise.all([loadArchive(), fetchLiveArticles()]);
  const existingUrls = new Set(existing.map((a) => a.url));
  const newOnes = fresh.filter((a) => a.url && !existingUrls.has(a.url));

  if (newOnes.length === 0) {
    return { articles: existing, added: 0 };
  }

  const merged = dedupeByUrl([...newOnes, ...existing]).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  await saveArchive(merged);
  return { articles: merged, added: newOnes.length };
}

export async function getStoryGroups(): Promise<StoryGroup[]> {
  const { articles } = await scrapeAndPersist();
  const all = dedupeByUrl([...articles, ...ARCHIVE_ARTICLES]).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  return groupArticles(all);
}

export async function runScrape(): Promise<{ added: number; total: number }> {
  const { articles, added } = await scrapeAndPersist();
  return { added, total: articles.length };
}
