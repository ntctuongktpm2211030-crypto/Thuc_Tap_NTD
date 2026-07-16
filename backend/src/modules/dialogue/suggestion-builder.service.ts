import { ConversationState, TravelSubIntent, DEFAULT_SUGGESTIONS } from './types/dialogue.types';

/**
 * SuggestionBuilderService generates contextual follow-up suggestions.
 *
 * Responsibilities:
 * - Generate suggestions based on conversation state and intent
 * - Return context-aware suggestions (e.g., food intent → food suggestions)
 * - Programmatic logic only — no LLM or hardcoded prompt strings
 *
 * Examples:
 * - Food intent → local specialties, recommended restaurants, coffee shops
 * - Destination set → 2-day itinerary, hotels, homestays, nearby attractions
 * - No destination → where to go, local food, itineraries
 */
export class SuggestionBuilderService {
  /**
   * Generate context-aware follow-up suggestions.
   *
   * @param state - Current conversation state (may be null for new conversations)
   * @param intent - Optional override intent (if not set in state)
   * @returns Array of suggestion strings (max 5)
   */
  build(state: ConversationState | null, intent?: TravelSubIntent | null): string[] {
    const suggestions: string[] = [];
    const activeIntent = intent ?? state?.intent ?? null;

    if (state?.destination) {
      // Destination-specific suggestions
      suggestions.push(
        `Lịch trình ${state.days ? `${state.days} ngày` : 'chi tiết'}`
      );
      suggestions.push('Đặc sản');
      suggestions.push('Homestay & khách sạn');
      suggestions.push('Bản đồ & đường đi');

      // Add intent-specific suggestions
      const intentSuggestions = this.getIntentSuggestions(activeIntent);
      for (const s of intentSuggestions) {
        if (!suggestions.includes(s)) {
          suggestions.push(s);
        }
      }
    } else {
      // General suggestions when no destination is set
      suggestions.push('Đi đâu chơi');
      suggestions.push('Có gì ngon');
      suggestions.push('Lịch trình tham khảo');
      suggestions.push('Kinh nghiệm du lịch');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Build food-related suggestions.
   */
  buildFoodSuggestions(): string[] {
    return [...(DEFAULT_SUGGESTIONS.food || [])].slice(0, 4);
  }

  /**
   * Build destination-related suggestions.
   */
  buildDestinationSuggestions(): string[] {
    return [
      '2 ngày 1 đêm',
      '3 ngày 2 đêm',
      'Homestay',
      'Khách sạn',
      'Bản đồ',
      'Địa điểm gần đây',
    ];
  }

  /**
   * Build weather-related suggestions.
   */
  buildWeatherSuggestions(): string[] {
    return [...(DEFAULT_SUGGESTIONS.weather || [])].slice(0, 3);
  }

  /**
   * Build transport-related suggestions.
   */
  buildTransportSuggestions(): string[] {
    return [...(DEFAULT_SUGGESTIONS.transport || [])].slice(0, 4);
  }

  /**
   * Get intent-specific suggestions.
   */
  private getIntentSuggestions(intent: TravelSubIntent | null): string[] {
    switch (intent) {
      case 'food':
        return ['Quán ăn ngon', 'Chợ ẩm thực', 'Đặc sản nên thử'];
      case 'trekking':
      case 'adventure':
        return ['Điểm trekking', 'Homestay bản làng', 'Cung đường đẹp'];
      case 'relax':
        return ['Resort', 'Spa & thư giãn', 'Bãi biển'];
      case 'history':
        return ['Di tích lịch sử', 'Bảo tàng', 'Địa danh cổ'];
      case 'culture':
        return ['Làng nghề', 'Lễ hội', 'Phong tục địa phương'];
      case 'spiritual':
        return ['Chùa & đền', 'Điểm hành hương', 'Chùa nổi tiếng'];
      case 'festival':
        return ['Lễ hội sắp tới', 'Sự kiện đặc sắc', 'Mùa lễ hội'];
      case 'check-in':
        return ['Điểm check-in đẹp', 'Sống ảo', 'Viewpoint'];
      case 'family':
      case 'couple':
        return ['Hoạt động phù hợp', 'Khách sạn', 'Điểm lãng mạn'];
      default:
        return [];
    }
  }
}
