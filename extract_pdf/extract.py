import fitz
import os

PDF_FILE = "book.pdf"

OUTPUT_FOLDER = "output"

os.makedirs(OUTPUT_FOLDER, exist_ok=True)

doc = fitz.open(PDF_FILE)

print(f"Tổng số trang: {len(doc)}")

all_text = ""

for i in range(len(doc)):

    page = doc.load_page(i)

    text = page.get_text("text")

    if not text.strip():
        continue

    # Lưu từng trang
    with open(
        os.path.join(OUTPUT_FOLDER, f"page_{i+1}.txt"),
        "w",
        encoding="utf-8"
    ) as f:
        f.write(text)

    # Gộp vào file tổng
    all_text += f"\n\n================ TRANG {i+1} ================\n\n"
    all_text += text

    print(f"Đã xử lý trang {i+1}/{len(doc)}")

doc.close()

# Lưu toàn bộ
with open("book.txt", "w", encoding="utf-8") as f:
    f.write(all_text)

print("\n===================================")
print("Hoàn thành!")
print("Đã tạo file book.txt")
print("Đã tạo thư mục output/")
print("===================================")