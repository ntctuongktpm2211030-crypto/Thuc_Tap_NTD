import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import prisma, { withDbRetry } from '../config/db';

interface ChunkItem {
  id?: string;
  title: string;
  content: string;
  category?: string;
  province?: string;
  subCategory?: string;
  metadata?: any;
}

async function seedChunkFile(filename: string, defaultCategory: string) {
  const filePath = path.resolve(__dirname, `../../../knowledge-builder/chunks/${filename}`);
  if (!fs.existsSync(filePath)) {
    console.warn(`❌ Không tìm thấy tệp chunk: ${filePath}`);
    return 0;
  }

  console.log(`\n⏳ Đang đọc và nạp tệp: ${filename}...`);
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const items: ChunkItem[] = JSON.parse(rawText);
  console.log(`📄 Tìm thấy ${items.length} bản ghi trong ${filename}.`);

  let count = 0;
  for (const item of items) {
    if (!item.title || !item.content) continue;

    const category = item.category || defaultCategory;
    try {
      const existing = await withDbRetry(() => prisma.knowledgeContent.findFirst({
        where: { title: item.title }
      }));

      let contentId = existing?.id;
      if (existing) {
        await withDbRetry(() => prisma.knowledgeContent.update({
          where: { id: existing.id },
          data: {
            body: item.content,
            category: category,
          }
        }));
      } else {
        const newDoc = await withDbRetry(() => prisma.knowledgeContent.create({
          data: {
            title: item.title,
            body: item.content,
            category: category,
          }
        }));
        contentId = newDoc.id;
      }

      if (contentId) {
        const questionText = `Thông tin chi tiết về ${item.title} là gì?`;
        const existingQ = await withDbRetry(() => prisma.knowledgeQuestion.findFirst({
          where: { contentId, questionText }
        }));
        if (!existingQ) {
          await withDbRetry(() => prisma.knowledgeQuestion.create({
            data: {
              contentId,
              questionText
            }
          }));
        }

        const existingA = await withDbRetry(() => prisma.knowledgeAnswer.findFirst({
          where: { contentId }
        }));
        if (!existingA) {
          await withDbRetry(() => prisma.knowledgeAnswer.create({
            data: {
              contentId,
              answerText: item.content
            }
          }));
        }
      }
      count++;
    } catch (err: any) {
      console.warn(`⚠️ Bỏ qua ${item.title}: ${err.message}`);
    }
  }

  console.log(`✅ Hoàn thành tệp ${filename}: Nạp thành công ${count}/${items.length} bản ghi vào CSDL.`);
  return count;
}

async function main() {
  console.log('🚀 BẮT ĐẦU NẠP TOÀN BỘ CHUNKS CẨM NANG TRI THỨC VÀO POSTGRESQL CSDL RAG...');

  const c1 = await seedChunkFile('014_VIỆT_NAM.json', 'culture');
  const c2 = await seedChunkFile('017_-_THÀNH_PHỐ.json', 'destination');
  const c3 = await seedChunkFile('018_THOI_DIEM_DU_LICH_63_TINH.json', 'season');
  const c4 = await seedChunkFile('019_AM_THUC_DAC_SAN_63_TINH.json', 'food');

  console.log(`\n🎉 TỔNG KẾT: Đã nạp tổng cộng ${c1 + c2 + c3 + c4} bản ghi tri thức vào CSDL RAG cho Chatbot!`);
}

main().catch(console.error);
