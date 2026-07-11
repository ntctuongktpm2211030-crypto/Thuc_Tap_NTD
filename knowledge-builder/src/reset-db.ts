import { prisma } from './db';

async function main() {
  console.log('🧹 Bắt đầu xóa sạch toàn bộ dữ liệu tri thức trong Database...');
  
  // Do quan hệ Cascade, khi xóa KnowledgeContent thì KnowledgeQuestion và KnowledgeAnswer liên quan sẽ tự động bị xóa theo.
  const result = await prisma.knowledgeContent.deleteMany();
  
  console.log(`✅ Đã xóa sạch thành công!`);
  console.log(`- Số lượng bản ghi nội dung (chunks) đã xóa: ${result.count}`);
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Lỗi khi thực hiện xóa sạch Database:', err);
  prisma.$disconnect();
  process.exit(1);
});
