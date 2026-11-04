import React from "react";
import { Star } from "lucide-react";
import { TrustContent } from "@/lib/trust-data";

export interface TestimonialCardProps {
  content: TrustContent;
}

export function TestimonialCard({ content }: TestimonialCardProps) {
  const { description, metadata } = content;
  const rating = metadata?.rating || 5;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex gap-0.5">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
        &quot;{description}&quot;
      </p>
      <div className="mt-auto flex items-center justify-between text-xs font-bold">
        <span className="text-zinc-900 dark:text-zinc-100">{metadata?.author}</span>
        {metadata?.loss && (
          <span className="text-green-600 dark:text-green-500">{metadata.loss}</span>
        )}
      </div>
    </div>
  );
}
