import os
import json
import re
from pathlib import Path

# ==========================
# Cấu hình
# ==========================

INPUT_FOLDER = r"D:\extract_pdf"
OUTPUT_FOLDER = r"D:\extract_pdf\output_json"

CHUNK_SIZE = 1200        # số ký tự/chunk
OVERLAP = 200            # overlap

os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# ==========================
# Làm sạch text
# ==========================

def clean_text(text):

    text = text.replace("\u00a0", " ")

    text = re.sub(r"[ \t]+", " ", text)

    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ==========================
# Chia chunk
# ==========================

def split_chunks(text, size=1200, overlap=200):

    chunks = []

    start = 0

    while start < len(text):

        end = start + size

        chunk = text[start:end]

        # cắt tại xuống dòng gần nhất
        if end < len(text):

            p = chunk.rfind("\n")

            if p > 300:
                chunk = chunk[:p]
                end = start + p

        chunks.append(chunk.strip())

        start = end - overlap

    return chunks


# ==========================
# Xử lý từng file
# ==========================

txt_files = list(Path(INPUT_FOLDER).glob("*.txt"))

print(f"Tìm thấy {len(txt_files)} file.\n")

for txt_file in txt_files:

    with open(txt_file, "r", encoding="utf-8") as f:

        text = f.read()

    text = clean_text(text)

    chunks = split_chunks(text, CHUNK_SIZE, OVERLAP)

    data = []

    title = txt_file.stem

    for i, chunk in enumerate(chunks, start=1):

        data.append({

            "id": f"{title}_{i:04}",

            "title": title,

            "chunk_index": i,

            "source_file": txt_file.name,

            "content": chunk,

            "char_count": len(chunk)

        })

    output_file = os.path.join(
        OUTPUT_FOLDER,
        title + ".json"
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2
        )

    print(f"{txt_file.name} -> {len(chunks)} chunks")

print("\nHoàn thành!")