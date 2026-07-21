import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { validateDashboardFilter, validatePagination } from '../middlewares/dashboard.validation';

const router = Router();
const controller = new DashboardController();

// GET /api/v1/dashboard/summary
router.get('/summary', controller.getSummary);

// GET /api/v1/dashboard/users
router.get('/users', validateDashboardFilter, controller.getUsers);

// GET /api/v1/dashboard/posts
router.get('/posts', controller.getPosts);

// GET /api/v1/dashboard/top-posts
router.get('/top-posts', validatePagination, controller.getTopPosts);

// GET /api/v1/dashboard/top-users
router.get('/top-users', validatePagination, controller.getTopUsers);

// GET /api/v1/dashboard/checkins
router.get('/checkins', validatePagination, controller.getCheckins);

// GET /api/v1/dashboard/hot-locations
router.get('/hot-locations', validatePagination, controller.getHotLocations);

// GET /api/v1/dashboard/top-searches
router.get('/top-searches', validatePagination, controller.getTopSearches);

// GET /api/v1/dashboard/provinces
router.get('/provinces', controller.getProvinces);

// GET /api/v1/dashboard/interactions
router.get('/interactions', validateDashboardFilter, controller.getInteractions);

// GET /api/v1/dashboard/heatmap
router.get('/heatmap', controller.getHeatmap);

// GET /api/v1/dashboard/ai-insights
router.get('/ai-insights', controller.getAiInsights);

// ─────────────────────────────────────────────────────────
// PHASE II ROUTES
// ─────────────────────────────────────────────────────────

// GET /api/v1/dashboard/comparison
router.get('/comparison', controller.getComparison);

// GET /api/v1/dashboard/sparkline
router.get('/sparkline', controller.getSparkline);

// GET /api/v1/dashboard/gis
router.get('/gis', controller.getGis);

// GET /api/v1/dashboard/trending
router.get('/trending', controller.getTrending);

// GET /api/v1/dashboard/prediction
router.get('/prediction', controller.getPrediction);

// GET /api/v1/dashboard/behavior
router.get('/behavior', controller.getBehavior);

// GET /api/v1/dashboard/funnel
router.get('/funnel', controller.getFunnel);

// GET /api/v1/dashboard/export
router.get('/export', controller.getExport);

// GET /api/v1/dashboard/drilldown
router.get('/drilldown', controller.getDrilldown);

// GET /api/v1/dashboard/insights
router.get('/insights', controller.getAiInsights2);

export default router;
