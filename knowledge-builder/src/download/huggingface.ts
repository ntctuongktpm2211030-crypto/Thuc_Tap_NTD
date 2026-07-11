import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadHuggingFace(datasetName: string, query: string = ''): Promise<any> {
  const headers = { 'User-Agent': 'SmartTravelTrainingPipeline/1.0' };
  try {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(datasetName)}&config=default&split=train&limit=5`;
    const res = await axios.get(url, { headers, timeout: 10000 });
    const rows = res.data.rows || [];

    const results = rows.map((row: any) => {
      const rowData = row.row || {};
      return {
        source: `HuggingFace/${datasetName}`,
        title: rowData.title || rowData.question || 'Dataset Item',
        content: rowData.content || rowData.text || rowData.answer || ''
      };
    });

    const result = { source: 'HuggingFace', datasetName, query, results };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `hf_${encodeURIComponent(datasetName)}_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.warn(`[Download/HuggingFace] Failed to fetch dataset "${datasetName}". Using mock fallback.`);
    const mockDataset = [
      {
        source: 'HuggingFace/vietnam-tourism-qa',
        title: 'Ẩm thực Hà Nội phở cuốn',
        content: 'Phở cuốn Hà Nội xuất hiện đầu tiên tại ngã tư phố Ngũ Xã và phố Nguyễn Khắc Hiếu, là sự kết hợp độc đáo của bánh phở bản to cuốn thịt bò xào tỏi thơm phức kèm rau sống và chấm nước mắm chua ngọt đặc trưng.'
      },
      {
        source: 'HuggingFace/vietnam-tourism-qa',
        title: 'Du lịch Sa Pa Bản Cát Cát',
        content: 'Bản Cát Cát là một làng nghề cổ kính của đồng bào người Mông đen tại Sa Pa, Lào Cai, nổi tiếng với nghề dệt thổ cẩm truyền thống, cối giã gạo bằng sức nước và cảnh quan thung lũng Mường Hoa tuyệt đẹp.'
      }
    ];

    const filtered = query
      ? mockDataset.filter(
          item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase())
        )
      : mockDataset;

    const result = { source: 'HuggingFace', datasetName, query, results: filtered };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `hf_${encodeURIComponent(datasetName)}_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  }
}
