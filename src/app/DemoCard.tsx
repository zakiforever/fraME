"use client";

import { useState } from "react";
import { type StoryGroup } from "@/lib/feeds";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "juuri nyt";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} t`;
  const days = Math.floor(hrs / 24);
  return days < 7 ? `${days} pv` : `${Math.floor(days / 7)} vk`;
}

export default function DemoCard({ group }: { group: StoryGroup }) {
  const [expertOpen, setExpertOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${group.headline}\n${group.url}`)}`, "_blank");
    setShareMenuOpen(false);
  };
  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(group.url)}`, "_blank", "width=600,height=400");
    setShareMenuOpen(false);
  };
  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(group.url)}`, "_blank", "width=600,height=400");
    setShareMenuOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Story */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
            Islam &amp; Muslimit
          </span>
          {group.articles.length > 1 && (
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wide">
              {group.articles.length} lähdettä
            </span>
          )}
        </div>
        <a
          href={group.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-3 group"
        >
          <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
            {group.headline}
          </h2>
        </a>
        <p className="text-xs text-gray-400 mb-3">{timeAgo(group.date)} sitten · {group.sources.join(", ")}</p>
        {group.articles.length > 1 && (
          <div className="flex gap-3 flex-wrap">
            {group.articles.map((a, i) => (
              <a
                key={a.url + i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors underline underline-offset-2"
              >
                {a.source}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Expert comments */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setExpertOpen(!expertOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Expert comments</span>
          <span className={`text-gray-400 transition-transform duration-300 ${expertOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {expertOpen && (
          <div className="px-6 pb-6 space-y-4 text-sm text-gray-700">
            <p className="leading-relaxed">
              – I have not heard before that there has been a particular need for such instructions.
              It has also been noted in the public debate that there have been very few such cases.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Shramarke Aw-Musse</p>
                <p className="text-xs text-gray-400">Imam of Myyrmäki Mosque</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <img src="/share.svg" width="14" alt="" />
                  Share
                </button>
                {shareMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                    <button onClick={shareToWhatsApp} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-gray-900 hover:bg-gray-50 rounded-t-xl transition-colors">
                      <img src="/whatsapp.png" width="14" alt="" /> WhatsApp
                    </button>
                    <button onClick={shareToFacebook} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-gray-900 hover:bg-gray-50 transition-colors">
                      <img src="/facebook.png" width="14" alt="" /> Facebook
                    </button>
                    <button onClick={shareToLinkedIn} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-gray-900 hover:bg-gray-50 rounded-b-xl transition-colors">
                      <img src="/linkedin.png" width="14" alt="" /> LinkedIn
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Background info */}
      <div className="border-b border-gray-100">
        <button
          onClick={() => setBackgroundOpen(!backgroundOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span>Background info</span>
          <span className={`text-gray-400 transition-transform duration-300 ${backgroundOpen ? "rotate-180" : ""}`}>▾</span>
        </button>
        {backgroundOpen && (
          <div className="px-6 pb-6 space-y-3 text-sm text-gray-700">
            <p className="leading-relaxed">
              – Finns Party MP Vesa-Matti Saarakkala submitted a bill that would ban wearing of
              face-covering burqas and niqabs in public places, subject to a fine. According to him,
              Finland should intervene now, when the intervention does not yet affect a significant
              number of people in Finland, in order to maintain social peace.
            </p>
            <p className="text-xs text-gray-400">
              Source: 3.5.2013 —{" "}
              <a href="http://www.website.com" className="underline hover:text-gray-700">
                www.website.com
              </a>
            </p>
          </div>
        )}
      </div>

      {/* View Statement */}
      <div className="px-6 py-4">
        <a
          href="https://108b0ff9b8.clvaw-cdnwnd.com/c6673b656bd2599ee2673be9a1af532a/200000531-28fd528fd7/Statement_Niqab-ban_2025.pdf?ph=108b0ff9b8"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          &#x279A; View Statement
        </a>
      </div>

      {shareMenuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setShareMenuOpen(false)} />
      )}
    </div>
  );
}
