const fs = require('fs');
const path = require('path');

function removeAccents(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const filePath = path.resolve(__dirname, 'import-data-camau.json');
console.log('📖 Đang đọc file:', filePath);

if (!fs.existsSync(filePath)) {
  console.error('❌ Không tìm thấy file import-data-camau.json');
  process.exit(1);
}

const rawData = fs.readFileSync(filePath, 'utf-8');
const data = JSON.parse(rawData);

const keywords = [
  'phú quốc', 'phụ quốc', 'hòn khô', 'cô tô', 'núi cấm', 'núi sam', 'núi mây',
  'cáp treo', 'thác', 'đèo', 'lặn biển', 'trường sa', 'hoàng sa', 'ngọc điểm',
  'ngũ hành', 'trà sư', 'tắm biển'
];

const cleanData = data.filter((item, index) => {
  const titleClean = removeAccents(item.title.toLowerCase());
  const contentClean = removeAccents(item.content.toLowerCase());

  // 1. Kiểm tra từ khóa cấm
  const hasBadKeyword = keywords.some(term => {
    const termClean = removeAccents(term.toLowerCase());
    const isBad = titleClean.includes(termClean) || contentClean.includes(termClean);
    if (isBad) {
      console.log(`🗑️ Đang xóa bản ghi #${index + 1}: "${item.title}" - Lý do: Chứa từ khóa "${term}"`);
    }
    return isBad;
  });
  if (hasBadKeyword) return false;

  // 2. Kiểm tra từ "núi" đứng riêng lẻ
  if (titleClean.includes('nui') || /\bnui\b/i.test(contentClean)) {
    if (!titleClean.includes('an giang') && !contentClean.includes('an giang') && !contentClean.includes('hon khoai') && !contentClean.includes('hon da bac')) {
      console.log(`🗑️ Đang xóa bản ghi #${index + 1}: "${item.title}" - Lý do: Mô tả núi đồi giả tưởng`);
      return false;
    }
  }

  return true;
});

const deletedCount = data.length - cleanData.length;
fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');

console.log(`\n🎉 Đã dọn dẹp xong!`);
console.log(`- Số bản ghi gốc: ${data.length}`);
console.log(`- Số bản ghi đã xóa: ${deletedCount}`);
console.log(`- Số bản ghi sạch còn lại: ${cleanData.length}`);
