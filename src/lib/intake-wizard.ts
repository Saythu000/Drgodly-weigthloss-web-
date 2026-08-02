// ponytail: streamlined multi-intent intake engine for DrGodly Telehealth Clinic
import fs from 'node:fs';
import path from 'node:path';

export enum IntakeStep {
  HEIGHT = 'HEIGHT',
  WEIGHT = 'WEIGHT',
  GOAL_WEIGHT = 'GOAL_WEIGHT',
  GENDER = 'GENDER',
  DATE_OF_BIRTH = 'DATE_OF_BIRTH',
  HEALTH_CRITICAL = 'HEALTH_CRITICAL',
  HEALTH_EXTENDED = 'HEALTH_EXTENDED',
  OPIATE_USE = 'OPIATE_USE',
  PRIOR_SURGERY = 'PRIOR_SURGERY',
  CURRENT_MEDS = 'CURRENT_MEDS',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  HEART_RATE = 'HEART_RATE',
  MEDICATION_HISTORY = 'MEDICATION_HISTORY',
  PROGRAM_HISTORY = 'PROGRAM_HISTORY',
  PRIMARY_INTEREST = 'PRIMARY_INTEREST',
  FORM_FACTOR = 'FORM_FACTOR',
  HAS_ADDITIONAL_INFO = 'HAS_ADDITIONAL_INFO',
  ADDITIONAL_INFO_DETAILS = 'ADDITIONAL_INFO_DETAILS',
  PERSONALIZATION_GOALS = 'PERSONALIZATION_GOALS',
  FIRST_NAME = 'FIRST_NAME',
  LAST_NAME = 'LAST_NAME',
  SHIPPING_STATE = 'SHIPPING_STATE',
  EMAIL = 'EMAIL',
  CHECKOUT_ADDRESS = 'CHECKOUT_ADDRESS',
  CONSULTATION_PAYMENT = 'CONSULTATION_PAYMENT',
}

export enum ProgressStep {
  PROGRESS_WEIGHT = 'PROGRESS_WEIGHT',
  PROGRESS_COMPLIANCE = 'PROGRESS_COMPLIANCE',
  PROGRESS_SIDE_EFFECTS = 'PROGRESS_SIDE_EFFECTS',
  PROGRESS_ENERGY = 'PROGRESS_ENERGY',
  PROGRESS_SATISFACTION = 'PROGRESS_SATISFACTION',
  PROGRESS_COMMENTS = 'PROGRESS_COMMENTS',
}

export const INTAKE_QUESTIONS: Record<IntakeStep, { question: string; options?: string[]; next: (val: string) => IntakeStep | 'COMPLETED' }> = {
  [IntakeStep.HEIGHT]: {
    question: "Welcome to DrGodly Weight Loss Telehealth! Let's start with your medical intake. What is your height in cm? (e.g. 175)",
    next: () => IntakeStep.WEIGHT,
  },
  [IntakeStep.WEIGHT]: {
    question: "What is your current weight in kg? (e.g. 85)",
    next: () => IntakeStep.GOAL_WEIGHT,
  },
  [IntakeStep.GOAL_WEIGHT]: {
    question: "What is your goal weight in kg? (e.g. 70)",
    next: () => IntakeStep.GENDER,
  },
  [IntakeStep.GENDER]: {
    question: "Are you male or female?\n1. Male\n2. Female",
    options: ['male', 'female'],
    next: () => IntakeStep.DATE_OF_BIRTH,
  },
  [IntakeStep.DATE_OF_BIRTH]: {
    question: "What is your date of birth? (YYYY-MM-DD, e.g. 1995-05-15)",
    next: () => IntakeStep.HEALTH_CRITICAL,
  },
  [IntakeStep.HEALTH_CRITICAL]: {
    question: "Important clinical note: GLP-1 medications carry a boxed warning for thyroid C-cell tumors and are not used for people with MTC/MEN 2 history.\n\nDo any apply? Reply numbers separated by commas or '8' for None:\n1. MTC/MEN 2 history\n2. End-stage kidney disease\n3. End-stage liver disease\n4. Suicidal thoughts\n5. Active cancer\n6. Severe GI condition\n7. Substance disorder\n8. None of the above",
    next: () => IntakeStep.HEALTH_EXTENDED,
  },
  [IntakeStep.HEALTH_EXTENDED]: {
    question: "Do any of these other health conditions apply? Reply numbers separated by commas or '14' for None:\n1. Gallbladder\n2. Hypertension\n3. High cholesterol\n4. Prediabetes\n5. PCOS\n6. Seizures\n7. Glaucoma\n8. Sleep apnea\n9. Type 2 Diabetes\n10. Type 1 Diabetes\n11. Pancreatitis\n12. Recent heart event\n13. Thyroid cancer\n14. None of the above",
    next: () => IntakeStep.OPIATE_USE,
  },
  [IntakeStep.OPIATE_USE]: {
    question: "Within the last 3 months, have you taken opiate pain medications or street drugs?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: () => IntakeStep.PRIOR_SURGERY,
  },
  [IntakeStep.PRIOR_SURGERY]: {
    question: "Have you had prior weight loss surgeries?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: () => IntakeStep.CURRENT_MEDS,
  },
  [IntakeStep.CURRENT_MEDS]: {
    question: "Do you currently take any prescription medications?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: () => IntakeStep.BLOOD_PRESSURE,
  },
  [IntakeStep.BLOOD_PRESSURE]: {
    question: "What is your blood pressure range?\n1. <120/80 (Normal)\n2. 120-129/<80 (Elevated)\n3. 130-139/80-89 (High Stage 1)\n4. ≥140/90 (High Stage 2)",
    options: ['normal', 'elevated', 'high_1', 'high_2'],
    next: () => IntakeStep.HEART_RATE,
  },
  [IntakeStep.HEART_RATE]: {
    question: "What is your average resting heart rate?\n1. <60 bpm (Slow)\n2. 60-100 bpm (Normal)\n3. 101-110 bpm (Slightly Fast)\n4. >110 bpm (Fast)",
    options: ['slow', 'normal', 'slightly_fast', 'fast'],
    next: () => IntakeStep.MEDICATION_HISTORY,
  },
  [IntakeStep.MEDICATION_HISTORY]: {
    question: "Have you taken medication for weight loss within the past 4 weeks?\n1. Yes, GLP-1\n2. Yes, other\n3. No",
    options: ['glp1', 'other', 'none'],
    next: () => IntakeStep.PROGRAM_HISTORY,
  },
  [IntakeStep.PROGRAM_HISTORY]: {
    question: "Have you ever tried to lose weight in a formal program?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: () => IntakeStep.PRIMARY_INTEREST,
  },
  [IntakeStep.PRIMARY_INTEREST]: {
    question: "Which of these is most important to you?\n1. Affordability\n2. Potency",
    options: ['affordability', 'potency'],
    next: () => IntakeStep.FORM_FACTOR,
  },
  [IntakeStep.FORM_FACTOR]: {
    question: "GLP-1 is available as an injection or dissolvable tablet. Which sounds best?\n1. Injectable (Weekly)\n2. Oral Tablet (Daily)",
    options: ['injection', 'tablet'],
    next: () => IntakeStep.HAS_ADDITIONAL_INFO,
  },
  [IntakeStep.HAS_ADDITIONAL_INFO]: {
    question: "Do you have any further information for our medical team?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: (val) => (val === 'yes' ? IntakeStep.ADDITIONAL_INFO_DETAILS : IntakeStep.PERSONALIZATION_GOALS),
  },
  [IntakeStep.ADDITIONAL_INFO_DETAILS]: {
    question: "Provide details here (no urgent medical issues).",
    next: () => IntakeStep.PERSONALIZATION_GOALS,
  },
  [IntakeStep.PERSONALIZATION_GOALS]: {
    question: "Select interest goals (comma separated):\n1. Maintain muscle\n2. Manage side effects\n3. Longevity\n4. Cognitive focus\n5. Energy levels\n6. Sleep quality",
    next: () => IntakeStep.FIRST_NAME,
  },
  [IntakeStep.FIRST_NAME]: {
    question: "What is your first name?",
    next: () => IntakeStep.LAST_NAME,
  },
  [IntakeStep.LAST_NAME]: {
    question: "What is your last name?",
    next: () => IntakeStep.SHIPPING_STATE,
  },
  [IntakeStep.SHIPPING_STATE]: {
    question: "What state/city do you reside in?",
    next: () => IntakeStep.EMAIL,
  },
  [IntakeStep.EMAIL]: {
    question: "What is your email address?",
    next: () => IntakeStep.CHECKOUT_ADDRESS,
  },
  [IntakeStep.CHECKOUT_ADDRESS]: {
    question: "Please reply with your full delivery shipping address (House/Door No, Street, City, State, Pincode) for your medical file.",
    next: () => IntakeStep.CONSULTATION_PAYMENT,
  },
  [IntakeStep.CONSULTATION_PAYMENT]: {
    question: "Please complete your consultation payment to select your appointment slot.",
    next: () => 'COMPLETED',
  },
};

export const PROGRESS_QUESTIONS: Record<ProgressStep, { question: string; options?: string[]; next: (val: string) => ProgressStep | 'COMPLETED' }> = {
  [ProgressStep.PROGRESS_WEIGHT]: {
    question: "Welcome back! What is your current weight today in kg? (e.g. 82.5)",
    next: () => ProgressStep.PROGRESS_COMPLIANCE,
  },
  [ProgressStep.PROGRESS_COMPLIANCE]: {
    question: "Have you been taking your medication consistently as prescribed?\n1. Yes\n2. No\n3. Skipped some doses",
    options: ['yes', 'no', 'skipped'],
    next: () => ProgressStep.PROGRESS_SIDE_EFFECTS,
  },
  [ProgressStep.PROGRESS_SIDE_EFFECTS]: {
    question: "Are you experiencing side effects?\n1. None\n2. Nausea\n3. Headaches\n4. Indigestion\n5. Fatigue",
    options: ['none', 'nausea', 'headaches', 'indigestion', 'fatigue'],
    next: () => ProgressStep.PROGRESS_ENERGY,
  },
  [ProgressStep.PROGRESS_ENERGY]: {
    question: "Rate your energy levels:\n1. High\n2. Normal\n3. Low",
    options: ['high', 'normal', 'low'],
    next: () => ProgressStep.PROGRESS_SATISFACTION,
  },
  [ProgressStep.PROGRESS_SATISFACTION]: {
    question: "Are you satisfied with your progress?\n1. Very Satisfied\n2. Satisfied\n3. Neutral\n4. Unsatisfied",
    options: ['very_satisfied', 'satisfied', 'neutral', 'unsatisfied'],
    next: () => ProgressStep.PROGRESS_COMMENTS,
  },
  [ProgressStep.PROGRESS_COMMENTS]: {
    question: "Any notes for the medical team? (Reply 'none' if none)",
    next: () => 'COMPLETED',
  },
};

const PENDING_FILE = path.join(process.cwd(), '.openclaw-local', 'pending_intakes.json');
const PATIENTS_FILE = path.join(process.cwd(), '.openclaw-local', 'patients.json');
const PARTNERSHIPS_FILE = path.join(process.cwd(), '.openclaw-local', 'partnerships.json');
const RECRUITMENT_FILE = path.join(process.cwd(), '.openclaw-local', 'recruitment.json');

// ponytail: native light JSON helpers
function readJson<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  return fallback;
}

function writeJson(file: string, data: any) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getRazorpayLink(): string {
  try {
    const settingsPath = path.join(process.cwd(), '.openclaw-local', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.razorpayLink) return data.razorpayLink;
    }
  } catch (e) {}
  return process.env.RAZORPAY_PAYMENT_LINK || 'https://rzp.io/rzp/7Ei89Qg8';
}

export function hasActiveSession(fromPhone: string): boolean {
  try {
    const cleanPhone = fromPhone.replace(/\D/g, '');
    const pendingStore = readJson<Record<string, any>>(PENDING_FILE, {});
    return !!pendingStore[cleanPhone];
  } catch (e) {
    return false;
  }
}

export class IntakeWizard {
  async handleInbound(fromPhone: string, text: string, detectedCategory?: string): Promise<string | null> {
    const cleanPhone = fromPhone.replace(/\D/g, '');
    const pendingStore = readJson<Record<string, any>>(PENDING_FILE, {});
    const pending = pendingStore[cleanPhone];
    const cleanText = text.trim().toLowerCase();

    const isPartnershipKw = ['partner', 'partnership', 'collaboration', 'proposal', 'vendor', 'b2b', 'tie up', 'tie-up', '2', 'two'].some((k) => cleanText.includes(k));
    const isRecruitmentKw = ['doctor', 'recruit', 'recruitment', 'job', 'hiring', 'vacancy', 'career', 'resume', 'cv', 'medical staff', '3', 'three'].some((k) => cleanText.includes(k));

    // ponytail: direct partnership routing
    if (detectedCategory === 'PARTNERSHIP' || pending?.type === 'PARTNERSHIP' || (!pending && isPartnershipKw)) {
      return this.handlePartnership(cleanPhone, text, pendingStore);
    }

    // ponytail: direct recruitment routing
    if (detectedCategory === 'RECRUITMENT' || pending?.type === 'RECRUITMENT' || (!pending && isRecruitmentKw)) {
      return this.handleRecruitment(cleanPhone, text, pendingStore);
    }

    if (['start intake', 'new patient', 'eligibility', 'consultation', 'intake', '1', 'one', 'weight loss'].includes(cleanText)) {
      return this.startIntake(cleanPhone);
    }

    if (['refill', 'progress', 'checkin', 'next dose'].includes(cleanText)) {
      return this.startProgress(cleanPhone);
    }

    if (!pending) {
      const patients = readJson<any[]>(PATIENTS_FILE, []);
      if (!patients.some((p: any) => p.phone?.replace(/\D/g, '') === cleanPhone) && (detectedCategory === 'CUSTOMER_WEIGHT_LOSS' || !detectedCategory)) {
        return this.startIntake(cleanPhone);
      }
      return null;
    }

    const currentStep = pending.currentStep;
    const isIntake = currentStep in INTAKE_QUESTIONS;
    const isProgress = currentStep in PROGRESS_QUESTIONS;

    if (!isIntake && !isProgress) {
      delete pendingStore[cleanPhone];
      writeJson(PENDING_FILE, pendingStore);
      return null;
    }

    const parsedVal = cleanText;
    const data = pending.data || {};
    data[currentStep] = parsedVal;

    const nextStep = isIntake ? INTAKE_QUESTIONS[currentStep as IntakeStep].next(parsedVal) : PROGRESS_QUESTIONS[currentStep as ProgressStep].next(parsedVal);

    if (currentStep === IntakeStep.CHECKOUT_ADDRESS) {
      const height = Number(data[IntakeStep.HEIGHT]) || 170;
      const weight = Number(data[IntakeStep.WEIGHT]) || 80;
      const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
      const rzpLink = getRazorpayLink();

      pendingStore[cleanPhone] = { currentStep: IntakeStep.CONSULTATION_PAYMENT, data, updatedAt: new Date().toISOString() };
      writeJson(PENDING_FILE, pendingStore);

      return [
        `🩺 *MEDICAL INTAKE COMPLETE!*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Patient:* ${data[IntakeStep.FIRST_NAME] || 'Patient'} ${data[IntakeStep.LAST_NAME] || ''}`.trim(),
        `📊 *Calculated BMI:* ${bmi}`,
        `👨‍⚕️ *Assigned Doctor:* Dr. Kalyan Chakravarthy Kalwa`,
        ``,
        `Your GLP-1 telehealth assessment profile has been prepared for Dr. Kalyan.`,
        ``,
        `💳 *STEP 1 OF 2: Doctor Consultation Fee*`,
        `Please complete your consultation payment using the Razorpay link below:`,
        ``,
        `🔗 *Razorpay Payment Link:*`,
        `${rzpLink}`,
        ``,
        `*(Once your payment is verified, your Calendar Booking Link will be released instantly in this chat!)*`,
      ].join('\n');
    }

    if (nextStep === 'COMPLETED') {
      delete pendingStore[cleanPhone];
      writeJson(PENDING_FILE, pendingStore);
      return `Thank you for completing your telehealth assessment!`;
    }

    pendingStore[cleanPhone] = { currentStep: nextStep, data, updatedAt: new Date().toISOString() };
    writeJson(PENDING_FILE, pendingStore);
    return nextStep in INTAKE_QUESTIONS ? INTAKE_QUESTIONS[nextStep as IntakeStep].question : PROGRESS_QUESTIONS[nextStep as ProgressStep].question;
  }

  // ponytail: 2-step partnership collector
  private async handlePartnership(cleanPhone: string, text: string, pendingStore: Record<string, any>): Promise<string> {
    const pending = pendingStore[cleanPhone];
    if (!pending || pending.type !== 'PARTNERSHIP') {
      pendingStore[cleanPhone] = { type: 'PARTNERSHIP', step: 'NAME', data: {}, updatedAt: new Date().toISOString() };
      writeJson(PENDING_FILE, pendingStore);
      return "🤝 *Partnership Opportunity*\n\nThank you for reaching out! What is your full name and company / organization name?";
    }

    if (pending.step === 'NAME') {
      pending.data.name = text.trim();
      pending.step = 'DETAILS';
      pendingStore[cleanPhone] = pending;
      writeJson(PENDING_FILE, pendingStore);
      return `Thank you ${pending.data.name}! Please provide a brief summary of your business proposal or partnership request.`;
    }

    const partnerships = readJson<any[]>(PARTNERSHIPS_FILE, []);
    partnerships.unshift({ phone: `+${cleanPhone}`, name: pending.data.name, details: text.trim(), status: 'NEW', createdAt: new Date().toISOString() });
    writeJson(PARTNERSHIPS_FILE, partnerships);

    delete pendingStore[cleanPhone];
    writeJson(PENDING_FILE, pendingStore);
    return `✅ *Proposal Submitted!*\n\nThank you ${pending.data.name}. Your proposal has been submitted to Dr. Kalyan and our team. We will review and contact you shortly. 🤝`;
  }

  // ponytail: 3-step doctor recruitment collector
  private async handleRecruitment(cleanPhone: string, text: string, pendingStore: Record<string, any>): Promise<string> {
    const pending = pendingStore[cleanPhone];
    if (!pending || pending.type !== 'RECRUITMENT') {
      pendingStore[cleanPhone] = { type: 'RECRUITMENT', step: 'NAME_QUALIFICATION', data: {}, updatedAt: new Date().toISOString() };
      writeJson(PENDING_FILE, pendingStore);
      return "🩺 *Doctor & Medical Staff Recruitment*\n\nThank you for reaching out to DrGodly Telehealth! What is your full name and medical degree/specialization? (e.g., Dr. Ananya Sharma, MD Internal Medicine / MBBS)";
    }

    if (pending.step === 'NAME_QUALIFICATION') {
      pending.data.name = text.trim();
      pending.step = 'REGISTRATION_EXPERIENCE';
      pendingStore[cleanPhone] = pending;
      writeJson(PENDING_FILE, pendingStore);
      return `Thank you ${pending.data.name}! What is your Medical Council Registration Number and total years of clinical/telehealth experience?`;
    }

    if (pending.step === 'REGISTRATION_EXPERIENCE') {
      pending.data.regExperience = text.trim();
      pending.step = 'AVAILABILITY_RESUME';
      pendingStore[cleanPhone] = pending;
      writeJson(PENDING_FILE, pendingStore);
      return `Great! Please share your consultation availability (Full-time / Part-time) along with a brief summary of your CV or LinkedIn profile link.`;
    }

    const recruitment = readJson<any[]>(RECRUITMENT_FILE, []);
    recruitment.unshift({
      phone: `+${cleanPhone}`,
      name: pending.data.name,
      registrationExperience: pending.data.regExperience,
      details: text.trim(),
      role: 'Doctor / Medical Specialist',
      status: 'NEW',
      createdAt: new Date().toISOString(),
    });
    writeJson(RECRUITMENT_FILE, recruitment);

    delete pendingStore[cleanPhone];
    writeJson(PENDING_FILE, pendingStore);
    return `✅ *Doctor Application Received!*\n\nThank you ${pending.data.name}! Your medical credentials and application have been submitted to Dr. Kalyan and our clinical operations team. We will review your profile and contact you shortly. 🩺`;
  }

  async startIntake(cleanPhone: string): Promise<string> {
    const pendingStore = readJson<Record<string, any>>(PENDING_FILE, {});
    const firstStep = IntakeStep.HEIGHT;
    pendingStore[cleanPhone] = { currentStep: firstStep, data: {}, updatedAt: new Date().toISOString() };
    writeJson(PENDING_FILE, pendingStore);
    return INTAKE_QUESTIONS[firstStep].question;
  }

  async startProgress(cleanPhone: string): Promise<string> {
    const pendingStore = readJson<Record<string, any>>(PENDING_FILE, {});
    const firstStep = ProgressStep.PROGRESS_WEIGHT;
    pendingStore[cleanPhone] = { currentStep: firstStep, data: {}, updatedAt: new Date().toISOString() };
    writeJson(PENDING_FILE, pendingStore);
    return PROGRESS_QUESTIONS[firstStep].question;
  }
}
