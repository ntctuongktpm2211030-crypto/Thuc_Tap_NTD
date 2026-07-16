import { ChatbotState, ChatbotIntent } from '../interfaces/intelligence.interfaces';

export class ConversationStateMachine {
  /**
   * Determine the next conversational state based on current state and detected intent
   */
  transition(currentState: ChatbotState, intent: ChatbotIntent): ChatbotState {
    switch (currentState) {
      case 'DISCOVERY':
        if (intent === 'RECOMMENDATION' || intent === 'RECOMMENDATION_MORE') {
          return 'RECOMMENDATION';
        }
        if (intent === 'ITINERARY_PLAN') {
          return 'ITINERARY';
        }
        return 'DISCOVERY';

      case 'RECOMMENDATION':
        if (intent === 'RECOMMENDATION_REPLACE' || intent === 'RECOMMENDATION_MORE') {
          return 'RECOMMENDATION';
        }
        if (intent === 'RECOMMENDATION_REFINE') {
          return 'REFINEMENT';
        }
        if (intent === 'ITINERARY_PLAN') {
          return 'ITINERARY';
        }
        return 'RECOMMENDATION';

      case 'REFINEMENT':
        if (intent === 'RECOMMENDATION_MORE') {
          return 'RECOMMENDATION';
        }
        if (intent === 'ITINERARY_PLAN') {
          return 'ITINERARY';
        }
        return 'REFINEMENT';

      case 'ITINERARY':
        if (intent === 'RECOMMENDATION_REFINE') {
          return 'REFINEMENT';
        }
        if (intent === 'RECOMMENDATION') {
          return 'RECOMMENDATION';
        }
        return 'ITINERARY';

      default:
        // Fallback for BOOKING/POST_BOOKING transitions
        if (intent === 'RECOMMENDATION') return 'RECOMMENDATION';
        if (intent === 'ITINERARY_PLAN') return 'ITINERARY';
        return currentState;
    }
  }
}
