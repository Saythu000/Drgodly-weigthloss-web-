import fs from 'node:fs';
import path from 'node:path';
import { getActiveDomainProfile, DomainProfile } from './domain-analyzer';

export interface AgentConfig {
  systemPrompt: string;
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  strictSchemaMode: boolean;
  minConfidenceThreshold: number;
  autoHumanEscalation: boolean;
  medicalDisclaimer: string;
  tools: {
    search_knowledge_base: boolean;
    check_appointment_slots: boolean;
    generate_razorpay_link: boolean;
    start_patient_intake: boolean;
    start_doctor_onboarding: boolean;
    start_partnership_flow: boolean;
  };
  openaiKey?: string;
  geminiKey?: string;
  razorpayLink?: string;
}

const CONFIG_PATH = path.join(process.cwd(), '.openclaw-local', 'settings.json');

const DEFAULT_CONFIG: AgentConfig = {
  systemPrompt: `You are DrGodly Clinic's AI Virtual Assistant.
Answer incoming patient queries strictly using DrGodly Telehealth's Knowledge Base.
If you do not know the answer or the context does not provide it, inform the user politely and offer to connect them with a clinic representative.`,
  primaryModel: 'gpt-4o-mini',
  fallbackModel: 'gemini-1.5-flash',
  temperature: 0.1,
  strictSchemaMode: true,
  minConfidenceThreshold: 0.85,
  autoHumanEscalation: true,
  medicalDisclaimer: 'Disclaimer: I am an AI Virtual Assistant. Final prescriptions & weight loss plans are subject to Dr. Kalyan\'s medical evaluation.',
  tools: {
    search_knowledge_base: true,
    check_appointment_slots: true,
    generate_razorpay_link: true,
    start_patient_intake: true,
    start_doctor_onboarding: true,
    start_partnership_flow: true,
  },
};

export function getAgentConfig(): AgentConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const fileData = fs.readFileSync(CONFIG_PATH, 'utf8');
      const json = JSON.parse(fileData);
      return {
        ...DEFAULT_CONFIG,
        ...json,
        tools: {
          ...DEFAULT_CONFIG.tools,
          ...(json.tools || {}),
        },
      };
    }
  } catch (e) {
    console.error('Error reading agent config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveAgentConfig(updatedConfig: Partial<AgentConfig>): AgentConfig {
  const current = getAgentConfig();
  const merged: AgentConfig = {
    ...current,
    ...updatedConfig,
    tools: {
      ...current.tools,
      ...(updatedConfig.tools || {}),
    },
  };

  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving agent config:', e);
  }
  return merged;
}

export function getDynamicSystemPrompt(overrideDomainProfile?: DomainProfile): string {
  const config = getAgentConfig();
  const domain = overrideDomainProfile || getActiveDomainProfile();

  return `SYSTEM ROLE & PERSONA:
You are the official ${domain.personaRole} for ${domain.companyName}.
Active Operating Domain: ${domain.industryDomain}.

${config.systemPrompt}

OPERATIONAL BOUNDARIES & SAFETY GUIDELINES:
${domain.safetyGuidelines.map((rule) => `- ${rule}`).join('\n')}

INSTRUCTIONS:
1. Always maintain a professional, helpful, and empathetic tone aligned with ${domain.companyName}.
2. Use verified knowledge base context to answer user questions. If details are not available in context, state clearly that you do not have that specific information.`;
}
