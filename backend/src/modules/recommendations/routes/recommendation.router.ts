import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { RecommendationController } from '../controllers/recommendation.controller';
import {
  validateCreateRecommendation,
  validateUpdateRecommendation,
} from '../middlewares/recommendation.validation';

const router = Router();
const controller = new RecommendationController();

router.post('/', requireAuth, validateCreateRecommendation, controller.createRecommendation);
router.get('/', requireAuth, controller.getUserRecommendations);
router.put('/:id', requireAuth, validateUpdateRecommendation, controller.updateRecommendation);
router.delete('/:id', requireAuth, controller.deleteRecommendation);

export default router;
