import { getKnowledgeBaseAsync, KnowledgeItem } from './knowledge-store';
import { getDynamicSystemPrompt } from './agent-config';

export interface RetrievedChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  relevanceScore: number;
}

// Common English filler words to exclude from keyword retrieval scoring
const STOP_WORDS = new Set([
  'want', 'can', 'help', 'please', 'tell', 'about', 'with', 'what', 'where', 'when',
  'how', 'who', 'the', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
  'must', 'could', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
  'of', 'at', 'by', 'for', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'don', 'now', 'you', 'your', 'need', 'like', 'get', 'give', 'take', 'make'
]);

/**
 * Hybrid Search Algorithm:
 * Combines stop-word filtered term-frequency BM25 keyword matching with category alignment.
 */
function scoreSnippet(query: string, snippet: KnowledgeItem, targetCategory?: string): number {
  const allTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const meaningfulTokens = allTokens.filter((t) => !STOP_WORDS.has(t));

  // If query consists only of filler/stop words, return 0 match score
  if (meaningfulTokens.length === 0) return 0;

  const titleLower = snippet.title.toLowerCase();
  const contentLower = snippet.content.toLowerCase();
  const fullSnippetText = `${titleLower} ${contentLower}`;
  const cTokens = new Set(fullSnippetText.split(/\W+/).filter((t) => t.length > 2));

  let exactMatches = 0;
  let termFrequencyBonus = 0;

  for (const token of meaningfulTokens) {
    if (cTokens.has(token)) {
      exactMatches += 1;
      const occurrences = (fullSnippetText.match(new RegExp(`\\b${token}\\b`, 'g')) || []).length;
      termFrequencyBonus += Math.min(occurrences, 3) * 0.1;
    }
  }

  if (exactMatches === 0) return 0;

  const keywordOverlapRatio = exactMatches / meaningfulTokens.length;
  const totalScore = keywordOverlapRatio * 0.7 + termFrequencyBonus * 0.3;

  // Category & Domain mismatch penalty
  if (targetCategory === 'CUSTOMER_WEIGHT_LOSS') {
    const isTravelDoc = titleLower.includes('pondicherry') || titleLower.includes('trip') || titleLower.includes('tour') || snippet.category.toLowerCase().includes('travel');
    if (isTravelDoc) {
      return 0;
    }
  }

  return Math.min(Math.round(totalScore * 100) / 100, 1.0);
}

export async function searchKnowledgeBase(query: string, topK: number = 3, targetCategory?: string): Promise<RetrievedChunk[]> {
  const allItems = await getKnowledgeBaseAsync();
  const activeItems = allItems.filter((item) => item.isActive);

  const scored = activeItems
    .map((item) => {
      const score = scoreSnippet(query, item, targetCategory);
      return {
        id: item.id,
        title: item.title,
        category: item.category,
        content: item.content,
        relevanceScore: score,
      };
    })
    .filter((chunk) => chunk.relevanceScore >= 0.35)
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
