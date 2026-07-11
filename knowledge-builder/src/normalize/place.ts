import { NormalizedItem } from '../types';

export function normalizePlace(rawData: any): NormalizedItem[] {
  const items: NormalizedItem[] = [];

  if (rawData.source === 'Wikipedia' && rawData.content) {
    items.push({
      title: rawData.title || rawData.query,
      body: rawData.content,
      category: 'destination'
    });
  } else if (rawData.source === 'Wikidata' && rawData.description) {
    let geo = '';
    if (rawData.latitude && rawData.longitude) {
      geo = ` Vĩ độ: ${rawData.latitude}, Kinh độ: ${rawData.longitude}.`;
    }
    items.push({
      title: rawData.label || rawData.query,
      body: `${rawData.description}.${geo} Xem thêm tại ${rawData.url || ''}`,
      category: 'destination'
    });
  } else if (rawData.source === 'OpenStreetMap' && rawData.results) {
    const bodyText = rawData.results
      .map(
        (item: any) =>
          `- ${item.name} (Tọa độ: ${item.latitude}, ${item.longitude}. Loại: ${item.class}/${item.type})`
      )
      .join('\n');
    items.push({
      title: `Thông tin bản đồ ${rawData.query}`,
      body: `Dữ liệu địa điểm trích xuất từ OpenStreetMap cho từ khóa "${rawData.query}":\n${bodyText}`,
      category: 'destination'
    });
  } else if (rawData.source === 'UNESCO' && rawData.results) {
    rawData.results.forEach((item: any) => {
      items.push({
        title: `Di sản thế giới ${item.name}`,
        body: `${item.description} Phân loại: ${item.category}. Tọa độ: ${item.latitude}, ${item.longitude}.`,
        category: 'destination'
      });
    });
  } else if (rawData.source === 'GeoNames' && rawData.results) {
    const bodyText = rawData.results
      .map(
        (item: any) =>
          `- ${item.name} (Quốc gia: ${item.countryName}. Tọa độ: ${item.latitude}, ${item.longitude}. Phân loại: ${item.fcodeName})`
      )
      .join('\n');
    items.push({
      title: `Dữ liệu địa lý GeoNames ${rawData.query}`,
      body: `Dữ liệu địa lý cho từ khóa "${rawData.query}":\n${bodyText}`,
      category: 'destination'
    });
  }

  return items;
}
