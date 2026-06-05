"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserMapSettings = ensureUserMapSettings;
exports.syncPostCoordinates = syncPostCoordinates;
exports.parsePostPreview = parsePostPreview;
exports.getStoryMarkers = getStoryMarkers;
exports.createCheckInRecord = createCheckInRecord;
exports.getHeatmapPoints = getHeatmapPoints;
exports.getTravelersNearby = getTravelersNearby;
exports.buildMapRecommendations = buildMapRecommendations;
const db_1 = __importDefault(require("../../config/db"));
const gis_helper_1 = require("./gis-helper");
const geo_utils_1 = require("./geo-utils");
const io_1 = require("../../socket/io");
async function ensureUserMapSettings(userId) {
    const existing = await db_1.default.userMapSettings.findUnique({ where: { userId } });
    if (existing)
        return existing;
    return db_1.default.userMapSettings.create({
        data: { userId, layers: geo_utils_1.DEFAULT_MAP_LAYERS },
    });
}
async function syncPostCoordinates(postId, content) {
    const geo = (0, geo_utils_1.extractPostGeo)(content);
    if (!geo)
        return null;
    let destinationId = null;
    if (geo.destinationName) {
        const slug = (0, geo_utils_1.slugify)(geo.destinationName.slice(0, 80));
        const dest = await db_1.default.destination.upsert({
            where: { slug: slug || `post-${postId}` },
            create: {
                slug: slug || `post-${postId}`,
                name: geo.destinationName.slice(0, 120),
                latitude: geo.latitude,
                longitude: geo.longitude,
                category: 'attraction',
            },
            update: { latitude: geo.latitude, longitude: geo.longitude },
        });
        destinationId = dest.id;
    }
    return db_1.default.post.update({
        where: { id: postId },
        data: {
            latitude: geo.latitude,
            longitude: geo.longitude,
            destinationId,
        },
    });
}
function parsePostPreview(content) {
    try {
        const p = JSON.parse(content);
        return {
            type: String(p.type || 'post'),
            headline: String(p.headline || p.title || ''),
            excerpt: String(p.excerpt || ''),
            destination: String(p.destination || ''),
            category: String(p.category || ''),
            routePoints: p.route?.points || [],
        };
    }
    catch {
        return {
            type: 'post',
            headline: content.slice(0, 80),
            excerpt: content.slice(0, 160),
            destination: '',
            category: '',
            routePoints: [],
        };
    }
}
async function getStoryMarkers(params) {
    const limit = params.limit ?? 100;
    const where = { deletedAt: null };
    if (params.lat != null && params.lng != null) {
        const bbox = (0, gis_helper_1.calculateBoundingBox)({ latitude: params.lat, longitude: params.lng }, params.radius ?? 200);
        where.OR = [
            {
                latitude: { gte: bbox.minLatitude, lte: bbox.maxLatitude },
                longitude: { gte: bbox.minLongitude, lte: bbox.maxLongitude },
            },
        ];
    }
    const posts = await db_1.default.post.findMany({
        where,
        include: {
            author: { include: { profile: true } },
            destination: true,
            _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    const markers = [];
    for (const post of posts) {
        let lat = post.latitude;
        let lng = post.longitude;
        const preview = parsePostPreview(post.content);
        if (lat == null || lng == null) {
            const geo = (0, geo_utils_1.extractPostGeo)(post.content);
            if (geo) {
                lat = geo.latitude;
                lng = geo.longitude;
                await db_1.default.post.update({
                    where: { id: post.id },
                    data: { latitude: lat, longitude: lng },
                }).catch(() => undefined);
            }
        }
        if (lat == null || lng == null)
            continue;
        markers.push({
            id: post.id,
            type: 'story',
            lat,
            lng,
            title: preview.headline || preview.excerpt || 'Travel Story',
            excerpt: preview.excerpt,
            coverImage: post.mediaUrls[0] || null,
            author: {
                id: post.author.id,
                name: post.author.profile?.fullName || post.author.email,
                avatar: post.author.profile?.avatarUrl,
            },
            likes: post._count.likes,
            comments: post._count.comments,
            views: post.viewCount,
            destination: preview.destination || post.destination?.name,
            category: preview.category,
            createdAt: post.createdAt,
        });
    }
    return markers;
}
async function createCheckInRecord(userId, data) {
    const checkin = await db_1.default.checkIn.create({
        data: {
            userId,
            latitude: data.latitude,
            longitude: data.longitude,
            destinationId: data.destinationId || null,
            title: data.title || null,
            description: data.description || data.note || null,
            mood: data.mood || null,
            rating: data.rating ?? null,
            images: data.images || [],
            note: data.note || null,
        },
        include: {
            user: { include: { profile: true } },
            destination: true,
        },
    });
    (0, io_1.emitToAll)('checkin:new', checkin);
    return checkin;
}
async function getHeatmapPoints() {
    const [checkins, posts] = await Promise.all([
        db_1.default.checkIn.findMany({
            select: { latitude: true, longitude: true, rating: true },
            take: 2000,
        }),
        db_1.default.post.findMany({
            where: { deletedAt: null, latitude: { not: null }, longitude: { not: null } },
            select: { latitude: true, longitude: true, viewCount: true },
            take: 2000,
        }),
    ]);
    const points = [];
    checkins.forEach((c) => {
        points.push({ lat: c.latitude, lng: c.longitude, weight: (c.rating || 1) * 2 });
    });
    posts.forEach((p) => {
        if (p.latitude != null && p.longitude != null) {
            points.push({ lat: p.latitude, lng: p.longitude, weight: 1 + p.viewCount * 0.1 });
        }
    });
    return points;
}
async function getTravelersNearby(lat, lng, radiusKm, filters) {
    const locations = await db_1.default.location.findMany({
        where: { isVisible: true },
        include: {
            user: {
                include: {
                    profile: true,
                    preferences: true,
                },
            },
        },
        take: 200,
    });
    return locations
        .map((loc) => {
        const dist = (0, geo_utils_1.distanceKm)(lat, lng, loc.latitude, loc.longitude);
        const prefs = loc.user.preferences;
        if (filters?.travelStyle && prefs && !String(prefs.activities).includes(filters.travelStyle)) {
            return null;
        }
        if (dist > radiusKm)
            return null;
        return {
            userId: loc.userId,
            lat: loc.latitude,
            lng: loc.longitude,
            distanceKm: Math.round(dist * 10) / 10,
            name: loc.user.profile?.fullName || loc.user.email,
            avatar: loc.user.profile?.avatarUrl,
            bio: loc.user.profile?.bio,
            travelStyle: prefs?.preferredPace,
            budget: prefs?.dailyBudget,
            interests: prefs?.activities || [],
        };
    })
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 30);
}
async function buildMapRecommendations(userId, lat, lng) {
    const categoryColors = {
        attraction: 'blue',
        restaurant: 'orange',
        hotel: 'green',
        hidden_gem: 'purple',
    };
    let destinations = await db_1.default.destination.findMany({
        orderBy: { averageRating: 'desc' },
        take: 40,
    });
    if (lat != null && lng != null) {
        destinations = [...destinations].sort((a, b) => (0, geo_utils_1.distanceKm)(lat, lng, a.latitude, a.longitude) -
            (0, geo_utils_1.distanceKm)(lat, lng, b.latitude, b.longitude));
    }
    if (userId) {
        const bookmarks = await db_1.default.bookmark.findMany({
            where: { userId },
            include: { post: { select: { destinationId: true, latitude: true, longitude: true } } },
            take: 20,
        });
        const likedCats = new Set();
        bookmarks.forEach((b) => {
            if (b.post.destinationId)
                likedCats.add(b.post.destinationId);
        });
        if (likedCats.size) {
            destinations = destinations.filter((d) => !likedCats.has(d.id)).concat(await db_1.default.destination.findMany({
                where: { id: { in: [...likedCats] } },
            }));
        }
    }
    return destinations.slice(0, 25).map((d, i) => ({
        id: d.id,
        lat: d.latitude,
        lng: d.longitude,
        name: d.name,
        category: d.category,
        color: categoryColors[d.category] || 'blue',
        score: Math.max(0.5, 1 - i * 0.03),
        reason: `Được đề xuất dựa trên đánh giá ${d.averageRating.toFixed(1)}★`,
    }));
}
