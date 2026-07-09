import { Router } from 'express';
import { CacheController } from '../controllers/cache.controller';

const router = Router();
const controller = new CacheController();

router.post('/', controller.set);
router.get('/:type/:key', controller.get);
router.delete('/:type/:key', controller.delete);
router.post('/clear-expired', controller.clearExpired);

export default router;
