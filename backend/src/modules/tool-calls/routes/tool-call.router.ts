import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { ToolCallController } from '../controllers/tool-call.controller';
import {
  validateCreateToolCall,
  validateUpdateToolCall,
} from '../middlewares/tool-call.validation';

const router = Router();
const controller = new ToolCallController();

router.post('/', requireAuth, validateCreateToolCall, controller.create);
router.get('/', requireAuth, controller.listAll);
router.get('/message/:messageId', requireAuth, controller.listByMessageId);
router.put('/:id', requireAuth, validateUpdateToolCall, controller.update);
router.delete('/:id', requireAuth, controller.delete);

export default router;
