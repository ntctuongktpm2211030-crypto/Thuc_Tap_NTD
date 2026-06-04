"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeRoute = optimizeRoute;
const gis_helper_1 = require("../map/gis-helper");
/**
 * Computes the complete distance matrix between all pairs of waypoints.
 */
function buildDistanceMatrix(waypoints) {
    const size = waypoints.length;
    const matrix = Array(size).fill(0).map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
            const distance = (0, gis_helper_1.calculateHaversineDistance)(waypoints[i], waypoints[j]);
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
function solveTSPExhaustive(waypoints, matrix) {
    let bestRoute = [];
    let minDistance = Infinity;
    const size = waypoints.length;
    const permute = (arr, m = []) => {
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
        }
        else {
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
function solveTSPGreedy(waypoints, matrix) {
    const size = waypoints.length;
    const visited = new Array(size).fill(false);
    const orderedIndices = [0];
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
function optimizeRoute(waypoints) {
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
