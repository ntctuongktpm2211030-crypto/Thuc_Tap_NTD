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

const POI_KEYWORDS = [
  'ngân hàng', 'atm', 'ủy ban', 'công an', 'bưu điện', 'tòa án', 'viện kiểm sát',
  'peugeot', 'toyota', 'honda', 'yamaha', 'thế giới di động', 'điện máy xanh',
  'tạp hóa', 'ubnd', 'sở ', 'phòng khám', 'bệnh viện', 'mb bank', 'bidv', 'agribank', 
  'vietcombank', 'vietinbank', 'nhà hàng', 'quán ', 'tiệm '
];

function cleanAddress(addr: string): string {
  let cleaned = addr.replace(/,\s*\d{5,6}/g, '');
  cleaned = cleaned.replace(/,\s*VNM$/i, '');
  cleaned = cleaned.replace(/,\s*Vietnam$/i, '');
  cleaned = cleaned.replace(/,\s*Việt Nam$/i, '');
  return cleaned.trim();
}

function isAddressGeneric(address: string | undefined, province: string): boolean {
  if (!address) return true;
  const addrLower = address.toLowerCase().trim();
  const provLower = province.toLowerCase().trim();
  
  if (addrLower === provLower) return true;
  if (addrLower === `tỉnh ${provLower}` || addrLower === `thành phố ${provLower}`) return true;
  
  if (address.length < 35) {
    const genericPatterns = [
      /^thành phố [^,]+, tỉnh [^,]+$/i,
      /^huyện [^,]+, tỉnh [^,]+$/i,
      /^xã [^,]+, huyện [^,]+, tỉnh [^,]+$/i
    ];
    for (const pattern of genericPatterns) {
      if (pattern.test(address)) {
        return true;
      }
    }
  }

  return false;
}

function normalizeProvince(prov: string): string {
  return prov
    .toLowerCase()
    .replace(/^(tỉnh|thành phố|tp\.)\s+/g, '')
    .trim();
}

function needsEnrichmentOrFix(item: DestinationItem): boolean {
  if (item.category === 'festival') return false;
  if (!item.address) return true;

  if (isAddressGeneric(item.address, item.province)) return true;

  const addrLower = item.address.toLowerCase();
  for (const kw of POI_KEYWORDS) {
    if (addrLower.includes(kw)) {
      return true;
    }
  }

  const provClean = normalizeProvince(item.province);
  if (!addrLower.includes(provClean)) {
    return true;
  }

  return false;
}

function cleanAndFormatAddress(dataAddress: any, correctProvince: string): string {
  const { Addr_type, Match_addr, Address, Neighborhood, City, Region } = dataAddress;
  let baseAddr = '';
  
  if (Addr_type === 'POI') {
    const parts = [Address, Neighborhood, City, Region].filter(p => p && p.trim().length > 0);
    baseAddr = parts.join(', ');
  } else {
    baseAddr = Match_addr || '';
  }
  
  let cleaned = cleanAddress(baseAddr);
  const provClean = normalizeProvince(correctProvince);

  if (Region) {
    const regionClean = normalizeProvince(Region);
    if (regionClean !== provClean && regionClean.length > 2) {
      const regex = new RegExp(regionClean, 'ig');
      cleaned = cleaned.replace(regex, correctProvince);
    }
  }

  if (!cleaned.toLowerCase().includes(provClean)) {
    cleaned = `${cleaned}, ${correctProvince}`;
  }

  return cleaned;
}

async function searchAddressWithStrictRules(title: string, province: string): Promise<string | null> {
  const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/["']/g, '').trim();
  const query = `${cleanTitle}, ${province}, Vietnam`;
  const encoded = encodeURIComponent(query);
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encoded}&maxLocations=2&outFields=Match_addr,Addr_type,Address,Neighborhood,City,Region,Score`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data && data.candidates && data.candidates.length > 0) {
      const provClean = normalizeProvince(province);
      for (const cand of data.candidates) {
        if ((cand.score || 0) < 90) continue;
        
        const addrText = cand.address || '';
        const region = cand.attributes?.Region || '';
        const regionClean = normalizeProvince(region);
        
        const belongsToProvince = 
          addrText.toLowerCase().includes(provClean) || 
          regionClean.includes(provClean) || 
          provClean.includes(regionClean);
          
        if (!belongsToProvince) continue;

        return cleanAndFormatAddress(cand.attributes || { Addr_type: cand.attributes?.Addr_type, Match_addr: cand.address, ...cand.attributes }, province);
      }
    }
  } catch (e) {}
  return null;
}

async function reverseGeocode(lat: number, lng: number, correctProvince: string): Promise<string | null> {
  const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lng},${lat}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    if (data && data.address) {
      return cleanAndFormatAddress(data.address, correctProvince);
    }
  } catch (e) {}
  return null;
}

async function run() {
  console.log('🚀 Bắt đầu cập nhật địa chỉ chọn lọc thông minh...');
  
  if (!fs.existsSync(DEST_DIR)) {
    console.error(`❌ Thư mục destinations không tồn tại: ${DEST_DIR}`);
    return;
  }

  const files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json')).sort();
  let totalChecked = 0;
  let totalUpdated = 0;

  for (const file of files) {
    const filePath = path.join(DEST_DIR, file);
    let items: DestinationItem[] = [];
    
    try {
      items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      console.error(`❌ Lỗi đọc file ${file}:`, e.message);
      continue;
    }

    // Phase 1: Identify coordinate duplicate frequencies in this file to detect fallback coordinates
    const coordCounts: Record<string, number> = {};
    for (const item of items) {
      const key = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`;
      coordCounts[key] = (coordCounts[key] || 0) + 1;
    }

    let fileUpdated = false;
    console.log(`\n📁 Đang quét file: ${file}`);

    for (const item of items) {
      totalChecked++;
      
      if (needsEnrichmentOrFix(item)) {
        let newAddress: string | null = null;
        
        // Step A: Try Strict Forward Geocode first (using title + province)
        newAddress = await searchAddressWithStrictRules(item.title, item.province);
        
        // Step B: If Forward Geocode fails, try Reverse Geocode, BUT only if coordinates are NOT generic fallbacks
        if (!newAddress) {
          const coordKey = `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`;
          const isFallbackCoord = coordCounts[coordKey] > 2; // if more than 2 items share the exact same coordinates, it is a fallback
          
          if (!isFallbackCoord) {
            newAddress = await reverseGeocode(item.latitude, item.longitude, item.province);
          }
        }

        if (newAddress && newAddress !== item.address) {
          console.log(`   ✍️ Cập nhật: "${item.title}"`);
          console.log(`      📍 Địa chỉ cũ: "${item.address || 'trống'}"`);
          console.log(`      ✨ Địa chỉ mới: "${newAddress}"`);
          item.address = newAddress;
          fileUpdated = true;
          totalUpdated++;
        } else {
          // If no clean detailed address found, we keep the original to be safe
        }
        
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`   💾 Đã lưu thay đổi vào file ${file}`);
    }
  }

  console.log('\n======================================================');
  console.log('   BÁO CÁO CẬP NHẬT ĐỊA CHỈ THÔNG MINH');
  console.log('======================================================');
  console.log(`Tổng số địa điểm đã quét:   ${totalChecked}`);
  console.log(`Tổng số địa chỉ đã cập nhật: ${totalUpdated}`);
  console.log('======================================================');
}

run().catch(err => {
  console.error('❌ Lỗi hệ thống:', err);
});
