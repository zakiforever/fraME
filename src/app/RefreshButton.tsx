"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const busy = isPending || isRefreshing;

  async function handleClick() {
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
    } finally {
      setIsRefreshing(false);
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="text-[11px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-3 h-3 ${busy ? "animate-spin" : ""}`}
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
      {busy ? "Päivitetään…" : "Päivitä"}
    </button>
  );
}
