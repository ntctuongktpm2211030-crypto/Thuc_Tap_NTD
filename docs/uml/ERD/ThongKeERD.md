# TÀI LIỆU BÁO CÁO THỐNG KÊ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (CSDL METRICS REPORT)
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Tài liệu này cung cấp các số liệu thống kê định lượng về lược đồ cơ sở dữ liệu vật lý của hệ thống, giúp nhà phát triển nắm rõ quy mô, độ phức tạp và mật độ liên kết của hệ quản trị dữ liệu.

---

## 1. THÔNG SỐ ĐỊNH LƯỢNG TỔNG QUAN (CORE METRICS)

Hệ thống cơ sở dữ liệu được xây dựng trên PostgreSQL 15, sử dụng Prisma ORM làm trung gian ánh xạ thực thể. Dưới đây là các thông số tổng hợp từ tệp `schema.prisma`:

* **Tổng số bảng thực thể (Tables/Entities)**: **36 bảng**.
* **Tổng số thuộc tính (Fields/Attributes)**: **205 thuộc tính** (trung bình 5.69 thuộc tính/bảng).
* **Tổng số Enums tự định nghĩa**: **2 enum** (`UserRole` và `TripStatus`).
* **Tổng số khóa chính (Primary Keys - PK)**: **36 khóa chính** (35 khóa đơn UUID và 1 khóa chính Composite `[key, type]` của `SystemCache`).
* **Tổng số khóa ngoại vật lý (Foreign Keys - FK)**: **39 khóa ngoại**.
* **Tổng số ràng buộc duy nhất (Unique Constraints)**: **12 ràng buộc**.
* **Tổng số chỉ mục tìm kiếm (Indices)**: **20 chỉ mục**.

---

## 2. PHÂN BỔ BẢNG THEO PHÂN HỆ NGHIỆP VỤ (MODULE DISTRIBUTION)

Lược đồ cơ sở dữ liệu được phân chia thành **8 nhóm chức năng** chính với mật độ bảng tương ứng:

```
  ┌──────────────────────────────────────────────────────────┐
  │              MẬT ĐỘ PHÂN BỔ THỰC THỂ THEO MÔ-ĐUN         │
  │                                                          │
  │  Hành trình & Chuyến đi : ▓▓▓▓▓▓▓▓▓▓▓ (7 bảng)           │
  │  Người dùng & Cá nhân   : ▓▓▓▓▓▓▓▓▓▓█ (7 bảng)           │
  │  Địa điểm & GIS         : ▓▓▓▓▓▓▓▓ (6 bảng)              │
  │  AI Chatbot Trợ lý      : ▓▓▓▓▓▓▓▓ (5 bảng)              │
  │  Sự kiện & Kết nối      : ▓▓▓▓▓▓▓▓ (5 bảng)              │
  │  Mạng xã hội Tương tác  : ▓▓▓▓▓▓ (4 bảng)                │
  │  Đệm Cache & Nhật ký    : ▓▓▓▓ (4 bảng)                  │
  │  Hệ RAG & Tri thức      : ▓▓▓▓ (3 bảng)                  │
  └──────────────────────────────────────────────────────────┘
```

---

## 3. THỐNG KÊ CHI TIẾT CÁC RÀNG BUỘC PHỨC HỢP (COMPLEX CONSTRAINTS)

### 3.1. Các ràng buộc Duy nhất phức hợp (`@@unique`)
Dùng để ngăn chặn trùng lặp dữ liệu trên tập hợp nhiều cột thuộc tính:
1. `Follower`: `@@unique([followerId, followingId])` - Ngăn chặn theo dõi trùng lặp.
2. `Like`: `@@unique([postId, userId])` - Đảm bảo một người chỉ thích một bài đăng duy nhất một lượt.
3. `Bookmark`: `@@unique([postId, userId])` - Đảm bảo một bài viết chỉ được lưu một lần trên một tài khoản.
4. `TripDay`: `@@unique([tripId, dayIndex])` - Bảo vệ thứ tự ngày của một chuyến đi không bị đè lên nhau.
5. `EventAttendee`: `@@unique([eventId, userId])` - Đăng ký tham gia lễ hội duy nhất một dòng.
6. `TravelerMatch`: `@@unique([userId, matchedUserId])` - Đảm bảo hai người dùng chỉ được ghép đôi một lượt đề xuất.

### 3.2. Các chỉ mục Phức hợp & Chỉ mục đặc biệt (`@@index`)
1. `Destination`: `@@index([latitude, longitude])` - Chỉ mục không gian địa lý hỗ trợ tìm kiếm lân cận (Spatial Search).
2. `SafetyWarning`: `@@index([latitude, longitude])` - Hỗ trợ khoanh vùng và quét cảnh báo thiên tai.
3. `LocationHistory`: `@@index([latitude, longitude])` - Tăng tốc độ vẽ vệt di chuyển thực tế.
4. `RoutePoint`: `@@index([latitude, longitude])` - Tăng tốc truy vấn điểm tọa độ của tuyến đường du ký.
5. `KnowledgeQuestion`: Chỉ mục Gist/GIN (hoặc HNSW ở mức PostgreSQL vật lý) trên cột vector đặc trưng `embeddingOpenAI` và `embeddingLocal` hỗ trợ tìm kiếm khoảng cách Cosine.

---

## 4. PHÂN TÍCH ĐỘ PHỨC TẠP MẠNG LƯỚI QUAN HỆ (SCHEMA COMPLEXITY)

* **Hệ số liên kết (Relationship Density)**: **0.98** (Hệ số bằng số lượng FK chia cho tổng số bảng. Hệ số gần bằng 1.0 biểu thị mạng lưới liên kết cực kỳ chặt chẽ, có cấu trúc chặt chẽ của CSDL quan hệ chuẩn, không xuất hiện các bảng mồ côi (isolated tables) trừ các bảng cache hạ tầng).
* **Độ sâu phân cấp tối đa (Maximum Hierarchy Depth)**: **3 tầng**.
  * Ví dụ: `Trip` (tầng 1) -> `TripDay` (tầng 2) -> `TripActivity` (tầng 3).
  * Ví dụ: `Journey` (tầng 1) -> `Route` (tầng 2) -> `RoutePoint` (tầng 3).
  * Việc khống chế độ sâu phân cấp tối đa ở mức 3 tầng giúp hạn chế viết các câu lệnh truy vấn lồng nhau (Nested Queries) quá sâu, bảo đảm hiệu năng đọc của PostgreSQL không bị sụt giảm nghiêm trọng.

---
*Tài liệu thống kê định lượng cơ sở dữ liệu kết thúc.*
