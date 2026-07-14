import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DEST_DIR = path.resolve(__dirname, '../config/destinations');

function run() {
  console.log('🔄 Bắt đầu khôi phục lại địa chỉ gốc từ Git (Giữ nguyên tọa độ mới)...');
  
  if (!fs.existsSync(DEST_DIR)) {
    console.error(`❌ Thư mục không tồn tại: ${DEST_DIR}`);
    return;
  }

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));
  let totalReverted = 0;

  for (const file of files) {
    const filePath = path.join(DEST_DIR, file);
    // Include the correct git root path prefix "backend/"
    const relPath = `backend/src/config/destinations/${file}`;
    
    let currentItems: any[] = [];
    try {
      currentItems = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      console.error(`❌ Lỗi đọc file hiện tại ${file}:`, e.message);
      continue;
    }
    
    let originalItems: any[] = [];
    try {
      const gitContent = execSync(`git show HEAD:${relPath}`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
      originalItems = JSON.parse(gitContent);
    } catch (e: any) {
      // If file is not in Git HEAD yet
      console.error(`❌ Không tìm thấy file trong Git HEAD: ${relPath}`);
      continue;
    }

    // Map original addresses by title
    const originalAddrMap = new Map<string, string>();
    for (const item of originalItems) {
      originalAddrMap.set(item.title, item.address || '');
    }

    let fileUpdated = false;
    for (const item of currentItems) {
      const origAddr = originalAddrMap.get(item.title);
      if (origAddr !== undefined && item.address !== origAddr) {
        item.address = origAddr;
        fileUpdated = true;
        totalReverted++;
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(currentItems, null, 2), 'utf-8');
      console.log(`   ✅ Đã khôi phục địa chỉ cho file: ${file}`);
    }
  }

  console.log(`\n🎉 Hoàn thành khôi phục ${totalReverted} trường địa chỉ gốc!`);
}

run();
