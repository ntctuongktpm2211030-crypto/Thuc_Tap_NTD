import os
from typing import List, Dict, Any, Optional

class KnowledgeGraphManager:
    """
    Manages Knowledge Graph connection and Cypher query execution for Cultural & Culinary GraphRAG.
    Schema Nodes: Destination, Location/POI, Dish, DiningSpot, CulturalElement, CraftVillage, Ingredient, StoryCitation.
    Schema Relationships: LOCATED_IN, ORIGINATED_FROM, CONTAINS, SERVES, BEST_PAIRED_WITH, ASSOCIATED_WITH, REFERENCED_BY.
    """

    def __init__(self, uri: Optional[str] = None, user: Optional[str] = None, password: Optional[str] = None):
        self.uri = uri or os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = user or os.getenv("NEO4J_USER", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD", "password")
        self.driver = None
        self._init_driver()


    def _init_driver(self):
        try:
            from neo4j import GraphDatabase
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            print("[KnowledgeGraphManager] Connected to Neo4j database.")
        except Exception as e:
            print(f"[KnowledgeGraphManager Note] Neo4j driver not initialized (using GraphRAG fallback memory graph): {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def query_cultural_culinary_subgraph(self, destination_name: str, dish_keyword: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Executes GraphRAG 2-hop traversal query matching Cultural elements, Dishes, DiningSpots and StoryCitations.
        """
        cypher_query = """
        MATCH (d:Destination) WHERE d.name CONTAINS $destination_name
        OPTIONAL MATCH (s:DiningSpot)-[:LOCATED_IN]->(d)
        OPTIONAL MATCH (s)-[rel:SERVES]->(dish:Dish)-[:ORIGINATED_FROM]->(d)
        OPTIONAL MATCH (dish)-[:REFERENCED_BY]->(cite:StoryCitation)
        OPTIONAL MATCH (cult:CulturalElement)-[:ASSOCIATED_WITH]->(d)
        RETURN 
            d.name AS destination,
            dish.name AS dish_name,
            s.name AS spot_name,
            s.open_hours AS open_hours,
            rel.price AS price,
            cult.name AS cultural_context,
            cite.title AS citation_title,
            cite.source_url AS citation_url
        LIMIT 20
        """

        if self.driver:
            try:
                with self.driver.session() as session:
                    result = session.run(cypher_query, destination_name=destination_name)
                    return [record.data() for record in result]
            except Exception as err:
                print(f"[KnowledgeGraphManager Error] Cypher execution failed: {err}")

        # In-memory mock Knowledge Graph Fallback for Vietnam Tourism
        return [
            {
                "destination": destination_name,
                "dish_name": "Bánh căn trứng cút xíu mại",
                "spot_name": "Bánh Căn Lệ",
                "open_hours": "06:00-11:00, 15:30-19:00",
                "price": 35000,
                "cultural_context": "Văn hóa ăn món nóng hổi trong tiết trời se lạnh sương mù",
                "citation_title": "Cẩm nang Ẩm thực Bản địa Lâm Đồng",
                "citation_url": "https://dulichdalat.vn/am-thuc-banh-can"
            },
            {
                "destination": destination_name,
                "dish_name": "Lẩu gà lá é",
                "spot_name": "Lẩu Gà Lá É Tao Ngộ",
                "open_hours": "10:00-22:00",
                "price": 200000,
                "cultural_context": "Văn hóa thưởng thức lẩu nóng giòn mặn ngọt vùng cao",
                "citation_title": "Văn hóa Ẩm thực Tây Nguyên",
                "citation_url": "https://dulichdalat.vn/lau-ga-la-e"
            }
        ]
