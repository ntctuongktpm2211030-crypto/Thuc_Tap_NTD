import fs from 'fs';
import path from 'path';

export interface RealPlace {
  name: string;
  latitude: number;
  longitude: number;
  category: 'attraction' | 'restaurant' | 'hotel' | 'nature' | 'festival';
  description: string;
  costEstimate: number; // in VND
  address?: string;
}

export interface ProvinceData {
  provinceName: string;
  attractions: RealPlace[];
  restaurants: RealPlace[];
  hotels: RealPlace[];
  nature: RealPlace[];
  festivals: RealPlace[];
  specialties: string[];
}

let fileMap: Record<string, string> | null = null;

/**
 * Normalizes province/destination names by removing accents, tones, whitespaces,
 * and common prefixes like "tinh", "thanh pho", "tp".
 */
export function normalizeProvince(p: string): string {
  if (!p) return '';
  let str = p.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  
  // Strip common administrative prefixes only at the start of the string
  str = str.replace(/^(tinh|thanh pho|tp)\s*[- ]*/g, '');
  
  return str.replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Scans the destinations directory and caches normalized file matches.
 */
function getFileMap(): Record<string, string> {
  if (fileMap) return fileMap;
  fileMap = {};
  const dir = path.resolve(__dirname, 'destinations');
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const rawName = file.replace('.json', '');
          const key = normalizeProvince(rawName);
          fileMap[key] = file;
        }
      }
    } catch (e: any) {
      console.error('[Destinations] Error reading destinations directory:', e.message);
    }
  }
  return fileMap;
}

/**
 * Dynamically resolves and loads province data from the destinations JSON folder.
 * Matches using normalized string heuristics and cross-references each item's actual province.
 */
export function getCuratedProvince(query: string): ProvinceData | null {
  const normQuery = normalizeProvince(query);
  if (!normQuery) return null;

  const map = getFileMap();
  let matchedFile = '';

  // 1. Try to find the file corresponding to the query
  if (map[normQuery]) {
    matchedFile = map[normQuery];
  } else {
    for (const key of Object.keys(map)) {
      if (normQuery.includes(key) || key.includes(normQuery)) {
        matchedFile = map[key];
        break;
      }
    }
  }

  const matchingItems: any[] = [];
  const destinationsDir = path.resolve(__dirname, 'destinations');

  // Helper to process a JSON file and extract items matching the query province
  const processFile = (fileName: string) => {
    try {
      const filePath = path.join(destinationsDir, fileName);
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileItems = JSON.parse(content);
      if (Array.isArray(fileItems)) {
        for (const item of fileItems) {
          if (item && item.province) {
            const normItemProv = normalizeProvince(item.province);
            // Cross-reference: Only match if the normalized province names match or are substrings
            if (normItemProv === normQuery || normItemProv.includes(normQuery) || normQuery.includes(normItemProv)) {
              matchingItems.push(item);
            }
          }
        }
      }
    } catch (e: any) {
      console.error(`Error reading/parsing file ${fileName}:`, e.message);
    }
  };

  // 2. Read the matched file first
  if (matchedFile) {
    processFile(matchedFile);
  }

  // 3. Fallback: If no matching items were found, search ALL JSON files in the directory
  if (matchingItems.length === 0) {
    try {
      const files = fs.readdirSync(destinationsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        if (file !== matchedFile) {
          processFile(file);
        }
      }
    } catch (e: any) {
      console.error('Error scanning destinations directory:', e.message);
    }
  }

  // If we still have 0 matching items, return null so the LLM falls back to its global knowledge
  if (matchingItems.length === 0) {
    return null;
  }

  const attractions: RealPlace[] = [];
  const restaurants: RealPlace[] = [];
  const hotels: RealPlace[] = [];
  const nature: RealPlace[] = [];
  const festivals: RealPlace[] = [];
  
  // Use the actual province name from the first matched item
  const provinceName = matchingItems[0].province || query;

  for (const item of matchingItems) {
    const place: RealPlace = {
      name: item.title,
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      category: item.category,
      description: item.content,
      costEstimate: item.costEstimate || 0,
      address: item.address || '',
    };

    switch (item.category) {
      case 'attraction':
        attractions.push(place);
        break;
      case 'restaurant':
        restaurants.push(place);
        break;
      case 'hotel':
        hotels.push(place);
        break;
      case 'nature':
        nature.push(place);
        break;
      case 'festival':
        festivals.push(place);
        break;
    }
  }

  const specialties = restaurants.slice(0, 4).map(r => r.name);

  return {
    provinceName,
    attractions,
    restaurants,
    hotels,
    nature,
    festivals,
    specialties,
  };
}

/**
 * Resets the cache (useful for dynamic reloads/seeding)
 */
export function resetDestinationsCache() {
  fileMap = null;
}
