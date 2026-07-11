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
const favorite_food_router_1 = __importDefault(require("./modules/favorite-foods/routes/favorite-food.router"));
const saved_place_router_1 = __importDefault(require("./modules/saved-places/routes/saved-place.router"));
const feedback_router_1 = __importDefault(require("./modules/feedback/routes/feedback.router"));
const tool_call_router_1 = __importDefault(require("./modules/tool-calls/routes/tool-call.router"));
const cache_router_1 = __importDefault(require("./modules/cache/routes/cache.router"));
const agent_router_1 = __importDefault(require("./modules/ai-agents/routes/agent.router"));
const rag_router_1 = __importDefault(require("./modules/rag/routes/rag.router"));
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
app.get('/restart', (_req, res) => {
    res.status(200).json({ message: 'Restarting backend server...' });
    setTimeout(() => {
        process.exit(0);
    }, 500);
});
const fs_1 = __importDefault(require("fs"));
app.get('/clean-json', (_req, res) => {
    try {
        const filePath = 'd:/Thuc_Tap_NDT/knowledge-builder/import-data-camau.json';
        const rawData = fs_1.default.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(rawData);
        function removeAccents(str) {
            return str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D');
        }
        const keywords = [
            'phú quốc', 'phụ quốc', 'hòn khô', 'cô tô', 'núi cấm', 'núi sam', 'núi mây',
            'cáp treo', 'thác', 'đèo', 'lặn biển', 'trường sa', 'hoàng sa', 'ngọc điểm',
            'ngũ hành', 'trà sư', 'tắm biển'
        ];
        const cleanData = data.filter((item) => {
            const titleClean = removeAccents(item.title.toLowerCase());
            const contentClean = removeAccents(item.content.toLowerCase());
            const hasBadKeyword = keywords.some(term => {
                const termClean = removeAccents(term.toLowerCase());
                return titleClean.includes(termClean) || contentClean.includes(termClean);
            });
            if (hasBadKeyword)
                return false;
            if (titleClean.includes('nui') || /\bnui\b/i.test(contentClean)) {
                if (!titleClean.includes('an giang') && !contentClean.includes('an giang') && !contentClean.includes('hon khoai') && !contentClean.includes('hon da bac')) {
                    return false;
                }
            }
            return true;
        });
        const deletedCount = data.length - cleanData.length;
        fs_1.default.writeFileSync(filePath, JSON.stringify(cleanData, null, 2), 'utf-8');
        res.status(200).json({
            status: 'success',
            originalCount: data.length,
            cleanCount: cleanData.length,
            deletedCount
        });
    }
    catch (err) {
        res.status(500).json({ status: 'failed', error: err.message });
    }
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
// Favorite Foods: Food Name + Region + Description + Rating
app.use('/api/v1/favorite-foods', favorite_food_router_1.default);
// Saved Places: Place Name + Category + Coordinates + Address + Image
app.use('/api/v1/saved-places', saved_place_router_1.default);
// Feedback: AI Chat Messages Rating & Comments
app.use('/api/v1/feedback', feedback_router_1.default);
// ToolCall: AI Chatbot Tool Usage Logs
app.use('/api/v1/tool-calls', tool_call_router_1.default);
// Cache: Place, Food and Blog API Caching (TTL-based)
app.use('/api/v1/cache', cache_router_1.default);
// AI Agent: Multi-agent execution (Strategy & DI Pattern)
app.use('/api/v1/ai-agents', agent_router_1.default);
// RAG: Retrieval-Augmented Generation (Embeddings + Vector Storage + Retriever + Prompt Builder)
app.use('/api/v1/rag', rag_router_1.default);
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
