import json
import os
import re
import sys
import unicodedata
import glob

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def clean_title(title):
    title = title.lower()
    title = remove_accents(title)
    title = re.sub(r'[^\w\s]', ' ', title)
    words = title.split()
    
    # Noise words to filter out
    noise = {
        "khu", "du", "lich", "sinh", "thai", "di", "tich", "lich", "su", "lang", "nghe", 
        "nha", "hang", "quan", "tiem", "bai", "bien", "chua", "thap", "le", "hoi", "den", 
        "tho", "khach", "san", "quy", "nhon", "binh", "dinh", "an", "nhon", "tay", "son", 
        "tuy", "phuoc", "phu", "cat", "phu", "my", "hoai", "nhon", "nhon", "ly", "nhon", 
        "hai", "cat", "tien", "co", "tu", "tinh", "xa", "resort", "hotel", "huyen", 
        "thanh", "pho", "tp", "thi", "xa", "va", "cua", "tai", "trong", "tren", "duoi", 
        "nhat", "viet", "nam", "trung", "tam", "gia", "truyen", "truong", "phuong", 
        "dong", "da", "le", "loi", "tran", "hung", "dao", "xuan", "dieu", "nguyen", 
        "hue", "tan", "bat", "ho", "nguyen", "trung", "tin", "an", "duong", "vuong", 
        "han", "mac", "tu", "gheng", "rang", "tien", "sa", "ghenh", "co", "kinh", "hoang", 
        "so", "dep", "ngon", "dac", "san", "truyen", "thong", "bui", "phuong", "cai", "va",
        "cu", "lam", "loc", "tuyen", "lo", "dieu", "nhon", "phong", "nghĩa", "bac", "lieu", "ninh",
        "co", "truyen", "phu", "quoc", "binh", "thuan", "phan", "thiet", "thap", "cham", "mui",
        "ne", "ke", "ga", "chi", "xoi", "chay", "nuong"
    }
    
    cleaned_words = [w for w in words if w not in noise]
    return set(cleaned_words)

def has_pattern(title_clean, pattern):
    escaped = re.escape(pattern)
    return re.search(r'\b' + escaped + r'\b', title_clean) is not None

def are_duplicates(item1, item2):
    if item1.get("category") != item2.get("category"):
        return False
    if item1.get("province") != item2.get("province"):
        return False
        
    set1 = clean_title(item1["title"])
    set2 = clean_title(item2["title"])
    
    # If one of them has no words left after cleaning, compare raw words
    if not set1 or not set2:
        set1 = set(remove_accents(item1["title"].lower()).split())
        set2 = set(remove_accents(item2["title"].lower()).split())
        
    intersection = set1.intersection(set2)
    if not intersection:
        return False
        
    # Check overlap coefficient
    min_len = min(len(set1), len(set2))
    overlap = len(intersection) / min_len if min_len > 0 else 0
    
    # Check common high-profile patterns using word boundary matches
    title1_clean = remove_accents(item1["title"].lower())
    title2_clean = remove_accents(item2["title"].lower())
    
    patterns = [
        "thap doi", "quang trung", "dien hong", "fleur de lys", "dong da", "eo gio", 
        "ky co", "banh it", "linh phong", "ham ho", "hoang hau", "han mac tu", 
        "thi nai", "long khanh", "do ban", "canh tien", "bau da", "phu gia", 
        "vi rong", "hon kho", "bui thi xuan", "duong long", "nguyen thieu", 
        "van son", "mang lang", "chieu coi", "lo dieu", "phu loc", "thap thap", 
        "thu thien", "binh lam", "nem chua", "thuy dien vinh thanh", "nui ba", 
        "gheng rang", "quy hoa", "duc ren", "tra o", "quat gio", "cat trang",
        # Bạc Liêu key terms
        "cong tu bac lieu", "cao van lau", "hong gam", "sai gon bac lieu", "tac say", 
        "cha diep", "dien gio", "xiem can", "a mat", "nam hon", "hung vuong", 
        "anh nguyet", "quan de", "chua ong", "vuon chim", "xoai co thu", "truc lam", 
        "ghositaram", "dap da", "vinh hung", "noc nang", "phuoc duc", "thien hau", 
        "gong", "ba co", "dong hai", "nha mat", "gia rai", "hong dan", "hoa binh",
        # Bắc Ninh key terms
        "den do", "phat tich", "but thap", "chua dau", "hoi lim", "co meo", "quan ho", 
        "viem xa", "tranh dong ho", "phu lang", "tre son dong", "phong khe", 
        "dong ky", "da hoi", "dinh bang", "tieu", "ba chua kho", "ham long", 
        "vinh nghiem", "dong cao", "dam sen", "gia binh", "thuan thanh", 
        "que vo", "yen phong", "tien du", "tu son",
        # Bình Thuận / Bình Dương key terms
        "truong duc thanh", "mui ne", "hon rom", "bau trang", "ke ga", "poshanu", 
        "co thach", "ta cu", "phu quy", "thanh minh tu", "thac ba", "suoi tien",
        "dai nam", "tay tang", "hoi khanh", "phu cuong", "tan phuoc khanh", 
        "tuong binh hiep", "phu an", "dau tieng", "nui cau", "lai thieu", 
        "thuy chau", "tran van ho", "my lien", "nam luc", "becamex", "an lam", 
        "tam giac sat", "nha tu phu lon", "tam con", "grand square", "citadines", 
        "long bao chau", "chau thoi", "chien khu d", "huong viet", "elizabeth", 
        "thai son", "gia dinh green", "the mira", "tan an", "phuong nam", 
        "ba nho", "gia bao", "bcons", "mira cho lon", "nhu y", "pho dong",
        "phu long", "bau long", "vuon mang", "thanh hoi"
    ]
    
    for pat in patterns:
        if has_pattern(title1_clean, pat) and has_pattern(title2_clean, pat):
            return True
            
    return overlap >= 0.6

def load_json_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Preprocess to automatically escape unescaped double quotes in values
        lines = content.splitlines()
        fixed_lines = []
        for line in lines:
            match = re.match(r'^(\s*"(?:content|title|province|category)"\s*:\s*")(.*)("\s*,?\s*)$', line)
            if match:
                prefix, val, suffix = match.groups()
                # Escape any double quotes in the value that are not already escaped
                fixed_val = re.sub(r'(?<!\\)"', r'\"', val)
                fixed_lines.append(prefix + fixed_val + suffix)
            else:
                fixed_lines.append(line)
        fixed_content = "\n".join(fixed_lines)
        return json.loads(fixed_content)

def clean_file(file_path):
    data = load_json_file(file_path)
    n = len(data)
    parent = list(range(n))
    
    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]
        
    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    for i in range(n):
        for j in range(i + 1, n):
            if are_duplicates(data[i], data[j]):
                union(i, j)
                
    groups = {}
    for i in range(n):
        root = find(i)
        if root not in groups:
            groups[root] = []
        groups[root].append(data[i])
        
    cleaned_data = []
    print(f"File: {os.path.basename(file_path)}")
    print(f"Original entries: {n}")
    print(f"Unique entries after cleaning: {len(groups)}")
    
    for root, items in groups.items():
        best_item = max(items, key=lambda x: len(x.get("content", "")))
        cleaned_data.append(best_item)
            
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
    print(f"Cleaned file successfully written to {file_path}.\n")

if __name__ == "__main__":
    dest_dir = os.path.join(os.path.dirname(__file__), "src", "config", "destinations")
    
    # 1. Handle command line arguments if provided
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if os.path.exists(arg):
                clean_file(arg)
            else:
                possible_path = os.path.join(dest_dir, arg)
                if os.path.exists(possible_path):
                    clean_file(possible_path)
                else:
                    print(f"File not found: {arg}")
    else:
        # 2. Interactive Menu
        json_files = glob.glob(os.path.join(dest_dir, "*.json"))
        json_files.sort(key=lambda x: os.path.basename(x).lower())
        
        if not json_files:
            print(f"No .json files found in {dest_dir}")
            sys.exit(1)
            
        print("="*60)
        print(" HỆ THỐNG LỌC TRÙNG DỮ LIỆU ĐIỂM ĐẾN ".center(60, "="))
        print("="*60)
        print("Danh sách file JSON hiện có:")
        for idx, file_path in enumerate(json_files, 1):
            name = os.path.basename(file_path)
            print(f"  {idx:2d}. {name}")
        print("-"*60)
        print("HƯỚNG DẪN CHỌN:")
        print("  - Nhập số thứ tự file muốn lọc (VD: 9)")
        print("  - Nhập danh sách số phân cách bằng dấu phẩy để lọc nhiều file (VD: 9,11,12)")
        print("  - Nhập 'all' (hoặc nhấn Enter) để lọc tất cả các file")
        print("  - Nhập 'q' hoặc 'exit' để thoát")
        print("="*60)
        
        user_input = input("Lựa chọn của bạn: ").strip().lower()
        
        if user_input in ['q', 'exit']:
            print("Đã hủy thao tác.")
            sys.exit(0)
            
        if not user_input or user_input == 'all':
            print("\nTiến hành lọc tất cả các file...")
            for file_path in json_files:
                clean_file(file_path)
        else:
            # Parse input numbers
            try:
                selected_indices = [int(x.strip()) for x in user_input.split(",") if x.strip()]
                files_to_clean = []
                for idx in selected_indices:
                    if 1 <= idx <= len(json_files):
                        files_to_clean.append(json_files[idx - 1])
                    else:
                        print(f"Cảnh báo: Số thứ tự {idx} không hợp lệ và sẽ bị bỏ qua.")
                        
                if files_to_clean:
                    print(f"\nTiến hành lọc {len(files_to_clean)} file đã chọn...")
                    for file_path in files_to_clean:
                        clean_file(file_path)
                else:
                    print("Không có file hợp lệ nào được chọn.")
            except ValueError:
                print("Lỗi: Nhập liệu không hợp lệ. Vui lòng nhập số hoặc 'all'.")
