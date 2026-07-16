import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { RagController } from '../controllers/rag.controller';

const router = Router();
const controller = new RagController();

router.post('/document', requireAuth, controller.addDocument);
router.post('/query', requireAuth, controller.query);
router.post('/query-enterprise', requireAuth, controller.queryEnterprise);

export default router;
