"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIItinerary = generateAIItinerary;
exports.regenerateItineraryPart = regenerateItineraryPart;
exports.calculateItineraryCosts = calculateItineraryCosts;
const address_service_1 = require("../ai-agents/services/address-service");
const vietnam_destinations_1 = require("../../config/vietnam_destinations");
const gis_helper_1 = require("../map/gis-helper");
const addressService = new address_service_1.AddressService();
/**
 * Builds the system instructions prompt detailing constraints, layout models,
 * JSON formats, and fallback logic for OpenAI.
 */
function buildSystemPrompt(currency = 'USD', totalBudget = 0) {
    return `You are an expert enterprise-grade travel planner. You generate highly optimized itineraries for users based on destination, duration, budget, travel style, and interests.
  
  CRITICAL RULES:
  1. Return ONLY valid JSON matching the exact schema specified. No markdown ticks, no extra text.
  2. Ensure the locations are real places in the destination.
  3. Guess coordinates (latitude, longitude) as accurately as possible for MapLibre map mapping.
  4. Ensure activities map correctly to their categories ("restaurant", "hotel", "attraction", "nature", "festival").
  5. Distribute daily costs logically so that the SUM of all activities' estimatedCost across all days does NOT exceed the total budget of ${totalBudget} ${currency}. Note: transportation and daily buffer fees will be calculated programmatically on top of this by the system, so aim for the sum of activities to be about 70-80% of the total budget.
  6. Enforce realistic travel paths. ALL locations planned in the SAME day MUST be located within a 15km radius of each other. Do NOT plan remote/far-away spots in the same day (for instance, do not mix Mũi Cà Mau and Cà Mau city center on the same day as they are 100km apart). Plan city center activities together on one day, and remote nature spots on another day.
  7. Respond entirely in Vietnamese. All text values (destination name, activityName, locationName, notes) MUST be in the Vietnamese language.
  8. Do NOT use generic activity names like "Welcome walk", "Morning tour", "Eat local food", "Sightseeing experience", or "Local delicacy tasting". Always output real, actual, and famous tourist spots, monuments, streets, parks, restaurants, cafes, hotels, and specific local culinary specialties of the destination. Make notes detail-rich with actual tips.
  9. Organize each day's activities strictly into exactly 5 activities in this order:
     - Activity 1 (session="Sáng"): Morning sightseeing/activities. Fields: "session": "Sáng", "timeSlot" (e.g. "08:00 - 11:30"), "activityName", "locationName", "thoiGianThamQuan" (e.g. "2 tiếng"), "goiYTraiNghiem" (rich tips), "estimatedCost", "category": "attraction" (or "nature"), "latitude", "longitude", "notes".
     - Activity 2 (session="Ăn sáng"): Breakfast. Fields: "session": "Ăn sáng", "timeSlot" (e.g. "07:00 - 08:00"), "activityName" (monAn), "locationName" (quanGoiY), "estimatedCost", "category": "restaurant", "latitude", "longitude", "notes".
     - Activity 3 (session="Trưa"): Lunch. Fields: "session": "Trưa", "timeSlot" (e.g. "12:00 - 13:30"), "activityName" (anTrua), "locationName" (quanGoiY), "monDacSan" (mon đặc sản), "thoiGianNghiNgoi" (thời gian nghỉ ngơi), "estimatedCost", "category": "restaurant", "latitude", "longitude", "notes".
     - Activity 4 (session="Chiều"): Afternoon sightseeing/activities. Fields: "session": "Chiều", "timeSlot" (e.g. "14:00 - 17:30"), "activityName", "locationName", "thoiGianLuuLai" (e.g. "3 tiếng"), "estimatedCost", "category": "attraction" (or "nature"), "latitude", "longitude", "notes".
     - Activity 5 (session="Tối"): Dinner and Evening. Fields: "session": "Tối", "timeSlot" (e.g. "18:30 - 22:00"), "activityName", "locationName" (nghiDemODau), "anToi" (ăn tối món gì ở đâu), "diaDiemDaoChoi" (điểm đi dạo chơi), "choDem" (chợ đêm), "cafe" (quán cà phê), "hoatDongGiaiTri" (hoạt động giải trí), "nghiDemODau" (nơi nghỉ đêm), "estimatedCost", "category": "hotel" (or "restaurant"), "latitude", "longitude", "notes".
  10. DUPLICATE & REPETITION PREVENTION: Every single activity, hotel, restaurant, and sightseeing spot generated MUST be unique. Do NOT repeat any locations or activities across different days or within the same day. Each day must feature completely different, fresh spots.
  
  JSON STRUCTURE:
  {
    "destination": "Tên địa điểm bằng tiếng Việt",
    "totalEstimatedCost": 120.0,
    "currency": "${currency}",
    "days": [
      {
        "dayIndex": 1,
        "dateIndex": "Ngày 1: Tên mô tả chủ đề ngày",
        "activities": [
          // Gồm đúng 5 hoạt động theo thứ tự (Sáng, Ăn sáng, Trưa, Chiều, Tối) với các trường đã mô tả ở trên.
        ]
      }
    ]
  }`;
}
function buildUserPrompt(params, centerCoords) {
    const curated = (0, vietnam_destinations_1.getCuratedProvince)(params.destination);
    let context = "";
    if (curated) {
        let attractions = curated.attractions;
        let restaurants = curated.restaurants;
        let hotels = curated.hotels;
        let nature = curated.nature;
        let festivals = curated.festivals;
        // Apply 20km radius constraint if centerCoords are available
        if (centerCoords && centerCoords.lat && centerCoords.lng) {
            const filterFn = (place) => {
                const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: centerCoords.lat, longitude: centerCoords.lng }, { latitude: place.latitude, longitude: place.longitude });
                return dist <= 20; // 20km
            };
            const fAttractions = attractions.filter(filterFn);
            const fRestaurants = restaurants.filter(filterFn);
            const fHotels = hotels.filter(filterFn);
            const fNature = nature.filter(filterFn);
            const fFestivals = festivals.filter(filterFn);
            const totalCount = fAttractions.length + fRestaurants.length + fHotels.length + fNature.length + fFestivals.length;
            // If we have at least 5 results in the 20km area, restrict to them. Otherwise, take the closest ones.
            if (totalCount >= 5) {
                const sortByRating = (places, limit) => {
                    return [...places].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, limit);
                };
                attractions = sortByRating(fAttractions, 8);
                restaurants = sortByRating(fRestaurants, 8);
                hotels = sortByRating(fHotels, 6);
                nature = sortByRating(fNature, 6);
                festivals = sortByRating(fFestivals, 6);
            }
            else {
                const sortByDistance = (places, limit) => {
                    return [...places].map(p => {
                        const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: centerCoords.lat, longitude: centerCoords.lng }, { latitude: p.latitude, longitude: p.longitude });
                        return { ...p, dist };
                    }).sort((a, b) => a.dist - b.dist).slice(0, limit);
                };
                attractions = sortByDistance(attractions, 8);
                restaurants = sortByDistance(restaurants, 8);
                hotels = sortByDistance(hotels, 6);
                nature = sortByDistance(nature, 6);
                festivals = sortByDistance(festivals, 6);
            }
        }
        else {
            // Sort by rating and slice to prevent large payload (HTTP 413)
            const sortByRating = (places, limit) => {
                return [...places].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, limit);
            };
            attractions = sortByRating(attractions, 8);
            restaurants = sortByRating(restaurants, 8);
            hotels = sortByRating(hotels, 6);
            nature = sortByRating(nature, 6);
            festivals = sortByRating(festivals, 6);
        }
        const attractionContext = attractions.length > 0
            ? `Real attractions (use their names and exact coordinates):\n${attractions.map(a => `- ${a.name} (lat: ${a.latitude}, lng: ${a.longitude})`).join('\n')}`
            : "";
        const restaurantContext = restaurants.length > 0
            ? `Real restaurants/eateries (use their names and exact coordinates):\n${restaurants.map(r => `- ${r.name} (lat: ${r.latitude}, lng: ${r.longitude})`).join('\n')}`
            : "";
        const hotelContext = hotels.length > 0
            ? `Real hotels/accommodations (use their names and exact coordinates):\n${hotels.map(h => `- ${h.name} (lat: ${h.latitude}, lng: ${h.longitude})`).join('\n')}`
            : "";
        const natureContext = nature.length > 0
            ? `Real nature/scenic locations (use their names and exact coordinates):\n${nature.map(n => `- ${n.name} (lat: ${n.latitude}, lng: ${n.longitude})`).join('\n')}`
            : "";
        const festivalContext = festivals.length > 0
            ? `Real local events/festivals (use their names and exact coordinates):\n${festivals.map(f => `- ${f.name} (lat: ${f.latitude}, lng: ${f.longitude})`).join('\n')}`
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
  - Transportation: ${params.transportation || 'Any (Xe máy/Xe khách/Ô tô)'}
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
async function generateAIItinerary(params) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
        console.warn('⚠️ OpenAI API Key is missing. Returning structured mock itinerary.');
        return await generateFallbackMock(params);
    }
    // Resolve coordinates and correct province name
    let centerCoords = null;
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
    }
    catch (e) {
        // ignore
    }
    const curated = (0, vietnam_destinations_1.getCuratedProvince)(targetProvinceName);
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
                max_tokens: 1500,
            }),
        });
        if (!response.ok) {
            const errBody = await response.text().catch(() => 'No error body');
            console.error(`❌ OpenAI/Groq API Error: Status ${response.status}, Body: ${errBody}`);
            throw new Error(`OpenAI API responded with status ${response.status}: ${errBody}`);
        }
        const data = await response.json();
        const resultJson = JSON.parse(data.choices[0].message.content);
        const refined = await refineItineraryCoordinates(resultJson, params.destination);
        return calculateItineraryCosts(refined, params.travelStyle, params.currency || 'USD');
    }
    catch (error) {
        console.error('❌ Failed to retrieve AI itinerary from OpenAI:', error);
        const mock = await generateFallbackMock(params);
        return calculateItineraryCosts(mock, params.travelStyle, params.currency || 'USD');
    }
}
/**
 * Regenerates a specific part of an itinerary (a whole day or a single session).
 */
async function regenerateItineraryPart(params) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
        console.warn('⚠️ OpenAI API Key is missing. Returning updated itinerary from fallback.');
        return generateFallbackRegenerate(params);
    }
    const dayIndex = params.targetDayIndex;
    const targetDay = params.currentItinerary.days.find(d => d.dayIndex === dayIndex);
    // Find anchor coordinates to maintain geographical clustering within 20km
    let anchorCoords = [];
    if (targetDay && targetDay.activities) {
        targetDay.activities.forEach(act => {
            if (params.targetSession && act.session !== params.targetSession && act.latitude && act.longitude) {
                anchorCoords.push({ lat: act.latitude, lng: act.longitude });
            }
        });
    }
    let centerCoords = null;
    let targetProvinceName = params.destination;
    try {
        const parsed = await addressService.parseAddress(params.destination, 'LEGACY')
            || await addressService.parseAddress(params.destination, 'FROM_2025');
        if (parsed) {
            targetProvinceName = parsed.short_province || parsed.province || targetProvinceName;
            if (anchorCoords.length > 0) {
                centerCoords = anchorCoords[0];
            }
            else if (parsed.latitude && parsed.longitude) {
                centerCoords = { lat: parsed.latitude, lng: parsed.longitude };
            }
        }
    }
    catch (e) { }
    if (!centerCoords) {
        if (anchorCoords.length > 0) {
            centerCoords = anchorCoords[0];
        }
        else {
            for (const d of params.currentItinerary.days) {
                for (const act of d.activities) {
                    if (act.latitude && act.longitude) {
                        centerCoords = { lat: act.latitude, lng: act.longitude };
                        break;
                    }
                }
                if (centerCoords)
                    break;
            }
        }
    }
    const curated = (0, vietnam_destinations_1.getCuratedProvince)(targetProvinceName);
    let filteredContext = "";
    const excludeList = params.excludePlaces || [];
    if (curated) {
        let attractions = curated.attractions;
        let restaurants = curated.restaurants;
        let hotels = curated.hotels;
        let nature = curated.nature;
        let festivals = curated.festivals;
        const filterFn = (place) => {
            if (excludeList.includes(place.name))
                return false;
            if (!centerCoords)
                return true;
            const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: centerCoords.lat, longitude: centerCoords.lng }, { latitude: place.latitude, longitude: place.longitude });
            return dist <= 15; // 15km
        };
        const sortByRating = (places, limit) => {
            return [...places].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, limit);
        };
        attractions = sortByRating(attractions.filter(filterFn), 8);
        restaurants = sortByRating(restaurants.filter(filterFn), 8);
        hotels = sortByRating(hotels.filter(filterFn), 6);
        nature = sortByRating(nature.filter(filterFn), 6);
        festivals = sortByRating(festivals.filter(filterFn), 6);
        filteredContext = `
    Only select from the following real-world locations in "${curated.provinceName}" within 15km from the central area (exclude already visited: ${excludeList.join(', ')}):
    
    Attractions: ${attractions.map(a => `${a.name} (lat: ${a.latitude}, lng: ${a.longitude})`).join(', ')}
    Restaurants: ${restaurants.map(r => `${r.name} (lat: ${r.latitude}, lng: ${r.longitude})`).join(', ')}
    Hotels: ${hotels.map(h => `${h.name} (lat: ${h.latitude}, lng: ${h.longitude})`).join(', ')}
    Nature: ${nature.map(n => `${n.name} (lat: ${n.latitude}, lng: ${n.longitude})`).join(', ')}
    `;
    }
    const systemPrompt = `You are a travel planning expert.
  You must regenerate a specific portion of an existing travel itinerary and return ONLY a valid JSON.
  
  CRITICAL EXCLUSION RULE:
  You MUST NOT reuse or load any locations or activities that have already been visited or are present in the current itinerary. The new regenerated locations/activities MUST be completely new and different from any existing ones. DO NOT output any location name present in the excludePlaces list.
  
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
  - Exclude List (DO NOT REUSE ANY OF THESE PLACES): ${JSON.stringify(excludeList)}
  - Current Full Itinerary: ${JSON.stringify(params.currentItinerary)}
  - Budget style: ${params.travelStyle}
  
  Constraints:
  ${filteredContext}
  - Ensure the new activities fit the travel style and have realistic coordinates.
  - The new activities and location names MUST be completely different from any names in the Exclude List.
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
                const sessionOrder = ['Sáng', 'Ăn sáng', 'Trưa', 'Chiều', 'Tối'];
                day.activities.sort((a, b) => {
                    return sessionOrder.indexOf(a.session) - sessionOrder.indexOf(b.session);
                });
            }
        }
        else {
            const dayIdx = updatedItinerary.days.findIndex(d => d.dayIndex === dayIndex);
            if (dayIdx !== -1) {
                updatedItinerary.days[dayIdx] = resultJson;
                const sessionOrder = ['Sáng', 'Ăn sáng', 'Trưa', 'Chiều', 'Tối'];
                if (updatedItinerary.days[dayIdx].activities) {
                    updatedItinerary.days[dayIdx].activities.sort((a, b) => {
                        return sessionOrder.indexOf(a.session) - sessionOrder.indexOf(b.session);
                    });
                }
            }
        }
        const refined = await refineItineraryCoordinates(updatedItinerary, params.destination);
        return calculateItineraryCosts(refined, params.travelStyle, params.currency || 'USD');
    }
    catch (error) {
        console.error('❌ Failed to regenerate itinerary part with AI:', error);
        const fb = generateFallbackRegenerate(params);
        return calculateItineraryCosts(fb, params.travelStyle, params.currency || 'USD');
    }
}
/**
 * Refines the itinerary coordinates using the vietnamadminunits package via AddressService.
 * Validates that the parsed location belongs to the correct destination province to prevent false matches.
 */
async function refineItineraryCoordinates(itinerary, destinationQuery) {
    if (!itinerary || !Array.isArray(itinerary.days))
        return itinerary;
    let destProvince = '';
    let destCoords = null;
    try {
        const parsedDest = await addressService.parseAddress(destinationQuery, 'LEGACY')
            || await addressService.parseAddress(destinationQuery, 'FROM_2025');
        if (parsedDest) {
            destProvince = parsedDest.province || parsedDest.formatted_address || '';
            if (parsedDest.latitude && parsedDest.longitude) {
                destCoords = { lat: parsedDest.latitude, lng: parsedDest.longitude };
            }
        }
    }
    catch (e) {
        // ignore
    }
    const clean = (s) => {
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
    let allPlaces = [];
    try {
        const curated = (0, vietnam_destinations_1.getCuratedProvince)(destinationQuery);
        if (curated) {
            allPlaces = [
                ...curated.attractions,
                ...curated.restaurants,
                ...curated.hotels,
                ...curated.nature,
                ...curated.festivals
            ];
        }
    }
    catch (err) {
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
    const isCoordsValid = (lat, lng) => {
        if (!lat || !lng || lat === 0 || lng === 0)
            return false;
        if (destCoords) {
            const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: destCoords.lat, longitude: destCoords.lng }, { latitude: lat, longitude: lng });
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
                let matchedPlace = null;
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
                        }
                        catch (e) {
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
                        }
                        catch (e) {
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
                        }
                        catch (e) {
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
async function generateFallbackMock(params) {
    const isVnd = params.currency === 'VND';
    const curated = (0, vietnam_destinations_1.getCuratedProvince)(params.destination);
    if (curated) {
        const days = [];
        const totalDays = Math.min(params.durationDays, 15);
        const sightseeing = [
            ...curated.attractions,
            ...curated.nature,
            ...curated.festivals
        ];
        const eateries = [...curated.restaurants];
        const hotels = [...curated.hotels];
        for (let i = 1; i <= totalDays; i++) {
            const dayActivities = [];
            const hotel = hotels[(i - 1) % Math.max(1, hotels.length)] || {
                name: 'Khách sạn trung tâm',
                costEstimate: isVnd ? 500000 : 25,
                latitude: curated.hotels[0]?.latitude || 21.0285,
                longitude: curated.hotels[0]?.longitude || 105.8048,
                description: 'Khách sạn sạch sẽ, đầy đủ tiện nghi.'
            };
            // Lọc các điểm tham quan và quán ăn lân cận khách sạn trong bán kính dưới 15km
            const localSightseeing = sightseeing.filter(p => {
                const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: hotel.latitude, longitude: hotel.longitude }, { latitude: p.latitude, longitude: p.longitude });
                return dist <= 15;
            });
            const localEateries = eateries.filter(r => {
                const dist = (0, gis_helper_1.calculateHaversineDistance)({ latitude: hotel.latitude, longitude: hotel.longitude }, { latitude: r.latitude, longitude: r.longitude });
                return dist <= 15;
            });
            const place1 = localSightseeing[(i * 2 - 2) % Math.max(1, localSightseeing.length)] || sightseeing[(i * 2 - 2) % Math.max(1, sightseeing.length)] || {
                name: 'Điểm tham quan buổi sáng',
                costEstimate: 0,
                category: 'attraction',
                latitude: hotel.latitude + 0.005,
                longitude: hotel.longitude + 0.005,
                description: 'Điểm đến thú vị, thu hút khách du lịch.'
            };
            const place2 = localSightseeing[(i * 2 - 1) % Math.max(1, localSightseeing.length)] || sightseeing[(i * 2 - 1) % Math.max(1, sightseeing.length)] || {
                name: 'Điểm tham quan buổi chiều',
                costEstimate: 0,
                category: 'nature',
                latitude: hotel.latitude + 0.01,
                longitude: hotel.longitude + 0.01,
                description: 'Khung cảnh thiên nhiên hữu tình, trong lành.'
            };
            const breakfastPlace = localEateries[(i * 2 - 2) % Math.max(1, localEateries.length)] || eateries[(i * 2 - 2) % Math.max(1, eateries.length)] || {
                name: 'Quán ăn sáng địa phương',
                costEstimate: isVnd ? 45000 : 2,
                latitude: hotel.latitude + 0.002,
                longitude: hotel.longitude + 0.002,
                description: 'Phục vụ món ăn sáng gia truyền thơm ngon.'
            };
            const lunchPlace = localEateries[(i * 2 - 1) % Math.max(1, localEateries.length)] || eateries[(i * 2 - 1) % Math.max(1, eateries.length)] || {
                name: 'Nhà hàng ăn trưa',
                costEstimate: isVnd ? 150000 : 8,
                latitude: hotel.latitude + 0.004,
                longitude: hotel.longitude + 0.004,
                description: 'Không gian ấm cúng, phục vụ nhiều đặc sản.'
            };
            // 1. Sáng
            dayActivities.push({
                session: 'Sáng',
                timeSlot: '08:00 - 11:30',
                activityName: `Khám phá ${place1.name}`,
                locationName: `${place1.name}, ${curated.provinceName}`,
                thoiGianThamQuan: '2.5 tiếng',
                goiYTraiNghiem: `Tham quan, chụp hình lưu niệm tại ${place1.name}. ${place1.description}`,
                estimatedCost: isVnd ? place1.costEstimate : Math.round(place1.costEstimate / 25000),
                category: place1.category || 'attraction',
                latitude: place1.latitude,
                longitude: place1.longitude,
                notes: place1.description,
            });
            // 2. Ăn sáng
            dayActivities.push({
                session: 'Ăn sáng',
                timeSlot: '07:00 - 08:00',
                activityName: curated.specialties.length > 0 ? curated.specialties[(i - 1) % curated.specialties.length] : 'Bún bò Huế/Hủ tiếu',
                locationName: breakfastPlace.name,
                estimatedCost: isVnd ? breakfastPlace.costEstimate : Math.round(breakfastPlace.costEstimate / 25000),
                category: 'restaurant',
                latitude: breakfastPlace.latitude,
                longitude: breakfastPlace.longitude,
                notes: 'Thưởng thức món ăn sáng đặc sắc địa phương.',
            });
            // 3. Trưa
            dayActivities.push({
                session: 'Trưa',
                timeSlot: '12:00 - 13:30',
                activityName: `Ăn trưa đặc sản tại ${lunchPlace.name}`,
                locationName: lunchPlace.name,
                monDacSan: curated.specialties.length > 1 ? curated.specialties[i % curated.specialties.length] : 'Gỏi cá, lẩu thả',
                thoiGianNghiNgoi: '12:00 - 13:30',
                estimatedCost: isVnd ? lunchPlace.costEstimate : Math.round(lunchPlace.costEstimate / 25000),
                category: 'restaurant',
                latitude: lunchPlace.latitude,
                longitude: lunchPlace.longitude,
                notes: lunchPlace.description,
            });
            // 4. Chiều
            dayActivities.push({
                session: 'Chiều',
                timeSlot: '14:00 - 17:30',
                activityName: `Khám phá vẻ đẹp ${place2.name}`,
                locationName: `${place2.name}, ${curated.provinceName}`,
                thoiGianLuuLai: '3 tiếng',
                estimatedCost: isVnd ? place2.costEstimate : Math.round(place2.costEstimate / 25000),
                category: place2.category || 'nature',
                latitude: place2.latitude,
                longitude: place2.longitude,
                notes: place2.description,
            });
            // 5. Tối
            dayActivities.push({
                session: 'Tối',
                timeSlot: '19:00 - 22:00',
                activityName: `Nghỉ ngơi và dạo chơi đêm tại ${hotel.name}`,
                locationName: hotel.name,
                anToi: 'Thưởng thức món lẩu địa phương hoặc hải sản tươi sống',
                diaDiemDaoChoi: 'Quảng trường trung tâm thành phố',
                choDem: 'Chợ đêm trung tâm',
                cafe: 'Quán cafe view sông/phố cổ',
                hoatDongGiaiTri: 'Nghe nhạc/dạo bộ thư giãn',
                nghiDemODau: hotel.name,
                estimatedCost: isVnd ? hotel.costEstimate : Math.round(hotel.costEstimate / 25000),
                category: 'hotel',
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                notes: hotel.description,
            });
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
    const days = [];
    for (let i = 1; i <= params.durationDays; i++) {
        days.push({
            dayIndex: i,
            dateIndex: `Ngày ${i}: Khám phá ${params.destination}`,
            activities: [
                {
                    session: 'Sáng',
                    timeSlot: '08:00 - 11:30',
                    activityName: `Tham quan thắng cảnh ${params.destination}`,
                    locationName: `${params.destination}`,
                    thoiGianThamQuan: '3 tiếng',
                    goiYTraiNghiem: 'Khám phá thắng cảnh và lưu lại những bức ảnh kỷ niệm.',
                    estimatedCost: 0,
                    category: 'attraction',
                    latitude: 21.028511 + (i * 0.005),
                    longitude: 105.804817 + (i * 0.005),
                    notes: 'Nên chuẩn bị mũ nón và giày đi bộ thoải mái.',
                },
                {
                    session: 'Ăn sáng',
                    timeSlot: '07:00 - 08:00',
                    activityName: 'Bún chả/Bún bò đặc sản',
                    locationName: 'Quán ăn ngon nổi tiếng',
                    estimatedCost: isVnd ? 45000 : 2,
                    category: 'restaurant',
                    latitude: 21.028511 + (i * 0.005),
                    longitude: 105.804817 + (i * 0.005),
                    notes: 'Nên thử món ăn sáng gia truyền đặc sắc.',
                },
                {
                    session: 'Trưa',
                    timeSlot: '12:00 - 13:30',
                    activityName: `Thưởng thức ẩm thực trưa`,
                    locationName: `Nhà hàng đặc sản ${params.destination}`,
                    monDacSan: 'Cơm niêu/Ẩm thực truyền thống',
                    thoiGianNghiNgoi: '12:00 - 13:30',
                    estimatedCost: isVnd ? 120000 : 6,
                    category: 'restaurant',
                    latitude: 21.029511 + (i * 0.005),
                    longitude: 105.805817 + (i * 0.005),
                    notes: 'Thưởng thức món ngon ẩm thực được đánh giá cao.',
                },
                {
                    session: 'Chiều',
                    timeSlot: '14:00 - 17:30',
                    activityName: `Trải nghiệm văn hóa tại ${params.destination}`,
                    locationName: `Khu phố cổ/Trung tâm văn hóa`,
                    thoiGianLuuLai: '3 tiếng',
                    estimatedCost: isVnd ? 30000 : 1.5,
                    category: 'attraction',
                    latitude: 21.031511 + (i * 0.005),
                    longitude: 105.806817 + (i * 0.005),
                    notes: 'Khám phá văn hóa đời sống hàng ngày của người dân bản địa.',
                },
                {
                    session: 'Tối',
                    timeSlot: '19:00 - 22:00',
                    activityName: `Ăn tối & dạo chơi đêm`,
                    locationName: `Khách sạn tại ${params.destination}`,
                    anToi: 'Thưởng thức buffet lẩu nướng',
                    diaDiemDaoChoi: 'Chợ đêm và phố đi bộ',
                    choDem: 'Chợ đêm mua sắm quà tặng',
                    cafe: 'Cà phê view cao ngắm phố phường',
                    hoatDongGiaiTri: 'Xem biểu diễn nhạc nước',
                    nghiDemODau: 'Khách sạn trung tâm tiện nghi',
                    estimatedCost: isVnd ? 300000 : 15,
                    category: 'hotel',
                    latitude: 21.032511 + (i * 0.005),
                    longitude: 105.807817 + (i * 0.005),
                    notes: 'Nghỉ ngơi sau ngày dài khám phá năng động.'
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
function generateFallbackRegenerate(params) {
    const updated = { ...params.currentItinerary };
    const day = updated.days.find(d => d.dayIndex === params.targetDayIndex);
    if (!day)
        return updated;
    const curated = (0, vietnam_destinations_1.getCuratedProvince)(params.destination);
    const isVnd = params.currency === 'VND';
    const prefix = params.targetSession ? `Thay đổi ${params.targetSession}` : 'Thay đổi cả ngày';
    const excludeList = params.excludePlaces || [];
    if (params.targetSession) {
        const otherActivities = day.activities.filter(a => a.session !== params.targetSession);
        // Tìm địa điểm từ danh sách curated không nằm trong danh sách excludeList
        let newName = `${prefix} tại điểm mới`;
        let newLocationName = params.destination;
        let newLat = 21.0285;
        let newLng = 105.8048;
        let newCategory = 'attraction';
        let newNotes = 'Lịch trình được tạo tự động mới ở khu vực lân cận.';
        let newCost = isVnd ? 50000 : 3;
        let extraFields = {};
        if (curated) {
            const candidates = [
                ...curated.attractions,
                ...curated.nature,
                ...curated.restaurants,
                ...curated.hotels
            ].filter(p => !excludeList.some(ex => ex.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(ex.toLowerCase())));
            if (candidates.length > 0) {
                const p = candidates[0];
                newName = p.name;
                newLocationName = `${p.name}, ${curated.provinceName}`;
                newLat = p.latitude;
                newLng = p.longitude;
                newCategory = p.category;
                newNotes = p.description;
                newCost = isVnd ? p.costEstimate : Math.round(p.costEstimate / 25000);
            }
            else {
                // Fallback random/offset if candidates are exhausted
                newName = `Địa danh mới ở ${params.destination}`;
                newLocationName = `${params.destination}`;
                newLat = 21.0285 + Math.random() * 0.05;
                newLng = 105.8048 + Math.random() * 0.05;
            }
        }
        if (params.targetSession === 'Sáng') {
            extraFields = {
                thoiGianThamQuan: '2.5 tiếng',
                goiYTraiNghiem: `Khám phá và lưu giữ kỷ niệm tại đây.`
            };
        }
        else if (params.targetSession === 'Ăn sáng') {
            extraFields = {
                monAn: newName,
                quanGoiY: newLocationName
            };
        }
        else if (params.targetSession === 'Trưa') {
            extraFields = {
                anTrua: newName,
                monDacSan: 'Đặc sản ẩm thực vùng miền',
                thoiGianNghiNgoi: '12:00 - 13:30'
            };
        }
        else if (params.targetSession === 'Chiều') {
            extraFields = {
                thoiGianLuuLai: '3 tiếng'
            };
        }
        else if (params.targetSession === 'Tối') {
            extraFields = {
                anToi: 'Lẩu đặc sản hoặc đồ nướng địa phương',
                diaDiemDaoChoi: 'Phố đi bộ & phố ẩm thực đêm',
                choDem: 'Chợ đêm đặc trưng vùng miền',
                cafe: 'Cà phê ngắm cảnh phố phường',
                hoatDongGiaiTri: 'Dạo mát vui chơi thư giãn',
                nghiDemODau: newLocationName
            };
        }
        const newAct = {
            session: params.targetSession,
            timeSlot: params.targetSession === 'Sáng' ? '08:00 - 11:30' : params.targetSession === 'Ăn sáng' ? '07:00 - 08:00' : params.targetSession === 'Trưa' ? '12:00 - 13:30' : params.targetSession === 'Chiều' ? '14:00 - 17:30' : '19:00 - 22:00',
            activityName: newName,
            locationName: newLocationName,
            estimatedCost: newCost,
            category: newCategory,
            latitude: newLat,
            longitude: newLng,
            notes: newNotes,
            ...extraFields
        };
        day.activities = [...otherActivities, newAct];
        const sessionOrder = ['Sáng', 'Ăn sáng', 'Trưa', 'Chiều', 'Tối'];
        day.activities.sort((a, b) => {
            return sessionOrder.indexOf(a.session) - sessionOrder.indexOf(b.session);
        });
    }
    else {
        // Tái tạo cả ngày
        let candidates = [];
        if (curated) {
            candidates = [
                ...curated.attractions,
                ...curated.nature,
                ...curated.restaurants,
                ...curated.hotels
            ].filter(p => !excludeList.some(ex => ex.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(ex.toLowerCase())));
        }
        const getCandidate = (prefCat) => {
            const match = candidates.find(c => c.category === prefCat);
            if (match) {
                candidates = candidates.filter(c => c !== match);
                return match;
            }
            if (candidates.length > 0) {
                const first = candidates[0];
                candidates = candidates.filter(c => c !== first);
                return first;
            }
            return null;
        };
        const sangPlace = getCandidate('attraction');
        const anSangPlace = getCandidate('restaurant');
        const truaPlace = getCandidate('restaurant');
        const chieuPlace = getCandidate('nature');
        const toiPlace = getCandidate('hotel') || getCandidate('restaurant');
        const i = params.targetDayIndex;
        day.activities = [
            {
                session: 'Sáng',
                timeSlot: '08:00 - 11:30',
                activityName: sangPlace ? sangPlace.name : `Khám phá sáng mới ${params.destination}`,
                locationName: sangPlace ? `${sangPlace.name}, ${curated?.provinceName}` : params.destination,
                thoiGianThamQuan: '2.5 tiếng',
                goiYTraiNghiem: sangPlace ? sangPlace.description : 'Khám phá văn hóa địa phương buổi sáng.',
                estimatedCost: sangPlace ? (isVnd ? sangPlace.costEstimate : Math.round(sangPlace.costEstimate / 25000)) : 0,
                category: sangPlace ? sangPlace.category : 'attraction',
                latitude: sangPlace ? sangPlace.latitude : 21.0285 + Math.random() * 0.05,
                longitude: sangPlace ? sangPlace.longitude : 105.8048 + Math.random() * 0.05,
                notes: sangPlace ? sangPlace.description : 'Khám phá văn hóa địa phương buổi sáng.'
            },
            {
                session: 'Ăn sáng',
                timeSlot: '07:00 - 08:00',
                activityName: curated?.specialties.length ? curated.specialties[0] : 'Đặc sản ăn sáng',
                locationName: anSangPlace ? anSangPlace.name : 'Quán ăn sáng địa phương',
                estimatedCost: anSangPlace ? (isVnd ? anSangPlace.costEstimate : Math.round(anSangPlace.costEstimate / 25000)) : (isVnd ? 45000 : 2),
                category: 'restaurant',
                latitude: anSangPlace ? anSangPlace.latitude : 21.0285 + Math.random() * 0.05,
                longitude: anSangPlace ? anSangPlace.longitude : 105.8048 + Math.random() * 0.05,
                notes: 'Thưởng thức ẩm thực sáng.'
            },
            {
                session: 'Trưa',
                timeSlot: '12:00 - 13:30',
                activityName: truaPlace ? truaPlace.name : `Ăn trưa mới tại ${params.destination}`,
                locationName: truaPlace ? `${truaPlace.name}, ${curated?.provinceName}` : params.destination,
                monDacSan: curated?.specialties.length ? curated.specialties[i % curated.specialties.length] : 'Món ngon vùng miền',
                thoiGianNghiNgoi: '12:00 - 13:30',
                estimatedCost: truaPlace ? (isVnd ? truaPlace.costEstimate : Math.round(truaPlace.costEstimate / 25000)) : (isVnd ? 120000 : 6),
                category: 'restaurant',
                latitude: truaPlace ? truaPlace.latitude : 21.0295 + Math.random() * 0.05,
                longitude: truaPlace ? truaPlace.longitude : 105.8058 + Math.random() * 0.05,
                notes: truaPlace ? truaPlace.description : 'Thưởng thức ẩm thực trưa.'
            },
            {
                session: 'Chiều',
                timeSlot: '14:00 - 17:30',
                activityName: chieuPlace ? chieuPlace.name : `Tham quan chiều mới`,
                locationName: chieuPlace ? `${chieuPlace.name}, ${curated?.provinceName}` : params.destination,
                thoiGianLuuLai: '3 tiếng',
                estimatedCost: chieuPlace ? (isVnd ? chieuPlace.costEstimate : Math.round(chieuPlace.costEstimate / 25000)) : 0,
                category: chieuPlace ? chieuPlace.category : 'nature',
                latitude: chieuPlace ? chieuPlace.latitude : 21.0315 + Math.random() * 0.05,
                longitude: chieuPlace ? chieuPlace.longitude : 105.8068 + Math.random() * 0.05,
                notes: chieuPlace ? chieuPlace.description : 'Tận hưởng cảnh đẹp chiều.'
            },
            {
                session: 'Tối',
                timeSlot: '19:00 - 22:00',
                activityName: toiPlace ? toiPlace.name : `Dạo chơi tối mới`,
                locationName: toiPlace ? `${toiPlace.name}, ${curated?.provinceName}` : params.destination,
                anToi: 'Lẩu nướng hải sản đặc sản',
                diaDiemDaoChoi: 'Quảng trường trung tâm',
                choDem: 'Khu mua sắm chợ đêm',
                cafe: 'Cà phê phố cổ ngắm cảnh',
                hoatDongGiaiTri: 'Dạo phố đi bộ thư giãn',
                nghiDemODau: toiPlace ? toiPlace.name : 'Khách sạn trung tâm',
                estimatedCost: toiPlace ? (isVnd ? toiPlace.costEstimate : Math.round(toiPlace.costEstimate / 25000)) : (isVnd ? 300000 : 15),
                category: 'hotel',
                latitude: toiPlace ? toiPlace.latitude : 21.0325 + Math.random() * 0.05,
                longitude: toiPlace ? toiPlace.longitude : 105.8078 + Math.random() * 0.05,
                notes: toiPlace ? toiPlace.description : 'Đi dạo và trải nghiệm đêm.'
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
function calculateItineraryCosts(itinerary, travelStyle, currency = 'VND') {
    if (!itinerary || !Array.isArray(itinerary.days))
        return itinerary;
    const isVnd = currency === 'VND';
    const style = travelStyle || 'Adventure';
    // 1. Determine transport rate per km
    let transportRate = 8000; // default VND
    if (isVnd) {
        if (style.includes('Backpacker') || style.includes('Budget'))
            transportRate = 2000;
        else if (style.includes('Adventure'))
            transportRate = 5000;
        else if (style.includes('Leisure') || style.includes('Cultural'))
            transportRate = 12000;
        else if (style.includes('Luxury'))
            transportRate = 22000;
    }
    else {
        // USD
        transportRate = 0.40;
        if (style.includes('Backpacker') || style.includes('Budget'))
            transportRate = 0.10;
        else if (style.includes('Adventure'))
            transportRate = 0.25;
        else if (style.includes('Leisure') || style.includes('Cultural'))
            transportRate = 0.60;
        else if (style.includes('Luxury'))
            transportRate = 1.10;
    }
    // 2. Determine daily buffer cost
    let dailyBuffer = 100000; // default VND
    if (isVnd) {
        if (style.includes('Backpacker') || style.includes('Budget'))
            dailyBuffer = 40000;
        else if (style.includes('Adventure'))
            dailyBuffer = 75000;
        else if (style.includes('Leisure') || style.includes('Cultural'))
            dailyBuffer = 150000;
        else if (style.includes('Luxury'))
            dailyBuffer = 400000;
    }
    else {
        // USD
        dailyBuffer = 5.0;
        if (style.includes('Backpacker') || style.includes('Budget'))
            dailyBuffer = 2.0;
        else if (style.includes('Adventure'))
            dailyBuffer = 3.5;
        else if (style.includes('Leisure') || style.includes('Cultural'))
            dailyBuffer = 7.0;
        else if (style.includes('Luxury'))
            dailyBuffer = 20.0;
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
                }
                else if (category === 'restaurant') {
                    // Dining correction: if less than 5000 VND / 1 USD, replace with baseline
                    if (cost < (isVnd ? 5000 : 1)) {
                        correctedCost = isVnd
                            ? (style.includes('Backpacker') || style.includes('Budget') ? 40000 : style.includes('Adventure') ? 70000 : style.includes('Leisure') || style.includes('Cultural') ? 180000 : style.includes('Luxury') ? 500000 : 100000)
                            : (style.includes('Backpacker') || style.includes('Budget') ? 2 : style.includes('Adventure') ? 3.5 : style.includes('Leisure') || style.includes('Cultural') ? 8 : style.includes('Luxury') ? 22 : 4.5);
                    }
                }
                else if (cost > 0 && cost < (isVnd ? 5000 : 0.5)) {
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
                    dayDistance += (0, gis_helper_1.calculateHaversineDistance)({ latitude: a1.latitude, longitude: a1.longitude }, { latitude: a2.latitude, longitude: a2.longitude });
                }
            }
            // Add distance from the last activity back to the first activity (hotel/base loop)
            if (day.activities.length > 1) {
                const first = day.activities[0];
                const last = day.activities[day.activities.length - 1];
                if (first.latitude && first.longitude && last.latitude && last.longitude) {
                    dayDistance += (0, gis_helper_1.calculateHaversineDistance)({ latitude: last.latitude, longitude: last.longitude }, { latitude: first.latitude, longitude: first.longitude });
                }
            }
        }
        const dayTransportCost = dayDistance * transportRate;
        const dayBufferCost = dailyBuffer;
        const dayTotalCost = dayActivityCost + dayTransportCost + dayBufferCost;
        // Attach computed parameters to the day object
        day.dailyEstimatedCost = Math.round(dayTotalCost);
        day.activityCost = Math.round(dayActivityCost);
        day.transportCost = Math.round(dayTransportCost);
        day.bufferCost = Math.round(dayBufferCost);
        day.totalDistanceKm = Number(dayDistance.toFixed(2));
        totalTripDistance += dayDistance;
        totalTripActivityCost += dayActivityCost;
        totalTripTransportCost += dayTransportCost;
        totalTripBufferCost += dayBufferCost;
    });
    const totalTripCost = totalTripActivityCost + totalTripTransportCost + totalTripBufferCost;
    // Attach breakdown parameters to the main itinerary object
    itinerary.totalEstimatedCost = Math.round(totalTripCost);
    itinerary.totalActivityCost = Math.round(totalTripActivityCost);
    itinerary.totalTransportCost = Math.round(totalTripTransportCost);
    itinerary.totalBufferCost = Math.round(totalTripBufferCost);
    itinerary.totalDistanceKm = Number(totalTripDistance.toFixed(2));
    return itinerary;
}
