"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Calculator, Mail, MessageCircle, Scale } from "lucide-react";
import Link from "next/link";
import { categorizeBmi, calculateBmi, formatBmi, getBmiRecommendation, type BmiUnit } from "@/lib/bmi";
import { cn } from "@/lib/utils";

const DEFAULT_WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ||
  "https://wa.me/919346317790?text=I%20want%20to%20join%20the%20DrGodly%20WhatsApp%20community";

const DEFAULT_MARKETING_EMAIL = process.env.NEXT_PUBLIC_MARKETING_EMAIL || "hello@drgodly.com";

export default function BmiCalculatorPage() {
  const [unit, setUnit] = useState<BmiUnit>("metric");
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("80");
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  const bmi = useMemo(() => {
    const parsedHeight = Number(height);
    const parsedWeight = Number(weight);
    return calculateBmi({
      height: parsedHeight,
      weight: parsedWeight,
      unit,
    });
  }, [height, weight, unit]);

  const bmiLabel = useMemo(() => {
    if (!bmi) return "Enter your details to see your BMI";
    const category = categorizeBmi(bmi);
    return {
      underweight: "Underweight",
      healthy: "Healthy",
      overweight: "Overweight",
      obese: "Obese",
    }[category];
  }, [bmi]);

  const recommendation = useMemo(() => getBmiRecommendation(bmi), [bmi]);
  const isReady = Number(height) > 0 && Number(weight) > 0;

  const handleMailingListSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    const subject = encodeURIComponent("DrGodly mailing list signup");
    const body = encodeURIComponent(
      `Please add me to the mailing list.\n\nEmail: ${email.trim()}\nBMI: ${isReady ? formatBmi(bmi) : "N/A"}\nBMI Category: ${isReady ? bmiLabel : "N/A"}`
    );

    window.location.href = `mailto:${DEFAULT_MARKETING_EMAIL}?subject=${subject}&body=${body}`;
    setSubmittedEmail(email.trim());
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <section className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1 text-xs font-bold uppercase tracking-widest text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
              <Calculator className="h-3.5 w-3.5" />
              BMI Calculator
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              See where you stand and take the next step.
            </h1>
            <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Use the calculator to check your BMI, then join our WhatsApp group or mailing list to stay in the funnel and get updates about structured weight-loss support.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900"
              >
                Continue to intake
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={DEFAULT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-900 transition-transform hover:scale-[1.02] active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <MessageCircle className="h-4 w-4 text-green-500" />
                Join WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-zinc-500" />
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Calculate your BMI</h2>
                <p className="text-sm text-zinc-500">Switch between metric and imperial units.</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {(["metric", "imperial"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnit(value)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                    unit === value
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {value === "metric" ? "Metric" : "Imperial"}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {unit === "metric" ? "Height (cm)" : "Height (inches)"}
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {unit === "metric" ? "Weight (kg)" : "Weight (lbs)"}
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>
            </div>

            <div className="mt-6 rounded-3xl bg-zinc-50 p-6 dark:bg-zinc-950">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your BMI</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  {isReady ? formatBmi(bmi) : "0.0"}
                </span>
                <span className="pb-2 text-sm font-bold uppercase tracking-widest text-zinc-500">
                  {bmiLabel}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {recommendation}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Join WhatsApp</p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Get reminders and progress tips in the group
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Join the WhatsApp community to receive updates, next-step prompts, and lightweight education that moves users toward the intake flow.
              </p>
              <a
                href={DEFAULT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                Join WhatsApp Group
              </a>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Join Mailing List</p>
              <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Get follow-up emails and launch updates
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Leave your email and we&apos;ll draft a signup message to our team so you can stay connected with the program.
              </p>

              <form onSubmit={handleMailingListSubmit} className="mt-6 space-y-4">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900"
                >
                  <Mail className="h-4 w-4" />
                  Join Mailing List
                </button>
              </form>

              {submittedEmail && (
                <p className="mt-4 text-xs text-green-600 dark:text-green-400">
                  Prepared a signup message for <span className="font-bold">{submittedEmail}</span>. Your email client should open next.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
