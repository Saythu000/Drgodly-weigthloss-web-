import { IntakeStep, IntakeData } from "./intake-state";

interface IntakeSessionRecord {
  id: string;
  sessionId: string;
  currentStep: IntakeStep;
  data: Partial<IntakeData>;
  updatedAt: number;
}

// Global in-memory storage for pending intakes
const globalForIntake = globalThis as unknown as {
  intakeStore: Map<string, IntakeSessionRecord>;
};

if (!globalForIntake.intakeStore) {
  globalForIntake.intakeStore = new Map();
}

const intakeStore = globalForIntake.intakeStore;

export async function getPendingIntake(sessionId: string) {
  if (!sessionId) return null;
  return intakeStore.get(sessionId) || null;
}

export async function updatePendingIntake(
  sessionId: string,
  step: IntakeStep,
  answer: unknown,
  _userId?: string
) {
  const existing = intakeStore.get(sessionId) || {
    id: sessionId,
    sessionId,
    currentStep: IntakeStep.HEIGHT,
    data: {},
    updatedAt: Date.now(),
  };

  const updatedData = {
    ...existing.data,
    [step]: answer,
  };

  const record: IntakeSessionRecord = {
    ...existing,
    currentStep: step,
    data: updatedData,
    updatedAt: Date.now(),
  };

  intakeStore.set(sessionId, record);
  return record;
}

export async function setPendingIntakeStep(sessionId: string, nextStep: IntakeStep) {
  const existing = intakeStore.get(sessionId);
  if (existing) {
    existing.currentStep = nextStep;
    existing.updatedAt = Date.now();
    intakeStore.set(sessionId, existing);
  }
}

export async function deletePendingIntake(sessionId: string) {
  if (sessionId) {
    intakeStore.delete(sessionId);
  }
}
