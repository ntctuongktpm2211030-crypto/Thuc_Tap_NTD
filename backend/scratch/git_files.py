import subprocess
import os

try:
    # Run git ls-files to see all tracked files in the repository
    output = subprocess.check_output(["git", "ls-files"], stderr=subprocess.STDOUT)
    files = output.decode("utf-8").splitlines()
    
    # Filter only files in destinations folder
    dest_files = [f for f in files if "destinations" in f]
    
    with open("d:\\Thuc_Tap_NDT\\backend\\scratch\\git_files.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(dest_files))
        
    print(f"Success! Found {len(dest_files)} files in git under destinations. Written to scratch/git_files.txt")
except Exception as e:
    with open("d:\\Thuc_Tap_NDT\\backend\\scratch\\git_files.txt", "w", encoding="utf-8") as f:
        f.write(f"Error running git: {e}")
    print(f"Error: {e}")
