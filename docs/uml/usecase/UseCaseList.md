# Danh sách Trường hợp Sử dụng (Use Case List) - Nền tảng SmartTravel (Terraholic)

Tài liệu này tổng hợp toàn bộ các ca sử dụng (Use Cases) của nền tảng SmartTravel, được phân loại theo phân hệ chức năng và khớp nối chính xác với cấu trúc định tuyến API ở Back-End cũng như giao diện ở Front-End.

---

## 1. Phân hệ Xác thực & Thành viên (Authentication & Profile)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mô tả ngắn |
| :--- | :--- | :--- | :--- | :--- |
| **UC_AUTH_01** | Đăng ký tài khoản | Khách vãng lai | SMTP Mail Server | Người dùng đăng ký tài khoản thành viên mới bằng email. |
| **UC_AUTH_02** | Xác thực tài khoản qua Email | Khách vãng lai | SMTP Mail Server | Kích hoạt tài khoản bằng mã xác nhận gửi tới email. |
| **UC_AUTH_03** | Đăng nhập tài khoản | Khách vãng lai | Firebase Auth | Đăng nhập vào hệ thống để bắt đầu phiên làm việc. |
| **UC_AUTH_03A**| Đăng nhập truyền thống | Khách vãng lai | - | (*Kế thừa*) Đăng nhập bằng Email và Mật khẩu cá nhân. |
| **UC_AUTH_03B**| Đăng nhập Google SSO | Khách vãng lai | Firebase Auth | (*Kế thừa*) Đăng nhập một lần thông qua tài khoản Google. |
| **UC_AUTH_04** | Quản lý hồ sơ & sở thích | Người dùng đăng ký| vietnamadminunits API| Thiết lập thông tin cá nhân và cấu hình sở thích đi lại. |
| **UC_AUTH_05** | Theo dõi thành viên khác | Người dùng đăng ký| - | Theo dõi hoạt động du lịch của các thành viên cộng đồng. |

---

## 2. Phân hệ Lập lịch trình & Tối ưu lộ trình (Trip Planning)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mô tả ngắn |
| :--- | :--- | :--- | :--- | :--- |
| **UC_TRIP_01** | Quản lý chuyến đi | Người dùng đăng ký| - | Tạo mới, xem, chỉnh sửa hoặc xóa lịch trình chuyến đi. |
| **UC_TRIP_02** | Tạo lịch trình tự động bằng AI| Người dùng đăng ký| OpenAI API | (*Mở rộng*) AI tự động thiết kế lộ trình theo mong muốn. |
| **UC_TRIP_03** | Tối ưu hóa lộ trình ngắn nhất| Người dùng đăng ký| - | (*Mở rộng*) Sắp xếp các điểm dừng trong ngày theo thuật toán TSP. |
| **UC_TRIP_04** | Nhân bản lịch trình công khai | Người dùng đăng ký| - | Sao chép lịch trình của thành viên khác làm bản sao cá nhân. |
| **UC_TRIP_05** | Tìm kiếm lịch trình cộng đồng | Khách vãng lai | - | Khám phá và xem chi tiết lịch trình do người khác chia sẻ. |
| **UC_TRIP_06** | Quản lý lịch sử đi lại thực tế | Người dùng đăng ký| - | Ghi nhận chi phí và đánh giá chuyến đi thực tế đã hoàn thành. |

---

## 3. Phân hệ Mạng xã hội du lịch (Community & Social)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mô tả ngắn |
| :--- | :--- | :--- | :--- | :--- |
| **UC_SOC_01** | Xem bảng tin cộng đồng | Khách vãng lai | - | Đọc các bài viết chia sẻ kinh nghiệm du lịch từ thành viên khác. |
| **UC_SOC_02** | Quản lý bài viết chia sẻ | Người dùng đăng ký| Supabase Storage | Viết bài đăng mới, sửa, xóa các blog/story du lịch kèm ảnh. |
| **UC_SOC_03** | Tương tác bài đăng cộng đồng | Người dùng đăng ký| - | Like, viết bình luận, lưu trữ (bookmark) các bài đăng yêu thích. |
| **UC_SOC_04** | AI gợi ý bạn đồng hành | Người dùng đăng ký| OpenAI API | Sử dụng AI để tìm kiếm bạn đồng hành có cùng sở thích du lịch. |

---

## 4. Phân hệ Bản đồ tương tác & GIS (Interactive Map & GIS)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mô tả ngắn |
| :--- | :--- | :--- | :--- | :--- |
| **UC_MAP_01** | Xem & di chuyển bản đồ | Khách vãng lai | OpenStreetMap | Thao tác xem, kéo, thu phóng bản đồ cơ sở. |
| **UC_MAP_02** | Thay đổi bản đồ nền | Khách vãng lai | OpenStreetMap | Chuyển đổi giữa chế độ đường phố, vệ tinh, tối, sáng, 3D. |
| **UC_MAP_03** | Tìm kiếm vị trí địa lý | Khách vãng lai | OpenStreetMap | Nhập tên và tìm kiếm một địa điểm cụ thể trên bản đồ. |
| **UC_MAP_04** | Lọc danh mục địa điểm | Khách vãng lai | - | Lọc địa danh theo nhóm: Khách sạn, Nhà hàng, Điểm tham quan. |
| **UC_MAP_05** | Xem chi tiết địa điểm du lịch| Khách vãng lai | - | Xem đánh giá, mô tả và hình ảnh cụ thể của địa danh. |
| **UC_MAP_06** | Xem bản đồ nhiệt check-in | Khách vãng lai | - | Hiển thị trực quan mật độ check-in của cộng đồng phượt thủ. |
| **UC_MAP_07** | Định vị vị trí hiện tại | Người dùng đăng ký| - | Lấy tọa độ GPS thực tế của thiết bị người dùng. |
| **UC_MAP_08** | Tìm địa điểm xung quanh | Người dùng đăng ký| - | Khám phá các điểm dịch vụ/du lịch lân cận tâm bản đồ. |
| **UC_MAP_09** | Xem chỉ đường lộ trình | Người dùng đăng ký| OpenStreetMap | Vẽ tuyến đường đi tối ưu di chuyển trên giao diện bản đồ. |
| **UC_MAP_10** | Gợi ý địa điểm bằng AI trên map| Người dùng đăng ký| - | Hiển thị các điểm đến do AI gợi ý cá nhân hóa trực quan trên bản đồ. |
| **UC_MAP_11** | Tìm người lân cận chia sẻ vị trí| Người dùng đăng ký| - | Tìm và định vị các thành viên trực tuyến khác trong bán kính 100km. |
| **UC_MAP_12** | Thực hiện check-in địa điểm | Người dùng đăng ký| Supabase Storage | Tạo check-in (tự điền tên, tải ảnh, tự động định vị tọa độ). |
| **UC_MAP_13** | Xem Community Check-Ins | Khách vãng lai | - | Đọc các bài viết check-in và phản hồi của người dùng khác. |
| **UC_MAP_14** | Xem danh sách sự kiện lễ hội| Khách vãng lai | - | Xem các lễ hội, sự kiện meetup địa phương trên bản đồ. |
| **UC_MAP_15** | Đăng ký tham gia sự kiện | Người dùng đăng ký| - | Đăng ký tham gia một lễ hội hoặc meetup để lưu vào lịch trình. |
| **UC_MAP_16** | Tạo sự kiện địa phương mới | Người dùng đăng ký| - | Tạo một cuộc hẹn, sự kiện giao lưu mới trên bản đồ. |

---

## 5. Phân hệ Trợ lý ảo AI & RAG (AI Chatbot & RAG)

| ID | Tên Use Case | Tác nhân chính | Tác nhân hỗ trợ | Mô tả ngắn |
| :--- | :--- | :--- | :--- | :--- |
| **UC_AI_01** | Chat với trợ lý ảo đa Agent | Người dùng đăng ký| OpenAI API | Hỏi đáp thời tiết, ẩm thực, lịch trình du lịch với trợ lý AI. |
| **UC_AI_02** | Quản lý phiên hội thoại chat | Người dùng đăng ký| - | Xem lại lịch sử các luồng chat và thực hiện xóa luồng chat cũ. |
| **UC_AI_03** | Tái tạo phản hồi đa phiên bản | Người dùng đăng ký| OpenAI API | Yêu cầu sinh lại câu trả lời mới và chuyển đổi giữa các phiên bản. |
| **UC_AI_04** | Đánh giá phản hồi AI | Người dùng đăng ký| - | Thích/Không thích phản hồi và gửi nhận xét để cải thiện trợ lý. |
| **UC_AI_05** | Tra cứu tri thức sâu qua RAG | Người dùng đăng ký| OpenAI API | Tìm kiếm ngữ nghĩa lai dựa trên cơ sở tri thức cục bộ. |
| **UC_AI_06** | Quản lý danh sách món ăn thích | Người dùng đăng ký| - | Lưu các đặc sản địa phương được chatbot gợi ý vào thư viện. |

