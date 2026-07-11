import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadOpenStreetMap(query: string): Promise<any> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`;
  const headers = { 'User-Agent': 'SmartTravelTrainingPipeline/1.0 (admin@smarttravel.com)' };

  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    const data = res.data;

    const results = data.map((item: any) => ({
      source: 'OpenStreetMap',
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      class: item.class,
      type: item.type
    }));

    const result = { source: 'OpenStreetMap', query, results };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `osm_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.error(`[Download/OSM] Error downloading "${query}":`, err);
    return null;
  }
}
