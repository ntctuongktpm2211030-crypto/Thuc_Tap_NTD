export type ChatbotEmotion =
  | 'bored'
  | 'frustrated'
  | 'disappointed'
  | 'confused'
  | 'impatient'
  | 'excited'
  | 'urgent'
  | 'friendly'
  | 'neutral';

export type ChatbotState =
  | 'DISCOVERY'
  | 'RECOMMENDATION'
  | 'REFINEMENT'
  | 'ITINERARY'
  | 'BOOKING'
  | 'POST_BOOKING';

export type ChatbotIntent =
  | 'RECOMMENDATION'
  | 'RECOMMENDATION_MORE'
  | 'RECOMMENDATION_REPLACE'
  | 'RECOMMENDATION_REFINE'
  | 'ITINERARY_PLAN'
  | 'GENERAL_QA'
  | 'UNKNOWN';

export interface EmotionAnalysis {
  emotion: ChatbotEmotion;
  confidence: number;
  intensity: number;
  reason: string;
}

export interface ContextMemory {
  lastIntent?: ChatbotIntent;
  lastProvince?: string;
  lastAttractionsSuggested: string[];
  lastAttractionsRejected: string[];
  currentDurationDays?: number;
}

export interface IntentResult {
  intent: ChatbotIntent;
  confidence: number;
  alternativeIntent: ChatbotIntent;
  reason: string;
  needSlot: boolean;
  answerImmediately: boolean;
  continuePreviousConversation: boolean;
}

export interface CIMResult {
  query: string;
  emotion: EmotionAnalysis;
  intent: IntentResult;
  nextState: ChatbotState;
  responsePolicy: {
    toneModifier: string;
    actionType: 'RECOMMEND' | 'PLAN_ITINERARY' | 'ANSWER_GENERAL' | 'REFUSE';
    clarificationPrompt?: string;
  };
}
