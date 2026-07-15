export interface Citation {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
  similarity?: number;
  index: number;
}

export interface AgentResponse {
  response: string;
  citations: Citation[];
}

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
  ): Promise<AgentResponse>;
}

export type AgentType = 'travel' | 'food' | 'culture' | 'recommendation' | 'unknown';

export interface RunAgentDto {
  agentType?: AgentType;
  input: string;
  messageId?: string;
}
