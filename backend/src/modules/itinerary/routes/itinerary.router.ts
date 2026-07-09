import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { ItineraryController } from '../controllers/itinerary.controller';
import {
  validateCreateItinerary,
  validateAddDay,
  validateAddActivity,
  validateUpdateActivity,
} from '../middlewares/itinerary.validation';

const router = Router();
const controller = new ItineraryController();

// ─── Itineraries ────────────────────────────────────────────
router.post('/', requireAuth, validateCreateItinerary, controller.createItinerary);
router.get('/', requireAuth, controller.getItineraries);
router.get('/:id', requireAuth, controller.getItinerary);

// ─── Days ───────────────────────────────────────────────────
router.post('/:id/days', requireAuth, validateAddDay, controller.addDay);

// ─── Activities ─────────────────────────────────────────────
router.post('/days/:dayId/activities', requireAuth, validateAddActivity, controller.addActivity);
router.put('/activities/:activityId', requireAuth, validateUpdateActivity, controller.updateActivity);
router.delete('/activities/:activityId', requireAuth, controller.deleteActivity);

export default router;
