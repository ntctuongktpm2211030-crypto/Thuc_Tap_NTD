import { ConversationState } from './types/dialogue.types';

/**
 * ConversationStateService manages per-conversation state.
 *
 * Responsibilities (only):
 * - Initialize, get, update, and clear conversation state
 * - Store structured data about the current conversation
 *
 * State fields:
 * - province, destination, travelIntent, companion, budget, travelDays, season
 *
 * Slot extraction is handled by SlotFillingService.
 * Intent detection is handled by TravelIntentService.
 * Suggestion generation is handled by SuggestionBuilderService.
 *
 * This service does NOT perform retrieval, LLM calls, or slot extraction.
 * It is a pure CRUD state store.
 */
export class ConversationStateService {
  /**
   * In-memory state store (per conversation).
   * For production, this should use Redis or a database table.
   */
  private states: Map<string, ConversationState> = new Map();

  /**
   * Get the current state for a conversation.
   */
  getState(conversationId: string): ConversationState | null {
    return this.states.get(conversationId) ?? null;
  }

  /**
   * Initialize or reset state for a conversation.
   */
  initState(conversationId: string): ConversationState {
    const state: ConversationState = {
      province: null,
      destination: null,
      intent: null,
      days: null,
      budget: null,
      companion: null,
      season: null,
      conversationId,
      updatedAt: Date.now(),
    };
    this.states.set(conversationId, state);
    return state;
  }

  /**
   * Update state with partial updates (merged into existing state).
   * Creates a new state if one doesn't exist.
   */
  updateState(conversationId: string, updates: Partial<ConversationState>): ConversationState {
    let state = this.states.get(conversationId);
    if (!state) {
      state = this.initState(conversationId);
    }

    // Apply partial updates (only non-null/defined values)
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'conversationId' && key !== 'updatedAt') {
        (state as any)[key] = value;
      }
    }

    state.updatedAt = Date.now();
    this.states.set(conversationId, state);
    return state;
  }

  /**
   * Directly set a specific slot value.
   */
  setSlot(conversationId: string, key: keyof ConversationState, value: any): ConversationState {
    return this.updateState(conversationId, { [key]: value });
  }

  /**
   * Clear state for a conversation (e.g., when starting a new topic).
   */
  clearState(conversationId: string): void {
    this.states.delete(conversationId);
  }
}
