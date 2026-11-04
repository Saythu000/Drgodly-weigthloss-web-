"use client";

import React, { useEffect, useState } from "react";
import { PersonalizationResult } from "@/lib/personalization";
import { RegionConfig } from "@/lib/region-config";
import { RecommendationResult } from "@/lib/recommendations";
import { TrendingDown, Calendar, Activity, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { TestimonialCard } from "@/components/trust/TestimonialCard";
import { StatsBanner } from "@/components/trust/StatsBanner";
import { FALLBACK_TRUST_CONTENT, TrustContent } from "@/lib/trust-data";
import { TIERED_PRICING_STRATEGY, formatTierMonthlyPrice, type PricingStrategyTier } from "@/lib/pricing-strategy";
import type { EligibilityResult } from "@/lib/eligibility";

type RecommendationPayload = RecommendationResult & {
  region: RegionConfig;
  eligibility?: EligibilityResult;
  preferences?: {
    formFactor?: "injection" | "tablet";
    primaryInterest?: "affordability" | "potency";
  };
};

export interface ResultsViewProps {
  onPlanSelect: (tier: PricingStrategyTier) => void;
}

export default function ResultsView({ onPlanSelect }: ResultsViewProps) {
  const [personalization, setPersonalization] = useState<(PersonalizationResult & { region: RegionConfig }) | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationPayload | null>(null);
  const [trustContent, setTrustContent] = useState<TrustContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Pull the data sources needed to render the results and trust layers.
        const [pRes, rRes, tRes] = await Promise.all([
          fetch("/api/personalization"),
          fetch("/api/recommendations"),
          fetch("/api/trust"),
        ]);

        if (pRes.ok) {
          setPersonalization(await pRes.json());
        }

        if (rRes.ok) {
          setRecommendations(await rRes.json());
        }

        if (tRes.ok) {
          setTrustContent(await tRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch results", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
          <p className="text-sm font-medium text-zinc-500">Generating your personalized plan...</p>
        </div>
      </div>
    );
  }

  if (!personalization || !recommendations) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Could not load results. Please try completing the intake again.</p>
      </div>
    );
  }

  const activeStats = trustContent.filter((t) => t.type === "stat");
  const activeTestimonials = trustContent.filter((t) => t.type === "testimonial");
  const fallbackStats = FALLBACK_TRUST_CONTENT.filter((t) => t.type === "stat");
  const fallbackTestimonials = FALLBACK_TRUST_CONTENT.filter((t) => t.type === "testimonial");
  const stats = [
    ...activeStats,
    ...fallbackStats.filter((item) => !activeStats.some((active) => active.id === item.id)),
  ].slice(0, 2);
  const testimonials = [
    ...activeTestimonials,
    ...fallbackTestimonials.filter((item) => !activeTestimonials.some((active) => active.id === item.id)),
  ].slice(0, 3);
  const primaryTier = recommendations.primary?.tier;
  const primaryPlan = primaryTier
    ? (TIERED_PRICING_STRATEGY.find((tier) => tier.band === primaryTier) || TIERED_PRICING_STRATEGY[0])
    : null;
  const isEligible = recommendations.clinicalPath === "glp1";
  const showPlanChooser = recommendations.nextStep === "choose_plan" && recommendations.preferences?.formFactor !== "tablet";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl"
          >
            Your DrGodly Plan is Ready
          </motion.h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {isEligible
              ? "We've matched you to a treatment path. Injection users can compare plans below, while tablet users continue straight to the doctor appointment step."
              : "Based on the information you provided, a GLP-1 plan is not shown yet. A doctor review is needed before moving forward."}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-zinc-900 p-8 text-center text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-widest opacity-70">Chance of Success</span>
            <div className="text-6xl font-black">{personalization.successProbability}%</div>
            <div className="rounded-full bg-green-500/20 px-4 py-1 text-xs font-bold uppercase text-green-400">
              Very High
            </div>
          </div>
          <p className="mt-4 text-sm opacity-70">
            Based on your profile and metabolic score of {personalization.metabolicScore}/100, you are a strong candidate for GLP-1 therapy.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-4">
          <StatCard icon={<Activity className="h-5 w-5 text-blue-500" />} label="Current BMI" value={personalization.bmi.toString()} />
          <StatCard
            icon={<TrendingDown className="h-5 w-5 text-green-500" />}
            label="Weekly Loss"
            value={
              personalization.region.system === "imperial"
                ? `${Math.round(personalization.weeklyWeightLossRange.min * 2.20462)}-${Math.round(personalization.weeklyWeightLossRange.max * 2.20462)} lbs`
                : `${personalization.weeklyWeightLossRange.min}-${personalization.weeklyWeightLossRange.max} kg`
            }
          />
          <StatCard
            icon={<Calendar className="h-5 w-5 text-purple-500" />}
            label="Timeline"
            value={`${personalization.estimatedWeeksToGoal.min}-${personalization.estimatedWeeksToGoal.max} Weeks`}
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5 text-yellow-500" />}
            label="Goal Weight"
            value={personalization.estimatedWeeksToGoal.min === 0 ? "Goal Reached" : "Target Set"}
          />
        </div>

        {showPlanChooser ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Choose a Plan</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Pick the plan that fits your budget and treatment preference. You&apos;ll go to the doctor appointment screen next.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {TIERED_PRICING_STRATEGY.map((tier) => (
                <button
                  key={tier.title}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("drgodly:selectedPlanTier", tier.band);
                    sessionStorage.setItem("drgodly:selectedPlanTitle", tier.title);
                    onPlanSelect(tier);
                  }}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{tier.title}</p>
                  <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{tier.medication}</h3>
                  <p className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{tier.formFactor}</p>
                  <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatTierMonthlyPrice(tier)}</p>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{tier.audience}</p>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-500">
                    {tier.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <div className="mt-5 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    Select Plan
                  </div>
                </button>
              ))}
            </div>

            {primaryPlan && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Recommended Starting Point</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {primaryPlan.title} is the suggested default for your intake. If you need a different experience level, choose another plan above.
                </p>
              </div>
            )}
          </div>
        ) : isEligible ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Tablet Path Selected</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Since you selected tablets, there are no injection plan tiers to compare here. Continue to the doctor appointment screen to review your recommended path.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {recommendations.clinicalPath === "doctor_review" ? "Doctor Review Needed" : "Plan Selection Unavailable"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {recommendations.summary}
            </p>
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-3xl bg-zinc-100 p-8 dark:bg-zinc-900">
            <h3 className="mb-6 text-xl font-bold">What is Included?</h3>
            <ul className="space-y-4">
              <StepItem icon="💊" title="Treatment Plan" desc="Your selected plan is matched to your intake profile." />
              <StepItem icon="👨‍⚕️" title="1:1 Physician Guidance" desc="Ongoing medical oversight." />
              <StepItem icon="📅" title="Doctor Appointment" desc="You will set a consultation time before checkout." />
              <StepItem icon="🛡️" title="Private & Secure" desc="Your information is handled through the intake flow." />
            </ul>
          </div>
          <div className="rounded-3xl border border-zinc-200 p-8 dark:border-zinc-800">
            <h3 className="mb-6 text-xl font-bold">What Happens Next?</h3>
            <ul className="space-y-6">
              {showPlanChooser ? (
                <>
                  <NextStep number={1} title="Choose a Plan" desc="Pick the tier that fits your budget and treatment preference." />
                  <NextStep number={2} title="Set Appointment" desc="Choose a doctor consultation slot that works for you." />
                  <NextStep number={3} title="Continue to Checkout" desc="Finish the order once your appointment is set." />
                </>
              ) : (
                <>
                  <NextStep number={1} title="Doctor Review" desc="A clinician needs to review your profile before a treatment plan is shown." />
                  <NextStep number={2} title="Set Appointment" desc="Choose a doctor consultation slot that works for you." />
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="grid gap-12 border-t border-zinc-200 pt-12 dark:border-zinc-800 sm:grid-cols-2">
          <div className="space-y-6">
            <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-500">Expected Weight Loss</h3>
            <div className="grid gap-4">
              {stats.map((stat) => (
                <StatsBanner key={stat.id} content={stat} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">FDA-approved medications prescribed by licensed clinicians.</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold uppercase tracking-widest text-zinc-500">Real Stories</h3>
            <div className="grid gap-6">
              {testimonials.map((test) => (
                <TestimonialCard key={test.id} content={test} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      </div>
    </div>
  );
}

function StepItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <li className="flex gap-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-bold text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="text-sm text-zinc-500">{desc}</p>
      </div>
    </li>
  );
}

function NextStep({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
        {number}
      </div>
      <div>
        <p className="font-bold text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="text-sm text-zinc-500">{desc}</p>
      </div>
    </li>
  );
}
