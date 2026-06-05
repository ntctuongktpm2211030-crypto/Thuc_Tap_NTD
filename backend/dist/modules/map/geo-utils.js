"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAP_LAYERS = void 0;
exports.distanceKm = distanceKm;
exports.slugify = slugify;
exports.resolveCoordsFromText = resolveCoordsFromText;
exports.extractPostGeo = extractPostGeo;
/** Haversine distance in km */
function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function slugify(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
const VIETNAM_COORDS = {
    'ha-noi': [21.0285, 105.8542],
    hanoi: [21.0285, 105.8542],
    'ha-giang': [22.8233, 104.9784],
    hagiang: [22.8233, 104.9784],
    sapa: [22.3364, 103.8438],
    'da-nang': [16.0544, 108.2022],
    danang: [16.0544, 108.2022],
    'hoi-an': [15.8801, 108.338],
    hoian: [15.8801, 108.338],
    hue: [16.4637, 107.5909],
    'ninh-binh': [20.2506, 105.9745],
    ninhbinh: [20.2506, 105.9745],
    'ha-long': [20.9101, 107.1839],
    halong: [20.9101, 107.1839],
    'ho chi minh': [10.8231, 106.6297],
    'tp-hcm': [10.8231, 106.6297],
};
function resolveCoordsFromText(text) {
    const lower = text.toLowerCase();
    for (const [key, coords] of Object.entries(VIETNAM_COORDS)) {
        if (lower.includes(key.replace(/-/g, ' ')) || lower.includes(key)) {
            return { lat: coords[0], lng: coords[1] };
        }
    }
    return null;
}
function extractPostGeo(content) {
    try {
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object')
            return null;
        const route = parsed.route;
        if (route?.points?.length) {
            const first = route.points[0];
            return {
                latitude: first.lat,
                longitude: first.lng,
                destinationName: String(parsed.destination || parsed.headline || ''),
                routePoints: route.points,
            };
        }
        const lat = parsed.latitude ?? parsed.lat;
        const lng = parsed.longitude ?? parsed.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
            return {
                latitude: lat,
                longitude: lng,
                destinationName: String(parsed.destination || ''),
            };
        }
        const dest = String(parsed.destination || parsed.headline || '');
        const fromText = resolveCoordsFromText(dest);
        if (fromText) {
            return { ...fromText, destinationName: dest };
        }
    }
    catch {
        /* plain text */
    }
    const fromPlain = resolveCoordsFromText(content);
    if (fromPlain)
        return fromPlain;
    return null;
}
exports.DEFAULT_MAP_LAYERS = {
    stories: true,
    checkins: true,
    travelers: true,
    friends: true,
    attractions: true,
    restaurants: true,
    hotels: true,
    events: true,
    aiRecommendations: true,
    routes: true,
    heatmap: false,
    analytics: false,
};
