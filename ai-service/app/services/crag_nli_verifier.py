from typing import List, Dict, Any, Optional
import time

class CorrectiveRAGVerifier:
    """
    Self-RAG / Corrective RAG (CRAG) with Natural Language Inference (NLI) principles.
    Supports lightweight NLI Cross-Encoder model (cross-encoder/nli-deberta-v3-small)
    with ultra-fast <50ms heuristic fallback for hallucination verification.
    """

    def __init__(self, model_name: str = "cross-encoder/nli-deberta-v3-small", confidence_threshold: float = 0.6):
        self.confidence_threshold = confidence_threshold
        self.model_name = model_name
        self.nli_model = None
        self._init_nli_model()

    def _init_nli_model(self):
        try:
            from sentence_transformers import CrossEncoder
            self.nli_model = CrossEncoder(self.model_name)
            print(f"[CorrectiveRAGVerifier] Loaded NLI Cross-Encoder model: {self.model_name}")
        except Exception as e:
            print(f"[CorrectiveRAGVerifier Note] NLI model not pre-loaded (using ultra-fast <50ms lexical NLI engine): {e}")

    def evaluate_retrieval_relevance(self, query: str, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Evaluates whether retrieved RAG documents are sufficient/relevant (Corrective RAG)."""
        if not documents:
            return {"status": "INSUFFICIENT", "action": "WEB_SEARCH_FALLBACK", "filtered_docs": []}

        relevant_docs = []
        query_words = set(query.lower().split())
        for doc in documents:
            content = str(doc.get("content", doc.get("body", ""))).lower()
            overlap = sum(1 for word in query_words if len(word) > 3 and word in content)
            if overlap >= 1:
                relevant_docs.append(doc)

        if not relevant_docs:
            return {"status": "AMBIGUOUS", "action": "EXPAND_KGRAPH_NODES", "filtered_docs": documents}

        return {"status": "CORRECT", "action": "GENERATE_WITH_GROUNDING", "filtered_docs": relevant_docs}

    def verify_nli_grounding(self, generated_text: str, retrieved_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Performs NLI check (Entailment / Neutral / Contradiction) on generated sentences."""
        start_time = time.time()
        sentences = [s.strip() for s in generated_text.split(".") if len(s.strip()) > 5]
        verified_sentences = []
        hallucinations_detected = 0

        combined_doc_text = " ".join([str(d.get("content", d.get("body", ""))) for d in retrieved_docs])
        combined_doc_lower = combined_doc_text.lower()

        # Step 1: Check with Cross-Encoder NLI if available
        if self.nli_model and sentences:
            try:
                pairs = [(combined_doc_text[:512], sent) for sent in sentences]
                scores = self.nli_model.predict(pairs)
                # Labels: 0: contradiction, 1: entailment, 2: neutral
                for sent, score in zip(sentences, scores):
                    status = "ENTAILMENT" if score[1] > 0.5 else "NEUTRAL_OR_UNGROUNDED"
                    if status != "ENTAILMENT":
                        hallucinations_detected += 1
                    verified_sentences.append({
                        "sentence": sent,
                        "nli_status": status,
                        "confidence": round(float(max(score)), 2),
                        "model": "cross-encoder-nli"
                    })

                proc_time_ms = round((time.time() - start_time) * 1000, 2)
                total = len(sentences) or 1
                groundedness_score = round(((total - hallucinations_detected) / total) * 100, 1)
                return {
                    "groundedness_score": groundedness_score,
                    "hallucinations_count": hallucinations_detected,
                    "verified_sentences": verified_sentences,
                    "is_trusted": groundedness_score >= 60.0,
                    "latency_ms": proc_time_ms
                }
            except Exception as err:
                print(f"[CorrectiveRAGVerifier Error] CrossEncoder inference failed: {err}")

        # Step 2: Ultra-fast Lexical NLI Fallback (<50ms processing latency)
        for sentence in sentences:
            sentence_words = [w.lower() for w in sentence.split() if len(w) > 3]
            if not sentence_words:
                continue

            matches = sum(1 for w in sentence_words if w in combined_doc_lower)
            match_ratio = matches / len(sentence_words)

            if match_ratio >= 0.4:
                verified_sentences.append({
                    "sentence": sentence,
                    "nli_status": "ENTAILMENT",
                    "confidence": round(match_ratio, 2),
                    "model": "fast-lexical-nli"
                })
            else:
                hallucinations_detected += 1
                verified_sentences.append({
                    "sentence": sentence,
                    "nli_status": "NEUTRAL_OR_UNGROUNDED",
                    "confidence": round(match_ratio, 2),
                    "model": "fast-lexical-nli"
                })

        proc_time_ms = round((time.time() - start_time) * 1000, 2)
        total = len(sentences) or 1
        groundedness_score = round(((total - hallucinations_detected) / total) * 100, 1)

        return {
            "groundedness_score": groundedness_score,
            "hallucinations_count": hallucinations_detected,
            "verified_sentences": verified_sentences,
            "is_trusted": groundedness_score >= 60.0,
            "latency_ms": proc_time_ms
        }

