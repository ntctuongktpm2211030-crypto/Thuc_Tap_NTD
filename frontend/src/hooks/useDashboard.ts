import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/smartTravel.service';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardService.LaySummary(),
    refetchInterval: 15000, // Auto-refreshes every 15s for live dashboard experience
  });
}

export function useDashboardUsers(filter: string) {
  return useQuery({
    queryKey: ['dashboard', 'users', filter],
    queryFn: () => dashboardService.LayUsers(filter),
  });
}

export function useDashboardPosts() {
  return useQuery({
    queryKey: ['dashboard', 'posts'],
    queryFn: () => dashboardService.LayPosts(),
  });
}

export function useDashboardTopPosts(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'top-posts', limit],
    queryFn: () => dashboardService.LayTopPosts(limit),
  });
}

export function useDashboardTopUsers(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'top-users', limit],
    queryFn: () => dashboardService.LayTopUsers(limit),
  });
}

export function useDashboardCheckins(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'checkins', limit],
    queryFn: () => dashboardService.LayCheckins(limit),
  });
}

export function useDashboardHotLocations(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'hot-locations', limit],
    queryFn: () => dashboardService.LayHotLocations(limit),
  });
}

export function useDashboardTopSearches(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'top-searches', limit],
    queryFn: () => dashboardService.LayTopSearches(limit),
  });
}

export function useDashboardProvinces() {
  return useQuery({
    queryKey: ['dashboard', 'provinces'],
    queryFn: () => dashboardService.LayProvinces(),
  });
}

export function useDashboardInteractions(filter: string) {
  return useQuery({
    queryKey: ['dashboard', 'interactions', filter],
    queryFn: () => dashboardService.LayInteractions(filter),
  });
}

export function useDashboardHeatmap() {
  return useQuery({
    queryKey: ['dashboard', 'heatmap'],
    queryFn: () => dashboardService.LayHeatmap(),
  });
}

export function useDashboardAiInsights() {
  return useQuery({
    queryKey: ['dashboard', 'ai-insights'],
    queryFn: () => dashboardService.LayAiInsights(),
    staleTime: 600000, // 10 minutes cache to avoid redundant AI calls
  });
}

export function useDashboardComparison(filter: string) {
  return useQuery({
    queryKey: ['dashboard', 'comparison', filter],
    queryFn: () => dashboardService.LayComparison(filter),
  });
}

export function useDashboardSparkline(type: string, ids: string) {
  return useQuery({
    queryKey: ['dashboard', 'sparkline', type, ids],
    queryFn: () => dashboardService.LaySparkline(type, ids),
    enabled: ids.length > 0
  });
}

export function useDashboardGis() {
  return useQuery({
    queryKey: ['dashboard', 'gis'],
    queryFn: () => dashboardService.LayGis(),
  });
}

export function useDashboardTrending(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'trending', limit],
    queryFn: () => dashboardService.LayTrending(limit),
  });
}

export function useDashboardPrediction(metric: string) {
  return useQuery({
    queryKey: ['dashboard', 'prediction', metric],
    queryFn: () => dashboardService.LayPrediction(metric),
  });
}

export function useDashboardBehavior() {
  return useQuery({
    queryKey: ['dashboard', 'behavior'],
    queryFn: () => dashboardService.LayBehavior(),
  });
}

export function useDashboardFunnel() {
  return useQuery({
    queryKey: ['dashboard', 'funnel'],
    queryFn: () => dashboardService.LayFunnel(),
  });
}

export function useDashboardAiInsights2(prompt?: string) {
  return useQuery({
    queryKey: ['dashboard', 'insights2', prompt],
    queryFn: () => dashboardService.LayAiInsights2(prompt),
    staleTime: 300000, // 5 minutes cache
  });
}

