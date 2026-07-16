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

// ─── Lịch sử cuộc trò chuyện (Conversations) ─────────────────
router.post('/conversations', requireAuth, validateCreateConversation, controller.TaoCuocHoiThoai);
router.get('/conversations', requireAuth, controller.LayDanhSachCuocHoiThoai);
router.get('/conversations/:id', requireAuth, controller.LayChiTietCuocHoiThoai);
router.delete('/conversations/:id', requireAuth, controller.XoaCuocHoiThoai);

// ─── Gửi tin nhắn & Tái tạo phản hồi ──────────────────────────
router.post('/conversations/:id/messages', requireAuth, validateSendMessage, controller.GuiTinNhan);
router.post('/messages/:messageId/regenerate', requireAuth, controller.TaoLaiPhanHoi);

// ─── Bộ nhớ sở thích AI (AI Memory) ──────────────────────────
router.get('/memory', requireAuth, controller.LayBoNhoAI);
router.post('/memory', requireAuth, validateSaveMemory, controller.LuuBoNhoAI);
router.put('/memory', requireAuth, validateSaveMemory, controller.LuuBoNhoAI);
router.delete('/memory', requireAuth, controller.XoaBoNhoAI);

export default router;
