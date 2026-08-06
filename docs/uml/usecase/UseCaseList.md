# Danh sách Trường hợp Sử dụng (Use Case List) Chuẩn hóa UML 2.5 - Nền tảng SmartTravel (Terraholic)

Tài liệu này chuẩn hóa toàn bộ các ca sử dụng (Use Cases) của hệ thống **SmartTravel (Terraholic)** theo chuẩn **UML 2.5**, tuân thủ nguyên tắc:
- Tên Use Case dạng `Động từ + Cụm danh từ` đại diện cho mục tiêu nghiệp vụ thực sự của Actor.
- Phân định rõ Tác nhân chính (Primary Actor), Tác nhân hỗ trợ (Supporting System Actor), và mối quan hệ giữa các Use Case (`«include»`, `«extend»`, `Generalization`).

---

## 1. Phân hệ Xác thực & Thành viên (Authentication & Profile)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_AUTH_01** | Đăng ký tài khoản mới | Khách vãng lai | SMTP Mail Server | `«include»` UC_AUTH_02 | Đăng ký tài khoản thành viên bằng Email và nhận mã kích hoạt. |
| **UC_AUTH_02** | Xác thực tài khoản qua Email | Khách vãng lai | SMTP Mail Server | Phụ thuộc UC_AUTH_01 | Kích hoạt tài khoản thông qua OTP/Token gửi về Email. |
| **UC_AUTH_03** | Đăng nhập tài khoản | Khách vãng lai | - | Base Use Case | Xác thực danh tính người dùng để truy cập hệ thống. |
| **UC_AUTH_03A**| Đăng nhập truyền thống | Khách vãng lai | - | *Generalization* (từ UC_AUTH_03) | Đăng nhập bằng Email/Tên đăng nhập và Mật khẩu cá nhân. |
| **UC_AUTH_03B**| Đăng nhập Google SSO | Khách vãng lai | Firebase Auth | *Generalization* (từ UC_AUTH_03) | Đăng nhập nhanh thông qua tài khoản Google OAuth. |
| **UC_AUTH_04** | Quản lý hồ sơ & sở thích | Người dùng đăng ký| vietnamadminunits API| Standalone | Cập nhật thông tin cá nhân, avatar và cấu hình sở thích du lịch. |
| **UC_AUTH_05** | Theo dõi thành viên cộng đồng | Người dùng đăng ký| - | Standalone | Theo dõi hoạt động du lịch và bài viết của thành viên khác. |

---

## 2. Phân hệ Lập lịch trình & Tối ưu lộ trình (Trip Planning & Optimization)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_TRIP_01** | Quản lý hành trình du lịch | Người dùng đăng ký| - | Base Use Case | Tạo mới, xem, sửa hoặc xóa các chuyến đi cá nhân. |
| **UC_TRIP_02** | Tạo lịch trình tự động bằng AI | Người dùng đăng ký| OpenAI API | `«extend»` UC_TRIP_01 | AI sinh tự động lịch trình N ngày tối ưu theo ngân sách và sở thích. |
| **UC_TRIP_03** | Tối ưu hóa lộ trình di chuyển | Người dùng đăng ký| OpenStreetMap | `«include»` UC_TRIP_01 | Tối ưu thứ tự các điểm dừng trong ngày theo thuật toán đường đi ngắn nhất (TSP). |
| **UC_TRIP_04** | Thiết kế hành trình tùy chỉnh | Người dùng đăng ký| - | Standalone | Tự thêm bớt ngày đi, hoạt động, mốc thời gian và chi phí cá nhân. |
| **UC_TRIP_05** | Nhân bản & Chia sẻ lịch trình | Người dùng đăng ký| - | `«extend»` UC_TRIP_01 | Sao chép lịch trình công khai của thành viên khác thành bản sao cá nhân. |
| **UC_TRIP_06** | Quản lý nhật ký & chi phí đi lại | Người dùng đăng ký| - | Standalone | Theo dõi chi phí thực tế, đánh giá và ghi nhận nhật ký chuyến đi đã hoàn thành. |

---

## 3. Phân hệ Mạng xã hội du lịch (Social & Community Feed)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_SOC_01** | Khám phá bảng tin cộng đồng | Khách vãng lai | - | Base Use Case | Đọc bài viết trải nghiệm du lịch, lọc bài viết nổi bật hoặc mới nhất. |
| **UC_SOC_02** | Quản lý bài viết chia sẻ | Người dùng đăng ký| Supabase Storage | Standalone | Soạn thảo, đăng tải bài viết mới kèm hình ảnh/video du lịch, chỉnh sửa hoặc xóa bài. |
| **UC_SOC_03** | Tương tác bài đăng cộng đồng | Người dùng đăng ký| - | `«include»` UC_SOC_01 | Thích bài viết, viết bình luận và lưu trữ bài đăng yêu thích. |
| **UC_SOC_04** | Tìm kiếm bạn đồng hành du lịch | Người dùng đăng ký| OpenAI API | Standalone | Gợi ý và kết nối bạn phượt có cùng điểm đến và gu du lịch. |

---

## 4. Phân hệ Bản đồ tương tác & GIS (Interactive Map & GIS Services)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_MAP_01** | Khám phá bản đồ du lịch tương tác | Khách vãng lai | OpenStreetMap | Base Use Case | Tra cứu vị trí, tìm kiếm địa danh, lọc danh mục (khách sạn, nhà hàng, di tích). |
| **UC_MAP_02** | Định vị & Chia sẻ vị trí live | Người dùng đăng ký| WebSockets | Standalone | Định vị GPS thiết bị và chia sẻ vị trí di chuyển thực tế theo thời gian thực. |
| **UC_MAP_03** | Dẫn đường & Tính toán tuyến đường | Người dùng đăng ký| OpenStreetMap / OSRM | `«extend»` UC_MAP_01 | Hiển thị tuyến đường di chuyển và chỉ đường Turn-by-Turn giữa các địa điểm. |
| **UC_MAP_04** | Thực hiện check-in địa điểm | Người dùng đăng ký| Supabase Storage | Standalone | Đánh giá sự có mặt tại điểm đến, tải ảnh check-in và ghim vị trí lên bản đồ cộng đồng. |
| **UC_MAP_05** | Quản lý sự kiện du lịch địa phương | Người dùng đăng ký| - | Standalone | Khám phá hoặc tạo mới sự kiện meetup/giao lưu địa phương trên bản đồ. |

---

## 5. Phân hệ Trợ lý ảo AI & RAG (AI Assistant & RAG Engine)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_AI_01** | Trò chuyện với trợ lý ảo du lịch | Người dùng đăng ký| OpenAI API | Base Use Case | Hỏi đáp thời tiết, ẩm thực, văn hóa và lịch trình với Multi-Agent AI. |
| **UC_AI_02** | Quản lý phiên hội thoại AI | Người dùng đăng ký| - | Standalone | Quản lý lịch sử luồng chat, tạo hội thoại mới hoặc xóa phiên chat cũ. |
| **UC_AI_03** | Tra cứu tri thức văn hóa & ẩm thực RAG | Khách vãng lai | RAG / Vector Engine | Standalone | Tra cứu tri thức 63 tỉnh thành, 54 dân tộc và cẩm nang văn hóa địa phương. |
| **UC_AI_04** | Quản lý danh mục đặc sản yêu thích | Người dùng đăng ký| - | `«extend»` UC_AI_01 | Lưu trữ các món ăn đặc sản địa phương được AI gợi ý vào bộ sưu tập cá nhân. |

---

## 6. Phân hệ Quản trị hệ thống (System Administration Portal)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mối quan hệ | Mô tả ngắn nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC_ADM_01** | Quản lý tài khoản thành viên | Quản trị viên | - | Standalone | Giám sát danh sách thành viên, kiểm tra thời hạn chưa truy cập và thu hồi tài khoản. |
| **UC_ADM_02** | Kiểm duyệt bài viết & Vi phạm | Quản trị viên | Profanity Engine | Standalone | Xử lý bài viết bị báo cáo vi phạm, duyệt hoặc gỡ bỏ bài đăng không phù hợp. |
| **UC_ADM_03** | Quản lý cẩm nang & Nạp tri thức RAG | Quản trị viên | RAG Pipeline | Standalone | Cập nhật tài liệu cẩm nang (Word/JSON/PDF) và đồng bộ cơ sở tri thức số. |
| **UC_ADM_04** | Xem Dashboard & Thống kê hệ thống | Quản trị viên | - | Standalone | Theo dõi chỉ số tăng trưởng, số lượng bài đăng, chuyến đi và thông báo hệ thống. |


