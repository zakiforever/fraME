import { getStoryGroups, type StoryGroup } from "@/lib/feeds";

export const revalidate = 300;

// Map source name fragments → brand colors
const SOURCE_COLOR_MAP: [string, string][] = [
  ["yle",               "#0099CC"],
  ["helsingin sanomat", "#C8102E"],
  ["hs.fi",             "#C8102E"],
  ["ilta-sanomat",      "#E87722"],
  ["is.fi",             "#E87722"],
  ["iltalehti",         "#B22222"],
  ["il.fi",             "#B22222"],
  ["mtv",               "#CF0A2C"],
  ["aamulehti",         "#003D84"],
  ["turun sanomat",     "#005B8E"],
  ["ts.fi",             "#005B8E"],
  ["suomen kuvalehti",  "#6B3E8E"],
  ["kaleva",            "#008542"],
  ["verkkouutiset",     "#444444"],
  ["suomenmaa",         "#2D6A2D"],
  ["seurakuntalainen",  "#8B6914"],
  ["kirkko",            "#8B6914"],
  ["maaseudun",         "#5C7A2D"],
];

const PALETTE = [
  "#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444",
  "#8b5cf6","#06b6d4","#84cc16","#f97316","#ec4899",
];
const colorCache = new Map<string, string>();
let paletteIdx = 0;

function sourceColor(name: string): string {
  if (colorCache.has(name)) return colorCache.get(name)!;
  const lower = name.toLowerCase();
  for (const [key, color] of SOURCE_COLOR_MAP) {
    if (lower.includes(key)) {
      colorCache.set(name, color);
      return color;
    }
  }
  const color = PALETTE[paletteIdx++ % PALETTE.length];
  colorCache.set(name, color);
  return color;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "juuri nyt";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} t`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} pv`;
  return `${Math.floor(days / 7)} vk`;
}

function CoverageBar({ sources }: { sources: string[] }) {
  const unique = [...new Set(sources)];
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-[2px]">
      {unique.map((src) => (
        <div
          key={src}
          className="flex-1 min-w-[4px]"
          style={{ backgroundColor: sourceColor(src) }}
          title={src}
        />
      ))}
      {unique.length === 0 && <div className="flex-1 bg-gray-200" />}
    </div>
  );
}

function StoryCard({ group }: { group: StoryGroup }) {
  const isBlindspot = group.sources.length === 1;
  const uniqueSources = [...new Set(group.sources)];

  return (
    <article className="border-b border-gray-100 last:border-0 py-5">
      {/* Topic + badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Islam &amp; Muslimit
        </span>
        {isBlindspot && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
            <span className="text-amber-500">⚠</span>
            Katvealue
          </span>
        )}
        {group.articles.length > 1 && (
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wide">
            {group.articles.length} lähdettä
          </span>
        )}
      </div>

      {/* Headline */}
      <a
        href={group.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link block mb-3"
      >
        <h2 className="text-[15px] font-semibold text-gray-900 leading-snug group-hover/link:text-blue-700 transition-colors">
          {group.headline}
        </h2>
      </a>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
        <span>{timeAgo(group.date)} sitten</span>
        <span>·</span>
        <span>{uniqueSources.length === 1 ? uniqueSources[0] : `${uniqueSources.length} mediaa`}</span>
      </div>

      {/* Coverage bar */}
      <div className="mb-2">
        <CoverageBar sources={group.sources} />
      </div>

      {/* Source links */}
      {group.articles.length > 1 && (
        <div className="flex gap-3 flex-wrap mt-2">
          {group.articles.map((article, i) => (
            <a
              key={article.url + i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: sourceColor(article.source) }}
              />
              {article.source}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default async function Home() {
  const groups = await getStoryGroups();
  const totalArticles = groups.reduce((n, g) => n + g.articles.length, 0);
  const sourceNames = [...new Set(groups.flatMap((g) => g.sources))].slice(0, 8);

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#0d1117] text-white shadow-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="font-black text-xl tracking-tighter shrink-0">NAZ</span>
            <span className="text-[11px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full hidden sm:inline shrink-0">
              Suomi
            </span>
            <nav className="hidden md:flex items-center gap-0.5 ml-1">
              {[
                { label: "Koti", active: true },
                { label: "Sinulle", active: false },
                { label: "Paikalliset", active: false },
                { label: "Katvealueet", active: false },
              ].map(({ label, active }) => (
                <button
                  key={label}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-gray-600 hidden lg:inline">
              {new Date().toLocaleDateString("fi-FI", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <button className="text-xs bg-white text-gray-900 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition-colors">
              Kirjaudu
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Topic filter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Aiheet
              </p>
              <ul className="space-y-0.5">
                {[
                  { label: "Muslims in Finland", active: true, count: groups.length },
                  { label: "Family", active: false },
                  { label: "Politics", active: false },
                  { label: "Religion", active: false },
                ].map(({ label, active, count }) => (
                  <li key={label}>
                    <a
                      href="#"
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        active
                          ? "bg-[#0d1117] text-white font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span>{label}</span>
                      {count !== undefined && (
                        <span
                          className={`text-[11px] font-bold tabular-nums ${
                            active ? "text-gray-400" : "text-gray-400"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source legend */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Mediakattavuus
              </p>
              <ul className="space-y-2">
                {sourceNames.map((src) => (
                  <li key={src} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: sourceColor(src) }}
                    />
                    <span className="text-xs text-gray-700 truncate">{src}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ── Main feed ── */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Feed header card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  Islam &amp; Muslimit Suomessa
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {groups.length > 0
                    ? `${groups.length} tarinaa · ${totalArticles} artikkelia`
                    : "Ladataan…"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  5 min välein
                </span>
              </div>
            </div>

            {/* Master coverage bar */}
            {sourceNames.length > 0 && (
              <div className="mt-4">
                <div className="flex h-2 rounded-full overflow-hidden gap-[2px]">
                  {sourceNames.map((src) => (
                    <div
                      key={src}
                      className="flex-1"
                      style={{ backgroundColor: sourceColor(src) }}
                      title={src}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {sourceNames.length} suomalaista mediaa seurannassa
                </p>
              </div>
            )}
          </div>

          {/* Stories */}
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-600 font-medium">Ei tuoreita artikkeleita juuri nyt.</p>
              <p className="text-gray-400 text-sm mt-1">Sivu päivittyy automaattisesti 5 minuutin välein.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 px-5 shadow-sm">
              {groups.map((group, i) => (
                <StoryCard key={group.url + i} group={group} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
