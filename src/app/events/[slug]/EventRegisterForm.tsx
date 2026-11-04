"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, Clock3, Loader2 } from "lucide-react";

type Props = {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
};

export default function EventRegisterForm({ eventTitle, eventDate, eventTime }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    // Simulate API registration delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50/50 p-8 text-center dark:border-emerald-800/30 dark:bg-emerald-950/20 backdrop-blur-md animate-in fade-in zoom-in duration-300">
        <CheckCircle className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
        <h3 className="mt-4 text-xl font-bold text-zinc-950 dark:text-zinc-50">Registration Confirmed!</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You are all set for <span className="font-bold text-emerald-700 dark:text-emerald-300">{eventTitle}</span>.
        </p>
        <div className="mt-6 flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 text-left w-full">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            <CalendarDays className="h-4 w-4 text-emerald-600" />
            {eventDate}
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mt-2">
            <Clock3 className="h-4 w-4 text-emerald-600" />
            {eventTime}
          </div>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          We have sent the calendar invite and login details to <span className="font-semibold text-zinc-700 dark:text-zinc-300">{email}</span>. See you there!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white/70 p-6 sm:p-8 shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/40 backdrop-blur-md">
      <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Reserve Your Spot</h3>
      <p className="mt-2 text-sm text-zinc-500">
        Spaces are limited. Register below to receive the calendar invite and access links.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Full Name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className="mt-2 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name || !email}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-850 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Securing seat...
            </>
          ) : (
            "Confirm Live Access"
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-zinc-400">
        By registering, you agree to receive event-related communications from DrGodly.
      </p>
    </div>
  );
}
