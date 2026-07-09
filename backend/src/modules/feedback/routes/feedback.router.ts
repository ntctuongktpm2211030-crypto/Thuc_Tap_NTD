import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { FeedbackController } from '../controllers/feedback.controller';
import {
  validateCreateFeedback,
  validateUpdateFeedback,
} from '../middlewares/feedback.validation';

const router = Router();
const controller = new FeedbackController();

router.post('/', requireAuth, validateCreateFeedback, controller.create);
router.get('/', requireAuth, controller.list);
router.put('/:id', requireAuth, validateUpdateFeedback, controller.update);
router.delete('/:id', requireAuth, controller.delete);

export default router;
