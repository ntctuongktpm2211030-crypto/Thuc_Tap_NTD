import { AddressService } from '../ai-agents/services/address-service';
import { getCuratedProvince } from '../../config/vietnam_destinations';

const addressService = new AddressService();

export interface PlannerParams {
  destination: string;
  durationDays: number;
  dailyBudget: number;
  currency?: string;
  interests: string[];
  travelStyle: string;
}

export interface ActivitySchema {
  timeSlot: string; // e.g. "09:00 - 11:00"
  activityName: string;
  locationName: string;
  estimatedCost: number;
  category: 'restaurant' | 'hotel' | 'attraction' | 'nature' | 'festival';
  latitude: number;
  longitude: number;
  notes: string;
}

export interface TripDaySchema {
  dayIndex: number;
  dateIndex: string; // e.g. "Day 1"
  activities: ActivitySchema[];
}

export interface AIItineraryResponse {
  destination: string;
  totalEstimatedCost: number;
  currency: string;
  days: TripDaySchema[];
}

/**
 * Builds the system instructions prompt detailing constraints, layout models,
 * JSON formats, and fallback logic for OpenAI.
 */
function buildSystemPrompt(currency: string = 'USD'): string {
  return `You are an expert enterprise-grade travel planner. You generate highly optimized itineraries for users based on destination, duration, budget, travel style, and interests.
  
  CRITICAL RULES:
  1. Return ONLY valid JSON matching the exact schema specified. No markdown ticks, no extra text.
  2. Ensure the locations are real places in the destination.
  3. Guess coordinates (latitude, longitude) as accurately as possible for MapLibre map mapping.
  4. Ensure activities map correctly to their categories ("restaurant", "hotel", "attraction", "nature", "festival").
  5. Distribute daily costs logically within the user's budget boundaries.
  6. Enforce realistic travel paths (i.e. morning activities near afternoon activities to minimize travel times).
  7. Respond entirely in Vietnamese. All text values (destination name, activityName, locationName, notes) MUST be in the Vietnamese language.
  8. Do NOT use generic activity names like "Welcome walk", "Morning tour", "Eat local food", "Sightseeing experience", or "Local delicacy tasting". Always output real, actual, and famous tourist spots, monuments, streets, parks, restaurants, cafes, hotels, and specific local culinary specialties of the destination. Make notes detail-rich with actual tips.
  
  JSON STRUCTURE:
  {
    "destination": "Name of destination in Vietnamese",
    "totalEstimatedCost": 120.0,
    "currency": "${currency}",
    "days": [
      {
        "dayIndex": 1,
        "dateIndex": "Ngày 1: Tên mô tả chủ đề ngày",
        "activities": [
          {
            "timeSlot": "09:00 - 11:00",
            "activityName": "Tên địa điểm/hoạt động thực tế (Ví dụ: Dạo Bến Ninh Kiều)",
            "locationName": "Tên địa danh/địa chỉ thực tế (Ví dụ: Bến Ninh Kiều, Cần Thơ)",
            "estimatedCost": 25.0,
            "category": "attraction", // Choose from: "attraction", "restaurant", "hotel", "nature", "festival"
            "latitude": 10.0333,
            "longitude": 105.7833,
            "notes": "Mô tả chi tiết và lời khuyên du lịch thực tế"
          }
        ]
      }
    ]
  }`;
}

function buildUserPrompt(params: PlannerParams): string {
  const curated = getCuratedProvince(params.destination);
  let context = "";
  if (curated) {
    const attractionContext = curated.attractions.length > 0
      ? `Real attractions (use their names and exact coordinates):\n${curated.attractions.map(a => `- ${a.name} (lat: ${a.latitude}, lng: ${a.longitude}): ${a.description}`).join('\n')}`
      : "";
    const restaurantContext = curated.restaurants.length > 0
      ? `Real restaurants/eateries (use their names and exact coordinates):\n${curated.restaurants.map(r => `- ${r.name} (lat: ${r.latitude}, lng: ${r.longitude}): ${r.description}`).join('\n')}`
      : "";
    const hotelContext = curated.hotels.length > 0
      ? `Real hotels/accommodations (use their names and exact coordinates):\n${curated.hotels.map(h => `- ${h.name} (lat: ${h.latitude}, lng: ${h.longitude}): ${h.description}`).join('\n')}`
      : "";
    const natureContext = curated.nature.length > 0
      ? `Real nature/scenic locations (use their names and exact coordinates):\n${curated.nature.map(n => `- ${n.name} (lat: ${n.latitude}, lng: ${n.longitude}): ${n.description}`).join('\n')}`
      : "";
    const festivalContext = curated.festivals.length > 0
      ? `Real local events/festivals (use their names and exact coordinates):\n${curated.festivals.map(f => `- ${f.name} (lat: ${f.latitude}, lng: ${f.longitude}): ${f.description}`).join('\n')}`
      : "";

    context = `
  [CRITICAL: REAL-WORLD GEOGRAPHY DIRECTIVE]
  The destination matches the Vietnamese province: "${curated.provinceName}".
  You MUST ONLY choose from the following real-world locations to construct the itinerary. Do NOT hallucinate or invent any other locations.
  
  ${attractionContext}
  
  ${restaurantContext}
  
  ${hotelContext}
  
  ${natureContext}
  
  ${festivalContext}
  
  Local delicacies/specialties you should incorporate:
  ${curated.specialties.map(s => `- ${s}`).join('\n')}
  
  Set the estimatedCost for each activity to be a realistic number in ${params.currency || 'USD'} (if an activity is free, set it to 0).
  `;
  }

  return `Generate a travel itinerary for:
  - Destination: ${params.destination}
  - Duration: ${params.durationDays} days
  - Daily Budget Limit: ${params.dailyBudget} ${params.currency || 'USD'} per day
  - Travel Style: ${params.travelStyle}
  - Interests: ${params.interests.join(', ')}
  
  Ensure all timeslots are sequenced correctly from morning (e.g. 08:00) to evening (e.g. 21:00).
  Generate the output entirely in Vietnamese.
  ${context}`;
}

/**
 * Generates an itinerary using OpenAI client integration.
 * Includes fallback mocks to ensure runtime availability without active keys.
 */
export async function generateAIItinerary(params: PlannerParams): Promise<AIItineraryResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_key_here') {
    console.warn('⚠️ OpenAI API Key is missing. Returning structured mock itinerary.');
    return await generateFallbackMock(params);
  }

  try {
    const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    // Standard fetch to OpenAI API v1 Chat Completions
    const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName, // Custom endpoint model or default
        messages: [
          { role: 'system', content: buildSystemPrompt(params.currency || 'USD') },
          { role: 'user', content: buildUserPrompt(params) },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content) as AIItineraryResponse;
    return await refineItineraryCoordinates(resultJson, params.destination);
  } catch (error) {
    console.error('❌ Failed to retrieve AI itinerary from OpenAI:', error);
    return await generateFallbackMock(params);
  }
}

/**
 * Refines the itinerary coordinates using the vietnamadminunits package via AddressService.
 * Validates that the parsed location belongs to the correct destination province to prevent false matches.
 */
async function refineItineraryCoordinates(itinerary: AIItineraryResponse, destinationQuery: string): Promise<AIItineraryResponse> {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

  // Resolve destination province first to enforce regional boundary matching
  let destProvince = '';
  let destCoords: { lat: number; lng: number } | null = null;
  try {
    const parsedDest = await addressService.parseAddress(destinationQuery, 'LEGACY')
                    || await addressService.parseAddress(destinationQuery, 'FROM_2025');
    if (parsedDest) {
      destProvince = parsedDest.province || parsedDest.formatted_address || '';
      if (parsedDest.latitude && parsedDest.longitude) {
        destCoords = { lat: parsedDest.latitude, lng: parsedDest.longitude };
      }
    }
  } catch (e) {
    // ignore destination lookup errors
  }

  // String normalization helper
  const clean = (s: string) => {
    return s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\btinh\b/g, '')
      .replace(/\bthanh pho\b/g, '')
      .replace(/\btp\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const cleanDest = clean(destProvince || destinationQuery);

  for (const day of itinerary.days) {
    if (Array.isArray(day.activities)) {
      for (const act of day.activities) {
        const searchTerms = [act.locationName, act.activityName].filter(Boolean);
        let refined = false;

        for (const term of searchTerms) {
          try {
            // Query vietnamadminunits in both legacy (63 provinces) and 2025 (34 provinces) modes
            const parsed = await addressService.parseAddress(term, 'LEGACY')
                        || await addressService.parseAddress(term, 'FROM_2025');

            if (parsed && parsed.latitude && parsed.longitude) {
              const cleanParsedProvince = clean(parsed.province || '');

              // Strict province matching guard: Only override if the parsed unit belongs to the destination province
              if (cleanParsedProvince && (cleanParsedProvince.includes(cleanDest) || cleanDest.includes(cleanParsedProvince))) {
                act.latitude = parsed.latitude;
                act.longitude = parsed.longitude;
                refined = true;
                break; // Match found, skip remaining search terms
              }
            }
          } catch (e) {
            // fallback silently
          }
        }

        // If coordinates are missing or invalid, fallback to the resolved destination coordinates to keep it in the same province
        if (!refined && (!act.latitude || !act.longitude || act.latitude === 0)) {
          if (destCoords) {
            act.latitude = destCoords.lat;
            act.longitude = destCoords.lng;
          }
        }
      }
    }
  }

  return itinerary;
}

/**
 * Generates a mock itinerary stub for localized offline testing.
 */
async function generateFallbackMock(params: PlannerParams): Promise<AIItineraryResponse> {
  const destLower = params.destination.toLowerCase();
  const isVnd = params.currency === 'VND';
  const curated = getCuratedProvince(params.destination);

  if (curated) {
    const days: TripDaySchema[] = [];
    const totalDays = Math.min(params.durationDays, 15);
    
    // Combine attractions, nature, festivals
    const sightseeing = [
      ...curated.attractions,
      ...curated.nature,
      ...curated.festivals
    ];
    const eateries = [...curated.restaurants];
    const hotels = [...curated.hotels];

    for (let i = 1; i <= totalDays; i++) {
      const dayActivities: ActivitySchema[] = [];

      // Check-in on Day 1 morning if hotel exists
      if (i === 1 && hotels.length > 0) {
        const hotel = hotels[0];
        dayActivities.push({
          timeSlot: '08:00 - 09:30',
          activityName: `Nhận phòng tại ${hotel.name}`,
          locationName: `${hotel.name}, ${curated.provinceName}`,
          estimatedCost: isVnd ? hotel.costEstimate : Math.round(hotel.costEstimate / 25000),
          category: 'hotel',
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          notes: hotel.description,
        });
      }

      // Sightseeing 1
      if (sightseeing.length > 0) {
        const place = sightseeing[(i * 2 - 2) % sightseeing.length];
        dayActivities.push({
          timeSlot: dayActivities.length > 0 ? '10:00 - 11:30' : '08:00 - 11:30',
          activityName: `Tham quan ${place.name}`,
          locationName: `${place.name}, ${curated.provinceName}`,
          estimatedCost: isVnd ? place.costEstimate : Math.round(place.costEstimate / 25000),
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          notes: place.description,
        });
      }

      // Lunch/Noon Eating
      if (eateries.length > 0) {
        const rest = eateries[(i - 1) % eateries.length];
        const specName = curated.specialties.length > 0 
          ? curated.specialties[(i - 1) % curated.specialties.length] 
          : 'đặc sản địa phương';
        dayActivities.push({
          timeSlot: '12:00 - 13:30',
          activityName: `Ăn trưa tại ${rest.name}`,
          locationName: `${rest.name}, ${curated.provinceName}`,
          estimatedCost: isVnd ? rest.costEstimate : Math.round(rest.costEstimate / 25000),
          category: 'restaurant',
          latitude: rest.latitude,
          longitude: rest.longitude,
          notes: `Thưởng thức ${specName}. ${rest.description}`,
        });
      }

      // Sightseeing 2 (afternoon)
      if (sightseeing.length > 1) {
        const place = sightseeing[(i * 2 - 1) % sightseeing.length];
        dayActivities.push({
          timeSlot: '15:00 - 17:30',
          activityName: `Khám phá ${place.name}`,
          locationName: `${place.name}, ${curated.provinceName}`,
          estimatedCost: isVnd ? place.costEstimate : Math.round(place.costEstimate / 25000),
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          notes: place.description,
        });
      }

      // Dinner/Evening
      if (eateries.length > 1) {
        const rest = eateries[i % eateries.length];
        dayActivities.push({
          timeSlot: '19:00 - 21:00',
          activityName: `Ăn tối và dạo mát tại ${rest.name}`,
          locationName: `${rest.name}, ${curated.provinceName}`,
          estimatedCost: isVnd ? rest.costEstimate : Math.round(rest.costEstimate / 25000),
          category: 'restaurant',
          latitude: rest.latitude,
          longitude: rest.longitude,
          notes: rest.description,
        });
      }

      days.push({
        dayIndex: i,
        dateIndex: `Ngày ${i}: Trải nghiệm du lịch tại ${curated.provinceName}`,
        activities: dayActivities,
      });
    }

    let totalCost = 0;
    days.forEach(d => d.activities.forEach(a => totalCost += a.estimatedCost));

    return await refineItineraryCoordinates({
      destination: curated.provinceName,
      totalEstimatedCost: totalCost,
      currency: params.currency || 'USD',
      days,
    }, curated.provinceName);
  }

  // Generic fallback if destination is not in the curated database
  const days: TripDaySchema[] = [];
  for (let i = 1; i <= params.durationDays; i++) {
    days.push({
      dayIndex: i,
      dateIndex: `Ngày ${i}: Khám phá ${params.destination}`,
      activities: [
        {
          timeSlot: '08:00 - 11:30',
          activityName: `Tham quan địa danh nổi tiếng`,
          locationName: `${params.destination}`,
          estimatedCost: 0,
          category: 'attraction',
          latitude: 21.028511 + (i * 0.005),
          longitude: 105.804817 + (i * 0.005),
          notes: 'Nên chuẩn bị mũ nón và giày đi bộ thoải mái.',
        },
        {
          timeSlot: '12:00 - 13:30',
          activityName: `Thưởng thức ẩm thực địa phương`,
          locationName: `${params.destination}`,
          estimatedCost: isVnd ? 60000 : 3,
          category: 'restaurant',
          latitude: 21.029511 + (i * 0.005),
          longitude: 105.805817 + (i * 0.005),
          notes: 'Thưởng thức món ngon ẩm thực đường phố được đánh giá cao.',
        },
        {
          timeSlot: '15:00 - 18:00',
          activityName: `Trải nghiệm văn hóa địa phương`,
          locationName: `Phố đi bộ, ${params.destination}`,
          estimatedCost: isVnd ? 40000 : 2,
          category: 'attraction',
          latitude: 21.031511 + (i * 0.005),
          longitude: 105.806817 + (i * 0.005),
          notes: 'Khám phá văn hóa đời sống hàng ngày của người dân bản địa.',
        }
      ],
    });
  }

  return await refineItineraryCoordinates({
    destination: params.destination,
    totalEstimatedCost: params.dailyBudget * params.durationDays * 0.7,
    currency: params.currency || 'USD',
    days,
  });
}
