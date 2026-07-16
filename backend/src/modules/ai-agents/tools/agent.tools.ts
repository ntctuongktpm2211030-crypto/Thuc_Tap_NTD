import { AgentTool } from '../types/agent.types';
import prisma from '../../../config/db';
import { getCuratedProvince } from '../../../config/vietnam_destinations';

export function extractItemNameFromTitle(title: string): string {
  const parts = title.split(' - ').map(p => p.trim());
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  
  const lastPart = parts[parts.length - 1];
  if (lastPart === 'Tổng quan' || lastPart === 'Giới thiệu' || lastPart === 'Mục lục') {
    const secondToLast = parts[parts.length - 2];
    const categories = ['THẮNG CẢNH', 'DI TÍCH', 'LỄ HỘI', 'ẨM THỰC', 'LỊCH SỬ', 'FESTIVAL', 'CULTURE', 'FOOD', 'DESTINATION'];
    
    if (parts.length === 2) {
      return `${parts[0]} (${lastPart})`;
    }
    
    if (categories.includes(secondToLast.toUpperCase())) {
      return `${parts[0]} (${lastPart})`;
    } else {
      return secondToLast;
    }
  }
  
  return lastPart;
}

export class MapTool implements AgentTool {
  name = 'Maps';
  description = 'Tìm kiếm các địa điểm du lịch, tọa độ và thông tin đường đi.';

  async execute(input: { query: string }) {
    // Thử tìm địa điểm trong bảng Destination sẵn có của DB
    const dest = await prisma.destination.findFirst({
      where: {
        name: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
    });

    if (dest) {
      return {
        status: 'success',
        source: 'database',
        name: dest.name,
        latitude: dest.latitude,
        longitude: dest.longitude,
        category: dest.category,
        rating: dest.averageRating,
        address: dest.address,
      };
    }

    // Từ điển tọa độ cho các tỉnh/thành phố du lịch chính tại Việt Nam làm dự phòng
    const geoCoords: Record<string, { lat: number; lng: number }> = {
      'vung tau': { lat: 10.3460, lng: 107.0843 },
      'da lat': { lat: 11.9404, lng: 108.4583 },
      'nha trang': { lat: 12.2388, lng: 109.1967 },
      'ha long': { lat: 20.9501, lng: 107.0733 },
      'sai gon': { lat: 10.8231, lng: 106.6297 },
      'ho chi minh': { lat: 10.8231, lng: 106.6297 },
      'sapa': { lat: 22.3364, lng: 103.8438 },
      'ha giang': { lat: 22.8233, lng: 104.9833 },
      'da nang': { lat: 16.0544, lng: 108.2022 },
      'hue': { lat: 16.4637, lng: 107.5909 },
      'phu quoc': { lat: 10.2899, lng: 103.9840 },
      'ha noi': { lat: 21.0285, lng: 105.8522 },
      'can tho': { lat: 10.0452, lng: 105.7469 }
    };

    // Thử gọi Mapbox Geocoding API nếu có cấu hình MAPBOX_ACCESS_TOKEN trong .env
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
    if (mapboxToken && mapboxToken !== 'your_mapbox_token_here') {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input.query)}.json?access_token=${mapboxToken}&limit=1&country=vn`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json() as any;
          if (data && data.features && data.features.length > 0) {
            const firstFeature = data.features[0];
            return {
              status: 'success',
              source: 'mapbox_api',
              name: input.query,
              latitude: firstFeature.center[1], // Latitude (Vĩ độ)
              longitude: firstFeature.center[0], // Longitude (Kinh độ)
              category: 'attraction',
              address: firstFeature.place_name
            };
          }
        }
      } catch (mapboxErr) {
        console.warn('[MapTool] Failed to fetch coordinates from Mapbox, trying Nominatim:', mapboxErr);
      }
    }

    // Thử gọi API OpenStreetMap Nominatim công cộng để phân giải tọa độ thực tế (Dự phòng 1)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input.query + ', Việt Nam')}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SmartTravelApp/1.0' }
      });
      if (response.ok) {
        const data = await response.json() as any[];
        if (data && data.length > 0) {
          return {
            status: 'success',
            source: 'external_api',
            name: input.query,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            category: 'attraction',
            address: data[0].display_name
          };
        }
      }
    } catch (apiErr) {
      console.warn('[MapTool] Failed to fetch coordinates from Nominatim, using static fallback:', apiErr);
    }

    const cleanQuery = input.query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
    const matched = Object.keys(geoCoords).find(key => cleanQuery.includes(key));
    
    if (!matched) {
      return {
        status: 'failed',
        source: 'not_found',
        name: input.query,
        latitude: 0,
        longitude: 0,
        address: `Địa điểm ${input.query} không tồn tại thực tế.`,
      };
    }

    const baseCoords = geoCoords[matched];

    return {
      status: 'success',
      source: 'fallback',
      name: input.query,
      latitude: baseCoords.lat + (Math.random() - 0.5) * 0.05,
      longitude: baseCoords.lng + (Math.random() - 0.5) * 0.05,
      category: 'attraction',
      address: `Khu vực ${input.query}, Việt Nam (Dự phòng)`,
    };
  }
}

export class WeatherTool implements AgentTool {
  name = 'Weather';
  description = 'Xem dự báo thời tiết tại địa điểm chỉ định.';

  async execute(input: { location: string }) {
    // Thử gọi OpenWeatherMap API thực tế nếu có cấu hình key trong .env
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (apiKey && apiKey !== 'your_openweather_key_here') {
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(input.location)}&appid=${apiKey}&units=metric&lang=vi`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json() as any;
          return {
            status: 'success',
            location: input.location,
            temperature: `${data.main.temp.toFixed(1)}°C`,
            condition: data.weather[0].description,
            humidity: `${data.main.humidity}%`,
            windSpeed: `${(data.wind.speed * 3.6).toFixed(1)} km/h`
          };
        }
      } catch (err) {
        console.warn('[WeatherTool] Failed to fetch real weather:', err);
      }
    }

    // Giả lập gọi API thời tiết ngoài (OpenWeatherMap) làm dự phòng
    const temps = [25, 28, 30, 32, 22, 18];
    const temp = temps[Math.floor(Math.random() * temps.length)];
    const conditions = ['Trời nắng đẹp', 'Có mây rải rác', 'Mưa nhẹ', 'Nhiều mây', 'Khô ráo'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
      status: 'success',
      location: input.location,
      temperature: `${temp}°C`,
      condition,
      humidity: '75%',
      windSpeed: '12 km/h',
    };
  }
}

export class FoodTool implements AgentTool {
  name = 'Food';
  description = 'Tìm kiếm món ăn ngon và nhà hàng đặc sản theo vùng miền.';

  async execute(input: { region: string; dish?: string }) {
    // 1. Ưu tiên đọc dữ liệu từ tệp JSON đã gộp trong backend/src/config/destinations
    try {
      const curated = getCuratedProvince(input.region);
      if (curated) {
        const results: any[] = [];
        
        // Thêm các nhà hàng từ dữ liệu gộp
        if (curated.restaurants && curated.restaurants.length > 0) {
          curated.restaurants.forEach((r) => {
            results.push({
              name: r.name,
              region: curated.provinceName,
              rating: 4.8,
              description: r.description + (r.costEstimate ? ` (Chi phí dự kiến: ${r.costEstimate.toLocaleString('vi-VN')} đ)` : ''),
            });
          });
        }
        
        // Thêm các đặc sản từ dữ liệu gộp
        if (curated.specialties && curated.specialties.length > 0) {
          curated.specialties.forEach((spec) => {
            if (!results.some(item => item.name.toLowerCase() === spec.toLowerCase())) {
              results.push({
                name: spec,
                region: curated.provinceName,
                rating: 4.9,
                description: `Món ngon đặc sản nổi tiếng nhất định phải thử khi ghé thăm ${curated.provinceName}.`,
              });
            }
          });
        }
        
        if (results.length > 0) {
          console.log(`[FoodTool] Loaded ${results.length} items from curated JSON for: "${input.region}"`);
          return {
            status: 'success',
            results: results.slice(0, 10),
          };
        }
      }
    } catch (e: any) {
      console.warn('[FoodTool] Error loading curated destinations JSON:', e.message);
    }

    // 2. Dự phòng: Truy vấn các món ăn từ bảng KnowledgeContent
    const dbFoods = await prisma.knowledgeContent.findMany({
      where: {
        category: 'food',
        title: {
          contains: input.region,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    if (dbFoods.length > 0) {
      const results = dbFoods.map((item) => {
        const name = extractItemNameFromTitle(item.title);
        return {
          name,
          region: input.region,
          rating: 4.8,
          description: item.body,
        };
      });
      return {
        status: 'success',
        results,
      };
    }

    // Fallback tĩnh cơ bản nhất nếu DB chưa nạp bất kỳ món ăn nào cho vùng miền này
    return {
      status: 'success',
      results: [
        {
          name: `Đặc sản của ${input.region}`,
          region: input.region,
          rating: 4.5,
          description: `Món ăn đặc sản độc đáo mang đậm hương vị bản địa của ${input.region}.`,
        },
      ],
    };
  }
}

export class CultureTool implements AgentTool {
  name = 'Culture';
  description = 'Tra cứu văn hóa, lễ hội, lịch sử và phong tục tập quán của các vùng miền.';

  async execute(input: { region: string }) {
    // 1. Ưu tiên đọc dữ liệu văn hóa/lễ hội từ tệp JSON đã gộp trong backend/src/config/destinations
    try {
      const curated = getCuratedProvince(input.region);
      if (curated) {
        let info = '';
        if (curated.festivals && curated.festivals.length > 0) {
          const festivalInfo = curated.festivals.map(f => `• **${f.name}**: ${f.description}`).join('\n');
          info += `**Các lễ hội truyền thống đặc sắc tại ${curated.provinceName}:**\n${festivalInfo}\n\n`;
        }
        if (curated.specialties && curated.specialties.length > 0) {
          info += `**Di sản ẩm thực đặc trưng:** ${curated.specialties.join(', ')}.\n\n`;
        }
        
        if (info) {
          info += `Khám phá văn hóa bản địa độc đáo cùng lối sống mộc mạc, hiếu khách của người dân nơi đây.`;
          console.log(`[CultureTool] Loaded curated culture information from JSON for: "${input.region}"`);
          return {
            status: 'success',
            region: curated.provinceName,
            info,
          };
        }
      }
    } catch (e: any) {
      console.warn('[CultureTool] Error loading curated destinations JSON:', e.message);
    }

    // 2. Dự phòng: Truy vấn thông tin văn hóa từ bảng KnowledgeContent
    const dbCultures = await prisma.knowledgeContent.findFirst({
      where: {
        category: 'culture',
        title: {
          contains: input.region,
          mode: 'insensitive',
        },
      },
    });

    const info = dbCultures
      ? dbCultures.body
      : `Tìm hiểu văn hóa, lịch sử hào hùng, lễ hội truyền thống đặc sắc và nếp sống mộc mạc của người dân địa phương tại ${input.region}.`;

    return {
      status: 'success',
      region: input.region,
      info,
    };
  }
}

export class RecommendationTool implements AgentTool {
  name = 'Recommendation';
  description = 'Gợi ý các điểm tham quan cá nhân hóa theo sở thích của người dùng.';

  async execute(input: { userId: string; preference?: string; region?: string }) {
    // Query sở thích người dùng từ bảng AIMemory
    const memory = await prisma.aIMemory.findUnique({
      where: { userId: input.userId },
    });

    const preferences = memory?.travelPreferences || ['nghỉ dưỡng', 'khám phá tự nhiên'];
    const favoriteLocations = memory?.favoriteLocations || ['Đà Lạt', 'Nha Trang'];

    // Tìm kiếm các địa điểm từ DB phù hợp với vùng miền yêu cầu (nếu có)
    let recommendations: Array<{ name: string; type: string; reason: string }> = [];
    
    if (input.region) {
      // 1. Ưu tiên đọc dữ liệu từ tệp JSON đã gộp trong backend/src/config/destinations
      try {
        const curated = getCuratedProvince(input.region);
        if (curated) {
          const items = [...(curated.attractions || []), ...(curated.nature || [])].slice(0, 10);
          if (items.length > 0) {
            recommendations = items.map(item => ({
              name: item.name,
              type: item.category === 'nature' ? 'nature' : 'explore',
              reason: item.description + (item.address ? ` (Địa chỉ: ${item.address})` : ''),
            }));
            console.log(`[RecommendationTool] Loaded ${recommendations.length} recommendations from curated JSON for: "${input.region}"`);
          }
        }
      } catch (e: any) {
        console.warn('[RecommendationTool] Error loading curated destinations JSON:', e.message);
      }

      // 2. Dự phòng: Truy vấn từ bảng KnowledgeContent
      if (recommendations.length === 0) {
        const dbDestinations = await prisma.knowledgeContent.findMany({
          where: {
            category: 'destination',
            OR: [
              {
                title: {
                  contains: input.region,
                  mode: 'insensitive',
                },
              },
              {
                body: {
                  contains: input.region,
                  mode: 'insensitive',
                },
              },
            ],
          },
          take: 6,
        });

        recommendations = dbDestinations.map(d => {
          const name = extractItemNameFromTitle(d.title);
          const bodyPreview = d.body.length > 250 ? d.body.substring(0, 250) + '...' : d.body;
          return {
            name,
            type: 'explore',
            reason: bodyPreview,
          };
        });
      }
    } else {
      // Chỉ gợi ý theo sở thích du lịch tổng quát từ DB nếu người dùng không chọn địa phương cụ thể
      const dbDestinations = await prisma.knowledgeContent.findMany({
        where: {
          category: 'destination',
        },
        take: 6,
      });

      recommendations = dbDestinations.map(d => {
        const name = extractItemNameFromTitle(d.title);
        const bodyPreview = d.body.length > 250 ? d.body.substring(0, 250) + '...' : d.body;
        return {
          name,
          type: 'explore',
          reason: bodyPreview,
        };
      });
    }

    // Fallback cuối cùng nếu DB trống rỗng hoàn toàn và không có địa phương yêu cầu cụ thể
    if (!input.region && recommendations.length === 0) {
      recommendations = [
        { name: 'Phú Quốc', type: 'nature', reason: 'Hòn đảo ngọc tuyệt đẹp với nhiều bãi biển hoang sơ.' },
        { name: 'Sapa', type: 'nature', reason: 'Vùng cao Tây Bắc với ruộng bậc thang và khí hậu mát mẻ quanh năm.' },
      ];
    }

    return {
      status: 'success',
      userPreferences: preferences,
      userFavoriteLocations: favoriteLocations,
      recommendations,
    };
  }
}

export class ItineraryTool implements AgentTool {
  name = 'Itinerary';
  description = 'Tạo và gợi ý khung lịch trình du lịch tham khảo.';

  async execute(input: { destination: string; days: number }) {
    let activitiesList: string[] = [];

    // 1. Ưu tiên đọc dữ liệu từ tệp JSON đã gộp trong backend/src/config/destinations
    try {
      const curated = getCuratedProvince(input.destination);
      if (curated) {
        const items = [...(curated.attractions || []), ...(curated.nature || [])];
        if (items.length > 0) {
          activitiesList = items.map(item => item.name);
          console.log(`[ItineraryTool] Loaded ${activitiesList.length} activities from curated JSON for: "${input.destination}"`);
        }
      }
    } catch (e: any) {
      console.warn('[ItineraryTool] Error loading curated destinations JSON:', e.message);
    }

    // 2. Dự phòng: Thử truy vấn các điểm tham quan hoặc trải nghiệm từ DB
    if (activitiesList.length === 0) {
      const attractions = await prisma.knowledgeContent.findFirst({
        where: {
          title: {
            contains: `${input.destination} - Những trải nghiệm`,
            mode: 'insensitive',
          },
        },
      });

      if (attractions) {
        activitiesList = attractions.body.split('\n').filter(l => l.trim().length > 10).map(l => l.replace(/^[*\-\d.\s]+/g, '').trim());
      }
    }

    const timeline = [];
    const fallbackActivities = [
      'Sáng: Khởi hành khám phá danh lam thắng cảnh nổi tiếng của địa phương.',
      'Trưa: Thưởng thức ẩm thực và món ăn đặc sản vùng miền.',
      'Chiều: Trải nghiệm các hoạt động giải trí và check-in chụp ảnh kỷ niệm.',
      'Tối: Dạo quanh phố phường, thưởng thức cuộc sống đêm bản địa.',
    ];

    for (let i = 1; i <= input.days; i++) {
      let dayActivities = [];
      if (activitiesList.length > 0) {
        const startIndex = ((i - 1) * 3) % activitiesList.length;
        const subList = activitiesList.slice(startIndex, startIndex + 3);
        dayActivities = [
          `Sáng: Khám phá ${subList[0] || 'điểm tham quan hấp dẫn'}`,
          `Trưa: Thưởng thức món ăn ngon địa phương`,
          `Chiều: Trải nghiệm ${subList[1] || 'hoạt động trải nghiệm bản địa'}`,
          `Tối: Tự do khám phá cuộc sống đêm`,
        ];
      } else {
        dayActivities = fallbackActivities;
      }

      timeline.push({
        day: i,
        activities: dayActivities,
      });
    }

    return {
      status: 'success',
      destination: input.destination,
      durationDays: input.days,
      timeline,
    };
  }
}

