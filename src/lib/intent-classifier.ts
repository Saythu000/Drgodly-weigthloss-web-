// ponytail: lean 5-category LLM triage engine for DrGodly Telehealth Clinic
import fs from 'node:fs';
import path from 'node:path';

export type IntentCategory =
  | 'CUSTOMER_WEIGHT_LOSS'
  | 'PARTNERSHIP'
  | 'RECRUITMENT'
  | 'GENERAL_CLINIC_QUERY'
  | 'PERSONAL_PRIVATE_CHAT';

export interface IntentResult {
  category: IntentCategory;
  confidence: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `
Classify incoming WhatsApp message into EXACTLY ONE category:
1. CUSTOMER_WEIGHT_LOSS: Weight loss, GLP-1 (Ozempic, Wegovy, Rybelsus, Mounjaro), BMI, doctor appointment for weight, diet consultation.
2. PARTNERSHIP: Business proposals, B2B, vendors, telehealth tie-ups, software/supplies.
3. RECRUITMENT: Job applications, resumes, hiring inquiries, medical staff.
4. GENERAL_CLINIC_QUERY: Telehealth center address, opening hours, general info.
5. PERSONAL_PRIVATE_CHAT: Casual chat, family/friends check-ins, personal greetings, dinner plans.

Respond strictly in JSON: {"category": "CATEGORY_NAME", "confidence": 0.95, "reasoning": "brief explanation"}
`;

function getKeys() {
  try {
    const file = path.join(process.cwd(), '.openclaw-local', 'settings.json');
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { openaiKey: data.openaiKey || process.env.OPENAI_API_KEY, geminiKey: data.geminiKey || process.env.GEMINI_API_KEY };
    }
  } catch (e) {}
  return { openaiKey: process.env.OPENAI_API_KEY, geminiKey: process.env.GEMINI_API_KEY };
}

export async function classifyIntent(text: string): Promise<IntentResult> {
  const clean = text.trim();
  if (!clean) return { category: 'PERSONAL_PRIVATE_CHAT', confidence: 1.0, reasoning: 'Empty message' };

  const { openaiKey, geminiKey } = getKeys();

  // ponytail: native fetch OpenAI classification
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: clean }],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}');
        if (parsed.category) return { category: parsed.category, confidence: parsed.confidence || 0.95, reasoning: parsed.reasoning || 'OpenAI' };
      }
    } catch (e) {}
  }

  // ponytail: native fetch Gemini classification fallback
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\nMessage: "${clean}"` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
        if (parsed.category) return { category: parsed.category, confidence: parsed.confidence || 0.95, reasoning: parsed.reasoning || 'Gemini' };
      }
    } catch (e) {}
  }

  // ponytail: direct keyword rule fallback (YAGNI offline safety)
  const lower = clean.toLowerCase();
  if (['weight', 'ozempic', 'wegovy', 'rybelsus', 'mounjaro', 'glp', 'bmi', 'consultation', 'doctor', 'intake', '1', 'one'].some((k) => lower.includes(k))) {
    return { category: 'CUSTOMER_WEIGHT_LOSS', confidence: 0.9, reasoning: 'Rule match weight loss' };
  }
  if (['partner', 'collaboration', 'vendor', 'b2b', 'proposal', '2', 'two'].some((k) => lower.includes(k))) {
    return { category: 'PARTNERSHIP', confidence: 0.9, reasoning: 'Rule match partnership' };
  }
  if (['job', 'career', 'recruit', 'vacancy', 'hiring', 'nurse', 'resume', 'cv', '3', 'three'].some((k) => lower.includes(k))) {
    return { category: 'RECRUITMENT', confidence: 0.9, reasoning: 'Rule match recruitment' };
  }
  if (['address', 'location', 'hours', 'timing', 'where'].some((k) => lower.includes(k))) {
    return { category: 'GENERAL_CLINIC_QUERY', confidence: 0.85, reasoning: 'Rule match general query' };
  }

  return { category: 'PERSONAL_PRIVATE_CHAT', confidence: 0.8, reasoning: 'Silent safeguard personal chat' };
}
