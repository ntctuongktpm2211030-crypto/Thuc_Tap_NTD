import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { AgentExecutorService } from '../services/agent-executor.service';

export class AgentController {
  private executor: AgentExecutorService;

  constructor() {
    this.executor = new AgentExecutorService();
  }

  run = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const { input, agentType, messageId } = req.body;

      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return res.status(400).json({ error: 'input (câu hỏi/yêu cầu) là bắt buộc và phải là chuỗi ký tự.' });
      }

      if (agentType && !['travel', 'food', 'culture', 'recommendation'].includes(agentType)) {
        return res.status(400).json({ error: 'agentType nếu có phải thuộc nhóm: travel, food, culture, recommendation.' });
      }

      const result = await this.executor.execute(userId, input, agentType, messageId);

      return res.json(result);
    } catch (err: any) {
      console.error('[agent/run]', err);
      return res.status(500).json({ error: err.message || 'Lỗi hệ thống khi thực thi AI Agent.' });
    }
  };
}
