import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function downloadUNESCO(query: string): Promise<any> {
  try {
    const vietnamUNESCO = [
      {
        name: 'Vịnh Hạ Long',
        description: 'Vịnh Hạ Long thuộc tỉnh Quảng Ninh, Việt Nam, được UNESCO công nhận là Di sản thiên nhiên thế giới vào năm 1994 và 2000.',
        category: 'Natural',
        latitude: 20.9101,
        longitude: 107.1824
      },
      {
        name: 'Cố đô Huế',
        description: 'Quần thể di tích Cố đô Huế là Di sản văn hóa thế giới đầu tiên của Việt Nam được UNESCO công nhận vào năm 1993.',
        category: 'Cultural',
        latitude: 16.4697,
        longitude: 107.5794
      },
      {
        name: 'Phố cổ Hội An',
        description: 'Phố cổ Hội An là một đô thị cổ nằm ở hạ lưu sông Thu Bồn, thuộc tỉnh Quảng Nam, được công nhận là di sản thế giới năm 1999.',
        category: 'Cultural',
        latitude: 15.8801,
        longitude: 108.338
      },
      {
        name: 'Phong Nha - Kẻ Bàng',
        description: 'Vườn quốc gia Phong Nha - Kẻ Bàng được UNESCO công nhận là di sản thiên nhiên thế giới năm 2003 và 2015.',
        category: 'Natural',
        latitude: 17.5901,
        longitude: 106.2824
      }
    ];

    const filtered = query
      ? vietnamUNESCO.filter(
          item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        )
      : vietnamUNESCO;

    const result = { source: 'UNESCO', query, results: filtered };

    const dir = path.resolve(__dirname, '../../temp/raw');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(dir, `unesco_${encodeURIComponent(query)}.json`),
      JSON.stringify(result, null, 2)
    );

    return result;
  } catch (err) {
    console.error(`[Download/UNESCO] Error:`, err);
    return null;
  }
}
