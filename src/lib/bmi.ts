export type BmiUnit = "metric" | "imperial";

export interface BmiInput {
  height: number;
  weight: number;
  unit: BmiUnit;
}

export type BmiCategory =
  | "underweight"
  | "healthy"
  | "overweight"
  | "obese";

export function calculateBmi({ height, weight, unit }: BmiInput) {
  if (height <= 0 || weight <= 0) {
    return 0;
  }

  if (unit === "imperial") {
    return (703 * weight) / (height * height);
  }

  const heightMeters = height / 100;
  return weight / (heightMeters * heightMeters);
}

export function categorizeBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function getBmiRecommendation(bmi: number) {
  const category = categorizeBmi(bmi);

  switch (category) {
    case "underweight":
      return "You are below the healthy BMI range. A clinician can help you choose the right next step.";
    case "healthy":
      return "You are in the healthy BMI range. If you want help with body composition or metabolic health, join our community to learn more.";
    case "overweight":
      return "You are in the overweight range. This is where many users begin exploring a structured weight-loss plan.";
    case "obese":
      return "You are in the obesity range. Many users in this range benefit from a guided medical weight-loss program.";
  }
}

export function formatBmi(bmi: number) {
  return bmi > 0 ? bmi.toFixed(1) : "0.0";
}
