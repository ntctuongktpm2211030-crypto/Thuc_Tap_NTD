import json
import os

try:
    import vietnamadminunits
    
    # Let's inspect everything inside the module and write it to a file
    output = []
    output.append(f"Module attributes: {dir(vietnamadminunits)}")
    
    # Try to write data structures or function outputs to a JSON or text file
    # Let's see if we can locate files or look at module paths
    module_path = vietnamadminunits.__file__
    output.append(f"Module path: {module_path}")
    
    # If there are data files or lists of provinces
    # Let's search inside the package directory for json/csv data
    package_dir = os.path.dirname(module_path)
    output.append(f"Package directory: {package_dir}")
    
    files_in_package = []
    for root, dirs, files in os.walk(package_dir):
        for f in files:
            files_in_package.append(os.path.relpath(os.path.join(root, f), package_dir))
    output.append(f"Files in package: {files_in_package}")
    
    # Write to a text file in scratch
    with open("d:\\Thuc_Tap_NDT\\backend\\scratch\\vietnamadminunits_dump.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))
        
    print("Inspection completed. Written to scratch/vietnamadminunits_dump.txt")
except Exception as e:
    with open("d:\\Thuc_Tap_NDT\\backend\\scratch\\vietnamadminunits_dump.txt", "w", encoding="utf-8") as f:
        f.write(f"Error: {e}")
    print(f"Error: {e}")
