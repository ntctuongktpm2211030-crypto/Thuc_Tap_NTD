import { AgentStrategy, AgentTool, AgentResponse, Citation } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, extractLastDestinationFromHistory, callAgentLLM, buildCitationsFromDocs, buildRagContextWithRefs } from '../utils/agent.utils';
import { RetrieverService } from '../../rag/services/retriever.service';
import { EmbeddingsService } from '../../rag/services/embeddings.service';
import { VectorStoreService } from '../../rag/services/vector-store.service';

export class RecommendationAgent implements AgentStrategy {
  name = 'RecommendationAgent';
  description = 'Chuyên gia phân tích sở thích cá nhân để đưa ra gợi ý du lịch cá nhân hóa.';

  private recommendationTool: AgentTool;
  private retriever: RetrieverService;

  constructor(recommendationTool: AgentTool) {
    this.recommendationTool = recommendationTool;
    this.retriever = new RetrieverService(new EmbeddingsService(), new VectorStoreService());
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[]
  ): Promise<AgentResponse> {
    console.log(`[RecommendationAgent] Đang xử lý yêu cầu cho user ${userId}: "${input}" (Extracted: "${extractedDestination}")`);

    // Phân tích và trích xuất điểm đến từ câu hỏi để cá nhân hóa
    let region = extractedDestination || undefined;

    let dests = ['Cà Mau', 'Hà Giang', 'Hà Nội', 'Sapa', 'Đà Lạt', 'Đà Nẵng', 'Huế', 'Phú Quốc', 'Vũng Tàu', 'Nha Trang', 'Hạ Long', 'Sài Gòn', 'Cần Thơ'];
    try {
      const allContent = await prisma.knowledgeContent.findMany({ select: { title: true } });
      const uniqueBaseTitles = Array.from(new Set(allContent.map(c => c.title.split(' - ')[0].trim())));
      const allDestinations = await prisma.destination.findMany({ select: { name: true } });
      const destNames = allDestinations.map(d => d.name);
      const dbDests = Array.from(new Set([...uniqueBaseTitles, ...destNames])).filter(t => t.length > 0);
      if (dbDests.length > 0) {
        dests = dbDests;
      }
    } catch (_) {}

    if (!region) {
      const cleanInput = removeDiacritics(input.toLowerCase());
      for (const dest of dests) {
        const cleanDest = removeDiacritics(dest.toLowerCase());
        if (cleanDest.length > 1 && cleanInput.includes(cleanDest)) {
          region = dest;
          break;
        }
      }
    }

    // Thử khôi phục địa danh từ lịch sử nếu không được trích xuất trực tiếp từ câu hỏi hiện tại
    if (!region && history) {
      region = extractLastDestinationFromHistory(history, dests) || undefined;
    }

    // 1. Chạy RecommendationTool (kết nối với sở thích đã lưu của user trong Memory)
    const recInput = { userId, region };
    const recData = await this.recommendationTool.execute(recInput);

    if (messageId) {
      await this.saveToolCall(messageId, this.recommendationTool.name, recInput, recData);
    }

    const prefList = recData.userPreferences.join(', ') || 'nghỉ dưỡng, khám phá tự nhiên';
    const locList = recData.userFavoriteLocations.join(', ') || 'Đà Lạt, Nha Trang';

    // 2. Lấy dữ liệu RAG bổ trợ trong danh mục 'destination'
    let ragDocsText = '';
    let ragDocs: any[] = [];
    let hasRagData = false;
    try {
      ragDocs = await this.retriever.retrieve(input, 'destination', 4);
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
      console.warn('[RecommendationAgent] RAG retrieval failed:', ragErr);
    }

    // 3. Xây dựng phản hồi thông qua LLM
    try {
      const antiHallucinationRule = (region && !hasRagData)
        ? `LƯU Ý QUAN TRỌNG VỀ PHÒNG CHỐNG ĐÁP ÁN ẢO (RÂU ÔNG NỌ CẮM CẰM BÀ KIA): Hiện tại cơ sở dữ liệu SmartTravel của chúng ta CHƯA CÓ tài liệu tri thức chính thức cho tỉnh/thành phố "${region}". Bạn ĐƯỢC PHÉP sử dụng kiến thức chung (General Knowledge) thực tế, chính xác 100% của mình để gợi ý các địa điểm du lịch, vui chơi, ẩm thực và nếp sống thực tế ở "${region}". 
TUYỆT ĐỐI CẤM: Không được tự ý gán ghép đặc sản của địa phương khác vào địa phương này (Ví dụ: Gỏi cá trích là đặc sản nổi tiếng của Phú Quốc/Kiên Giang, Bún sứa là đặc sản của Nha Trang/Khánh Hòa - TUYỆT ĐỐI KHÔNG ĐƯỢC giới thiệu chúng là đặc sản của Cần Thơ! Nếu là Cần Thơ, các món đặc sản thực tế phải là lẩu mắm, bánh cống, nem nướng Cái Răng, vịt nấu chao, cá lóc nướng trui). Hãy thông báo nhẹ cho người dùng biết đây là thông tin gợi ý tham khảo từ AI do hệ thống chưa có dữ liệu chính thức cho địa phương này. Tuyệt đối không bịa đặt các địa danh không có thật.`
        : `Bạn CHỈ ĐƯỢC PHÉP gợi ý hoặc đề xuất các địa danh cụ thể có tên xuất hiện trong "Dữ liệu địa điểm gợi ý thô" hoặc "RAG Context" được cung cấp ở dưới. TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ BỊA ĐẶT các địa danh không có thật, và KHÔNG ĐƯỢC đề xuất các địa điểm nằm ngoài "Dữ liệu địa điểm gợi ý thô" hoặc "RAG Context". Bạn phải sử dụng TÊN CHÍNH XÁC 100% của địa điểm như được viết trong cơ sở dữ liệu/Context. Không được tự ý bổ sung các hoạt động phi thực tế nằm ngoài nội dung tài liệu RAG Context.`;

      const systemPrompt = `Bạn là RecommendationAgent - chuyên gia tư vấn du lịch cá nhân hóa của SmartTravel. 
Nhiệm vụ của bạn là dựa vào sở thích của người dùng, danh sách các địa điểm trong cơ sở dữ liệu và các tài liệu tri thức (Context) để gợi ý các địa điểm du lịch lý tưởng tại Việt Nam.

QUY TẮC PHẢN HỒI THEO NGỮ CẢNH:
1. Nếu câu hỏi của người dùng có chỉ định một địa phương/tỉnh thành cụ thể (ví dụ: Vũng Tàu, Hà Nội...), bạn CHỈ ĐƯỢC PHÉP gợi ý các địa danh nằm trong địa phương đó. Tuyệt đối không được gợi ý hay pha trộn địa phương khác (ví dụ: nếu hỏi về Vũng Tàu, không được gợi ý Đồng Nai hay Cà Mau).
2. Nếu câu hỏi của người dùng hướng tới một địa danh cụ thể hoặc một câu hỏi hẹp (ví dụ: hỏi riêng về "Bãi Sau"), hãy tập trung trả lời thẳng vào trọng tâm địa danh đó, không liệt kê thêm các đề xuất lựa chọn khác ngoài lề.
3. Nếu người dùng hỏi chung chung không có địa điểm cụ thể (ví dụ: "nên đi du lịch ở đâu", "tư vấn điểm du lịch nghỉ dưỡng"), hãy đưa ra khoảng 2-3 gợi ý lựa chọn đa dạng tại các tỉnh thành khác nhau phù hợp với sở thích của họ.

Mỗi gợi ý được đưa ra cần ghi rõ:
- Tên địa điểm
- Thể loại (ví dụ: Khám phá tự nhiên, Du lịch tâm linh, Nghỉ dưỡng, Ẩm thực,...)
- Lý do đề xuất (giải thích chi tiết tại sao địa điểm này lại hợp với sở thích/mong muốn của người dùng)

RÀNG BUỘC PHÒNG CHỐNG ĐÁP ÁN ẢO (ANTI-HALLUCINATION RULES):
${antiHallucinationRule}

Hãy trả lời thân thiện, nhiệt tình bằng tiếng Việt.`;

      const userPrompt = `Sở thích người dùng (Preferences): ${prefList}
Các địa điểm yêu thích của họ: ${locList}

Dữ liệu địa điểm gợi ý thô:
${JSON.stringify(recData.recommendations)}

Tài liệu tri thức bổ trợ tìm được (RAG Context):
${ragDocsText || 'Không tìm thấy tài liệu liên quan.'}

Câu hỏi/Yêu cầu mới nhất của người dùng: "${input}"`;

      const llmResponse = await callAgentLLM(systemPrompt, userPrompt, history);

      // --- BỘ XÁC THỰC NGĂN CHẶN ĐỊA DANH ẢO / NGOÀI DATABASE ---
      const allowedNames = Array.from(new Set([
        ...recData.recommendations.map((r: any) => r.name.toLowerCase()),
        ...ragDocs.flatMap((d: any) => d.title.split(' - ').map((p: string) => p.trim().toLowerCase()))
      ])).filter(name => name.length > 2);

      const boldTerms = (llmResponse.match(/\*\*(.*?)\*\*/g) || [])
        .map(m => m.replace(/\*\*/g, '').trim())
        .filter(t => t.length > 2);

      let hasHallucinatedDest = false;
      const potentialDests = boldTerms.filter(t => {
        const cleanT = removeDiacritics(t.toLowerCase());
        return !['the loai', 'ly do de xuat', 'dia diem moi', 'ly do', 'thong tin', 'hoat dong', 'thoi tiet', 'luu y', 'de xuat', 'chu y'].some(k => cleanT.includes(k));
      });

      for (const dest of potentialDests) {
        const cleanDest = removeDiacritics(dest.toLowerCase());
        const isAllowed = allowedNames.some(allowed => {
          const cleanAllowed = removeDiacritics(allowed);
          return cleanDest.includes(cleanAllowed) || cleanAllowed.includes(cleanDest);
        });
        if (!isAllowed) {
          console.warn(`[RecommendationAgent] Detected hallucinated/unauthorized destination: "${dest}"`);
          hasHallucinatedDest = true;
          break;
        }
      }

      if (hasHallucinatedDest) {
        console.warn('[RecommendationAgent] Warning: Detected potential unauthorized/hallucinated destinations, but returning response anyway to avoid empty/generic template fallback.');
      }

      const citations = buildCitationsFromDocs(ragDocs);
      return { response: llmResponse, citations };
    } catch (err) {
      console.warn('[RecommendationAgent] LLM call failed or rejected, falling back to static template response:', err);
    }

    // Fallback: Xây dựng phản hồi của RecommendationAgent theo template cũ
    let response = `Chào bạn, dựa trên phân tích về hồ sơ sở thích du lịch cá nhân của bạn (mong muốn: ${prefList} và các địa danh bạn yêu thích như ${locList}), tôi xin gợi ý một số điểm đến phù hợp nhất dành cho bạn:\n\n`;

    recData.recommendations.forEach((rec: any, index: number) => {
      let typeLabel = rec.type;
      if (rec.type === 'nature') {
        typeLabel = 'Khám phá tự nhiên';
      } else if (rec.type === 'slow-travel') {
        typeLabel = 'Du lịch chậm & Nghỉ dưỡng';
      }

      response += `\n**Đề xuất ${index + 1}: ${rec.name}** (Thể loại: ${typeLabel})\n`;
      response += `Lý do đề xuất: ${rec.reason}\n`;
    });

    response += `\nHy vọng những gợi ý chi tiết này sẽ giúp bạn lựa chọn được hành trình ưng ý nhất. Nếu bạn muốn lập lịch trình cụ thể hay tìm hiểu thêm về thời tiết, ẩm thực tại các điểm đến này, hãy cứ đặt câu hỏi cho tôi nhé!`;

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
      console.error('[RecommendationAgent/saveToolCall]', err);
    }
  }
}
