import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { SavedPlaceController } from '../controllers/saved-place.controller';
import {
  validateCreateSavedPlace,
  validateUpdateSavedPlace,
} from '../middlewares/saved-place.validation';

const router = Router();
const controller = new SavedPlaceController();

router.post('/', requireAuth, validateCreateSavedPlace, controller.TaoDiaDiemDaLuu);
router.get('/', requireAuth, controller.LayDanhSachDiaDiemDaLuu);
router.put('/:id', requireAuth, validateUpdateSavedPlace, controller.CapNhatDiaDiemDaLuu);
router.delete('/:id', requireAuth, controller.XoaDiaDiemDaLuu);

export default router;
