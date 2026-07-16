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

<<<<<<< HEAD
// ─── Conversations ──────────────────────────────────────────
router.post('/conversations', requireAuth, validateCreateConversation, controller.createConversation);
router.get('/conversations', requireAuth, controller.getConversations);
router.get('/conversations/:id', requireAuth, controller.getConversation);
router.delete('/conversations/:id', requireAuth, controller.deleteConversation);
=======
// ─── Lịch sử cuộc trò chuyện (Conversations) ─────────────────
router.post('/conversations', requireAuth, validateCreateConversation, controller.TaoCuocHoiThoai);
router.get('/conversations', requireAuth, controller.LayDanhSachCuocHoiThoai);
router.get('/conversations/:id', requireAuth, controller.LayChiTietCuocHoiThoai);
router.delete('/conversations/:id', requireAuth, controller.XoaCuocHoiThoai);
>>>>>>> 1b6d2c3e88f3f43b73392fecffb9dda55abecebe

// ─── Gửi tin nhắn & Tái tạo phản hồi ──────────────────────────
router.post('/conversations/:id/messages', requireAuth, validateSendMessage, controller.GuiTinNhan);
router.post('/messages/:messageId/regenerate', requireAuth, controller.TaoLaiPhanHoi);

// ─── Bộ nhớ sở thích AI (AI Memory) ──────────────────────────
router.get('/memory', requireAuth, controller.LayBoNhoAI);
router.post('/memory', requireAuth, validateSaveMemory, controller.LuuBoNhoAI);
router.put('/memory', requireAuth, validateSaveMemory, controller.LuuBoNhoAI);
router.delete('/memory', requireAuth, controller.XoaBoNhoAI);

export default router;
