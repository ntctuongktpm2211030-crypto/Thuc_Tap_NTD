export interface CreateTravelHistoryDto {
  location: string;
  time: string; // ISO string format
  rating?: string;
  cost?: number;
}

export interface UpdateTravelHistoryDto {
  location?: string;
  time?: string;
  rating?: string;
  cost?: number;
}
