import { ChatbotIntent, EmotionAnalysis, ContextMemory, IntentResult } from '../interfaces/intelligence.interfaces';
import { matchSemanticPattern } from './semantic-patterns';

export interface OverrideRule {
  priority: number;
  evaluate(query: string, emotion: EmotionAnalysis, context: ContextMemory): IntentResult | null;
}

export class RuleOverrideEngine {
  private rules: OverrideRule[] = [];

  constructor() {
    this.registerRules();
  }

  private registerRules() {
    // ─── Priority 100: Semantic Patterns Override ──────────────────────────
    this.rules.push({
      priority: 100,
      evaluate: (query, _emotion, _context) => {
        const semanticIntent = matchSemanticPattern(query);
        if (semanticIntent) {
          return {
            intent: semanticIntent,
            confidence: 0.98,
            alternativeIntent: 'GENERAL_QA',
            reason: `Priority 100: Matched semantic language pattern -> "${semanticIntent}"`,
            needSlot: false,
            answerImmediately: true,
            continuePreviousConversation: true,
          };
        }
        return null;
      },
    });

    // ─── Priority 90: Emotion Bored/Frustrated + Last Recommendation ─────────
    this.rules.push({
      priority: 90,
      evaluate: (_query, emotion, context) => {
        if (
          (emotion.emotion === 'bored' || emotion.emotion === 'frustrated') &&
          context.lastIntent === 'RECOMMENDATION'
        ) {
          return {
            intent: 'RECOMMENDATION_REPLACE',
            confidence: 0.92,
            alternativeIntent: 'RECOMMENDATION_MORE',
            reason: 'Priority 90: User is bored/frustrated with previous recommendation, replace with alternative options.',
            needSlot: false,
            answerImmediately: true,
            continuePreviousConversation: true,
          };
        }
        return null;
      },
    });

    // ─── Priority 80: Short Continuation keywords when last intent was Recommendation ──
    this.rules.push({
      priority: 80,
      evaluate: (query, _emotion, context) => {
        const clean = query.trim().toLowerCase();
        const shortPhrases = ['tiep', 'them', 'nua', 'khac', 'nua di', 'tiep di'];
        if (
          shortPhrases.includes(clean) &&
          (context.lastIntent === 'RECOMMENDATION' || context.lastIntent === 'RECOMMENDATION_MORE')
        ) {
          return {
            intent: 'RECOMMENDATION_MORE',
            confidence: 0.95,
            alternativeIntent: 'GENERAL_QA',
            reason: 'Priority 80: Detected short continuation keywords following a recommendation context.',
            needSlot: false,
            answerImmediately: true,
            continuePreviousConversation: true,
          };
        }
        return null;
      },
    });
  }

  /**
   * Run the priority rule list to check for any override match
   */
  evaluate(query: string, emotion: EmotionAnalysis, context: ContextMemory): IntentResult | null {
    // Sort rules by priority descending
    const sorted = [...this.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
      const result = rule.evaluate(query, emotion, context);
      if (result) {
        return result;
      }
    }

    return null;
  }
}
