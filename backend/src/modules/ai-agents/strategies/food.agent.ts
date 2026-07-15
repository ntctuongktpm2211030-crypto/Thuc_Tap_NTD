import { AgentStrategy, AgentTool, AgentResponse, Citation } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, normalizeSlang, extractLastDestinationFromHistory, callAgentLLM, getDynamicRegions, buildCitationsFromDocs, buildRagContextWithRefs } from '../utils/agent.utils';
import { RetrieverService } from '../../rag/services/retriever.service';
import { EmbeddingsService } from '../../rag/services/embeddings.service';
import { VectorStoreService } from '../../rag/services/vector-store.service';

export class FoodAgent implements AgentStrategy {
  name = 'FoodAgent';
  description = 'Chuyên gia tư vấn ẩm thực địa phương, đặc sản vùng miền và địa chỉ ăn uống.';

  private foodTool: AgentTool;
  private retriever: RetrieverService;

  constructor(foodTool: AgentTool) {
    this.foodTool = foodTool;
    this.retriever = new RetrieverService(new EmbeddingsService(), new VectorStoreService());
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[]
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

    // 2. Chạy FoodTool lấy dữ liệu đặc sản
    const foodInput = { region };
    const foodData = await this.foodTool.execute(foodInput);

    if (messageId) {
      await this.saveToolCall(messageId, this.foodTool.name, foodInput, foodData);
    }

    // 3. Lấy tài liệu tri thức RAG trong danh mục 'food'
    let ragDocsText = '';
    let ragDocs: any[] = [];
    let hasRagData = false;
    try {
      ragDocs = await this.retriever.retrieve(`${region} ${input}`, 'food', 4);
      let filteredDocs = ragDocs;
      if (region) {
        const cleanDest = cleanGeographicName(region);
        const cleanDestNoSpaces = cleanDest.replace(/\s+/g, '');
        filteredDocs = ragDocs.filter(d => {
          const cleanTitle = removeDiacritics(d.title.toLowerCase()).replace(/\s+/g, '');
          const cleanContent = removeDiacritics(d.content.toLowerCase()).replace(/\s+/g, '');
          return cleanTitle.includes(cleanDestNoSpaces) || cleanContent.includes(cleanDestNoSpaces);
        });
      }

      if (filteredDocs.length > 0) {
        hasRagData = true;
      }

      ragDocsText = buildRagContextWithRefs(filteredDocs);
    } catch (ragErr) {
      console.warn('[FoodAgent] RAG retrieval failed:', ragErr);
    }

    // 4. Xây dựng câu trả lời qua LLM
    try {
      const antiHallucinationRule = (region && !hasRagData)
        ? `LƯU Ý QUAN TRỌNG VỀ PHÒNG CHỐNG ĐÁP ÁN ẢO (RÂU ÔNG NỌ CẮM CẰM BÀ KIA): Hiện tại cơ sở dữ liệu SmartTravel của chúng ta CHƯA CÓ tài liệu tri thức ẩm thực chính thức cho tỉnh/thành phố "${region}". Bạn ĐƯỢC PHÉP sử dụng kiến thức chung (General Knowledge) thực tế, chính xác 100% của mình để trả lời và gợi ý ẩm thực thực tế ở "${region}".
TUYỆT ĐỐI CẤM: Không được tự ý gán ghép đặc sản của địa phương khác vào địa phương này (Ví dụ: Gỏi cá trích là đặc sản nổi tiếng của Phú Quốc/Kiên Giang, Bún sứa là đặc sản của Nha Trang/Khánh Hòa - TUYỆT ĐỐI KHÔNG ĐƯỢC giới thiệu chúng là đặc sản của Cần Thơ! Bún giò heo, cơm tấm là các món ăn phổ biến thông thường ở miền Nam/Việt Nam, tuyệt đối không được giới thiệu chúng là "đặc sản đặc trưng đại diện riêng" của Cần Thơ). 
Nếu người dùng hỏi một món ăn thông thường hoặc món của tỉnh khác có phải đặc sản Cần Thơ không (Ví dụ: "bún giò heo có phải đặc sản cần thơ"), hãy đính chính rõ ràng và lịch sự là KHÔNG PHẢI, và đề xuất các đặc sản thực tế của Cần Thơ bao gồm: lẩu mắm, bánh cống, nem nướng Cái Răng, vịt nấu chao, cá lóc nướng trui. Hãy thông báo nhẹ cho người dùng biết đây là thông tin gợi ý tham khảo từ AI do hệ thống chưa có dữ liệu chính thức cho địa phương này. Tuyệt đối không bịa đặt.`
        : `Bạn CHỈ ĐƯỢC PHÉP tư vấn các món ăn, đặc sản cụ thể có tên xuất hiện trong các tài liệu tri thức cung cấp dưới đây (RAG Context). Tuyệt đối không tự ý bịa đặt ra các món ăn không có thật hoặc gán ghép sai đặc sản địa phương khác.`;

      const systemPrompt = `Bạn là FoodAgent - chuyên gia ẩm thực địa phương Việt Nam của SmartTravel. 
Nhiệm vụ của bạn là tư vấn các món đặc sản vùng miền, nhà hàng ngon và địa chỉ ẩm thực hấp dẫn dựa trên danh sách món ăn từ hệ thống và các tài liệu tri thức ẩm thực (RAG Context).

RÀNG BUỘC PHÒNG CHỐNG ĐÁP ÁN ẢO (ANTI-HALLUCINATION RULES):
${antiHallucinationRule}

Hãy trả lời sinh động, chi tiết, hấp dẫn và thân thiện bằng tiếng Việt. Khuyên người dùng nên thử những món gì, vị giác ra sao, ăn ở đâu và tại sao.`;

      const userPrompt = `Khu vực/Tỉnh thành: ${region}
Đặc sản hệ thống cung cấp: ${JSON.stringify(foodData.results)}

Tài liệu tri thức ẩm thực (RAG Context):
${ragDocsText || 'Không tìm thấy tài liệu liên quan.'}

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
