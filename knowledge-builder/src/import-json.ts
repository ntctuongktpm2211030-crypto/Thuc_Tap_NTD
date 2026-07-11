import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

import { generateKnowledgeProfile } from './generate/profile';
import { generateQaPairsBatch, QaPair } from './generate/qa-pairs';
import { migrateItem } from './migration/postgres';
import { checkVectorExtension } from './migration/pgvector';
import { prisma } from './db';

function parseArgs() {
  const args: any = {};
  process.argv.slice(2).forEach(val => {
    if (val.startsWith('--')) {
      const [key, value] = val.split('=');
      const cleanKey = key.replace('--', '');
      args[cleanKey] = value ? value.replace(/['"]/g, '') : true;
    }
  });
  return args;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();
  const fileArg = args.file || 'import-data-camau.json';
  const limitQuestions = args.questions ? parseInt(args.questions) : 100; // Mặc định sinh 100 câu hỏi, hoặc có thể giảm xuống để tiết kiệm token
  const isFast = !!args.fast;
  const isForce = !!args.force;
  const isClear = !!args.clear;

  console.log(`🚀 Bắt đầu nhập dữ liệu tri thức từ file JSON...`);
  console.log(`- Nguồn khai báo: ${fileArg}`);
  console.log(`- Số lượng Q&A sinh cho mỗi tài liệu: ${limitQuestions}`);
  console.log(`- Chế độ nạp nhanh (không gọi AI): ${isFast}`);
  console.log(`- Xóa sạch DB trước khi nạp: ${isClear}`);

  // 1. Thực hiện xóa sạch DB nếu có yêu cầu
  if (isClear) {
    console.log('🧹 Đang xóa sạch toàn bộ dữ liệu tri thức cũ trong database...');
    // Xóa bảng KnowledgeContent sẽ tự động xóa cascade các bảng liên quan (KnowledgeQuestion, KnowledgeAnswer)
    await prisma.knowledgeContent.deleteMany();
    console.log('✅ Đã xóa sạch dữ liệu tri thức thành công!');
  }

  // 2. Kiểm tra pgvector
  const hasVector = await checkVectorExtension();
  if (!hasVector) {
    console.warn('⚠️ Cảnh báo: DB chưa kích hoạt pgvector extension.');
  }

  const filePaths = (fileArg as string).split(',').map((f: string) => f.trim());
  let items: any[] = [];

  for (const fPath of filePaths) {
    const fullPath = path.resolve(process.cwd(), fPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Lỗi: Không tìm thấy đường dẫn "${fullPath}". Bỏ qua.`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Nếu là thư mục, đọc toàn bộ file .json bên trong
      const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.json'));
      console.log(`📂 Phát hiện Thư mục. Đang quét các file .json trong: ${fullPath} (Tìm thấy ${files.length} file)`);
      
      for (const file of files) {
        const subPath = path.join(fullPath, file);
        try {
          const fileContent = fs.readFileSync(subPath, 'utf8');
          const parsed = JSON.parse(fileContent);
          if (Array.isArray(parsed)) {
            items.push(...parsed);
            console.log(`   + Đọc thành công ${parsed.length} mục từ file: ${file}`);
          } else {
            console.warn(`   ⚠️ File ${file} không chứa mảng JSON hợp lệ. Bỏ qua.`);
          }
        } catch (err: any) {
          console.error(`   ❌ Lỗi đọc file ${file}:`, err.message);
        }
      }
    } else {
      // Nếu là file đơn lẻ
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          items.push(...parsed);
          console.log(`📄 Đọc thành công ${parsed.length} mục từ file: ${path.basename(fullPath)}`);
        } else {
          console.warn(`⚠️ Đường dẫn "${fPath}" không chứa mảng JSON hợp lệ.`);
        }
      } catch (err: any) {
        console.error(`❌ Lỗi đọc file ${fPath}:`, err.message);
      }
    }
  }

  if (items.length === 0) {
    console.error('❌ Không tìm thấy dữ liệu tri thức hợp lệ để nạp.');
    console.log(`Hướng dẫn: Hãy chuẩn bị ít nhất 1 file JSON chứa danh sách mảng các đối tượng:`);
    console.log(`[
  {
    "title": "Bún quậy Phú Quốc",
    "content": "Bún quậy là món đặc sản tại Phú Quốc...",
    "category": "food"
  }
]`);
    process.exit(1);
  }

  console.log(`✅ Tổng cộng: Tìm thấy ${items.length} tài liệu sẵn sàng nạp vào hệ thống.`);

  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { title, content, category } = item;

    console.log(`\n--------------------------------------------------`);
    console.log(`[${i + 1}/${items.length}] Đang xử lý: "${title}" (${category})`);

    if (!title || !content || !category) {
      console.warn(`⚠️ Bỏ qua dòng này vì thiếu trường title, content hoặc category.`);
      continue;
    }

    if (!['destination', 'food', 'culture', 'history', 'festival'].includes(category)) {
      console.warn(`⚠️ Thể loại "${category}" không hợp lệ. Phải là một trong: destination, food, culture, history, festival. Bỏ qua.`);
      continue;
    }

    // Kiểm tra xem tiêu đề này đã được nạp vào DB chưa để bỏ qua (tiết kiệm thời gian và tài nguyên)
    if (!isForce) {
      const existing = await prisma.knowledgeContent.findFirst({
        where: { title }
      });
      if (existing) {
        console.log(`⏭️ Tài liệu "${title}" đã tồn tại trong DB. Bỏ qua (Dùng thêm cờ --force nếu muốn ghi đè).`);
        successCount++;
        continue;
      }
    }

    try {
      let profileBody = '';
      let qaPairs: QaPair[] = [];

      if (isFast) {
        console.log(`⚡ Chế độ NẠP NHANH: Sử dụng nội dung gốc trực tiếp (Không gọi Llama).`);
        profileBody = content;

        // Tách tỉnh/thành phố từ tiêu đề nếu có dạng "PROVINCE - SECTION - ITEM"
        let region = '';
        if (title.includes(' - ')) {
          region = title.split(' - ')[0].trim();
        }
        
        const regionSuffix = region ? ` ở ${region}` : '';
        const regionSuffix2 = region ? ` ${region}` : '';

        // Tạo 5 cặp câu hỏi mẫu tĩnh tối ưu dựa trên tiêu đề và thể loại
        const templates = [
          { q: `Thông tin chi tiết về ${title}?`, sq: `Giới thiệu về ${title}${regionSuffix}?` },
          { q: `Có gì đặc trưng hay nổi bật tại ${title}?`, sq: `Điểm đặc sắc thu hút của ${title} là gì?` },
          { q: `Kinh nghiệm khám phá hoặc thưởng thức ${title}?`, sq: `Cần lưu ý gì khi trải nghiệm ${title}?` },
          { q: `Vị trí hoặc nét độc đáo của ${title}${regionSuffix2}?`, sq: `Tìm hiểu về ${title}?` },
          { q: `Nguồn gốc, ẩm thực hoặc nét văn hóa gắn liền với ${title}?`, sq: `Đặc sản và văn hóa xung quanh ${title}?` }
        ];

        qaPairs = templates.map(tpl => ({
          question: tpl.q,
          similarQuestion: tpl.sq,
          answer: content, // Sử dụng trực tiếp nội dung chất lượng cao bạn đã chuẩn bị
          intent: `ask_about_${category}`,
          keywords: [title.toLowerCase(), category],
          tags: [category, title.toLowerCase()]
        }));
      } else {
        // a. Sinh Profile 15 phần từ nội dung viết sẵn của người dùng thông qua LLM
        console.log(`-> Đang dùng AI chuẩn hóa thành Hồ sơ 15 phần cho: "${title}"`);
        profileBody = await generateKnowledgeProfile(content, title, category);

        // b. Sinh các cặp câu hỏi Q&A (chia nhỏ theo các đợt 20 câu để tránh timeout)
        const batchSize = 20;
        const totalBatches = Math.max(1, Math.ceil(limitQuestions / batchSize));

        console.log(`-> Đang sinh tổng cộng ${limitQuestions} câu hỏi mẫu trong ${totalBatches} đợt...`);
        for (let b = 0; b < totalBatches; b++) {
          const countToGenerate = Math.min(batchSize, limitQuestions - b * batchSize);
          if (countToGenerate <= 0) break;

          console.log(`   * Đang sinh đợt ${b + 1}/${totalBatches} (${countToGenerate} câu hỏi)...`);
          const batch = await generateQaPairsBatch(profileBody, category, title, countToGenerate, b);
          qaPairs.push(...batch);
        }
      }

      // c. Đồng bộ lưu vào database (sẽ ghi đè nếu trùng tiêu đề)
      console.log(`-> Đang đồng bộ tài liệu và vector câu hỏi vào PostgreSQL...`);
      await migrateItem(title, profileBody, category, qaPairs, isFast);
      successCount++;
      console.log(`✅ Đã nhập thành công cụm tri thức: "${title}"`);

      // Nghỉ 3 giây để tránh kích hoạt giới hạn rate limit (chỉ cần thiết khi dùng AI, chế độ fast không cần delay)
      if (i < items.length - 1 && !isFast) {
        console.log(`⏳ Nghỉ 3 giây trước khi xử lý tài liệu tiếp theo...`);
        await delay(3000);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi đồng bộ tài liệu "${title}" thất bại:`, err.message || err);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 HOÀN THÀNH: Đã đồng bộ thành công ${successCount}/${items.length} tài liệu vào cơ sở dữ liệu RAG!`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error in import-json script:', err);
});
