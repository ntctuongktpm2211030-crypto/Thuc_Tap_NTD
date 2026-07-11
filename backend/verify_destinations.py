import os
import json
import glob
import time
import sys
import urllib.request
import urllib.parse
import re
from collections import defaultdict

# Bounding box for Vietnam coordinates
LAT_MIN, LAT_MAX = 8.0, 24.0
LNG_MIN, LNG_MAX = 102.0, 110.0

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def analyze_destinations(dest_dir):
    json_files = glob.glob(os.path.join(dest_dir, "*.json"))
    report = []
    
    total_files = len(json_files)
    total_items = 0
    missing_coords = 0
    duplicate_coords = defaultdict(list)
    out_of_bounds = 0
    
    for file in json_files:
        filename = os.path.basename(file)
        try:
            items = load_json(file)
        except Exception as e:
            report.append(f"❌ File {filename} có lỗi cú pháp JSON: {e}")
            continue
            
        for item in items:
            total_items += 1
            title = item.get("title", "")
            province = item.get("province", "")
            lat = item.get("latitude")
            lng = item.get("longitude")
            
            if lat is None or lng is None:
                missing_coords += 1
                continue
                
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                if not (LAT_MIN <= lat_f <= LAT_MAX) or not (LNG_MIN <= lng_f <= LNG_MAX):
                    out_of_bounds += 1
                # Round to 4 decimal places to catch duplicates
                duplicate_coords[(round(lat_f, 4), round(lng_f, 4))].append((filename, title))
            except (ValueError, TypeError):
                missing_coords += 1
                
    # Calculate duplicate statistics
    dup_clusters = {k: v for k, v in duplicate_coords.items() if len(v) > 1}
    dup_items_count = sum(len(v) for v in dup_clusters.values())
    
    print("=" * 60)
    print(" BÁO CÁO PHÂN TÍCH DỮ LIỆU ĐỊA ĐIỂM ".center(60, "="))
    print("=" * 60)
    print(f"Tổng số file JSON: {total_files}")
    print(f"Tổng số địa điểm: {total_items}")
    print(f"Địa điểm thiếu tọa độ: {missing_coords}")
    print(f"Địa điểm tọa độ nằm ngoài Việt Nam: {out_of_bounds}")
    print(f"Số cụm tọa độ bị trùng: {len(dup_clusters)}")
    print(f"Số địa điểm chia sẻ tọa độ trùng lặp: {dup_items_count} ({(dup_items_count/total_items*100):.1f}% tổng số)")
    print("=" * 60)
    
    if report:
        print("\nLỗi cú pháp file:")
        print("\n".join(report))
        
    if dup_clusters:
        print("\n📍 Top các tọa độ bị trùng lặp nhiều nhất (dấu hiệu dữ liệu ảo/placeholder):")
        sorted_dups = sorted(dup_clusters.items(), key=lambda x: len(x[1]), reverse=True)
        for coords, items in sorted_dups[:10]:
            print(f"- Tọa độ {coords} bị lặp lại ở {len(items)} địa điểm:")
            for filename, title in items[:5]:
                print(f"  + [{filename}] {title}")
            if len(items) > 5:
                print(f"  + ... và {len(items) - 5} địa điểm khác.")
                
    return json_files

def search_osm_with_fallbacks(title, province, headers):
    # 1. Clean the title
    clean_title = re.sub(r'\(.*?\)', '', title).strip()
    
    # List of queries to try in order of specificity
    queries = []
    
    # Query 1: full cleaned title + province + Vietnam
    queries.append(f"{clean_title}, {province}, Vietnam")
    
    # Query 2: spelling correction (Chánh -> Chính)
    if "chánh" in clean_title.lower():
        corrected_title = re.sub(r'(?i)chánh', 'chính', clean_title)
        queries.append(f"{corrected_title}, {province}, Vietnam")
        
    # Query 3: strip noise prefixes
    prefixes = [
        r"^khu di tích lịch sử cách mạng\s+",
        r"^khu di tích lịch sử\s+",
        r"^khu di tích\s+",
        r"^di tích lịch sử\s+",
        r"^di tích\s+",
        r"^khu du lịch sinh thái\s+",
        r"^khu du lịch\s+",
        r"^làng nghề truyền thống\s+",
        r"^làng nghề\s+",
        r"^nhà thờ chánh tòa\s+",
        r"^nhà thờ chính tòa\s+",
        r"^nhà thờ\s+",
        r"^thánh đường\s+",
        r"^chùa cổ\s+",
        r"^chùa\s+",
        r"^đền thờ\s+",
        r"^đền\s+",
        r"^quán\s+",
        r"^nhà hàng\s+",
        r"^khách sạn\s+",
        r"^hotel\s+",
        r"^hồ\s+",
        r"^núi\s+",
        r"^bãi biển\s+"
    ]
    
    stripped_title = clean_title
    for p in prefixes:
        stripped_title = re.sub(p, "", stripped_title, flags=re.IGNORECASE).strip()
        
    if stripped_title != clean_title and len(stripped_title) > 2:
        queries.append(f"{stripped_title}, {province}, Vietnam")
        # Also try without Vietnam
        queries.append(f"{stripped_title}, {province}")
        
    # Query 4: just the cleaned title + province
    queries.append(f"{clean_title}, {province}")
    
    # Query 5: just the stripped title + Vietnam
    if len(stripped_title) > 3:
        queries.append(f"{stripped_title}, Vietnam")

    # Dedup queries while preserving order
    seen = set()
    unique_queries = [x for x in queries if not (x in seen or seen.add(x))]

    for idx, q in enumerate(unique_queries):
        encoded_query = urllib.parse.quote(q)
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_query}&format=json&limit=1"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode('utf-8'))
            if res_data:
                return {
                    'lat': float(res_data[0]['lat']),
                    'lon': float(res_data[0]['lon']),
                    'display_name': res_data[0].get('display_name', ''),
                    'query_used': q,
                    'attempt': idx + 1
                }
        except Exception:
            pass
        # Rate limit between attempts
        time.sleep(1.0)
        
    return None

def verify_and_update_coordinates(filepath, limit=10, update_file=False):
    filename = os.path.basename(filepath)
    print(f"\n🔍 Bắt đầu kiểm tra thực tế địa điểm trong: {filename}")
    try:
        items = load_json(filepath)
    except Exception as e:
        print(f"❌ Không thể đọc file: {e}")
        return
        
    updated_count = 0
    not_found_count = 0
    
    # Filter items that need verification: missing coords or Ben Thanh coordinates
    items_to_check = []
    for item in items:
        lat = item.get("latitude")
        lng = item.get("longitude")
        is_placeholder = (lat == 10.7769 and lng == 106.7009) or (lat is None or lng is None)
        if is_placeholder:
            items_to_check.append(item)
            
    if not items_to_check:
        print(f"✅ Tất cả địa điểm trong {filename} đã có tọa độ thực tế từ trước! Không cần check lại.")
        return
        
    if limit > 0:
        items_to_check = items_to_check[:limit]
        
    headers = {
        'User-Agent': 'SmartTravelDataValidator/1.0 (contact@smarttravel.com)'
    }
    
    print(f"Tiến hành kiểm tra {len(items_to_check)} địa điểm bằng OpenStreetMap (kèm Smart Fallback)...")
    
    for i, item in enumerate(items_to_check):
        title = item.get("title", "")
        province = item.get("province", "")
        current_lat = item.get("latitude")
        current_lng = item.get("longitude")
        
        print(f"[{i+1}/{len(items_to_check)}] Đang kiểm tra: '{title}' ({province})...")
        
        res = search_osm_with_fallbacks(title, province, headers)
        
        if res:
            real_lat = res['lat']
            real_lng = res['lon']
            display_name = res['display_name']
            
            print(f"   ✅ Tìm thấy trên bản đồ: {display_name[:70]}...")
            print(f"   📍 Tọa độ thực tế: ({real_lat}, {real_lng}) [Tìm theo query '{res['query_used']}']")
            
            if current_lat is not None and current_lng is not None:
                diff_lat = abs(float(current_lat) - real_lat)
                diff_lng = abs(float(current_lng) - real_lng)
                if diff_lat > 0.001 or diff_lng > 0.001:
                    print(f"   ⚠️ Lệch so với tọa độ cũ: ({current_lat}, {current_lng})")
            
            if update_file:
                item['latitude'] = real_lat
                item['longitude'] = real_lng
                if 'costEstimate' not in item:
                    item['costEstimate'] = 0
                updated_count += 1
        else:
            print(f"   ❌ KHÔNG TÌM THẤY địa điểm này trên bản đồ thực tế!")
            not_found_count += 1
            
        time.sleep(0.5)
        
    if update_file and updated_count > 0:
        save_json(filepath, items)
        print(f"\n💾 Đã lưu và cập nhật tọa độ thực tế cho {updated_count} địa điểm vào {filename}!")
    else:
        print(f"\n💡 Mode chỉ đọc (Chưa cập nhật file). Sử dụng tham số '--update' để cập nhật.")

if __name__ == "__main__":
    dest_dir = os.path.join(os.path.dirname(__file__), "src", "config", "destinations")
    
    # 1. Analyze and print status report
    files = analyze_destinations(dest_dir)
    
    print("\n" + "="*60)
    print(" HƯỚNG DẪN KIỂM TRA & AUTO-UPDATE TỌA ĐỘ BẰNG BẢN ĐỒ ".center(60))
    print("="*60)
    print("Bạn có thể chạy script này với các tham số sau:")
    print("1. Chạy phân tích tổng quan: \n   python verify_destinations.py")
    print("2. Kiểm tra thực tế một file cụ thể (chỉ đọc thử 5 địa điểm đầu):")
    print("   python verify_destinations.py phu-yen.json 5")
    print("3. Kiểm tra thực tế và CẬP NHẬT TỌA ĐỘ THỰC vào file:")
    print("   python verify_destinations.py phu-yen.json 5 --update")
    print("4. Cập nhật TOÀN BỘ địa điểm trong một file:")
    print("   python verify_destinations.py phu-yen.json 0 --update")
    print("5. Chạy quét & CẬP NHẬT TOÀN BỘ 45 TỈNH THÀNH (Tự động chạy ngầm):")
    print("   python verify_destinations.py all 0 --update")
    print("="*60)

    # 2. Check if arguments are passed to test/update
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        limit = 5
        update_file = False
        
        if len(sys.argv) > 2:
            try:
                limit = int(sys.argv[2])
            except ValueError:
                if sys.argv[2] == "--update":
                    update_file = True
                    limit = 5
                    
        if "--update" in sys.argv:
            update_file = True
            
        if target_file.lower() == "all":
            json_files = glob.glob(os.path.join(dest_dir, "*.json"))
            json_files.sort()
            print(f"\n🚀 Bắt đầu quét TOÀN BỘ {len(json_files)} tỉnh thành...")
            for f_path in json_files:
                verify_and_update_coordinates(f_path, limit=limit, update_file=update_file)
        else:
            # Resolve path
            target_path = target_file
            if not os.path.exists(target_path):
                target_path = os.path.join(dest_dir, target_file)
                
            if os.path.exists(target_path):
                verify_and_update_coordinates(target_path, limit=limit, update_file=update_file)
            else:
                print(f"❌ Không tìm thấy file: {target_file}")

