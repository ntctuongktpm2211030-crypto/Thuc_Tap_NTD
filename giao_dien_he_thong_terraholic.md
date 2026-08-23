# BẢNG TỔNG HỢP VÀ MÔ TẢ CHI TIẾT CÁC GIAO DIỆN HỆ THỐNG TERRAHOLIC

---

## I. BẢNG TỔNG QUAN THỐNG KÊ (SUMMARY)

| Hạng mục thống kê | Số lượng | Chi tiết ghi chú |
| :--- | :---: | :--- |
| **Tổng số màn hình / giao diện** | **27 giao diện** | Từ mục `3.4.1` đến `3.4.27` (Đã tách riêng từng bước đăng bài) |
| **Tổng số hình ảnh minh họa** | **27 hình ảnh** | Khớp 1-1 từ `Hình 3.18` đến `Hình 3.44` |
| **Phân hệ Lữ khách / Người dùng** | **21 giao diện** | Giao diện từ Trang chủ, Khám phá, Cẩm nang, Bản đồ, Lập kế hoạch, Đăng bài (5 trang), Trợ lý ảo, Lưu trữ, Hồ sơ cá nhân đến Đăng ký / Đăng nhập |
| **Phân hệ Quản trị viên (Admin)** | **6 giao diện** | Giao diện từ Đăng nhập Admin, Thống kê Dashboard, Quản lý người dùng, Quản lý bài viết, Quản lý cẩm nang đến Xem Log nhật ký |

---

## II. DANH SÁCH TỔNG HỢP 27 GIAO DIỆN HỆ THỐNG (FULL INTERFACE LIST)

| STT | Mã Mục | Tên Giao Diện Màn Hình | Mã & Tên Hình Ảnh Minh Họa | Tóm Tắt Chức Năng Chính |
| :---: | :---: | :--- | :--- | :--- |
| **1** | **3.4.1** | Giao diện trang chủ | **Hình 3.20.** Giao diện trang chủ | Bảng tin xã hội kết nối lữ khách, bố cục 3 cột (Header tìm kiếm, Thẻ hồ sơ & Thống kê lữ khách, Feed bài viết cộng đồng, Bảng xếp hạng hot, Footer). |
| **2** | **3.4.2** | Giao diện trang khám phá | **Hình 3.33.** Giao diện trang khám phá | Trung tâm tra cứu bài viết & cẩm nang du lịch (Banner truyền cảm hứng, Ô tìm kiếm đa năng, Bộ lọc bán kính/vùng miền, Thẻ bài nổi bật & Lưới bài viết). |
| **3** | **3.4.3** | Giao diện trang xem chi tiết bài viết | **Hình 3.34.** Giao diện trang chi tiết bài viết | Xem nhật ký chuyến đi chi tiết (Carousel Slider trình chiếu ảnh, Nút Thích/Lưu/Chia sẻ, Bình luận phân tầng thụt lề thời gian thực, Lightbox toàn màn hình). |
| **4** | **3.4.4** | Giao diện cẩm nang tri thức du lịch | **Hình 3.21.** Giao diện cẩm nang tri thức du lịch | Thư viện số hóa tri thức 63 tỉnh thành (Banner hero thống kê số liệu, Ô tìm kiếm/Lọc chủ đề, Lưới thẻ tỉnh thành nghệ thuật, Trợ lý ảo AI Chatbot Sidebar). |
| **5** | **3.4.5** | Giao diện trang chi tiết cẩm nang văn hóa | **Hình 3.35.** Giao diện trang chi tiết cẩm nang văn hóa | Trang chi tiết tri thức tỉnh thành (Banner toàn cảnh, Sách tri thức 3D lật trang thực tế, Bộ lọc Thắng cảnh/Di tích/Lễ hội, Dải thẻ địa danh & Modal thuyết minh). |
| **6** | **3.4.6** | Giao diện trang chi tiết địa danh du lịch | **Hình 3.36.** Giao diện trang chi tiết địa danh du lịch | Pop-up Modal chi tiết địa danh du lịch (Badge THẮNG CÀNH, ảnh HD độ phân giải cao, bài thuyết minh địa lý & giá trị du lịch, khóa cuộn trang nền, phím ESC). |
| **7** | **3.4.7** | Giao diện bản đồ | **Hình 3.22.** Giao diện bản đồ | Bản đồ tương tác & GIS thời gian thực (Sidebar tìm kiếm & Đề xuất AI lân cận, Khung bản đồ đa chế độ lớp nền/thời tiết/lễ hội, Thuật toán TSP, Check-in cộng đồng). |
| **8** | **3.4.8** | Giao diện quản lý kế hoạch | **Hình 3.23.** Giao diện quản lý kế hoạch | Tạo lịch trình du lịch thông minh bằng AI (GPT-4o & Hybrid RAG & TSP, Form nhập điểm đến/ngân sách/sở thích, Đồ họa 3D Parallax, Thư viện lịch sử chuyến đi). |
| **9** | **3.4.9** | Giao diện quản lý kế hoạch chi tiết | **Hình 3.37.** Giao diện quản lý kế hoạch chi tiết | Màn hình hiển thị kết quả AI lộ trình thực tế (Khối tổng phân bổ kinh phí 3 danh mục, Tab chia ngày du lịch, Thẻ hoạt động kèm Google Maps/chỉ đường, Bản đồ GIS thu nhỏ). |
| **10** | **3.4.10** | Giao diện đăng bài viết hành trình - Trang 1 | **Hình 3.24.** Giao diện đăng bài viết hành trình trang 1 | Bước 1: Nhập tiêu đề, đoạn tóm tắt mở đầu, nội dung nhật ký chi tiết, chọn phong cách bài viết (Chia sẻ nhanh/Magazine/Hero), danh mục, thẻ hashtag & quyền riêng tư. |
| **11** | **3.4.11** | Giao diện đăng bài viết hành trình - Trang 2 | **Hình 3.25.** Giao diện đăng bài viết hành trình trang 2 | Bước 2: Tải lên và quản lý ảnh bìa bắt buộc (tối đa 10MB), bộ sưu tập album ảnh chuyến đi (tối đa 10 ảnh), video hành trình (tối đa 5 video) kèm khung gợi ý tối ưu. |
| **12** | **3.4.12** | Giao diện đăng bài viết hành trình - Trang 3 | **Hình 3.26.** Giao diện đăng bài viết hành trình trang 3 | Bước 3: Tìm kiếm và đánh dấu danh sách điểm di chuyển nối tuyến trên bản đồ GIS tương tác, thiết lập ngày bắt đầu/kết thúc, tổng ngân sách, hình thức & phương tiện. |
| **13** | **3.4.13** | Giao diện đăng bài viết hành trình - Trang 4 | **Hình 3.27.** Giao diện đăng bài viết hành trình trang 4 | Bước 4: Xây dựng danh sách hoạt động cụ thể theo từng ngày và mốc thời gian (Sáng, Trưa, Chiều, Tối), bổ sung các mẹo du lịch thực tế hữu ích cho cộng đồng. |
| **14** | **3.4.14** | Giao diện đăng bài viết hành trình - Trang 5 | **Hình 3.28.** Giao diện đăng bài viết hành trình trang 5 | Bước 5: Tùy biến kiểu chữ, màu sắc thẻ bài viết, hiển thị xem trước thời gian thực (Live Preview) trên bảng tin, lưu bản nháp hoặc hoàn tất nút "Đăng bài viết hành trình". |
| **15** | **3.4.15** | Giao diện trang trợ lý ảo | **Hình 3.38.** Giao diện trang trợ lý ảo | Khung trò chuyện tư vấn AI Chatbot du lịch (Lịch sử hội thoại bên trái, Khung trò chuyện AI bên phải, tư vấn lịch trình/ẩm thực/văn hóa, tự động lưu lịch sử). |
| **16** | **3.4.16** | Giao diện trang bài viết đã lưu | **Hình 3.29.** Giao diện trang bài viết đã lưu | Bộ sưu tập Bookmark cá nhân 3 cột (Sidebar hồ sơ & điều hướng, Kho lưu trữ 4 tab Bài viết/1 tab Check-in/5 tab Hành trình, Lưới thẻ sang trọng, Sidebar xu hướng). |
| **17** | **3.4.17** | Giao diện trang hồ sơ cá nhân | **Hình 3.30.** Giao diện trang hồ sơ cá nhân | Màn hình trang cá nhân lữ khách (Ảnh bìa Panorama, Avatar, Nút Chỉnh sửa & Theo dõi, Thanh Tab góc nhìn dữ liệu cá nhân, Sidebar thông tin, Feed đăng bài cá nhân). |
| **18** | **3.4.18** | Giao diện chỉnh sửa thông tin cá nhân | **Hình 3.31.** Giao diện model trang chỉnh sửa hồ sơ cá nhân | Cửa sổ Pop-up chỉnh sửa hồ sơ (Tiêu đề & nút ✕ đóng nhanh, Form cập nhật Họ tên/Quê quán/Giới thiệu, Nút Lưu thay đổi đồng bộ tức thì qua API). |
| **19** | **3.4.19** | Giao diện trang danh sách theo dõi | **Hình 3.32.** Giao diện trang danh sách theo dõi | Quản lý mối quan hệ xã hội (Nút ← Về trang cá nhân, Tab Đang theo dõi / Người theo dõi, Ô tìm kiếm danh bạ thời gian thực, Thẻ danh thiếp kèm nút tương tác 👤+ Đã theo dõi). |
| **20** | **3.4.20** | Giao diện đăng nhập | **Hình 3.18.** Giao diện đăng nhập | Màn hình xác thực tài khoản (Đăng nhập Google OAuth / Email Mật khẩu, tự động điều hướng khi thành công, thông báo lỗi chi tiết khi sai, tiện ích Ghi nhớ/Quên mật khẩu OTP). |
| **21** | **3.4.21** | Giao diện đăng ký | **Hình 3.19.** Giao diện đăng ký | Màn hình khởi tạo tài khoản lữ khách (Đăng ký nhanh Google / Email thủ công, gửi và xác thực mã OTP Email 6 chữ số, đồng ý Điều khoản & Chính sách, thông báo lỗi thiếu thông tin). |
| **22** | **3.4.22** | Giao diện trang đăng nhập admin | **Hình 3.39.** Giao diện trang đăng nhập admin | Màn hình đăng nhập Cổng quản trị viên (Form nhập Email/Tên đăng nhập Admin & Mật khẩu Admin, nút "Đăng Nhập Trang Quản Trị", chuyển sang Admin Dashboard khi hợp lệ). |
| **23** | **3.4.23** | Giao diện trang thống kê nền tảng | **Hình 3.40.** Giao diện trang thống kê nền tảng | Trung tâm giám sát Admin Dashboard Overview (Các thẻ chỉ số KPI thời gian thực, Biểu đồ đường tăng trưởng người dùng, biểu đồ tròn phân bổ chủ đề, Top điểm đến hot, Cảnh báo vắng mặt >180 ngày & Báo cáo vi phạm). |
| **24** | **3.4.24** | Giao diện trang quản lý người dùng | **Hình 3.41.** Giao diện trang quản lý người dùng | Phân hệ quản lý tài khoản người dùng (Ô tìm kiếm Email/Họ tên, Bộ lọc trạng thái xác thực, Sắp xếp thời hạn chưa truy cập, Làm mới dữ liệu, Thao tác đổi vai trò & Xóa tài khoản cascade). |
| **25** | **3.4.25** | Giao diện trang quản lý bài viết | **Hình 3.42.** Giao diện trang quản lý bài viết | Phân hệ kiểm duyệt bài viết cộng đồng (Thẻ chỉ số thống kê bài đăng, Ô tìm kiếm từ khóa, Bộ lọc Tất cả/Có ảnh/Có vị trí/Bị báo cáo 🚩, Nút xem chi tiết 👁️ & Xóa bài viết vi phạm 🗑️). |
| **26** | **3.4.26** | Giao diện trang quản lý cẩm nang | **Hình 3.43.** Giao diện trang quản lý cẩm nang | Phân hệ quản lý CSDL tri thức cẩm nang (Thẻ thống kê 63 tỉnh thành/di tích/văn hóa/ẩm thực, Ô tìm kiếm địa danh/tài liệu, Lọc loại tệp Word/PDF/JSON/cẩm nang, Thao tác Thêm mới/Sửa/Xóa mục tri thức). |
| **27** | **3.4.27** | Giao diện trang xem Log nhật ký | **Hình 3.44.** Giao diện trang xem Log nhật ký | Phân hệ giám sát nhật ký lịch sử quản trị (Ô tìm kiếm log/người thực hiện/thời gian, Bộ lọc danh mục thao tác, Lọc tác nhân Admin/AI Engine, Nút Xóa bộ lọc, Làm mới Log với mốc thời gian Giờ:Phút Ngày/Tháng/Năm). |

---

## III. NỘI DUNG MÔ TẢ CHI TIẾT THEO LUỒNG SỬ DỤNG

### 3.4.1. Giao diện trang chủ
- **Mã / Tên hình:** Hình 3.20. Giao diện trang chủ
- **Mô tả chi tiết:**
  Màn hình Trang chủ là giao diện trung tâm của hệ thống Terraholic, đóng vai trò là bảng tin xã hội kết nối cộng đồng lữ khách và tổng hợp thông tin du lịch thông minh. Giao diện được thiết kế theo bố cục 3 cột hiện đại, tối ưu cho việc tra cứu và tương tác:
  - **Thanh điều hướng chung (Header):** Tích hợp công cụ tìm kiếm toàn hệ thống ("Tìm điểm đến, câu chuyện, bạn đồng hành..."), chuyển đổi ngôn ngữ (Việt - Anh), giao diện sáng/tối, trung tâm thông báo và danh mục điều hướng chính (Trang chủ, khám phá, cẩm nang, bản đồ, quản lý kế hoạch, trợ lý ảo, đăng bài, đã lưu).
  - **Cột trái (Hồ sơ & Điều hướng nhanh):** Hiển thị thẻ tóm tắt thông tin cá nhân của lữ khách (ảnh đại diện, vị trí, số bài viết, chuyến đi, lượt theo dõi), lối tắt truy cập các tính năng cốt lõi và bảng thống kê tổng quan cộng đồng (10K+ thành viên, 500+ điểm đến, 50K+ bài viết).
  - **Khu vực trung tâm (Bảng tin bài viết):**
    - Khung khởi tạo bài viết nhanh cho phép lữ khách chia sẻ câu chuyện, mẹo du lịch hoặc địa điểm check-in.
    - Thanh bộ lọc bài viết theo từng chủ đề (Đang theo dõi, phiêu lưu, ẩm thực, sang trọng, văn hóa...).
    - Danh sách các bài viết từ cộng đồng được trình bày đa dạng theo nhiều bố cục (Magazine bìa lớn, lưới ảnh nghệ thuật, bài chia sẻ nhanh). Mỗi bài viết tích hợp đầy đủ thông tin vị trí check-in, tác giả, nút "Theo dõi", cùng các tương tác thời gian thực (Thích, bình luận, lưu bài viết, chia sẻ).
  - **Cột phải (Tiện ích mở rộng):** Cung cấp bảng xếp hạng điểm đến hot theo tháng và danh sách gợi ý bạn đồng hành giúp kết nối các lữ khách có cùng sở thích du lịch.
  - **Chân trang (Footer):** Cung cấp thông tin tổng quan về nền tảng Terraholic, danh mục dịch vụ (Ẩm thực, văn hóa, trải nghiệm), các liên kết hữu ích (Chính sách bảo mật, điều khoản sử dụng), kênh kết nối mạng xã hội và khung đăng ký nhận bản tin du lịch qua Email.

---

### 3.4.2. Giao diện trang khám phá
- **Mã / Tên hình:** Hình 3.33. Giao diện trang khám phá
- **Mô tả chi tiết:**
  Màn hình khám phá là trung tâm tra cứu nội dung, chia sẻ trải nghiệm và gợi ý cẩm nang du lịch đa dạng trên nền tảng Terraholic. Giao diện được thiết kế theo cấu trúc bài báo điện tử sang trọng với các khối chức năng chính:
  - **Khung banner chính & Thanh tìm kiếm thông minh:**
    - Banner phong cảnh ấn tượng truyền tải thông điệp "Khám phá câu chuyện du lịch".
    - Ô tìm kiếm đa năng cho phép tra cứu thời gian thực theo vị trí địa danh, đặc sản ẩm thực, di sản văn hóa hoặc tên tác giả.
    - Thanh thẻ phân loại nhanh các nhóm chủ đề nổi bật: Thiên nhiên, ẩm thực, phiêu lưu, Văn hóa, Biển đảo, Nghỉ dưỡng...
  - **Cột bảng điều khiển bộ lọc chuyên sâu (Smart Filters Sidebar - Cột trái):**
    - Định vị bán kính: Cho phép lọc bài viết theo vị trí tọa độ hiện tại của lữ khách và khoảng cách địa lý (km).
    - Bộ tiêu chí sắp xếp & Vùng miền: Hỗ trợ phân loại bài viết theo mới nhất, được yêu thích nhất, đọc nhanh (<5 phút) và lọc theo lãnh thổ địa lý (Miền Bắc, miền Trung, miền Nam).
    - Bộ lọc chủ đề chi tiết: Cho phép chọn lọc bài đăng theo danh mục điểm đến (Hà Nội, Sapa, Hạ Long...), món ăn bản địa (Phở, Bún chả, Cơm tấm...) hoặc loại hình văn hóa (Lễ hội, di sản UNESCO, làng nghề...).
  - **Khu vực bài viết & Nhật ký cộng đồng:**
    - Thẻ bài viết nổi bật (Featured Banner Card): Tự động đề cử bài đăng chất lượng cao ở vị trí ưu tiên, trình diễn hình ảnh sắc nét, nhãn danh mục, tác giả và nút đọc bài viết.
    - Lưới cấu chuyện mới từ cộng đồng: Trình diễn danh sách bài đăng từ các lữ khách dưới dạng thẻ bài báo mạng xã hội. Mỗi thẻ tích hợp ảnh bìa độ phân giải cao, nhãn lộ trình địa phương, ước tính thời gian đọc, avatar tác giả và lượt thích tương tác.

---

### 3.4.3. Giao diện trang xem chi tiết bài viết
- **Mã / Tên hình:** Hình 3.34. Giao diện trang chi tiết bài viết
- **Mô tả chi tiết:**
  Người dùng cần truy cập màn hình chi tiết bài viết khám phá để xem trọn vẹn nhật ký chuyến đi, bộ trình chiếu ảnh chất lượng cao và tham gia thảo luận phân tầng tương tác. Khi truy cập vào trang chi tiết bài viết, giao diện bài viết đơn cột chuyên nghiệp sẽ hiển thị toàn bộ thông tin hành trình bao gồm Avatar/Tên tác giả, tuyến đường di chuyển, mốc thời gian đăng, badge chuyên mục, tiêu đề Serif nghệ thuật, khung tóm tắt hành trình và dải thẻ hashtag. Người dùng có thể lựa chọn lướt danh sách ảnh qua bộ trình chiếu carousel Slider (bằng nút mũi tên ‹/› hoặc dải chấm phân trang • o), nhấn nút "Thích" (❤️ 1 lượt thích), nhấn nút "Lưu", bấm nút "Chia sẻ", hoặc nhập câu trả lời vào ô soạn thảo viết bình luận... và nhấn nút "Gửi". Nếu gửi bình luận hoặc phản hồi thành công, hệ thống sẽ tự động chèn câu trả lời thụt lề ngay bên dưới bình luận cha kết hợp nét kẻ dọc nối tầng, tự động tô xanh nhãn gắn thẻ và phát sóng sự kiện thời gian thực để đồng bộ dữ liệu tức thì trên toàn nền tảng. Trường hợp người dùng chưa đăng nhập tài khoản mà thực hiện các tương tác (Thích, bình luận, lưu), hệ thống sẽ hiển thị thông báo yêu cầu xác thực để người dùng đăng nhập và thử lại. Ngoài ra, giao diện hỗ trợ các tiện ích phụ như bộ đếm số ảnh góc phải (Ảnh 1/2), thanh điều hướng quay về (← Khám phá) và chế độ xem ảnh phóng to Lightbox toàn màn hình.

---

### 3.4.4. Giao diện cẩm nang tri thức du lịch
- **Mã / Tên hình:** Hình 3.21. Giao diện cẩm nang tri thức du lịch
- **Mô tả chi tiết:**
  Màn hình cẩm nang tri thức du lịch đóng vai trò là hệ thống thư viện số hóa cơ sở dữ liệu tri thức du lịch Việt Nam, cung cấp thông tin chuẩn hóa về địa lý, di sản văn hóa, danh thắng, ẩm thực đặc sản và lễ hội truyền thống của 63 tỉnh thành trên toàn quốc. Giao diện được cấu trúc trực quan và hỗ trợ tra cứu thông minh:
  - **Khung banner hero & Thống kê tổng quan:** Hiển thị thông điệp giới thiệu cùng các thẻ đếm số liệu thống kê thời gian thực của hệ thống tri thức (bao gồm 63 Tỉnh thành, 556 di tích lịch sử, 494 nét văn hóa và 1.480+ mục tri thức).
  - **Công cụ tìm kiếm & Bộ lọc danh mục:**
    - Ô tìm kiếm từ khóa cho phép tra cứu nhanh tên thắng cảnh, món đặc sản hoặc lễ hội (ví dụ: Núi Cấm, Cù lao Ông Hổ...).
    - Các thẻ lọc danh mục tri thức nhanh theo các chủ đề: Tất cả, di tích - văn hóa, lễ hội, ẩm thực, dân tộc.
  - **Bản đồ hành chính & Thư viện địa phương (Khu vực chính):** Trình bày danh sách các tỉnh thành dưới dạng lưới thẻ địa phương nghệ thuật (Hà Nội, Hà Giang, Cao Bằng, Tuyên Quang, Lào Cai, Điện Biên...). Mỗi thẻ tỉnh thành tích hợp hình ảnh đại danh biểu tượng, mô tả ngắn gọn, số lượng mục tri thức chi tiết và nút truy cập xem chi tiết, đi kèm thanh phân trang điều hướng.
  - **Trợ lý ảo tri thức (Sidebar phải):** Tích hợp công cụ chatbot AI hỗ trợ tra cứu tự động. Người dùng chọn tỉnh thành và nhập câu hỏi thắc mắc (ví dụ: "Thác Bản Giốc ở đâu? Có đặc sản gì..."), hệ thống AI sẽ trích xuất thông tin chính xác từ cơ sở dữ liệu để giải đáp ngay lập tức.

---

### 3.4.5. Giao diện trang chi tiết cẩm nang văn hóa
- **Mã / Tên hình:** Hình 3.35. Giao diện trang chi tiết cẩm nang văn hóa
- **Mô tả chi tiết:**
  Người dùng cần truy cập màn hình chi tiết tỉnh thành và cẩm nang tri thức du lịch để tra cứu kiến thức địa lý, lịch sử, văn hóa truyền thống và danh lam thắng cảnh tiêu biểu của các tỉnh thành Việt Nam. Khi truy cập vào trang chi tiết tỉnh thành, giao diện sẽ hiển thị banner toàn cảnh hùng vĩ kèm thông số diện tích, dân số, cuốn sách tri thức đọc 3D mô phỏng lật trang thực tế hiển thị tổng quan địa lý lịch sử, và phân hệ danh mục thắng cảnh và lễ hội. Người dùng có thể lựa chọn lật các trang sách tri thức để đọc thông tin chi tiết, bấm chuyển đổi giữa các thẻ bộ lọc chuyên mục (Thắng cảnh, di tích, lễ hội), lướt dải thẻ địa danh du lịch, nhấn nút "Xem chi tiết →" tại từng địa danh, hoặc nhấn nút "Quay lại Cẩm nang" ở góc trên bên trái. Nếu người dùng nhấn chọn xem chi tiết một địa danh bất kỳ, hệ thống sẽ mở cửa sổ chi tiết hiển thị hình ảnh đại diện độ phân giải cao, tọa độ địa lý và thuyết minh chi tiết về điểm đến đó. Trường hợp dữ liệu cẩm nang tỉnh thành đang trong quá trình cập nhật hoặc bị gián đoạn kết nối mạng, hệ thống sẽ hiển thị thông báo trạng thái phù hợp kèm danh sách các điểm đến gợi ý thay thế. Ngoài ra, giao diện hỗ trợ các tiện ích phụ như bộ đếm số trang sách, dải chấm tròn chỉ số phân trang thẻ địa danh.

---

### 3.4.6. Giao diện trang chi tiết địa danh du lịch
- **Mã / Tên hình:** Hình 3.36. Giao diện trang chi tiết địa danh du lịch
- **Mô tả chi tiết:**
  Người dùng cần truy cập cửa sổ Chi tiết địa danh du lịch để xem thông tin thuyết minh đầy đủ và hình ảnh phong cảnh chất lượng cao của một địa điểm cụ thể trên nền tảng Terraholic. Khi truy cập vào cửa sổ chi tiết (như hình minh họa Modal địa danh "Cửa khẩu Thanh Thủy"), giao diện Pop-up hiện đại trên lớp nền tối mờ sẽ hiển thị badge phân loại chuyên mục THẮNG CÀNH, tiêu đề địa danh in đậm, hình ảnh đại diện độ phân giải cao và đoạn văn bản thuyết minh chi tiết về vị trí địa lý, quy mô phát triển cùng giá trị du lịch. Người dùng có thể lựa chọn đọc nội dung thuyết minh chi tiết, cuộn xem thông tin, hoặc nhấn nút "✖" ở góc trên bên phải để đóng cửa sổ. Nếu người dùng thực hiện đóng cửa sổ thành công, hệ thống sẽ ẩn Pop-up bằng hiệu ứng mờ dần và tự động đưa người dùng quay trở lại màn hình danh mục địa danh tỉnh thành ban đầu. Trường hợp hình ảnh địa danh gặp sự cố liên kết mạng hoặc chưa tải xong dữ liệu, hệ thống sẽ tự động hiển thị hình ảnh đại diện mặc định theo chuyên mục để đảm bảo tính toàn vẹn giao diện. Ngoài ra, giao diện hỗ trợ các tiện ích phụ như tự động khóa cuộn trang nền phía sau khi Pop-up mở, hỗ trợ đóng nhanh cửa sổ bằng phím ESC và thiết kế viền bo cong hiện đại.

---

### 3.4.7. Giao diện bản đồ
- **Mã / Tên hình:** Hình 3.22. Giao diện bản đồ
- **Mô tả chi tiết:**
  Màn hình bản đồ tương tác & GIS thời gian thực là phân hệ quản lý dữ liệu không gian du lịch của Terraholic, kết hợp giữa công nghệ GIS, định vị toàn cầu GPS và trí tuệ nhân tạo AI để cung cấp trải nghiệm khám phá địa đồ du lịch thông minh. Giao diện được tổ chức khoa học gồm 3 khu vực chính:
  - **Cột công cụ tìm kiếm & Bộ lọc (Sidebar trái):**
    - Ô tra cứu vị trí địa lý, tùy chọn màu sắc đánh dấu ghim địa điểm.
    - Bộ lọc nâng cao theo danh mục (Ẩm thực, di tích, khám phá...) và mức đánh giá sao (Rating).
    - Tính năng đề xuất AI lân cận hỗ trợ đưa ra các vị trí du lịch phù hợp dựa trên tọa độ thực tế của lữ khách.
  - **Khu vực bản đồ tương tác & Lộ trình (Khu vực trung tâm):**
    - Khung hiển thị bản đồ số đa chế độ lớp nền (Đường, vệ tinh, tối, sáng), hỗ trợ các góc nhìn biểu diễn dữ liệu không gian dạng gim, nhóm địa điểm hoặc bản đồ nhiệt (Heatmap).
    - Tích hợp các lớp thông tin GIS chuyên sâu gồm: Lớp thời tiết/khí tượng thời gian thực, vùng cảnh báo an toàn du lịch, và lớp địa điểm diễn ra lễ hội.
    - Bộ công cụ định vị vị trí người dùng, tìm kiếm theo bán kính, tải bản đồ sử dụng ngoại tuyến (Offline) và thuật toán tối ưu hóa tuyến đường (TSP) giúp tự động tính toán hành trình di chuyển qua các điểm dừng tiết kiệm thời gian nhất.
    - Banner hiển thị chuỗi hành trình gợi ý trực quan bên dưới bản đồ, nối các mốc dừng chân theo thứ tự di chuyển tối ưu nhất.
  - **Công cụ Check-in & Nhật ký cộng đồng (Sidebar phải):**
    - Form Check-in địa điểm: Cho phép lữ khách thực hiện check-in trực tiếp tại vị trí hiện tại, đính kèm cảm nhận, gắn thẻ chủ đề (#cafe, #nature, #checkin...) và tải lên tối đa 3 hình ảnh thực tế.
    - Nhật ký Check-in cộng đồng: Bảng tin hiển thị danh sách các lượt check-in thời gian thực từ cộng đồng lữ khách (bao gồm ảnh đại diện chính chủ, thời gian check-in, nội dung ghi chú và hình ảnh đính kèm), tạo sự kết nối tương tác trực tiếp giữa các thành viên.

---

### 3.4.8. Giao diện quản lý kế hoạch
- **Mã / Tên hình:** Hình 3.23. Giao diện quản lý kế hoạch
- **Mô tả chi tiết:**
  Màn hình quản lý kế hoạch là phân hệ hỗ trợ lữ khách thiết lập lịch trình du lịch tự động thông minh bằng công nghệ Trí tuệ nhân tạo (AI - mô hình GPT-4o & Hybrid RAG) kết hợp thuật toán tối ưu hóa tuyến đường (TSP). Giao diện được thiết kế hiện đại, bao gồm 3 khối chức năng chính:
  - **Khung banner Hero giới thiệu công nghệ:** Nằm ở đầu trang, giới thiệu các tính năng công nghệ cốt lõi của công cụ (Tối ưu lộ trình TSP, mô hình GPT-4o & RAG, dữ liệu 63 tỉnh thành) cùng trạng thái hoạt động thời gian thực của trợ lý ảo lộ trình (Live 24/7).
  - **Form nhập thông số hành trình (Khối bên trái):** Cho phép người dùng tùy biến lịch trình cá nhân hóa theo các tiêu chí:
    - Điểm đến: Nhập tên tỉnh thành/địa danh muốn khám phá (ví dụ: Hà Giang, Hà Nội, Sapa...).
    - Số ngày & Kinh phí dự kiến: Thiết lập độ dài chuyến đi và định mức ngân sách (hỗ trợ chuyển đổi đa tiền tệ VND, USD, JPY, EUR).
    - Phong cách & Sở thích du lịch: Lựa chọn kiểu di chuyển (Phiêu lưu, nghỉ dưỡng, độc hành...) và chọn các thẻ sở thích cá nhân (#nature, #culture, #food, #hiking, #photography, #history).
    - Nút bấm "Tạo kế hoạch hành trình" kích hoạt AI tự động phân tích và sinh lịch trình chi tiết từng ngày.
  - **Khung hiển thị thị giác 3D Parallax (Khối trung tâm):** Trình diễn đồ họa Parallax 3D sinh động với thông điệp hướng dẫn lữ khách điền thông tin để tạo hành trình. Khi AI hoàn tất tính năng tạo lộ trình, khu vực này sẽ chuyển sang hiển thị các thẻ hoạt động di chuyển, ăn uống và tham quan theo mốc thời gian thực tế.
  - **Thư viện lịch sử kế hoạch (Khối bên phải):** Cho phép lưu trữ, tìm kiếm và quản lý toàn bộ danh sách các chuyến đi đã từng được khởi tạo trước đó (ví dụ: Khám phá Hà Nội 5 ngày), giúp lữ khách dễ dàng xem lại, chỉnh sửa hoặc lưu lại hành trình yêu thích.

---

### 3.4.9. Giao diện quản lý kế hoạch chi tiết
- **Mã / Tên hình:** Hình 3.37. Giao diện quản lý kế hoạch chi tiết
- **Mô tả chi tiết:**
  Khi thuật toán AI Multi-Agent và RAG hoàn tất quá trình tính toán, giao diện sẽ tự động chuyển từ trạng thái chờ sang Màn hình hiển thị kết quả lộ trình du lịch thực tế. Khu vực trung tâm hiển thị khối tổng phân bổ kinh phí dự kiến (đã được kiểm soát nằm trong định mức ngân sách do người dùng thiết lập) kèm rã chi tiết 3 danh mục chi phí (Ăn uống, di chuyển, dự phòng). Ngay bên dưới là hệ thống Tab phân chia ngày du lịch giúp lữ khách dễ dàng chuyển đổi theo dõi. Mỗi thẻ hoạt động tích hợp nhãn loại hình chi phí, mức giá ước tính, cùng hai nút thao tác nhanh gim mở Google Maps và gim chỉ đường từ điểm trước. Bên phải trang hiển thị phân hệ bản đồ GIS thu nhỏ vẽ đường nối lộ trình di chuyển giữa 6 điểm dừng trên bản đồ, kết hợp bảng lịch sử kế hoạch tích hợp ô tìm kiếm và danh sách các chuyến đi đã khởi tạo trước đó. Ngoài ra, giao diện tích hợp các nút tiện ích điều khiển nhanh như "Tối ưu lộ trình", "Lưu hành trình" và nút "Đổi ngày khẩn cấp".

---

### 3.4.10. Giao diện đăng bài viết hành trình - Trang 1: Thông tin cơ bản & Nội dung (Bước 1)
- **Mã / Tên hình:** Hình 3.24. Giao diện đăng bài viết hành trình trang 1
- **Mô tả chi tiết:**
  Giao diện Bước 1 trong quy trình biên tập bài viết hành trình cho phép lữ khách thiết lập hình thức trình bày bài viết và nhập các thông tin nội dung cốt lõi. Giao diện được chia làm 2 khu vực chính:
  - **Cột giám sát tiến trình (Sidebar trái):** Hiển thị biểu đồ phần trăm hoàn thành bài viết thời gian thực (0% - 20%), danh sách các bước điều hướng Stepper Wizard và bảng checklist kiểm tra tự động các điều kiện hợp lệ của Bước 1 (kiểu hiển thị bài viết, tiêu đề, tóm tắt, nội dung chi tiết).
  - **Khung soạn thảo nội dung (Khối trung tâm):**
    - **Tùy chọn kiểu hiển thị:** Cho phép lữ khách chọn 1 trong 3 phong cách trình bày bài viết (Chia sẻ nhanh, Magazine báo chí, hoặc Hero ảnh bìa toàn màn hình).
    - **Nhập thông tin cơ bản:** Ô nhập Tiêu đề bài viết (bắt buộc), Khung nhập Đoạn tóm tắt mở đầu (dưới 200 từ) và Khung soạn thảo văn bản đa dòng "Nội dung đầy đủ" cho phép viết nhật ký du lịch chi tiết.
    - **Phân loại & Cài đặt:** Chọn danh mục chủ đề du lịch (Văn hóa, ẩm thực, thiên nhiên, sang trọng, phiêu lưu...), chọn cảm xúc/tâm trạng chuyến đi, đánh giá xếp hạng sao (1 - 5 sao), thêm dải thẻ hashtag (#HaGiang, #Sapa Loop...) và thiết lập quyền riêng tư (Công khai cộng đồng, Chỉ bạn bè, hoặc Riêng tư).
    - **Cụm nút điều hướng:** Nút "Tiếp tục: Media ➔" để chuyển tiếp sang Bước 2.

---

### 3.4.11. Giao diện đăng bài viết hành trình - Trang 2: Quản lý Media đa phương tiện (Bước 2)
- **Mã / Tên hình:** Hình 3.25. Giao diện đăng bài viết hành trình trang 2
- **Mô tả chi tiết:**
  Giao diện Bước 2 hỗ trợ lữ khách tải lên và quản lý toàn bộ tệp hình ảnh, video chất lượng cao để tăng tính trực quan cho bài viết hành trình:
  - **Cột giám sát tiến trình (Sidebar trái):** Cập nhật chỉ số hoàn thành bài viết (20% - 40%), đánh dấu xanh hoàn thành Bước 1 và tự động kiểm tra tính hợp lệ của tệp đa phương tiện ở Bước 2.
  - **Khung tải tệp & Quản lý Album (Khối trung tâm):**
    - **Ảnh bìa đại diện (Cover Image):** Khung kéo thả hoặc chọn tệp ảnh bìa bắt buộc (dung lượng tối đa 10MB), hiển thị khung xem trước ảnh bìa kèm nút xóa hoặc thay đổi ảnh khác.
    - **Album ảnh chuyến đi (Photo Gallery):** Khu vực tải lên bộ sưu tập hình ảnh thực tế (tối đa 10 ảnh, định dạng JPG/PNG/WebP). Tích hợp tính năng sắp xếp lại thứ tự ảnh, nhập chú thích cho từng tấm ảnh và nút xóa từng ảnh lẻ.
    - **Video hành trình (Video Upload):** Khung tải tệp video trải nghiệm di chuyển (tối đa 5 video, dung lượng tối đa 100MB/video, hỗ trợ định dạng MP4/WebM).
    - **Khung gợi ý tối ưu truyền thông:** Cung cấp các mẹo chọn ảnh phong cảnh góc rộng, ảnh ánh sáng nét và độ phân giải cao để bài viết thu hút nhiều lượt tương tác trên bảng tin.
    - **Cụm nút điều hướng:** Nút "‹ Quay lại" và nút "Tiếp tục: Vị trí ➔".

---

### 3.4.12. Giao diện đăng bài viết hành trình - Trang 3: Vị trí GIS & Thông số chuyến đi (Bước 3)
- **Mã / Tên hình:** Hình 3.26. Giao diện đăng bài viết hành trình trang 3
- **Mô tả chi tiết:**
  Giao diện Bước 3 kết hợp công nghệ GIS và bản đồ số tương tác để lưu trữ thông tin địa lý và các thông số thực tế của hành trình du lịch:
  - **Cột giám sát tiến trình (Sidebar trái):** Cập nhật tiến độ hoàn thành (40% - 60%), kiểm tra tự động điều kiện đánh dấu vị trí bản đồ và ngày tháng hành trình.
  - **Khung định vị bản đồ & Thông số (Khối trung tâm):**
    - **Công cụ đánh dấu địa điểm GIS:** Ô tìm kiếm địa danh tích hợp gợi ý thời gian thực. Khi lữ khách chọn địa điểm, hệ thống sẽ tự động ghim vị trí chính xác lên bản đồ GIS tương tác và nối tuyến đường di chuyển giữa các điểm dừng chân.
    - **Thông số thời gian chuyến đi:** Ô chọn Ngày bắt đầu và Ngày kết thúc chuyến đi (hỗ trợ công cụ chọn ngày tự động với định dạng DD/MM/YYYY).
    - **Thông số tài chính & Hình thức di chuyển:** Nhập Ngân sách tổng chi phí (VND), lựa chọn Hình thức chuyến đi (Độc hành, Cặp đôi, Nhóm bạn, Gia đình), lựa chọn Phương tiện di chuyển (Xe máy, Ô tô, Máy bay, Xe khách, Xe đạp, Đi bộ) và ghi chú Điều kiện thời tiết thực tế (Nắng đẹp, Se lạnh, Mưa nhẹ...).
    - **Cụm nút điều hướng:** Nút "‹ Quay lại" và nút "Tiếp tục: Lịch trình ➔".

---

### 3.4.13. Giao diện đăng bài viết hành trình - Trang 4: Lịch trình chi tiết & Mẹo du lịch (Bước 4)
- **Mã / Tên hình:** Hình 3.27. Giao diện đăng bài viết hành trình trang 4
- **Mô tả chi tiết:**
  Giao diện Bước 4 cho phép lữ khách xây dựng mốc thời gian chi tiết từng ngày và đóng góp các mẹo du lịch thực tế cho cộng đồng:
  - **Cột giám sát tiến trình (Sidebar trái):** Hiển thị mức độ hoàn thành bài viết (60% - 80%), tự động đánh dấu kiểm duyệt thành công dữ liệu lịch trình ngày và danh sách mẹo.
  - **Khung biên tập lịch trình & Mẹo (Khối trung tâm):**
    - **Hệ thống Tab phân chia ngày (Ngày 1, Ngày 2, Ngày 3...):** Cho phép chọn từng ngày trong hành trình để nhập danh sách hoạt động.
    - **Biểu mẫu hoạt động theo khung giờ:** Nhập chi tiết địa điểm, thời gian di chuyển, hoạt động tham quan/ăn uống theo 4 mốc thời gian (Buổi sáng, Buổi trưa, Buổi chiều, Buổi tối). Hỗ trợ nút "+ Thêm hoạt động" để linh hoạt bổ sung điểm dừng.
    - **Khung đóng góp mẹo du lịch hữu ích (Travel Tips):** Nhập các lưu ý quan trọng thực tế cho người đi sau (ví dụ: Trang phục nên mang, thời điểm săn mây đẹp nhất, lưu ý vé tham quan, lưu ý an toàn giao thông...).
    - **Cụm nút điều hướng:** Nút "‹ Quay lại" và nút "Tiếp tục: Xem trước ➔".

---

### 3.4.14. Giao diện đăng bài viết hành trình - Trang 5: Xem trước & Xuất bản bài viết (Bước 5)
- **Mã / Tên hình:** Hình 3.28. Giao diện đăng bài viết hành trình trang 5
- **Mô tả chi tiết:**
  Giao diện Bước 5 cung cấp công cụ tùy biến thẩm mỹ và hiển thị xem trước thời gian thực (Live Preview) giúp lữ khách kiểm tra toàn diện bài viết trước khi bấm đăng:
  - **Cột giám sát tiến trình (Sidebar trái):** Đạt 100% hoàn thành bài viết, toàn bộ các mục checklist kiểm tra tính hợp lệ đều được tích chọn xanh.
  - **Khung tùy biến & Xem trước bài viết (Khối trung tâm):**
    - **Bộ công cụ tùy chỉnh giao diện (Style Customizer):** Cho phép lữ khách chọn kiểu phông chữ nghệ thuật (Serif, Sans-serif, Cursive), bảng phối màu thẻ bài viết (Mặc định, Pastel, Dark Elegant), bo góc khung hình và chọn vị trí đặt nhãn thông tin.
    - **Khung xem trước thời gian thực (Live Preview Modal):** Hiển thị chính xác giao diện thẻ bài viết hành trình sẽ xuất hiện trên Trang chủ và trang Khám phá, giúp lữ khách rà soát lại tiêu đề, ảnh bìa, danh sách ảnh, thông số chuyến đi và nội dung.
    - **Cụm nút hành động xuất bản:** Nút "Lưu bản nháp" (lưu vào bộ sưu tập cá nhân), nút "‹ Quay lại" để chỉnh sửa nếu cần, và nút hành động nổi bật màu xanh **"Đăng bài viết hành trình"** để chính thức phát sóng bài viết lên cộng đồng Terraholic.

---

### 3.4.15. Giao diện trang trợ lý ảo
- **Mã / Tên hình:** Hình 3.38. Giao diện trang trợ lý ảo
- **Mô tả chi tiết:**
  Người dùng bao gồm Thành viên và Khách tham quan cần truy cập vào hệ thống để sử dụng tính năng Trợ lý ảo AI. Khi người dùng chọn vào mục Trợ lý ảo trên thanh điều hướng, giao diện trò chuyện sẽ hiển thị bao gồm danh sách lịch sử chat bên trái và khung tư vấn AI bên phải. Người dùng tiến hành nhập vào câu hỏi hoặc yêu cầu tư vấn du lịch (về địa điểm, ẩm thực, văn hóa hoặc lịch trình), chọn biểu tượng Gửi để tiến hành gửi tin nhắn. Nếu thông tin hợp lệ, hệ thống sẽ xử lý và hiển thị phản hồi chi tiết từ AI đồng thời lưu cuộc trò chuyện vào lịch sử. Trường hợp thông tin nhập vào để trống hoặc hệ thống gặp sự cố kết nối, người dùng sẽ nhận được thông báo lỗi.

---

### 3.4.16. Giao diện trang bài viết đã lưu
- **Mã / Tên hình:** Hình 3.29. Giao diện trang bài viết đã lưu
- **Mô tả chi tiết:**
  Màn hình bộ sưu tập đã lưu là phân hệ quản lý kho lưu trữ cá nhân của lữ khách trên Terraholic, giúp tổng hợp, phân loại và truy cập nhanh toàn bộ các nội dung du lịch đã được đánh dấu Bookmark trong quá trình trải nghiệm hệ thống. Giao diện sử dụng bố cục 3 cột hiện đại, bao gồm các khu vực chức năng:
  - **Cột thông tin cá nhân & Điều hướng (Sidebar trái):**
    - Thẻ hồ sơ thu nhỏ (Profile Mini Card): Hiển thị avatar, tên người dùng cùng các chỉ số hoạt động (Số bài viết, chuyến đi, người theo dõi).
    - Danh mục điều hướng nhanh đến các trang tính năng (Trang chủ, khám phá, bản đồ xã hội, lên kế hoạch AI, trợ lý ảo) và bảng thống kê quy mô cộng đồng Terraholic.
  - **Khu vực Bộ sưu tập nội dung trung tâm:**
    - Header kho lưu trữ: Hiển thị tổng số lượng mục đã lưu thời gian thực cùng công cụ chuyển đổi chế độ hiển thị dạng lưới hoặc danh sách.
    - Hệ thống Tab Bài viết (4): Lưu trữ các bài đăng chia sẻ kinh nghiệm du lịch, bài báo magazine, hướng dẫn khám phá.
    - Hệ thống Tab địa điểm check-in (1): Quản lý danh sách các điểm dừng chân check-in thực tế trên bản đồ GIS.
    - Hệ thống Tab hành trình (5): Lưu trữ các kế hoạch du lịch chi tiết do trợ lý AI tự động lập cho người dùng.
  - **Lưới hiển thị nội dung:** Trình diễn các thẻ bài viết với thiết kế sang trọng bao gồm hình ảnh bìa sắc nét, nhãn mốc thời gian, thông tin tác giả bài viết, tiêu đề, trích dẫn nội dung, lượt tương tác thích/bình luận, nút xem chi tiết và nút thao tác bỏ lưu.
  - **Cột thông tin bổ trợ & Xu hướng (Sidebar phải):**
    - Điểm đến hot: Bảng xếp hạng các vị trí du lịch đang thu hút nhiều sự quan tâm nhất trong tháng.
    - Gợi ý bạn đồng hành: Đề xuất kết nối với các thành viên nổi bật trong cộng đồng lữ khách kèm nút theo dõi.
    - Chủ đề nổi bật: Danh sách các thẻ hashtag xu hướng (#HaGiang, #SapaLoop, #HoiAn, #StreetFood...) giúp lữ khách lọc nhanh các nội dung du lịch cùng chủ đề.

---

### 3.4.17. Giao diện trang hồ sơ cá nhân
- **Mã / Tên hình:** Hình 3.30. Giao diện trang hồ sơ cá nhân
- **Mô tả chi tiết:**
  Màn hình Trang cá nhân là phân hệ quản lý thông tin hồ sơ và dòng thời gian hoạt động cá nhân của lữ khách trên Terraholic. Giao diện được thiết kế theo phong cách mạng xã hội du lịch hiện đại, tổ chức khoa học với các khu vực chính:
  - **Khung ảnh bìa & Thẻ nhận diện hồ sơ:**
    - Ảnh bìa Panorama: Cho phép tùy chỉnh hình ảnh ảnh nền phong cảnh cá nhân hóa kèm nút chỉnh sửa ảnh bìa.
    - Avatar & Thông tin cơ bản: Hiển thị ảnh đại diện chính chủ, họ tên người dùng, số lượng lượt tương tác mạng xã hội (Đang theo dõi, người theo dõi, quê quán).
    - Các nút chức năng điều chỉnh thông tin: "Chỉnh sửa trang cá nhân" (cập nhật tiểu sử, avatar, quê quán) và "Danh sách theo dõi" (quản lý bạn bè).
  - **Thanh Tab điều hướng nội dung hồ sơ:**
    - Hệ thống các tab cho phép chuyển đổi nhanh các góc nhìn dữ liệu cá nhân gồm: Bài viết (Dòng thời gian bài đăng), giới thiệu, ảnh (thư viện tệp đa phương tiện), hành trình (các chuyến đi đã lên kế hoạch), nhật ký di chuyển và thông báo.
  - **Cột thông tin tổng quan & kết nối (Sidebar trái):**
    - Khối Giới thiệu: Hiển thị lời tự bạch cá nhân, thông tin quê quán và địa chỉ email liên hệ.
    - Bộ sưu tập ảnh: Khung xem trước các hình ảnh đẹp thực tế do lữ khách tải lên trong các chuyến đi.
    - Danh sách đang theo dõi: Khối hiển thị nhanh danh thiếp các thành viên bạn bè mà tài khoản đang bấm theo dõi.
  - **Dòng thời gian & Công cụ đăng bài (Feed trung tâm):**
    - Khung đăng bài nhanh: Cho phép lữ khách chia sẻ ngay cảm nhận, tải lên tệp Ảnh/Video hoặc đính kèm vị trí check-in trực tiếp trên trang cá nhân.
    - Danh sách bài đăng cá nhân: Trình diễn các bài viết đã xuất bản dưới dạng thẻ bài đăng chuyên nghiệp, bao gồm thời gian đăng, nội dung chia sẻ kinh nghiệm, cụm hình ảnh phong cảnh độ phân giải cao và các công cụ tương tác cộng đồng (Thích, bình luận, chia sẻ).

---

### 3.4.18. Giao diện chỉnh sửa thông tin cá nhân
- **Mã / Tên hình:** Hình 3.31. Giao diện model trang chỉnh sửa hồ sơ cá nhân
- **Mô tả chi tiết:**
  Cửa sổ Chỉnh sửa thông tin cá nhân là giao diện tương tác nổi hỗ trợ lữ khách tùy chỉnh và cập nhật các thông tin biểu mẫu hồ sơ cá nhân trên hệ thống Terraholic. Giao diện được thiết kế tối giản, trực quan với các thành phần chính:
  - **Thanh tiêu đề cửa sổ:** Hiển thị biểu tượng cây bút chỉnh sửa, tiêu đề chính "Chỉnh sửa thông tin cá nhân" và nút biểu tượng ✕ cho phép đóng nhanh popup.
  - **Biểu mẫu cập nhật dữ liệu:**
    - Trường họ và tên: Ô nhập trường dữ liệu tên hiển thị chính thức của chủ tài khoản.
    - Trường quê quán / vị trí: Ô nhập thông tin vị trí địa lý hoặc quê quán của lữ khách, hỗ trợ hiển thị vị trí trên trang cá nhân.
    - Trường giới thiệu bản thân: Khung nhập văn bản đa dòng cho phép lữ khách tự do viết các đoạn chia sẻ ngắn, châm ngôn du lịch hoặc sở thích cá nhân.
  - **Cụm nút thao tác:**
    - Nút "Hủy": Cho phép hủy bỏ thao tác và giữ nguyên thông tin ban đầu.
    - Nút "Lưu thay đổi": Nút hành động chính màu xanh nổi bật, thực hiện gửi yêu cầu cập nhật API về máy chủ backend, đồng bộ tức thì các thông tin mới lên giao diện trang cá nhân mà không cần tải lại trang.

---

### 3.4.19. Giao diện trang danh sách theo dõi
- **Mã / Tên hình:** Hình 3.32. Giao diện trang danh sách theo dõi
- **Mô tả chi tiết:**
  Màn hình danh sách theo dõi là phân hệ quản lý mối quan hệ xã hội của lữ khách trên Terraholic, cho phép theo dõi, tương tác và mở rộng mạng lưới bạn đồng hành du lịch. Giao diện được thiết kế theo chuẩn ứng dụng mạng xã hội du lịch hiện đại bao gồm các khu vực chức năng chính:
  - **Khung tiêu đề & Điều hướng nhanh:**
    - Nút bấm điều hướng "← Về trang cá nhân" đặt ở vị trí góc trên cùng bên trái với biểu tượng mũi tên cho phép quay lại trang hồ sơ cá nhân mượt mà.
    - Cụm tiêu đề chính danh sách theo dõi kèm biểu tượng nhóm người dùng 👥 và dòng ghi chú phân loại ("Người bạn đang theo dõi và người theo dõi bạn").
  - **Cụm Tab chuyển đổi phân loại:**
    - Tab đang theo dõi: Đang kích hoạt, thống kê số lượng thành viên mà tài khoản đang bấm theo dõi.
    - Tab người theo dõi: Hiển thị danh sách các tài khoản khác đang bấm theo dõi tài khoản cá nhân.
  - **Khung tìm kiếm danh bạ:** Ô tìm kiếm thời gian thực tích hợp biểu tượng kính lúp, hỗ trợ lữ khách tra cứu nhanh danh sách bạn bè theo họ tên hoặc tên định danh.
  - **Danh sách danh thiếp lữ khách:** Trình diễn các thẻ thành viên dưới dạng dòng danh sách trực quan bao gồm:
    - Ảnh đại diện đại diện chính chủ.
    - Họ tên hiển thị kèm liên kết truy cập nhanh vào trang cá nhân của thành viên đó.
    - Tên định danh tài khoản.
    - Nút hành động tương tác thời gian thực "👤+ Đã theo dõi" (hoặc "Theo dõi"), cho phép chủ tài khoản chủ động hủy hoặc kết nối lại mối quan hệ chỉ bằng 1 cú nhấp chuột.

---

### 3.4.20. Giao diện đăng nhập
- **Mã / Tên hình:** Hình 3.18. Giao diện đăng nhập
- **Mô tả chi tiết:**
  Người dùng (Bao gồm lữ khách/Người dùng và quản trị viên) cần đăng nhập tài khoản để truy cập các tính năng cá nhân hóa của nền tảng Terraholic. Khi truy cập vào trang xác thực, giao diện đăng nhập sẽ hiển thị. Người dùng có thể lựa chọn đăng nhập bằng tài khoản Google hoặc nhập thông tin Email/Tên đăng nhập và mật khẩu, sau đó nhấn nút "Đăng nhập".
  Nếu thông tin truy cập chính xác, hệ thống sẽ xác thực thành công và tự động điều hướng người dùng đến trang chủ/bảng tin du lịch. Trường hợp thông tin không chính xác hoặc thiếu thông tin bắt buộc, hệ thống sẽ hiển thị thông báo lỗi chi tiết để người dùng kiểm tra và thử lại. Ngoài ra, giao diện hỗ trợ các tiện ích phụ như Ghi nhớ đăng nhập, quên mật khẩu (khôi phục qua OTP) và chuyển nhanh sang màn hình tạo tài khoản.

---

### 3.4.21. Giao diện đăng ký
- **Mã / Tên hình:** Hình 3.19. Giao diện đăng ký
- **Mô tả chi tiết:**
  Đối với người dùng mới chưa có tài khoản trên hệ thống, giao diện đăng ký cho phép tạo tài khoản để tham gia vào cộng đồng du lịch Terraholic. Người dùng có thể lựa chọn đăng ký nhanh bằng tài khoản Google hoặc tiến hành đăng ký thủ công qua Email. Khi đăng ký qua Email, người dùng cần điền đầy đủ các thông tin bắt buộc bao gồm: Họ và tên, email, mật khẩu (tối thiểu 8 ký tự) và nhập lại mật khẩu.
  Để tăng cường tính bảo mật và xác thực chính chủ, hệ thống tích hợp tính năng gửi mã xác thực OTP Email (6 chữ số). Người dùng bấm nút "Gửi mã OTP", kiểm tra hòm thư Email để lấy mã và điền vào form đăng ký. Sau khi tích chọn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật, người dùng nhấn nút "Tạo tài khoản". Nếu thông tin hợp lệ và mã OTP chính xác, hệ thống sẽ khởi tạo tài khoản thành công và tự động chuyển hướng người dùng vào hệ thống. Trường hợp thông tin không hợp lệ, thiếu mã OTP hoặc không tích chọn điều khoản, hệ thống sẽ đưa ra thông báo lỗi tương ứng để người dùng hoàn thiện.

---

### 3.4.22. Giao diện trang đăng nhập admin
- **Mã / Tên hình:** Hình 3.39. Giao diện trang đăng nhập admin
- **Mô tả chi tiết:**
  Quản trị viên (Admin) cần có tài khoản quản trị hệ thống để truy cập vào quản lý. Khi truy cập vào trang quản trị, giao diện Đăng Nhập Quản Trị Viên Hệ Thống sẽ hiển thị. Người dùng tiến hành nhập vào Tên đăng nhập / Email Admin và Mật khẩu Admin, chọn "Đăng Nhập Trang Quản Trị" để tiến hành đăng nhập. Nếu thông tin chính xác, hệ thống sẽ chuyển đến giao diện Cổng quản trị viên (Admin Dashboard). Trường hợp thông tin truy cập không chính xác, người dùng sẽ nhận được thông báo lỗi.

---

### 3.4.23. Giao diện trang thống kê nền tảng
- **Mã / Tên hình:** Hình 3.40. Giao diện trang thống kê nền tảng
- **Mô tả chi tiết:**
  Quản trị viên (Admin) sau khi hoàn tất xác thực đăng nhập sẽ được chuyển hướng trực tiếp đến trang Tổng Quan Thống Kê Nền Tảng (Admin Dashboard Overview). Đây là bảng điều khiển giám sát trung tâm cung cấp bức tranh toàn cảnh về sức khỏe và quy mô phát triển của hệ thống Terraholic. Giao diện bao gồm:
  - **Khung chỉ số đo lường hiệu suất (KPI Metric Cards):** Trình diễn các con số thống kê thời gian thực như Tổng số tài khoản người dùng/lữ khách, Tổng số bài viết cộng đồng đã xuất bản, Tổng số chuyến đi được khởi tạo bằng công nghệ AI, và Số lượt check-in/tương tác bản đồ GIS.
  - **Khu vực trực quan hóa dữ liệu (Analytics Charts):** Tích hợp các biểu đồ tương tác bao gồm biểu đồ đường tăng trưởng người dùng theo thời gian (User Growth), biểu đồ phân bổ danh mục bài viết (Văn hóa, Ẩm thực, Phiêu lưu...), và bảng xếp hạng Top các địa danh du lịch hot nhất trong tháng.
  - **Trung tâm cảnh báo vận hành & Thông báo khẩn:** Hiển thị danh sách các cảnh báo hệ thống thời gian thực như thông báo các tài khoản vắng mặt quá 180 ngày chưa truy cập, danh sách bài viết bị người dùng báo cáo vi phạm (Reported Posts), và nhật ký hoạt động của bộ lọc kiểm duyệt tự động AI Engine.

---

### 3.4.24. Giao diện trang quản lý người dùng
- **Mã / Tên hình:** Hình 3.41. Giao diện trang quản lý người dùng
- **Mô tả chi tiết:**
  Quản trị viên (Admin) cần có tài khoản quản trị để truy cập vào phân hệ quản lý người dùng. Khi người dùng chọn vào mục "Quản Lý Người Dùng" trên thanh menu bên trái, giao diện Quản Lý Tài Khoản Người Dùng sẽ hiển thị. Người dùng tiến hành nhập từ khóa tìm kiếm (email hoặc họ tên), chọn bộ lọc trạng thái xác thực, chọn sắp xếp thời hạn chưa truy cập, chọn nút "Làm mới" dữ liệu hoặc thực hiện các nút thao tác (đổi vai trò, xóa tài khoản) tương ứng với từng người dùng trong bảng. Nếu thao tác hợp lệ, hệ thống sẽ thực thi yêu cầu (lọc danh sách, xóa tài khoản hoặc cập nhật quyền) và thông báo thành công. Trường hợp người dùng bị xóa hoặc không tìm thấy dữ liệu phù hợp với từ khóa, hệ thống sẽ hiển thị danh sách rỗng hoặc thông báo lỗi tương ứng.

---

### 3.4.25. Giao diện trang quản lý bài viết
- **Mã / Tên hình:** Hình 3.42. Giao diện trang quản lý bài viết
- **Mô tả chi tiết:**
  Quản trị viên (Admin) cần có tài khoản quản trị để truy cập vào phân hệ kiểm duyệt nội dung. Khi người dùng chọn vào mục "Quản Lý Bài Viết" trên thanh menu bên trái, giao diện Quản Lý Bài Viết Cộng Đồng sẽ hiển thị. Người dùng tiến hành quan sát các thẻ chỉ số thống kê bài đăng, nhập từ khóa tìm kiếm (nội dung, tác giả, email, điểm đến), chọn phân loại bài viết (Tất cả, Có ảnh, Có vị trí, Bị báo cáo), chọn nút "Làm mới dữ liệu" hoặc thực hiện thao tác xem chi tiết (biểu tượng con mắt) và xóa bài viết vi phạm (biểu tượng thùng rác đỏ). Nếu thao tác hợp lệ, hệ thống sẽ thực thi yêu cầu (lọc dữ liệu hoặc xóa bài viết vi phạm khỏi CSDL) và thông báo thành công. Trường hợp bài viết đã bị xóa hoặc không tìm thấy nội dung phù hợp với từ khóa, hệ thống sẽ hiển thị danh sách rỗng hoặc thông báo lỗi tương ứng.

---

### 3.4.26. Giao diện trang quản lý cẩm nang
- **Mã / Tên hình:** Hình 3.43. Giao diện trang quản lý cẩm nang
- **Mô tả chi tiết:**
  Quản trị viên (Admin) cần có tài khoản quản trị để truy cập vào phân hệ quản lý tri thức du lịch. Khi người dùng chọn vào mục "Quản Lý Cẩm Nang" trên thanh menu bên trái, giao diện Quản Lý Tài Liệu Tri Thức Cẩm Nang sẽ hiển thị. Quản trị viên tiến hành quan sát các thẻ chỉ số thống kê kho tài liệu cẩm nang (63 tỉnh thành, di tích lịch sử, nét văn hóa truyền thống, đặc sản ẩm thực), nhập từ khóa tìm kiếm (tên địa danh, tiêu đề tài liệu, loại tệp), chọn phân loại dạng tệp (Word, PDF, JSON, tin bài cẩm nang), chọn nút "Làm mới dữ liệu" hoặc thực hiện các nút thao tác chuyên biệt (thêm tài liệu cẩm nang mới, xem chi tiết, chỉnh sửa nội dung hoặc xóa tài liệu khỏi hệ thống). Nếu thao tác hợp lệ, hệ thống sẽ thực thi yêu cầu và phát sóng đồng bộ dữ liệu cẩm nang tri thức tới toàn bộ người dùng trên nền tảng. Trường hợp không tìm thấy tài liệu phù hợp với bộ lọc từ khóa, hệ thống sẽ hiển thị danh sách rỗng hoặc thông báo lỗi tương ứng.

---

### 3.4.27. Giao diện trang xem Log nhật ký
- **Mã / Tên hình:** Hình 3.44. Giao diện trang xem Log nhật ký
- **Mô tả chi tiết:**
  Quản trị viên (Admin) cần có tài khoản quản trị để truy cập vào phân hệ giám sát nhật ký thao tác. Khi người dùng chọn vào mục "Xem Log Nhật Ký" trên thanh menu bên trái, giao diện Lịch Sử Log Nhật Ký Quản Trị sẽ hiển thị. Người dùng tiến hành nhập từ khóa tìm kiếm (nội dung log, người thực hiện, thời gian), chọn bộ lọc danh mục thao tác, chọn bộ lọc tác nhân thực hiện (Admin hoặc AI Engine), chọn nút "Xóa bộ lọc" để đặt lại tìm kiếm hoặc chọn nút "Làm mới Log" để gọi API tải lại dữ liệu mới nhất. Nếu thao tác hợp lệ, hệ thống sẽ truy xuất cơ sở dữ liệu và hiển thị danh sách các mốc thời gian thực hiện thao tác (Giờ: Phút Ngày/Tháng/Năm) chính xác. Trường hợp không tìm thấy dữ liệu nhật ký phù hợp với bộ lọc, hệ thống sẽ hiển thị dòng thông báo chưa có dữ liệu log tương ứng.
