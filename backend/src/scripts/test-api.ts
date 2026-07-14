import fs from 'fs';
import path from 'path';
import 'dotenv/config';

interface Destination {
  id?: string;
  province_old?: string;
  province_new?: string;
  title: string;
  officialName?: string;
  source_officialName?: string;
  englishName?: string | null;
  source_englishName?: string;
  category: string;
  latitude: number;
  longitude: number;
  source_location?: string;
  address?: string;
  source_address?: string;
  ward?: string;
  district?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  googlePlaceId?: string;
  osmId?: string;
  wikidataId?: string | null;
  wikipediaUrl?: string | null;
  website?: string;
  source_website?: string;
  phone?: string;
  source_phone?: string;
  googleMapsUrl?: string;
  openingHours?: string[];
  source_openingHours?: string;
  businessStatus?: string;
  rating?: number;
  source_rating?: string;
  reviewCount?: number;
  priceLevel?: string;
  source_priceLevel?: string;
  photoUrls?: string[];
  lastUpdated?: string;
  source?: {
    osm: boolean;
    googlePlaces: boolean;
    wikidata?: boolean;
    wikipedia?: boolean;
  };
  // Category specific fields
  cuisine?: string;
  averagePriceLevel?: string;
  delivery?: boolean;
  takeaway?: boolean;
  reservation?: boolean;
  vegetarian?: boolean;
  starRating?: number;
  checkIn?: string;
  checkOut?: string;
  amenities?: string[];
  swimmingPool?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  visitDuration?: number;
  bestVisitTime?: string;
  bestSeason?: string;
  entryTicket?: number;
  estimatedVisitTime?: string;
  suitableSeason?: string;
  officialWebsite?: string;
  festivalMonth?: string;
  startDate?: string;
  endDate?: string;
  repeat?: boolean;
  elevation?: number;
  area?: string;
  landscapeType?: string;
  content?: string;
  costEstimate?: number;

  // AI Metadata fields
  priorityScore?: number;
  travelTags?: string[];
  familyFriendly?: boolean;
  coupleFriendly?: boolean;
  childrenFriendly?: boolean;
  elderlyFriendly?: boolean;
  searchKeywords?: string[];

  // Wikipedia / Description
  description?: string | null;
  source_description?: string;
}

const DEST_DIR = path.resolve(__dirname, '../config/destinations');
const GROQ_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_URL = process.env.OPENAI_API_BASE_URL || 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.OPENAI_MODEL_NAME || 'llama-3.1-8b-instant';

// Helper: Normalize string to create clean ID
function generateSlug(title: string, province: string): string {
  let str = `${province}-${title}`.toLowerCase();
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
  str = str.replace(/đ/g, 'd').replace(/Đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, ''); // Remove special characters
  str = str.replace(/[\s_]+/g, '-'); // Replace spaces/underscores with hyphen
  str = str.replace(/-+/g, '-'); // Remove duplicate hyphens
  str = str.trim().replace(/^-+|-+$/g, ''); // Trim hyphens
  return str;
}

// Helper: Sleep to respect rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Fetch OSM details from Nominatim
async function fetchOSMData(title: string, province: string): Promise<any | null> {
  const queries = [
    `${title}, ${province}, Vietnam`,
    `${title}, ${province}`,
    title
  ];

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TerraHolicDataEnrichmentAgent/1.0 (contact@terraholic.com)'
        }
      });
      if (response.ok) {
        const data = await response.json() as any[];
        if (data && data.length > 0) {
          return data[0];
        }
      }
      await sleep(1000); // Wait between retries
    } catch (err: any) {
      console.warn(`[OSM] Failed query "${q}":`, err.message);
    }
  }
  return null;
}
// Helper: Fetch Google Places & Wiki details via Groq LLM API
async function fetchLLMEnrichment(item: Destination, osmData: any, provinceName: string): Promise<any | null> {
  if (!GROQ_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY is not defined. Skipping LLM enrichment.');
    return null;
  }

  const osmDetails = osmData ? {
    display_name: osmData.display_name,
    osm_id: `${osmData.osm_type}/${osmData.osm_id}`,
    address: osmData.address
  } : null;

  const prompt = `You are a professional Data Integration Engine for TerraHolic. Your task is to act as a Google Places API, Wikidata, and Wikipedia connector to enrich a Vietnamese tourist destination dataset.
DO NOT fabricate fake data. If details are missing, return null or "missing_data".

Input Place:
- Title: "${item.title}"
- Province: "${item.province || provinceName}"
- Current Address: "${item.address || ''}"
- Coordinates: [${item.latitude}, ${item.longitude}]
- Category: "${item.category}"
- OSM Info: ${JSON.stringify(osmDetails)}

Task:
Retrieve the real-world values from Google Places, Wikidata, and Wikipedia:
1. googlePlaceId (string or "missing_data")
2. wikidataId (Wikidata ID like Q10829393, or "missing_data")
3. wikipediaUrl (Wikipedia article link, or "missing_data")
4. englishName (string or null)
5. googleAddress (string or "missing_data")
6. googleWebsite (string or "missing_data")
7. wikidataWebsite (string or "missing_data")
8. googlePhone (string or "missing_data")
9. googleOpeningHours (array of strings, or [])
10. googleBusinessStatus ("OPERATIONAL" or "missing_data")
11. googleRating (float 1.0 - 5.0, or null)
12. googleReviewCount (number, or null)
13. googlePriceLevel (string or "missing_data")
14. wikipediaDescription (Short summary about history, culture, architecture, or specialties from Wikipedia, or null)
15. wikidataDescription (Short description from Wikidata, or null)

AI Generated metadata:
16. visitDuration (minutes, integer)
17. priorityScore (float 1.0 - 10.0 representing popularity)
18. travelTags (array of strings)
19. familyFriendly (boolean)
20. coupleFriendly (boolean)
21. childrenFriendly (boolean)
22. elderlyFriendly (boolean)
23. bestVisitTime (string, e.g. "morning", "afternoon")
24. bestSeason (string, e.g. "dry season")
25. searchKeywords (array of strings)

Category-specific fields:
- For restaurant (Nhà hàng): cuisine (string or null), averagePriceLevel (string or null), delivery (boolean), takeaway (boolean), reservation (boolean), vegetarian (boolean)
- For hotel (Khách sạn): starRating (number), checkIn (time string), checkOut (time string), amenities (array), swimmingPool (boolean), parking (boolean), breakfast (boolean)
- For attraction (Địa điểm tham quan): visitDuration (minutes, integer), bestVisitTime (string or null), bestSeason (string or null), entryTicket (VND, number), officialWebsite (string or null)
- For festival (Lễ hội): festivalMonth (string or null), startDate (string or null), endDate (string or null), repeat (boolean)
- For nature (Thiên nhiên): elevation (meters, number), area (string or null), landscapeType (string or null)

Return ONLY a valid JSON object matching the schema below without markdown formatting or code blocks.
Schema:
{
  "googlePlaceId": "string or missing_data",
  "wikidataId": "string or missing_data",
  "wikipediaUrl": "string or missing_data",
  "englishName": "string or null",
  "googleAddress": "string or missing_data",
  "googleWebsite": "string or missing_data",
  "wikidataWebsite": "string or missing_data",
  "googlePhone": "string or missing_data",
  "googleOpeningHours": ["string"],
  "googleBusinessStatus": "OPERATIONAL or missing_data",
  "googleRating": 4.5,
  "googleReviewCount": 120,
  "googlePriceLevel": "string or missing_data",
  "wikipediaDescription": "string or null",
  "wikidataDescription": "string or null",
  "cuisine": "string or null",
  "averagePriceLevel": "string or null",
  "delivery": false,
  "takeaway": false,
  "reservation": false,
  "vegetarian": false,
  "starRating": 0,
  "checkIn": "string or null",
  "checkOut": "string or null",
  "amenities": ["string"],
  "swimmingPool": false,
  "parking": false,
  "breakfast": false,
  "entryTicket": 0,
  "officialWebsite": "string or null",
  "festivalMonth": "string or null",
  "startDate": "string or null",
  "endDate": "string or null",
  "repeat": false,
  "elevation": 0,
  "area": "string or null",
  "landscapeType": "string or null",
  "visitDuration": 0,
  "priorityScore": 8.5,
  "travelTags": ["string"],
  "familyFriendly": true,
  "coupleFriendly": true,
  "childrenFriendly": true,
  "elderlyFriendly": true,
  "bestVisitTime": "string",
  "bestSeason": "string",
  "searchKeywords": ["string"]
}`;

  const maxRetries = 5;
  let retryDelay = 4000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const resData = await response.json() as any;
        const text = resData.choices[0].message.content.trim();
        return JSON.parse(text);
      } else if (response.status === 429) {
        console.warn(`[Groq LLM] Rate limit (429) hit for "${item.title}". Retrying in ${retryDelay}ms... (Attempt ${attempt}/${maxRetries})`);
        await sleep(retryDelay);
        retryDelay *= 2; // Exponential backoff
      } else {
        console.warn(`[Groq LLM] Failed: status ${response.status} on attempt ${attempt}`);
        if (response.status !== 500 && response.status !== 502 && response.status !== 503 && response.status !== 504) {
          break; // Non-transient error
        }
        await sleep(2000);
      }
    } catch (err: any) {
      console.error(`[Groq LLM] Error fetching (attempt ${attempt}):`, err.message);
      await sleep(2000);
    }
  }
  return null;
}
export async function enrichFile(fileName: string): Promise<{ total: number; enriched: number; skipped: number }> {
  const filePath = path.join(DEST_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  let items: Destination[] = JSON.parse(raw);
  if (!Array.isArray(items)) {
    throw new Error(`Invalid JSON format in file: ${fileName}`);
  }

  let enrichedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Skip if already enriched
    const isAlreadyEnriched = item.googlePlaceId && item.googlePlaceId !== 'missing_data' && 
                              item.osmId && item.osmId !== 'missing_data' && 
                              item.source;
    if (isAlreadyEnriched) {
      skippedCount++;
      continue;
    }

    const provinceName = fileName.replace('tinh-', '').replace('thanh-pho-', '').replace('.json', '').replace(/-/g, ' ');
    console.log(`[Enriching] [${i + 1}/${items.length}] "${item.title}" in ${provinceName}...`);

    // 1. Fetch OSM Nominatim
    const osmData = await fetchOSMData(item.title, provinceName);
    let addressInfo: any = {};
    if (osmData) {
      const addr = osmData.address || {};
      addressInfo = {
        osmId: `${osmData.osm_type}/${osmData.osm_id}`,
        officialName: osmData.display_name,
        latitude: parseFloat(osmData.lat),
        longitude: parseFloat(osmData.lon),
        ward: addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.commune || 'missing_data',
        district: addr.district || addr.county || addr.city_district || addr.town || 'missing_data',
        province: addr.city || addr.state || addr.province || provinceName,
        country: addr.country || 'Vietnam',
        postalCode: addr.postcode || 'missing_data',
        address: osmData.display_name || item.address
      };
    } else {
      addressInfo = {
        osmId: 'missing_data',
        officialName: item.title,
        ward: 'missing_data',
        district: 'missing_data',
        province: provinceName,
        country: 'Vietnam',
        postalCode: 'missing_data'
      };
    }

    // 2. Fetch LLM Enrichment
    const llmData = await fetchLLMEnrichment(item, osmData, provinceName);

    // 3. Merge following priority rules
    // Rule: Tên: Dataset TerraHolic -> OSM -> Google -> Wikipedia
    const officialName = item.title || (osmData ? osmData.display_name : null) || llmData?.englishName || item.title;
    const source_officialName = item.title ? 'TerraHolic' : (osmData ? 'OSM' : (llmData?.englishName ? 'Google' : 'TerraHolic'));

    // Rule: English name: Wikidata -> Wikipedia
    const englishName = llmData?.englishName || null;
    const source_englishName = llmData?.englishName ? (llmData.wikidataId && llmData.wikidataId !== 'missing_data' ? 'Wikidata' : 'Wikipedia') : 'missing_data';

    // Rule: Tọa độ: OSM -> GeoNames -> Google
    const latitude = osmData ? parseFloat(osmData.lat) : item.latitude;
    const longitude = osmData ? parseFloat(osmData.lon) : item.longitude;
    const source_location = osmData ? 'OSM' : 'TerraHolic';

    // Rule: Địa chỉ: Nominatim -> Google -> TerraHolic
    const address = osmData ? osmData.display_name : (llmData?.googleAddress && llmData?.googleAddress !== 'missing_data' ? llmData.googleAddress : (item.address || ''));
    const source_address = osmData ? 'OSM' : (llmData?.googleAddress && llmData?.googleAddress !== 'missing_data' ? 'Google' : 'TerraHolic');

    // Rule: Website: Google -> Wikidata
    const website = llmData?.googleWebsite && llmData?.googleWebsite !== 'missing_data' 
      ? llmData.googleWebsite 
      : (llmData?.wikidataWebsite && llmData?.wikidataWebsite !== 'missing_data' ? llmData.wikidataWebsite : 'missing_data');
    const source_website = llmData?.googleWebsite && llmData?.googleWebsite !== 'missing_data' 
      ? 'Google' 
      : (llmData?.wikidataWebsite && llmData?.wikidataWebsite !== 'missing_data' ? 'Wikidata' : 'missing_data');

    // Rule: Phone: Google
    const phone = llmData?.googlePhone || 'missing_data';
    const source_phone = phone !== 'missing_data' ? 'Google' : 'missing_data';

    // Rule: Rating: Google
    const rating = llmData?.googleRating !== undefined && llmData?.googleRating !== null ? llmData.googleRating : 0;
    const source_rating = llmData?.googleRating !== undefined && llmData?.googleRating !== null ? 'Google' : 'missing_data';

    // Rule: Opening Hours: Google
    const openingHours = llmData?.googleOpeningHours || [];
    const source_openingHours = openingHours.length > 0 ? 'Google' : 'missing_data';

    // Rule: Price Level: Google
    const priceLevel = llmData?.googlePriceLevel || 'missing_data';
    const source_priceLevel = priceLevel !== 'missing_data' ? 'Google' : 'missing_data';

    // Rule: Mô tả: Wikipedia -> Wikidata
    const description = llmData?.wikipediaDescription || llmData?.wikidataDescription || null;
    const source_description = llmData?.wikipediaDescription ? 'Wikipedia' : (llmData?.wikidataDescription ? 'Wikidata' : 'missing_data');

    const merged: Destination = {
      id: item.id || generateSlug(item.title, provinceName),
      province_old: item.province_old || item.province || provinceName,
      province_new: item.province_new || item.province || provinceName,
      title: item.title,
      officialName,
      source_officialName,
      englishName,
      source_englishName,
      category: item.category,
      latitude,
      longitude,
      source_location,
      address,
      source_address,
      ward: addressInfo.ward,
      district: addressInfo.district,
      province: addressInfo.province,
      country: addressInfo.country,
      postalCode: addressInfo.postalCode,
      googlePlaceId: llmData?.googlePlaceId || 'missing_data',
      osmId: addressInfo.osmId,
      wikidataId: llmData?.wikidataId || 'missing_data',
      wikipediaUrl: llmData?.wikipediaUrl || 'missing_data',
      website,
      source_website,
      phone,
      source_phone,
      googleMapsUrl: llmData?.googlePlaceId && llmData.googlePlaceId !== 'missing_data'
        ? `https://www.google.com/maps/place/?q=place_id:${llmData.googlePlaceId}`
        : 'missing_data',
      openingHours,
      source_openingHours,
      businessStatus: llmData?.googleBusinessStatus || 'missing_data',
      rating,
      source_rating,
      reviewCount: llmData?.googleReviewCount || 0,
      priceLevel,
      source_priceLevel,
      photoUrls: item.photoUrls || [],
      lastUpdated: new Date().toISOString(),
      source: {
        osm: !!osmData,
        googlePlaces: !!(llmData?.googlePlaceId && llmData.googlePlaceId !== 'missing_data'),
        wikidata: !!(llmData?.wikidataId && llmData.wikidataId !== 'missing_data'),
        wikipedia: !!(llmData?.wikipediaUrl && llmData.wikipediaUrl !== 'missing_data')
      },
      
      // AI Generated fields (Bổ sung)
      visitDuration: llmData?.visitDuration || 120,
      priorityScore: llmData?.priorityScore || 5.0,
      travelTags: llmData?.travelTags || [],
      familyFriendly: llmData?.familyFriendly !== undefined ? llmData.familyFriendly : true,
      coupleFriendly: llmData?.coupleFriendly !== undefined ? llmData.coupleFriendly : true,
      childrenFriendly: llmData?.childrenFriendly !== undefined ? llmData.childrenFriendly : true,
      elderlyFriendly: llmData?.elderlyFriendly !== undefined ? llmData.elderlyFriendly : true,
      bestVisitTime: llmData?.bestVisitTime || 'missing_data',
      bestSeason: llmData?.bestSeason || 'missing_data',
      searchKeywords: llmData?.searchKeywords || [],

      // Description
      description,
      source_description
    };

    // Category specific
    if (item.category === 'restaurant') {
      merged.cuisine = llmData?.cuisine || 'missing_data';
      merged.averagePriceLevel = llmData?.averagePriceLevel || 'missing_data';
      merged.delivery = llmData?.delivery || false;
      merged.takeaway = llmData?.takeaway || false;
      merged.reservation = llmData?.reservation || false;
      merged.vegetarian = llmData?.vegetarian || false;
    } else if (item.category === 'hotel') {
      merged.starRating = llmData?.starRating || 0;
      merged.checkIn = llmData?.checkIn || '14:00';
      merged.checkOut = llmData?.checkOut || '12:00';
      merged.amenities = llmData?.amenities || [];
      merged.swimmingPool = llmData?.swimmingPool || false;
      merged.parking = llmData?.parking || false;
      merged.breakfast = llmData?.breakfast || false;
    } else if (item.category === 'attraction') {
      merged.visitDuration = llmData?.visitDuration || 120;
      merged.bestVisitTime = llmData?.bestVisitTime || '08:00 - 17:00';
      merged.bestSeason = llmData?.bestSeason || 'missing_data';
      merged.entryTicket = llmData?.entryTicket || 0;
      merged.officialWebsite = website;
    } else if (item.category === 'festival') {
      merged.festivalMonth = llmData?.festivalMonth || 'missing_data';
      merged.startDate = llmData?.startDate || 'missing_data';
      merged.endDate = llmData?.endDate || 'missing_data';
      merged.repeat = llmData?.repeat || true;
    } else if (item.category === 'nature') {
      merged.elevation = llmData?.elevation || 0;
      merged.area = llmData?.area || 'missing_data';
      merged.landscapeType = llmData?.landscapeType || 'missing_data';
      merged.bestSeason = llmData?.bestSeason || 'missing_data';
    }

    items[i] = merged;
    enrichedCount++;

    if (enrichedCount % 3 === 0) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    }
    await sleep(1500);
  }

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
  return { total: items.length, enriched: enrichedCount, skipped: skippedCount };
}

async function enrichAll() {
  console.log('=== TERRAHOLIC DATA ENRICHMENT PIPELINE RUNNING ===');
  if (!fs.existsSync(DEST_DIR)) {
    console.error(`Error: Destinations directory does not exist at ${DEST_DIR}`);
    return;
  }

  let files = fs.readdirSync(DEST_DIR).filter(f => f.endsWith('.json'));
  
  const targetFile = process.argv[2];
  if (targetFile) {
    if (files.includes(targetFile)) {
      files = [targetFile];
      console.log(`Targeting single file: ${targetFile}`);
    } else {
      console.error(`Error: File ${targetFile} not found in destinations directory.`);
      return;
    }
  } else {
    console.log(`Found ${files.length} JSON files to process.`);
  }

  for (const file of files) {
    console.log(`\n----------------------------------------`);
    console.log(`Processing file: ${file}`);
    try {
      const result = await enrichFile(file);
      console.log(`Finished ${file}: Total=${result.total}, Enriched=${result.enriched}, Skipped=${result.skipped}`);
    } catch (e: any) {
      console.error(`Error processing file ${file}:`, e.message);
    }
  }
  console.log('\n=== PIPELINE WORK COMPLETED ===');
}

enrichAll();
