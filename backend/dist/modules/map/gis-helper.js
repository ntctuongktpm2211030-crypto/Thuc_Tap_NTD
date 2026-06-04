"use strict";
/**
 * GIS and Geospatial Calculations Helper Module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHaversineDistance = calculateHaversineDistance;
exports.calculateBoundingBox = calculateBoundingBox;
exports.checkGeofence = checkGeofence;
/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine Formula.
 *
 * @param p1 Source coordinate
 * @param p2 Destination coordinate
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(p1, p2) {
    const EARTH_RADIUS_KM = 6371.0088; // Earth's mean radius
    const dLat = (p2.latitude - p1.latitude) * (Math.PI / 180);
    const dLng = (p2.longitude - p1.longitude) * (Math.PI / 180);
    const lat1Rad = p1.latitude * (Math.PI / 180);
    const lat2Rad = p2.latitude * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
/**
 * Computes a bounding box (latitude/longitude boundaries) around a central coordinate.
 * Used for database search optimizations to query indices on lat/lng values
 * before applying exact distance filters.
 *
 * @param center Central coordinate
 * @param radiusKm Radius in kilometers
 * @returns Bounding box min/max boundaries
 */
function calculateBoundingBox(center, radiusKm) {
    const EARTH_RADIUS_KM = 6371.0088;
    // Degrees of latitude per km
    const latDelta = radiusKm / (EARTH_RADIUS_KM * (Math.PI / 180));
    // Degrees of longitude per km, scaling with latitude
    const lngDelta = radiusKm / (EARTH_RADIUS_KM * Math.cos(center.latitude * (Math.PI / 180)) * (Math.PI / 180));
    return {
        minLatitude: center.latitude - latDelta,
        maxLatitude: center.latitude + latDelta,
        minLongitude: center.longitude - lngDelta,
        maxLongitude: center.longitude + lngDelta,
    };
}
/**
 * Validates whether a given coordinate lies inside a geofenced area (polygon)
 * using the Ray-Casting (Jordan Curve) Algorithm.
 *
 * @param point Coordinate to verify
 * @param polygon Vertices outlining the geofenced area
 * @returns true if inside, false otherwise
 */
function checkGeofence(point, polygon) {
    let isInside = false;
    const x = point.longitude;
    const y = point.latitude;
    const count = polygon.length;
    for (let i = 0, j = count - 1; i < count; j = i++) {
        const xi = polygon[i].longitude;
        const yi = polygon[i].latitude;
        const xj = polygon[j].longitude;
        const yj = polygon[j].latitude;
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) {
            isInside = !isInside;
        }
    }
    return isInside;
}
