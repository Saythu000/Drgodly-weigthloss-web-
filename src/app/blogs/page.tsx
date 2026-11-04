import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Clock3 } from "lucide-react";
import { blogPosts } from "@/lib/blogs";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Educational blog posts about GLP-1 treatment, progress tracking, and structured weight-loss care.",
};

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <section className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl space-y-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs font-bold uppercase tracking-widest text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
              <BookOpenText className="h-3.5 w-3.5" />
              Blogs
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              Practical guidance for the weight-loss journey.
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Read short, focused articles that explain treatment basics, preparation, and how to stay consistent after starting the intake.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900"
              >
                Start intake
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-900 transition-transform hover:scale-[1.02] active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                View events
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {blogPosts.map((post) => (
              <Link
                key={post.title}
                href={`/blogs/${post.slug}`}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{post.category}</p>
                <h2 className="mt-3 text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
                <div className="mt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {post.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
