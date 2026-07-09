import fs from 'fs';
import path from 'path';

export interface RealPlace {
  name: string;
  latitude: number;
  longitude: number;
  category: 'attraction' | 'restaurant' | 'hotel' | 'nature' | 'festival';
  description: string;
  costEstimate: number; // in VND
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
          const key = file
            .replace('.json', '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]/g, '');
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
 * Matches using normalized string heuristics.
 */
export function getCuratedProvince(query: string): ProvinceData | null {
  const norm = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();

  if (!norm) return null;

  const map = getFileMap();
  let matchedFile = '';

  // Heuristic: Check for exact match first
  if (map[norm]) {
    matchedFile = map[norm];
  } else {
    // Heuristic: Check for substring inclusion
    for (const key of Object.keys(map)) {
      if (norm.includes(key) || key.includes(norm)) {
        matchedFile = map[key];
        break;
      }
    }
  }

  if (!matchedFile) return null;

  try {
    const filePath = path.resolve(__dirname, 'destinations', matchedFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(content) as Array<{
      province: string;
      title: string;
      content: string;
      category: 'attraction' | 'restaurant' | 'hotel' | 'nature' | 'festival';
      latitude?: number;
      longitude?: number;
      costEstimate?: number;
    }>;

    const attractions: RealPlace[] = [];
    const restaurants: RealPlace[] = [];
    const hotels: RealPlace[] = [];
    const nature: RealPlace[] = [];
    const festivals: RealPlace[] = [];
    let provinceName = '';

    for (const item of items) {
      if (!provinceName) provinceName = item.province;

      const place: RealPlace = {
        name: item.title,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        category: item.category,
        description: item.content,
        costEstimate: item.costEstimate || 0,
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

    // Dynamic specialties extracted from food titles
    const specialties = restaurants.slice(0, 4).map(r => r.name);

    return {
      provinceName: provinceName || query,
      attractions,
      restaurants,
      hotels,
      nature,
      festivals,
      specialties,
    };
  } catch (err: any) {
    console.error(`[Destinations] Error loading custom destination file "${matchedFile}":`, err.message);
    return null;
  }
}

/**
 * Resets the cache (useful for dynamic reloads/seeding)
 */
export function resetDestinationsCache() {
  fileMap = null;
}
