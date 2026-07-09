export interface CreateItineraryDto {
  title: string;
  description?: string;
}

export interface AddDayDto {
  dayIndex: number;
  date?: string; // ISO date string
}

export interface AddActivityDto {
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  cost?: number;
}

export interface UpdateActivityDto {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  cost?: number;
}
