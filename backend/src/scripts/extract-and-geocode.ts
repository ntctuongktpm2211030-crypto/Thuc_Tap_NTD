import fs from 'fs';
import path from 'path';

const CONV_ID = '0ac1dbe7-f3de-4894-bb9a-be1d257ce380';
const LOG_PATH = `C:/Users/TUONG/.gemini/antigravity-ide/brain/${CONV_ID}/.system_generated/logs/transcript_full.jsonl`;
const DEST_DIR = path.resolve(__dirname, '../config/destinations');

interface RawItem {
  province: string;
  title: string;
  content: string;
  category: 'attraction' | 'restaurant' | 'hotel' | 'nature' | 'festival';
  latitude?: number;
  longitude?: number;
  costEstimate?: number;
}

/**
 * Normalizes price estimation from description content.
 */
function extractCost(content: string, category: string): number {
  const normalized = content.toLowerCase();
  if (normalized.includes('miễn phí') || normalized.includes('free')) {
    return 0;
  }
  
  // Try pattern like "1.000.000đ"
  const matchRange = normalized.match(/([\d.]+)\s*(?:-|–)\s*([\d.]+)\s*(?:đ|vnd|đồng)/);
  if (matchRange) {
    const num1 = parseInt(matchRange[1].replace(/\./g, ''), 10);
    const num2 = parseInt(matchRange[2].replace(/\./g, ''), 10);
    if (!isNaN(num1) && !isNaN(num2)) {
      return Math.round((num1 + num2) / 2);
    }
  }

  // Search for patterns like "khoảng 40.000đ", "vé 20.000đ"
  const match = normalized.match(/(?:khoảng|vé|giá|tầm|khoang)?\s*([\d.]+)\s*(?:đ|vnd|đồng|đô)/);
  if (match) {
    const numStr = match[1].replace(/\./g, '');
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > 0) {
      if (num < 1000 && normalized.includes('usd')) {
        return num * 25000; // convert USD estimate to VND
      }
      return num;
    }
  }

  // Fallback defaults in VND
  switch (category) {
    case 'hotel':
      return 1200000;
    case 'restaurant':
      return 80000;
    case 'attraction':
      return 30000;
    case 'nature':
      return 0;
    case 'festival':
      return 0;
    default:
      return 0;
  }
}

/**
 * Geocodes an address using the local python geocoder microservice.
 */
async function geocodeAddress(title: string, province: string): Promise<{ lat: number; lng: number } | null> {
  const queryAddress = `${title}, ${province}`;
  try {
    const response = await fetch('http://localhost:8000/api/v1/address/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: queryAddress, mode: 'LEGACY' })
    });
    if (!response.ok) return null;
    const data = await response.json() as any;
    if (data && data.status === 'success' && data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude };
    }
    
    // Fallback: Query only title
    const response2 = await fetch('http://localhost:8000/api/v1/address/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: title, mode: 'LEGACY' })
    });
    if (!response2.ok) return null;
    const data2 = await response2.json() as any;
    if (data2 && data2.status === 'success' && data2.latitude && data2.longitude) {
      return { lat: data2.latitude, lng: data2.longitude };
    }
  } catch (err: any) {
    console.error(`[Geocoder] Failed to fetch coordinates for "${title}":`, err.message);
  }
  return null;
}

/**
 * Returns capital center fallback coordinates for key provinces.
 */
function getProvinceCenterFallback(province: string): { lat: number; lng: number } {
  const p = province.toLowerCase();
  if (p.includes('vung tau') || p.includes('ba ria')) return { lat: 10.3460, lng: 107.0843 };
  if (p.includes('can tho')) return { lat: 10.0371, lng: 105.7882 };
  if (p.includes('ha giang')) return { lat: 22.8233, lng: 104.9836 };
  if (p.includes('ha noi')) return { lat: 21.0285, lng: 105.8542 };
  if (p.includes('da nang')) return { lat: 16.0471, lng: 108.2062 };
  return { lat: 10.7769, lng: 106.7009 }; // HCMC general default
}

/**
 * Extracts Vũng Tàu JSON from logs if the file doesn't exist yet.
 */
function extractVungTauFromLogs(): RawItem[] | null {
  if (!fs.existsSync(LOG_PATH)) {
    console.warn(`⚠️ Log file not found at ${LOG_PATH}. Skipping automated log extraction.`);
    return null;
  }

  console.log(`📖 Reading transcript logs from ${LOG_PATH} to extract Bà Rịa - Vũng Tàu data...`);
  const lines = fs.readFileSync(LOG_PATH, 'utf-8').split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.type === 'USER_INPUT') {
        console.log(`Found USER_INPUT, length=${step.content ? step.content.length : 0}`);
        if (step.content && step.content.includes('Tượng Chúa Kitô Vua Vũng Tàu')) {
          console.log(`MATCHED target string in content!`);
          const content = step.content;
          console.log(`Content length: ${content.length}`);
          console.log(`Content start: ${content.substring(0, 100)}`);
          console.log(`Content end: ${content.substring(content.length - 100)}`);
          const start = content.indexOf('[');
          const end = content.lastIndexOf(']');
          console.log(`start=${start}, end=${end}`);
          if (start !== -1 && end !== -1) {
            const jsonStr = content.substring(start, end + 1);
            const items = JSON.parse(jsonStr) as RawItem[];
            console.log(`✅ Successfully extracted ${items.length} Bà Rịa - Vũng Tàu locations from logs!`);
            return items;
          }
        }
      }
    } catch (e: any) {
      console.error(`[Logs Extractor] Line parsing failed:`, e.message);
    }
  }
  return null;
}

/**
 * Core runner of the pipeline.
 */
export async function runGeocodingPipeline() {
  // Ensure destinations folder exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`📁 Created destinations directory at ${DEST_DIR}`);
  }

  const vungTauFilePath = path.join(DEST_DIR, 'ba-ria-vung-tau.json');

  // 1. Extract Vũng Tàu JSON if not present or empty
  const isVungTauEmpty = !fs.existsSync(vungTauFilePath) || fs.readFileSync(vungTauFilePath, 'utf-8').trim().length === 0;
  if (isVungTauEmpty) {
    const rawVungTau = extractVungTauFromLogs();
    if (rawVungTau) {
      fs.writeFileSync(vungTauFilePath, JSON.stringify(rawVungTau, null, 2), 'utf-8');
      console.log(`💾 Saved raw Vũng Tàu locations baseline to ${vungTauFilePath}`);
    }
  }

  // 2. Scan all JSON files in the destinations folder and geocode missing values
  const files = fs.readdirSync(DEST_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(DEST_DIR, file);
    let items: RawItem[] = [];
    try {
      items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      console.error(`❌ Failed to parse JSON file ${file}:`, e.message);
      continue;
    }

    let modified = false;
    console.log(`🔍 Checking "${file}" for geocoding updates (${items.length} items)...`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const needsLat = !item.latitude || item.latitude === 0;
      const needsLng = !item.longitude || item.longitude === 0;
      const needsCost = item.costEstimate === undefined || item.costEstimate === null;

      if (needsLat || needsLng || needsCost) {
        if (needsLat || needsLng) {
          console.log(`   🌐 Geocoding: "${item.title}" in ${item.province}...`);
          const coords = await geocodeAddress(item.title, item.province);
          if (coords) {
            item.latitude = coords.lat;
            item.longitude = coords.lng;
          } else {
            const fallback = getProvinceCenterFallback(item.province);
            item.latitude = fallback.lat;
            item.longitude = fallback.lng;
            console.log(`   ⚠️ Geocode fallback to center for "${item.title}"`);
          }
        }

        if (needsCost) {
          item.costEstimate = extractCost(item.content, item.category);
          console.log(`   💰 Parsed Cost: "${item.title}" -> ${item.costEstimate} đ`);
        }

        modified = true;
        
        // Brief timeout to throttle API requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`✅ Saved geocoded updates to ${filePath}`);
    } else {
      console.log(`✨ "${file}" is fully geocoded and optimized.`);
    }
  }
}
