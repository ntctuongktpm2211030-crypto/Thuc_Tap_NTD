import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env'), override: true });

import { prisma } from './db';

async function search() {
  console.log("=== TRUY VẤN CƠ SỞ DỮ LIỆU ===");
  
  // 1. Tìm trong KnowledgeContent
  const knowledge = await prisma.knowledgeContent.findMany({
    where: {
      OR: [
        { title: { contains: "Hòn Đá Bạc", mode: "insensitive" } },
        { body: { contains: "Hòn Đá Bạc", mode: "insensitive" } }
      ]
    }
  });

  console.log(`\nTìm thấy ${knowledge.length} bản ghi KnowledgeContent:`);
  knowledge.forEach(k => {
    console.log(`- ID: ${k.id}`);
    console.log(`  Tiêu đề: "${k.title}"`);
    console.log(`  Danh mục: "${k.category}"`);
    console.log(`  Nội dung (150 ký tự đầu): "${k.body.substring(0, 150)}..."`);
  });

  // 2. Tìm trong Destination
  const destinations = await prisma.destination.findMany({
    where: {
      name: { contains: "Hòn Đá Bạc", mode: "insensitive" }
    }
  });

  console.log(`\nTìm thấy ${destinations.length} bản ghi Destination:`);
  destinations.forEach(d => {
    console.log(`- ID: ${d.id}`);
    console.log(`  Tên: "${d.name}"`);
    console.log(`  Địa chỉ: "${d.address}"`);
    console.log(`  Vĩ độ/Kinh độ: ${d.latitude}/${d.longitude}`);
  });

  await prisma.$disconnect();
}

search().catch(console.error);
