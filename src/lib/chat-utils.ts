import { IntakeStep } from "@/lib/intake-state";
import { RegionConfig } from "./region-config";


export type MessageRole = "assistant" | "user";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

export interface StepMeta {
  question: string;
  type: "number" | "select" | "date" | "checkbox" | "options" | "text";
  options?: { label: string; value: string | number }[];
  label?: string;
  placeholder?: string;
}

export function getStepMetadata(step: IntakeStep, region: RegionConfig): StepMeta {
  const isImperial = region.system === "imperial";

  const metadata: Record<string, StepMeta> = {
    [IntakeStep.HEIGHT]: {
      question: isImperial ? "What is your height in inches?" : "What is your height in cm?",
      type: "number",
      placeholder: isImperial ? "e.g. 70" : "e.g. 175",
    },
    [IntakeStep.WEIGHT]: {
      question: isImperial ? "What is your current weight in lbs?" : "What is your current weight in kg?",
      type: "number",
      placeholder: isImperial ? "e.g. 185" : "e.g. 85",
    },
    [IntakeStep.GOAL_WEIGHT]: {
      question: isImperial ? "What is your goal weight in lbs?" : "What is your goal weight in kg?",
      type: "number",
      placeholder: isImperial ? "e.g. 160" : "e.g. 75",
    },
    [IntakeStep.GENDER]: {
      question: "Are you male or female?",
      type: "options",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
      ],
    },
    [IntakeStep.DATE_OF_BIRTH]: {
      question: "What is your date of birth?",
      type: "date",
    },
    [IntakeStep.HEALTH_CRITICAL]: {
      question: "Important clinical note: GLP-1 medications carry a boxed warning for thyroid C-cell tumors and are not used for people with a personal or family history of Medullary Thyroid Carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2). Do any of these critical health conditions apply to you?",
      type: "checkbox",
      options: [
        { label: "Personal or family history of MTC or MEN 2", value: "mtc_men2_history" },
        { label: "End-stage kidney disease", value: "kidney_disease_end_stage" },
        { label: "End-stage liver disease", value: "liver_disease_end_stage" },
        { label: "Suicidal thoughts/prior attempt", value: "suicidal_thoughts" },
        { label: "Active cancer or treatment", value: "cancer_active" },
        { label: "Severe gastrointestinal condition", value: "gi_severe" },
        { label: "Substance use disorder", value: "substance_disorder" },
        { label: "None of the above", value: "none" },
      ],
    },
    [IntakeStep.HEALTH_EXTENDED]: {
      question: "Do any of these other health conditions apply to you?",
      type: "checkbox",
      options: [
        { label: "Gallbladder disease", value: "gallbladder" },
        { label: "Hypertension", value: "hypertension" },
        { label: "High cholesterol", value: "high_cholesterol" },
        { label: "Prediabetes", value: "prediabetes" },
        { label: "PCOS", value: "pcos" },
        { label: "Seizures", value: "seizures" },
        { label: "Glaucoma", value: "glaucoma" },
        { label: "Sleep apnea", value: "sleep_apnea" },
        { label: "Type 2 Diabetes", value: "diabetes_t2" },
        { label: "Type 1 Diabetes", value: "diabetes_t1" },
        { label: "History of pancreatitis", value: "pancreatitis" },
        { label: "Heart attack/stroke (last 2 years)", value: "heart_event_recent" },
        { label: "Thyroid cancer history", value: "thyroid_cancer" },
        { label: "None of the above", value: "none" },
      ],
    },
    [IntakeStep.OPIATE_USE]: {
      question: "Within the last 3 months, have you taken opiate pain medications or street drugs?",
      type: "options",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    [IntakeStep.PRIOR_SURGERY]: {
      question: "Have you had prior weight loss surgeries?",
      type: "options",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    [IntakeStep.CURRENT_MEDS]: {
      question: "Do you currently take any prescription medications?",
      type: "options",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    [IntakeStep.BLOOD_PRESSURE]: {
      question: "What is your blood pressure range?",
      type: "options",
      options: [
        { label: "<120/80 (Normal)", value: "normal" },
        { label: "120-129/<80 (Elevated)", value: "elevated" },
        { label: "130-139/80-89 (High Stage 1)", value: "high_1" },
        { label: "≥140/90 (High Stage 2)", value: "high_2" },
      ],
    },
    [IntakeStep.HEART_RATE]: {
      question: "What is your average resting heart rate?",
      type: "options",
      options: [
        { label: "<60 bpm (Slow)", value: "slow" },
        { label: "60-100 bpm (Normal)", value: "normal" },
        { label: "101-110 bpm (Slightly Fast)", value: "slightly_fast" },
        { label: ">110 bpm (Fast)", value: "fast" },
      ],
    },
    [IntakeStep.MEDICATION_HISTORY]: {
      question: "Have you taken medication for weight loss within the past 4 weeks?",
      type: "options",
      options: [
        { label: "Yes, I've taken GLP-1 medication", value: "glp1" },
        { label: "Yes, different medication", value: "other" },
        { label: "No", value: "none" },
      ],
    },
    [IntakeStep.PROGRAM_HISTORY]: {
      question: "Have you ever tried to lose weight in a program (e.g. Weight Watchers, Jenny Craig)?",
      type: "options",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    [IntakeStep.PRIMARY_INTEREST]: {
      question: "Which of these is most important to you?",
      type: "options",
      options: [
        { label: "Affordability (Lowest price)", value: "affordability" },
        { label: "Potency (Stronger dose)", value: "potency" },
      ],
    },
    [IntakeStep.FORM_FACTOR]: {
      question: "GLP-1 is available as an injection or a dissolvable tablet. Which sounds best?",
      type: "options",
      options: [
        { label: "I prefer to inject (Weekly)", value: "injection" },
        { label: "I prefer a tablet (Daily)", value: "tablet" },
      ],
    },
    [IntakeStep.HAS_ADDITIONAL_INFO]: {
      question: "Do you have any further information which you would like our medical team to know?",
      type: "options",
      options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
    [IntakeStep.ADDITIONAL_INFO_DETAILS]: {
      question: "Provide details here. Please do not include urgent or emergency medical information.",
      type: "text",
      placeholder: "Provide details here...",
    },
    [IntakeStep.PERSONALIZATION_GOALS]: {
      question: "Please select the options that you are interested in:",
      type: "checkbox",
      options: [
        { label: "Maintaining muscle mass", value: "muscle" },
        { label: "Managing side effects (nausea)", value: "side_effects" },
        { label: "Aging and longevity", value: "longevity" },
        { label: "Improving cognitive function", value: "cognitive" },
        { label: "Improving energy levels", value: "energy" },
        { label: "Improving sleep quality", value: "sleep" },
      ],
    },
    [IntakeStep.FIRST_NAME]: {
      question: "What is your first name?",
      type: "text",
      placeholder: "First Name",
    },
    [IntakeStep.LAST_NAME]: {
      question: "What is your last name?",
      type: "text",
      placeholder: "Last Name",
    },
    [IntakeStep.SHIPPING_STATE]: {
      question: "What state will your medication be shipped to?",
      type: "text",
      placeholder: "State / Region",
    },
    [IntakeStep.EMAIL]: {
      question: "What is your email address?",
      type: "text",
      placeholder: "Email Address",
    },
    [IntakeStep.PHONE]: {
      question: "What is your phone number?",
      type: "text",
      placeholder: "Phone Number",
    },
  };

  return metadata[step];
}
