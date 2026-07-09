import json
import faiss
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

print("Loading model BAAI/bge-m3...")
model = SentenceTransformer("BAAI/bge-m3")
print("Model loaded successfully.")

vectors = []
metadata = []

print("Reading files from 'chunks' directory...")
json_files = list(Path("chunks").glob("*.json"))

if not json_files:
    print("Warning: No .json files found in 'chunks' directory. Did you run chunk.py first?")

for file in json_files:
    print(f"Processing: {file.name}")
    docs = json.loads(file.read_text(encoding="utf8"))

    for i, d in enumerate(docs):
        # Print progress for every 50 documents
        if i > 0 and i % 50 == 0:
            print(f"  - Embedded {i}/{len(docs)} documents")
            
        emb = model.encode(
            d["content"],
            normalize_embeddings=True
        )

        vectors.append(emb)
        metadata.append(d)
        
    print(f"  - Completed: Embedded all {len(docs)}/{len(docs)} documents")

if vectors:
    print(f"Total documents embedded: {len(vectors)}")
    print("Creating FAISS index...")
    vectors = np.array(vectors).astype("float32")

    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)

    print("Saving FAISS index to 'faiss_index/tourism.index'...")
    Path("faiss_index").mkdir(exist_ok=True)

    faiss.write_index(
        index,
        "faiss_index/tourism.index"
    )

    print("Saving metadata to 'faiss_index/metadata.json'...")
    with open(
        "faiss_index/metadata.json",
        "w",
        encoding="utf8"
    ) as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("Done! FAISS index created successfully.")
else:
    print("Error: No vectors generated. FAISS index not saved.")
