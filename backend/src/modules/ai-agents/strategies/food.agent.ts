import { AgentStrategy, AgentTool, AgentResponse, Citation, UserMemory } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, normalizeSlang, extractLastDestinationFromHistory, callAgentLLM, getDynamicRegions, buildCitationsFromDocs, buildRagContextWithRefs, mapTourismToProvince, extractSuggestedItemsFromHistory } from '../utils/agent.utils';
import { buildFoodSystemPrompt } from '../prompts/food.prompt';
import { logger } from '../../../utils/logger';
import { RagPipelineService } from '../../rag/services/rag-pipeline.service';

export class FoodAgent implements AgentStrategy {
  name = 'FoodAgent';
  description = 'Chuyên gia tư vấn ẩm thực địa phương, đặc sản vùng miền và địa chỉ ăn uống.';

  private foodTool: AgentTool;
  private ragPipeline: RagPipelineService;

  constructor(foodTool: AgentTool) {
    this.foodTool = foodTool;
    this.ragPipeline = new RagPipelineService();
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[],
    memory?: UserMemory
  ): Promise<AgentResponse> {
    console.log(`[FoodAgent] Đang xử lý yêu cầu cho user ${userId}: "${input}" (Extracted: "${extractedDestination}")`);

    // 1. Phân tích vùng miền sử dụng Fuzzy Match để chống lỗi gõ sai chữ/thiếu dấu
    let regions = ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Huế', 'Hà Giang'];
    try {
      regions = await getDynamicRegions();
    } catch (dbErr) {
      console.warn('[FoodAgent] Failed to fetch dynamic regions, using fallback list:', dbErr);
    }
    
    // Thử khôi phục địa danh từ lịch sử nếu không được trích xuất trực tiếp từ câu hỏi hiện tại
    let targetDest = extractedDestination;
    if (!targetDest && history) {
      targetDest = extractLastDestinationFromHistory(history, regions) || undefined;
    }

    let region = 'Hà Nội';
    const cleanQuery = removeDiacritics(normalizeSlang(targetDest || input).toLowerCase());
    let foundRegion = null;

    for (const reg of regions) {
      const cleanReg = removeDiacritics(reg.toLowerCase());
      const strippedReg = cleanGeographicName(reg);
      
      if (cleanReg.length > 1 && cleanQuery.includes(cleanReg)) {
        foundRegion = reg;
        break;
      }
      if (strippedReg.length > 2 && cleanQuery.includes(strippedReg)) {
        foundRegion = reg;
        break;
      }
    }

    if (foundRegion) {
      region = foundRegion;
    } else {
      const matched = findFuzzyMatch(targetDest || input, regions, 0.7);
      region = matched || targetDest || 'Hà Nội';
    }

    // Đảm bảo địa danh du lịch phổ biến được map về Tỉnh hành chính (Ví dụ: "Đà Lạt" -> "Lâm Đồng")
    region = mapTourismToProvince(region);

    // 2. Chạy FoodTool lấy dữ liệu đặc sản
    const foodInput = { region };
    const foodData = await this.foodTool.execute(foodInput);

    // Trích xuất danh sách các món ăn đã gợi ý trước đó trong lịch sử trò chuyện để tránh trùng lặp
    const suggestedItems = extractSuggestedItemsFromHistory(history || []);
    logger.info('FoodAgent', 'Suggested items extracted from history', { count: suggestedItems.length, items: suggestedItems });

    // Lọc trùng lặp món ăn trong kết quả từ foodTool
    if (suggestedItems.length > 0 && foodData.results) {
      const beforeFilterCount = foodData.results.length;
      foodData.results = foodData.results.filter((item: any) => {
        const cleanName = removeDiacritics(item.name.toLowerCase());
        return !suggestedItems.some(suggested => 
          cleanName.includes(suggested) || suggested.includes(cleanName)
        );
      });
      logger.info('FoodAgent', 'Filtered duplicate items from foodTool results', { 
        before: beforeFilterCount, 
        after: foodData.results.length 
      });
    }

    if (messageId) {
      await this.saveToolCall(messageId, this.foodTool.name, foodInput, foodData);
    }

    // 3. Lấy tài liệu tri thức RAG pipeline (destination + category + reranking)
    let ragDocsText = '';
    let ragDocs: any[] = [];
    let hasRagData = false;
    try {
      const pipelineResult = await this.ragPipeline.execute({
        query: input,
        destination: region,
        category: 'food',
        topK: 6, // Tăng lên 6 để có buffer sau khi lọc trùng
      });
      
      // Lọc trùng lặp món ăn trong tài liệu RAG
      let filteredDocs = pipelineResult.docs;
      if (suggestedItems.length > 0 && pipelineResult.docs.length > 0) {
        filteredDocs = pipelineResult.docs.filter((d: any) => {
          const cleanTitle = removeDiacritics(d.title.toLowerCase());
          return !suggestedItems.some(suggested => 
            cleanTitle.includes(suggested) || suggested.includes(cleanTitle)
          );
        });
      }

      ragDocs = filteredDocs;
      ragDocsText = filteredDocs.length > 0 ? buildRagContextWithRefs(filteredDocs) : '';
      hasRagData = filteredDocs.length > 0;

      logger.info('FoodAgent', 'RAG pipeline result after filtering duplicates', {
        originalDocs: pipelineResult.docs.length,
        filteredDocs: ragDocs.length,
        dest: pipelineResult.destination,
        latencyMs: pipelineResult.metadata.latencyMs,
      });
    } catch (ragErr) {
      console.warn('[FoodAgent] RAG pipeline failed:', ragErr);
    }

    // 4. Xây dựng câu trả lời qua LLM
    try {
      const systemPrompt = buildFoodSystemPrompt(region, hasRagData, memory);

      const userPrompt = `Khu vực/Tỉnh thành: ${region}
Đặc sản hệ thống cung cấp (đã loại trừ món cũ): ${JSON.stringify(foodData.results)}

Tài liệu tri thức ẩm thực (RAG Context - đã loại trừ món cũ):
${ragDocsText || 'Không tìm thấy tài liệu liên quan.'}

Các món đặc sản đã được giới thiệu trước đó trong lịch sử trò chuyện (TUYỆT ĐỐI KHÔNG GỢI Ý LẠI): ${suggestedItems.join(', ')}

Câu hỏi/Yêu cầu của người dùng: "${input}"`;

      const llmResponse = await callAgentLLM(systemPrompt, userPrompt, history);
      const citations = buildCitationsFromDocs(ragDocs);
      return { response: llmResponse, citations };
    } catch (err) {
      console.warn('[FoodAgent] LLM call failed, falling back to static template response:', err);
    }

    // Fallback: Xây dựng câu trả lời của FoodAgent chi tiết hơn theo template cũ
    let response = `Chào bạn, văn hóa ẩm thực tại **${region}** luôn nổi tiếng với sự tinh tế, phong phú và mang đậm dấu ấn bản địa độc đáo. Dưới đây là danh sách những món ăn đặc sản tiêu biểu bạn nhất định phải thử khi đến đây:\n\n`;
    
    foodData.results.forEach((item: any) => {
      response += `🍜 **${item.name}**\n`;
      response += `Đánh giá: ${item.rating}/5 sao\n`;
      response += `Mô tả: ${item.description}\n\n`;
    });

    response += `💡 *Mách nhỏ dành cho bạn:* Bạn có thể ấn nút lưu các món đặc sản này vào danh sách ẩm thực yêu thích trên ứng dụng để dễ dàng mở ra tra cứu địa điểm quán ăn ngon khi đi thực tế nhé!`;

    return { response, citations: [] };
  }

  private async saveToolCall(messageId: string, toolName: string, input: any, output: any) {
    try {
      await prisma.toolCall.create({
        data: {
          messageId,
          toolName,
          input: JSON.stringify(input),
          output: JSON.stringify(output),
          status: 'success',
        },
      });
    } catch (err) {
      console.error('[FoodAgent/saveToolCall]', err);
    }
  }
}
