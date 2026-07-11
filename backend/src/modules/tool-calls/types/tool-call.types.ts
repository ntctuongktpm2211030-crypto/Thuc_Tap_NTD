export interface CreateToolCallDto {
  messageId: string;
  toolName: string;
  input: string;
  output?: string;
  status: string;
}

export interface UpdateToolCallDto {
  toolName?: string;
  input?: string;
  output?: string;
  status?: string;
}
