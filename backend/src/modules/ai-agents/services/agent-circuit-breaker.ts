import { logger } from '../../../utils/logger';

export interface ToolCallEntry {
  toolName: string;
  argsHash: string;
  timestamp: number;
}

export interface CircuitBreakerCheckResult {
  allowed: boolean;
  reason?: string;
}

export class AgentCircuitBreaker {
  private history: ToolCallEntry[] = [];
  private readonly maxSameCallLimit: number = 2;
  private readonly maxIterations: number = 5;
  private currentIteration: number = 0;

  private hashArgs(args: any): string {
    try {
      return JSON.stringify(args || {});
    } catch {
      return String(args);
    }
  }

  public checkAndRecord(toolName: string, args: any): CircuitBreakerCheckResult {
    this.currentIteration++;

    // 1. Kiểm tra giới hạn số bước lặp tối đa
    if (this.currentIteration > this.maxIterations) {
      const errorMsg = `Đã đạt giới hạn lặp tối đa (${this.maxIterations} lượt). Dừng Agent để cứu Token.`;
      logger.warn('AgentCircuitBreaker', errorMsg);
      return { allowed: false, reason: `[Circuit Breaker] ${errorMsg}` };
    }

    // 2. Kiểm tra lặp lệnh trùng tham số > 2 lần
    const argsHash = this.hashArgs(args);
    const sameCallCount = this.history.filter(
      (entry) => entry.toolName === toolName && entry.argsHash === argsHash
    ).length;

    if (sameCallCount >= this.maxSameCallLimit) {
      const errorMsg = `Công cụ '${toolName}' với tham số giống hệt đã chạy ${sameCallCount} lần. Phát hiện vòng lặp!`;
      logger.warn('AgentCircuitBreaker', errorMsg);
      return { allowed: false, reason: `[Circuit Breaker] ${errorMsg}` };
    }

    this.history.push({
      toolName,
      argsHash,
      timestamp: Date.now(),
    });

    return { allowed: true };
  }

  public reset(): void {
    this.history = [];
    this.currentIteration = 0;
  }
}