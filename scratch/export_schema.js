const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Định nghĩa các đường dẫn tuyệt đối
const schemaPath = path.resolve(__dirname, '../backend/prisma/schema.prisma');
const outputDirDocs = path.resolve(__dirname, '../docs/Database');
const outputDirUmlDocs = path.resolve(__dirname, '../docs/uml/Database');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(outputDirDocs)) {
  fs.mkdirSync(outputDirDocs, { recursive: true });
}
if (!fs.existsSync(outputDirUmlDocs)) {
  fs.mkdirSync(outputDirUmlDocs, { recursive: true });
}

const outputPathDocs = path.join(outputDirDocs, 'schema.sql');
const outputPathUmlDocs = path.join(outputDirUmlDocs, 'schema.sql');

// Lệnh prisma sinh SQL từ schema.prisma
const command = `npx prisma migrate diff --from-empty --to-schema "${schemaPath}" --script`;

console.log('Đang chạy lệnh:', command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Lỗi khi chạy lệnh:', error);
    console.error(stderr);
    return;
  }
  
  // Ghi kết quả ra tệp tin
  fs.writeFileSync(outputPathDocs, stdout, 'utf-8');
  fs.writeFileSync(outputPathUmlDocs, stdout, 'utf-8');
  
  console.log('Xuất thành công cấu trúc CSDL SQL ra tệp tin:');
  console.log(`- ${outputPathDocs}`);
  console.log(`- ${outputPathUmlDocs}`);
});
