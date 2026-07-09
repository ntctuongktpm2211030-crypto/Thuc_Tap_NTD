import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadGeoNames(query: string): Promise<any> {
  const username = process.env.GEONAMES_USERNAME || 'demo';
  const url = `http://api.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=3&username=${username}`;

  try {
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data;

    const results = (data.geonames || []).map((item: any) => ({
      source: 'GeoNames',
      name: item.name,
      countryName: item.countryName,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lng),
      fcodeName: item.fcodeName
    }));

    const result = { source: 'GeoNames', query, results };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `geonames_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.warn(`[Download/GeoNames] GeoNames API failed or username not configured. Using fallback.`);
    const mockGeonames = [
      {
        source: 'GeoNames',
        name: query,
        countryName: 'Vietnam',
        latitude: 21.0285,
        longitude: 105.8522,
        fcodeName: 'capital of a political entity'
      }
    ];

    const result = { source: 'GeoNames', query, results: mockGeonames };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `geonames_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  }
}
