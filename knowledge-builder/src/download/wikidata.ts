import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadWikidata(query: string): Promise<any> {
  const headers = { 'User-Agent': 'SmartTravelTrainingPipeline/1.0' };
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=vi&format=json`;
    const res = await axios.get(searchUrl, { headers, timeout: 10000 });
    const searchResults = res.data.search;
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    const entity = searchResults[0];
    const qid = entity.id;
    const label = entity.display?.label?.value || query;
    const description = entity.display?.description?.value || '';

    const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&languages=vi&format=json`;
    const entityRes = await axios.get(entityUrl, { headers, timeout: 10000 });
    const claims = entityRes.data.entities[qid].claims;
    const coordinateInfo = claims.P625 || [];

    let lat = null;
    let lng = null;
    if (coordinateInfo.length > 0) {
      const dataValue = coordinateInfo[0].mainsnak?.datavalue?.value || {};
      lat = dataValue.latitude;
      lng = dataValue.longitude;
    }

    const result = {
      source: 'Wikidata',
      query,
      qid,
      label,
      description,
      latitude: lat,
      longitude: lng,
      url: `https://www.wikidata.org/wiki/{qid}`
    };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `wikidata_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.error(`[Download/Wikidata] Error downloading "${query}":`, err);
    return null;
  }
}
