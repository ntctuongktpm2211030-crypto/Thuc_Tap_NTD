export interface CreateRecommendationDto {
  location: string;
  priority: 'high' | 'medium' | 'low' | string;
  reason?: string;
  type: string; // "destination", "food", "activity", etc.
}

export interface UpdateRecommendationDto {
  location?: string;
  priority?: 'high' | 'medium' | 'low' | string;
  reason?: string;
  type?: string;
}
