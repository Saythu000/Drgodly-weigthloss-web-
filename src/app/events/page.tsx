import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, Sparkles, CheckSquare } from "lucide-react";
import { eventItems } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming DrGodly events, webinars, and doctor-led information sessions.",
};

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 bg-white/70 py-16 dark:border-zinc-800/80 dark:bg-zinc-900/40 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Live Webinars & Clinics
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              Join Live Doctor-Led Information Sessions.
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
              Attend interactive Q&As, nutrition workshops, and community check-in clinics designed to answer your questions and guide your weight-loss journey.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-950 sm:w-auto w-full justify-center"
              >
                Start intake
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blogs"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-4 text-base font-bold text-zinc-900 transition-transform hover:scale-[1.01] active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto w-full justify-center"
              >
                Read blogs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events Card Grid Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventItems.map((event) => {
              const isWebinar = event.slug.includes("workshop") || event.slug.includes("qa") || event.slug.includes("doctors");
              const categoryBadge = event.slug.includes("doctors") ? "Clinician Masterclass" : (isWebinar ? "Interactive Workshop" : "Community Clinic");

              return (
                <div
                  key={event.title}
                  className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-500/20"
                >
                  <div className="space-y-4">
                    {event.image && (
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm mb-4 bg-zinc-100">
                        <Image
                          src={event.image}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 350px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {categoryBadge}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {event.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {event.description}
                    </p>

                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 space-y-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {event.location}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all group-hover:bg-emerald-600 dark:bg-zinc-800 dark:text-zinc-100 dark:group-hover:bg-emerald-600"
                    >
                      Reserve Free Spot
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Bottom Navigation */}
          <div className="mt-16 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-bold text-zinc-700 transition-transform hover:scale-[1.01] active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
