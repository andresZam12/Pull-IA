"use client";

import React from "react";

export function SkeletonCard() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-lg animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded-full bg-zinc-800" />
        <div className="h-4 w-16 rounded-full bg-zinc-800" />
      </div>

      <div className="my-5 aspect-video w-full rounded-2xl bg-zinc-800/60" />

      <div className="space-y-3">
        <div className="h-6 w-3/4 rounded-lg bg-zinc-800" />
        <div className="h-4 w-full rounded-md bg-zinc-800/70" />
        <div className="h-4 w-5/6 rounded-md bg-zinc-800/70" />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-800/60 pt-4">
        <div className="h-3 w-20 rounded bg-zinc-800/60" />
        <div className="h-8 w-24 rounded-xl bg-zinc-800" />
      </div>
    </div>
  );
}
