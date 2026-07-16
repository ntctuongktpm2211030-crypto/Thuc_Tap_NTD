import { AgentStrategy, AgentTool, AgentResponse, Citation, UserMemory } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, extractLastDestinationFromHistory, callAgentLLM, buildCitationsFromDocs, buildRagContextWithRefs } from '../utils/agent.utils';
import { buildRecSystemPrompt } from '../prompts/recommendation.prompt';
import { logger } from '../../../utils/logger';
import { RagPipelineService } from '../../rag/services/rag-pipeline.service';

export class RecommendationAgent implements AgentStrategy {
  name = 'RecommendationAgent';
  description = 'Chuyên gia phân tích sở thích cá nhân để đưa ra gợi ý du lịch cá nhân hóa.';

  private recommendationTool: AgentTool;
  private ragPipeline: RagPipelineService;

  constructor(recommendationTool: AgentTool) {
    this.recommendationTool = recommendationTool;
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

    // 2. Lấy dữ liệu RAG pipeline (destination + category + reranking)
    let ragDocsText = '';
    let ragDocs: any[] = [];
    let hasRagData = false;
    try {
      const pipelineResult = await this.ragPipeline.execute({
        query: input,
        destination: region,
        category: 'destination',
        topK: 4,
      });
      ragDocs = pipelineResult.docs;
      ragDocsText = pipelineResult.contextText;
      hasRagData = pipelineResult.hasData;
      logger.info('RecommendationAgent', 'RAG pipeline result', {
        hasData: pipelineResult.hasData,
        docs: pipelineResult.docs.length,
        dest: pipelineResult.destination,
        latencyMs: pipelineResult.metadata.latencyMs,
      });
    } catch (ragErr) {
      console.warn('[RecommendationAgent] RAG pipeline failed:', ragErr);
    }

    // 3. Xây dựng phản hồi thông qua LLM
    try {
      const systemPrompt = buildRecSystemPrompt(region, hasRagData, memory);

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
