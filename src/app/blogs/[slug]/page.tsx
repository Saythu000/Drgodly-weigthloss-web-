import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, Check } from "lucide-react";
import { blogPosts } from "@/lib/blogs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return { title: "Blog" };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white/70 py-16 dark:border-zinc-800/80 dark:bg-zinc-900/40 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>
          <span className="mt-8 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            {post.category}
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-xl">
            {post.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {post.date}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-8">
            <article className="space-y-10 rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-5 sm:p-10 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md">
              {post.sections ? (
                post.sections.map((section, sIdx) => {
                  const isKeyTakeaway = section.heading.toLowerCase().includes("key takeaway");

                  return (
                    <section
                      key={sIdx}
                      className={`space-y-5 ${
                        isKeyTakeaway
                          ? "rounded-2xl border border-emerald-200/50 bg-emerald-50/30 p-6 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                          : ""
                      }`}
                    >
                      <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                        {section.heading}
                      </h2>

                      {/* Section Image */}
                      {section.image && (
                        <div className="my-6 overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-md">
                          <Image
                            src={section.image.src}
                            alt={section.image.alt}
                            title={section.image.alt}
                            width={800}
                            height={450}
                            className="w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
                          />
                          {section.image.caption && (
                            <p className="bg-zinc-50/80 border-t border-zinc-200/60 px-4 py-3 text-center text-xs italic text-zinc-500 dark:bg-zinc-950/80 dark:border-zinc-800/60 dark:text-zinc-400">
                              {section.image.caption}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Paragraphs with HTML support */}
                      {section.paragraphs?.map((paragraph, pIdx) => (
                        <p
                          key={pIdx}
                          dangerouslySetInnerHTML={{ __html: paragraph }}
                          className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-lg sm:leading-loose"
                        />
                      ))}

                      {/* Bullets with HTML support and custom markers */}
                      {section.bullets && (
                        <ul className="space-y-4 pl-1 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-lg sm:leading-loose">
                          {section.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-3">
                              <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                                <Check className="h-3 w-3" />
                              </span>
                              <span dangerouslySetInnerHTML={{ __html: bullet }} />
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Responsive Table */}
                      {section.table && (
                        <div className="my-6 overflow-x-auto rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800">
                          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm dark:divide-zinc-800">
                            <thead className="bg-zinc-50/80 dark:bg-zinc-950/80">
                              <tr>
                                {section.table.headers.map((header) => (
                                  <th
                                    key={header}
                                    scope="col"
                                    className="px-5 py-4 font-semibold tracking-wider text-zinc-950 dark:text-zinc-50 whitespace-nowrap"
                                  >
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                              {section.table.rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className="transition-colors hover:bg-zinc-50/40 dark:hover:bg-zinc-900/20"
                                >
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="px-5 py-4 text-zinc-600 dark:text-zinc-300 whitespace-nowrap"
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  );
                })
              ) : (
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                    This article is part of the DrGodly educational library.
                  </p>
                </div>
              )}
            </article>

            {/* Author Biography */}
            {post.author && (
              <aside className="flex flex-col gap-6 rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500/20 sm:h-24 sm:w-24">
                  <Image
                    src={post.author.image}
                    alt={post.author.name}
                    title={post.author.name}
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Written by</p>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{post.author.name}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{post.author.bio}</p>
                </div>
              </aside>
            )}

            {/* Medical Reviewer Biography */}
            {post.reviewedBy && (
              <aside className="flex flex-col gap-6 rounded-2xl sm:rounded-3xl border border-zinc-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/60 backdrop-blur-md sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500/20 sm:h-24 sm:w-24">
                  <Image
                    src={post.reviewedBy.image}
                    alt={post.reviewedBy.name}
                    title={post.reviewedBy.name}
                    fill
                    sizes="(max-width: 768px) 80px, 96px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Medically Reviewed by</p>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{post.reviewedBy.name}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{post.reviewedBy.bio}</p>
                </div>
              </aside>
            )}

            {/* Mobile Optimized CTAs */}
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-950 sm:w-auto w-full"
              >
                Start intake
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-4 text-base font-bold text-zinc-900 transition-transform hover:scale-[1.01] active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto w-full"
              >
                View events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
