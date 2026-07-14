import fs from 'fs';
import path from 'path';

const DEST_DIR = path.resolve(__dirname, '../config/destinations');

interface DestinationItem {
  province: string;
  title: string;
  category: string;
  address?: string;
}

function normalizeProvince(prov: string): string {
  return prov
    .toLowerCase()
    .replace(/^(tỉnh|thành phố|tp\.)\s+/g, '')
    .trim();
}

function cleanTitle(title: string): string {
  return title.replace(/\(.*?\)/g, '').replace(/["']/g, '').trim();
}

function cleanAddress(addr: string): string {
  let cleaned = addr.replace(/,\s*\d{5,6}/g, '');
  cleaned = cleaned.replace(/,\s*VNM$/i, '');
  cleaned = cleaned.replace(/,\s*Vietnam$/i, '');
  cleaned = cleaned.replace(/,\s*Việt Nam$/i, '');
  return cleaned.trim();
}

async function searchAddressWithStrictRules(title: string, province: string): Promise<string | null> {
  const query = `${cleanTitle(title)}, ${province}, Vietnam`;
  const encoded = encodeURIComponent(query);
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encoded}&maxLocations=3&outFields=Match_addr,Addr_type,Address,Neighborhood,City,Region,Score`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data && data.candidates && data.candidates.length > 0) {
      // Find a candidate that satisfies strict criteria
      const provClean = normalizeProvince(province);
      for (const cand of data.candidates) {
        const score = cand.score || 0;
        const addressText = cand.address || '';
        const region = cand.attributes?.Region || '';
        const regionClean = normalizeProvince(region);
        
        // Rule 1: High confidence score
        if (score < 90) continue;
        
        // Rule 2: Must be in the correct province
        const belongsToProvince = 
          addressText.toLowerCase().includes(provClean) || 
          regionClean.includes(provClean) || 
          provClean.includes(regionClean);
          
        if (!belongsToProvince) continue;

        // Rule 3: Extract clean address components
        let finalAddr = '';
        if (cand.attributes?.Addr_type === 'POI') {
          const parts = [
            cand.attributes?.Address,
            cand.attributes?.Neighborhood,
            cand.attributes?.City,
            cand.attributes?.Region
          ].filter(p => p && p.trim().length > 0);
          finalAddr = parts.join(', ');
        } else {
          finalAddr = addressText;
        }

        return cleanAddress(finalAddr);
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function testHungYen() {
  const file = 'tinh-hung-yen.json';
  const filePath = path.join(DEST_DIR, file);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DestinationItem[];

  console.log(`🧪 Chạy thử nghiệm trên file ${file} với quy tắc CHỌN LỌC NGHIÊM NGẶT...\n`);
  
  let checked = 0;
  let updated = 0;

  for (const item of items.slice(0, 20)) {
    if (item.category === 'festival') continue;
    checked++;
    const newAddr = await searchAddressWithStrictRules(item.title, item.province);
    
    if (newAddr && newAddr !== item.address) {
      console.log(`✅ [DUYỆT] "${item.title}"`);
      console.log(`   Địa chỉ cũ:  "${item.address}"`);
      console.log(`   Địa chỉ mới: "${newAddr}"`);
      updated++;
    } else {
      console.log(`❌ [BỎ QUA] "${item.title}" (Không tìm thấy địa chỉ thỏa mãn quy tắc)`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`\nTổng kết: Quét ${checked} điểm, chấp nhận cập nhật ${updated} điểm.`);
}

testHungYen();
