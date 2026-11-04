import { IntakeData } from "./intake-state";

export type EligibilityStatus = "eligible" | "not_eligible" | "doctor_review";

export interface EligibilityResult {
  status: EligibilityStatus;
  reason?: string;
}

/**
 * Calculates BMI given height in cm and weight in kg.
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Determines eligibility based on intake data.
 * - If BMI < 27 → not eligible
 * - If personal/family history of MTC or MEN 2 → not eligible
 * - If any healthCritical conditions present → not_eligible or doctor_review
 * - Else → eligible
 */
export function determineEligibilityForRegion(
  data: IntakeData,
  country: string,
  bmiOverride?: number
): EligibilityResult {
  const rawBmi = bmiOverride ?? calculateBMI(data.height, data.weight);
  const bmi = Math.round(rawBmi * 100) / 100;

  const hasMtcMen2History = data.healthCritical.includes("mtc_men2_history");
  const hasCriticalCondition = data.healthCritical.length > 0 && !data.healthCritical.includes("none");
  const hasExtendedCondition = data.healthExtended.length > 0 && !data.healthExtended.includes("none");
  const hasWeightRelatedCondition = hasCondition(data.healthExtended, [
    "hypertension",
    "diabetes_t2",
    "high_cholesterol",
    "sleep_apnea",
  ]);
  const hasMetabolicRiskFactor = hasCondition(data.healthExtended, [
    "prediabetes",
    "pcos",
    "high_cholesterol",
  ]);
  const isSouthAsian = country === "IN";
  const bmiThreshold = isSouthAsian ? 27.5 : 27;
  const qualifyingLowBmi = isSouthAsian ? 25 : Number.POSITIVE_INFINITY;

  if (hasMtcMen2History) {
    return {
      status: "not_eligible",
      reason: "GLP-1 medications carry a boxed warning for thyroid C-cell tumors and are contraindicated for people with a personal or family history of Medullary Thyroid Carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).",
    };
  }

  if (hasCriticalCondition) {
    return {
      status: "not_eligible",
      reason: "Based on your medical history (End-stage disease, active cancer, or psychiatric history), you are not currently eligible for our remote weight loss program. We recommend consulting your primary care physician.",
    };
  }

  if (data.opiateUse === "yes") {
    return {
      status: "not_eligible",
      reason: "Recent opiate use is a contraindication for our current weight loss medications.",
    };
  }

  if (bmi >= 30) {
    if (hasExtendedCondition && !hasWeightRelatedCondition) {
      return {
        status: "doctor_review",
        reason: isSouthAsian
          ? `Your BMI is ${bmi.toFixed(1)}. A doctor should review your profile before GLP-1 treatment because South Asian guidelines are more nuanced at lower BMI values.`
          : `Your BMI is ${bmi.toFixed(1)}. A doctor should review your profile before GLP-1 treatment because your medical conditions need manual review.`,
      };
    }
    return {
      status: "eligible",
      reason: `Your BMI is ${bmi.toFixed(1)}, which meets the standard qualification threshold for GLP-1 treatment.`,
    };
  }

  if (isSouthAsian && bmi >= qualifyingLowBmi && hasMetabolicRiskFactor) {
    return {
      status: "eligible",
      reason: `Your BMI is ${bmi.toFixed(1)}, which meets the South Asian qualification threshold when metabolic risk factors are present.`,
    };
  }

  if (bmi >= bmiThreshold && hasWeightRelatedCondition) {
    return {
      status: "eligible",
      reason: `Your BMI is ${bmi.toFixed(1)}, which meets the qualification threshold when weight-related conditions are present.`,
    };
  }

  if (hasExtendedCondition) {
    return {
      status: "doctor_review",
      reason: isSouthAsian
        ? `Your BMI is ${bmi.toFixed(1)}. A doctor should review your profile before GLP-1 treatment because South Asian guidelines are more nuanced at lower BMI values.`
        : `Your BMI is ${bmi.toFixed(1)}. A doctor should review your profile before GLP-1 treatment because your medical conditions need manual review.`,
    };
  }

  return {
    status: "not_eligible",
    reason: isSouthAsian
      ? `Your BMI is ${bmi.toFixed(1)}, which is below the usual qualification threshold of ${bmiThreshold} for GLP-1 treatment in South Asian populations unless metabolic risk factors are present.`
      : `Your BMI is ${bmi.toFixed(1)}, which is below the usual qualification threshold of ${bmiThreshold} for GLP-1 treatment.`,
  };
}

export function determineEligibility(data: IntakeData, country = "US"): EligibilityResult {
  return determineEligibilityForRegion(data, country);
}

function hasCondition(values: string[], allowed: string[]) {
  return values.some((value) => allowed.includes(value));
}
