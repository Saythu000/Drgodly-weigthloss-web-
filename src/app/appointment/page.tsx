"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, Stethoscope, ArrowRight, ChevronLeft } from "lucide-react";
import { TIERED_PRICING_STRATEGY, type PricingStrategyTier } from "@/lib/pricing-strategy";

const APPOINTMENT_SLOTS = [
  "Today, 4:00 PM",
  "Today, 7:30 PM",
  "Tomorrow, 10:00 AM",
  "Tomorrow, 1:30 PM",
  "Tomorrow, 6:00 PM",
];

export default function AppointmentPage() {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedTier, setSelectedTier] = useState<PricingStrategyTier>(TIERED_PRICING_STRATEGY[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const storedTierBand = sessionStorage.getItem("drgodly:selectedPlanTier");
    const storedTier =
      TIERED_PRICING_STRATEGY.find((tier) => tier.band === storedTierBand) || TIERED_PRICING_STRATEGY[0];
    setSelectedTier(storedTier);

    const storedNotes = sessionStorage.getItem("drgodly:appointmentNotes");
    if (storedNotes) {
      setNotes(storedNotes);
    }

    const storedSlot = sessionStorage.getItem("drgodly:appointmentSlot");
    if (storedSlot) {
      setSelectedSlot(storedSlot);
    }
  }, []);

  const slotSummary = useMemo(() => selectedSlot || "Pick a consultation time", [selectedSlot]);

  const handleContinue = () => {
    sessionStorage.setItem("drgodly:appointmentSlot", selectedSlot);
    sessionStorage.setItem("drgodly:appointmentNotes", notes);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="mx-auto max-w-4xl space-y-8">
        <button
          type="button"
          onClick={() => router.push("/results")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to plans
        </button>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Doctor Appointment</p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Set Your Consultation
          </h1>
          <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
            You selected {selectedTier.title}. Choose a consultation slot with the doctor before continuing to checkout.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Assigned Doctor</p>
                <p className="text-sm text-zinc-500">Licensed physician review and consultation</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {APPOINTMENT_SLOTS.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={
                    `flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ` +
                    (selectedSlot === slot
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700")
                  }
                >
                  <CalendarDays className="h-5 w-5 text-zinc-500" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{slot}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Notes for the doctor</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Add symptoms, questions, or anything you want the doctor to know."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Selected Plan</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">{selectedTier.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{selectedTier.medication}</p>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{selectedTier.audience}</p>
              <div className="mt-5 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-zinc-500" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Appointment</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{slotSummary}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!selectedSlot}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Continue to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
