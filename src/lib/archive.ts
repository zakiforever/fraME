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

interface ArchiveFile {
  version: number;
  articles: StoredArticle[];
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

// version 0 means "no archive written yet" — treated the same as an empty one.
async function loadArchive(): Promise<{ version: number; articles: Article[] }> {
  if (!blobConfigured()) return { version: 0, articles: [] };
  try {
    const blob = await head(ARCHIVE_PATHNAME);
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return { version: 0, articles: [] };
    const stored = (await res.json()) as ArchiveFile;
    return { version: stored.version ?? 0, articles: deserialize(stored.articles ?? []) };
  } catch {
    // No archive written yet, or the store isn't reachable — start empty.
    return { version: 0, articles: [] };
  }
}

async function saveArchive(version: number, articles: Article[]): Promise<void> {
  const file: ArchiveFile = { version, articles: serialize(articles) };
  await put(ARCHIVE_PATHNAME, JSON.stringify(file), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// Fetches every source, merges anything new into the persisted archive, and
// returns the full merged list plus how much changed. Safe to call often —
// it only writes to the blob store when new articles were actually found.
//
// Two callers can run this at once (e.g. a deploy's build-time prerender
// overlapping with the daily cron), so the read-merge-write below is
// optimistic: right before writing, it re-reads the version number and
// retries the merge from scratch if another writer got there first, instead
// of blindly overwriting their changes.
async function scrapeAndPersist(): Promise<{ articles: Article[]; added: number }> {
  if (!blobConfigured()) {
    const fresh = await fetchLiveArticles();
    return { articles: fresh, added: 0 };
  }

  const fresh = await fetchLiveArticles();

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { version, articles: existing } = await loadArchive();
    const existingUrls = new Set(existing.map((a) => a.url));
    const newOnes = fresh.filter((a) => a.url && !existingUrls.has(a.url));

    if (newOnes.length === 0) {
      return { articles: existing, added: 0 };
    }

    const merged = dedupeByUrl([...newOnes, ...existing]).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    const { version: latestVersion } = await loadArchive();
    if (latestVersion !== version) {
      // Someone else wrote in between our read and our write — redo the
      // merge against whatever they just saved instead of clobbering it.
      continue;
    }

    await saveArchive(version + 1, merged);
    return { articles: merged, added: newOnes.length };
  }

  // Kept losing the race after several tries (very unlikely) — return the
  // freshest merge we computed without persisting, rather than risk
  // dropping another writer's articles.
  return { articles: dedupeByUrl(fresh), added: 0 };
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
