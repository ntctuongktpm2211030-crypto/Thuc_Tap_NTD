import crypto from 'crypto';
import prisma from '../../../config/db';
import { KnowledgeCategory, RetrievedDoc } from '../types/rag.types';

export class VectorStoreService {
  /**
   * Lưu tài liệu kiến thức (Content), nhiều câu hỏi (Questions) kèm theo vector embedding, và nhiều câu trả lời (Answers) vào DB
   */
  async addDocument(
    title: string,
    body: string,
    category: KnowledgeCategory,
    questions: { text: string; embedding: number[] }[],
    answers: string[]
  ) {
    // 1. Tạo Content và các Answers bằng Prisma Client chuẩn
    const content = await prisma.knowledgeContent.create({
      data: {
        title,
        body,
        category,
        answers: {
          create: answers.map((ans) => ({
            answerText: ans,
          })),
        },
      },
    });

    // 2. Tạo các Questions kèm theo vector embedding bằng SQL raw
    for (const q of questions) {
      const questionId = crypto.randomUUID();
      const vectorString = `[${q.embedding.join(',')}]`;

      if (q.embedding.length === 1536) {
        await prisma.$executeRaw`
          INSERT INTO "KnowledgeQuestion" ("id", "contentId", "questionText", "embeddingOpenAI", "embeddingLocal", "createdAt", "updatedAt")
          VALUES (${questionId}, ${content.id}, ${q.text}, ${vectorString}::vector, NULL, NOW(), NOW())
        `;
      } else if (q.embedding.length === 128) {
        await prisma.$executeRaw`
          INSERT INTO "KnowledgeQuestion" ("id", "contentId", "questionText", "embeddingOpenAI", "embeddingLocal", "createdAt", "updatedAt")
          VALUES (${questionId}, ${content.id}, ${q.text}, NULL, ${vectorString}::vector, NOW(), NOW())
        `;
      } else {
        throw new Error(`Kích thước vector embedding câu hỏi không hợp lệ: ${q.embedding.length}`);
      }
    }

    return {
      id: content.id,
      title,
      body,
      category,
    };
  }

  /**
   * Truy vấn tìm kiếm các tài liệu tương đồng ngữ nghĩa nhất bằng cách so khớp câu hỏi qua pgvector
   */
  async search(queryEmbedding: number[], category?: KnowledgeCategory, topK: number = 3): Promise<RetrievedDoc[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const limit = topK;

    let results: any[] = [];

    if (queryEmbedding.length === 1536) {
      if (category) {
        results = await prisma.$queryRaw<any[]>`
          SELECT q."contentId", MAX(1 - (q."embeddingOpenAI" <=> ${vectorString}::vector)) AS "score"
          FROM "KnowledgeQuestion" q
          JOIN "KnowledgeContent" c ON q."contentId" = c."id"
          WHERE c."category" = ${category} AND q."embeddingOpenAI" IS NOT NULL
          GROUP BY q."contentId"
          ORDER BY "score" DESC
          LIMIT ${limit}
        `;
      } else {
        results = await prisma.$queryRaw<any[]>`
          SELECT q."contentId", MAX(1 - (q."embeddingOpenAI" <=> ${vectorString}::vector)) AS "score"
          FROM "KnowledgeQuestion" q
          WHERE q."embeddingOpenAI" IS NOT NULL
          GROUP BY q."contentId"
          ORDER BY "score" DESC
          LIMIT ${limit}
        `;
      }
    } else if (queryEmbedding.length === 128) {
      if (category) {
        results = await prisma.$queryRaw<any[]>`
          SELECT q."contentId", MAX(1 - (q."embeddingLocal" <=> ${vectorString}::vector)) AS "score"
          FROM "KnowledgeQuestion" q
          JOIN "KnowledgeContent" c ON q."contentId" = c."id"
          WHERE c."category" = ${category} AND q."embeddingLocal" IS NOT NULL
          GROUP BY q."contentId"
          ORDER BY "score" DESC
          LIMIT ${limit}
        `;
      } else {
        results = await prisma.$queryRaw<any[]>`
          SELECT q."contentId", MAX(1 - (q."embeddingLocal" <=> ${vectorString}::vector)) AS "score"
          FROM "KnowledgeQuestion" q
          WHERE q."embeddingLocal" IS NOT NULL
          GROUP BY q."contentId"
          ORDER BY "score" DESC
          LIMIT ${limit}
        `;
      }
    } else {
      throw new Error(`Kích thước vector truy vấn không hợp lệ: ${queryEmbedding.length}`);
    }

    const docs: RetrievedDoc[] = [];

    for (const r of results) {
      const content = await prisma.knowledgeContent.findUnique({
        where: { id: r.contentId },
        include: { answers: true },
      });

      if (content) {
        // Trộn nội dung gốc và câu trả lời mẫu làm content trả về cho Prompt Builder
        const answersText = content.answers.map((a) => `- ${a.answerText}`).join('\n');
        const fullContent = `${content.body}\n\nCác câu trả lời mẫu:\n${answersText}`;

        docs.push({
          id: content.id,
          title: content.title,
          content: fullContent,
          category: content.category,
          score: r.score !== null ? Number(r.score) : 0,
          similarity: r.score !== null ? Number(r.score) : 0,
        });
      }
    }

    return docs;
  }

  /**
   * Hybrid Search: Kết hợp Vector Similarity Search và Full Text Substring Search,
   * sau đó hợp nhất kết quả bằng thuật toán Reciprocal Rank Fusion (RRF).
   */
  async searchHybrid(query: string, queryEmbedding: number[], category?: KnowledgeCategory, topK: number = 4): Promise<RetrievedDoc[]> {
    // 1. Chạy Vector Search lấy tối đa 5 kết quả
    const vectorDocs = await this.search(queryEmbedding, category, 5);

    // 2. Chạy Keyword Search (Substring matching) lấy tối đa 5 kết quả
    const cleanQuery = query.toLowerCase();
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    
    const dbTextDocs = await prisma.knowledgeContent.findMany({
      where: {
        category: category || undefined,
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { body: { contains: query, mode: 'insensitive' as const } },
          ...words.map(w => ({
            body: { contains: w, mode: 'insensitive' as const }
          }))
        ]
      },
      include: { answers: true },
      take: 5
    });

    const textDocs: RetrievedDoc[] = dbTextDocs.map(content => {
      const answers = (content as any).answers || [];
      const answersText = answers.map((a: any) => `- ${a.answerText}`).join('\n');
      const fullContent = `${content.body}\n\nCác câu trả lời mẫu:\n${answersText}`;
      return {
        id: content.id,
        title: content.title,
        content: fullContent,
        category: content.category as KnowledgeCategory,
        score: 0.5
      };
    });

    // 3. Áp dụng Reciprocal Rank Fusion (RRF)
    const rrfMap = new Map<string, { doc: RetrievedDoc; rrfScore: number }>();
    const k = 60; // Hằng số RRF tiêu chuẩn

    vectorDocs.forEach((doc, rank) => {
      const current = rrfMap.get(doc.id) || { doc, rrfScore: 0 };
      current.rrfScore += 1 / (k + (rank + 1));
      rrfMap.set(doc.id, current);
    });

    textDocs.forEach((doc, rank) => {
      const current = rrfMap.get(doc.id) || { doc, rrfScore: 0 };
      current.rrfScore += 1 / (k + (rank + 1));
      rrfMap.set(doc.id, current);
    });

    // Sắp xếp giảm dần theo rrfScore và lấy topK
    const fused = Array.from(rrfMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topK)
      .map(item => {
        item.doc.score = item.rrfScore;
        if (item.doc.similarity === undefined) {
          item.doc.similarity = 0.5;
        }
        return item.doc;
      });

    return fused;
  }
}


