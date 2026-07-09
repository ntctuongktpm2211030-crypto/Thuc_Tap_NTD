export interface CreateFeedbackDto {
  messageId: string;
  rating: number;
  comment?: string;
}

export interface UpdateFeedbackDto {
  rating?: number;
  comment?: string;
}
