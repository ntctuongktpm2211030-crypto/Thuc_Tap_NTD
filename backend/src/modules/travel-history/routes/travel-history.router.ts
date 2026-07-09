import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { TravelHistoryController } from '../controllers/travel-history.controller';
import {
  validateCreateTravelHistory,
  validateUpdateTravelHistory,
} from '../middlewares/travel-history.validation';

const router = Router();
const controller = new TravelHistoryController();

router.post('/', requireAuth, validateCreateTravelHistory, controller.create);
router.get('/', requireAuth, controller.list);
router.put('/:id', requireAuth, validateUpdateTravelHistory, controller.update);
router.delete('/:id', requireAuth, controller.delete);

export default router;
