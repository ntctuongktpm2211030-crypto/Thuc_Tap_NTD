import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware';
import { ChatbotController } from '../controllers/chatbot.controller';
import {
  validateCreateConversation,
  validateSendMessage,
  validateSaveMemory,
} from '../middlewares/chatbot.validation';

const router = Router();
const controller = new ChatbotController();

// ─── Conversations ──────────────────────────────────────────
router.post('/conversations', requireAuth, validateCreateConversation, controller.createConversation);
router.get('/conversations', requireAuth, controller.getConversations);
router.get('/conversations/:id', requireAuth, controller.getConversation);

// ─── Messages & Regeneration ────────────────────────────────
router.post('/conversations/:id/messages', requireAuth, validateSendMessage, controller.sendMessage);
router.post('/messages/:messageId/regenerate', requireAuth, controller.regenerateResponse);

// ─── AI Memory ──────────────────────────────────────────────
router.get('/memory', requireAuth, controller.getMemory);
router.post('/memory', requireAuth, validateSaveMemory, controller.saveMemory);
router.put('/memory', requireAuth, validateSaveMemory, controller.saveMemory);
router.delete('/memory', requireAuth, controller.deleteMemory);

export default router;
