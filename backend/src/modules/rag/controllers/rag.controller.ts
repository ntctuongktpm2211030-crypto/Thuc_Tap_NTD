import { Request, Response } from 'express';
import { EmbeddingsService } from '../services/embeddings.service';
import { VectorStoreService } from '../services/vector-store.service';
import { RetrieverService } from '../services/retriever.service';
import { PromptBuilderService } from '../services/prompt-builder.service';
import { KnowledgeCategory } from '../types/rag.types';

export class RagController {
  private embeddingsService: EmbeddingsService;
  private vectorStoreService: VectorStoreService;
  private retrieverService: RetrieverService;
  private promptBuilderService: PromptBuilderService;

  constructor() {
    // Dependency Injection
    this.embeddingsService = new EmbeddingsService();
    this.vectorStoreService = new VectorStoreService();
    this.retrieverService = new RetrieverService(this.embeddingsService, this.vectorStoreService);
    this.promptBuilderService = new PromptBuilderService();
  }

  addDocument = async (req: Request, res: Response) => {
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

      // Xử lý fallback cho questions và answers
      const questions: string[] = Array.isArray(reqQuestions) && reqQuestions.length > 0 
        ? reqQuestions.map(q => String(q).trim()).filter(Boolean)
        : [title];

      const answers: string[] = Array.isArray(reqAnswers) && reqAnswers.length > 0
        ? reqAnswers.map(a => String(a).trim()).filter(Boolean)
        : [docBody];

      // 1. Sinh vector embedding cho từng câu hỏi mẫu
      const questionEmbeddings: { text: string; embedding: number[] }[] = [];
      for (const q of questions) {
        const embedding = await this.embeddingsService.generate(q);
        questionEmbeddings.push({
          text: q,
          embedding,
        });
      }

      // 2. Lưu vào DB thông qua VectorStoreService quan hệ
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

  query = async (req: Request, res: Response) => {
    try {
      const { query, category, topK } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'query (câu hỏi truy vấn) không được để trống.' });
      }

      if (category && !['culture', 'festival', 'food', 'history', 'destination'].includes(category)) {
        return res.status(400).json({ error: 'category nếu có phải là culture, festival, food, history hoặc destination.' });
      }

      const limit = topK ? parseInt(topK as any) : 3;

      // 1. Truy xuất tài liệu ngữ cảnh
      const docs = await this.retrieverService.retrieve(query, category as KnowledgeCategory, limit);

      // 2. Xây dựng prompt tổng hợp
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
}
