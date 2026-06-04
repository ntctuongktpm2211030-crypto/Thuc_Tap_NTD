/** Lấy geometry tuyến đường thực qua OSRM (OpenStreetMap routing) */
export async function fetchRoadRoute(
  points: { lat: number; lng: number }[],
): Promise<[number, number][] | null> {
  if (points.length < 2) return null;
  try {
    const coordStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords?.length) return null;
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
}
