import os
import json

dest_dir = r"d:\Thuc_Tap_NDT\backend\src\config\destinations"
files = [f for f in os.listdir(dest_dir) if f.endswith('.json')]

print(f"Scanning {len(files)} files...")
for fname in files:
    fpath = os.path.join(dest_dir, fname)
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list) and len(data) > 0:
            provinces = set(item.get('province', '') for item in data)
            coords_example = (data[0].get('latitude'), data[0].get('longitude'))
            print(f"File: {fname} -> Provinces: {provinces} -> Coords example: {coords_example}")
        else:
            print(f"File: {fname} -> Empty or invalid JSON structure")
    except Exception as e:
        print(f"File: {fname} -> Error: {e}")
