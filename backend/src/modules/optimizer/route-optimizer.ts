import { calculateHaversineDistance, Coordinate } from '../map/gis-helper';

export interface Waypoint extends Coordinate {
  id: string;
  name: string;
}

export interface OptimizedRoute {
  orderedWaypoints: Waypoint[];
  totalDistanceKm: number;
}

/**
 * Computes the complete distance matrix between all pairs of waypoints.
 */
function buildDistanceMatrix(waypoints: Waypoint[]): number[][] {
  const size = waypoints.length;
  const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const distance = calculateHaversineDistance(waypoints[i], waypoints[j]);
      matrix[i][j] = distance;
      matrix[j][i] = distance;
    }
  }

  return matrix;
}

/**
 * Solver Option 1: Exhaustive Permutation Search
 * Runs in O(N!) time. Suitable ONLY for very small waypoint sets (N <= 8)
 * but guarantees the absolute mathematical minimum distance.
 */
function solveTSPExhaustive(waypoints: Waypoint[], matrix: number[][]): OptimizedRoute {
  let bestRoute: number[] = [];
  let minDistance = Infinity;
  const size = waypoints.length;

  const permute = (arr: number[], m: number[] = []) => {
    if (arr.length === 0) {
      // Calculate cycle distance starting at index 0 and ending back or stopping at final destination
      let currentDist = 0;
      const fullPath = [0, ...m]; // Lock start node as first waypoint
      
      for (let i = 0; i < fullPath.length - 1; i++) {
        currentDist += matrix[fullPath[i]][fullPath[i + 1]];
      }

      if (currentDist < minDistance) {
        minDistance = currentDist;
        bestRoute = fullPath;
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  // Permute remaining nodes other than index 0
  const indices = Array.from({ length: size - 1 }, (_, i) => i + 1);
  permute(indices);

  return {
    orderedWaypoints: bestRoute.map(idx => waypoints[idx]),
    totalDistanceKm: minDistance,
  };
}

/**
 * Solver Option 2: Greedy Nearest Neighbor Algorithm
 * Runs in O(N^2) time. Fast approximation for larger datasets.
 */
function solveTSPGreedy(waypoints: Waypoint[], matrix: number[][]): OptimizedRoute {
  const size = waypoints.length;
  const visited = new Array(size).fill(false);
  const orderedIndices: number[] = [0];
  
  visited[0] = true;
  let totalDistance = 0;

  for (let step = 1; step < size; step++) {
    const current = orderedIndices[orderedIndices.length - 1];
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let candidate = 0; candidate < size; candidate++) {
      if (!visited[candidate] && matrix[current][candidate] < minDistance) {
        minDistance = matrix[current][candidate];
        nearestIdx = candidate;
      }
    }

    if (nearestIdx !== -1) {
      visited[nearestIdx] = true;
      orderedIndices.push(nearestIdx);
      totalDistance += minDistance;
    }
  }

  return {
    orderedWaypoints: orderedIndices.map(idx => waypoints[idx]),
    totalDistanceKm: totalDistance,
  };
}

/**
 * Main optimizer pipeline. Automatically determines the best algorithm based
 * on input size and solves for the optimal waypoint visit order.
 * 
 * @param waypoints List of travel checkpoints
 * @returns Optimized sequence and path distance metrics
 */
export function optimizeRoute(waypoints: Waypoint[]): OptimizedRoute {
  if (waypoints.length <= 1) {
    return { orderedWaypoints: waypoints, totalDistanceKm: 0 };
  }

  const matrix = buildDistanceMatrix(waypoints);

  // Threshold: If waypoints count <= 8, use Exhaustive search to guarantee global optimum
  if (waypoints.length <= 8) {
    return solveTSPExhaustive(waypoints, matrix);
  }

  // Otherwise, use greedy nearest-neighbor approximation
  return solveTSPGreedy(waypoints, matrix);
}

/**
 * Advanced TD-VRP Solver: Calls Python AI-Service (OR-Tools Constraint Programming)
 * with automatic fallback to local heuristic solver.
 */
export async function optimizeRouteWithORTools(
  waypoints: Waypoint[],
  options?: { startTimeMinutes?: number; maxDayMinutes?: number }
): Promise<OptimizedRoute & { solverUsed?: string }> {
  if (waypoints.length <= 1) {
    return { orderedWaypoints: waypoints, totalDistanceKm: 0, solverUsed: 'local_trivial' };
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  try {
    const formattedWaypoints = waypoints.map(w => ({
      id: w.id,
      name: w.name,
      latitude: w.latitude,
      longitude: w.longitude,
      visit_duration_min: (w as any).visitDurationMin || 60,
      open_time_min: (w as any).openTimeMin || 480,
      close_time_min: (w as any).closeTimeMin || 1200,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${aiServiceUrl}/api/v1/optimize-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        waypoints: formattedWaypoints,
        start_time_minutes: options?.startTimeMinutes || 480,
        max_day_minutes: options?.maxDayMinutes || 720,
      }),
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json() as any;
      if (result.status === 'success' && result.data?.ordered_waypoints) {
        return {
          orderedWaypoints: result.data.ordered_waypoints.map((item: any) => ({
            id: item.id,
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
          })),
          totalDistanceKm: result.data.total_distance_km || 0,
          solverUsed: result.data.solver || 'ortools_cp',
        };
      }
    }
  } catch (err: any) {
    console.warn('[RouteOptimizer Warning] AI-service request timed out (>3000ms) or failed, falling back to local Heuristic solver:', err.message);
  }


  // Fallback to local TypeScript solver
  const localRes = optimizeRoute(waypoints);
  return {
    ...localRes,
    solverUsed: 'local_ts_fallback',
  };
}

