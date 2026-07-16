import { RetrievedDoc } from '../rag/types/rag.types';
import { TravelSubIntent, INTENT_KEYWORDS } from './types/dialogue.types';
import { removeDiacritics } from '../ai-agents/utils/agent.utils';
import { logger } from '../../utils/logger';

export interface TravelRerankResult {
  docs: RetrievedDoc[];
  metadata: {
    originalCount: number;
    finalCount: number;
    boostApplied: number;
    demoteApplied: number;
    intent: TravelSubIntent | null;
  };
}

/**
 * TravelRerankerService provides an optional ranking layer on top of the
 * existing RAG reranker.
 *
 * Instead of replacing the existing reranker, this service applies additional
 * scoring adjustments based on travel sub-intent:
 * - Boost: +0.15 to docs containing intent-relevant keywords
 * - Demote: -0.10 to docs containing intent-irrelevant keywords
 *
 * This is a lightweight, code-based approach that doesn't require LLM calls.
 * Applied AFTER the standard reranking pipeline.
 *
 * Example:
 *   Intent = "check-in"
 *   Boost: lakes, mountains, viewpoints, tea hills, scenic roads
 *   Demote: museums, government buildings, administrative offices
 */
export class TravelRerankerService {
  rerank(
    docs: RetrievedDoc[],
    intent: TravelSubIntent | null | undefined,
    requestId?: string
  ): TravelRerankResult {
    if (!docs || docs.length === 0) {
      return {
        docs: [],
        metadata: { originalCount: 0, finalCount: 0, boostApplied: 0, demoteApplied: 0, intent },
      };
    }

    if (!intent || intent === 'general') {
      logger.debug('TravelReranker', 'No specific intent — skipping', { docs: docs.length }, requestId);
      return {
        docs,
        metadata: { originalCount: docs.length, finalCount: docs.length, boostApplied: 0, demoteApplied: 0, intent },
      };
    }

    const config = INTENT_KEYWORDS[intent];
    if (!config) {
      return {
        docs,
        metadata: { originalCount: docs.length, finalCount: docs.length, boostApplied: 0, demoteApplied: 0, intent },
      };
    }

    let boostCount = 0;
    let demoteCount = 0;

    const adjusted = docs.map(doc => {
      const cleanTitle = removeDiacritics((doc.title || '').toLowerCase());
      const cleanContent = removeDiacritics((doc.content || '').toLowerCase());
      const combined = cleanTitle + ' ' + cleanContent;

      let adjustment = 0;

      for (const kw of config.boost) {
        const cleanKw = removeDiacritics(kw.toLowerCase());
        if (combined.includes(cleanKw)) {
          adjustment += 0.15;
          boostCount++;
          break;
        }
      }

      for (const kw of config.demote) {
        const cleanKw = removeDiacritics(kw.toLowerCase());
        if (combined.includes(cleanKw)) {
          adjustment -= 0.10;
          demoteCount++;
          break;
        }
      }

      if (adjustment !== 0) {
        const baseScore = doc.similarity ?? doc.score ?? 0.5;
        const newScore = Math.max(0, Math.min(1, baseScore + adjustment));
        return { ...doc, score: newScore, similarity: newScore };
      }

      return doc;
    });

    adjusted.sort((a, b) => {
      const sa = a.similarity ?? a.score ?? 0;
      const sb = b.similarity ?? b.score ?? 0;
      return sb - sa;
    });

    logger.info('TravelReranker', 'Rerank complete', {
      intent, docsInput: docs.length, docsOutput: adjusted.length,
      boostApplied: boostCount, demoteApplied: demoteCount,
    }, requestId);

    return {
      docs: adjusted,
      metadata: {
        originalCount: docs.length, finalCount: adjusted.length,
        boostApplied: boostCount, demoteApplied: demoteCount, intent,
      },
    };
  }
}
