function pickShortName(displayName: string, address?: Record<string, string>): string {
  if (address) {
    const short =
      address.tourism ||
      address.amenity ||
      address.building ||
      address.road ||
      address.suburb ||
      address.neighbourhood;
    if (short) return short;
  }
  return displayName.split(',')[0]?.trim() || displayName;
}

/** Reverse geocode — trả về địa chỉ đầy đủ */
export async function reverseGeocodeFull(
  lat: number,
  lng: number,
): Promise<{ name: string; address: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=vi`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { name: '', address: '' };
    const data = await res.json();
    const displayName = (data.display_name as string) || '';
    const name = pickShortName(displayName, data.address);
    return { name, address: displayName };
  } catch {
    return { name: '', address: '' };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const { address } = await reverseGeocodeFull(lat, lng);
  return address;
}

export interface PlaceSearchResult {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
}

/** Tìm địa điểm cụ thể (đường, POI, địa danh) */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=10&addressdetails=1&accept-language=vi`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data as Array<{ lat: string; lon: string; display_name: string; address?: Record<string, string> }>).map(item => ({
      name: pickShortName(item.display_name, item.address),
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
