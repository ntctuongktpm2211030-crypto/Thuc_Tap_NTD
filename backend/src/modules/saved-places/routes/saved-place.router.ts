import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { SavedPlaceController } from '../controllers/saved-place.controller';
import {
  validateCreateSavedPlace,
  validateUpdateSavedPlace,
} from '../middlewares/saved-place.validation';

const router = Router();
const controller = new SavedPlaceController();

router.post('/', requireAuth, validateCreateSavedPlace, controller.create);
router.get('/', requireAuth, controller.list);
router.put('/:id', requireAuth, validateUpdateSavedPlace, controller.update);
router.delete('/:id', requireAuth, controller.delete);

export default router;
