# Tài liệu Đặc tả các Trường hợp Sử dụng (Use Case Specification) - SmartTravel (Terraholic)

Tài liệu này cung cấp mô tả chi tiết (đặc tả) về mục tiêu, kịch bản tương tác và các quy tắc nghiệp vụ cho các ca sử dụng cốt lõi của nền tảng **SmartTravel (Terraholic)**.

---

## 1. Phân hệ Xác thực & Thành viên

### UC_AUTH_03: Đăng nhập tài khoản
*   **Mã ca sử dụng**: UC_AUTH_03
*   **Tên ca sử dụng**: Đăng nhập tài khoản (Log In)
*   **Mục tiêu**: Xác thực danh tính người dùng để cho phép truy cập các tính năng cá nhân hóa (quản lý chuyến đi, check-in, chat với trợ lý ảo).
*   **Tác nhân chính**: Khách vãng lai (Guest)
*   **Tác nhân hỗ trợ**: Firebase Auth (đối với đăng nhập Google SSO)
*   **Tiền điều kiện**: Người dùng đã sở hữu tài khoản hoạt động trong hệ thống hoặc tài khoản Google.
*   **Tác nhân kích hoạt**: Người dùng bấm nút "Đăng nhập" tại trang đăng nhập.
*   **Kịch bản chính (Main Success Scenario)**:
    1. Người dùng truy cập trang Đăng nhập, nhập Email và Mật khẩu.
    2. Người dùng nhấn nút "Đăng nhập".
    3. Back-End kiểm tra sự tồn tại của email trong CSDL.
    4. Back-End giải mã mật khẩu mã hóa (sử dụng bcrypt) và đối chiếu với hash trong CSDL.
    5. Hệ thống khởi tạo Access Token (hạn 15 phút) và Refresh Token (hạn 7 ngày).
    6. Hệ thống lưu Refresh Token vào HTTP-Only Cookie và trả Access Token về cho Front-End.
    7. Giao diện Front-End chuyển hướng người dùng sang trang chủ cá nhân.
*   **Luồng thay thế (Alternative Flows)**:
    *   *Đăng nhập Google SSO (Alternative Flow A)*:
        1. Tại trang đăng nhập, người dùng nhấn nút "Đăng nhập bằng Google".
        2. SDK Firebase Auth hiển thị popup yêu cầu người dùng xác thực tài khoản Google.
        3. Firebase trả về một chuỗi `idToken` cho client.
        4. Front-End gửi `idToken` này lên API `/api/v1/auth/google`.
        5. Back-End dùng Firebase Admin SDK giải mã token, xác minh tính hợp lệ.
        6. Nếu email chưa từng đăng ký, hệ thống tự động tạo tài khoản mới. Tiếp tục bước 5, 6, 7 của kịch bản chính.
*   **Luồng ngoại lệ (Exception Flows)**:
    *   *Sai thông tin mật khẩu*: Tại bước 4, nếu sai mật khẩu, hệ thống trả về lỗi `401 Unauthorized` kèm thông báo "Sai địa chỉ email hoặc mật khẩu".
    *   *Tài khoản chưa xác thực*: Nếu tài khoản chưa kích hoạt qua email, hệ thống yêu cầu xác thực trước khi cho phép đăng nhập.
*   **Hậu điều kiện**: Phiên đăng nhập được thiết lập, người dùng sở hữu Access Token hoạt động.

---

## 2. Phân hệ Lập lịch trình & Tối ưu lộ trình

### UC_TRIP_02: Tạo lịch trình tự động bằng AI
*   **Mã ca sử dụng**: UC_TRIP_02
*   **Tên ca sử dụng**: Tạo lịch trình tự động bằng AI (AI Itinerary Generation)
*   **Mục tiêu**: Giúp thành viên tự động thiết kế lịch trình du lịch chi tiết theo yêu cầu thông qua Trí tuệ nhân tạo.
*   **Tác nhân chính**: Người dùng đăng ký (Registered Traveler)
*   **Tác nhân hỗ trợ**: OpenAI API (Dịch vụ mô hình ngôn ngữ lớn)
*   **Tiền điều kiện**: Người dùng đã đăng nhập thành công vào hệ thống.
*   **Tác nhân kích hoạt**: Người dùng bấm nút "Tạo lịch trình bằng AI" trên màn hình quản lý chuyến đi.
*   **Kịch bản chính (Main Success Scenario)**:
    1. Người dùng nhập các tham số chuyến đi: Địa điểm đích (Tỉnh/Thành phố), Số ngày đi, Ngân sách dự kiến và Sở thích ưu tiên.
    2. Người dùng nhấn nút "Tạo bằng AI".
    3. Hệ thống gửi yêu cầu kèm prompt cấu trúc tới mô hình ngôn ngữ lớn (OpenAI API).
    4. OpenAI API xử lý và trả về cấu trúc dữ liệu JSON biểu diễn lịch trình chi tiết (từng ngày, các điểm dừng, mô tả hoạt động, ước tính chi phí, kinh độ/vĩ độ).
    5. Back-End nhận dữ liệu, lưu chuyến đi mới ở trạng thái bản nháp (Draft) và liên kết với tài khoản người dùng.
    6. Giao diện hiển thị lịch trình AI chi tiết trực quan theo dòng thời gian và các mốc đánh dấu trên bản đồ.
    7. Người dùng bấm "Lưu lịch trình" để hoàn tất.
*   **Luồng thay thế (Alternative Flows)**:
    *   *Tái tạo một phân đoạn (Alternative Flow A)*: Tại bước 6, người dùng chọn một ngày cụ thể và bấm "Tải lại ngày này". Hệ thống gọi lại OpenAI để sinh các gợi ý thay thế chỉ cho phân đoạn đó.
*   **Luồng ngoại lệ (Exception Flows)**:
    *   *Lỗi phản hồi AI hoặc Timeout*: Tại bước 4, nếu API OpenAI không phản hồi hoặc trả về định dạng sai cấu trúc, hệ thống trả về thông báo "Không thể sinh lịch trình lúc này, vui lòng thử lại sau".
*   **Hậu điều kiện**: Lịch trình mới được tạo và lưu trữ thành công trong CSDL.

---

## 3. Phân hệ Bản đồ tương tác & GIS

### UC_MAP_12: Thực hiện check-in địa điểm
*   **Mã ca sử dụng**: UC_MAP_12
*   **Tên ca sử dụng**: Thực hiện check-in địa điểm (Perform Check-in)
*   **Mục tiêu**: Cho phép người dùng đánh dấu sự có mặt thực tế tại một địa điểm, lưu lại ghi chú, hình ảnh và hiển thị lên bản đồ cộng đồng.
*   **Tác nhân chính**: Người dùng đăng ký (Registered Traveler)
*   **Tác nhân hỗ trợ**: Supabase Storage (Lưu trữ ảnh), OpenStreetMap (Geocoding)
*   **Tiền điều kiện**: Người dùng đã đăng nhập và đồng ý cấp quyền định vị vị trí cho trình duyệt/ứng dụng.
*   **Tác nhân kích hoạt**: Người dùng mở hộp thoại Check-in trên bản đồ.
*   **Kịch bản chính (Main Success Scenario)**:
    1. Người dùng nhập tên địa điểm check-in (tự điền tùy ý) và viết lời bình/ghi chú.
    2. Người dùng chọn tải lên hình ảnh chụp thực tế (tùy chọn).
    3. Hệ thống tự động truy vấn tọa độ GPS hiện tại của thiết bị người dùng.
    4. Người dùng bấm nút "Đăng Check-In".
    5. Hệ thống tải hình ảnh (nếu có) lên **Supabase Storage** để lấy liên kết ảnh công khai.
    6. Hệ thống tạo bản ghi `Destination` mới dựa trên tên địa điểm tự điền và tọa độ GPS thu được.
    7. Hệ thống tạo bản ghi `CheckIn` liên kết tài khoản người dùng với `Destination` vừa tạo.
    8. Hệ thống phản hồi thành công, tự động di chuyển camera bản đồ đến ghim check-in mới và cập nhật bảng tin hoạt động bên phải.
*   **Luồng thay thế (Alternative Flows)**:
    *   *Sử dụng tâm bản đồ làm dự phòng (Alternative Flow A)*: Tại bước 3, nếu người dùng từ chối quyền định vị GPS, hệ thống sử dụng tọa độ trung tâm hiện tại của màn hình bản đồ làm vị trí check-in dự phòng.
*   **Luồng ngoại lệ (Exception Flows)**:
    *   *Tải ảnh thất bại*: Tại bước 5, nếu tải ảnh lên Supabase thất bại, hệ thống hủy luồng và báo lỗi "Không thể tải lên hình ảnh, vui lòng thử lại".
*   **Hậu điều kiện**: Bản ghi check-in được ghi nhận công khai, hiển thị marker màu đỏ trên bản đồ.

---

## 4. Phân hệ Trợ lý ảo AI & RAG

### UC_AI_01: Chat với trợ lý ảo đa Agent
*   **Mã ca sử dụng**: UC_AI_01
*   **Tên ca sử dụng**: Chat với trợ lý ảo đa Agent (Chat with AI Assistant)
*   **Mục tiêu**: Hỗ trợ người dùng tra cứu thông tin du lịch, thời tiết, ẩm thực và đánh giá điểm đến thông qua hệ thống chatbot đa tác nhân thông minh.
*   **Tác nhân chính**: Người dùng đăng ký (Registered Traveler)
*   **Tác nhân hỗ trợ**: OpenAI API (Dịch vụ suy luận mô hình ngôn ngữ lớn)
*   **Tiền điều kiện**: Người dùng đã đăng nhập vào hệ thống.
*   **Tác nhân kích hoạt**: Người dùng mở khung Chatbot và gửi tin nhắn câu hỏi.
*   **Kịch bản chính (Main Success Scenario)**:
    1. Người dùng nhập câu hỏi vào khung chat (ví dụ: "Thời tiết hôm nay ở Cà Mau thế nào và có món gì ngon?") và nhấn nút gửi.
    2. Hệ thống phân tích ý định (Intent) và chuyển đến Agent điều phối (Routing Agent).
    3. Routing Agent gọi các Agent chuyên biệt tương ứng:
        *   Gọi Weather Agent lấy thông tin thời tiết thời gian thực.
        *   Gọi RAG Food Agent tra cứu cơ sở tri thức món ăn đặc sản địa phương từ cơ sở dữ liệu vector.
    4. Các Agent tổng hợp kết quả gửi về cho LlmGeneratorService để soạn thảo câu trả lời tự nhiên.
    5. Giao diện Chatbot hiển thị câu trả lời hoàn chỉnh kèm các gợi ý địa điểm thực tế liên quan.
*   **Luồng thay thế (Alternative Flows)**: Không có.
*   **Luồng ngoại lệ (Exception Flows)**:
    *   *Không kết nối được dịch vụ AI*: Tại bước 3 hoặc 4, nếu dịch vụ OpenAI bị lỗi hoặc ngắt kết nối, chatbot hiển thị thông báo lỗi "Xin lỗi, trợ lý ảo đang gặp sự cố kết nối. Vui lòng thử lại sau".
*   **Hậu điều kiện**: Lịch sử hội thoại được lưu lại trong CSDL để người dùng có thể xem lại sau này.
