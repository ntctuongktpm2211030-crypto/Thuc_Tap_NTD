import { DashboardFilter } from '../types/dashboard.types';

export interface GetUsersQueryDto {
  filter?: DashboardFilter;
}

export interface GetPostsQueryDto {
  page?: string;
  limit?: string;
}

export interface GetTopPostsQueryDto {
  limit?: string;
}

export interface GetTopUsersQueryDto {
  limit?: string;
}

export interface GetCheckinsQueryDto {
  limit?: string;
}

export interface GetHotLocationsQueryDto {
  limit?: string;
}

export interface GetTopSearchesQueryDto {
  limit?: string;
}

export interface GetProvincesQueryDto {
  limit?: string;
}

export interface GetInteractionsQueryDto {
  filter?: DashboardFilter;
}
