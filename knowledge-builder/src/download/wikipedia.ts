import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadWikipedia(query: string): Promise<any> {
  const url = `https://vi.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
  const headers = { 'User-Agent': 'SmartTravelTrainingPipeline/1.0' };

  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    const searchData = res.data;
    if (!searchData || !searchData[1] || searchData[1].length === 0) {
      return null;
    }

    const title = searchData[1][0];
    const wikiUrl = searchData[3][0];

    const contentUrl = `https://vi.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=0&explaintext=1&titles=${encodeURIComponent(title)}&format=json`;
    const contentRes = await axios.get(contentUrl, { headers, timeout: 10000 });
    const pages = contentRes.data.query.pages;
    let content = '';

    for (const key in pages) {
      if (key !== '-1' && pages[key].extract) {
        content = pages[key].extract;
      }
    }

    const result = { source: 'Wikipedia', query, title, url: wikiUrl, content };

    // Lưu vào thư mục temp/raw
    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `wikipedia_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.error(`[Download/Wikipedia] Error downloading "${query}":`, err);
    return null;
  }
}
