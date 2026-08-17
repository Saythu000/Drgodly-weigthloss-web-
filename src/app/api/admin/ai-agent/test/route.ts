import { NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/intent-classifier';
import { searchKnowledgeBase, buildRagSystemPrompt } from '@/lib/rag-retriever';
import { runReActAgentLoop } from '@/lib/agent-tools';
import { validateAndEnforceGuardrails } from '@/lib/agent-guardrails';
import { getActiveDomainProfile } from '@/lib/domain-analyzer';

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { message } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const cleanMessage = message.trim();
    const activeDomain = getActiveDomainProfile();
    const intentResult = await classifyIntent(cleanMessage);
    const matchedChunks = await searchKnowledgeBase(cleanMessage, 3, intentResult.category);
    const reactResult = await runReActAgentLoop(cleanMessage);

    // Pass through Guardrails & Dynamic Prompt Validation Loop
    const guardrailResult = validateAndEnforceGuardrails(reactResult.answer, intentResult.confidence, matchedChunks);

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      result: {
        activeDomainProfile: activeDomain,
        category: intentResult.category,
        confidence: intentResult.confidence,
        reasoning: intentResult.reasoning,
        toolExecuted: reactResult.toolExecuted || 'none',
        aiGeneratedAnswer: guardrailResult.finalResponse,
        isEscalated: guardrailResult.isEscalated,
        disclaimerAdded: guardrailResult.disclaimerAdded,
        validated: guardrailResult.validated,
        matchedKnowledgeSources: matchedChunks.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          score: s.relevanceScore,
          snippet: s.content,
        })),
        latencyMs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
