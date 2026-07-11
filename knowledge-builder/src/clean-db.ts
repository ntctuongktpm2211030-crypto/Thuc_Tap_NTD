import { prisma } from './db';

function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const keywords = [
  'phú quốc', 'phụ quốc', 'hòn khô', 'cô tô', 'núi cấm', 'núi sam', 'núi mây',
  'cáp treo', 'thác', 'đèo', 'lặn biển', 'trường sa', 'hoàng sa', 'ngọc điểm',
  'ngũ hành', 'trà sư', 'tắm biển'
];

async function main() {
  console.log('🧹 Đang quét cơ sở dữ liệu để tìm và xóa các bản ghi tri thức sai lệch...');
  
  const allContents = await prisma.knowledgeContent.findMany();
  console.log(`📊 Tổng số bản ghi hiện có trong database: ${allContents.length}`);

  let deletedCount = 0;

  for (const item of allContents) {
    const titleClean = removeAccents(item.title.toLowerCase());
    const bodyClean = removeAccents(item.body.toLowerCase());

    // 1. Kiểm tra từ khóa cấm
    const hasBadKeyword = keywords.some(term => {
      const termClean = removeAccents(term.toLowerCase());
      return titleClean.includes(termClean) || bodyClean.includes(termClean);
    });

    // 2. Kiểm tra từ "núi" đứng riêng lẻ
    let hasBadMountain = false;
    if (titleClean.includes('nui') || /\bnui\b/i.test(bodyClean)) {
      if (!titleClean.includes('an giang') && !bodyClean.includes('an giang') && !bodyClean.includes('hon khoai') && !bodyClean.includes('hon da bac')) {
        hasBadMountain = true;
      }
    }

    if (hasBadKeyword || hasBadMountain) {
      console.log(`🗑️ Đang xóa bản ghi: "${item.title}"`);
      await prisma.knowledgeContent.delete({
        where: { id: item.id }
      });
      deletedCount++;
    }
  }

  console.log(`\n🎉 Hoàn thành dọn dẹp cơ sở dữ liệu!`);
  console.log(`- Đã xóa thành công ${deletedCount} bản ghi tri thức sai lệch (bao gồm cả các câu hỏi/câu trả lời liên quan nhờ quan hệ Cascade).`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Lỗi khi dọn dẹp DB:', err);
  prisma.$disconnect();
});
