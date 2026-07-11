export interface AgentTool {
  name: string;
  description: string;
  execute(input: any): Promise<any>;
}

export interface AgentStrategy {
  name: string;
  description: string;
  execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[]
  ): Promise<string>;
}

export type AgentType = 'travel' | 'food' | 'culture' | 'recommendation' | 'unknown';

export interface RunAgentDto {
  agentType?: AgentType; // Nếu không truyền, hệ thống sẽ tự động nhận diện agent phù hợp
  input: string;
  messageId?: string; // Dùng để lưu vết ToolCall nếu chạy trong ngữ cảnh chat
}
