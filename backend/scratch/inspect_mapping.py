import os
import json
import sys

def inspect_and_generate_map():
    try:
        import vietnamadminunits
        print("vietnamadminunits imported successfully!")
        
        # Let's see how the package can map old provinces to new ones.
        # We will dynamically search for mapping variables or test functions
        mapping = {}
        
        # Check if there is a known list of 63 old provinces in Vietnam
        old_provinces = [
            "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", 
            "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", 
            "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", 
            "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", 
            "TP. Hồ Chí Minh", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", 
            "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An", 
            "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", 
            "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", 
            "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang", "Vĩnh Long", 
            "Vĩnh Phúc", "Yên Bái"
        ]
        
        # Let's inspect methods of vietnamadminunits to see how to convert
        methods = dir(vietnamadminunits)
        print("Available methods:", methods)
        
        # Standard address converter function or class
        converter = None
        if hasattr(vietnamadminunits, 'convert_address'):
            converter = getattr(vietnamadminunits, 'convert_address')
            print("Found convert_address function!")
        elif hasattr(vietnamadminunits, 'AddressConverter'):
            converter_class = getattr(vietnamadminunits, 'AddressConverter')
            converter = converter_class().convert
            print("Found AddressConverter class!")
            
        if converter:
            for p in old_provinces:
                try:
                    # Let's test with just the province name
                    res = converter(p)
                    # If it's a dict or object, extract the province name
                    if isinstance(res, dict):
                        new_p = res.get('province') or res.get('city') or str(res)
                    elif hasattr(res, 'province'):
                        new_p = getattr(res, 'province')
                    else:
                        new_p = str(res)
                    mapping[p] = new_p.strip()
                except Exception as e:
                    # Try with a full address string like "Quận 1, [Province]"
                    try:
                        res = converter(f"Quận 1, {p}")
                        mapping[p] = f"Needs check: {res}"
                    except Exception:
                        mapping[p] = f"Error: {e}"
        else:
            # Let's look for attributes like PROVINCES_MAP or data files
            # print attributes and look for dictionary
            for attr in methods:
                if not attr.startswith('_'):
                    val = getattr(vietnamadminunits, attr)
                    if isinstance(val, dict) and any(p in val for p in old_provinces):
                        print(f"Found mapping dictionary in attribute: {attr}")
                        mapping = val
                        break
                        
        # Write the resulting mapping to a file
        out_path = "d:\\Thuc_Tap_NDT\\backend\\scratch\\province_mapping.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
            
        print(f"Generated mapping file successfully at {out_path}!")
        print("Sample mapping entries:")
        for k, v in list(mapping.items())[:10]:
            print(f"  {k} -> {v}")
            
    except ImportError as e:
        print(f"ImportError: {e}. Please ensure vietnamadminunits is installed in this python environment.")
        # Write error to file
        with open("d:\\Thuc_Tap_NDT\\backend\\scratch\\province_mapping_error.txt", "w", encoding="utf-8") as f:
            f.write(f"ImportError: {e}\nPython executable: {sys.executable}\nPaths: {sys.path}")

if __name__ == "__main__":
    inspect_and_generate_map()
