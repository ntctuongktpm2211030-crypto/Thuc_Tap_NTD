import math
from typing import List, Dict, Any

class ContextAwareRecSysEngine:
    """
    Context-Aware Recommendation Engine using Two-Tower / Deep scoring principles.
    Considers User-Context (GPS, real-time weather, travel speed, budget) and Item Features (indoor/outdoor, category, cost).
    """

    def __init__(self, rain_indoor_boost: float = 2.5, rain_outdoor_penalty: float = 0.3):
        self.rain_indoor_boost = rain_indoor_boost
        self.rain_outdoor_penalty = rain_outdoor_penalty

    def calculate_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def score_and_rank_items(
        self,
        user_context: Dict[str, Any],
        items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        user_context: {
           "user_lat": float,
           "user_lon": float,
           "is_raining": bool,
           "weather_condition": str, # "rain", "sunny", "cloudy"
           "remaining_budget": float,
           "preferred_tags": List[str]
        }
        """
        user_lat = user_context.get("user_lat", 11.9404)
        user_lon = user_context.get("user_lon", 108.4380)
        is_raining = user_context.get("is_raining", False) or "mưa" in str(user_context.get("weather_condition", "")).lower()
        remaining_budget = user_context.get("remaining_budget", 5000000)
        preferred_tags = set(user_context.get("preferred_tags", []))

        scored_items = []
        for item in items:
            base_score = float(item.get("priorityScore", item.get("rating", 4.0)))
            
            # 1. Spatial Proximity Scoring (Exponential decay by distance)
            item_lat = item.get("latitude", user_lat)
            item_lon = item.get("longitude", user_lon)
            dist_km = self.calculate_distance_km(user_lat, user_lon, item_lat, item_lon)
            proximity_score = math.exp(-dist_km / 10.0) # decay factor

            # 2. Weather Adaptation (Dynamic Re-weighting)
            category = str(item.get("category", "")).lower()
            is_indoor = item.get("is_indoor", True if category in ["museum", "cafe", "restaurant", "bảo tàng", "quán ăn", "khách sạn"] else False)
            
            weather_weight = 1.0
            if is_raining:
                if is_indoor:
                    weather_weight = self.rain_indoor_boost
                else:
                    weather_weight = self.rain_outdoor_penalty

            # 3. Budget Fit Factor
            ticket = float(item.get("entryTicket", item.get("cost", 0)))
            budget_fit = 1.0 if ticket <= remaining_budget else 0.2

            # 4. Tag Match Boost
            item_tags = set(item.get("travelTags", []))
            tag_overlap = len(preferred_tags.intersection(item_tags))
            tag_boost = 1.0 + (tag_overlap * 0.2)

            # Final Score Calculation (User-Context Tower x Item Tower)
            final_score = base_score * proximity_score * weather_weight * budget_fit * tag_boost

            scored_item = dict(item)
            scored_item["rec_score"] = round(final_score, 3)
            scored_item["distance_km"] = round(dist_km, 2)
            scored_item["is_indoor"] = is_indoor
            scored_item["weather_adapted"] = "indoor_boosted" if (is_raining and is_indoor) else ("outdoor_penalized" if (is_raining and not is_indoor) else "normal")
            scored_items.append(scored_item)

        # Sort descending by recommendation score
        scored_items.sort(key=lambda x: x["rec_score"], reverse=True)
        return scored_items
