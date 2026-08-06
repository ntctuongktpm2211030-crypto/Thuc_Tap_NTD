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
  transportation?: string;
}

export interface ActivitySchema {
  session: 'Sáng' | 'Ăn sáng' | 'Trưa' | 'Chiều' | 'Tối'; // Choose from: "Sáng", "Ăn sáng", "Trưa", "Chiều", "Tối"
  timeSlot: string; // e.g. "09:00 - 11:00"
  activityName: string;
  locationName: string;
  estimatedCost: number;
  category: 'restaurant' | 'hotel' | 'attraction' | 'nature' | 'festival';
  latitude: number;
  longitude: number;
  notes: string;
  address?: string;
  thoiGianThamQuan?: string;
  goiYTraiNghiem?: string;
  monDacSan?: string;
  thoiGianNghiNgoi?: string;
  thoiGianLuuLai?: string;
  diaDiemDaoChoi?: string;
  nghiDemODau?: string;
  anToi?: string;
  choDem?: string;
  cafe?: string;
  hoatDongGiaiTri?: string;
  monAn?: string;
  quanGoiY?: string;
  anTrua?: string;
  [key: string]: any;
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
  targetSession?: 'Sáng' | 'Ăn sáng' | 'Trưa' | 'Chiều' | 'Tối';
  currentItinerary: AIItineraryResponse;
  excludePlaces?: string[];
}

/**
 * Builds the system instructions prompt detailing constraints, layout models,
 * JSON formats, and fallback logic for OpenAI.
 */
function buildSystemPrompt(currency: string = 'USD', totalBudget: number = 0, durationDays: number = 1): string {
  const dailyBudget = durationDays > 0 ? totalBudget / durationDays : totalBudget;
  const isVnd = currency === 'VND';
  return `Bạn là Trợ lý AI Lập Kế Hoạch Du Lịch Thông Minh của hệ thống Terraholic. Nhiệm vụ của bạn là tạo lộ trình chi tiết ${durationDays} ngày dựa trên điểm đến và ngân sách của người dùng, BẮT BUỘC tuân thủ nghiêm ngặt các quy tắc dưới đây.

### 💰 QUY TẮC RÀNG BUỘC NGÂN SÁCH (CỰC KỲ QUAN TRỌNG):
1. **TỔNG CHI PHÍ THỰC TẾ (TOTAL COST):**
   - Tổng chi phí của TOÀN BỘ hành trình (Ăn uống + Di chuyển + Lưu trú + Vé tham quan) TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT QUÁ ngân sách người dùng cung cấp (${totalBudget.toLocaleString()} ${currency}).
   - Công thức kiểm tra: Total_Cost = Sum(Bữa_ăn) + Sum(Khách_sạn) + Sum(Vé) + Sum(Di_chuyển) <= ${totalBudget} ${currency}.
   - Tổng chi phí tính toán BẮT BUỘC nằm trong khoảng 80% - 100% ngân sách người dùng nhập (Ví dụ: Nếu user_budget = 6,000,000 VND, tổng chi phí phải nằm trong khoảng 5,000,000đ - 6,000,000đ).

2. **CHÍNH XÁC GIÁ ĐƠN VỊ TỪNG MỤC:**
   - **Khách sạn/Lưu trú (Hotel):** Phải tương thích với budget (${dailyBudget.toLocaleString()} ${currency}/ngày).
     + Ngân sách bình dân (< 1,000,000đ/ngày): Chọn homestay/khách sạn 2-3 sao (200,000đ - 600,000đ/đêm).
     + Tuyệt đối KHÔNG chọn khách sạn 5 sao xa xỉ (như Metropole, JW Marriott...) trừ khi ngân sách > 15,000,000đ/ngày.
   - **Ăn uống (Food):** Bữa sáng (30,000đ - 60,000đ), Bữa trưa/tối (70,000đ - 250,000đ/người).
   - **Vé tham quan/Cột cờ/Bảo tàng:** Giá vé đúng thực tế từ 10,000đ - 100,000đ.
   - **Logic giá:** Số tiền hiển thị ở Thẻ gợi ý (estimatedCost) BẮT BUỘC phải khớp chính xác với khoảng giá mô tả trong phần chi tiết (notes). Tránh tình trạng mô tả ghi 500,000đ mà giá thẻ hiển thị 200,000đ hay 8,000đ.

### 🛑 QUY TẮC BẮT BUỘC CHỐNG TRÙNG LẶP & LỌC ĐỊA ĐIỂM (ROUTE & RERANKER):
1. KHÔNG LẶP LẠI ĐỊA ĐIỂM MẶC ĐỊNH / FAKE:
   - Tuyệt đối KHÔNG tự động gợi ý các quán ăn/cà phê có tên mặc định/chứa từ khóa trùng lặp lỗi như "quận coffer", "quận cafe", "cafe test".
   - Mọi địa điểm gợi ý BẮT BUỘC phải lấy từ Database thực tế theo đúng province/city hiện tại.
2. QUY TẮC KHOẢNG CÁCH ĐỊA LÝ (GEOGRAPHIC CLUSTERING):
   - Trong 1 ngày, các địa điểm gợi ý phải nằm gần nhau (bán kính < 15km).
   - KHÔNG ĐƯỢC ghép các địa điểm ở Tỉnh/Thành phố khác nhau vào cùng 1 lộ trình 1 ngày.
3. ĐA DẠNG HÓA DANH MỤC:
   - Lộ trình 1 ngày phải cân bằng: 1-2 Điểm tham quan + 1 Điểm ăn uống văn hóa địa phương + 1 Điểm nghỉ chân/cà phê thực tế tại địa phương đó.
4. KHÁCH SẠN CỐ ĐỊNH (Single Hotel Base):
   - Giữ nguyên 1 Khách sạn/Homestay cố định từ Ngày 1 cho tất cả các đêm (session="Tối", category="hotel").

🗓️ KHUNG THỜI GIAN CHUẨN 1 NGÀY (6 HOẠT ĐỘNG CHÍNH):
Mỗi ngày BẮT BUỘC có đủ 6 thẻ hoạt động theo thứ tự thời gian tuần tự:
- Item 1 (session="Sáng", timeSlot="07:30 - 08:30", category="restaurant"): Ăn sáng món đặc sản địa phương.
- Item 2 (session="Sáng", timeSlot="08:30 - 11:30", category="attraction"): Tham quan điểm chính buổi sáng.
- Item 3 (session="Trưa", timeSlot="11:30 - 14:00", category="restaurant"): Ăn trưa đặc sản & cà phê nghỉ trưa.
- Item 4 (session="Chiều", timeSlot="14:00 - 17:30", category="attraction"): Tham quan/trải nghiệm buổi chiều.
- Item 5 (session="Tối", timeSlot="18:30 - 20:00", category="restaurant"): Ăn tối đặc sản.
- Item 6 (session="Tối", timeSlot="20:00 - 22:00", category="hotel"): Dạo chợ đêm & Nghỉ đêm tại Khách sạn cố định.

CRITICAL FORMAT RULES:
1. Return ONLY valid JSON matching the exact schema specified. No markdown ticks, no extra text.
2. Ensure the locations are real places in the destination.
3. Guess coordinates (latitude, longitude) as accurately as possible for MapLibre map mapping in WGS84 format [lng, lat].
4. Respond entirely in Vietnamese.
5. In the "notes" field for each activity, write realistic price ranges (e.g. "Chi phí khoảng 50.000 - 100.000 đ"). The "estimatedCost" field contains a single numeric value matching the notes.

JSON STRUCTURE:
{
  "destination": "Tên địa điểm bằng tiếng Việt",
  "totalEstimatedCost": 5500000,
  "currency": "${currency}",
  "days": [
    {
      "dayIndex": 1,
      "dateIndex": "Ngày 1: Chủ đề khám phá độc đáo của ngày",
      "activities": [
        // Gồm đúng 6 hoạt động riêng biệt theo thứ tự thời gian đã mô tả ở trên.
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
      
      // If we have at least 5 results in the 20km area, restrict to them. Otherwise, take the closest ones.
      if (totalCount >= 5) {
        const sortByRating = (places: RealPlace[], limit: number) => {
          return [...places].sort((a, b) => ((b as any).averageRating || 0) - ((a as any).averageRating || 0)).slice(0, limit);
        };
        attractions = sortByRating(fAttractions, 8);
        restaurants = sortByRating(fRestaurants, 8);
        hotels = sortByRating(fHotels, 6);
        nature = sortByRating(fNature, 6);
        festivals = sortByRating(fFestivals, 6);
      } else {
        const sortByDistance = (places: RealPlace[], limit: number) => {
          return [...places].map(p => {
            const dist = calculateHaversineDistance(
              { latitude: centerCoords!.lat, longitude: centerCoords!.lng },
              { latitude: p.latitude, longitude: p.longitude }
            );
            return { ...p, dist };
          }).sort((a, b) => a.dist - b.dist).slice(0, limit);
        };
        attractions = sortByDistance(attractions, 8);
        restaurants = sortByDistance(restaurants, 8);
        hotels = sortByDistance(hotels, 6);
        nature = sortByDistance(nature, 6);
        festivals = sortByDistance(festivals, 6);
      }
    } else {
      // Sort by rating and slice to prevent large payload (HTTP 413)
      const sortByRating = (places: RealPlace[], limit: number) => {
        return [...places].sort((a, b) => ((b as any).averageRating || 0) - ((a as any).averageRating || 0)).slice(0, limit);
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
  
  Ensure all timeslots are sequenced correctly from breakfast (e.g. 07:00) to evening (e.g. 22:00).
  Group activities strictly by sessions (Ăn sáng, Sáng, Trưa, Chiều, Tối).
  You MUST generate exactly ${params.durationDays} days in the JSON.
  Generate the output entirely in Vietnamese.
  ${context}`;
}

const GENERIC_LOCATION_STOPWORDS = new Set([
  'ha giang', 'ha noi', 'da nang', 'ho chi minh', 'da lat', 'phu quoc', 'hoi an', 'nha trang',
  'nha hang', 'quan an', 'khach san', 'homestay', 'ca phe', 'cafe', 'coffee',
  'trung tam', 'du lich', 'dac san', 'tham quan', 'kham pha', 'dia diem', 'quang truong', 'cho dem'
]);

export function cleanPlaceKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/^(bua sang|an sang|breakfast|bua trua|an trua|lunch|bua toi|an toi|dinner|thuong thuc bua toi|thuong thuc bua trua|thuong thuc bua sang|thuong thuc|tham quan|kham pha|trai nghiem|visit|explore|sightseeing|dao choi|dao dem|dao|di dao|night market walk & hotel stay|nghi dem tai|stay at|nghi tai|ca phe tai|cafe tai|coffee at|ghe|tai|o|di|dung)\s*:?\s*/gi, '')
    .replace(/[\d.,:;!?'"()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isKeyDuplicate(actName: string, locName: string, usedSet: Set<string>): boolean {
  const actClean = cleanPlaceKey(actName);
  const locClean = cleanPlaceKey(locName);

  if (!actClean && !locClean) return false;

  for (const used of usedSet) {
    if (!used || used.length < 3) continue;

    // Exact key match
    if ((actClean && actClean === used) || (locClean && locClean === used)) {
      return true;
    }

    // Substring match check for sufficiently long, non-generic strings
    if (actClean && actClean.length >= 6 && used.length >= 6 && !GENERIC_LOCATION_STOPWORDS.has(actClean) && !GENERIC_LOCATION_STOPWORDS.has(used)) {
      if (actClean.includes(used) || used.includes(actClean)) return true;
    }
    if (locClean && locClean.length >= 6 && used.length >= 6 && !GENERIC_LOCATION_STOPWORDS.has(locClean) && !GENERIC_LOCATION_STOPWORDS.has(used)) {
      if (locClean.includes(used) || used.includes(locClean)) return true;
    }
  }

  return false;
}

/**
 * Strict intra-day and inter-day deduplication filter.
 * Ensures no activity/place name repeats within the same day or across different days
 * (except for night hotel stays).
 */
export function deduplicateItinerary(itinerary: AIItineraryResponse, destinationName: string): AIItineraryResponse {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

  const curated = getCuratedProvince(destinationName);
  const fallbackAttractions = curated ? [...curated.attractions, ...curated.nature, ...curated.festivals] : [];
  const fallbackRestaurants = curated ? [...curated.restaurants] : [];

  const usedPlaces = new Set<string>();

  itinerary.days.forEach((day, dayIdx) => {
    if (!Array.isArray(day.activities)) return;

    day.activities.forEach((act, actIdx) => {
      // Hotel / accommodation at night is allowed to stay fixed across days
      if (act.category === 'hotel' || (act.session === 'Tối' && actIdx === day.activities.length - 1)) {
        return;
      }

      const isDup = isKeyDuplicate(act.activityName || '', act.locationName || '', usedPlaces);

      if (isDup) {
        const isRest = act.category === 'restaurant' || (act.activityName || '').toLowerCase().includes('ăn') || (act.activityName || '').toLowerCase().includes('cà phê');
        const pool = isRest ? fallbackRestaurants : fallbackAttractions;

        const available = pool.filter(p => {
          const pClean = cleanPlaceKey(p.name);
          return pClean && !isKeyDuplicate(p.name, p.name, usedPlaces);
        });

        if (available.length > 0) {
          const replacement = available[0];
          const repClean = cleanPlaceKey(replacement.name);
          usedPlaces.add(repClean);

          if (isRest) {
            act.activityName = act.session === 'Sáng'
              ? `Bữa sáng: ${replacement.name}`
              : act.session === 'Trưa'
              ? `Ăn trưa & Cà phê tại ${replacement.name}`
              : `Thưởng thức bữa tối tại ${replacement.name}`;
            act.locationName = replacement.name;
          } else {
            act.activityName = `Tham quan ${replacement.name}`;
            act.locationName = `${replacement.name}, ${destinationName}`;
          }

          if (replacement.latitude && replacement.longitude) {
            act.latitude = replacement.latitude;
            act.longitude = replacement.longitude;
          }
          if (replacement.description) {
            act.notes = `${replacement.description}`;
          }
        } else {
          // Dynamic unique title if pool exhausted
          const tag = isRest ? 'Ăn uống đặc sản' : 'Điểm trải nghiệm mới';
          const sessionLabel = act.session || 'Khám phá';
          const newTitle = `${tag} ${destinationName} (Ngày ${dayIdx + 1} - ${sessionLabel})`;
          act.activityName = newTitle;
          act.locationName = `${newTitle}, ${destinationName}`;
          usedPlaces.add(cleanPlaceKey(newTitle));
        }
      } else {
        const actClean = cleanPlaceKey(act.activityName);
        const locClean = cleanPlaceKey(act.locationName);
        if (actClean) usedPlaces.add(actClean);
        if (locClean) usedPlaces.add(locClean);
      }
    });
  });

  return itinerary;
}

/**
 * Generates an itinerary using OpenAI client integration.
 * Includes fallback mocks to ensure runtime availability without active keys.
 */
export async function generateAIItinerary(params: PlannerParams): Promise<AIItineraryResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_key_here') {
    console.warn('⚠️ OpenAI API Key is missing. Returning structured mock itinerary.');
    const rawMock = await generateFallbackMock(params);
    const deduplicatedMock = deduplicateItinerary(rawMock, params.destination);
    return calculateItineraryCosts(deduplicatedMock, params.travelStyle, params.currency || 'USD', params.totalBudget);
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
          { role: 'system', content: buildSystemPrompt(params.currency || 'USD', params.totalBudget, params.durationDays) },
          { role: 'user', content: buildUserPrompt(params, centerCoords) },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
        max_tokens: 4500,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'No error body');
      console.error(`❌ OpenAI/Groq API Error: Status ${response.status}, Body: ${errBody}`);
      throw new Error(`OpenAI API responded with status ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content) as AIItineraryResponse;
    const refined = await refineItineraryCoordinates(resultJson, params.destination);
    const deduplicated = deduplicateItinerary(refined, params.destination);
    return calculateItineraryCosts(deduplicated, params.travelStyle, params.currency || 'USD', params.totalBudget);
  } catch (error) {
    console.error('❌ Failed to retrieve AI itinerary from OpenAI:', error);
    const mock = await generateFallbackMock(params);
    const deduplicatedMock = deduplicateItinerary(mock, params.destination);
    return calculateItineraryCosts(deduplicatedMock, params.travelStyle, params.currency || 'USD', params.totalBudget);
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
      return dist <= 15; // 15km
    };

    const sortByRating = (places: RealPlace[], limit: number) => {
      return [...places].sort((a, b) => ((b as any).averageRating || 0) - ((a as any).averageRating || 0)).slice(0, limit);
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
        max_tokens: 3000,
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
    } else {
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
    const cascaded = cascadeDeduplicateBackend(refined, dayIndex, params.destination);
    return calculateItineraryCosts(cascaded, params.travelStyle, params.currency || 'USD', params.totalBudget);

  } catch (error) {
    console.error('❌ Failed to regenerate itinerary part with AI:', error);
    const fb = generateFallbackRegenerate(params);
    const cascadedFb = cascadeDeduplicateBackend(fb, dayIndex, params.destination);
    return calculateItineraryCosts(cascadedFb, params.travelStyle, params.currency || 'USD', params.totalBudget);
  }
}

/**
 * Ensures zero duplicate places across all subsequent days when a day/session is regenerated.
 */
function cascadeDeduplicateBackend(itinerary: AIItineraryResponse, changedDayIndex: number, destination: string): AIItineraryResponse {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;

  const curated = getCuratedProvince(destination);
  const usedPlaces = new Set<string>();

  // 1. Collect all used places from Day 1 up to changedDayIndex
  itinerary.days.forEach(d => {
    if ((d.dayIndex || 1) <= changedDayIndex) {
      d.activities?.forEach(act => {
        const aClean = cleanPlaceKey(act.activityName || '');
        const lClean = cleanPlaceKey(act.locationName || '');
        if (aClean) usedPlaces.add(aClean);
        if (lClean) usedPlaces.add(lClean);
      });
    }
  });

  // 2. Scan and update subsequent days (dayIndex > changedDayIndex)
  itinerary.days.forEach(d => {
    const currentDayIdx = d.dayIndex || 1;
    if (currentDayIdx > changedDayIndex) {
      d.activities?.forEach((act) => {
        // Skip night hotels
        if (act.category === 'hotel') return;

        const isDuplicate = isKeyDuplicate(act.activityName || '', act.locationName || '', usedPlaces);

        if (isDuplicate) {
          if (curated) {
            const pool = [
              ...curated.attractions,
              ...curated.nature,
              ...curated.restaurants,
              ...curated.hotels,
              ...curated.festivals
            ];
            const unused = pool.filter(p => !isKeyDuplicate(p.name, p.name, usedPlaces));
            if (unused.length > 0) {
              const replacement = unused[0];
              const repClean = cleanPlaceKey(replacement.name);
              act.activityName = act.category === 'restaurant' ? `Thưởng thức ${replacement.name}` : `Tham quan ${replacement.name}`;
              act.locationName = `${replacement.name}, ${curated.provinceName}`;
              act.latitude = replacement.latitude;
              act.longitude = replacement.longitude;
              act.notes = replacement.description;
              usedPlaces.add(repClean);
            } else {
              const synthetic = `Điểm mới ${destination} (Ngày ${currentDayIdx} - ${act.session || 'khám phá'})`;
              act.activityName = synthetic;
              act.locationName = `${synthetic}, ${destination}`;
              usedPlaces.add(cleanPlaceKey(synthetic));
            }
          } else {
            const synthetic = `Điểm mới ${destination} (Ngày ${currentDayIdx} - ${act.session || 'khám phá'})`;
            act.activityName = synthetic;
            act.locationName = `${synthetic}, ${destination}`;
            usedPlaces.add(cleanPlaceKey(synthetic));
          }
        } else {
          const aClean = cleanPlaceKey(act.activityName || '');
          const lClean = cleanPlaceKey(act.locationName || '');
          if (aClean) usedPlaces.add(aClean);
          if (lClean) usedPlaces.add(lClean);
        }
      });
    }
  });

  return itinerary;
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
 * Fallback generator when AI API key is not configured or request fails.
 */
export async function generateFallbackMock(params: PlannerParams): Promise<AIItineraryResponse> {
  const isVnd = (params.currency || 'USD') === 'VND';
  const totalDays = params.durationDays || 1;
  const targetBudget = params.totalBudget || (isVnd ? 5000000 : 250);
  const scaleFactor = Math.min(1.5, Math.max(0.5, targetBudget / ((isVnd ? 2000000 : 100) * totalDays)));

  const EXPANDED_ATTRACTIONS = [
    { name: 'Cột cờ Lũng Cú', category: 'attraction', description: 'Cột cờ thiêng liêng nơi địa đầu Tổ quốc với tầm nhìn núi rừng biên giới tuyệt đẹp.', latitude: 23.3603, longitude: 105.3161, costEstimate: 20000 },
    { name: 'Dốc Thẩm Mã', category: 'attraction', description: 'Cung đường đèo uốn lượn huyền thoại, điểm dừng chân chụp ảnh nổi tiếng.', latitude: 23.2384, longitude: 105.2125, costEstimate: 0 },
    { name: 'Dinh thự họ Vương', category: 'attraction', description: 'Dinh Vua Mèo kiến trúc cổ kính rêu phong giao thoa H\'Mông và Trung Hoa.', latitude: 23.2618, longitude: 105.2536, costEstimate: 20000 },
    { name: 'Phố cổ Đồng Văn', category: 'attraction', description: 'Quần thể nhà trình tường trăm năm ngói âm dương rực rỡ sắc màu.', latitude: 23.2798, longitude: 105.3601, costEstimate: 0 },
    { name: 'Hẻm Tu Sản', category: 'nature', description: 'Hẻm vực sâu nhất Đông Nam Á kẹp giữa hai vách đá đứng tráng lệ.', latitude: 23.2458, longitude: 105.4125, costEstimate: 100000 },
    { name: 'Sông Nho Quế', category: 'nature', description: 'Dòng sông xanh ngọc bích êm đềm chảy qua hẻm núi Tu Sản.', latitude: 23.2431, longitude: 105.4140, costEstimate: 120000 },
    { name: 'Cổng trời Quản Bạ', category: 'attraction', description: 'Cửa ngõ đầu tiên bước vào Cao nguyên đá Đồng Văn tuyệt đẹp.', latitude: 23.0450, longitude: 104.9920, costEstimate: 0 },
    { name: 'Núi Đôi Cô Tiên', category: 'nature', description: 'Tuyệt tác thiên nhiên hai ngọn núi hình dáng ngực tròn đầy.', latitude: 23.0560, longitude: 104.9980, costEstimate: 0 },
    { name: 'Rừng thông Yên Minh', category: 'nature', description: 'Rừng thông xanh ngút ngàn ví như Đà Lạt thu nhỏ của vùng cao.', latitude: 23.1180, longitude: 105.1520, costEstimate: 0 },
    { name: 'Danh thắng Hoàng Su Phì', category: 'nature', description: 'Ruộng bậc thang vàng óng kỳ vĩ trải dài ngút ngàn.', latitude: 22.7530, longitude: 104.6850, costEstimate: 0 },
    { name: 'Chợ phiên Mèo Vạc', category: 'festival', description: 'Chợ phiên vùng cao rực rỡ sắc màu văn hóa truyền thống.', latitude: 23.1640, longitude: 105.4080, costEstimate: 0 },
    { name: 'Thung lũng Sủng Là', category: 'nature', description: 'Nơi đóa hoa nở trên đá và nổi tiếng với bối cảnh bộ phim Nhà của Pao.', latitude: 23.2410, longitude: 105.2750, costEstimate: 30000 },
    { name: 'Làng văn hóa Lũng Cẩm', category: 'attraction', description: 'Làng cổ H\'Mông trình tường rêu phong thanh bình.', latitude: 23.2420, longitude: 105.2770, costEstimate: 30000 },
    { name: 'Cây cô đơn Can Tỷ', category: 'attraction', description: 'Cây nghiến cổ thụ sừng sững giữa vách núi đá vôi.', latitude: 23.0850, longitude: 105.0420, costEstimate: 0 },
    { name: 'Làng Pả Vi Mèo Vạc', category: 'attraction', description: 'Làng du lịch cộng đồng kiểu mẫu dân tộc H\'Mông.', latitude: 23.1580, longitude: 105.4120, costEstimate: 0 },
    { name: 'Hang Lùng Khúy', category: 'nature', description: 'Đệ nhất hang động cao nguyên đá lộng lẫy tráng lệ.', latitude: 23.0620, longitude: 104.9850, costEstimate: 50000 },
    { name: 'Đèo Mã Pí Lèng', category: 'nature', description: 'Một trong tứ đại đỉnh đèo mây núi chập trùng tráng lệ.', latitude: 23.2380, longitude: 105.4020, costEstimate: 0 },
    { name: 'Thác Du Già', category: 'nature', description: 'Dòng thác nguyên sơ làn nước xanh trong vắt giữa thung lũng.', latitude: 22.9230, longitude: 105.2150, costEstimate: 0 },
    { name: 'Dốc Pai Lủng', category: 'attraction', description: 'Cung đường hoàng hôn lãng mạn trên đỉnh núi cao.', latitude: 23.2210, longitude: 105.3850, costEstimate: 0 },
    { name: 'Mốc 428 Biên Giới', category: 'attraction', description: 'Cột mốc biên giới cực Bắc thiêng liêng.', latitude: 23.3680, longitude: 105.3210, costEstimate: 0 }
  ];

  const EXPANDED_RESTAURANTS = [
    { name: 'Phở tráng tay Đồng Văn', category: 'restaurant', description: 'Phở tráng tay thủ công nóng hổi béo ngậy.', latitude: 23.2792, longitude: 105.3598, costEstimate: 45000 },
    { name: 'Bánh cuốn trứng Phố Cổ', category: 'restaurant', description: 'Bánh cuốn tráng mỏng ăn cùng bát nước ninh xương đậm đà.', latitude: 23.2795, longitude: 105.3602, costEstimate: 40000 },
    { name: 'Bún chả Yên Minh', category: 'restaurant', description: 'Bún chả nướng than hoa thơm lừng ngon tuyệt.', latitude: 23.1165, longitude: 105.1510, costEstimate: 40000 },
    { name: 'Nhà hàng Oanh Hiệu', category: 'restaurant', description: 'Đặc sản lẩu gà đen nấm rừng và cơm gia đình.', latitude: 23.2790, longitude: 105.3590, costEstimate: 150000 },
    { name: 'Cơm lam Mèo Vạc', category: 'restaurant', description: 'Cơm lam dẻo thơm nướng ống nứa ăn kèm thịt lợn quay.', latitude: 23.1635, longitude: 105.4075, costEstimate: 120000 },
    { name: 'Lẩu thắng cố Đồng Văn', category: 'restaurant', description: 'Thắng cố men lá truyền thống đậm đà gia vị núi rừng.', latitude: 23.2788, longitude: 105.3585, costEstimate: 180000 },
    { name: 'Lẩu gà đen H\'Mông', category: 'restaurant', description: 'Lẩu gà đen ninh thuốc bắc và rau cải mèo đắng ngọt.', latitude: 23.2785, longitude: 105.3580, costEstimate: 200000 },
    { name: 'Quán ăn Lũng Cú', category: 'restaurant', description: 'Quán ăn ngon dưới chân Cột cờ Lũng Cú.', latitude: 23.3590, longitude: 105.3150, costEstimate: 80000 },
    { name: 'Nhà hàng Tiến Nhị', category: 'restaurant', description: 'Nhà hàng lớn đối diện chợ cổ Đồng Văn.', latitude: 23.2797, longitude: 105.3605, costEstimate: 150000 },
    { name: 'Quán ăn Quản Bạ', category: 'restaurant', description: 'Thịt bò khô và rau rừng nức tiếng Quản Bạ.', latitude: 23.0440, longitude: 104.9910, costEstimate: 100000 },
    { name: 'Nhà hàng Khải Hoàn', category: 'restaurant', description: 'Nhà hàng ẩm thực vùng cao không gian thoáng mát.', latitude: 23.2780, longitude: 105.3570, costEstimate: 130000 },
    { name: 'Quán cơm Hoàng Su Phì', category: 'restaurant', description: 'Cơm bình dân dẻo thơm kèm cá suối chiên giòn.', latitude: 22.7520, longitude: 104.6840, costEstimate: 90000 },
    { name: 'Cà phê Cực Bắc Lũng Cú', category: 'restaurant', description: 'Quán cà phê H\'Mông không gian yên bình độc đáo.', latitude: 23.3600, longitude: 105.3155, costEstimate: 45000 }
  ];

  const curated = getCuratedProvince(params.destination);

  if (curated) {
    const days: TripDaySchema[] = [];
    
    const sightseeing = [
      ...curated.attractions,
      ...curated.nature,
      ...curated.festivals
    ];
    const eateries = [...curated.restaurants];
    const hotels = [...curated.hotels];

    const usedNames = new Set<string>();

    const getSmartUniqueItem = <T extends { name: string; costEstimate?: number; category?: string; latitude?: number; longitude?: number; description?: string }>(
      candidates: T[],
      expandedPool: any[],
      fallbackPrefix: string,
      destName: string,
      seqIdx: number
    ): { name: string; category: string; description: string; latitude: number; longitude: number; costEstimate: number } => {
      // 1. Filter out candidate items that are generic or already used
      const availableCandidates = candidates.filter(c => 
        c.name && 
        !c.name.toLowerCase().includes('điểm tham quan') && 
        !c.name.toLowerCase().includes('quán ăn') && 
        !c.name.toLowerCase().includes('nhà hàng ăn') && 
        !usedNames.has(c.name.toLowerCase())
      );

      if (availableCandidates.length > 0) {
        const selected = availableCandidates[0];
        usedNames.add(selected.name.toLowerCase());
        return {
          name: selected.name,
          category: selected.category || 'attraction',
          description: selected.description || `Địa điểm trải nghiệm tuyệt vời tại ${destName}.`,
          latitude: selected.latitude || 21.0285,
          longitude: selected.longitude || 105.8048,
          costEstimate: selected.costEstimate || 0
        };
      }

      // 2. Try expanded pool
      const availableExpanded = expandedPool.filter(e => !usedNames.has(e.name.toLowerCase()));
      if (availableExpanded.length > 0) {
        const selected = availableExpanded[0];
        usedNames.add(selected.name.toLowerCase());
        return {
          name: selected.name,
          category: selected.category || 'attraction',
          description: selected.description || `Địa điểm check-in hấp dẫn tại ${destName}.`,
          latitude: selected.latitude,
          longitude: selected.longitude,
          costEstimate: selected.costEstimate || 0
        };
      }

      // 3. Fallback: generate dynamic real title with location
      const baseItem = expandedPool[seqIdx % expandedPool.length];
      const dynamicName = `${fallbackPrefix} ${baseItem.name} ${destName}`.trim();
      usedNames.add(dynamicName.toLowerCase());
      return {
        name: dynamicName,
        category: baseItem.category || 'attraction',
        description: baseItem.description || `Hành trình trải nghiệm ấn tượng tại ${destName}.`,
        latitude: baseItem.latitude + 0.001 * (seqIdx % 5),
        longitude: baseItem.longitude + 0.001 * (seqIdx % 5),
        costEstimate: baseItem.costEstimate || 0
      };
    };

    for (let i = 1; i <= totalDays; i++) {
      const dayActivities: ActivitySchema[] = [];
      // Giữ nguyên 1 khách sạn/homestay cố định cho toàn bộ hành trình
      const hotel = hotels[0] || {
        name: 'Khách sạn trung tâm',
        costEstimate: isVnd ? 500000 : 25,
        latitude: curated.hotels[0]?.latitude || 21.0285,
        longitude: curated.hotels[0]?.longitude || 105.8048,
        description: 'Khách sạn sạch sẽ, đầy đủ tiện nghi.'
      };

      // Filter local within 15km
      const localSightseeing = sightseeing.filter(p => {
        const dist = calculateHaversineDistance(
          { latitude: hotel.latitude, longitude: hotel.longitude },
          { latitude: p.latitude, longitude: p.longitude }
        );
        return dist <= 15;
      });

      const localEateries = eateries.filter(r => {
        const dist = calculateHaversineDistance(
          { latitude: hotel.latitude, longitude: hotel.longitude },
          { latitude: r.latitude, longitude: r.longitude }
        );
        return dist <= 15;
      });

      const place1 = getSmartUniqueItem(
        localSightseeing.length > 0 ? localSightseeing : sightseeing,
        EXPANDED_ATTRACTIONS,
        'Tham quan',
        curated.provinceName,
        i * 2 - 2
      );

      const place2 = getSmartUniqueItem(
        localSightseeing.length > 0 ? localSightseeing : sightseeing,
        EXPANDED_ATTRACTIONS,
        'Khám phá',
        curated.provinceName,
        i * 2 - 1
      );

      const breakfastPlace = getSmartUniqueItem(
        localEateries.length > 0 ? localEateries : eateries,
        EXPANDED_RESTAURANTS,
        'Ăn sáng',
        curated.provinceName,
        i * 3 - 3
      );

      const lunchPlace = getSmartUniqueItem(
        localEateries.length > 0 ? localEateries : eateries,
        EXPANDED_RESTAURANTS,
        'Ăn trưa',
        curated.provinceName,
        i * 3 - 2
      );

      const dinnerPlace = getSmartUniqueItem(
        localEateries.length > 0 ? localEateries : eateries,
        EXPANDED_RESTAURANTS,
        'Ăn tối',
        curated.provinceName,
        i * 3 - 1
      );

      // Calculate scaled costs
      const hotelCost = Math.round((hotel.costEstimate || (isVnd ? 500000 : 25)) * scaleFactor);
      const breakfastCost = Math.round((breakfastPlace.costEstimate || (isVnd ? 45000 : 2)) * scaleFactor);
      const lunchCost = Math.round((lunchPlace.costEstimate || (isVnd ? 150000 : 8)) * scaleFactor);
      const place1Cost = Math.round((place1.costEstimate || 0) * scaleFactor);
      const place2Cost = Math.round((place2.costEstimate || 0) * scaleFactor);
      const dinnerCost = Math.round((dinnerPlace.costEstimate || (isVnd ? 180000 : 10)) * scaleFactor);

      // Item 1: Sáng - Ăn sáng
      dayActivities.push({
        session: 'Sáng',
        timeSlot: '07:30 - 08:30',
        activityName: `Bữa sáng: ${breakfastPlace.name}`,
        locationName: breakfastPlace.name,
        estimatedCost: breakfastCost,
        category: 'restaurant',
        latitude: breakfastPlace.latitude,
        longitude: breakfastPlace.longitude,
        notes: `Thưởng thức điểm tâm gia truyền ngon miệng. Chi phí khoảng ${Math.round(breakfastCost * 0.85).toLocaleString()} - ${Math.round(breakfastCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
      });

      // Item 2: Sáng - Tham quan
      dayActivities.push({
        session: 'Sáng',
        timeSlot: '08:30 - 11:30',
        activityName: `Tham quan ${place1.name}`,
        locationName: `${place1.name}, ${curated.provinceName}`,
        thoiGianThamQuan: '3 tiếng',
        goiYTraiNghiem: `Tham quan, chụp hình lưu niệm tại ${place1.name}. ${place1.description}`,
        estimatedCost: place1Cost,
        category: (place1.category as any) || 'attraction',
        latitude: place1.latitude,
        longitude: place1.longitude,
        notes: `Tham quan ngắm cảnh buổi sáng. Chi phí khoảng ${Math.round(place1Cost * 0.85).toLocaleString()} - ${Math.round(place1Cost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
      });

      // Item 3: Trưa - Ăn trưa & Cà phê
      dayActivities.push({
        session: 'Trưa',
        timeSlot: '11:30 - 14:00',
        activityName: `Ăn trưa & Cà phê tại ${lunchPlace.name}`,
        locationName: lunchPlace.name,
        monDacSan: curated.specialties.length > 0 ? curated.specialties[i % curated.specialties.length] : 'Đặc sản địa phương',
        thoiGianNghiNgoi: '2.5 tiếng',
        estimatedCost: lunchCost,
        category: 'restaurant',
        latitude: lunchPlace.latitude,
        longitude: lunchPlace.longitude,
        notes: `Ăn trưa & cà phê thư giãn nghỉ trưa. Chi phí khoảng ${Math.round(lunchCost * 0.85).toLocaleString()} - ${Math.round(lunchCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
      });

      // Item 4: Chiều - Tham quan
      dayActivities.push({
        session: 'Chiều',
        timeSlot: '14:00 - 17:30',
        activityName: `Khám phá ${place2.name}`,
        locationName: `${place2.name}, ${curated.provinceName}`,
        thoiGianLuuLai: '3.5 tiếng',
        estimatedCost: place2Cost,
        category: (place2.category as any) || 'nature',
        latitude: place2.latitude,
        longitude: place2.longitude,
        notes: `Vui chơi, ngắm cảnh tự nhiên buổi chiều. Chi phí khoảng ${Math.round(place2Cost * 0.85).toLocaleString()} - ${Math.round(place2Cost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
      });

      // Item 5: Tối - Ăn tối đặc sản
      dayActivities.push({
        session: 'Tối',
        timeSlot: '18:30 - 20:00',
        activityName: `Thưởng thức bữa tối tại ${dinnerPlace.name}`,
        locationName: dinnerPlace.name,
        estimatedCost: dinnerCost,
        category: 'restaurant',
        latitude: dinnerPlace.latitude || (hotel.latitude + 0.003),
        longitude: dinnerPlace.longitude || (hotel.longitude + 0.003),
        notes: `Thưởng thức bữa tối ngon miệng đặc sản. Chi phí khoảng ${Math.round(dinnerCost * 0.85).toLocaleString()} - ${Math.round(dinnerCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
      });

      // Item 6: Tối - Dạo đêm & Nghỉ đêm tại Khách sạn
      dayActivities.push({
        session: 'Tối',
        timeSlot: '20:00 - 22:00',
        activityName: `Dạo chợ đêm & Nghỉ đêm tại ${hotel.name}`,
        locationName: hotel.name,
        diaDiemDaoChoi: 'Quảng trường trung tâm & Chợ đêm',
        nghiDemODau: hotel.name,
        estimatedCost: hotelCost,
        category: 'hotel',
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        notes: `Khám phá phố đêm, đi dạo và nghỉ ngơi tại khách sạn. Chi phí khoảng ${Math.round(hotelCost * 0.9).toLocaleString()} - ${Math.round(hotelCost * 1.1).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
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
  const days: TripDaySchema[] = [];
  for (let i = 1; i <= totalDays; i++) {
    const hotelCost = Math.round((isVnd ? 500000 : 25) * scaleFactor);
    const breakfastCost = Math.round((isVnd ? 45000 : 2) * scaleFactor);
    const lunchCost = Math.round((isVnd ? 120000 : 6) * scaleFactor);
    const place1Cost = Math.round((isVnd ? 40000 : 2) * scaleFactor);
    const place2Cost = Math.round((isVnd ? 40000 : 2) * scaleFactor);

    const dinnerCost = Math.round(lunchCost * 1.1);

    days.push({
      dayIndex: i,
      dateIndex: `Ngày ${i}: Khám phá danh thắng & đặc sản ${params.destination}`,
      activities: [
        {
          session: 'Sáng',
          timeSlot: '07:30 - 08:30',
          activityName: 'Thưởng thức bữa sáng đặc sản',
          locationName: 'Quán điểm tâm địa phương nổi tiếng',
          estimatedCost: breakfastCost,
          category: 'restaurant',
          latitude: 21.028511 + (i * 0.005),
          longitude: 105.804817 + (i * 0.005),
          notes: `Ăn sáng món gia truyền. Chi phí khoảng ${Math.round(breakfastCost * 0.85).toLocaleString()} - ${Math.round(breakfastCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
        },
        {
          session: 'Sáng',
          timeSlot: '08:30 - 11:30',
          activityName: `Tham quan địa danh ${params.destination}`,
          locationName: `Điểm tham quan nổi tiếng ${params.destination}`,
          thoiGianThamQuan: '3 tiếng',
          goiYTraiNghiem: 'Khám phá nét đẹp thiên nhiên và chụp hình lưu niệm.',
          estimatedCost: place1Cost,
          category: 'attraction',
          latitude: 21.029511 + (i * 0.005),
          longitude: 105.805817 + (i * 0.005),
          notes: `Điểm đến nổi tiếng. Chi phí khoảng ${Math.round(place1Cost * 0.85).toLocaleString()} - ${Math.round(place1Cost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
        },
        {
          session: 'Trưa',
          timeSlot: '11:30 - 14:00',
          activityName: 'Thưởng thức bữa trưa đặc sản & cà phê',
          locationName: 'Nhà hàng ẩm thực truyền thống & Quán cà phê',
          monDacSan: 'Đặc sản ẩm thực độc đáo',
          thoiGianNghiNgoi: '2.5 tiếng',
          estimatedCost: lunchCost,
          category: 'restaurant',
          latitude: 21.030511 + (i * 0.005),
          longitude: 105.806817 + (i * 0.005),
          notes: `Ăn trưa & cà phê thư giãn nghỉ trưa. Chi phí khoảng ${Math.round(lunchCost * 0.85).toLocaleString()} - ${Math.round(lunchCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
        },
        {
          session: 'Chiều',
          timeSlot: '14:00 - 17:30',
          activityName: `Khám phá khu du lịch sinh thái ${params.destination}`,
          locationName: `Địa điểm giải trí & danh thắng ${params.destination}`,
          thoiGianLuuLai: '3.5 tiếng',
          estimatedCost: place2Cost,
          category: 'attraction',
          latitude: 21.031511 + (i * 0.005),
          longitude: 105.807817 + (i * 0.005),
          notes: `Khám phá, dạo chơi buổi chiều. Chi phí khoảng ${Math.round(place2Cost * 0.85).toLocaleString()} - ${Math.round(place2Cost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
        },
        {
          session: 'Tối',
          timeSlot: '18:30 - 20:00',
          activityName: 'Bữa tối đặc sản ẩm thực địa phương',
          locationName: `Quán ăn tối / Nhà hàng ẩm thực ${params.destination}`,
          estimatedCost: dinnerCost,
          category: 'restaurant',
          latitude: 21.032011 + (i * 0.005),
          longitude: 105.808017 + (i * 0.005),
          notes: `Thưởng thức bữa tối đặc sản. Chi phí khoảng ${Math.round(dinnerCost * 0.85).toLocaleString()} - ${Math.round(dinnerCost * 1.15).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
        },
        {
          session: 'Tối',
          timeSlot: '20:00 - 22:00',
          activityName: `Dạo phố đêm, chợ đêm & Nghỉ đêm`,
          locationName: 'Khách sạn trung tâm tiêu chuẩn',
          diaDiemDaoChoi: 'Chợ đêm trung tâm sầm uất và phố đi bộ',
          nghiDemODau: 'Khách sạn trung tâm',
          estimatedCost: hotelCost,
          category: 'hotel',
          latitude: 21.032511 + (i * 0.005),
          longitude: 105.808817 + (i * 0.005),
          notes: `Dạo chợ đêm và nghỉ ngơi tại khách sạn. Chi phí khoảng ${Math.round(hotelCost * 0.9).toLocaleString()} - ${Math.round(hotelCost * 1.1).toLocaleString()} ${isVnd ? 'đ' : 'USD'}.`,
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
  const excludeList = params.excludePlaces || [];
  
  if (params.targetSession) {
    const otherActivities = day.activities.filter(a => a.session !== params.targetSession);
    
    // Tìm địa điểm từ danh sách curated không nằm trong danh sách excludeList
    let newName = `${prefix} tại điểm mới`;
    let newLocationName = params.destination;
    let newLat = 21.0285;
    let newLng = 105.8048;
    let newCategory: 'restaurant' | 'hotel' | 'attraction' | 'nature' | 'festival' = 'attraction';
    let newNotes = 'Lịch trình được tạo tự động mới ở khu vực lân cận.';
    let newCost = isVnd ? 50000 : 3;

    let extraFields: any = {};

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
        newCategory = p.category as any;
        newNotes = p.description;
        newCost = isVnd ? p.costEstimate : Math.round(p.costEstimate / 25000);
      } else {
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
    } else if (params.targetSession === 'Ăn sáng') {
      extraFields = {
        monAn: newName,
        quanGoiY: newLocationName
      };
    } else if (params.targetSession === 'Trưa') {
      extraFields = {
        anTrua: newName,
        monDacSan: 'Đặc sản ẩm thực vùng miền',
        thoiGianNghiNgoi: '12:00 - 13:30'
      };
    } else if (params.targetSession === 'Chiều') {
      extraFields = {
        thoiGianLuuLai: '3 tiếng'
      };
    } else if (params.targetSession === 'Tối') {
      extraFields = {
        anToi: 'Lẩu đặc sản hoặc đồ nướng địa phương',
        diaDiemDaoChoi: 'Phố đi bộ & phố ẩm thực đêm',
        choDem: 'Chợ đêm đặc trưng vùng miền',
        cafe: 'Cà phê ngắm cảnh phố phường',
        hoatDongGiaiTri: 'Dạo mát vui chơi thư giãn',
        nghiDemODau: newLocationName
      };
    }

    const newAct: ActivitySchema = {
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
  } else {
    // Tái tạo cả ngày
    let candidates: any[] = [];
    if (curated) {
      candidates = [
        ...curated.attractions,
        ...curated.nature,
        ...curated.restaurants,
        ...curated.hotels
      ].filter(p => !excludeList.some(ex => ex.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(ex.toLowerCase())));
    }

    const getCandidate = (prefCat: string) => {
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
        category: sangPlace ? (sangPlace.category as any) : 'attraction',
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
        category: chieuPlace ? (chieuPlace.category as any) : 'nature',
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
export function calculateItineraryCosts(
  itinerary: AIItineraryResponse,
  travelStyle: string,
  currency: string = 'VND',
  targetBudget?: number
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
          const legDist = calculateHaversineDistance(
            { latitude: a1.latitude, longitude: a1.longitude },
            { latitude: a2.latitude, longitude: a2.longitude }
          );
          // Cap single intra-day leg distance to 60km to avoid coordinate anomalies
          dayDistance += Math.min(legDist, 60);
        }
      }

      // Add distance from the last activity back to the first activity (hotel/base loop)
      if (day.activities.length > 1) {
        const first = day.activities[0];
        const last = day.activities[day.activities.length - 1];
        if (first.latitude && first.longitude && last.latitude && last.longitude) {
          const loopDist = calculateHaversineDistance(
            { latitude: last.latitude, longitude: last.longitude },
            { latitude: first.latitude, longitude: first.longitude }
          );
          dayDistance += Math.min(loopDist, 60);
        }
      }

      // Cap daily sightseeing distance to max 150km
      dayDistance = Math.min(dayDistance, 150);
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

  let totalTripCost = totalTripActivityCost + totalTripTransportCost + totalTripBufferCost;

  // Post-LLM Budget Limit Rule Validation: Ensure Total_Cost is strictly within 80% - 98% of user_budget
  if (targetBudget && targetBudget > 0) {
    const minTargetCost = targetBudget * 0.82;

    if (totalTripCost > targetBudget || totalTripCost < minTargetCost) {
      const desiredTotal = targetBudget * 0.90; // Target 90% of budget
      const globalScale = totalTripCost > 0 ? desiredTotal / totalTripCost : 1;

      totalTripActivityCost = 0;
      totalTripTransportCost = 0;
      totalTripBufferCost = 0;

      itinerary.days.forEach(day => {
        let dayActCost = 0;
        if (day.activities && day.activities.length > 0) {
          day.activities.forEach(act => {
            const originalCost = Number(act.estimatedCost) || 0;
            const adjustedCost = Math.max(0, Math.round(originalCost * globalScale));
            act.estimatedCost = adjustedCost;
            dayActCost += adjustedCost;
          });
        }

        const scaledTransCost = Math.round(((day as any).transportCost || 0) * globalScale);
        const scaledBufCost = Math.round(((day as any).bufferCost || 0) * globalScale);

        (day as any).activityCost = Math.round(dayActCost);
        (day as any).transportCost = scaledTransCost;
        (day as any).bufferCost = scaledBufCost;
        (day as any).dailyEstimatedCost = Math.round(dayActCost + scaledTransCost + scaledBufCost);

        totalTripActivityCost += dayActCost;
        totalTripTransportCost += scaledTransCost;
        totalTripBufferCost += scaledBufCost;
      });

      totalTripCost = totalTripActivityCost + totalTripTransportCost + totalTripBufferCost;
    }
  }

  // Price Logic Synchronization & Rounding to nearest 1,000 VND: Ensure notes price range text strictly matches Card Cost (estimatedCost)
  const roundToThousand = (val: number) => isVnd ? Math.round(val / 1000) * 1000 : Math.round(val * 10) / 10;
  const freeKeywords = ['hồ hoàn kiếm', 'chợ đêm', 'công viên', 'phố cổ', 'quảng trường', 'dạo phố', 'dạo chợ', 'tự do', 'miễn phí', 'đi dạo', 'núi đôi', 'rừng thông', 'cây cô đơn'];

  itinerary.days.forEach(day => {
    let dayActCost = 0;
    if (day.activities && Array.isArray(day.activities)) {
      day.activities.forEach(act => {
        const actName = (act.activityName || '').toLowerCase();
        const locName = (act.locationName || '').toLowerCase();
        const isFreeSpot = freeKeywords.some(kw => actName.includes(kw) || locName.includes(kw));

        let cost = isFreeSpot ? 0 : (Number(act.estimatedCost) || 0);
        cost = roundToThousand(cost);
        act.estimatedCost = cost;
        dayActCost += cost;

        const low = roundToThousand(cost * 0.85);
        const high = roundToThousand(cost * 1.15);
        const unitStr = isVnd ? 'đ' : 'USD';

        let baseNote = (act.notes || '').replace(/(\.|\s)*(Chi phí khoảng [^.]+|Miễn phí tham quan)(\.|$)/gi, '').trim();
        if (!baseNote) baseNote = act.activityName || 'Hoạt động trải nghiệm';

        if (cost > 0) {
          act.minCost = low;
          act.maxCost = high;
          act.notes = `${baseNote}. Chi phí khoảng ${low.toLocaleString()} - ${high.toLocaleString()} ${unitStr}.`.replace(/^\.\s*/, '');
        } else {
          act.minCost = 0;
          act.maxCost = 0;
          act.notes = `${baseNote}. Miễn phí tham quan.`.replace(/^\.\s*/, '');
        }
      });
    }
    (day as any).activityCost = roundToThousand(dayActCost);
    (day as any).dailyEstimatedCost = roundToThousand(dayActCost + ((day as any).transportCost || 0) + ((day as any).bufferCost || 0));
  });

  // Attach breakdown parameters to the main itinerary object (rounded to 1,000 VND)
  itinerary.totalEstimatedCost = roundToThousand(totalTripCost);
  (itinerary as any).totalActivityCost = roundToThousand(totalTripActivityCost);
  (itinerary as any).totalTransportCost = roundToThousand(totalTripTransportCost);
  (itinerary as any).totalBufferCost = roundToThousand(totalTripBufferCost);
  (itinerary as any).totalDistanceKm = Number(totalTripDistance.toFixed(2));

  return itinerary;
}
