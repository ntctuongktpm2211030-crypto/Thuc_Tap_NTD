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

const provinceCoords: Record<string, { lat: number; lng: number }> = {
  'hanoi': { lat: 21.0285, lng: 105.8542 },
  'hochiminh': { lat: 10.7769, lng: 106.7009 },
  'tphochiminh': { lat: 10.7769, lng: 106.7009 },
  'haiphong': { lat: 20.8449, lng: 106.6881 },
  'danang': { lat: 16.0544, lng: 108.2022 },
  'cantho': { lat: 10.0452, lng: 105.7469 },
  'hagiang': { lat: 22.8233, lng: 104.9836 },
  'tuyenquang': { lat: 21.8217, lng: 105.2167 },
  'caobang': { lat: 22.6686, lng: 106.2625 },
  'langson': { lat: 21.8539, lng: 106.7614 },
  'laichau': { lat: 22.3959, lng: 102.7796 },
  'laocai': { lat: 22.4856, lng: 103.9707 },
  'dienbien': { lat: 21.3855, lng: 103.0218 },
  'sonla': { lat: 21.3263, lng: 103.9167 },
  'yenbai': { lat: 21.7229, lng: 104.9112 },
  'hoabinh': { lat: 20.8173, lng: 105.3375 },
  'thainguyen': { lat: 21.5939, lng: 105.8442 },
  'backan': { lat: 22.1472, lng: 105.8347 },
  'phutho': { lat: 21.3228, lng: 105.2283 },
  'vinhphuc': { lat: 21.3089, lng: 105.6044 },
  'bacgiang': { lat: 21.2731, lng: 106.1947 },
  'bacninh': { lat: 21.1861, lng: 106.0764 },
  'quangninh': { lat: 21.0063, lng: 107.2917 },
  'haiduong': { lat: 20.9392, lng: 106.3144 },
  'hungyen': { lat: 20.6464, lng: 106.0511 },
  'thaibinh': { lat: 20.4461, lng: 106.3361 },
  'hanam': { lat: 20.5408, lng: 105.9242 },
  'namdinh': { lat: 20.4389, lng: 106.1783 },
  'ninhbinh': { lat: 20.2506, lng: 105.9744 },
  'thanhhoa': { lat: 19.8067, lng: 105.7850 },
  'nghean': { lat: 18.6734, lng: 105.6813 },
  'hatinh': { lat: 18.3428, lng: 105.9058 },
  'quangbinh': { lat: 17.4833, lng: 106.6000 },
  'quangtri': { lat: 16.7420, lng: 107.1848 },
  'thuathienhue': { lat: 16.4637, lng: 107.5908 },
  'hue': { lat: 16.4637, lng: 107.5908 },
  'quangnam': { lat: 15.5701, lng: 108.4754 },
  'quangngai': { lat: 15.1205, lng: 108.7923 },
  'binhdinh': { lat: 13.7830, lng: 109.2194 },
  'phuyen': { lat: 13.0882, lng: 110.3005 },
  'khanhhoa': { lat: 12.2388, lng: 109.1967 },
  'ninhthuan': { lat: 11.5684, lng: 108.9904 },
  'binhthuan': { lat: 10.9276, lng: 108.1072 },
  'kontum': { lat: 14.3497, lng: 107.9944 },
  'gialai': { lat: 13.9820, lng: 107.9922 },
  'daklak': { lat: 12.6861, lng: 108.0544 },
  'daknong': { lat: 12.0006, lng: 107.6845 },
  'lamdong': { lat: 11.9404, lng: 108.4583 },
  'binhphuoc': { lat: 11.5333, lng: 106.8833 },
  'tayninh': { lat: 11.3111, lng: 106.1022 },
  'binhduong': { lat: 11.1667, lng: 106.6667 },
  'dongnai': { lat: 10.9574, lng: 106.8427 },
  'bariavungtau': { lat: 10.4114, lng: 107.1358 },
  'longan': { lat: 10.5333, lng: 106.4000 },
  'dongthap': { lat: 10.3802, lng: 105.7003 },
  'angiang': { lat: 10.5312, lng: 105.1259 },
  'tiengiang': { lat: 10.4491, lng: 106.3314 },
  'kiengiang': { lat: 10.0120, lng: 105.0800 },
  'bentre': { lat: 10.2394, lng: 106.3761 },
  'vinhlong': { lat: 10.2539, lng: 105.9722 },
  'travinh': { lat: 9.9408, lng: 106.3458 },
  'soctrang': { lat: 9.6006, lng: 105.9728 },
  'baclieu': { lat: 9.2942, lng: 105.7275 },
  'camau': { lat: 9.1764, lng: 105.1500 },
  'haugiang': { lat: 9.7844, lng: 105.4700 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function clean(s: string): string {
  let cleaned = s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

  // Remove administrative prefixes at the beginning of the string only
  cleaned = cleaned.replace(/^(tinh|thanh pho|tp|quan|huyen|xa|phuong|thitran)\s+/g, '');

  // Also clean any remaining spaces and special characters
  return cleaned.replace(/[^a-z0-9]/g, '').trim();
}

function cleanTitle(title: string): string {
  return title.replace(/\(.*?\)/g, '').replace(/["']/g, '').trim();
}

async function queryArcGIS(title: string, province: string, address?: string): Promise<{ lat: number; lng: number } | null> {
  const cleanedTitle = cleanTitle(title);
  const queries = [
    `${cleanedTitle}, ${province}, Vietnam`,
    `${cleanedTitle}, Vietnam`
  ];
  if (address) {
    queries.push(`${address}, Vietnam`);
  }

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
        const lng = candidate.location.x;
        const lat = candidate.location.y;
        
        // Ensure coordinates are within Vietnam boundary roughly
        if (lat >= 8.0 && lat <= 24.0 && lng >= 102.0 && lng <= 110.0) {
          return { lat, lng };
        }
      }
    } catch (err: any) {
      // Quietly try next
    }
  }
  return null;
}

async function run() {
  console.log('🚀 Bắt đầu quét sửa tọa độ bị lỗi (18.2912 hoặc 10.7769)...');
  
  if (!fs.existsSync(DEST_DIR)) {
    console.error(`❌ Thư mục destinations không tồn tại: ${DEST_DIR}`);
    return;
  }

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json')).sort();
  let totalFixed = 0;
  let totalFallback = 0;

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
    const fileProvCleanName = file.replace('tinh-', '').replace('thanh-pho-', '').replace('.json', '').replace(/-/g, ' ');

    for (const item of items) {
      const lat = item.latitude;
      const lng = item.longitude;
      
      // Vùng tọa độ lỗi: Hà Tĩnh (18.2912) hoặc HCMC (10.7769) mặc định cho các tỉnh khác
      const isIncorrectHaGiang = (lat === 18.2912 && lng === 105.735 && clean(item.province || '') !== 'hatinh');
      const isPlaceholderOther = (lat === 10.7769 && lng === 106.7009 && !['hochiminh', 'tphochiminh'].includes(clean(item.province || '')));
      const isZero = !lat || !lng;

      if (isIncorrectHaGiang || isPlaceholderOther || isZero) {
        const itemProv = item.province || fileProvCleanName;
        console.log(`🔎 Phát hiện tọa độ sai cho: "${item.title}" (${itemProv})`);
        
        // Cố gắng geocode qua ArcGIS
        const coords = await queryArcGIS(item.title, itemProv, item.address);
        
        let validCoords = false;
        const cleanProv = clean(itemProv);
        const fallback = provinceCoords[cleanProv];

        if (coords && fallback) {
          const distFromProvCenter = calculateDistance(coords.lat, coords.lng, fallback.lat, fallback.lng);
          // Ranh giới tối đa được phép sai số cho các tỉnh miền núi/rộng lớn là 150km, tỉnh đồng bằng là 80km
          const maxRadius = ['hagiang', 'sonla', 'nghean', 'gialai', 'caobang', 'laocai', 'dienbien', 'quangninh', 'quangnam', 'lamdong', 'thanhhoa', 'daklak', 'tuyenquang'].includes(cleanProv) ? 150 : 80;
          
          if (distFromProvCenter <= maxRadius) {
            item.latitude = parseFloat(coords.lat.toFixed(6));
            item.longitude = parseFloat(coords.lng.toFixed(6));
            console.log(`   ✅ Sửa thành công (ArcGIS): (${item.latitude}, ${item.longitude})`);
            totalFixed++;
            fileUpdated = true;
            validCoords = true;
          } else {
            console.log(`   ⚠️ ArcGIS trả về tọa độ ngoài ranh giới tỉnh (${Math.round(distFromProvCenter)} km từ trung tâm). Từ chối.`);
          }
        }
        
        if (!validCoords) {
          if (fallback) {
            item.latitude = fallback.lat;
            item.longitude = fallback.lng;
            console.log(`   ⚠️ Fallback về trung tâm tỉnh ${itemProv}: (${item.latitude}, ${item.longitude})`);
            totalFallback++;
            fileUpdated = true;
          } else {
            console.log(`   ❌ Thất bại hoàn toàn, không tìm thấy fallback cho tỉnh: ${itemProv}`);
          }
        }
        
        // Politeness delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`💾 Đã lưu thay đổi vào file ${file}`);
    }
  }

  console.log('\n======================================================');
  console.log('   BÁO CÁO KẾT QUẢ SỬA LỖI TỌA ĐỘ');
  console.log('======================================================');
  console.log(`Tổng số địa điểm sửa thành công bằng ArcGIS: ${totalFixed}`);
  console.log(`Tổng số địa điểm fallback về trung tâm tỉnh:  ${totalFallback}`);
  console.log('======================================================');
}

run().catch(err => {
  console.error('❌ Lỗi hệ thống khi chạy script:', err);
});
