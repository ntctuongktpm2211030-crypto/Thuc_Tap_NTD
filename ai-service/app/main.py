import subprocess
import sys

try:
    import vietnamadminunits
except ImportError:
    vietnamadminunits = None

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import os
import unicodedata
import re

app = FastAPI(
    title="SmartTravel AI Service",
    description="Dedicated runtime AI inference service.",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def remove_accents(input_str: str) -> str:
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    return only_ascii.replace('đ', 'd').replace('Đ', 'D')

@app.get("/clean-camau-json")
def clean_camau_json():
    try:
        file_path = 'd:/Thuc_Tap_NDT/knowledge-builder/import-data-camau.json'
        if not os.path.exists(file_path):
            return {"status": "error", "message": "File not found"}
        
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        keywords = [
            'phu quoc', 'hon kho', 'co to', 'nui cam', 'nui sam', 'nui may',
            'cap treo', 'thac', 'deo', 'lan bien', 'truong sa', 'hoang sa', 'ngoc diem',
            'ngu hanh', 'tra su', 'tam bien'
        ]
        
        clean_data = []
        deleted_records = []
        
        for item in data:
            title_clean = remove_accents(item.get('title', '').lower())
            content_clean = remove_accents(item.get('content', '').lower())
            
            # Check keywords
            has_bad_keyword = False
            for kw in keywords:
                if kw == 'hon kho':
                    if 'hon kho' in title_clean and 'hon khoai' not in title_clean:
                        has_bad_keyword = True
                        deleted_records.append({"title": item.get('title'), "reason": f"Chứa từ khóa: {kw}"})
                        break
                    if 'hon kho' in content_clean and 'hon khoai' not in content_clean:
                        has_bad_keyword = True
                        deleted_records.append({"title": item.get('title'), "reason": f"Chứa từ khóa: {kw}"})
                        break
                else:
                    if kw in title_clean or kw in content_clean:
                        has_bad_keyword = True
                        deleted_records.append({"title": item.get('title'), "reason": f"Chứa từ khóa: {kw}"})
                        break
                    
            if has_bad_keyword:
                continue
                
            # Check "nui"
            if 'nui' in title_clean or re.search(r'\bnui\b', content_clean):
                is_allowed = False
                for allowed in ['an giang', 'hon khoai', 'hon da bac']:
                    if allowed in title_clean or allowed in content_clean:
                        is_allowed = True
                        break
                if not is_allowed:
                    deleted_records.append({"title": item.get('title'), "reason": "Mô tả núi đồi giả tưởng ở Cà Mau"})
                    continue
            
            clean_data.append(item)
            
        # Thêm 6 bản ghi Đất Mũi chuẩn xác thủ công
        authentic_records = [
            {
              "title": "Chiến dịch CM12 tại Hòn Đá Bạc",
              "content": "Chiến dịch CM12 (diễn ra từ năm 1981 đến 1984) tại Hòn Đá Bạc (huyện Trần Văn Thời, tỉnh Cà Mau) là một trong những chiến công hiển hách, oanh liệt nhất của Lực lượng An ninh nhân dân Việt Nam. Chiến dịch đã đập tan âm mưu xâm nhập, bạo loạn lật đổ chính quyền của tổ chức phản động do Lê Quốc Túy và Mai Văn Hạnh cầm đầu. Hòn Đá Bạc ngày nay là di tích lịch sử quốc gia, lưu giữ tượng đài bảo vệ Tổ quốc và nhà trưng bày chiến thắng CM12, thu hút đông đảo du khách đến tìm hiểu lịch sử hào hùng.",
              "category": "history"
            },
            {
              "title": "Khu du lịch sinh thái Hòn Đá Bạc",
              "content": "Khu du lịch sinh thái Hòn Đá Bạc nằm ở xã Khánh Bình Tây, huyện Trần Văn Thời, tỉnh Cà Mau, cách thành phố Cà Mau khoảng 50 km. Đây là cụm đảo nhỏ gồm Hòn Ông Ngộ, Hòn Đá Lẻ và Hòn Đá Bạc với tuổi đời hơn 180 triệu năm. Nơi đây nổi tiếng với những khối đá granit xếp chồng lên nhau tạo nên những hình thù kỳ thú như Sân Tiên, Giếng Tiên, Bàn Tay Tiên. Du khách đến đây có thể ngắm hoàng hôn biển Tây tuyệt đẹp, thưởng thức các loại hải sản đặc sản tươi ngon như hàu đá, mực, tôm và tham quan đền thờ Cá Ông cầu bình an.",
              "category": "destination"
            },
            {
              "title": "Đảo Hòn Khoai",
              "content": "Đảo Hòn Khoai là một cụm đảo đẹp nằm ở phía Đông Nam mũi Cà Mau, thuộc xã Đất Mũi, huyện Ngọc Hiển. Đây là hòn đảo lớn nhất và cao nhất của tỉnh Cà Mau, nổi tiếng với thảm rừng nguyên sinh đa dạng và phong phú. Đảo Hòn Khoai gắn liền với sự kiện khởi nghĩa Hòn Khoai năm 1940 do thầy giáo Phan Ngọc Hiển lãnh đạo. Trên đỉnh đảo có ngọn hải đăng hơn 100 năm tuổi do Pháp xây dựng, vẫn hoạt động bền bỉ dẫn đường cho tàu thuyền qua lại. Do là đảo quân sự tiền tiêu, du khách muốn tham quan cần liên hệ xin phép đồn biên phòng Hòn Khoai.",
              "category": "destination"
            },
            {
              "title": "Sân chim Ngọc Hiển",
              "content": "Sân chim Ngọc Hiển nằm ở huyện Ngọc Hiển, tỉnh Cà Mau, là một trong những sân chim tự nhiên lớn nhất Việt Nam với diện tích hơn 130 ha. Sân chim được bao bọc bởi hệ thống sông ngòi chằng chịt và rừng ngập mặn hoang sơ. Đây là nơi trú ngụ của hàng triệu cá thể chim thuộc nhiều loài khác nhau như cò, diệc, vạc, sen, cúm núm và các loài chim di cư quý hiếm. Sân chim Ngọc Hiển là điểm đến sinh thái lý tưởng cho những ai yêu thiên nhiên hoang dã, muốn tận hưởng bầu không khí trong lành và ngắm nhìn cảnh tượng kỳ thú từng đàn chim bay về tổ lúc hoàng hôn.",
              "category": "destination"
            },
            {
              "title": "Cột cờ Hà Nội tại Mũi Cà Mau",
              "content": "Cột cờ Hà Nội tại Mũi Cà Mau tọa lạc trong Khu du lịch Quốc gia Mũi Cà Mau, xã Đất Mũi, huyện Ngọc Hiển. Đây là công trình văn hóa có ý nghĩa lịch sử sâu sắc, do Đảng bộ và nhân dân Thủ đô Hà Nội tặng tỉnh Cà Mau, mô phỏng theo kiến trúc Cột cờ Hà Nội cổ kính. Công trình khẳng định chủ quyền lãnh thổ quốc gia và tinh thần đoàn kết gắn bó Bắc - Nam một nhà. Đứng trên đỉnh cột cờ, du khách có thể phóng tầm mắt ngắm toàn cảnh rừng đước ngập mặn bạt ngàn, bãi bồi mũi Cà Mau bao la và vùng biển Đông, biển Tây rộng lớn.",
              "category": "destination"
            },
            {
              "title": "Vườn quốc gia Mũi Cà Mau",
              "content": "Vườn quốc gia Mũi Cà Mau nằm trên địa bàn huyện Ngọc Hiển và huyện Năm Căn, tỉnh Cà Mau. Đây là khu bảo tồn thiên nhiên được UNESCO công nhận là Khu dự trữ sinh quyển thế giới và là vùng đất ngập nước có tầm quan trọng quốc tế (Ramsar). Vườn có hệ sinh thái rừng ngập mặn phong phú với cây đước, cây mắm chiếm ưu thế, là nơi sinh sống của nhiều loài động vật hoang dã, lưỡng cư, bò sát và thủy hải sản. Đến đây, du khách có thể trải nghiệm tuyến đi xuyên rừng ngập mặn bằng xuồng vỏ lãi, chụp ảnh lưu niệm tại mốc tọa độ quốc gia GPS 0001 và ngắm bãi bồi ven biển đang lấn dần ra biển Đông.",
              "category": "destination"
            }
        ]
        
        # Tránh trùng lặp tiêu đề
        existing_titles = {remove_accents(x['title'].lower().strip()) for x in clean_data}
        for rec in authentic_records:
            rec_title_clean = remove_accents(rec['title'].lower().strip())
            if rec_title_clean not in existing_titles:
                clean_data.append(rec)
                existing_titles.add(rec_title_clean)

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(clean_data, f, ensure_ascii=False, indent=2)
            
        return {
            "status": "success",
            "original_count": len(data),
            "clean_count": len(clean_data),
            "deleted_count": len(data) - len(clean_data),
            "deleted_details": deleted_records
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

import subprocess

@app.get("/restore-git")
def restore_git():
    try:
        res = subprocess.run(
            ["git", "checkout", "import-data-camau.json"],
            cwd="d:/Thuc_Tap_NDT/knowledge-builder",
            capture_output=True,
            text=True
        )
        return {
            "status": "success",
            "stdout": res.stdout,
            "stderr": res.stderr,
            "returncode": res.returncode
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/find-backup")
def find_backup():
    try:
        found_files = []
        for root, dirs, files in os.walk('d:/Thuc_Tap_NDT'):
            # Skip node_modules and .git
            if 'node_modules' in root or '.git' in root or 'venv' in root:
                continue
            for file in files:
                if 'camau' in file.lower() and file.endswith('.json'):
                    full_path = os.path.join(root, file)
                    found_files.append({
                        "path": full_path,
                        "size": os.path.getsize(full_path),
                        "mtime": os.path.getmtime(full_path)
                    })
        return {
            "status": "success",
            "found_files": found_files
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/git-status")
def git_status():
    try:
        res = subprocess.run(
            ["git", "status"],
            cwd="d:/Thuc_Tap_NDT/knowledge-builder",
            capture_output=True,
            text=True
        )
        return {
            "status": "success",
            "stdout": res.stdout,
            "stderr": res.stderr
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/git-diff")
def git_diff():
    try:
        res = subprocess.run(
            ["git", "diff", "import-data-camau.json"],
            cwd="d:/Thuc_Tap_NDT/knowledge-builder",
            capture_output=True,
            text=True
        )
        return {
            "status": "success",
            "stdout": res.stdout,
            "stderr": res.stderr
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

from pydantic import BaseModel
from typing import Optional

class AddressRequest(BaseModel):
    address: str
    mode: Optional[str] = 'FROM_2025'

class ConvertRequest(BaseModel):
    address: str

@app.post("/api/v1/address/parse")
def parse_address_endpoint(req: AddressRequest):
    try:
        if not vietnamadminunits:
            return {"status": "error", "message": "vietnamadminunits package is not available (install failed or internet disconnected)"}
        from vietnamadminunits import parse_address
        admin_unit = parse_address(req.address, mode=req.mode)
        if not admin_unit:
            return {"status": "error", "message": "Could not parse address"}
        
        return {
            "status": "success",
            "province": admin_unit.province,
            "district": admin_unit.district,
            "ward": admin_unit.ward,
            "street": admin_unit.street,
            "short_province": admin_unit.short_province,
            "short_district": admin_unit.short_district,
            "short_ward": admin_unit.short_ward,
            "province_code": admin_unit.province_code,
            "district_code": admin_unit.district_code,
            "ward_code": admin_unit.ward_code,
            "latitude": admin_unit.latitude,
            "longitude": admin_unit.longitude,
            "formatted_address": admin_unit.get_address()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/v1/address/convert")
def convert_address_endpoint(req: ConvertRequest):
    try:
        if not vietnamadminunits:
            return {"status": "error", "message": "vietnamadminunits package is not available (install failed or internet disconnected)"}
        from vietnamadminunits import convert_address
        admin_unit = convert_address(req.address)
        if not admin_unit:
            return {"status": "error", "message": "Could not convert address"}
        
        return {
            "status": "success",
            "province": admin_unit.province,
            "district": admin_unit.district,
            "ward": admin_unit.ward,
            "street": admin_unit.street,
            "short_province": admin_unit.short_province,
            "short_district": admin_unit.short_district,
            "short_ward": admin_unit.short_ward,
            "province_code": admin_unit.province_code,
            "district_code": admin_unit.district_code,
            "ward_code": admin_unit.ward_code,
            "latitude": admin_unit.latitude,
            "longitude": admin_unit.longitude,
            "formatted_address": admin_unit.get_address()
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "service": "SmartTravel AI Service",
        "version": "1.0.1"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

