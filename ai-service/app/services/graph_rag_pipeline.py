from typing import List, Dict, Any, Optional
from app.services.graph_db import KnowledgeGraphManager

class GraphRAGPipeline:
    """
    Sub-graph Extraction -> Context Enrichment -> Structured Prompt Construction -> Grounded Generation
    """

    def __init__(self, kg_manager: Optional[KnowledgeGraphManager] = None):
        self.kg_manager = kg_manager or KnowledgeGraphManager()

    def extract_anchor_entities(self, query: str) -> Dict[str, str]:
        """Simple Named Entity Recognition (NER) for Destination and Cuisine keywords."""
        query_lower = query.lower()
        destination = "Đà Lạt"
        if "hà nội" in query_lower:
            destination = "Hà Nội"
        elif "sài gòn" in query_lower or "tp.hcm" in query_lower or "hồ chí minh" in query_lower:
            destination = "TP. Hồ Chí Minh"
        elif "huế" in query_lower:
            destination = "Huế"
        elif "đà nẵng" in query_lower:
            destination = "Đà Nẵng"
        elif "nha trang" in query_lower:
            destination = "Nha Trang"

        return {
            "destination": destination,
            "query": query
        }

    def run_pipeline(self, user_query: str) -> Dict[str, Any]:
        """Runs 4-stage GraphRAG Pipeline."""
        # 1. NER Anchor Extraction
        entities = self.extract_anchor_entities(user_query)
        dest_name = entities["destination"]

        # 2. Subgraph Extraction & 2-hop Context Enrichment
        subgraph_facts = self.kg_manager.query_cultural_culinary_subgraph(destination_name=dest_name)

        # 3. Structured Prompt Construction
        context_str = f"=== GRAPH KNOWLEDGE CONTEXT ({dest_name}) ===\n"
        citations = []
        for idx, fact in enumerate(subgraph_facts, 1):
            context_str += f"[{idx}] Món ăn: {fact.get('dish_name')} | Quán: {fact.get('spot_name')} | Giờ mở: {fact.get('open_hours')} | Giá: {fact.get('price')} VNĐ\n"
            context_str += f"    Ngữ cảnh văn hóa: {fact.get('cultural_context')}\n"
            if fact.get('citation_url'):
                citations.append({
                    "title": fact.get('citation_title', 'Tư liệu kiểm chứng'),
                    "url": fact.get('citation_url')
                })

        return {
            "anchor_entities": entities,
            "subgraph_facts": subgraph_facts,
            "structured_context": context_str,
            "citations": citations
        }
