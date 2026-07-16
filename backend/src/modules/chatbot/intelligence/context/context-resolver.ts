import prisma from '../../../../config/db';
import { ContextMemory, ChatbotIntent } from '../interfaces/intelligence.interfaces';
import { removeDiacritics } from '../../../ai-agents/utils/agent.utils';

export class ContextResolver {
  /**
   * Resolves the conversation history context and tracks rejected recommendations
   */
  async resolve(conversationId: string): Promise<ContextMemory> {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const context: ContextMemory = {
      lastAttractionsSuggested: [],
      lastAttractionsRejected: [],
    };

    if (messages.length === 0) return context;

    // Scan backwards to build memory
    const userMsgs = messages.filter((m) => m.role === 'user');
    const assistantMsgs = messages.filter((m) => m.role === 'assistant');

    // 1. Detect last province from assistant suggestions
    for (const msg of assistantMsgs) {
      // Find province keywords in assistant message (e.g. "Nghệ An", "Đà Lạt")
      const content = msg.id; // Wait, prisma ChatMessage content is stored in ChatMessageVersion!
      // Let's retrieve the message version content
      const version = await prisma.chatMessageVersion.findFirst({
        where: { messageId: msg.id, isActive: true },
        orderBy: { version: 'desc' },
      });

      if (version) {
        // Parse suggested attractions (between double stars **Attraction**)
        const matches = version.content.match(/\*\*(.*?)\*\*/g);
        if (matches) {
          const names = matches.map((m) => m.replace(/\*\*/g, '').trim());
          context.lastAttractionsSuggested.push(...names);
        }

        // Detect province
        const provinces = ['Nghe An', 'Ha Noi', 'Da Lat', 'Lam Dong', 'Phu Quoc', 'Nha Trang', 'Khanh Hoa'];
        const cleanContent = removeDiacritics(version.content.toLowerCase());
        for (const prov of provinces) {
          if (cleanContent.includes(removeDiacritics(prov.toLowerCase()))) {
            context.lastProvince = prov;
            break;
          }
        }
      }
    }

    // 2. Detect last intent and check if user rejected suggestions
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[0];
      const version = await prisma.chatMessageVersion.findFirst({
        where: { messageId: lastUserMsg.id, isActive: true },
      });

      if (version) {
        const cleanText = removeDiacritics(version.content.toLowerCase());
        const isReject = ['khong thich', 'doi cho', 'chan qua', 'do qua', 'khac di', 'xau qua'].some((word) =>
          cleanText.includes(word)
        );

        if (isReject) {
          // The last suggested attractions are now marked as rejected
          context.lastAttractionsRejected = [...context.lastAttractionsSuggested];
        }
      }
    }

    // Default last intent fallback based on last messages count
    context.lastIntent = assistantMsgs.length > 0 ? 'RECOMMENDATION' : 'GENERAL_QA';

    return context;
  }
}
