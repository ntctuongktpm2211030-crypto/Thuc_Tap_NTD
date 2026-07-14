import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../config/destinations/tinh-ca-mau.json');

if (fs.existsSync(filePath)) {
  const items = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Total items in Cà Mau: ${items.length}`);
  
  // Group by coordinates
  const coordsMap: Record<string, any[]> = {};
  for (const item of items) {
    const key = `${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`;
    if (!coordsMap[key]) coordsMap[key] = [];
    coordsMap[key].push(item.title);
  }
  
  console.log("\nCoordinates distribution (top groups):");
  const sortedGroups = Object.entries(coordsMap).sort((a, b) => b[1].length - a[1].length);
  for (const [coords, titles] of sortedGroups.slice(0, 5)) {
    console.log(`- ${coords}: ${titles.length} items (e.g. "${titles.slice(0, 3).join('", "')}")`);
  }
} else {
  console.log("File tinh-ca-mau.json does not exist.");
}
