import fs from 'fs';
import path from 'path';

// Let's test a coordinate that returned "Ngân hàng Quân Đội"
// For "Khách sạn Phú Cường Cà Mau", its coordinates in the file are around Ca Mau city center.
// Let's load the Ca Mau file and test the first few items that were updated to "Ngân hàng".
const camauPath = path.resolve(__dirname, '../config/destinations/tinh-ca-mau.json');

async function test() {
  if (!fs.existsSync(camauPath)) {
    console.log("No Ca Mau file.");
    return;
  }
  const items = JSON.parse(fs.readFileSync(camauPath, 'utf-8'));
  const targets = items.filter((item: any) => item.title.includes("Phú Cường") || item.title.includes("Chôl Chnăm Thmây"));

  for (const item of targets) {
    const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${item.longitude},${item.latitude}`;
    try {
      const res = await fetch(url);
      const data = await res.json() as any;
      console.log(`\n📍 Title: "${item.title}"`);
      console.log(`   Coords: ${item.latitude}, ${item.longitude}`);
      console.log(`   Full Address Object:`, JSON.stringify(data.address, null, 2));
    } catch (e: any) {
      console.error("Error:", e.message);
    }
  }
}

test();
