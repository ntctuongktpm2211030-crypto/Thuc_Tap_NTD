export interface CreateSavedPlaceDto {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
}

export interface UpdateSavedPlaceDto {
  name?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  imageUrl?: string;
}
