import { getAgentConfig } from './agent-config';
import { searchKnowledgeBase } from './rag-retriever';
import { prisma } from './prisma';

export interface ToolCallDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export const AGENT_TOOLS: ToolCallDefinition[] = [
  {
    name: 'search_knowledge_base',
    description: 'Searches DrGodly Telehealth knowledge base for clinic policies, GLP-1 rules, and consultation fees.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Patient search query or topic' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_appointment_slots',
    description: 'Queries available consultation slots with Dr. Kalyan.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Optional preferred date (YYYY-MM-DD)' },
      },
    },
  },
  {
    name: 'generate_razorpay_link',
    description: 'Generates Razorpay payment link for GLP-1 doctor consultation fee.',
    parameters: {
      type: 'object',
      properties: {
        leadId: { type: 'string', description: 'Patient lead ID' },
        amount: { type: 'number', description: 'Consultation fee amount in INR' },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'start_patient_intake',
    description: 'Triggers the 20-step medical weight loss intake questionnaire.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Patient WhatsApp phone number' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'start_doctor_onboarding',
    description: 'Triggers the 3-step recruitment flow for doctors/medical staff.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Doctor phone number' },
      },
      required: ['phone'],
    },
  },
  {
    name: 'start_partnership_flow',
    description: 'Triggers the 2-step B2B partnership proposal flow.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Partner phone number' },
      },
      required: ['phone'],
    },
  },
];

/**
 * Executes a tool call if authorized by Admin Governance in agent-config.ts
 */
export async function executeToolCall(name: string, args: any): Promise<any> {
  const config = getAgentConfig();

  // Check Tool Governance Allowlist
  if ((config.tools as any)[name] === false) {
    return { success: false, error: `Tool '${name}' is currently disabled by Admin Governance.` };
  }

  try {
    switch (name) {
      case 'search_knowledge_base': {
        const results = await searchKnowledgeBase(args.query || '', 3);
        return { success: true, count: results.length, chunks: results };
      }

      case 'check_appointment_slots': {
        return {
          success: true,
          doctor: 'Dr. Kalyan',
          availableSlots: ['Tomorrow 10:00 AM IST', 'Tomorrow 03:00 PM IST', 'Day After Tomorrow 11:30 AM IST'],
        };
      }

      case 'generate_razorpay_link': {
        const link = config.razorpayLink || 'https://rzp.io/l/drgodly-consult';
        return {
          success: true,
          paymentUrl: link,
          amount: args.amount || 499,
          note: 'Please complete payment to confirm your doctor consultation.',
        };
      }

      case 'start_patient_intake': {
        return { success: true, action: 'START_INTAKE', phone: args.phone, category: 'CUSTOMER_WEIGHT_LOSS' };
      }

      case 'start_doctor_onboarding': {
        return { success: true, action: 'START_RECRUITMENT', phone: args.phone, category: 'RECRUITMENT' };
      }

      case 'start_partnership_flow': {
        return { success: true, action: 'START_PARTNERSHIP', phone: args.phone, category: 'PARTNERSHIP' };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * ReAct Agent Execution Loop:
 * Executes Reasoning -> Tool Choice -> Tool Execution -> Final Synthesis.
 */
export async function runReActAgentLoop(userMessage: string): Promise<{ answer: string; toolExecuted?: string; resultData?: any }> {
  // Step 1: Perform RAG Search first
  const ragChunks = await searchKnowledgeBase(userMessage, 2);

  // If query specifically asks for booking or payment, execute tool directly
  const lower = userMessage.toLowerCase();
  if (lower.includes('book') || lower.includes('appointment') || lower.includes('slot')) {
    const slotRes = await executeToolCall('check_appointment_slots', {});
    return {
      answer: `Dr. Kalyan is available for online GLP-1 telehealth consultations! Available slots:\n• ${slotRes.availableSlots.join('\n• ')}\n\nWould you like me to reserve a slot for you?`,
      toolExecuted: 'check_appointment_slots',
      resultData: slotRes,
    };
  }

  if (lower.includes('pay') || lower.includes('fee') || lower.includes('link')) {
    const payRes = await executeToolCall('generate_razorpay_link', { leadId: 'lead-direct' });
    return {
      answer: `You can pay your Dr. Kalyan consultation fee (₹${payRes.amount}) securely via Razorpay here: ${payRes.paymentUrl}`,
      toolExecuted: 'generate_razorpay_link',
      resultData: payRes,
    };
  }

  if (ragChunks.length > 0) {
    const contextStr = ragChunks.map((c) => c.content).join(' ');
    return {
      answer: `${contextStr}\n\nIf you would like to book a GLP-1 telehealth assessment with Dr. Kalyan, reply '1' or 'Weight Loss'!`,
      toolExecuted: 'search_knowledge_base',
      resultData: ragChunks,
    };
  }

  return {
    answer: "Thank you for reaching out to DrGodly Telehealth! How can I assist you with our GLP-1 weight loss consultations today?",
  };
}
