import os
import json
from pathlib import Path

DATA_FOLDER = Path("data")
OUTPUT_FOLDER = Path("chunks")

OUTPUT_FOLDER.mkdir(exist_ok=True)

def chunk_vietnam(file_path):
    text = file_path.read_text(encoding="utf8")
    lines = text.splitlines()
    
    chunks = []
    current_title = "VIỆT NAM - Giới thiệu"
    current_content = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # Check for section separator
        if line.startswith("######################################################################"):
            # Save the previous chunk if it has content
            if current_content:
                content_text = "\n".join(current_content).strip()
                if content_text:
                    chunks.append({
                        "id": f"vietnam_{len(chunks)}",
                        "title": current_title,
                        "content": content_text,
                        "category": "culture"
                    })
            
            # Read title
            i += 1
            if i < len(lines):
                current_title = lines[i].strip()
            i += 1 # skip closing ### line
            current_content = []
        else:
            current_content.append(lines[i])
        i += 1
        
    # Save the last chunk
    if current_content:
        content_text = "\n".join(current_content).strip()
        if content_text:
            chunks.append({
                "id": f"vietnam_{len(chunks)}",
                "title": current_title,
                "content": content_text,
                "category": "culture"
            })
            
    return chunks

def chunk_cities(file_path):
    text = file_path.read_text(encoding="utf8")
    lines = text.splitlines()
    
    chunks = []
    current_province = None
    current_section = None
    current_item_title = None
    current_item_content = []
    
    def save_current_item():
        nonlocal current_item_title, current_item_content
        if current_item_title and current_item_content:
            content_text = "\n".join(current_item_content).strip()
            if content_text:
                full_title = f"{current_province} - {current_section} - {current_item_title}" if current_section else f"{current_province} - {current_item_title}"
                category = "destination"
                if current_section:
                    sec_upper = current_section.upper()
                    if "THẮNG CẢNH" in sec_upper:
                        category = "destination"
                    elif "DI TÍCH" in sec_upper:
                        category = "culture"
                    elif "LỄ HỘI" in sec_upper:
                        category = "festival"
                    elif "ẨM THỰC" in sec_upper:
                        category = "food"
                chunks.append({
                    "id": f"cities_{len(chunks)}",
                    "title": full_title,
                    "content": content_text,
                    "category": category
                })
        current_item_title = None
        current_item_content = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # 1. Check for Province Header
        if line.startswith("######################################################################"):
            # Check if the next line is the province name and not another separator
            if i + 1 < len(lines) and not lines[i+1].strip().startswith("######################################################################"):
                save_current_item()
                current_province = lines[i+1].strip()
                current_section = None
                
                # Skip the entire header block including closing separator
                i += 2
                while i < len(lines) and lines[i].strip().startswith("######################################################################"):
                    i += 1
                
                # Check for province overview
                overview_lines = []
                while i < len(lines):
                    next_line = lines[i].strip()
                    if next_line.startswith("######################################################################") or next_line.startswith("────────────────────────────────────────────────────────────"):
                        break
                    overview_lines.append(lines[i])
                    i += 1
                
                overview_text = "\n".join(overview_lines).strip()
                if overview_text:
                    chunks.append({
                        "id": f"cities_{len(chunks)}",
                        "title": f"{current_province} - Tổng quan",
                        "content": overview_text,
                        "category": "destination"
                    })
            else:
                i += 1
            continue
            
        # 2. Check for Section Header
        if line.startswith("────────────────────────────────────────────────────────────"):
            if i + 1 < len(lines) and not lines[i+1].strip().startswith("────────────────────────────────────────────────────────────"):
                save_current_item()
                current_section = lines[i+1].strip()
                
                # Skip the entire section header block including closing separator
                i += 2
                while i < len(lines) and lines[i].strip().startswith("────────────────────────────────────────────────────────────"):
                    i += 1
            else:
                i += 1
            continue
            
        # 3. Handle Item Title vs Content lines
        if current_province and current_section:
            if line:
                # Heuristic for title:
                # - length of line < 45
                # - does not end with typical sentence punctuation
                # - does not start with bullet characters
                # - starts with an uppercase letter or digit
                # - the previous line ended with terminal punctuation (or empty/header)
                is_punc = line[-1] in ['.', '?', '!', ',', ';', ':', '…'] if len(line) > 0 else False
                is_bullet = line.startswith(('_', '-', '•', '*', '♦'))
                starts_w_upper = line[0].isupper() or line[0].isdigit() if len(line) > 0 else False
                
                prev_line = lines[i-1].strip() if i > 0 else ""
                prev_ended_w_terminal = (
                    not prev_line or 
                    prev_line.startswith("──") or 
                    prev_line.startswith("##") or
                    prev_line[-1] in ['.', '?', '!', '…']
                )
                
                if len(line) < 45 and not is_punc and not is_bullet and prev_ended_w_terminal and starts_w_upper:
                    save_current_item()
                    current_item_title = line
                else:
                    if current_item_title:
                        current_item_content.append(lines[i])
                    else:
                        current_item_title = "Giới thiệu"
                        current_item_content.append(lines[i])
            else:
                if current_item_title:
                    current_item_content.append(lines[i])
        i += 1
        
    save_current_item()
    return chunks

def main():
    print("🚀 Bắt đầu quá trình Semantic Chunking theo tiêu đề...")
    
    # 1. Xử lý file 014_VIỆT_NAM.txt
    vn_file = DATA_FOLDER / "014_VIỆT_NAM.txt"
    if vn_file.exists():
        print(f"📄 Đang xử lý: {vn_file.name}")
        vn_chunks = chunk_vietnam(vn_file)
        out_path = OUTPUT_FOLDER / "014_VIỆT_NAM.json"
        out_path.write_text(json.dumps(vn_chunks, ensure_ascii=False, indent=2), encoding="utf8")
        print(f"✅ Đã tạo thành công {len(vn_chunks)} chunks lưu vào {out_path.name}")
    else:
        print(f"❌ Không tìm thấy: {vn_file}")

    # 2. Xử lý file 017_-_THÀNH_PHỐ.txt
    cities_file = DATA_FOLDER / "017_-_THÀNH_PHỐ.txt"
    if cities_file.exists():
        print(f"📄 Đang xử lý: {cities_file.name}")
        cities_chunks = chunk_cities(cities_file)
        out_path = OUTPUT_FOLDER / "017_-_THÀNH_PHỐ.json"
        out_path.write_text(json.dumps(cities_chunks, ensure_ascii=False, indent=2), encoding="utf8")
        print(f"✅ Đã tạo thành công {len(cities_chunks)} chunks lưu vào {out_path.name}")
    else:
        print(f"❌ Không tìm thấy: {cities_file}")

if __name__ == "__main__":
    main()
