import fs from 'fs';
import path from 'path';

const DEST_DIR = path.resolve(__dirname, '../config/destinations');

interface DestinationItem {
  province: string;
  title: string;
  content: string;
  category: string;
  latitude: number;
  longitude: number;
  costEstimate?: number;
  address?: string;
}

function cleanTitle(title: string): string {
  // Remove content in parentheses, e.g. "Chùa Hang (Phước Điền Tự)" -> "Chùa Hang"
  return title.replace(/\(.*?\)/g, '').replace(/["']/g, '').trim();
}

async function queryArcGIS(title: string, province: string): Promise<{ lat: number; lng: number } | null> {
  const cleanedTitle = cleanTitle(title);
  // We can try 2 query variations:
  // 1. Full title + province + Vietnam
  // 2. Full title + Vietnam (sometimes province name is already in the title)
  const queries = [
    `${cleanedTitle}, ${province}, Vietnam`,
    `${cleanedTitle}, Vietnam`
  ];

  for (const query of queries) {
    const encoded = encodeURIComponent(query);
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encoded}&maxLocations=1`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SmartTravelGeocoder/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) continue;

      const data = await res.json() as any;
      if (data && data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        // ArcGIS returns x as longitude, y as latitude
        const lng = candidate.location.x;
        const lat = candidate.location.y;
        
        // Ensure coordinates are within Vietnam boundary roughly
        if (lat >= 8.0 && lat <= 24.0 && lng >= 102.0 && lng <= 110.0) {
          return { lat, lng };
        }
      }
    } catch (err: any) {
      // Quietly try next query
    }
  }
  return null;
}

async function run() {
  console.log('🚀 Bắt đầu quét và sửa tọa độ tự động bằng ArcGIS Geocoder...');
  
  if (!fs.existsSync(DEST_DIR)) {
    console.error(`❌ Thư mục destinations không tồn tại: ${DEST_DIR}`);
    return;
  }

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json')).sort();
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (const file of files) {
    const filePath = path.join(DEST_DIR, file);
    let items: DestinationItem[] = [];
    
    try {
      items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      console.error(`❌ Lỗi đọc file ${file}:`, e.message);
      continue;
    }

    let fileUpdated = false;
    console.log(`\n📁 Đang xử lý file: ${file} (${items.length} địa điểm)`);

    for (const item of items) {
      const lat = item.latitude;
      const lng = item.longitude;
      
      // Placeholder coordinates check (10.7769, 106.7009 - Chợ Bến Thành)
      const isPlaceholder = (lat === 10.7769 && lng === 106.7009) || !lat || !lng;
      
      if (isPlaceholder) {
        totalProcessed++;
        console.log(`   🔎 Đang tìm tọa độ cho: "${item.title}" (${item.province})`);
        
        const coords = await queryArcGIS(item.title, item.province);
        
        if (coords) {
          item.latitude = parseFloat(coords.lat.toFixed(6));
          item.longitude = parseFloat(coords.lng.toFixed(6));
          console.log(`      ✅ Tìm thấy! Tọa độ mới: (${item.latitude}, ${item.longitude})`);
          totalUpdated++;
          fileUpdated = true;
        } else {
          console.log(`      ❌ Không tìm thấy tọa độ thực tế trên ArcGIS!`);
          totalFailed++;
        }
        
        // Politeness delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`   💾 Đã lưu thay đổi vào file ${file}`);
    }
  }

  console.log('\n======================================================');
  console.log('   BÁO CÁO KẾT QUẢ QUÉT TỌA ĐỘ');
  console.log('======================================================');
  console.log(`Total checked placeholders: ${totalProcessed}`);
  console.log(`Total successfully updated: ${totalUpdated}`);
  console.log(`Total failed to resolve:    ${totalFailed}`);
  console.log('======================================================');
}

run().catch(err => {
  console.error('❌ Lỗi hệ thống khi chạy script:', err);
});
