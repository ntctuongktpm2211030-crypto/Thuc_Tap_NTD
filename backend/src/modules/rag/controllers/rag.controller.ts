import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { EmbeddingsService } from '../services/embeddings.service';
import { VectorStoreService } from '../services/vector-store.service';
import { RetrieverService } from '../services/retriever.service';
import { PromptBuilderService } from '../services/prompt-builder.service';
import { RagOrchestratorService } from '../services/rag-orchestrator.service';
import { KnowledgeCategory } from '../types/rag.types';
import prisma from '../../../config/db';

export class RagController {
  private embeddingsService: EmbeddingsService;
  private vectorStoreService: VectorStoreService;
  private retrieverService: RetrieverService;
  private promptBuilderService: PromptBuilderService;
  private orchestratorService: RagOrchestratorService;

  constructor() {
    this.embeddingsService = new EmbeddingsService();
    this.vectorStoreService = new VectorStoreService();
    this.retrieverService = new RetrieverService(this.embeddingsService, this.vectorStoreService);
    this.promptBuilderService = new PromptBuilderService();
    this.orchestratorService = new RagOrchestratorService();
  }

  /**
   * Helper to resolve or create a valid messageId for database foreign key constraints
   */
  private async ensureMessageId(userId: string, explicitMessageId?: string): Promise<string> {
    if (explicitMessageId) {
      const existing = await prisma.chatMessage.findUnique({ where: { id: explicitMessageId } });
      if (existing) return explicitMessageId;
    }

    // Find or create a conversation for the user
    let conv = await prisma.chatConversation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!conv) {
      conv = await prisma.chatConversation.create({
        data: {
          userId,
        },
      });
    }

    // Create a dummy user ChatMessage
    const msg = await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: 'user',
      },
    });

    return msg.id;
  }

  /**
   * Ad-hoc document upload with automatic embedding generation
   */
  addDocument = async (req: AuthRequest, res: Response) => {
    try {
      const { title, body, content, category, questions: reqQuestions, answers: reqAnswers } = req.body;

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'title không được để trống.' });
      }

      const docBody = body || content;
      if (!docBody || typeof docBody !== 'string' || docBody.trim().length === 0) {
        return res.status(400).json({ error: 'body hoặc content không được để trống.' });
      }

      if (!category || !['culture', 'festival', 'food', 'history', 'destination'].includes(category)) {
        return res.status(400).json({ error: 'category phải là culture, festival, food, history hoặc destination.' });
      }

      const questions: string[] = Array.isArray(reqQuestions) && reqQuestions.length > 0 
        ? reqQuestions.map(q => String(q).trim()).filter(Boolean)
        : [title];

      const answers: string[] = Array.isArray(reqAnswers) && reqAnswers.length > 0
        ? reqAnswers.map(a => String(a).trim()).filter(Boolean)
        : [docBody];

      const questionEmbeddings: { text: string; embedding: number[] }[] = [];
      for (const q of questions) {
        const embedding = await this.embeddingsService.generate(q);
        questionEmbeddings.push({
          text: q,
          embedding,
        });
      }

      const result = await this.vectorStoreService.addDocument(
        title,
        docBody,
        category as KnowledgeCategory,
        questionEmbeddings,
        answers
      );

      return res.status(201).json({
        success: true,
        message: 'Đã thêm tài liệu vào cơ sở tri thức RAG thành công.',
        documentId: result.id,
      });
    } catch (err: any) {
      console.error('[rag/addDocument]', err);
      return res.status(500).json({ error: err.message || 'Không thể lưu tài liệu RAG.' });
    }
  };

  /**
   * Traditional prompt builder query endpoint
   */
  query = async (req: AuthRequest, res: Response) => {
    try {
      const { query, category, topK } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'query (câu hỏi truy vấn) không được để trống.' });
      }

      if (category && !['culture', 'festival', 'food', 'history', 'destination'].includes(category)) {
        return res.status(400).json({ error: 'category nếu có phải là culture, festival, food, history hoặc destination.' });
      }

      const limit = topK ? parseInt(topK as any) : 3;
      const docs = await this.retrieverService.retrieve(query, category as KnowledgeCategory, limit);
      const prompt = this.promptBuilderService.build(query, docs);

      return res.json({
        query,
        retrievedDocuments: docs,
        prompt,
      });
    } catch (err: any) {
      console.error('[rag/query]', err);
      return res.status(500).json({ error: err.message || 'Không thể truy vấn RAG.' });
    }
  };

  /**
   * Production-ready Enterprise RAG Pipeline Query Endpoint
   */
  queryEnterprise = async (req: AuthRequest, res: Response) => {
    try {
      const { query, category, topK, messageId: explicitMessageId } = req.body;
      const userId = req.user?.sub;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'query (câu hỏi truy vấn) không được để trống.' });
      }

      if (!userId) {
        return res.status(401).json({ error: 'Không xác định được danh tính người dùng.' });
      }

      const resolvedMessageId = await this.ensureMessageId(userId, explicitMessageId);
      const limit = topK ? parseInt(topK as any) : 4;

      const result = await this.orchestratorService.execute({
        messageId: resolvedMessageId,
        query,
        category,
        topK: limit,
        requestId: req.headers['x-request-id'] as string,
      });

      return res.json({
        success: true,
        messageId: resolvedMessageId,
        data: result,
      });
    } catch (err: any) {
      console.error('[rag/queryEnterprise]', err);
      return res.status(500).json({ error: err.message || 'Lỗi xử lý luồng Enterprise RAG.' });
    }
  };
}
