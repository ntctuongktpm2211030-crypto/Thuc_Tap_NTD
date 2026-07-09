"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
// ─── Import all module routers ───
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const trips_router_1 = __importDefault(require("./modules/trips/trips.router"));
const posts_router_1 = __importDefault(require("./modules/posts/posts.router"));
const map_router_1 = __importDefault(require("./modules/map/map.router"));
const recommendations_router_1 = __importDefault(require("./modules/recommendations/recommendations.router"));
const social_router_1 = __importDefault(require("./modules/social/social.router"));
const analytics_router_1 = __importDefault(require("./modules/analytics/analytics.router"));
const chatbot_router_1 = __importDefault(require("./modules/chatbot/routes/chatbot.router"));
const itinerary_router_1 = __importDefault(require("./modules/itinerary/routes/itinerary.router"));
const recommendation_router_1 = __importDefault(require("./modules/recommendations/routes/recommendation.router"));
const travel_history_router_1 = __importDefault(require("./modules/travel-history/routes/travel-history.router"));
const app = (0, express_1.default)();
// ─── Global Middleware ───
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Health check ───
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'SmartTravel API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
// ─── API Routes ───────────────────────────────────────────
// Authentication: register / login / refresh / me
app.use('/api/v1/auth', auth_router_1.default);
// Trips: CRUD + AI generation + TSP optimization + cloning
app.use('/api/v1/trips', trips_router_1.default);
// Posts: blog posts + likes + bookmarks + comments
app.use('/api/v1/posts', posts_router_1.default);
// Map/GIS: check-ins + live location + nearby + destinations
app.use('/api/v1/map', map_router_1.default);
// Recommendations: AI-scored + spatial proximity + destination catalog
app.use('/api/v1/recommendations', recommendations_router_1.default);
// Social: profile, follow/unfollow, notifications, user search
app.use('/api/v1/social', social_router_1.default);
// Analytics: platform stats, AI usage, GIS heatmap, trip trends
app.use('/api/v1/analytics', analytics_router_1.default);
// Chatbot: Core AI Conversation + AI Memory
app.use('/api/v1/chatbot', chatbot_router_1.default);
// Itinerary: Itineraries + Days + Activities
app.use('/api/v1/itineraries', itinerary_router_1.default);
// Recommendations (User Custom): Add + Update + Delete + List
app.use('/api/v1/user-recommendations', recommendation_router_1.default);
// Travel History: Visited Locations + Dates + Ratings + Costs
app.use('/api/v1/travel-history', travel_history_router_1.default);
// ─── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        error: 'Route not found.',
        hint: 'Available base paths: /api/v1/auth, /api/v1/trips, /api/v1/posts, /api/v1/map, /api/v1/recommendations, /api/v1/social',
    });
});
// ─── Centralized Error Handling ──────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
    });
});
exports.default = app;
