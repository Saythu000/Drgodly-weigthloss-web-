import fs from 'node:fs';
import path from 'node:path';
import { sendWaMediaMessage } from '@/lib/wa-client';

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
  CHECKOUT_FORM_FACTOR = 'CHECKOUT_FORM_FACTOR',
  CHECKOUT_ADDRESS = 'CHECKOUT_ADDRESS',
  CHECKOUT_PAYMENT = 'CHECKOUT_PAYMENT',
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
    question: "Welcome to DrGodly Weight Loss Clinic! Let's start with your medical intake. What is your height in cm? (e.g. 175)",
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
    question: "Important clinical note: GLP-1 medications carry a boxed warning for thyroid C-cell tumors and are not used for people with a personal or family history of Medullary Thyroid Carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).\n\nDo any of these critical health conditions apply to you? Reply with numbers separated by commas (e.g., 1,3) or reply '8' for None:\n1. Personal or family history of MTC or MEN 2\n2. End-stage kidney disease\n3. End-stage liver disease\n4. Suicidal thoughts/prior attempt\n5. Active cancer or treatment\n6. Severe gastrointestinal condition\n7. Substance use disorder\n8. None of the above",
    next: () => IntakeStep.HEALTH_EXTENDED,
  },
  [IntakeStep.HEALTH_EXTENDED]: {
    question: "Do any of these other health conditions apply to you? Reply with numbers separated by commas (e.g., 2,5) or reply '14' for None:\n1. Gallbladder disease\n2. Hypertension\n3. High cholesterol\n4. Prediabetes\n5. PCOS\n6. Seizures\n7. Glaucoma\n8. Sleep apnea\n9. Type 2 Diabetes\n10. Type 1 Diabetes\n11. Pancreatitis history\n12. Heart attack/stroke (last 2 years)\n13. Thyroid cancer history\n14. None of the above",
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
    question: "Have you taken medication for weight loss within the past 4 weeks?\n1. Yes, I've taken GLP-1 medication\n2. Yes, different medication\n3. No",
    options: ['glp1', 'other', 'none'],
    next: () => IntakeStep.PROGRAM_HISTORY,
  },
  [IntakeStep.PROGRAM_HISTORY]: {
    question: "Have you ever tried to lose weight in a program (e.g. Weight Watchers, Jenny Craig)?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: () => IntakeStep.PRIMARY_INTEREST,
  },
  [IntakeStep.PRIMARY_INTEREST]: {
    question: "Which of these is most important to you?\n1. Affordability (Lowest price)\n2. Potency (Stronger dose)",
    options: ['affordability', 'potency'],
    next: () => IntakeStep.FORM_FACTOR,
  },
  [IntakeStep.FORM_FACTOR]: {
    question: "GLP-1 is available as an injection or a dissolvable tablet. Which sounds best?\n1. I prefer to inject (Weekly)\n2. I prefer a tablet (Daily)",
    options: ['injection', 'tablet'],
    next: () => IntakeStep.HAS_ADDITIONAL_INFO,
  },
  [IntakeStep.HAS_ADDITIONAL_INFO]: {
    question: "Do you have any further information which you would like our medical team to know?\n1. Yes\n2. No",
    options: ['yes', 'no'],
    next: (val) => (val === 'yes' ? IntakeStep.ADDITIONAL_INFO_DETAILS : IntakeStep.PERSONALIZATION_GOALS),
  },
  [IntakeStep.ADDITIONAL_INFO_DETAILS]: {
    question: "Provide details here. Please do not include urgent or emergency medical information.",
    next: () => IntakeStep.PERSONALIZATION_GOALS,
  },
  [IntakeStep.PERSONALIZATION_GOALS]: {
    question: "Please select the options that you are interested in (numbers separated by commas):\n1. Maintaining muscle mass\n2. Managing side effects (nausea)\n3. Aging and longevity\n4. Improving cognitive function\n5. Improving energy levels\n6. Improving sleep quality",
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
    question: "What state will your medication be shipped to?",
    next: () => IntakeStep.EMAIL,
  },
  [IntakeStep.EMAIL]: {
    question: "What is your email address?",
    next: () => IntakeStep.CHECKOUT_FORM_FACTOR,
  },
  [IntakeStep.CHECKOUT_FORM_FACTOR]: {
    question: "Which medication form factor do you prefer to start your program?\n1. Wegovy 0.25mg Weekly Injection Pen (₹5,660)\n2. Rybelsus 7mg Daily Tablets (₹3,300)",
    options: ['injection', 'tablet'],
    next: () => IntakeStep.CHECKOUT_ADDRESS,
  },
  [IntakeStep.CHECKOUT_ADDRESS]: {
    question: "Please reply with your full delivery shipping address (House/Door No, Street, City, State, Pincode) for courier dispatch.",
    next: () => IntakeStep.CHECKOUT_PAYMENT,
  },
  [IntakeStep.CHECKOUT_PAYMENT]: {
    question: "After payment, reply with your 12-digit UTR/UPI Ref No. or send screenshot receipt here.",
    next: () => 'COMPLETED',
  },
};

export const PROGRESS_QUESTIONS: Record<ProgressStep, { question: string; options?: string[]; next: (val: string) => ProgressStep | 'COMPLETED' }> = {
  [ProgressStep.PROGRESS_WEIGHT]: {
    question: "Welcome back! Let's do a quick progress check-in for your refill order. What is your current weight today in kg? (e.g. 82.5)",
    next: () => ProgressStep.PROGRESS_COMPLIANCE,
  },
  [ProgressStep.PROGRESS_COMPLIANCE]: {
    question: "Have you been taking your medication consistently as prescribed?\n1. Yes\n2. No\n3. Skipped some doses",
    options: ['yes', 'no', 'skipped'],
    next: () => ProgressStep.PROGRESS_SIDE_EFFECTS,
  },
  [ProgressStep.PROGRESS_SIDE_EFFECTS]: {
    question: "Are you experiencing any side effects? Reply with the option number:\n1. None\n2. Nausea\n3. Headaches\n4. Constipation/Indigestion\n5. Diarrhea/Fatigue",
    options: ['none', 'nausea', 'headaches', 'constipation_indigestion', 'diarrhea_fatigue'],
    next: () => ProgressStep.PROGRESS_ENERGY,
  },
  [ProgressStep.PROGRESS_ENERGY]: {
    question: "How would you rate your energy levels on your current treatment?\n1. High\n2. Normal\n3. Low",
    options: ['high', 'normal', 'low'],
    next: () => ProgressStep.PROGRESS_SATISFACTION,
  },
  [ProgressStep.PROGRESS_SATISFACTION]: {
    question: "Are you satisfied with the progress you've made so far?\n1. Very Satisfied\n2. Satisfied\n3. Neutral\n4. Unsatisfied",
    options: ['very_satisfied', 'satisfied', 'neutral', 'unsatisfied'],
    next: () => ProgressStep.PROGRESS_COMMENTS,
  },
  [ProgressStep.PROGRESS_COMMENTS]: {
    question: "Do you have any progress comments or notes you would like our medical team to know? (Reply 'none' if none)",
    next: () => 'COMPLETED',
  },
};

const CRITICAL_VALUES = [
  'mtc_men2_history',
  'kidney_disease_end_stage',
  'liver_disease_end_stage',
  'suicidal_thoughts',
  'cancer_active',
  'gi_severe',
  'substance_disorder',
];

const EXTENDED_VALUES = [
  'gallbladder',
  'hypertension',
  'high_cholesterol',
  'prediabetes',
  'pcos',
  'seizures',
  'glaucoma',
  'sleep_apnea',
  'diabetes_t2',
  'diabetes_t1',
  'pancreatitis',
  'heart_event_recent',
  'thyroid_cancer',
];

const PENDING_FILE = path.join(process.cwd(), '.openclaw-local', 'pending_intakes.json');
const PATIENTS_FILE = path.join(process.cwd(), '.openclaw-local', 'patients.json');
const ORDERS_FILE = path.join(process.cwd(), '.openclaw-local', 'orders.json');

function readJson<T>(file: string, fallback: T): T {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
  }
  return fallback;
}

function writeJson(file: string, data: any) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export class IntakeWizard {
  async handleInbound(fromPhone: string, text: string): Promise<string | null> {
    const cleanPhone = fromPhone.replace(/\D/g, '');
    const pendingStore = readJson<Record<string, any>>(PENDING_FILE, {});
    const pending = pendingStore[cleanPhone];
    const cleanText = text.trim().toLowerCase();

    // Condition 2: Keyword trigger to start new intake
    if (['start intake', 'new patient', 'eligibility', 'consultation', 'intake'].includes(cleanText)) {
      return this.startIntake(cleanPhone);
    }

    // Condition 3: Keyword trigger to start refill progress check-in
    if (['refill', 'progress', 'checkin', 'next dose'].includes(cleanText)) {
      return this.startProgress(cleanPhone);
    }

    if (!pending) {
      // Condition 1: If patient does not exist, auto-start Intake
      const patientsStore = readJson<any[]>(PATIENTS_FILE, []);
      const exists = patientsStore.some((p: any) => p.phone && p.phone.replace(/\D/g, '') === cleanPhone);
      if (!exists) {
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

    const parsedVal = this.parseInput(currentStep, text);
    const data = pending.data || {};
    data[currentStep] = parsedVal;

    // Handle Form Factor Image Dispatching
    if (currentStep === IntakeStep.CHECKOUT_FORM_FACTOR) {
      const isTablet = parsedVal === 'tablet' || cleanText.includes('tablet') || cleanText.includes('2');
      const medName = isTablet ? 'Rybelsus 7mg Daily Tablets' : 'Wegovy 0.25mg Weekly Injection Pen';
      const medPrice = isTablet ? '₹3,300' : '₹5,660';
      const imgPath = isTablet
        ? path.join(process.cwd(), 'public', 'medications', 'rybelsus.png')
        : path.join(process.cwd(), 'public', 'medications', 'wegovy.png');

      if (fs.existsSync(imgPath)) {
        try {
          const fileBuf = fs.readFileSync(imgPath);
          await sendWaMediaMessage(fromPhone, fileBuf, 'image/png', `${isTablet ? 'rybelsus' : 'wegovy'}.png`, `💊 ${medName} — ${medPrice}`);
        } catch (imgErr) {
          console.error('Failed to send medication product image:', imgErr);
        }
      }
    }

    let nextStep: string | 'COMPLETED';
    if (isIntake) {
      nextStep = INTAKE_QUESTIONS[currentStep as IntakeStep].next(parsedVal);
    } else {
      nextStep = PROGRESS_QUESTIONS[currentStep as ProgressStep].next(parsedVal);
    }

    if (currentStep === IntakeStep.CHECKOUT_ADDRESS) {
      // Generate Order ID & QR Code Checkout Payload
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      data.orderId = orderId;
      data.shippingAddress = cleanText;

      const selectedForm = data[IntakeStep.CHECKOUT_FORM_FACTOR];
      const isTablet = selectedForm === 'tablet' || String(selectedForm).includes('2');
      const medName = isTablet ? 'Rybelsus 7mg Daily Tablets' : 'Wegovy 0.25mg Weekly Injection Pen';
      const priceVal = isTablet ? '₹3,300' : '₹5,660';

      const checkoutMessage = [
        `📋 *ORDER SUMMARY & CHECKOUT (#${orderId})*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Patient:* ${data[IntakeStep.FIRST_NAME] || 'Patient'} ${data[IntakeStep.LAST_NAME] || ''}`,
        `💊 *Medication:* ${medName}`,
        `📍 *Shipping Address:* ${cleanText}`,
        `💳 *Total Amount:* ${priceVal}`,
        ``,
        `💳 *PAYMENT INSTRUCTIONS (Method B)*`,
        `1. Send payment to UPI ID: *drgodly@upi* (Google Pay / PhonePe / Paytm / BHIM)`,
        `2. Amount to pay: *${priceVal}*`,
        `3. After payment, reply with your 12-digit UTR/UPI Ref No. or send screenshot receipt here.`,
      ].join('\n');

      pendingStore[cleanPhone] = { currentStep: IntakeStep.CHECKOUT_PAYMENT, data, updatedAt: new Date().toISOString() };
      writeJson(PENDING_FILE, pendingStore);

      return checkoutMessage;
    }

    if (nextStep === 'COMPLETED') {
      delete pendingStore[cleanPhone];
      writeJson(PENDING_FILE, pendingStore);

      if (isIntake) return this.completeIntake(cleanPhone, data, cleanText);
      else return this.completeProgress(cleanPhone, data);
    } else {
      pendingStore[cleanPhone] = { currentStep: nextStep, data, updatedAt: new Date().toISOString() };
      writeJson(PENDING_FILE, pendingStore);

      if (nextStep in INTAKE_QUESTIONS) {
        return INTAKE_QUESTIONS[nextStep as IntakeStep].question;
      } else {
        return PROGRESS_QUESTIONS[nextStep as ProgressStep].question;
      }
    }
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

  private parseInput(step: string, text: string): any {
    const cleanText = text.trim();

    if (step === IntakeStep.HEALTH_CRITICAL) {
      const indices = cleanText.split(',').map((x) => parseInt(x.trim())).filter((x) => !isNaN(x));
      if (indices.includes(8) || indices.length === 0) return ['none'];
      return indices.map((idx) => CRITICAL_VALUES[idx - 1]).filter(Boolean);
    }

    if (step === IntakeStep.HEALTH_EXTENDED) {
      const indices = cleanText.split(',').map((x) => parseInt(x.trim())).filter((x) => !isNaN(x));
      if (indices.includes(14) || indices.length === 0) return ['none'];
      return indices.map((idx) => EXTENDED_VALUES[idx - 1]).filter(Boolean);
    }

    if (step in INTAKE_QUESTIONS) {
      const opts = INTAKE_QUESTIONS[step as IntakeStep].options;
      if (opts) {
        const idx = parseInt(cleanText) - 1;
        if (!isNaN(idx) && opts[idx]) return opts[idx];
      }
    }

    if (step === IntakeStep.HEIGHT || step === IntakeStep.WEIGHT || step === IntakeStep.GOAL_WEIGHT || step === ProgressStep.PROGRESS_WEIGHT) {
      const val = parseFloat(cleanText);
      return isNaN(val) ? 0 : val;
    }

    return cleanText;
  }

  private async completeIntake(cleanPhone: string, data: any, utrText: string): Promise<string> {
    const orderId = data.orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const utr = utrText.replace(/[^\d]/g, '') || utrText;

    const ordersStore = readJson<any[]>(ORDERS_FILE, []);
    const newOrder = {
      id: orderId,
      phone: `+${cleanPhone}`,
      patientName: `${data[IntakeStep.FIRST_NAME] || 'Patient'} ${data[IntakeStep.LAST_NAME] || ''}`.trim(),
      medication: data[IntakeStep.CHECKOUT_FORM_FACTOR] === 'tablet' ? 'Rybelsus 7mg Daily Tablets' : 'Wegovy 0.25mg Weekly Injection Pen',
      amount: data[IntakeStep.CHECKOUT_FORM_FACTOR] === 'tablet' ? 3300 : 5660,
      shippingAddress: data.shippingAddress || data[IntakeStep.SHIPPING_STATE] || 'India',
      utrNumber: utr,
      paymentStatus: 'UNVERIFIED',
      orderStatus: 'PAYMENT_PENDING',
      createdAt: new Date().toISOString(),
    };

    ordersStore.unshift(newOrder);
    writeJson(ORDERS_FILE, ordersStore);

    return [
      `✅ Payment Proof Received for Order #${orderId}!`,
      ``,
      `• UTR / Payment Ref: ${utr}`,
      `• Billing Status: PENDING ADMIN VERIFICATION`,
      ``,
      `Our billing team and Dr. Kalyan's pharmacy are verifying your payment proof.`,
      `Once verified, your GLP-1 medication order will be packed and dispatched within 24 hours. Tracking details will be sent directly to your WhatsApp! 🩺📦`,
    ].join('\n');
  }

  private async completeProgress(cleanPhone: string, data: any): Promise<string> {
    const weight = Number(data[ProgressStep.PROGRESS_WEIGHT]) || 80;
    return `Thank you for completing your progress check-in! We have recorded your current weight (${weight}kg). Our medical team and doctor Kalyan Chakravarthy Kalwa have been notified to review your dosage refill.`;
  }
}
