import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

import { migrateItem } from './migration/postgres';
import { prisma } from './db';
import { QaPair } from './generate/qa-pairs';

async function verify() {
  const testTitle = "Địa Danh Kiểm Thử Cắt Phân Đoạn";
  const testCategory = "destination";
  
  const mockProfileBody = `
### 1. Tổng quan
Đây là phần tổng quan của địa danh kiểm thử cắt phân đoạn. Địa danh này rất đẹp và nổi tiếng.

### 7. Món ăn đặc sản
Đến đây bạn nên thử ăn bánh tằm cay và cua hấp. Đây là các món đặc sản ẩm thực tuyệt vời.

### 11. Hướng dẫn di chuyển
Bạn có thể di chuyển bằng xe khách từ thành phố lớn hoặc phượt bằng xe máy để ngắm cảnh.
`;

  const mockQaPairs: QaPair[] = [
    {
      question: "Địa danh kiểm thử này có gì đẹp?",
      similarQuestion: "Giới thiệu tổng quan về địa danh kiểm thử?",
      answer: "Địa danh này rất đẹp và nổi tiếng với cảnh quan thiên nhiên hoang sơ.",
      intent: "ask_general_info",
      keywords: ["kiem thu", "tong quan"],
      tags: ["destination"],
      section: "Tổng quan"
    },
    {
      question: "Đến địa danh này ăn món gì ngon?",
      similarQuestion: "Đặc sản ẩm thực ở đây là gì?",
      answer: "Đặc sản ở đây gồm bánh tằm cay và cua hấp nổi tiếng.",
      intent: "ask_food",
      keywords: ["kiem thu", "an gi", "dac san"],
      tags: ["food"],
      section: "Món ăn đặc sản"
    }
  ];

  console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ SEMANTIC CHUNKING ===");
  
  try {
    // 1. Chạy hàm migrateItem để đồng bộ dữ liệu vào DB
    console.log("-> Đang chạy migrateItem...");
    await migrateItem(testTitle, mockProfileBody, testCategory, mockQaPairs);
    
    // 2. Truy vấn dữ liệu từ DB để đối chiếu kết quả
    console.log("-> Đang đối chiếu dữ liệu trong database...");
    
    const chunks = await prisma.knowledgeContent.findMany({
      where: {
        title: { startsWith: `${testTitle} - ` }
      },
      include: {
        questions: true,
        answers: true
      }
    });

    console.log(`\nTìm thấy ${chunks.length} phân đoạn trong DB.`);
    
    if (chunks.length !== 3) {
      throw new Error(`Lỗi: Mong đợi 3 phân đoạn nhưng thực tế tìm thấy ${chunks.length}`);
    }

    for (const chunk of chunks) {
      console.log(`\n[Phân đoạn] Tiêu đề: "${chunk.title}"`);
      console.log(`- Category: "${chunk.category}"`);
      console.log(`- Số lượng câu hỏi mẫu: ${chunk.questions.length}`);
      console.log(`- Số lượng đáp án mẫu: ${chunk.answers.length}`);
      
      // Kiểm tra chuyển đổi category động
      if (chunk.title.includes("Món ăn đặc sản")) {
        if (chunk.category !== "food") {
          throw new Error(`Lỗi: Phân đoạn Món ăn đặc sản đáng lẽ phải có category là 'food' nhưng nhận được: '${chunk.category}'`);
        }
        if (chunk.questions.length === 0) {
          throw new Error("Lỗi: Không tìm thấy câu hỏi được liên kết cho phân đoạn đặc sản.");
        }
      }
      
      if (chunk.title.includes("Tổng quan")) {
        if (chunk.category !== "destination") {
          throw new Error(`Lỗi: Phân đoạn Tổng quan đáng lẽ phải giữ nguyên category 'destination'`);
        }
      }

      if (chunk.title.includes("Hướng dẫn di chuyển")) {
        // Phân đoạn này không có QA pair được gán thủ công, kiểm tra xem có câu hỏi mặc định không
        if (chunk.questions.length === 0) {
          throw new Error("Lỗi: Phân đoạn Hướng dẫn di chuyển không có câu hỏi mặc định tự sinh.");
        }
        console.log(`  (Đã tự sinh câu hỏi mặc định: "${chunk.questions[0].questionText}")`);
      }
    }

    console.log("\n✅ KIỂM THỬ THÀNH CÔNG: Mọi phân đoạn được cắt và lưu trữ chính xác!");

  } catch (err) {
    console.error("❌ KIỂM THỬ THẤT BẠI:", err);
  } finally {
    // 3. Dọn dẹp dữ liệu kiểm thử
    console.log("\n-> Đang dọn dẹp dữ liệu kiểm thử trong DB...");
    const existingChunks = await prisma.knowledgeContent.findMany({
      where: {
        title: { startsWith: `${testTitle} - ` }
      }
    });
    for (const chunk of existingChunks) {
      await prisma.knowledgeContent.delete({
        where: { id: chunk.id }
      });
    }
    console.log("🧹 Đã làm sạch dữ liệu kiểm thử.");
    await prisma.$disconnect();
  }
}

verify().catch(console.error);
