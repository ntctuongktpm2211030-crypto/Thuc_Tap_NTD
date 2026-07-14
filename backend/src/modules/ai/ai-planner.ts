import { AddressService } from '../ai-agents/services/address-service';
import { getCuratedProvince, RealPlace } from '../../config/vietnam_destinations';
import { calculateHaversineDistance } from '../map/gis-helper';

const addressService = new AddressService();

export interface PlannerParams {
  destination: string;
  durationDays: number;
  totalBudget: number; // replaced dailyBudget
  currency?: string;
  interests: string[];
  travelStyle: string;
}

export interface ActivitySchema {
  session: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối'; // Choose from: "Sáng", "Trưa", "Chiều", "Tối"
  timeSlot: string; // e.g. "09:00 - 11:00"
  activityName: string;
  locationName: string;
  estimatedCost: number;
  category: 'restaurant' | 'hotel' | 'attraction' | 'nature' | 'festival';
  latitude: number;
  longitude: number;
  notes: string;
  address?: string;
}

export interface TripDaySchema {
  dayIndex: number;
  dateIndex: string; // e.g. "Ngày 1"
  activities: ActivitySchema[];
}

export interface AIItineraryResponse {
  destination: string;
  totalEstimatedCost: number;
  currency: string;
  days: TripDaySchema[];
}

export interface AIRegeneratePartParams {
  destination: string;
  durationDays: number;
  totalBudget: number;
  currency?: string;
  interests: string[];
  travelStyle: string;
  
  targetDayIndex: number;
  targetSession?: 'Sáng' | 'Trưa' | 'Chiều' | 'Tối';
  currentItinerary: AIItineraryResponse;
  excludePlaces?: string[];
}

/**
 * Builds the system instructions prompt detailing constraints, layout models,
 * JSON formats, and fallback logic for OpenAI.
 */
function buildSystemPrompt(currency: string = 'USD', totalBudget: number = 0): string {
  return `You are an expert enterprise-grade travel planner. You generate highly optimized itineraries for users based on destination, duration, budget, travel style, and interests.
  
  CRITICAL RULES:
  1. Return ONLY valid JSON matching the exact schema specified. No markdown ticks, no extra text.
  2. Ensure the locations are real places in the destination.
  3. Guess coordinates (latitude, longitude) as accurately as possible for MapLibre map mapping.
  4. Ensure activities map correctly to their categories ("restaurant", "hotel", "attraction", "nature", "festival").
  5. Distribute daily costs logically so that the SUM of all activities' estimatedCost across all days does NOT exceed the total budget of ${totalBudget} ${currency}. Note: transportation and daily buffer fees will be calculated programmatically on top of this by the system, so aim for the sum of activities to be about 70-80% of the total budget.
  6. Enforce realistic travel paths (i.e. morning activities near afternoon activities to minimize travel times).
  7. Respond entirely in Vietnamese. All text values (destination name, activityName, locationName, notes) MUST be in the Vietnamese language.
  8. Do NOT use generic activity names like "Welcome walk", "Morning tour", "Eat local food", "Sightseeing experience", or "Local delicacy tasting". Always output real, actual, and famous tourist spots, monuments, streets, parks, restaurants, cafes, hotels, and specific local culinary specialties of the destination. Make notes detail-rich with actual tips.
  9. Organize each day's activities strictly into 4 sessions: "Sáng", "Trưa", "Chiều", "Tối". Usually:
     - "Sáng": 1-2 activities (e.g. check-in, morning sightseeing/coffee).
     - "Trưa": 1 restaurant/eatery activity (e.g. local lunch).
     - "Chiều": 1-2 activities (afternoon exploration/nature/culture).
     - "Tối": 1-2 activities (dinner at a restaurant, walking street, night market).
  
  JSON STRUCTURE:
  {
    "destination": "Name of destination in Vietnamese",
    "totalEstimatedCost": 120.0,
    "currency": "${currency}",
    "days": [
      {
        "dayIndex": 1,
        "dateIndex": "Ngày 1: Tên mô tả chủ đề ngày (Ví dụ: Khám phá trung tâm thành phố)",
        "activities": [
          {
            "session": "Sáng", // Choose from: "Sáng", "Trưa", "Chiều", "Tối"
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

function buildUserPrompt(params: PlannerParams, centerCoords: { lat: number; lng: number } | null): string {
  const curated = getCuratedProvince(params.destination);
  let context = "";
  if (curated) {
    let attractions = curated.attractions;
    let restaurants = curated.restaurants;
    let hotels = curated.hotels;
    let nature = curated.nature;
    let festivals = curated.festivals;

    // Apply 20km radius constraint if centerCoords are available
    if (centerCoords && centerCoords.lat && centerCoords.lng) {
      const filterFn = (place: RealPlace) => {
        const dist = calculateHaversineDistance(
          { latitude: centerCoords.lat, longitude: centerCoords.lng },
          { latitude: place.latitude, longitude: place.longitude }
        );
        return dist <= 20; // 20km
      };

      const fAttractions = attractions.filter(filterFn);
      const fRestaurants = restaurants.filter(filterFn);
      const fHotels = hotels.filter(filterFn);
      const fNature = nature.filter(filterFn);
      const fFestivals = festivals.filter(filterFn);

      const totalCount = fAttractions.length + fRestaurants.length + fHotels.length + fNature.length + fFestivals.length;
      
      // If we have at least 5 results in the 20km area, restrict to them. Otherwise, take the closest 10 elements in each category.
      if (totalCount >= 5) {
        attractions = fAttractions;
        restaurants = fRestaurants;
        hotels = fHotels;
        nature = fNature;
        festivals = fFestivals;
      } else {
        const sortByDistance = (places: RealPlace[]) => {
          return [...places].map(p => {
            const dist = calculateHaversineDistance(
              { latitude: centerCoords!.lat, longitude: centerCoords!.lng },
              { latitude: p.latitude, longitude: p.longitude }
            );
            return { ...p, dist };
          }).sort((a, b) => a.dist - b.dist).slice(0, 10);
        };
        attractions = sortByDistance(attractions);
        restaurants = sortByDistance(restaurants);
        hotels = sortByDistance(hotels);
        nature = sortByDistance(nature);
        festivals = sortByDistance(festivals);
      }
    }

    const attractionContext = attractions.length > 0
      ? `Real attractions (use their names and exact coordinates):\n${attractions.map(a => `- ${a.name} (lat: ${a.latitude}, lng: ${a.longitude}): ${a.description}`).join('\n')}`
      : "";
    const restaurantContext = restaurants.length > 0
      ? `Real restaurants/eateries (use their names and exact coordinates):\n${restaurants.map(r => `- ${r.name} (lat: ${r.latitude}, lng: ${r.longitude}): ${r.description}`).join('\n')}`
      : "";
    const hotelContext = hotels.length > 0
      ? `Real hotels/accommodations (use their names and exact coordinates):\n${hotels.map(h => `- ${h.name} (lat: ${h.latitude}, lng: ${h.longitude}): ${h.description}`).join('\n')}`
      : "";
    const natureContext = nature.length > 0
      ? `Real nature/scenic locations (use their names and exact coordinates):\n${nature.map(n => `- ${n.name} (lat: ${n.latitude}, lng: ${n.longitude}): ${n.description}`).join('\n')}`
      : "";
    const festivalContext = festivals.length > 0
      ? `Real local events/festivals (use their names and exact coordinates):\n${festivals.map(f => `- ${f.name} (lat: ${f.latitude}, lng: ${f.longitude}): ${f.description}`).join('\n')}`
      : "";

    context = `
  [CRITICAL: REAL-WORLD GEOGRAPHY DIRECTIVE]
  The destination matches the Vietnamese province: "${curated.provinceName}".
  You MUST ONLY choose from the following real-world locations to construct the itinerary. Do NOT hallucinate or invent any other locations. Ensure all locations selected are within 20km from the central area.
  
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
  - Total Trip Budget: ${params.totalBudget} ${params.currency || 'USD'} (total for all days)
  - Travel Style: ${params.travelStyle}
  - Interests: ${params.interests.join(', ')}
  
  Ensure all timeslots are sequenced correctly from morning (e.g. 08:00) to evening (e.g. 21:00).
  Group activities strictly by sessions (Sáng, Trưa, Chiều, Tối).
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

  // Resolve coordinates and correct province name
  let centerCoords: { lat: number; lng: number } | null = null;
  let targetProvinceName = params.destination;
  try {
    const parsedDest = await addressService.parseAddress(params.destination, 'LEGACY')
                    || await addressService.parseAddress(params.destination, 'FROM_2025');
    if (parsedDest) {
      if (parsedDest.latitude && parsedDest.longitude) {
        centerCoords = { lat: parsedDest.latitude, lng: parsedDest.longitude };
      }
      targetProvinceName = parsedDest.short_province || parsedDest.province || targetProvinceName;
    }
  } catch (e) {
    // ignore
  }

  const curated = getCuratedProvince(targetProvinceName);
  if (!centerCoords && curated) {
    const firstPlace = curated.attractions[0] || curated.hotels[0] || curated.nature[0];
    if (firstPlace) {
      centerCoords = { lat: firstPlace.latitude, lng: firstPlace.longitude };
    }
  }

  try {
    const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: buildSystemPrompt(params.currency || 'USD', params.totalBudget) },
          { role: 'user', content: buildUserPrompt(params, centerCoords) },
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
    const refined = await refineItineraryCoordinates(resultJson, params.destination);
    return calculateItineraryCosts(refined, params.travelStyle, params.currency || 'USD');
  } catch (error) {
    console.error('❌ Failed to retrieve AI itinerary from OpenAI:', error);
    const mock = await generateFallbackMock(params);
    return calculateItineraryCosts(mock, params.travelStyle, params.currency || 'USD');
  }
}

/**
 * Regenerates a specific part of an itinerary (a whole day or a single session).
 */
export async function regenerateItineraryPart(params: AIRegeneratePartParams): Promise<AIItineraryResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_key_here') {
    console.warn('⚠️ OpenAI API Key is missing. Returning updated itinerary from fallback.');
    return generateFallbackRegenerate(params);
  }

  const dayIndex = params.targetDayIndex;
  const targetDay = params.currentItinerary.days.find(d => d.dayIndex === dayIndex);
  
  // Find anchor coordinates to maintain geographical clustering within 20km
  let anchorCoords: { lat: number; lng: number }[] = [];
  if (targetDay && targetDay.activities) {
    targetDay.activities.forEach(act => {
      if (params.targetSession && act.session !== params.targetSession && act.latitude && act.longitude) {
        anchorCoords.push({ lat: act.latitude, lng: act.longitude });
      }
    });
  }

  let centerCoords: { lat: number; lng: number } | null = null;
  let targetProvinceName = params.destination;
  
  try {
    const parsed = await addressService.parseAddress(params.destination, 'LEGACY')
                || await addressService.parseAddress(params.destination, 'FROM_2025');
    if (parsed) {
      targetProvinceName = parsed.short_province || parsed.province || targetProvinceName;
      if (anchorCoords.length > 0) {
        centerCoords = anchorCoords[0];
      } else if (parsed.latitude && parsed.longitude) {
        centerCoords = { lat: parsed.latitude, lng: parsed.longitude };
      }
    }
  } catch (e) {}
  
  if (!centerCoords) {
    if (anchorCoords.length > 0) {
      centerCoords = anchorCoords[0];
    } else {
      for (const d of params.currentItinerary.days) {
        for (const act of d.activities) {
          if (act.latitude && act.longitude) {
            centerCoords = { lat: act.latitude, lng: act.longitude };
            break;
          }
        }
        if (centerCoords) break;
      }
    }
  }

  const curated = getCuratedProvince(targetProvinceName);
  let filteredContext = "";
  const excludeList = params.excludePlaces || [];

  if (curated) {
    let attractions = curated.attractions;
    let restaurants = curated.restaurants;
    let hotels = curated.hotels;
    let nature = curated.nature;
    let festivals = curated.festivals;

    const filterFn = (place: RealPlace) => {
      if (excludeList.includes(place.name)) return false;
      if (!centerCoords) return true;
      const dist = calculateHaversineDistance(
        { latitude: centerCoords.lat, longitude: centerCoords.lng },
        { latitude: place.latitude, longitude: place.longitude }
      );
      return dist <= 20; // 20km
    };

    attractions = attractions.filter(filterFn);
    restaurants = restaurants.filter(filterFn);
    hotels = hotels.filter(filterFn);
    nature = nature.filter(filterFn);
    festivals = festivals.filter(filterFn);

    filteredContext = `
    Only select from the following real-world locations in "${curated.provinceName}" within 20km from the central area (exclude already visited: ${excludeList.join(', ')}):
    
    Attractions: ${attractions.map(a => `${a.name} (lat: ${a.latitude}, lng: ${a.longitude})`).join(', ')}
    Restaurants: ${restaurants.map(r => `${r.name} (lat: ${r.latitude}, lng: ${r.longitude})`).join(', ')}
    Hotels: ${hotels.map(h => `${h.name} (lat: ${h.latitude}, lng: ${h.longitude})`).join(', ')}
    Nature: ${nature.map(n => `${n.name} (lat: ${n.latitude}, lng: ${n.longitude})`).join(', ')}
    `;
  }

  const systemPrompt = `You are a travel planning expert.
  You must regenerate a specific portion of an existing travel itinerary and return ONLY a valid JSON.
  
  If regenerating a SESSION, return a JSON object with a single key "activities" containing an array of ActivitySchema objects:
  {
    "activities": [
      {
        "session": "${params.targetSession}",
        "timeSlot": "09:00 - 11:00",
        "activityName": "...",
        "locationName": "...",
        "estimatedCost": 15.0,
        "category": "attraction",
        "latitude": 10.0,
        "longitude": 105.0,
        "notes": "..."
      }
    ]
  }

  If regenerating a WHOLE DAY, return a JSON object representing the TripDaySchema:
  {
    "dayIndex": ${dayIndex},
    "dateIndex": "Ngày ${dayIndex}: ...",
    "activities": [ ... ]
  }
  
  Ensure all text is in Vietnamese. Real locations and coordinates must be chosen from the provided context.`;

  const userPrompt = `
  Regenerate the itinerary part:
  - Destination: ${params.destination}
  - Target Day Index: ${dayIndex}
  - Target Session: ${params.targetSession || 'WHOLE DAY'}
  - Current Full Itinerary: ${JSON.stringify(params.currentItinerary)}
  - Budget style: ${params.travelStyle}
  
  Constraints:
  ${filteredContext}
  - Ensure the new activities fit the travel style and have realistic coordinates.
  - Session coordinates must be within 20km of this day's other activities: ${centerCoords ? `${centerCoords.lat}, ${centerCoords.lng}` : 'N/A'}.
  `;

  try {
    const baseURL = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    const response = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);
    
    const updatedItinerary = { ...params.currentItinerary };
    
    if (params.targetSession) {
      const day = updatedItinerary.days.find(d => d.dayIndex === dayIndex);
      if (day) {
        const otherActivities = day.activities.filter(act => act.session !== params.targetSession);
        const newActivities = resultJson.activities || resultJson;
        day.activities = [...otherActivities, ...newActivities];
      }
    } else {
      const dayIdx = updatedItinerary.days.findIndex(d => d.dayIndex === dayIndex);
      if (dayIdx !== -1) {
        updatedItinerary.days[dayIdx] = resultJson;
      }
    }

    const refined = await refineItineraryCoordinates(updatedItinerary, params.destination);
    return calculateItineraryCosts(refined, params.travelStyle, params.currency || 'USD');

  } catch (error) {
    console.error('❌ Failed to regenerate itinerary part with AI:', error);
    const fb = generateFallbackRegenerate(params);
    return calculateItineraryCosts(fb, params.travelStyle, params.currency || 'USD');
  }
}

/**
 * Refines the itinerary coordinates using the vietnamadminunits package via AddressService.
 * Validates that the parsed location belongs to the correct destination province to prevent false matches.
 */
async function refineItineraryCoordinates(itinerary: AIItineraryResponse, destinationQuery: string): Promise<AIItineraryResponse> {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

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
    // ignore
  }

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

  // Load curated destinations for the province
  let allPlaces: RealPlace[] = [];
  try {
    const curated = getCuratedProvince(destinationQuery);
    if (curated) {
      allPlaces = [
        ...curated.attractions,
        ...curated.restaurants,
        ...curated.hotels,
        ...curated.nature,
        ...curated.festivals
      ];
    }
  } catch (err) {
    console.error('Error loading curated province data in refineItineraryCoordinates:', err);
  }

  // Fallback: calculate average center from local destinations JSON
  if (!destCoords && allPlaces.length > 0) {
    const validPlaces = allPlaces.filter(p => p.latitude && p.longitude && p.latitude !== 0 && p.longitude !== 0 && p.latitude > 8 && p.latitude < 24 && p.longitude > 102 && p.longitude < 110);
    if (validPlaces.length > 0) {
      const sumLat = validPlaces.reduce((sum, p) => sum + p.latitude, 0);
      const sumLng = validPlaces.reduce((sum, p) => sum + p.longitude, 0);
      destCoords = { lat: sumLat / validPlaces.length, lng: sumLng / validPlaces.length };
    }
  }

  const isCoordsValid = (lat: number, lng: number) => {
    if (!lat || !lng || lat === 0 || lng === 0) return false;
    if (destCoords) {
      const dist = calculateHaversineDistance(
        { latitude: destCoords.lat, longitude: destCoords.lng },
        { latitude: lat, longitude: lng }
      );
      const largeProvinces = ['hagiang', 'sonla', 'nghean', 'gialai', 'caobang', 'laocai', 'dienbien', 'quangninh', 'quangnam', 'lamdong', 'thanhhoa', 'daklak', 'tuyenquang'];
      const maxRadius = largeProvinces.includes(cleanDest) ? 120 : 40;
      return dist <= maxRadius;
    }
    return true;
  };

  for (const day of itinerary.days) {
    if (Array.isArray(day.activities)) {
      for (const act of day.activities) {
        let refined = false;
        const normActName = clean(act.activityName || '');
        const normLocName = clean(act.locationName || '');

        // 1. Cross-check with local destinations dataset
        let matchedPlace: RealPlace | null = null;
        if (allPlaces.length > 0) {
          matchedPlace = allPlaces.find(p => {
            const normPName = clean(p.name || '');
            return normPName === normActName || normPName === normLocName ||
                   normActName.includes(normPName) || normPName.includes(normActName) ||
                   normLocName.includes(normPName) || normPName.includes(normLocName);
          }) || null;
        }

        if (matchedPlace) {
          act.address = matchedPlace.address || '';
          // 1. Try local JSON coordinates first if they are valid (within province range)
          if (matchedPlace.latitude && matchedPlace.longitude && isCoordsValid(matchedPlace.latitude, matchedPlace.longitude)) {
            act.latitude = matchedPlace.latitude;
            act.longitude = matchedPlace.longitude;
            refined = true;
          }
          // 2. Fallback: Parse matchedPlace.address via vietnamadminunits if JSON coordinates are invalid/missing
          if (!refined && matchedPlace.address) {
            try {
              const parsed = await addressService.parseAddress(matchedPlace.address, 'LEGACY')
                          || await addressService.parseAddress(matchedPlace.address, 'FROM_2025');
              if (parsed && parsed.latitude && parsed.longitude) {
                const cleanParsedProvince = clean(parsed.province || '');
                if (cleanParsedProvince && (cleanParsedProvince.includes(cleanDest) || cleanDest.includes(cleanParsedProvince)) && isCoordsValid(parsed.latitude, parsed.longitude)) {
                  act.latitude = parsed.latitude;
                  act.longitude = parsed.longitude;
                  if (parsed.formatted_address) {
                    act.locationName = parsed.formatted_address;
                  }
                  refined = true;
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        // 2. Extra fallback: Extract address from description/notes text and parse
        if (!refined) {
          const descText = act.notes || (matchedPlace && matchedPlace.description) || '';
          const addressMatch = descText.match(/(?:số\s+\d+|đường|phường|quận|huyện|thành phố|thị xã|tỉnh)\s+[^.]{5,120}/i);
          if (addressMatch) {
            try {
              const parsed = await addressService.parseAddress(addressMatch[0], 'LEGACY')
                          || await addressService.parseAddress(addressMatch[0], 'FROM_2025');
              if (parsed && parsed.latitude && parsed.longitude) {
                const cleanParsedProvince = clean(parsed.province || '');
                if (cleanParsedProvince && (cleanParsedProvince.includes(cleanDest) || cleanDest.includes(cleanParsedProvince)) && isCoordsValid(parsed.latitude, parsed.longitude)) {
                  act.latitude = parsed.latitude;
                  act.longitude = parsed.longitude;
                  act.address = addressMatch[0];
                  if (parsed.formatted_address) {
                    act.locationName = parsed.formatted_address;
                  }
                  refined = true;
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        // 3. Default fallback: Parse activity names directly if no match found
        if (!refined) {
          const searchTerms = [act.locationName, act.activityName].filter(Boolean);
          for (const term of searchTerms) {
            try {
              const parsed = await addressService.parseAddress(term, 'LEGACY')
                          || await addressService.parseAddress(term, 'FROM_2025');

              if (parsed && parsed.latitude && parsed.longitude) {
                const cleanParsedProvince = clean(parsed.province || '');

                if (cleanParsedProvince && (cleanParsedProvince.includes(cleanDest) || cleanDest.includes(cleanParsedProvince)) && isCoordsValid(parsed.latitude, parsed.longitude)) {
                  act.latitude = parsed.latitude;
                  act.longitude = parsed.longitude;
                  refined = true;
                  break;
                }
              }
            } catch (e) {
              // fallback silently
            }
          }
        }

        // 4. Fallback to destination center coordinates
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
  const isVnd = params.currency === 'VND';
  const curated = getCuratedProvince(params.destination);

  if (curated) {
    const days: TripDaySchema[] = [];
    const totalDays = Math.min(params.durationDays, 15);
    
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
          session: 'Sáng',
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
          session: 'Sáng',
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
          session: 'Trưa',
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
          session: 'Chiều',
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
          session: 'Tối',
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
          session: 'Sáng',
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
          session: 'Trưa',
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
          session: 'Chiều',
          timeSlot: '15:00 - 18:00',
          activityName: `Trải nghiệm văn hóa địa phương`,
          locationName: `Phố đi bộ, ${params.destination}`,
          estimatedCost: isVnd ? 40000 : 2,
          category: 'attraction',
          latitude: 21.031511 + (i * 0.005),
          longitude: 105.806817 + (i * 0.005),
          notes: 'Khám phá văn hóa đời sống hàng ngày của người dân bản địa.',
        },
        {
          session: 'Tối',
          timeSlot: '19:00 - 21:00',
          activityName: `Dạo phố ẩm thực đêm`,
          locationName: `Chợ đêm, ${params.destination}`,
          estimatedCost: isVnd ? 80000 : 4,
          category: 'restaurant',
          latitude: 21.032511 + (i * 0.005),
          longitude: 105.807817 + (i * 0.005),
          notes: 'Trải nghiệm ẩm thực đêm sôi động.'
        }
      ],
    });
  }

  return await refineItineraryCoordinates({
    destination: params.destination,
    totalEstimatedCost: params.totalBudget * 0.75,
    currency: params.currency || 'USD',
    days,
  }, params.destination);
}

function generateFallbackRegenerate(params: AIRegeneratePartParams): AIItineraryResponse {
  const updated = { ...params.currentItinerary };
  const day = updated.days.find(d => d.dayIndex === params.targetDayIndex);
  if (!day) return updated;

  const curated = getCuratedProvince(params.destination);
  const isVnd = params.currency === 'VND';
  const prefix = params.targetSession ? `Thay đổi ${params.targetSession}` : 'Thay đổi cả ngày';
  
  if (params.targetSession) {
    const otherActivities = day.activities.filter(a => a.session !== params.targetSession);
    const newAct: ActivitySchema = {
      session: params.targetSession,
      timeSlot: params.targetSession === 'Sáng' ? '09:00 - 11:00' : params.targetSession === 'Trưa' ? '12:00 - 13:30' : params.targetSession === 'Chiều' ? '15:00 - 17:30' : '19:00 - 21:00',
      activityName: `${prefix} tại điểm mới`,
      locationName: curated ? `${curated.attractions[0]?.name || params.destination}` : params.destination,
      estimatedCost: isVnd ? 50000 : 3,
      category: 'attraction',
      latitude: curated?.attractions[0]?.latitude || 21.0285,
      longitude: curated?.attractions[0]?.longitude || 105.8048,
      notes: 'Lịch trình được tạo tự động mới ở khu vực lân cận.'
    };
    day.activities = [...otherActivities, newAct];
  } else {
    day.activities = [
      {
        session: 'Sáng',
        timeSlot: '08:00 - 11:30',
        activityName: `Khám phá sáng mới ${params.destination}`,
        locationName: params.destination,
        estimatedCost: 0,
        category: 'attraction',
        latitude: 21.0285,
        longitude: 105.8048,
        notes: 'Khám phá văn hóa địa phương buổi sáng.'
      },
      {
        session: 'Trưa',
        timeSlot: '12:00 - 13:30',
        activityName: `Ăn trưa mới tại ${params.destination}`,
        locationName: params.destination,
        estimatedCost: isVnd ? 80000 : 4,
        category: 'restaurant',
        latitude: 21.0295,
        longitude: 105.8058,
        notes: 'Thưởng thức ẩm thực trưa.'
      },
      {
        session: 'Chiều',
        timeSlot: '15:00 - 18:00',
        activityName: `Tham quan chiều mới`,
        locationName: params.destination,
        estimatedCost: 0,
        category: 'attraction',
        latitude: 21.0315,
        longitude: 105.8068,
        notes: 'Tận hưởng cảnh đẹp chiều.'
      },
      {
        session: 'Tối',
        timeSlot: '19:00 - 21:30',
        activityName: `Dạo chơi tối mới`,
        locationName: params.destination,
        estimatedCost: isVnd ? 60000 : 3,
        category: 'restaurant',
        latitude: 21.0325,
        longitude: 105.8078,
        notes: 'Đi dạo và trải nghiệm đêm.'
      }
    ];
  }
  
  let newTotal = 0;
  updated.days.forEach(d => d.activities.forEach(a => newTotal += Number(a.estimatedCost) || 0));
  updated.totalEstimatedCost = newTotal;
  return updated;
}

/**
 * Calculates dynamic costs (activities, transport based on distance, and daily buffer)
 * using the Terraholic Custom Cost Formula.
 * Mutates the itinerary object to populate detailed cost fields and correct data anomalies.
 */
export function calculateItineraryCosts(
  itinerary: AIItineraryResponse,
  travelStyle: string,
  currency: string = 'VND'
): AIItineraryResponse {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

  const isVnd = currency === 'VND';
  const style = travelStyle || 'Adventure';

  // 1. Determine transport rate per km
  let transportRate = 8000; // default VND
  if (isVnd) {
    if (style.includes('Backpacker') || style.includes('Budget')) transportRate = 2000;
    else if (style.includes('Adventure')) transportRate = 5000;
    else if (style.includes('Leisure') || style.includes('Cultural')) transportRate = 12000;
    else if (style.includes('Luxury')) transportRate = 22000;
  } else {
    // USD
    transportRate = 0.40;
    if (style.includes('Backpacker') || style.includes('Budget')) transportRate = 0.10;
    else if (style.includes('Adventure')) transportRate = 0.25;
    else if (style.includes('Leisure') || style.includes('Cultural')) transportRate = 0.60;
    else if (style.includes('Luxury')) transportRate = 1.10;
  }

  // 2. Determine daily buffer cost
  let dailyBuffer = 100000; // default VND
  if (isVnd) {
    if (style.includes('Backpacker') || style.includes('Budget')) dailyBuffer = 40000;
    else if (style.includes('Adventure')) dailyBuffer = 75000;
    else if (style.includes('Leisure') || style.includes('Cultural')) dailyBuffer = 150000;
    else if (style.includes('Luxury')) dailyBuffer = 400000;
  } else {
    // USD
    dailyBuffer = 5.0;
    if (style.includes('Backpacker') || style.includes('Budget')) dailyBuffer = 2.0;
    else if (style.includes('Adventure')) dailyBuffer = 3.5;
    else if (style.includes('Leisure') || style.includes('Cultural')) dailyBuffer = 7.0;
    else if (style.includes('Luxury')) dailyBuffer = 20.0;
  }

  let totalTripDistance = 0;
  let totalTripActivityCost = 0;
  let totalTripTransportCost = 0;
  let totalTripBufferCost = 0;

  itinerary.days.forEach(day => {
    let dayActivityCost = 0;
    let dayDistance = 0;

    if (day.activities && day.activities.length > 0) {
      // Correct any database anomalies (such as street numbers 1, 2, 14 scraped as costEstimate)
      day.activities.forEach(act => {
        const cost = Number(act.estimatedCost) || 0;
        const category = (act.category || '').toLowerCase();
        let correctedCost = cost;

        if (category === 'hotel') {
          // Lodging correction: if less than 5000 VND / 1 USD, replace with baseline
          if (cost < (isVnd ? 5000 : 1)) {
            correctedCost = isVnd
              ? (style.includes('Backpacker') || style.includes('Budget') ? 200000 : style.includes('Adventure') ? 400000 : style.includes('Leisure') || style.includes('Cultural') ? 900000 : style.includes('Luxury') ? 2500000 : 600000)
              : (style.includes('Backpacker') || style.includes('Budget') ? 10 : style.includes('Adventure') ? 18 : style.includes('Leisure') || style.includes('Cultural') ? 40 : style.includes('Luxury') ? 110 : 25);
          }
        } else if (category === 'restaurant') {
          // Dining correction: if less than 5000 VND / 1 USD, replace with baseline
          if (cost < (isVnd ? 5000 : 1)) {
            correctedCost = isVnd
              ? (style.includes('Backpacker') || style.includes('Budget') ? 40000 : style.includes('Adventure') ? 70000 : style.includes('Leisure') || style.includes('Cultural') ? 180000 : style.includes('Luxury') ? 500000 : 100000)
              : (style.includes('Backpacker') || style.includes('Budget') ? 2 : style.includes('Adventure') ? 3.5 : style.includes('Leisure') || style.includes('Cultural') ? 8 : style.includes('Luxury') ? 22 : 4.5);
          }
        } else if (cost > 0 && cost < (isVnd ? 5000 : 0.5)) {
          // Attraction correction: if > 0 but too small, replace with baseline
          correctedCost = isVnd
            ? (style.includes('Backpacker') || style.includes('Budget') || style.includes('Adventure') ? 20000 : style.includes('Leisure') || style.includes('Cultural') ? 50000 : style.includes('Luxury') ? 150000 : 30000)
            : (style.includes('Backpacker') || style.includes('Budget') || style.includes('Adventure') ? 1 : style.includes('Leisure') || style.includes('Cultural') ? 2.5 : style.includes('Luxury') ? 7 : 1.5);
        }

        act.estimatedCost = correctedCost;
        dayActivityCost += correctedCost;
      });

      // Calculate transportation distance between sequential activities
      for (let j = 0; j < day.activities.length - 1; j++) {
        const a1 = day.activities[j];
        const a2 = day.activities[j + 1];
        if (a1.latitude && a1.longitude && a2.latitude && a2.longitude) {
          dayDistance += calculateHaversineDistance(
            { latitude: a1.latitude, longitude: a1.longitude },
            { latitude: a2.latitude, longitude: a2.longitude }
          );
        }
      }

      // Add distance from the last activity back to the first activity (hotel/base loop)
      if (day.activities.length > 1) {
        const first = day.activities[0];
        const last = day.activities[day.activities.length - 1];
        if (first.latitude && first.longitude && last.latitude && last.longitude) {
          dayDistance += calculateHaversineDistance(
            { latitude: last.latitude, longitude: last.longitude },
            { latitude: first.latitude, longitude: first.longitude }
          );
        }
      }
    }

    const dayTransportCost = dayDistance * transportRate;
    const dayBufferCost = dailyBuffer;
    const dayTotalCost = dayActivityCost + dayTransportCost + dayBufferCost;

    // Attach computed parameters to the day object
    (day as any).dailyEstimatedCost = Math.round(dayTotalCost);
    (day as any).activityCost = Math.round(dayActivityCost);
    (day as any).transportCost = Math.round(dayTransportCost);
    (day as any).bufferCost = Math.round(dayBufferCost);
    (day as any).totalDistanceKm = Number(dayDistance.toFixed(2));

    totalTripDistance += dayDistance;
    totalTripActivityCost += dayActivityCost;
    totalTripTransportCost += dayTransportCost;
    totalTripBufferCost += dayBufferCost;
  });

  const totalTripCost = totalTripActivityCost + totalTripTransportCost + totalTripBufferCost;

  // Attach breakdown parameters to the main itinerary object
  itinerary.totalEstimatedCost = Math.round(totalTripCost);
  (itinerary as any).totalActivityCost = Math.round(totalTripActivityCost);
  (itinerary as any).totalTransportCost = Math.round(totalTripTransportCost);
  (itinerary as any).totalBufferCost = Math.round(totalTripBufferCost);
  (itinerary as any).totalDistanceKm = Number(totalTripDistance.toFixed(2));

  return itinerary;
}
