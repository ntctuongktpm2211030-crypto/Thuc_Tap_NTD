import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../config/destinations/tinh-an-giang.json');

const customCoords: Record<string, { lat: number; lng: number }> = {
  'Vườn quốc gia Phú Quốc': { lat: 10.3316783, lng: 104.0278267 },
  'Nhà tù Phú Quốc': { lat: 10.0443638, lng: 104.0154282 },
  'Dinh Cậu': { lat: 10.2172119, lng: 103.9538617 },
  'Bãi Sao': { lat: 10.0565635, lng: 104.032357 },
  'Nhà hàng Xin Chào': { lat: 10.2122005, lng: 103.956461 },
  'Vinpearl Resort & Spa Phú Quốc': { lat: 10.3318547, lng: 103.8488121 },
  'Chùa Hộ Quốc': { lat: 10.1101353, lng: 104.0263093 },
  'Hòn Sơn': { lat: 9.8080566, lng: 104.6119878 },
  'Chợ đêm Phú Quốc': { lat: 10.2708486, lng: 103.8676917 },
  'Bãi tắm Mũi Nai': { lat: 10.3826765, lng: 104.4354696 },
  'Nhà hàng Cánh Buồm': { lat: 10.3773812, lng: 104.4076748 },
  'Hòn Đầm Dương': { lat: 10.1420004, lng: 104.4933975 },
  'Bãi biển Ba Hòn Đầm': { lat: 10.3777586, lng: 104.2836339 },
  'Bãi biển Bãi Khem': { lat: 10.0333541, lng: 104.0230121 },
  'Resort Salinda Phú Quốc': { lat: 10.182773, lng: 103.9656131 },
  'Suối Tranh': { lat: 10.1828198, lng: 103.9475401 },
  'Lễ hội Đình thần Dương Đông': { lat: 10.2142924, lng: 103.9587008 },
  'Bãi biển Hòn Thơm': { lat: 10.1159653, lng: 103.8019998 },
  'Thạch Động Hà Tiên': { lat: 10.4108506, lng: 104.4722181 }
};

function runFix() {
  console.log('=== START FIXING KIEN GIANG SPECIFIC COORDINATES ===');

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const contentText = fs.readFileSync(filePath, 'utf-8');
  let items: any[] = [];
  try {
    items = JSON.parse(contentText);
  } catch (e: any) {
    console.error(`Failed to parse tinh-an-giang.json:`, e.message);
    return;
  }

  let updatedCount = 0;
  for (const [title, coords] of Object.entries(customCoords)) {
    const matchedItems = items.filter(item => item.title === title);
    for (const matchedItem of matchedItems) {
      matchedItem.latitude = coords.lat;
      matchedItem.longitude = coords.lng;
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    console.log(`[FIXED] Successfully updated ${updatedCount} specific places in tinh-an-giang.json`);
  } else {
    console.log('No matching places found to update.');
  }
}

runFix();
