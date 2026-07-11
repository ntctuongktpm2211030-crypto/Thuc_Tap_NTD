import os
import json
import glob
from collections import defaultdict

def analyze_destinations():
    dest_dir = r"d:\Thuc_Tap_NDT\backend\src\config\destinations"
    json_files = glob.glob(os.path.join(dest_dir, "*.json"))
    
    print(f"Analyzing {len(json_files)} JSON files in {dest_dir}...\n")
    
    total_items = 0
    missing_coords = 0
    invalid_coords = 0
    out_of_vietnam = 0
    coords_map = defaultdict(list)
    title_map = defaultdict(list)
    
    # Bounding box of Vietnam (approximate)
    # Latitude: 8.5 to 23.4
    # Longitude: 102.1 to 109.5
    vn_lat_min, vn_lat_max = 8.0, 24.0
    vn_lng_min, vn_lng_max = 102.0, 110.0

    for file_path in json_files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            continue
            
        for item in data:
            total_items += 1
            title = item.get("title", "")
            province = item.get("province", "")
            lat = item.get("latitude")
            lng = item.get("longitude")
            
            title_map[title.strip().lower()].append((filename, title, province))
            
            if lat is None or lng is None:
                missing_coords += 1
                continue
                
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                
                # Check for default/placeholder coordinates (like 0.0, 0.0)
                if lat_f == 0.0 or lng_f == 0.0:
                    invalid_coords += 1
                elif not (vn_lat_min <= lat_f <= vn_lat_max) or not (vn_lng_min <= lng_f <= vn_lng_max):
                    out_of_vietnam += 1
                
                # Map coordinates to see duplicates
                # Round to 4 decimal places to catch very close ones
                coord_key = (round(lat_f, 4), round(lng_f, 4))
                coords_map[coord_key].append((filename, title, province, lat_f, lng_f))
                
            except ValueError:
                invalid_coords += 1
                
    print(f"--- Analysis Summary ---")
    print(f"Total Destinations: {total_items}")
    print(f"Missing Coordinates: {missing_coords}")
    print(f"Invalid / Zero Coordinates: {invalid_coords}")
    print(f"Coordinates outside Vietnam range: {out_of_vietnam}")
    
    # Find duplicate coordinates
    duplicate_coords_count = 0
    duplicate_coords_groups = 0
    
    print("\n--- Duplicate Coordinate Clusters (Top 10) ---")
    sorted_coords = sorted(coords_map.items(), key=lambda x: len(x[1]), reverse=True)
    
    shown = 0
    for coords, items in sorted_coords:
        if len(items) > 1:
            duplicate_coords_groups += 1
            duplicate_coords_count += len(items)
            if shown < 10:
                print(f"\nCoordinates {coords} shared by {len(items)} items:")
                for item in items[:5]:
                    print(f"  - [{item[0]}] {item[1]} ({item[2]})")
                if len(items) > 5:
                    print(f"  - ... and {len(items) - 5} more items")
                shown += 1
                
    print(f"\nTotal duplicate coordinates groups: {duplicate_coords_groups}")
    print(f"Total items sharing duplicate coordinates: {duplicate_coords_count} (out of {total_items})")

    # Find duplicate titles
    duplicate_titles = {k: v for k, v in title_map.items() if len(v) > 1}
    print(f"\nTotal duplicate titles: {len(duplicate_titles)}")
    if duplicate_titles:
        print("\n--- Sample Duplicate Titles ---")
        for idx, (title, items) in enumerate(list(duplicate_titles.items())[:10]):
            print(f"Title: '{title}' appears in:")
            for item in items:
                print(f"  - File: {item[0]}, Province: {item[1]}")

if __name__ == "__main__":
    analyze_destinations()
