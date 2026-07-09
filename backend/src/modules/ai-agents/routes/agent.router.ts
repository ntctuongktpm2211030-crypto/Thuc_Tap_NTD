import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { AgentController } from '../controllers/agent.controller';

const router = Router();
const controller = new AgentController();

router.post('/run', requireAuth, controller.run);

export default router;
