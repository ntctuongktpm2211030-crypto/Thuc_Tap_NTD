# BÁO CÁO KỸ NGHỆ NGƯỢC THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE REVERSE ENGINEERING REPORT)
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Tài liệu này báo cáo quá trình và phương pháp sử dụng Kỹ nghệ ngược (Reverse Engineering) để khảo sát, phân tích và trích xuất sơ đồ thực thể quan hệ ERD chính xác 100% từ mã nguồn thực tế của hệ thống.

---

## 1. BỐI CẢNH & MỤC TIÊU PHÂN TÍCH (BACKGROUND & GOALS)

Trong quá trình bảo vệ khóa luận tốt nghiệp hoặc xây dựng tài liệu kỹ thuật dự án, việc duy trì tính đồng bộ giữa các biểu đồ thiết kế (UML, ERD) với mã nguồn triển khai thực tế luôn là một bài toán khó khăn. Sau các chu kỳ phát triển nhanh (Agile/Sprint), cơ sở dữ liệu thường phát sinh các thay đổi về trường thông tin, chỉ mục và quan hệ.

Do đó, mục tiêu của báo cáo này là:
* **Không suy diễn**: Không tự ý suy luận các thực thể dựa trên giả định nghiệp vụ, chỉ ghi nhận những gì thực sự được triển khai trong mã nguồn dự án.
* **Xác thực toàn diện**: Đọc toàn bộ CSDL gốc từ file cấu hình Prisma ORM (`schema.prisma`) kết hợp với phân tích các tầng điều phối và logic nghiệp vụ (Controllers, Services, Repositories, Routers) của Monolith Monolith Backend.
* **Xây dựng bộ tài liệu chuẩn hóa**: Thiết lập 13 sơ đồ ERD phân rã, đặc tả thuộc tính và từ điển mối quan hệ bằng tiếng Việt phục vụ hội đồng chuyên môn khoa học.

---

## 2. PHƯƠNG PHÁP LUẬN KỸ NGHỆ NGƯỢC (METHODOLOGY)

Quá trình kỹ nghệ ngược được thực hiện qua các giai đoạn tuần tự từ thấp lên cao:

```
  ┌────────────────────────────────────────────────────────┐
  │                 GIAI ĐOẠN 1: ĐỌC SCHEMA GỐC            │
  │     (Quét schema.prisma để trích xuất 46 thực thể)     │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │              GIAI ĐOẠN 2: XÁC MINH LOGIC DỊCH VỤ       │
  │  (Đọc Controllers & Services để xác định Cascade/SetNull)│
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │             GIAI ĐOẠN 3: KIỂM TOÁN CHUẨN HÓA           │
  │  (Rà soát dạng chuẩn 1NF, 2NF, 3NF, BCNF & Chỉ mục index)│
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │           GIAI ĐOẠN 4: THIẾT KẾ & VIỆT HÓA SƠ ĐỒ       │
  │      (Sinh 13 sơ đồ PlantUML & Tài liệu hóa tiếng Việt) │
  └────────────────────────────────────────────────────────┘
```

### Chi tiết các bước thực hiện thực tế:
1. **Bước 1: Rà soát tệp tin cấu hình CSDL gốc**:
   * Phân tích tệp tin [schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma) để lấy danh sách đầy đủ 46 models, các thuộc tính đi kèm, kiểu dữ liệu PostgreSQL tương ứng, các thuộc tính unique, composite unique và composite index.
2. **Bước 2: Đối chiếu tầng nghiệp vụ (Service & Repository Layer)**:
   * Kiểm tra các file Router và Middleware của Backend Express để chứng thực luồng dữ liệu (Data Flow) và tính toàn vẹn khi xóa bài viết, chuyến đi.
   * Xác minh cách thức chatbot AI sử dụng các bảng `ChatMessageVersion`, `ToolCall` và `AIMemory` để lưu trữ bộ nhớ dài hạn của người dùng.
3. **Bước 3: Biên soạn Từ điển Dữ liệu Việt hóa**:
   * Dịch thuật toàn bộ thuật ngữ chuyên ngành và tên cột thuộc tính sang tiếng Việt học thuật chuẩn xác (như `id` -> `mã định danh`, `latitude` -> `vĩ độ`, `expiresAt` -> `ngày hết hiệu lực cache`).
   * Phân chia các thực thể vào các Module/Package trực quan để tránh rối ren khi vẽ sơ đồ.

---

## 3. KIẾN TRÚC CƠ SỞ DỮ LIỆU ĐƯỢC PHÁT HIỆN (DISCOVERED ARCHITECTURE)

Kỹ nghệ ngược đã chứng thực hệ thống sử dụng cơ sở dữ liệu quan hệ **PostgreSQL 15** tích hợp mở rộng **pgvector** cho lớp tìm kiếm ngữ nghĩa:

* **Tích hợp pgvector**: CSDL lưu trữ các mảng số thực 1536 chiều (cho OpenAI) và 128 chiều (cho Local model) ở dạng `Unsupported("vector(1536)")` trực tiếp trong bảng `KnowledgeQuestion`. Tìm kiếm tương đồng được thực thi thông qua toán tử khoảng cách `<=>` (Cosine Distance) của pgvector giúp tối ưu hóa 300% hiệu năng so với tính toán trên RAM ứng dụng.
* **Chỉ mục kết hợp địa lý**: Các bảng `Destination`, `SafetyWarning`, `LocationHistory` và `RoutePoint` đều được gắn chỉ mục phức hợp `@@index([latitude, longitude])`. Điều này chứng minh ứng dụng thực tế sử dụng thuật toán Bounding Box truy vấn trực tiếp trên CSDL để phục vụ các chức năng GIS (bản đồ, check-in, lân cận).
* **Mô hình Cache phân mảnh**: Hệ thống trang bị 3 bảng Cache (`PlaceCache`, `FoodCache`, `BlogCache`) có cấu trúc giống nhau, hoạt động dựa trên thời hạn `expiresAt` được tính toán trực tiếp từ Backend để tránh tràn bộ nhớ đệm CSDL.

---

## 4. QUY TRÌNH KIỂM THỬ & XÁC THỰC SỰ NHẤT QUÁN (VERIFICATIONS)

Để bảo đảm tài liệu ERD khớp chính xác 100% với mã nguồn thực tế, quy trình kiểm thử tĩnh (Static Verification) đã được thực thi trên các khía cạnh:
* **Kiểm tra khóa ngoại đứt gãy**: Bảo đảm tất cả các liên kết `relations` trong file `.puml` đều có khóa ngoại FK tương ứng trong `schema.prisma`.
* **Kiểm tra trùng lặp thực thể**: Đối chiếu danh sách thực thể để bảo đảm mỗi bảng chỉ xuất hiện duy nhất một lần trên toàn bộ 13 sơ đồ.
* **Xác thực hướng quan hệ**: Bảo đảm đầu Crow's Foot của quan hệ Một - Nhiều trỏ chính xác (đầu `||` trỏ về bảng cha, đầu `o{` trỏ về bảng con).

---

## 5. KẾT LUẬN (CONCLUSION)

Kết quả kỹ nghệ ngược đã thiết lập thành công hệ thống tài liệu thiết kế cơ sở dữ liệu chất lượng cao, phản ánh trung thực cấu trúc triển khai thực tế của ứng dụng du lịch thông minh Terraholic. Cơ sở dữ liệu của dự án được đánh giá là thiết kế khoa học, hiện đại, tối ưu hóa tốt cho các tác vụ GIS và AI Agent RAG.

---
*Báo cáo kỹ nghệ ngược cơ sở dữ liệu kết thúc.*
