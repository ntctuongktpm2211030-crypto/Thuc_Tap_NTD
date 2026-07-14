import fs from 'fs';
import path from 'path';

// Let's test coordinates of a few places:
// 1. Chùa Chuông (Hưng Yên)
// 2. Khu di tích lịch sử Vàm Nhựt Tảo (Long An)
// 3. Cánh đồng hoa cúc chi (Hưng Yên)
const testPlaces = [
  { name: "Chùa Chuông", lat: 20.6557859, lng: 106.0504457 },
  { name: "Vàm Nhựt Tảo", lat: 10.5611303, lng: 106.5175639 },
  { name: "Cánh đồng hoa cúc chi", lat: 20.7601955, lng: 106.0276632 }
];

async function test() {
  for (const place of testPlaces) {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${place.lng},${place.lat}`;
    try {
      const res = await fetch(url);
      const data = await res.json() as any;
      console.log(`\n📍 Reverse Geocode for: "${place.name}"`);
      console.log(`   Coords: ${place.lat}, ${place.lng}`);
      console.log(`   Result:`, JSON.stringify(data.address, null, 2));
    } catch (e: any) {
      console.error(`Error for ${place.name}:`, e.message);
    }
  }
}

test();
