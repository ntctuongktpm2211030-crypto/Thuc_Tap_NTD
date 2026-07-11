export type ChatRole = 'user' | 'assistant' | 'system';

export interface CreateConversationDto {
  title?: string;
}

export interface SendMessageDto {
  content: string;
}

export interface SaveMemoryDto {
  travelPreferences?: string[];
  favoriteFoods?: string[];
  budget?: string;
  transportation?: string[];
  favoriteLocations?: string[];
}

export interface ChatMessageVersionResponse {
  id: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  role: ChatRole;
  createdAt: Date;
  updatedAt: Date;
  versions: ChatMessageVersionResponse[];
}
