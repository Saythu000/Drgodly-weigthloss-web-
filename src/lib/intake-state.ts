import { z } from "zod";

export enum IntakeStep {
  // Basic Info
  HEIGHT = "height",
  WEIGHT = "weight",
  GOAL_WEIGHT = "goalWeight",
  GENDER = "gender",
  DATE_OF_BIRTH = "dateOfBirth",

  // Medical Screening
  HEALTH_CRITICAL = "healthCritical", // Medvi Health Questions 1
  HEALTH_EXTENDED = "healthExtended", // Medvi Health Questions 2
  OPIATE_USE = "opiateUse",
  PRIOR_SURGERY = "priorSurgery",
  CURRENT_MEDS = "currentMeds",
  BLOOD_PRESSURE = "bloodPressure",
  HEART_RATE = "heartRate",
  
  // History & Goals
  MEDICATION_HISTORY = "medicationHistory",
  PROGRAM_HISTORY = "programHistory",
  PRIMARY_INTEREST = "primaryInterest", // Affordability vs Potency
  FORM_FACTOR = "formFactor", // Injection vs Tablet
  HAS_ADDITIONAL_INFO = "hasAdditionalInfo",
  ADDITIONAL_INFO_DETAILS = "additionalInfoDetails",
  PERSONALIZATION_GOALS = "personalizationGoals", // Maintain muscle, side effects, etc.

  // Identity & Shipping
  FIRST_NAME = "firstName",
  LAST_NAME = "lastName",
  SHIPPING_STATE = "shippingState",
  EMAIL = "email",
  PHONE = "phone",

  COMPLETED = "completed",
}

export const IntakeDataSchema = z.object({
  height: z.number().min(50).max(300),
  weight: z.number().min(20).max(500),
  goalWeight: z.number().min(20).max(500),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),

  healthCritical: z.array(z.string()),
  healthExtended: z.array(z.string()),
  opiateUse: z.enum(["yes", "no"]),
  priorSurgery: z.enum(["yes", "no"]),
  currentMeds: z.enum(["yes", "no"]),
  bloodPressure: z.string(),
  heartRate: z.string(),

  medicationHistory: z.string(),
  programHistory: z.enum(["yes", "no"]),
  primaryInterest: z.enum(["affordability", "potency"]),
  formFactor: z.enum(["injection", "tablet"]),
  hasAdditionalInfo: z.enum(["yes", "no"]),
  additionalInfoDetails: z.string().optional(),
  personalizationGoals: z.array(z.string()),

  firstName: z.string().min(1),
  lastName: z.string().min(1),
  shippingState: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

export type IntakeData = z.infer<typeof IntakeDataSchema>;

export interface IntakeState {
  currentStep: IntakeStep;
  data: Partial<IntakeData>;
}

export const INTAKE_STEPS_ORDER: IntakeStep[] = [
  IntakeStep.HEIGHT,
  IntakeStep.WEIGHT,
  IntakeStep.GOAL_WEIGHT,
  IntakeStep.GENDER,
  IntakeStep.DATE_OF_BIRTH,
  IntakeStep.HEALTH_CRITICAL,
  IntakeStep.HEALTH_EXTENDED,
  IntakeStep.OPIATE_USE,
  IntakeStep.PRIOR_SURGERY,
  IntakeStep.CURRENT_MEDS,
  IntakeStep.BLOOD_PRESSURE,
  IntakeStep.HEART_RATE,
  IntakeStep.MEDICATION_HISTORY,
  IntakeStep.PROGRAM_HISTORY,
  IntakeStep.PRIMARY_INTEREST,
  IntakeStep.FORM_FACTOR,
  IntakeStep.HAS_ADDITIONAL_INFO,
  IntakeStep.ADDITIONAL_INFO_DETAILS,
  IntakeStep.PERSONALIZATION_GOALS,
  IntakeStep.FIRST_NAME,
  IntakeStep.LAST_NAME,
  IntakeStep.SHIPPING_STATE,
  IntakeStep.EMAIL,
  IntakeStep.PHONE,
];

export function getNextStep(currentStep: IntakeStep, data?: Partial<IntakeData>): IntakeStep {
  // Branching Logic
  if (currentStep === IntakeStep.HAS_ADDITIONAL_INFO) {
    if (data?.hasAdditionalInfo === "no") {
      return IntakeStep.PERSONALIZATION_GOALS; // Skip details
    }
  }

  const currentIndex = INTAKE_STEPS_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === INTAKE_STEPS_ORDER.length - 1) {
    return IntakeStep.COMPLETED;
  }
  return INTAKE_STEPS_ORDER[currentIndex + 1];
}

export const StepValidators: Record<string, z.ZodTypeAny> = {
  [IntakeStep.HEIGHT]: IntakeDataSchema.shape.height,
  [IntakeStep.WEIGHT]: IntakeDataSchema.shape.weight,
  [IntakeStep.GOAL_WEIGHT]: IntakeDataSchema.shape.goalWeight,
  [IntakeStep.GENDER]: IntakeDataSchema.shape.gender,
  [IntakeStep.DATE_OF_BIRTH]: IntakeDataSchema.shape.dateOfBirth,
  [IntakeStep.HEALTH_CRITICAL]: IntakeDataSchema.shape.healthCritical,
  [IntakeStep.HEALTH_EXTENDED]: IntakeDataSchema.shape.healthExtended,
  [IntakeStep.OPIATE_USE]: IntakeDataSchema.shape.opiateUse,
  [IntakeStep.PRIOR_SURGERY]: IntakeDataSchema.shape.priorSurgery,
  [IntakeStep.CURRENT_MEDS]: IntakeDataSchema.shape.currentMeds,
  [IntakeStep.BLOOD_PRESSURE]: IntakeDataSchema.shape.bloodPressure,
  [IntakeStep.HEART_RATE]: IntakeDataSchema.shape.heartRate,
  [IntakeStep.MEDICATION_HISTORY]: IntakeDataSchema.shape.medicationHistory,
  [IntakeStep.PROGRAM_HISTORY]: IntakeDataSchema.shape.programHistory,
  [IntakeStep.PRIMARY_INTEREST]: IntakeDataSchema.shape.primaryInterest,
  [IntakeStep.FORM_FACTOR]: IntakeDataSchema.shape.formFactor,
  [IntakeStep.HAS_ADDITIONAL_INFO]: IntakeDataSchema.shape.hasAdditionalInfo,
  [IntakeStep.ADDITIONAL_INFO_DETAILS]: IntakeDataSchema.shape.additionalInfoDetails,
  [IntakeStep.PERSONALIZATION_GOALS]: IntakeDataSchema.shape.personalizationGoals,
  [IntakeStep.FIRST_NAME]: IntakeDataSchema.shape.firstName,
  [IntakeStep.LAST_NAME]: IntakeDataSchema.shape.lastName,
  [IntakeStep.SHIPPING_STATE]: IntakeDataSchema.shape.shippingState,
  [IntakeStep.EMAIL]: IntakeDataSchema.shape.email,
  [IntakeStep.PHONE]: IntakeDataSchema.shape.phone,
};
