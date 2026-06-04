export interface RoutePoint {
  id: string;
  /** Tên ngắn (POI / địa danh) */
  name: string;
  /** Địa chỉ đầy đủ — đường, phường, tỉnh */
  address: string;
  lat: number;
  lng: number;
}

export function newRoutePoint(
  name: string,
  lat: number,
  lng: number,
  address?: string,
): RoutePoint {
  const full = address?.trim() || name;
  return {
    id: `rp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || full.split(',')[0]?.trim() || 'Điểm',
    address: full,
    lat,
    lng,
  };
}

export function routeDestinationLabel(points: RoutePoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return points[0].name;
  const start = points[0].name;
  const end = points[points.length - 1].name;
  if (points.length === 2) return `${start} → ${end}`;
  return `${start} → … → ${end} (${points.length} điểm)`;
}

export function normalizeRoutePoint(raw: Partial<RoutePoint> & { lat: number; lng: number }): RoutePoint {
  const address = raw.address || raw.name || 'Điểm';
  return {
    id: raw.id || `rp-${Date.now()}`,
    name: raw.name || address.split(',')[0]?.trim() || 'Điểm',
    address,
    lat: raw.lat,
    lng: raw.lng,
  };
}

export function routePointRole(index: number, total: number): 'start' | 'waypoint' | 'end' {
  if (index === 0) return 'start';
  if (index === total - 1 && total > 1) return 'end';
  return 'waypoint';
}

export function routePointRoleLabel(index: number, total: number): string {
  const role = routePointRole(index, total);
  if (role === 'start') return 'Vị trí bắt đầu';
  if (role === 'end') return 'Điểm kết thúc';
  return `Điểm ${index + 1}`;
}
