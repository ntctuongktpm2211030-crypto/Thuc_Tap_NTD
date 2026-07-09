import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

const localEnvPath = path.resolve(__dirname, '../.env');
const backendEnvPath = path.resolve(__dirname, '../../backend/.env');

import { downloadWikipedia } from './download/wikipedia';
import { downloadWikidata } from './download/wikidata';
import { downloadOpenStreetMap } from './download/openstreetmap';
import { downloadHuggingFace } from './download/huggingface';
import { downloadGeoNames } from './download/geonames';
import { downloadUNESCO } from './download/unesco';
import { normalizePlace } from './normalize/place';
import { normalizeFood } from './normalize/food';
import { normalizeCulture } from './normalize/culture';
import { normalizeHistory } from './normalize/history';
import { generateKnowledgeProfile } from './generate/profile';
import { generateQaPairsBatch, QaPair } from './generate/qa-pairs';
import { migrateItem } from './migration/postgres';
import { checkVectorExtension } from './migration/pgvector';
import { prisma } from './db';

const BULK_ITEMS = [
  // Tuyến du lịch miền Bắc
  { query: 'Hồ Hoàn Kiếm Hà Nội', category: 'destination' },
  { query: 'Vịnh Hạ Long Quảng Ninh', category: 'destination' },
  { query: 'Đỉnh Fansipan Sa Pa', category: 'destination' },
  { query: 'Quần thể danh thắng Tràng An Ninh Bình', category: 'destination' },
  { query: 'Cao nguyên đá Đồng Văn Hà Giang', category: 'destination' },
  { query: 'Vườn quốc gia Cát Bà Hải Phòng', category: 'destination' },
  
  // Tuyến du lịch miền Trung
  { query: 'Quần thể di tích Cố đô Huế', category: 'destination' },
  { query: 'Phố cổ Hội An Quảng Nam', category: 'destination' },
  { query: 'Bà Nà Hills Đà Nẵng', category: 'destination' },
  { query: 'Vườn quốc gia Phong Nha Kẻ Bàng Quảng Bình', category: 'destination' },
  { query: 'Bãi biển Nha Trang Khánh Hòa', category: 'destination' },
  { query: 'Hồ Xuân Hương Đà Lạt Lâm Đồng', category: 'destination' },
  { query: 'Mũi Né Phan Thiết Bình Thuận', category: 'destination' },
  
  // Tuyến du lịch miền Nam
  { query: 'Chợ Bến Thành Sài Gòn', category: 'destination' },
  { query: 'Bãi Sau Vũng Tàu Bà Rịa Vũng Tàu', category: 'destination' },
  { query: 'Chợ nổi Cái Răng Cần Thơ', category: 'destination' },
  { query: 'Đảo Ngọc Phú Quốc Kiên Giang', category: 'destination' },
  
  // Ẩm thực 3 miền
  { query: 'Phở bò Hà Nội', category: 'food' },
  { query: 'Bún chả Hà Nội', category: 'food' },
  { query: 'Bánh mì Sài Gòn', category: 'food' },
  { query: 'Mì Quảng Đà Nẵng', category: 'food' },
  { query: 'Bún bò Huế', category: 'food' },
  { query: 'Cơm tấm Sài Gòn', category: 'food' },
  { query: 'Bánh khọt Vũng Tàu', category: 'food' },
  { query: 'Lẩu mắm Cần Thơ', category: 'food' },
  { query: 'Bánh tráng nướng Đà Lạt', category: 'food' },
  
  // Lịch sử & Lễ hội văn hóa
  { query: 'Địa đạo Củ Chi lịch sử', category: 'history' },
  { query: 'Lịch sử Chiến thắng Điện Biên Phủ', category: 'history' },
  { query: 'Lễ hội chùa Hương Mỹ Đức', category: 'festival' },
  { query: 'Lễ hội Đền Hùng Phú Thọ', category: 'festival' }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[DEBUG IN MAIN] __dirname:`, __dirname);
  console.log(`[DEBUG IN MAIN] localEnvPath:`, localEnvPath, 'Exists:', fs.existsSync(localEnvPath));
  console.log(`[DEBUG IN MAIN] backendEnvPath:`, backendEnvPath, 'Exists:', fs.existsSync(backendEnvPath));
  console.log(`[DEBUG IN MAIN] OPENAI_API_KEY length:`, process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log(`[DEBUG IN MAIN] OPENAI_API_KEY value:`, process.env.OPENAI_API_KEY);

  console.log(`🚀 Bắt đầu chạy BULK SYNC tri thức du lịch Việt Nam mở rộng...`);
  console.log(`- Tổng số danh mục cần cào và đồng bộ: ${BULK_ITEMS.length} cụm`);

  const hasVector = await checkVectorExtension();
  if (!hasVector) {
    console.warn('⚠️ Cảnh báo: DB chưa bật pgvector extension.');
  }

  let successTotal = 0;

  for (let i = 0; i < BULK_ITEMS.length; i++) {
    const item = BULK_ITEMS[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[${i + 1}/${BULK_ITEMS.length}] Đang xử lý: "${item.query}" (${item.category})`);
    
    try {
      const rawDataList: any[] = [];
      
      const wiki = await downloadWikipedia(item.query);
      if (wiki) rawDataList.push(wiki);
      
      const wd = await downloadWikidata(item.query);
      if (wd) rawDataList.push(wd);

      const osm = await downloadOpenStreetMap(item.query);
      if (osm) rawDataList.push(osm);

      if (rawDataList.length === 0) {
        console.warn(`⚠️ Không cào được dữ liệu thô cho "${item.query}". Bỏ qua.`);
        continue;
      }

      const normalizedItems: any[] = [];
      for (const raw of rawDataList) {
        let items: any[] = [];
        if (item.category === 'destination') {
          items = normalizePlace(raw);
        } else if (item.category === 'food') {
          items = normalizeFood(raw);
        } else if (item.category === 'culture' || item.category === 'festival') {
          items = normalizeCulture(raw);
        } else if (item.category === 'history') {
          items = normalizeHistory(raw);
        }
        normalizedItems.push(...items);
      }

      for (const norm of normalizedItems) {
        console.log(`-> Đang tạo Profile 15 phần cho: "${norm.title}"`);
        const profileBody = await generateKnowledgeProfile(norm.body, norm.title, norm.category);

        console.log(`-> Đang sinh 100 câu hỏi và câu trả lời trong 5 đợt (mỗi đợt 20 cặp)...`);
        const qaPairs: QaPair[] = [];
        const batchCount = 5;
        const size = 20;

        for (let b = 0; b < batchCount; b++) {
          console.log(`   * Đang sinh đợt ${b + 1}/${batchCount}...`);
          const batch = await generateQaPairsBatch(profileBody, norm.category, norm.title, size, b);
          qaPairs.push(...batch);
        }

        console.log(`-> Đang đồng bộ cụm tri thức vào PostgreSQL...`);
        await migrateItem(norm.title, profileBody, norm.category, qaPairs);
      }

      successTotal++;
      console.log(`✅ Đồng bộ xong cụm: "${item.query}"`);
      
      console.log(`⏳ Nghỉ 3 giây trước khi cào địa điểm tiếp theo...`);
      await delay(3000);
      
    } catch (error) {
      console.error(`❌ Lỗi xử lý cụm "${item.query}":`, error);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🌟 ĐÃ HOÀN THÀNH BULK SYNC VIỆT NAM!`);
  console.log(`- Thành công: ${successTotal}/${BULK_ITEMS.length} cụm tri thức chính.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Lỗi tiến trình Bulk Sync:', err);
  await prisma.$disconnect();
});
