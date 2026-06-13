"use client";

import { useState } from "react";
import { type StoryGroup } from "@/lib/feeds";


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

export default function StoryCard({ group }: { group: StoryGroup }) {
  const isBlindspot = group.sources.length === 1;
  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(false);
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
      <div className="flex justify-end w-full">
  <button
    onClick={() => setIsExpertOpen(!isExpertOpen)}
    className={"text-xs text-gray-900 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition-colors " + (isExpertOpen && "bg-green-400")}
  >
    Expert comments
  </button>
</div>

{isExpertOpen && (
  <div className="mt-2 text-sm text-gray-700 space-y-2">
    <p>
      – I have not heard before that there has been a particular need for such
      instructions. It has also been noted in the public debate that there have
      been very few such cases.
    </p>
    <p className="font-semibold text-center">Shramarke Aw-Musse</p>
    <p className="text-gray-500 text-center">Imam of Myyrmäki Mosque</p>
  </div>
)}
<div className="flex justify-end w-full " >
  <button
    onClick={() => setIsBackgroundOpen(!isBackgroundOpen)}
    className={"text-xs text-gray-900 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition-colors "+ (isBackgroundOpen && "bg-green-400")}
  >
    Background info
  </button>
</div>

{isBackgroundOpen && (
  <div className="mt-2 text-sm text-gray-700 space-y-2">
    <p>
      – This is related to the background of the topic that we will think about the topic in the 
      Finnish society and outside of it. And it started as a political thing
      in 2002 but now it has grown to bigger.
    </p>
    <p className="font-semibold text-center">Source: 3.5.2013 <a className="underline" href="www.website.com">www.website.com</a></p>
  </div>
)}


<div className="flex justify-end w-full " >
  <button
    className={"text-xs text-gray-900 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition-colors "+ (isBackgroundOpen && "bg-green-400")}
  >
    &#x279A; View Statement
  </button>
</div>
    </article>
  );
}