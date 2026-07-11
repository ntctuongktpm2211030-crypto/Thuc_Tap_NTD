import json
import faiss
from sentence_transformers import SentenceTransformer

print("Loading model BAAI/bge-m3...")
model = SentenceTransformer("BAAI/bge-m3")

print("Reading FAISS index...")
index = faiss.read_index("faiss_index/tourism.index")

print("Reading metadata...")
metadata = json.load(
    open("faiss_index/metadata.json", encoding="utf8")
)

query = "núi cấm ở đâu"
print(f"\n🔍 Query: '{query}'")

vector = model.encode(
    query,
    normalize_embeddings=True
)

D, I = index.search(
    vector.reshape(1, -1),
    5
)

print("\n--- Search Results ---")
for i, idx in enumerate(I[0]):
    print(f"\n[{i+1}] Title: {metadata[idx]['title']} (Score: {D[0][i]:.4f})")
    print(f"Content: {metadata[idx]['content'][:500]}...")
