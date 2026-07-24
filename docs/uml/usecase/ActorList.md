# Danh sách Tác nhân (Actor List) - Nền tảng SmartTravel (Terraholic)

Tài liệu này định nghĩa chi tiết tất cả các tác nhân (Actors) tương tác với hệ thống SmartTravel, bao gồm Tác nhân con người (Human Actors) và Tác nhân hệ thống/ngoại vi (External Systems).

---

## 1. Tác nhân con người (Human Actors)

### Khách vãng lai (Guest / Anonymous Traveler)
*   **Mô tả**: Người dùng chưa xác thực truy cập vào nền tảng.
*   **Vai trò & Trách nhiệm**:
    *   **Xác thực**: Đăng ký tài khoản mới và kích hoạt tài khoản thông qua mã liên kết email.
    *   **Bản đồ & GIS**: Xem bản đồ cơ sở, thu phóng/di chuyển camera, tra cứu địa điểm và lọc danh mục địa danh (Khách sạn, Nhà hàng, Điểm tham quan). Xem bảng tin check-in cộng đồng.
    *   **Mạng xã hội**: Xem bảng tin chia sẻ kinh nghiệm du lịch công khai của các thành viên khác.
    *   **Lịch trình**: (Không được phép truy cập phân hệ Lập lịch trình).

### Người dùng đăng ký (Registered Traveler)
*   **Mô tả**: Thành viên đã đăng nhập hệ thống, được tiếp cận toàn bộ tính năng cá nhân hóa của nền tảng.
*   **Vai trò & Trách nhiệm**:
    *   Thừa hưởng toàn bộ quyền của **Khách vãng lai**.
    *   **Hồ sơ**: Quản lý thông tin cá nhân, ảnh đại diện, và sở thích du lịch (ngân sách, tốc độ di chuyển, thể loại ưu tiên). Theo dõi hoặc hủy theo dõi (Follow/Unfollow) thành viên khác.
    *   **Lịch trình**:
        *   Tự lên kế hoạch và quản lý các chuyến đi cá nhân (Trips) thông qua CRUD chuyến đi và custom itineraries hành trình tự do.
        *   Tạo lịch trình tự động bằng AI và tối ưu hóa lộ trình ngắn nhất (TSP Solver).
        *   Xem gợi ý điểm dừng từ AI và lưu vào kế hoạch chuyến đi.
        *   Quản lý lịch sử đi lại thực tế (Nhật ký di chuyển - Travel History).
    *   **Mạng xã hội**: Tạo mới, chỉnh sửa, xóa các bài viết chia sẻ kinh nghiệm du lịch (Blogs/Stories), tương tác thích/bình luận/lưu bài viết của người khác. Sử dụng AI để tìm kiếm bạn đồng hành tương thích.
    *   **Bản đồ & GIS**:
        *   Định vị vị trí hiện tại trên bản đồ, cập nhật vị trí live qua WebSocket.
        *   Thực hiện check-in địa điểm thực tế (tự điền tên địa điểm tùy chọn, tải lên hình ảnh và lời bình).
        *   Tạo sự kiện meetup mới.
    *   **AI Chatbot**: Tra cứu tri thức, thời tiết, món ăn đặc sản qua AI Multi-Agent, đánh giá câu trả lời và lưu danh sách món ăn yêu thích.


## 2. Tác nhân hệ thống và ngoại vi (External Systems)

### Firebase Auth / Firebase Admin SDK
*   **Mô tả**: Dịch vụ xác thực ngoại vi hỗ trợ xác thực tokens Google SSO phía máy chủ.

### OpenStreetMap (OSM Nominatim API)
*   **Mô tả**: Dịch vụ bản đồ nền và geocoding hỗ trợ hiển thị giao diện bản đồ, tìm kiếm tọa độ địa danh và định vị ngược địa chỉ.

### OpenAI API / Groq API
*   **Mô tả**: Dịch vụ trí tuệ nhân tạo (LLM và Embeddings Vector) phục vụ sinh lịch trình tự động, phân tích bạn đồng hành, suy luận chatbot đa Agent và trích xuất vector embeddings RAG.

### vietnamadminunits API
*   **Mô tả**: Dịch vụ chuẩn hóa phân cấp hành chính của Việt Nam để phân tích các chuỗi địa chỉ đầu vào thành Tỉnh/Huyện/Xã chính xác.

### SMTP Mail Server
*   **Mô tả**: Máy chủ gửi thư điện tử giúp chuyển phát mã kích hoạt hoặc liên kết xác thực tài khoản qua email.

### Supabase Storage
*   **Mô tả**: Kho lưu trữ tệp đám mây (Cloud Bucket) để lưu trữ hình ảnh check-in địa điểm và hình ảnh bài viết du lịch của người dùng.
