import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';

// ─── Import all module routers ───
import authRouter from './modules/auth/auth.router';
import tripsRouter from './modules/trips/trips.router';
import postsRouter from './modules/posts/posts.router';
import mapRouter from './modules/map/map.router';
import recommendationsRouter from './modules/recommendations/recommendations.router';
import socialRouter from './modules/social/social.router';
import analyticsRouter from './modules/analytics/analytics.router';
import chatbotRouter from './modules/chatbot/routes/chatbot.router';
import itineraryRouter from './modules/itinerary/routes/itinerary.router';
import userRecommendationRouter from './modules/recommendations/routes/recommendation.router';
import travelHistoryRouter from './modules/travel-history/routes/travel-history.router';
import favoriteFoodRouter from './modules/favorite-foods/routes/favorite-food.router';
import savedPlaceRouter from './modules/saved-places/routes/saved-place.router';
import feedbackRouter from './modules/feedback/routes/feedback.router';
import toolCallRouter from './modules/tool-calls/routes/tool-call.router';
import cacheRouter from './modules/cache/routes/cache.router';
import aiAgentRouter from './modules/ai-agents/routes/agent.router';
import ragRouter from './modules/rag/routes/rag.router';

const app = express();

// ─── Global Middleware ───
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ───
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'SmartTravel API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/restart', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Restarting backend server...' });
  setTimeout(() => {
    process.exit(0);
  }, 500);
});

import fs from 'fs';
app.get('/clean-json', (_req: Request, res: Response) => {
  try {
    const filePath = 'd:/Thuc_Tap_NDT/knowledge-builder/import-data-camau.json';
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    function removeAccents(str: string): string {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    }

    const keywords = [
      'phú quốc', 'phụ quốc', 'hòn khô', 'cô tô', 'núi cấm', 'núi sam', 'núi mây',
      'cáp treo', 'thác', 'đèo', 'lặn biển', 'trường sa', 'hoàng sa', 'ngọc điểm',
      'ngũ hành', 'trà sư', 'tắm biển'
    ];

    const cleanData = data.filter((item: any) => {
      const titleClean = removeAccents(item.title.toLowerCase());
      const contentClean = removeAccents(item.content.toLowerCase());

      const hasBadKeyword = keywords.some(term => {
        const termClean = removeAccents(term.toLowerCase());
        return titleClean.includes(termClean) || contentClean.includes(termClean);
      });
      if (hasBadKeyword) return false;

      if (titleClean.includes('nui') || /\bnui\b/i.test(contentClean)) {
        if (!titleClean.includes('an giang') && !contentClean.includes('an giang') && !contentClean.includes('hon khoai') && !contentClean.includes('hon da bac')) {
          return false;
        }
      }

      return true;
    });

    const deletedCount = data.length - cleanData.length;
    fs.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');

    res.status(200).json({
      status: 'success',
      originalCount: data.length,
      cleanCount: cleanData.length,
      deletedCount
    });
  } catch (err: any) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

app.get('/enrich-file', async (req: Request, res: Response) => {
  const fileName = req.query.file as string;
  if (!fileName) {
    return res.status(400).json({ error: 'Missing file parameter' });
  }

  const destDir = path.resolve(__dirname, 'config/destinations');
  const filePath = path.join(destDir, fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `File not found: ${fileName}` });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'File content must be an array' });
    }

    const GROQ_API_KEY = process.env.OPENAI_API_KEY || '';
    const GROQ_API_URL = process.env.OPENAI_API_BASE_URL || 'https://api.groq.com/openai/v1';
    const GROQ_MODEL = process.env.OPENAI_MODEL_NAME || 'llama-3.1-8b-instant';

    const provinceName = fileName.replace('tinh-', '').replace('thanh-pho-', '').replace('.json', '').replace(/-/g, ' ');

    let enrichedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if already enriched to support resume-on-failure
      const isEnriched = item.googlePlaceId && item.googlePlaceId !== 'missing_data' && 
                         item.osmId && item.osmId !== 'missing_data' && 
                         item.source;
      if (isEnriched) {
        skippedCount++;
        continue;
      }

      // Throttling sleep to respect OSM Nominatim rate limits (at least 1s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. Fetch OSM Nominatim
      let osmData: any = null;
      const queries = [
        `${item.title}, ${provinceName}, Vietnam`,
        `${item.title}, ${provinceName}`,
        item.title
      ];

      for (const q of queries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
          const osmRes = await fetch(url, {
            headers: { 'User-Agent': 'TerraHolicDataEnrichmentAgent/1.0 (contact@terraholic.com)' }
          });
          if (osmRes.ok) {
            const data = await osmRes.json() as any[];
            if (data && data.length > 0) {
              osmData = data[0];
              break;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err: any) {
          console.warn(`[OSM] Failed query "${q}":`, err.message);
        }
      }

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

      // 2. Fetch Google Places & Specific Fields via LLM
      let llmData: any = null;
      if (GROQ_API_KEY) {
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
- Coordinates: [${item.latitude || addressInfo.latitude}, ${item.longitude || addressInfo.longitude}]
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
            const groqRes = await fetch(`${GROQ_API_URL}/chat/completions`, {
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

            if (groqRes.ok) {
              const resBody = await groqRes.json() as any;
              const text = resBody.choices[0].message.content.trim();
              llmData = JSON.parse(text);
              break; // Success
            } else if (groqRes.status === 429) {
              console.warn(`[Groq LLM] Rate limit (429) hit for "${item.title}". Retrying in ${retryDelay}ms... (Attempt ${attempt}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryDelay *= 2; // Exponential backoff
            } else {
              console.warn(`[Groq LLM] Failed: status ${groqRes.status} on attempt ${attempt}`);
              if (groqRes.status !== 500 && groqRes.status !== 502 && groqRes.status !== 503 && groqRes.status !== 504) {
                break; // Non-transient error
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (err: any) {
            console.error(`[Groq LLM] Error fetching (attempt ${attempt}):`, err.message);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }

      // Generate clean slug ID
      function generateSlug(title: string, prov: string): string {
        let str = `${prov}-${title}`.toLowerCase();
        str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        str = str.replace(/đ/g, 'd').replace(/Đ/g, 'd');
        str = str.replace(/[^a-z0-9\s-]/g, '');
        str = str.replace(/[\s_]+/g, '-');
        str = str.replace(/-+/g, '-');
        return str.trim().replace(/^-+|-+$/g, '');
      }

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

      const merged: any = {
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

      // Merge category-specific fields
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
    }

    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    res.status(200).json({
      status: 'success',
      fileName,
      total: items.length,
      enriched: enrichedCount,
      skipped: skippedCount
    });
  } catch (err: any) {
    res.status(500).json({ status: 'failed', error: err.message });
  }
});

// ─── API Routes ───────────────────────────────────────────
// Authentication: register / login / refresh / me
app.use('/api/v1/auth', authRouter);

// Trips: CRUD + AI generation + TSP optimization + cloning
app.use('/api/v1/trips', tripsRouter);

// Posts: blog posts + likes + bookmarks + comments
app.use('/api/v1/posts', postsRouter);

// Map/GIS: check-ins + live location + nearby + destinations
app.use('/api/v1/map', mapRouter);

// Recommendations: AI-scored + spatial proximity + destination catalog
app.use('/api/v1/recommendations', recommendationsRouter);

// Social: profile, follow/unfollow, notifications, user search
app.use('/api/v1/social', socialRouter);

// Analytics: platform stats, AI usage, GIS heatmap, trip trends
app.use('/api/v1/analytics', analyticsRouter);

// Chatbot: Core AI Conversation + AI Memory
app.use('/api/v1/chatbot', chatbotRouter);

// Itinerary: Itineraries + Days + Activities
app.use('/api/v1/itineraries', itineraryRouter);

// Recommendations (User Custom): Add + Update + Delete + List
app.use('/api/v1/user-recommendations', userRecommendationRouter);

// Travel History: Visited Locations + Dates + Ratings + Costs
app.use('/api/v1/travel-history', travelHistoryRouter);

// Favorite Foods: Food Name + Region + Description + Rating
app.use('/api/v1/favorite-foods', favoriteFoodRouter);

// Saved Places: Place Name + Category + Coordinates + Address + Image
app.use('/api/v1/saved-places', savedPlaceRouter);

// Feedback: AI Chat Messages Rating & Comments
app.use('/api/v1/feedback', feedbackRouter);

// ToolCall: AI Chatbot Tool Usage Logs
app.use('/api/v1/tool-calls', toolCallRouter);

// Cache: Place, Food and Blog API Caching (TTL-based)
app.use('/api/v1/cache', cacheRouter);

// AI Agent: Multi-agent execution (Strategy & DI Pattern)
app.use('/api/v1/ai-agents', aiAgentRouter);

// RAG: Retrieval-Augmented Generation (Embeddings + Vector Storage + Retriever + Prompt Builder)
app.use('/api/v1/rag', ragRouter);

// ─── 404 Handler ─────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found.',
    hint: 'Available base paths: /api/v1/auth, /api/v1/trips, /api/v1/posts, /api/v1/map, /api/v1/recommendations, /api/v1/social',
  });
});

// ─── Centralized Error Handling ──────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

export default app;
