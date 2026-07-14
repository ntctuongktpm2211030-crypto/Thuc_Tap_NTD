import fs from 'fs';
import path from 'path';

interface RealPlace {
  province?: string;
  title: string;
  content: string;
  category: string;
  latitude: number;
  longitude: number;
  costEstimate: number;
  address?: string;
}

interface CSVRow {
  province: string;
  provinceShort: string;
  ward: string;
  wardShort: string;
  provinceLat: number;
  provinceLon: number;
  wardLat: number;
  wardLon: number;
}

const destinationsDir = path.resolve(__dirname, '../config/destinations');
const CSV_URL = 'https://raw.githubusercontent.com/tranngocminhhieu/vietnamadminunits/main/data/processed/2025_34-province-3221-ward_with_location.csv';
const LOCAL_CSV_PATH = path.resolve(__dirname, '2025_34-province-3221-ward_with_location.csv');

// Static fallback coordinate map for all 63 provinces in Vietnam (in case they are not in the 2025 change CSV)
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

// Haversine distance calculator
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

function clean(s: string) {
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

async function downloadCSV(): Promise<string> {
  if (fs.existsSync(LOCAL_CSV_PATH)) {
    return fs.readFileSync(LOCAL_CSV_PATH, 'utf-8');
  }
  console.log(`Downloading database from: ${CSV_URL}...`);
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to download database from GitHub: ${res.statusText}`);
  }
  const text = await res.text();
  fs.writeFileSync(LOCAL_CSV_PATH, text, 'utf-8');
  console.log(`Saved database to local file: ${LOCAL_CSV_PATH}`);
  return text;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  const getIndex = (names: string[]) => {
    for (const name of names) {
      const idx = headers.indexOf(name);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const pIdx = getIndex(['province', 'newProvince']);
  const psIdx = getIndex(['provinceShort', 'newProvinceShort', 'province']);
  const wIdx = getIndex(['ward', 'newWard']);
  const wsIdx = getIndex(['wardShort', 'newWardShort', 'ward']);
  const platIdx = getIndex(['provinceLat', 'newProvinceLat']);
  const plonIdx = getIndex(['provinceLon', 'newProvinceLon']);
  const wlatIdx = getIndex(['wardLat', 'newWardLat']);
  const wlonIdx = getIndex(['wardLon', 'newWardLon']);

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(',');
    if (cols.length < headers.length) continue;

    rows.push({
      province: cols[pIdx] || '',
      provinceShort: psIdx !== -1 ? cols[psIdx] || '' : '',
      ward: cols[wIdx] || '',
      wardShort: wsIdx !== -1 ? cols[wsIdx] || '' : '',
      provinceLat: parseFloat(cols[platIdx]),
      provinceLon: parseFloat(cols[plonIdx]),
      wardLat: parseFloat(cols[wlatIdx]),
      wardLon: parseFloat(cols[wlonIdx])
    });
  }
  return rows;
}

async function verifyAll() {
  console.log('=== START VERIFYING DESTINATIONS WITH VIETNAMADMINUNITS CSV ===');
  
  let csvText = '';
  try {
    csvText = await downloadCSV();
  } catch (err: any) {
    console.error(`[FATAL] Failed to download/load CSV database:`, err.message);
    return;
  }

  const csvRows = parseCSV(csvText);
  console.log(`Successfully parsed ${csvRows.length} rows from CSV database.`);

  if (!fs.existsSync(destinationsDir)) {
    console.error(`Destinations directory not found at: ${destinationsDir}`);
    return;
  }

  const files = fs.readdirSync(destinationsDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} destination files to verify.`);

  const mismatches: any[] = [];
  let totalPlacesChecked = 0;

  for (const file of files) {
    const filePath = path.join(destinationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    let items: RealPlace[] = [];
    try {
      items = JSON.parse(content);
    } catch (e) {
      console.error(`Failed to parse JSON file: ${file}`);
      continue;
    }

    if (!Array.isArray(items)) continue;

    for (const item of items) {
      totalPlacesChecked++;
      const expectedProvinceName = item.province || file.replace('tinh-', '').replace('thanh-pho-', '').replace('.json', '').replace(/-/g, ' ');
      const cleanExpectedProv = clean(expectedProvinceName);

      // Filter CSV rows for this province
      const provinceRows = csvRows.filter(row => {
        const cleanRowProv = clean(row.province || row.provinceShort || '');
        return cleanRowProv === cleanExpectedProv;
      });

      let provLat = 0;
      let provLng = 0;
      let targetLat = 0;
      let targetLng = 0;
      let targetName = expectedProvinceName;
      let isWardMatch = false;

      if (provinceRows.length > 0) {
        provLat = provinceRows[0].provinceLat;
        provLng = provinceRows[0].provinceLon;

        // Determine verification address text
        const addressText = clean(item.address || '') + ' ' + clean(item.title) + ' ' + clean(item.content);

        // Try to find a matching ward in this province
        let matchedWardRow: CSVRow | null = null;
        for (const row of provinceRows) {
          const cleanWard = clean(row.ward || '');
          const cleanWardShort = clean(row.wardShort || '');
          
          if (cleanWard && cleanWard.length > 2 && addressText.includes(cleanWard)) {
            matchedWardRow = row;
            break;
          }
          if (cleanWardShort && cleanWardShort.length > 2 && addressText.includes(cleanWardShort)) {
            matchedWardRow = row;
            break;
          }
        }

        if (matchedWardRow) {
          targetLat = matchedWardRow.wardLat;
          targetLng = matchedWardRow.wardLon;
          targetName = `${matchedWardRow.ward}, ${expectedProvinceName}`;
          isWardMatch = true;
        } else {
          targetLat = provLat;
          targetLng = provLng;
        }
      } else {
        // Fallback to static mapping if province not found in CSV (unchanged 2025 provinces)
        const staticCoords = provinceCoords[cleanExpectedProv];
        if (staticCoords) {
          provLat = staticCoords.lat;
          provLng = staticCoords.lng;
          targetLat = provLat;
          targetLng = provLng;
        } else {
          console.warn(`[WARNING] Could not find province "${expectedProvinceName}" in CSV database or static fallback for item "${item.title}"`);
          continue;
        }
      }

      const distance = calculateDistance(item.latitude, item.longitude, targetLat, targetLng);

      // Check threshold
      const maxRadius = ['hagiang', 'sonla', 'nghean', 'gialai', 'caobang', 'laocai', 'dienbien', 'quangninh', 'quangnam', 'lamdong', 'thanhhoa', 'daklak', 'tuyenquang'].includes(cleanExpectedProv) ? 120 : 40;
      const threshold = isWardMatch ? 20 : maxRadius;

      if (distance > threshold) {
        mismatches.push({
          file,
          title: item.title,
          expectedProvince: expectedProvinceName,
          jsonCoords: `${item.latitude}, ${item.longitude}`,
          matchedUnit: targetName,
          unitCoords: `${targetLat}, ${targetLng}`,
          distance: `${Math.round(distance)} km`,
          reason: isWardMatch ? `Lệch phường/xã (> 20km)` : `Lệch ranh giới tỉnh (> ${maxRadius}km)`
        });

        console.warn(`[MISMATCH] "${item.title}" trong file ${file}:
  - Tọa độ JSON: ${item.latitude}, ${item.longitude}
  - Tọa độ Khớp (${isWardMatch ? 'Phường/Xã' : 'Tỉnh'}): ${targetLat}, ${targetLng} (${targetName})
  - Khoảng cách: ${Math.round(distance)} km
  - Lý do: ${isWardMatch ? 'Lệch phường/xã (> 20km)' : 'Lệch ranh giới tỉnh'}\n`);
      }
    }
  }

  console.log('=== VERIFICATION COMPLETED ===');
  console.log(`Total places checked: ${totalPlacesChecked}`);
  console.log(`Total mismatches found: ${mismatches.length}`);

  // Save report to file
  const reportPath = path.resolve(__dirname, '../../../destination_mismatch_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2), 'utf-8');
  console.log(`Saved detailed report to: ${reportPath}`);
}

verifyAll();
