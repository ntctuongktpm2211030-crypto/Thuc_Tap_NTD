import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const localEnvPath = path.resolve(__dirname, '../.env');
const backendEnvPath = path.resolve(__dirname, '../../backend/.env');

console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] localEnvPath:', localEnvPath, 'Exists:', fs.existsSync(localEnvPath));
console.log('[DEBUG] backendEnvPath:', backendEnvPath, 'Exists:', fs.existsSync(backendEnvPath));
console.log('[DEBUG] Key BEFORE dotenv:', process.env.OPENAI_API_KEY);

dotenv.config({ path: localEnvPath, override: true });
dotenv.config({ path: backendEnvPath, override: true });

console.log('[DEBUG] Key AFTER dotenv:', process.env.OPENAI_API_KEY);

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

async function main() {
  const args = parseArgs();
  const query = args.query || 'Hồ Hoàn Kiếm';
  const category = args.category || 'destination';
  const source = args.source || 'all';
  const datasetName = args.dataset || 'vietnam-tourism-qa';

  console.log(`[DEBUG IN MAIN] __dirname:`, __dirname);
  console.log(`[DEBUG IN MAIN] localEnvPath:`, localEnvPath, 'Exists:', fs.existsSync(localEnvPath));
  console.log(`[DEBUG IN MAIN] backendEnvPath:`, backendEnvPath, 'Exists:', fs.existsSync(backendEnvPath));
  console.log(`[DEBUG IN MAIN] OPENAI_API_KEY length:`, process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
  console.log(`[DEBUG IN MAIN] OPENAI_API_KEY value:`, process.env.OPENAI_API_KEY);

  console.log(`🚀 Bắt đầu chạy Offline Training Ingestion Pipeline...`);
  console.log(`- Từ khóa: "${query}"`);
  console.log(`- Thể loại: "${category}"`);
  console.log(`- Nguồn dữ liệu: "${source}"`);

  const hasVector = await checkVectorExtension();
  if (!hasVector) {
    console.warn(
      '⚠️ Cơ sở dữ liệu chưa kích hoạt extension pgvector. Hãy đảm bảo bạn đã tạo extension trước.'
    );
  }

  const rawDataList: any[] = [];

  console.log('⏳ 1. Đang tải dữ liệu thô...');
  if (source === 'all' || source === 'wikipedia') {
    const wiki = await downloadWikipedia(query);
    if (wiki) rawDataList.push(wiki);
  }
  if (source === 'all' || source === 'wikidata') {
    const wd = await downloadWikidata(query);
    if (wd) rawDataList.push(wd);
  }
  if (source === 'all' || source === 'openstreetmap') {
    const osm = await downloadOpenStreetMap(query);
    if (osm) rawDataList.push(osm);
  }
  if (source === 'all' || source === 'huggingface') {
    const hf = await downloadHuggingFace(datasetName, query);
    if (hf) rawDataList.push(hf);
  }
  if (source === 'all' || source === 'geonames') {
    const gn = await downloadGeoNames(query);
    if (gn) rawDataList.push(gn);
  }
  if (source === 'all' || source === 'unesco') {
    const un = await downloadUNESCO(query);
    if (un) rawDataList.push(un);
  }

  if (rawDataList.length === 0) {
    console.error('❌ Không tải được bất kỳ dữ liệu thô nào cho từ khóa này.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Đã cào xong dữ liệu thô. Số lượng nguồn: ${rawDataList.length}`);

  console.log('⏳ 2. Đang thực hiện chuẩn hóa dữ liệu...');
  const normalizedItems: any[] = [];
  for (const raw of rawDataList) {
    let items: any[] = [];
    if (category === 'destination') {
      items = normalizePlace(raw);
    } else if (category === 'food') {
      items = normalizeFood(raw);
    } else if (category === 'culture' || category === 'festival') {
      items = normalizeCulture(raw);
    } else if (category === 'history') {
      items = normalizeHistory(raw);
    }
    normalizedItems.push(...items);
  }

  console.log(`✅ Đã chuẩn hóa xong. Tổng số tri thức: ${normalizedItems.length}`);

  console.log('⏳ 3. Đang sinh Knowledge Profile & 100 QA cặp...');
  let successCount = 0;
  for (const item of normalizedItems) {
    try {
      console.log(`-> Đang tạo Profile 15 phần cho: "${item.title}"`);
      const profileBody = await generateKnowledgeProfile(item.body, item.title, item.category);

      console.log(`-> Đang sinh 100 câu hỏi và câu trả lời trong 5 đợt (mỗi đợt 20 cặp)...`);
      const qaPairs: QaPair[] = [];
      const batchCount = 5;
      const size = 20;

      for (let b = 0; b < batchCount; b++) {
        console.log(`   * Đang sinh đợt ${b + 1}/${batchCount}...`);
        const batch = await generateQaPairsBatch(profileBody, item.category, item.title, size, b);
        qaPairs.push(...batch);
      }

      console.log(`-> Đang ghi đè đồng bộ vào PostgreSQL...`);
      await migrateItem(item.title, profileBody, item.category, qaPairs);
      successCount++;
    } catch (err) {
      console.error(`❌ Đồng bộ cụm "${item.title}" thất bại:`, err);
    }
  }

  console.log(
    `🌟 Hoàn thành pipeline! Đồng bộ thành công: ${successCount}/${normalizedItems.length} cụm tri thức.`
  );
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('❌ Lỗi tiến trình pipeline:', err);
  await prisma.$disconnect();
  process.exit(1);
});
