import { getAgentConfig } from './agent-config';
import { RetrievedChunk } from './rag-retriever';

export interface GuardrailValidationResult {
  finalResponse: string;
  isEscalated: boolean;
  disclaimerAdded: boolean;
  validated: boolean;
  reason?: string;
}

/**
 * Ponytail Guardrail Validation Loop:
 * Verifies confidence threshold, injects mandatory disclaimers, and triggers human escalation fallback.
 */
export function validateAndEnforceGuardrails(
  rawAnswer: string,
  confidence: number,
  retrievedChunks: RetrievedChunk[]
): GuardrailValidationResult {
  const config = getAgentConfig();
  let response = rawAnswer.trim();
  let isEscalated = false;
  let disclaimerAdded = false;

  // 🛡️ Guardrail 1: Low Confidence Check & Human Escalation Fallback
  if (confidence < config.minConfidenceThreshold && config.autoHumanEscalation) {
    isEscalated = true;
    const escalationNotice =
      "I want to make sure you get the most accurate assistance. Let me connect you directly with our clinic coordinator, who will assist you shortly. 🩺";
    return {
      finalResponse: escalationNotice,
      isEscalated: true,
      disclaimerAdded: false,
      validated: false,
      reason: `Confidence (${(confidence * 100).toFixed(0)}%) fell below minimum threshold (${(config.minConfidenceThreshold * 100).toFixed(0)}%).`,
    };
  }

  // 🛡️ Guardrail 2: Medical & Prescriptive Disclaimer Injection
  const lowerAnswer = response.toLowerCase();
  const involvesClinicalInfo =
    lowerAnswer.includes('ozempic') ||
    lowerAnswer.includes('wegovy') ||
    lowerAnswer.includes('rybelsus') ||
    lowerAnswer.includes('mounjaro') ||
    lowerAnswer.includes('glp') ||
    lowerAnswer.includes('weight loss') ||
    lowerAnswer.includes('dose') ||
    lowerAnswer.includes('consult');

  if (involvesClinicalInfo && config.medicalDisclaimer) {
    if (!response.includes(config.medicalDisclaimer)) {
      response += `\n\n📌 *${config.medicalDisclaimer}*`;
      disclaimerAdded = true;
    }
  }

  return {
    finalResponse: response,
    isEscalated: false,
    disclaimerAdded,
    validated: true,
  };
}
