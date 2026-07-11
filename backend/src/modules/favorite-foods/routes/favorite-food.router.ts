import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { FavoriteFoodController } from '../controllers/favorite-food.controller';
import {
  validateCreateFavoriteFood,
  validateUpdateFavoriteFood,
} from '../middlewares/favorite-food.validation';

const router = Router();
const controller = new FavoriteFoodController();

router.post('/', requireAuth, validateCreateFavoriteFood, controller.create);
router.get('/', requireAuth, controller.list);
router.put('/:id', requireAuth, validateUpdateFavoriteFood, controller.update);
router.delete('/:id', requireAuth, controller.delete);

export default router;
