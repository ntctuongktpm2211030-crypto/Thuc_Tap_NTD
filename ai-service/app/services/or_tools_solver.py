import math
from typing import List, Dict, Any, Optional

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance in kilometers between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def build_travel_time_matrix(locations: List[Dict[str, Any]], speed_kmh: float = 30.0) -> List[List[int]]:
    """Build travel time matrix in minutes between all pairs of POIs."""
    n = len(locations)
    matrix = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                dist_km = haversine_distance(
                    locations[i]['latitude'], locations[i]['longitude'],
                    locations[j]['latitude'], locations[j]['longitude']
                )
                # travel time in minutes = (distance / speed) * 60
                travel_minutes = int(round((dist_km / speed_kmh) * 60))
                matrix[i][j] = travel_minutes
    return matrix

class ORToolsItinerarySolver:
    """
    Constraint Programming (CP) Solver using Google OR-Tools routing engine.
    Solves Time-Dependent Vehicle Routing Problem (TD-VRP) / Orienteering Problem with Time Windows (OPTW).
    """

    def __init__(self, waypoints: List[Dict[str, Any]], start_time_minutes: int = 480, max_day_minutes: int = 720):
        """
        waypoints: List of dicts with keys:
          - id, name, latitude, longitude
          - open_time_min (e.g., 480 = 08:00)
          - close_time_min (e.g., 1020 = 17:00)
          - visit_duration_min (e.g., 90)
          - is_meal (bool)
        """
        self.waypoints = waypoints
        self.start_time_minutes = start_time_minutes
        self.max_day_minutes = max_day_minutes
        self.matrix = build_travel_time_matrix(waypoints)

    def solve() -> Dict[str, Any]:
        """Attempt to solve using OR-Tools if available, otherwise heuristic fallback."""
        try:
            from ortools.constraint_solver import routing_enums_pb2
            from ortools.constraint_solver import pywrapcp

            n = len(self.waypoints)
            if n <= 1:
                return {"ordered_waypoints": self.waypoints, "total_distance_km": 0.0, "total_duration_min": 0}

            manager = pywrapcp.RoutingIndexManager(n, 1, 0)
            routing = pywrapcp.RoutingModel(manager)

            def transit_callback(from_index, to_index):
                from_node = manager.IndexToNode(from_index)
                to_node = manager.IndexToNode(to_index)
                service_time = self.waypoints[from_node].get('visit_duration_min', 60)
                travel_time = self.matrix[from_node][to_node]
                return service_time + travel_time

            transit_callback_index = routing.RegisterTransitCallback(transit_callback)
            routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

            # Time Window dimension
            time_dim_name = "Time"
            routing.AddDimension(
                transit_callback_index,
                180,  # allow waiting time up to 3 hours
                self.max_day_minutes,  # max time per day
                False,
                time_dim_name
            )
            time_dimension = routing.GetDimensionOrDie(time_dim_name)

            # Add Time Window constraints per location
            for node_idx, wp in enumerate(self.waypoints):
                index = manager.NodeToIndex(node_idx)
                open_time = wp.get('open_time_min', 480)
                close_time = wp.get('close_time_min', 1200)
                time_dimension.CumulVar(index).SetRange(open_time, close_time)

            search_parameters = pywrapcp.DefaultRoutingSearchParameters()
            search_parameters.first_solution_strategy = (
                routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
            )
            search_parameters.time_limit.seconds = 2

            solution = routing.SolveWithParameters(search_parameters)

            if solution:
                ordered = []
                index = routing.Start(0)
                total_dist = 0.0
                total_dur = 0
                prev_node = None

                while not routing.IsEnd(index):
                    node = manager.IndexToNode(index)
                    ordered.append(self.waypoints[node])
                    if prev_node is not None:
                        dist = haversine_distance(
                            self.waypoints[prev_node]['latitude'], self.waypoints[prev_node]['longitude'],
                            self.waypoints[node]['latitude'], self.waypoints[node]['longitude']
                        )
                        total_dist += dist
                        total_dur += self.matrix[prev_node][node] + self.waypoints[prev_node].get('visit_duration_min', 60)
                    prev_node = node
                    index = solution.Value(routing.NextVar(index))

                return {
                    "ordered_waypoints": ordered,
                    "total_distance_km": round(total_dist, 2),
                    "total_duration_min": total_dur,
                    "solver": "ortools_cp"
                }
        except Exception as e:
            print(f"[ORToolsSolver Warning] Falling back to heuristic greedy solver: {e}")

        # Fallback Greedy Heuristic Solver
        return self._solve_greedy_fallback()

    def _solve_greedy_fallback() -> Dict[str, Any]:
        n = len(self.waypoints)
        visited = [False] * n
        ordered = [self.waypoints[0]]
        visited[0] = True
        total_dist = 0.0
        total_dur = 0

        for _ in range(1, n):
            current_idx = self.waypoints.index(ordered[-1])
            best_idx = -1
            best_dist = float('inf')

            for candidate_idx in range(n):
                if not visited[candidate_idx]:
                    d = haversine_distance(
                        self.waypoints[current_idx]['latitude'], self.waypoints[current_idx]['longitude'],
                        self.waypoints[candidate_idx]['latitude'], self.waypoints[candidate_idx]['longitude']
                    )
                    if d < best_dist:
                        best_dist = d
                        best_idx = candidate_idx

            if best_idx != -1:
                visited[best_idx] = True
                ordered.append(self.waypoints[best_idx])
                total_dist += best_dist
                total_dur += self.matrix[current_idx][best_idx] + self.waypoints[current_idx].get('visit_duration_min', 60)

        return {
            "ordered_waypoints": ordered,
            "total_distance_km": round(total_dist, 2),
            "total_duration_min": total_dur,
            "solver": "greedy_fallback"
        }
