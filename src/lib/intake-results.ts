import { IntakeData } from "./intake-state";

type StoredIntake = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingState: string;
  height: number;
  weight: number;
  goalWeight: number;
  gender: string;
  dateOfBirth: Date;
  healthData: unknown;
  history: unknown;
  preferences: unknown;
  additionalInfo: string | null;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function intakeDataFromStoredIntake(intake: StoredIntake): Partial<IntakeData> {
  const healthData = asRecord(intake.healthData);
  const history = asRecord(intake.history);
  const preferences = asRecord(intake.preferences);

  return {
    firstName: intake.firstName,
    lastName: intake.lastName,
    email: intake.email,
    phone: intake.phone,
    shippingState: intake.shippingState,
    height: intake.height,
    weight: intake.weight,
    goalWeight: intake.goalWeight,
    gender: intake.gender as IntakeData["gender"],
    dateOfBirth: intake.dateOfBirth.toISOString(),
    healthCritical: healthData.healthCritical as IntakeData["healthCritical"],
    healthExtended: healthData.healthExtended as IntakeData["healthExtended"],
    bloodPressure: healthData.bloodPressure as IntakeData["bloodPressure"],
    heartRate: healthData.heartRate as IntakeData["heartRate"],
    opiateUse: healthData.opiateUse as IntakeData["opiateUse"],
    priorSurgery: healthData.priorSurgery as IntakeData["priorSurgery"],
    currentMeds: healthData.currentMeds as IntakeData["currentMeds"],
    medicationHistory: history.medicationHistory as IntakeData["medicationHistory"],
    programHistory: history.programHistory as IntakeData["programHistory"],
    primaryInterest: preferences.primaryInterest as IntakeData["primaryInterest"],
    formFactor: preferences.formFactor as IntakeData["formFactor"],
    personalizationGoals: preferences.personalizationGoals as IntakeData["personalizationGoals"],
    hasAdditionalInfo: preferences.hasAdditionalInfo as IntakeData["hasAdditionalInfo"],
    additionalInfoDetails: intake.additionalInfo || undefined,
  };
}
