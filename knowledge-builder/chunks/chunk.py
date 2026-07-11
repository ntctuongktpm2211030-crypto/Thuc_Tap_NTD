# Script đã được chuyển ra thư mục gốc: ../chunk.py
# Chạy file này sẽ tự động gọi file chunk.py ở ngoài thư mục gốc.
import sys
import os
from pathlib import Path

# Đổi thư mục làm việc sang thư mục gốc để chạy ổn định
os.chdir(Path(__file__).parent.parent)

sys.path.append(os.getcwd())
import chunk

if __name__ == "__main__":
    chunk.main()