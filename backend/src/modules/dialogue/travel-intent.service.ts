import { TravelSubIntent, SUB_INTENT_KEYWORDS } from './types/dialogue.types';
import { removeDiacritics } from '../ai-agents/utils/agent.utils';
import { logger } from '../../utils/logger';

/**
 * TravelIntentService detects travel-specific sub-intents from user input.
 *
 * Responsibilities:
 * - Detect travel sub-intent from user messages
 * - Provide intent metadata for reranking and response generation
 * - Support all travel intents (sightseeing, food, trekking, etc.)
 *
 * This is a rule-based service that uses keyword matching with
 * Vietnamese diacritics normalization. No LLM calls are used here.
 */
export class TravelIntentService {
  /**
   * Detect the most likely travel sub-intent from user input.
   *
   * @param input - Raw user input text
   * @param requestId - Optional request ID for logging
   * @returns The detected TravelSubIntent, or 'general' if unclear
   */
  detect(input: string, requestId?: string): TravelSubIntent {
    const cleanInput = input.toLowerCase();
    const normalized = removeDiacritics(cleanInput);

    const scores: Map<TravelSubIntent, number> = new Map();

    for (const [intent, keywords] of Object.entries(SUB_INTENT_KEYWORDS)) {
      let count = 0;
      for (const kw of keywords) {
        const cleanKw = removeDiacritics(kw);
        if (cleanInput.includes(kw.toLowerCase()) || normalized.includes(cleanKw)) {
          count++;
        }
      }
      if (count > 0) {
        scores.set(intent as TravelSubIntent, count);
      }
    }

    // Return the intent with highest keyword match count
    let bestIntent: TravelSubIntent = 'general';
    let bestScore = 0;

    for (const [intent, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    if (bestIntent !== 'general') {
      logger.debug('TravelIntentService', 'Intent detected', { intent: bestIntent, score: bestScore }, requestId);
    }

    return bestIntent;
  }

  /**
   * Check if the input contains a specific intent.
   */
  hasIntent(input: string, intent: TravelSubIntent): boolean {
    return this.detect(input) === intent;
  }

  /**
   * Get all detected intents with their scores.
   */
  detectAll(input: string): Map<TravelSubIntent, number> {
    const cleanInput = input.toLowerCase();
    const normalized = removeDiacritics(cleanInput);
    const scores: Map<TravelSubIntent, number> = new Map();

    for (const [intent, keywords] of Object.entries(SUB_INTENT_KEYWORDS)) {
      let count = 0;
      for (const kw of keywords) {
        const cleanKw = removeDiacritics(kw);
        if (cleanInput.includes(kw.toLowerCase()) || normalized.includes(cleanKw)) {
          count++;
        }
      }
      if (count > 0) {
        scores.set(intent as TravelSubIntent, count);
      }
    }

    return scores;
  }
}
