import os
import json
import glob
import urllib.parse
import re

def clean_query_title(title):
    # Loại bỏ nội dung trong ngoặc đơn. VD: "Núi Cô Tô (Phụng Hoàng Sơn)" -> "Núi Cô Tô"
    title = re.sub(r'\(.*?\)', '', title)
    # Loại bỏ các ký tự đặc biệt
    title = title.replace('"', '').replace("'", '').strip()
    return title

def generate_report():
    dest_dir = r"d:\Thuc_Tap_NDT\backend\src\config\destinations"
    json_files = glob.glob(os.path.join(dest_dir, "*.json"))
    
    output_md = []
    output_md.append("# DANH SÁCH KIỂM TRA ĐỊA ĐIỂM TRÊN GOOGLE MAPS\n")
    output_md.append("Tài liệu này chứa liên kết tìm kiếm nhanh trên Google Maps cho các địa điểm để bạn kiểm tra thủ công xem chúng có thật hay không.\n")
    
    total_unverified = 0
    
    for file_path in sorted(json_files):
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            continue
            
        unverified_items = []
        for item in data:
            title = item.get("title", "")
            province = item.get("province", "")
            lat = item.get("latitude")
            lng = item.get("longitude")
            
            # Tọa độ mặc định trùng lặp của Chợ Bến Thành
            is_placeholder = (lat == 10.7769 and lng == 106.7009) or (lat is None or lng is None)
            
            if is_placeholder:
                unverified_items.append(item)
                
        if unverified_items:
            output_md.append(f"## 📁 File: `{filename}` ({len(unverified_items)} địa điểm cần check)")
            output_md.append("| STT | Tên địa điểm | Tỉnh/Thành | Link kiểm tra nhanh trên Google Maps |")
            output_md.append("| --- | --- | --- | --- |")
            
            for idx, item in enumerate(unverified_items, 1):
                title = item.get("title", "")
                province = item.get("province", "")
                
                # Tạo query sạch để tìm kiếm
                clean_title = clean_query_title(title)
                query = f"{clean_title}, {province}, Vietnam"
                encoded_query = urllib.parse.quote(query)
                gmaps_link = f"https://www.google.com/maps/search/?api=1&query={encoded_query}"
                
                output_md.append(f"| {idx} | **{title}** | {province} | [👉 Click để check trên GMap]({gmaps_link}) |")
                total_unverified += 1
            output_md.append("\n")
            
    # Ghi ra file markdown
    report_path = r"d:\Thuc_Tap_NDT\backend\check_destinations.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output_md))
        
    print(f"✅ Đã tạo danh sách liên kết kiểm tra tại: {report_path}")
    print(f"Tổng số địa điểm chưa xác thực tọa độ thực tế: {total_unverified}")

if __name__ == "__main__":
    generate_report()
