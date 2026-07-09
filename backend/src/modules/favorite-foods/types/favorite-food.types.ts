export interface CreateFavoriteFoodDto {
  name: string;
  region?: string;
  description?: string;
  rating?: number;
}

export interface UpdateFavoriteFoodDto {
  name?: string;
  region?: string;
  description?: string;
  rating?: number;
}
