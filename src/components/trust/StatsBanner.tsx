import React from "react";
import { TrustContent } from "@/lib/trust-data";

export interface StatsBannerProps {
  content: TrustContent;
}

export function StatsBanner({ content }: StatsBannerProps) {
  const { title, description, metadata } = content;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {metadata?.value}
        </span>
        <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          {metadata?.metric}
        </span>
      </div>
      <div>
        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
