import { AgentStrategy, AgentTool, AgentResponse, Citation } from '../types/agent.types';
import prisma from '../../../config/db';
import { removeDiacritics, findFuzzyMatch, cleanGeographicName, normalizeSlang, extractLastDestinationFromHistory, callAgentLLM, getDynamicRegions, buildCitationsFromDocs, buildRagContextWithRefs } from '../utils/agent.utils';
import { RetrieverService } from '../../rag/services/retriever.service';
import { EmbeddingsService } from '../../rag/services/embeddings.service';
import { VectorStoreService } from '../../rag/services/vector-store.service';

export class CultureAgent implements AgentStrategy {
  name = 'CultureAgent';
  description = 'Chuyên gia tư vấn các khía cạnh văn hóa, lễ hội, lịch sử địa phương và danh lam thắng cảnh.';

  private cultureTool: AgentTool;
  private retriever: RetrieverService;

  constructor(cultureTool: AgentTool) {
    this.cultureTool = cultureTool;
    this.retriever = new RetrieverService(new EmbeddingsService(), new VectorStoreService());
  }

  async execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[]
  ): Promise<AgentResponse> {
    console.log(`[CultureAgent] Đang xử lý yêu cầu cho user ${userId}: "${input}" (Extracted: "${extractedDestination}")`);

    // 1. Phân tích khu vực sử dụng Fuzzy Match chống lỗi gõ sai chữ/thiếu dấu
    let regions = ['Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Huế', 'Hà Giang'];
    try {
      regions = await getDynamicRegions();
    } catch (dbErr) {
      console.warn('[CultureAgent] Failed to fetch dynamic regions, using fallback list:', dbErr);
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

    // 2. Chạy CultureTool lấy nét đặc sắc văn hóa
    const cultureInput = { region };
    const cultureData = await this.cultureTool.execute(cultureInput);

    if (messageId) {
      await this.saveToolCall(messageId, this.cultureTool.name, cultureInput, cultureData);
    }

    // 3. Lấy dữ liệu RAG bổ trợ (tìm kiếm tự do không giới hạn category để bao quát cả history, festival, culture)
    let ragDocsText = '';
    let ragDocs: any[] = [];
    try {
      ragDocs = await this.retriever.retrieve(`${region} ${input}`, undefined, 4);
      ragDocsText = buildRagContextWithRefs(ragDocs);
    } catch (ragErr) {
      console.warn('[CultureAgent] RAG retrieval failed:', ragErr);
    }

    // 4. Xây dựng câu trả lời qua LLM
    try {
      const systemPrompt = `Bạn là CultureAgent - chuyên gia lịch sử, văn hóa và lễ hội truyền thống địa phương Việt Nam của SmartTravel. 
Nhiệm vụ của bạn là dựa vào nét đặc trưng văn hóa từ hệ thống cung cấp và các tài liệu tri thức lịch sử & văn hóa (RAG Context) để giải đáp chi tiết, sâu sắc, hấp dẫn và tự nhiên nhất câu hỏi của người dùng. Hãy trả lời bằng tiếng Việt thân thiện, văn phong lịch sự và cuốn hút.`;

      const userPrompt = `Khu vực/Tỉnh thành: ${region}
Nét văn hóa cơ bản hệ thống cung cấp: ${cultureData.info}

Tài liệu tri thức bổ trợ (RAG Context):
${ragDocsText || 'Không tìm thấy tài liệu liên quan.'}

Câu hỏi/Yêu cầu của người dùng: "${input}"`;

      const llmResponse = await callAgentLLM(systemPrompt, userPrompt, history);
      const citations = buildCitationsFromDocs(ragDocs);
      return { response: llmResponse, citations };
    } catch (err) {
      console.warn('[CultureAgent] LLM call failed, falling back to static template response:', err);
    }

    // Fallback: Xây dựng câu trả lời của CultureAgent chi tiết hơn theo template cũ
    let response = `Chào bạn, văn hóa và lịch sử của **${region}** là một trong những mảnh ghép vô cùng đặc trưng, mang dấu ấn lịch sử hào hùng và các giá trị truyền thống lâu đời của dân tộc Việt Nam. Dưới đây là những nét văn hóa nổi bật nhất tại đây:\n\n`;
    response += `📜 **Nét đặc trưng tiêu biểu:**\n`;
    response += `${cultureData.info}\n\n`;
    response += `Hy vọng những thông tin văn hóa lịch sử thú vị này sẽ giúp hành trình khám phá và trải nghiệm thực tế của bạn tại **${region}** trở nên ý nghĩa, sâu sắc và trọn vẹn hơn bao giờ hết!`;

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
      console.error('[CultureAgent/saveToolCall]', err);
    }
  }
}
