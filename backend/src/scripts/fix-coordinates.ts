import fs from 'fs';
import path from 'path';

interface MismatchEntry {
  file: string;
  title: string;
  expectedProvince: string;
  jsonCoords: string;
  matchedUnit: string;
  unitCoords: string;
  distance: string;
  reason: string;
}

const destinationsDir = path.resolve(__dirname, '../config/destinations');
const reportPath = path.resolve(__dirname, '../../../destination_mismatch_report.json');

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

async function runFix() {
  console.log('=== START FIXING COORDINATES FROM REPORT ===');

  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found at: ${reportPath}`);
    return;
  }

  const reportContent = fs.readFileSync(reportPath, 'utf-8');
  let entries: MismatchEntry[] = [];
  try {
    entries = JSON.parse(reportContent);
  } catch (e: any) {
    console.error(`Failed to parse report JSON:`, e.message);
    return;
  }

  console.log(`Found ${entries.length} mismatch entries to fix.`);

  // Group entries by file to minimize read/write operations
  const fileGroups: Record<string, MismatchEntry[]> = {};
  for (const entry of entries) {
    if (!fileGroups[entry.file]) {
      fileGroups[entry.file] = [];
    }
    fileGroups[entry.file].push(entry);
  }

  let totalUpdated = 0;
  let totalArcGIS = 0;
  let totalFallback = 0;

  for (const [fileName, fileEntries] of Object.entries(fileGroups)) {
    const filePath = path.join(destinationsDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const contentText = fs.readFileSync(filePath, 'utf-8');
    let items: any[] = [];
    try {
      items = JSON.parse(contentText);
    } catch (e: any) {
      console.error(`Failed to parse ${fileName}:`, e.message);
      continue;
    }

    if (!Array.isArray(items)) continue;

    let updatedCount = 0;
    for (const entry of fileEntries) {
      const matchedItems = items.filter(item => item.title === entry.title);
      if (matchedItems.length === 0) continue;

      const [unitLatStr, unitLngStr] = entry.unitCoords.split(',');
      const unitLat = parseFloat(unitLatStr.trim());
      const unitLng = parseFloat(unitLngStr.trim());

      if (isNaN(unitLat) || isNaN(unitLng)) continue;

      // Try geocoding with ArcGIS first for precise location
      let lat = unitLat;
      let lng = unitLng;
      let usedArcGIS = false;

      // Only attempt geocoding if it has a sensible title
      const coords = await queryArcGIS(entry.title, entry.expectedProvince);
      if (coords) {
        const dist = calculateDistance(coords.lat, coords.lng, unitLat, unitLng);
        // If geocoded coordinate is within 100km of the verified ward/province center, use it
        if (dist <= 100) {
          lat = parseFloat(coords.lat.toFixed(6));
          lng = parseFloat(coords.lng.toFixed(6));
          usedArcGIS = true;
        }
      }

      for (const matchedItem of matchedItems) {
        matchedItem.latitude = lat;
        matchedItem.longitude = lng;
        updatedCount++;
        totalUpdated++;
        if (usedArcGIS) {
          totalArcGIS++;
        } else {
          totalFallback++;
        }
      }

      // 50ms delay for rate-limiting friendliness
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
      console.log(`[FIXED] Updated ${updatedCount} places in ${fileName}`);
    }
  }

  console.log('=== COORDINATES CORRECTION COMPLETED ===');
  console.log(`Total places updated: ${totalUpdated}`);
  console.log(`- Updated via precise ArcGIS geocoding: ${totalArcGIS}`);
  console.log(`- Updated via ward/province center fallback: ${totalFallback}`);
}

runFix().catch(err => {
  console.error('Error running fix-coordinates:', err);
});
