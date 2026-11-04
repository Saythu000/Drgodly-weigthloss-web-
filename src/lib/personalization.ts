import { calculateBMI } from "./eligibility";
import { IntakeData } from "./intake-state";

export interface PersonalizationResult {
  bmi: number;
  weeklyWeightLossRange: {
    min: number;
    max: number;
  };
  estimatedWeeksToGoal: {
    min: number;
    max: number;
  };
  successProbability: number;
  metabolicScore: number;
}

/**
 * Calculates weight loss estimations based on current and goal weight.
 * Medvi logic (approximated):
 * - Weekly loss: 1.2kg to 1.6kg (2.75lb to 3.6lb)
 * - Success probability: Base 85% + bonuses for history/interest
 */
export function calculatePersonalization(
  currentWeight: number,
  goalWeight: number,
  heightCm: number,
  data?: Partial<IntakeData>
): PersonalizationResult {
  const bmi = calculateBMI(heightCm, currentWeight);
  const weightToLose = Math.max(0, currentWeight - goalWeight);

  // Medvi-like accelerated range (1.2kg to 1.6kg per week)
  const minWeeklyLoss = 1.2;
  const maxWeeklyLoss = 1.6;

  let successProbability = 85;
  if (data?.programHistory === "yes") successProbability += 5;
  if (data?.primaryInterest === "potency") successProbability += 4.6;
  successProbability = Math.min(99, successProbability);

  const metabolicScore = Math.floor(Math.random() * (95 - 75 + 1)) + 75; // Approximated

  // If already at or below goal, weeks should be 0
  if (weightToLose === 0) {
    return {
      bmi: Number(bmi.toFixed(1)),
      weeklyWeightLossRange: { min: 0, max: 0 },
      estimatedWeeksToGoal: { min: 0, max: 0 },
      successProbability: 100,
      metabolicScore: 100,
    };
  }

  const minWeeks = Math.ceil(weightToLose / maxWeeklyLoss);
  const maxWeeks = Math.ceil(weightToLose / minWeeklyLoss);

  return {
    bmi: Number(bmi.toFixed(1)),
    weeklyWeightLossRange: {
      min: minWeeklyLoss,
      max: maxWeeklyLoss,
    },
    estimatedWeeksToGoal: {
      min: minWeeks,
      max: maxWeeks,
    },
    successProbability,
    metabolicScore,
  };
}
