import { RetrievedDoc } from '../rag/types/rag.types';
import { ConversationState, TravelSubIntent, PlaceInfo, FoodInfo, EventInfo, ResponsePlan } from './types/dialogue.types';
import { Citation } from '../ai-agents/types/agent.types';
import { PromptComposerService } from './prompt-composer.service';
import { ResponseFormatterService } from './response-formatter.service';
import { removeDiacritics } from '../ai-agents/utils/agent.utils';
import { logger } from '../../utils/logger';

/**
 * ResponsePlanner builds a structured ResponsePlan before calling the LLM.
 *
 * The planner decides WHAT should be answered (places, foods, events, etc.).
 * The LLM decides HOW it should be written (natural language generation only).
 *
 * Business logic is handled in code using RAG document analysis and conversation state.
 * No business logic lives inside prompts.
 */
export class ResponsePlanner {
  private promptComposer: PromptComposerService;
  private responseFormatter: ResponseFormatterService;

  constructor() {
    this.promptComposer = new PromptComposerService();
    this.responseFormatter = new ResponseFormatterService();
  }

  /**
   * Build a structured response plan from RAG documents and conversation state.
   */
  plan(docs: RetrievedDoc[], state: ConversationState | null, requestId?: string): ResponsePlan {
    const start = Date.now();

    if (!docs || docs.length === 0) {
      return {
        answerType: 'general',
        title: 'Không tìm thấy thông tin',
        shortDescription: 'Hiện tại chưa có dữ liệu cụ thể cho yêu cầu của bạn.',
        highlights: [],
        places: [],
        foods: [],
        events: [],
        activities: [],
        suitableFor: [],
        visitDuration: 'Chưa xác định',
        bestSeason: 'Chưa xác định',
        distance: 'Chưa xác định',
        citations: [],
      };
    }

    const answerType = this.detectAnswerType(docs, state);
    const highlights = this.extractHighlights(docs);
    const activities = this.extractActivities(docs, state?.intent);
    const suitableFor = this.extractSuitableFor(state);
    const visitDuration = this.extractVisitDuration(docs);
    const bestSeason = this.extractBestSeason(docs, state);
    const distance = this.extractDistance(docs);
    const title = this.buildTitle(docs, state, answerType);
    const shortDescription = this.buildShortDescription(docs, state, highlights);
    const places = this.buildPlaces(docs);
    const foods = this.buildFoods(docs);
    const events = this.buildEvents(docs);

    // Build citations with source names
    const citations: Citation[] = docs.slice(0, 5).map((d, i) => ({
      id: d.id || `cite-${i}`,
      title: d.title || `Tài liệu ${i + 1}`,
      content: d.content ? (d.content.length > 200 ? d.content.substring(0, 200) + '...' : d.content) : '',
      category: d.category || 'general',
      score: d.similarity ?? d.score ?? 0,
      index: i + 1,
      sourceName: d.source || `Danh mục ${d.category || 'chung'}`,
      sourceUrl: d.url || '',
    }));

    const plan: ResponsePlan = {
      answerType, title, shortDescription, highlights,
      places, foods, events, activities, suitableFor,
      visitDuration, bestSeason, distance, citations,
    };

    logger.debug('ResponsePlanner', 'Plan built', {
      answerType, title, highlights: highlights.length,
      places: places.length, foods: foods.length,
      latencyMs: Date.now() - start,
    }, requestId);

    return plan;
  }

  /**
   * Build the user prompt for the LLM using the plan.
   */
  buildLLMPrompt(plan: ResponsePlan, userInput: string, ragContext: string): string {
    return this.promptComposer.composeUserPrompt({ plan, userInput, ragContext, citations: plan.citations });
  }

  /**
   * Build the system prompt for the LLM.
   */
  buildSystemPrompt(destination?: string | null, role?: string, hasMemory?: boolean): string {
    return this.promptComposer.composeSystem({ destination, role, hasUserMemory: hasMemory });
  }

  /**
   * Get the Formatter for assembling final responses.
   */
  getFormatter(): ResponseFormatterService {
    return this.responseFormatter;
  }

  // ─── Private extraction helpers ─────────────────────────────

  private detectAnswerType(docs: RetrievedDoc[], state: ConversationState | null): ResponsePlan['answerType'] {
    if (state?.intent === 'food') return 'foods';
    if (state?.intent === 'festival') return 'events';
    if (state?.days && state.days > 0) return 'itinerary';
    if (docs.some(d => d.category === 'food')) return 'foods';
    if (docs.some(d => d.category === 'festival' || d.category === 'culture')) return 'events';
    return 'destinations';
  }

  private extractHighlights(docs: RetrievedDoc[]): string[] {
    const highlights: string[] = [];
    for (const doc of docs.slice(0, 5)) {
      if (doc.title && !highlights.includes(doc.title)) {
        highlights.push(doc.title);
      }
    }
    if (docs.length > 0 && highlights.length < 3) {
      const sentences = docs[0].content.split(/[.!\n]/).filter(s => s.trim().length > 20);
      for (const s of sentences.slice(0, 2)) {
        highlights.push(s.trim());
      }
    }
    return highlights.slice(0, 5);
  }

  private extractActivities(docs: RetrievedDoc[], intent?: TravelSubIntent | null): string[] {
    const activityMap: Record<string, string[]> = {
      'check-in': ['Chụp ảnh check-in', 'Ngắm hoàng hôn', 'Săn mây'],
      'sightseeing': ['Tham quan', 'Ngắm cảnh', 'Dạo bước'],
      'photography': ['Săn mây', 'Chụp landscape', 'Ngắm bình minh'],
      'trekking': ['Trekking', 'Đi bộ khám phá', 'Leo núi'],
      'camping': ['Cắm trại', 'Đốt lửa trại', 'Dã ngoại'],
      'relax': ['Thư giãn', 'Tắm biển', 'Massage'],
      'family': ['Vui chơi cùng gia đình', 'Dã ngoại', 'Khám phá'],
      'couple': ['Tản bộ lãng mạn', 'Check-in', 'Thưởng thức'],
      'food': ['Thưởng thức đặc sản', 'Khám phá ẩm thực', 'Tham quan chợ'],
      'history': ['Khám phá di tích', 'Tìm hiểu lịch sử', 'Tham quan bảo tàng'],
      'culture': ['Khám phá văn hóa', 'Tìm hiểu phong tục', 'Tham quan làng nghề'],
      'festival': ['Tham gia lễ hội', 'Xem biểu diễn'],
      'adventure': ['Phượt', 'Khám phá', 'Chinh phục'],
      'backpacking': ['Du lịch bụi', 'Tự túc khám phá', 'Xuyên Việt'],
      'spiritual': ['Hành hương', 'Chiêm bái', 'Thiền'],
      'general': ['Tham quan', 'Khám phá', 'Trải nghiệm'],
    };

    const base = activityMap[intent ?? 'general'] ?? activityMap.general;
    const fromDocs: string[] = [];
    const indicators = ['tham quan', 'khám phá', 'trải nghiệm', 'cắm trại', 'trekking', 'leo núi', 'bơi'];

    for (const doc of docs) {
      const clean = removeDiacritics(doc.content.toLowerCase());
      for (const indicator of indicators) {
        const idx = clean.indexOf(removeDiacritics(indicator));
        if (idx >= 0) {
          const snippet = doc.content.substring(Math.max(0, idx - 10), idx + 40).trim();
          if (snippet.length > 10) {
            fromDocs.push(snippet.length > 60 ? snippet.substring(0, 60) + '...' : snippet);
          }
        }
      }
    }

    return [...new Set([...base, ...fromDocs])].slice(0, 5);
  }

  private extractSuitableFor(state: ConversationState | null): string[] {
    if (!state) return ['Mọi đối tượng'];
    const list: string[] = [];
    const companionLabels: Record<string, string> = {
      alone: 'Khách du lịch một mình', family: 'Gia đình có trẻ em',
      couple: 'Cặp đôi', friends: 'Nhóm bạn bè',
    };
    if (state.companion && companionLabels[state.companion]) {
      list.push(companionLabels[state.companion]);
    }
    const intentLabels: Record<string, string> = {
      'check-in': 'Dân sống ảo', trekking: 'Người yêu thích trekking',
      relax: 'Người muốn nghỉ dưỡng', adventure: 'Phượt thủ',
      spiritual: 'Người hành hương', food: 'Tín đồ ẩm thực',
      culture: 'Người yêu văn hóa', history: 'Người yêu lịch sử',
    };
    if (state.intent && intentLabels[state.intent]) {
      list.push(intentLabels[state.intent]);
    }
    return list.length > 0 ? [...new Set(list)] : ['Mọi đối tượng'];
  }

  private extractVisitDuration(docs: RetrievedDoc[]): string {
    for (const doc of docs) {
      const clean = doc.content.toLowerCase();
      const m = clean.match(/(\d+)\s*(?:tiếng|giờ|ngày)/);
      if (m) return `${m[1]} ${parseInt(m[1]) > 1 ? 'giờ' : 'giờ'}`;
      if (/(cả ngày|suốt ngày)/.test(clean)) return '1 ngày';
      if (/(nửa ngày|buổi sáng|buổi chiều)/.test(clean)) return 'Nửa ngày';
    }
    return '2-3 giờ';
  }

  private extractBestSeason(docs: RetrievedDoc[], state: ConversationState | null): string {
    if (state?.season) return state.season;
    for (const doc of docs) {
      const clean = doc.content.toLowerCase();
      const m = clean.match(/(mùa xuân|mùa hè|mùa thu|mùa đông|tháng\s+\d+)/);
      if (m) return m[1];
    }
    return 'Quanh năm';
  }

  private extractDistance(docs: RetrievedDoc[]): string {
    for (const doc of docs) {
      const clean = doc.content.toLowerCase();
      const m = clean.match(/(\d+[.,]?\d*)\s*(?:km|cây số)/);
      if (m) return `${m[1]} km`;
    }
    return 'Chưa có thông tin';
  }

  private buildTitle(docs: RetrievedDoc[], state: ConversationState | null, answerType: string): string {
    if (state?.destination && answerType === 'foods') return `Ẩm thực ${state.destination}`;
    if (state?.destination && answerType === 'events') return `Sự kiện & lễ hội tại ${state.destination}`;
    if (state?.destination) return `Khám phá ${state.destination}`;
    if (docs.length > 0) return docs[0].title || 'Địa điểm du lịch';
    return 'Địa điểm du lịch';
  }

  private buildShortDescription(docs: RetrievedDoc[], state: ConversationState | null, highlights: string[]): string {
    if (docs.length === 0) return 'Chưa có thông tin chi tiết.';
    if (state?.destination && highlights.length > 0) {
      return `${state.destination} nổi tiếng với ${highlights.slice(0, 2).join(', ')}.`;
    }
    const first = docs[0].content.split(/[.!]/).find(s => s.trim().length > 20);
    return first ? first.trim() : docs[0].content.substring(0, 100) + '...';
  }

  private buildPlaces(docs: RetrievedDoc[]): PlaceInfo[] {
    return docs.slice(0, 5).map((doc, idx) => ({
      name: doc.title,
      shortDescription: doc.content.length > 150 ? doc.content.substring(0, 150) + '...' : doc.content,
      highlights: doc.category ? [`Danh mục: ${doc.category}`] : [],
      activities: [],
      suitableFor: [],
      visitDuration: 'Chưa xác định',
      bestSeason: 'Quanh năm',
      distance: 'Chưa có thông tin',
      category: doc.category || 'general',
      citationIndex: idx + 1,
    }));
  }

  private buildFoods(docs: RetrievedDoc[]): FoodInfo[] {
    return docs
      .filter(d => d.category === 'food' || d.category === 'destination')
      .slice(0, 3)
      .map((doc, idx) => ({
        name: doc.title,
        description: doc.content.length > 100 ? doc.content.substring(0, 100) + '...' : doc.content,
        region: '',
        highlights: [],
        suitableFor: [],
        citationIndex: idx + 1,
      }));
  }

  private buildEvents(docs: RetrievedDoc[]): EventInfo[] {
    return docs
      .filter(d => d.category === 'festival' || d.category === 'culture')
      .slice(0, 3)
      .map((doc, idx) => ({
        name: doc.title,
        description: doc.content.length > 100 ? doc.content.substring(0, 100) + '...' : doc.content,
        season: '',
        activities: [],
        location: '',
        citationIndex: idx + 1,
      }));
  }
}
