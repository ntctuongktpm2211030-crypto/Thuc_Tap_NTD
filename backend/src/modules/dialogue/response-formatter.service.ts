import {
  ResponsePlan, TravelAssistantResponse, PlaceInfo, FoodInfo, EventInfo,
  TravelSubIntent,
} from './types/dialogue.types';

/**
 * ResponseFormatterService assembles the final TravelAssistantResponse.
 *
 * Responsibilities:
 * - Convert ResponsePlan + LLM answer → TravelAssistantResponse
 * - Build structured PlaceInfo/FoodInfo/EventInfo arrays
 * - Attach citations, suggestions, metadata
 * - The frontend receives a UI-friendly response with NO business logic required
 */
export class ResponseFormatterService {
  /**
   * Build a complete TravelAssistantResponse from a plan and LLM answer.
   */
  format(params: {
    answer: string;
    plan: ResponsePlan;
    state: { intent: TravelSubIntent | null; destination: string | null } | null;
    suggestions: string[];
    agentUsed: string;
    latencyMs: number;
    hasRagData: boolean;
  }): TravelAssistantResponse {
    const { answer, plan, state, suggestions, agentUsed, latencyMs, hasRagData } = params;

    // Carry citations from plan into response
    const citations = plan.citations;

    return {
      answer,
      answerType: plan.answerType,
      places: plan.places,
      foods: plan.foods,
      events: plan.events,
      citations,
      suggestions,
      followUpQuestion: null,
      metadata: {
        intent: state?.intent ?? null,
        destination: state?.destination ?? null,
        hasRagData,
        agentUsed,
        latencyMs,
        planGenerated: true,
      },
    };
  }

  /**
   * Build a fallback response when no plan is available.
   */
  formatFallback(params: {
    answer: string;
    state: { intent: TravelSubIntent | null; destination: string | null } | null;
    suggestions: string[];
    agentUsed: string;
    latencyMs: number;
    hasRagData: boolean;
  }): TravelAssistantResponse {
    const { answer, state, suggestions, agentUsed, latencyMs, hasRagData } = params;

    return {
      answer,
      answerType: 'general',
      places: [],
      foods: [],
      events: [],
      citations: [],
      suggestions,
      followUpQuestion: null,
      metadata: {
        intent: state?.intent ?? null,
        destination: state?.destination ?? null,
        hasRagData,
        agentUsed,
        latencyMs,
        planGenerated: false,
      },
    };
  }

  /**
   * Build a follow-up question response (no answer, just asking).
   */
  formatFollowUp(params: {
    question: string;
    state: { intent: TravelSubIntent | null; destination: string | null } | null;
    suggestions: string[];
    latencyMs: number;
  }): TravelAssistantResponse {
    const { question, state, suggestions, latencyMs } = params;

    return {
      answer: question,
      answerType: 'general',
      places: [],
      foods: [],
      events: [],
      citations: [],
      suggestions,
      followUpQuestion: question,
      metadata: {
        intent: state?.intent ?? null,
        destination: state?.destination ?? null,
        hasRagData: false,
        agentUsed: 'System-Clarification',
        latencyMs,
        planGenerated: false,
      },
    };
  }
}
