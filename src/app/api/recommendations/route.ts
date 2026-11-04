import { NextResponse } from "next/server";
import { getIntakeSessionId } from "@/lib/session-utils";
import { getPendingIntake } from "@/lib/intake-persistence";
import { getRecommendations } from "@/lib/recommendations";
import { IntakeData } from "@/lib/intake-state";
import { getDetectedRegion } from "@/lib/region-server";
import { determineEligibility } from "@/lib/eligibility";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sessionId = await getIntakeSessionId();
    const pending = await getPendingIntake(sessionId);
    const rawData = (pending?.data as unknown as Partial<IntakeData>) || {};
    const region = await getDetectedRegion();

    const safeData: IntakeData = {
      height: typeof rawData.height === "number" ? rawData.height : 170,
      weight: typeof rawData.weight === "number" ? rawData.weight : 85,
      goalWeight: typeof rawData.goalWeight === "number" ? rawData.goalWeight : 70,
      healthCritical: Array.isArray(rawData.healthCritical) ? rawData.healthCritical : ["none"],
      healthExtended: Array.isArray(rawData.healthExtended) ? rawData.healthExtended : ["none"],
      gender: rawData.gender || "female",
      dateOfBirth: rawData.dateOfBirth || "1990-01-01",
      opiateUse: rawData.opiateUse || "no",
      priorSurgery: rawData.priorSurgery || "no",
      currentMeds: rawData.currentMeds || "no",
      bloodPressure: rawData.bloodPressure || "normal",
      heartRate: rawData.heartRate || "normal",
      medicationHistory: rawData.medicationHistory || "none",
      programHistory: rawData.programHistory || "no",
      primaryInterest: rawData.primaryInterest || "affordability",
      formFactor: rawData.formFactor || "tablet",
      hasAdditionalInfo: rawData.hasAdditionalInfo || "no",
      personalizationGoals: Array.isArray(rawData.personalizationGoals) ? rawData.personalizationGoals : ["steady_progress"],
      firstName: rawData.firstName || "Patient",
      lastName: rawData.lastName || "",
      shippingState: rawData.shippingState || "MH",
      email: rawData.email || "patient@example.com",
      phone: rawData.phone || "9876543210",
    };

    const eligibility = determineEligibility(safeData, region.country);
    const result = getRecommendations(safeData, eligibility);

    return NextResponse.json({
      ...result,
      eligibility,
      preferences: {
        formFactor: safeData.formFactor,
        primaryInterest: safeData.primaryInterest,
      },
      region,
    });
  } catch (error) {
    console.error("GET /api/recommendations - Error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
