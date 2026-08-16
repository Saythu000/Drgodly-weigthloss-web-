import { getKnowledgeBaseAsync, KnowledgeItem } from './knowledge-store';
import { getDynamicSystemPrompt } from './agent-config';

export interface RetrievedChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  relevanceScore: number;
}

/**
 * Hybrid Search Algorithm:
 * Combines term-frequency BM25 keyword matching with token Jaccard similarity.
 */
function scoreSnippet(query: string, snippet: KnowledgeItem): number {
  const qTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  if (qTokens.length === 0) return 0;

  const contentLower = (snippet.title + ' ' + snippet.content).toLowerCase();
  const cTokens = new Set(contentLower.split(/\W+/).filter((t) => t.length > 2));

  let exactMatches = 0;
  let termFrequencyBonus = 0;

  for (const token of qTokens) {
    if (cTokens.has(token)) {
      exactMatches += 1;
      const occurrences = (contentLower.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
      termFrequencyBonus += Math.min(occurrences, 3) * 0.1;
    }
  }

  const keywordOverlapRatio = exactMatches / qTokens.length;
  const totalScore = keywordOverlapRatio * 0.7 + termFrequencyBonus * 0.3;

  return Math.min(Math.round(totalScore * 100) / 100, 1.0);
}

export async function searchKnowledgeBase(query: string, topK: number = 3): Promise<RetrievedChunk[]> {
  const allItems = await getKnowledgeBaseAsync();
  const activeItems = allItems.filter((item) => item.isActive);

  const scored = activeItems
    .map((item) => {
      const score = scoreSnippet(query, item);
      return {
        id: item.id,
        title: item.title,
        category: item.category,
        content: item.content,
        relevanceScore: score,
      };
    })
    .filter((chunk) => chunk.relevanceScore > 0.15)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored.slice(0, topK);
}

export function buildRagSystemPrompt(chunks: RetrievedChunk[]): string {
  const baseDynamicPrompt = getDynamicSystemPrompt();

  if (chunks.length === 0) {
    return `${baseDynamicPrompt}

NO SPECIFIC KNOWLEDGE BASE CONTEXT FOUND FOR THIS QUERY.
Answer general inquiries politely, but do NOT guess specific pricing, policies, or medical plans not in context.`;
  }

  const contextText = chunks
    .map((c, i) => `[Source ${i + 1} - ${c.title} (${c.category})]:\n${c.content}`)
    .join('\n\n');

  return `${baseDynamicPrompt}

STRICT KNOWLEDGE BASE CONTEXT:
Use ONLY the verified knowledge context below to answer the user's question. Do not hallucinate or invent details not stated below.

--- BEGIN KNOWLEDGE CONTEXT ---
${contextText}
--- END KNOWLEDGE CONTEXT ---`;
}
