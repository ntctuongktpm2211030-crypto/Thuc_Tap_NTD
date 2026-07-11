import os
import json
import glob
import re
import unicodedata
import shutil

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def slugify(name):
    name = name.lower()
    # Replace common characters
    name = name.replace("đ", "d")
    name = remove_accents(name)
    # Replace non-word characters with hyphen
    name = re.sub(r'[^\w\s-]', '', name)
    # Replace spaces and multiple hyphens with a single hyphen
    name = re.sub(r'[-\s]+', '-', name)
    return name.strip('-')

def merge_destinations():
    dest_dir = r"d:\Thuc_Tap_NDT\backend\src\config\destinations"
    mapping_path = r"d:\Thuc_Tap_NDT\backend\scratch\province_mapping.json"
    
    if not os.path.exists(mapping_path):
        print(f"❌ Không tìm thấy file ánh xạ: {mapping_path}")
        print("Vui lòng chạy lệnh: python scratch/inspect_mapping.py trước!")
        return
        
    with open(mapping_path, 'r', encoding='utf-8') as f:
        province_map = json.load(f)
        
    print(f"Loaded mapping database with {len(province_map)} provinces.")
    
    # 1. Back up / Restore logic
    # If backup_dir exists, we read from it to start clean (avoids data loss from repeated runs)
    backup_dir = dest_dir + "_backup"
    if os.path.exists(backup_dir):
        print(f"🔄 Tìm thấy bản sao lưu tại {backup_dir}. Sẽ đọc dữ liệu gốc từ bản sao lưu để sinh lại các file.")
        source_dir = backup_dir
    else:
        shutil.copytree(dest_dir, backup_dir)
        print(f"💾 Đã tạo bản sao lưu dữ liệu gốc tại: {backup_dir}")
        source_dir = backup_dir
    
    # 2. Read all destination files from the source (backup) directory
    json_files = glob.glob(os.path.join(source_dir, "*.json"))
    
    # We will group destinations by their new province slug
    new_destinations = {} # slug -> list of items
    
    total_original_items = 0
    unmapped_provinces = set()
    
    for file_path in json_files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"❌ Lỗi đọc file {filename}: {e}")
            continue
            
        for item in data:
            total_original_items += 1
            old_prov = item.get("province", "").strip()
            
            # Find the new province mapping
            new_prov = province_map.get(old_prov)
            
            if not new_prov or "Error" in new_prov or "Needs check" in new_prov:
                new_prov = old_prov
                unmapped_provinces.add(old_prov)
                
            # [CRITICAL UPDATE] Keep the item's province as the original old_prov (e.g. "Bến Tre")
            # so that user searches/inputs mapping works with old provinces,
            # but we still group them under the new province's slug for filename.
            item["province"] = old_prov
            
            # Get the slug of the new province to decide which file to write to
            new_slug = slugify(new_prov)
            
            if new_slug not in new_destinations:
                new_destinations[new_slug] = []
            
            # Avoid absolute duplicate items (same title)
            title_exists = any(x.get("title") == item.get("title") for x in new_destinations[new_slug])
            if not title_exists:
                new_destinations[new_slug].append(item)
                
    # 3. Clean the destinations directory
    # Delete all old files in dest_dir
    for f in glob.glob(os.path.join(dest_dir, "*")):
        if os.path.isfile(f):
            os.remove(f)
            
    # 4. Write new merged JSON files
    total_merged_items = 0
    for slug, items in new_destinations.items():
        new_file_path = os.path.join(dest_dir, f"{slug}.json")
        with open(new_file_path, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        total_merged_items += len(items)
        
        # Get the new province name for display
        sample_old_prov = items[0]["province"]
        new_prov_name = province_map.get(sample_old_prov, sample_old_prov)
        old_provinces_included = list(set(x["province"] for x in items))
        print(f"  + Tạo file: {slug}.json ({new_prov_name}) -> {len(items)} địa điểm (chứa tỉnh cũ: {old_provinces_included})")
        
    print("\n" + "="*60)
    print(" BÁO CÁO KẾT QUẢ ĐỒNG BỘ TỈNH THÀNH MỚI ".center(60, "="))
    print("="*60)
    print(f"Tổng số địa điểm ban đầu: {total_original_items}")
    print(f"Tổng số địa điểm sau khi gộp & lọc trùng: {total_merged_items}")
    print(f"Số tỉnh thành mới (sau sáp nhập): {len(new_destinations)} tỉnh thành")
    if unmapped_provinces:
        print(f"⚠️ Các tỉnh không mapping được (giữ nguyên tên cũ): {list(unmapped_provinces)}")
    print(f"Danh sách file mới đã được lưu tại: {dest_dir}")
    print("="*60)

if __name__ == "__main__":
    merge_destinations()
