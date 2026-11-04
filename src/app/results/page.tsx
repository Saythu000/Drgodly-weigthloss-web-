"use client";

import React from "react";
import ResultsView from "@/components/ResultsView";
import { useRouter } from "next/navigation";
import type { PricingStrategyTier } from "@/lib/pricing-strategy";

export default function ResultsPage() {
  const router = useRouter();

  return (
    <ResultsView 
      onPlanSelect={(tier: PricingStrategyTier) => {
        sessionStorage.setItem("drgodly:selectedPlanTier", tier.band);
        sessionStorage.setItem("drgodly:selectedPlanTitle", tier.title);
        router.push("/appointment");
      }}
    />
  );
}
