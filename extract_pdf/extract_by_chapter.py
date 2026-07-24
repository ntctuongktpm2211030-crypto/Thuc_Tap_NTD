import fitz
import os
import re
import glob

# =========================
# TỰ ĐỘNG TÌM FILE PDF
# =========================
pdf_files = glob.glob("*.pdf")

if not pdf_files:
    raise Exception("Không tìm thấy file PDF trong thư mục.")

PDF_FILE = pdf_files[0]

print(f"Đang đọc: {PDF_FILE}")

# =========================
# TẠO THƯ MỤC OUTPUT
# =========================
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# MỞ PDF
# =========================
doc = fitz.open(PDF_FILE)

# =========================
# BIẾN LƯU
# =========================
current_title = "Mo_Dau"
content = []
file_count = 1


# =========================
# HÀM LƯU FILE
# =========================
def save_current():
    global file_count
    global content
    global current_title

    if len(content) < 5:
        return

    filename = f"{file_count:03d}_{current_title}.txt"

    filename = re.sub(r'[\\/:*?"<>|]', "_", filename)

    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(content))

    print(f"Đã lưu: {filename}")

    file_count += 1


# =========================
# DUYỆT TOÀN BỘ SÁCH
# =========================
for page_num in range(len(doc)):

    page = doc.load_page(page_num)

    blocks = page.get_text("dict")["blocks"]

    for block in blocks:

        if "lines" not in block:
            continue

        for line in block["lines"]:

            line_text = ""
            max_size = 0
            is_bold = False

            for span in line["spans"]:

                text = span["text"].strip()

                if not text:
                    continue

                line_text += text + " "

                size = round(span["size"], 1)

                if size > max_size:
                    max_size = size

                if "Bold" in span["font"]:
                    is_bold = True

            line_text = line_text.strip()

            if not line_text:
                continue

            # ==========================================
            # NHẬN DIỆN TIÊU ĐỀ
            # ==========================================

            # H1
            if max_size >= 18 and is_bold:

                save_current()

                current_title = line_text[:80]
                current_title = current_title.replace(" ", "_")

                content = []

                content.append("═" * 80)
                content.append(line_text.upper())
                content.append(f"Trang gốc: {page_num + 1}")
                content.append("═" * 80)
                content.append("")

            # H2
            elif max_size >= 15 and is_bold:

                content.append("")
                content.append("#" * 70)
                content.append(line_text.upper())
                content.append("#" * 70)
                content.append("")

            # H3
            elif max_size >= 13 and is_bold:

                content.append("")
                content.append("─" * 60)
                content.append(line_text)
                content.append("─" * 60)
                content.append("")

            # Nội dung thường
            else:

                # Bỏ số trang
                if re.fullmatch(r"\d+", line_text):
                    continue

                content.append(line_text)

# =========================
# LƯU CHƯƠNG CUỐI
# =========================
save_current()

doc.close()

print("\n========================================")
print("Hoàn thành!")
print(f"Đã tạo {file_count - 1} file trong thư mục '{OUTPUT_DIR}'")
print("========================================")