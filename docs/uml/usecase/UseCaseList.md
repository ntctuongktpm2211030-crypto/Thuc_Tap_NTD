# Danh sách các Trường hợp sử dụng (UML Use Case List) - SmartTravel Platform

This document catalogs the finalized business use cases for the SmartTravel application. Internal system mechanisms, algorithmic processes, and background cron jobs have been excluded to adhere strictly to UML 2.5 and Business Analysis best practices.

---

## 1. Authentication (Phân hệ Xác thực & Thành viên)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_AUTH_01** | Đăng ký tài khoản (Register Account) | Khách vãng lai | SMTP Mail Server | Cho phép khách vãng lai đăng ký tài khoản mới và gửi email chứa liên kết kích hoạt. |
| **UC_AUTH_02** | Xác thực tài khoản qua Email (Verify Email) | Khách vãng lai | SMTP Mail Server | Xác nhận mã kích hoạt gửi qua email để hoàn thành việc kích hoạt tài khoản thành viên. |
| **UC_AUTH_03** | Đăng nhập tài khoản (Log In) | Khách vãng lai | Firebase Auth | Đăng nhập vào hệ thống bằng tài khoản email/mật khẩu truyền thống hoặc SSO qua Google. |
| **UC_AUTH_04** | Quản lý hồ sơ & sở thích du lịch (Manage Profile & Preferences) | Người dùng đăng ký | vietnamadminunits API | Thiết lập thông tin cá nhân và cấu hình các sở thích du lịch (ngân sách, tốc độ, hoạt động). |
| **UC_AUTH_05** | Theo dõi thành viên khác (Follow Members) | Người dùng đăng ký | - | Theo dõi hoặc hủy theo dõi người dùng khác để cập nhật các hoạt động mới của họ trên bảng tin. |

---

## 2. Trip Planning (Phân hệ Lập lịch trình & Tối ưu lộ trình)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_TRIP_01** | Quản lý chuyến đi (Manage Travel Itineraries) | Người dùng đăng ký | - | Thực hiện tạo mới, xem, cập nhật hoặc xóa các chuyến đi do người dùng tự lên kế hoạch thủ công. |
| **UC_TRIP_02** | Tạo lịch trình tự động bằng AI (AI Itinerary Generation) | Người dùng đăng ký | OpenAI API | Tự động tạo một lịch trình chi tiết dựa trên tham số địa điểm, số ngày và ngân sách người dùng nhập vào. |
| **UC_TRIP_03** | Tối ưu hóa lộ trình ngắn nhất (Route Optimization - TSP) | Người dùng đăng ký | - | Sắp xếp các điểm dừng trong một ngày du lịch theo thứ tự tối ưu nhất về mặt khoảng cách địa lý (TSP Solver). |
| **UC_TRIP_04** | Nhân bản lịch trình công khai (Clone Public Itineraries) | Người dùng đăng ký | - | Sao chép lịch trình du lịch công khai của thành viên khác thành một bản sao cá nhân để chỉnh sửa. |
| **UC_TRIP_05** | Tìm kiếm & Tra cứu lịch trình cộng đồng (Discover Public Trips) | Khách vãng lai | - | Tra cứu và xem chi tiết các lịch trình du lịch đã được những người dùng khác chia sẻ công khai. |
| **UC_TRIP_06** | Quản lý lịch sử đi lại thực tế (Manage Travel History) | Người dùng đăng ký | - | Ghi nhận và lưu lại nhật ký các chuyến du lịch thực tế đã đi kèm chi phí thực tế và đánh giá. |

---

## 3. Community (Phân hệ Mạng xã hội du lịch)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_SOC_01** | Xem bảng tin cộng đồng (Browse Community Feed) | Khách vãng lai | - | Xem danh sách các bài viết, chia sẻ kinh nghiệm chuyến đi công khai của các thành viên khác. |
| **UC_SOC_02** | Quản lý bài viết chia sẻ (Manage Blog/Story Posts) | Người dùng đăng ký | - | Tạo mới, sửa đổi hoặc xóa các bài viết chia sẻ trải nghiệm du lịch kèm hình ảnh và liên kết chuyến đi. |
| **UC_SOC_03** | Tương tác bài đăng cộng đồng (Interact with Posts) | Người dùng đăng ký | - | Thích (Like), bình luận (Comment) hoặc đánh dấu/lưu bài viết quan tâm (Bookmark). |
| **UC_SOC_04** | AI gợi ý bạn đồng hành tương thích (AI Companion Matching) | Người dùng đăng ký | OpenAI API | Tự động phân tích và tính toán điểm tương thích giữa các thành viên để gợi ý ghép đôi bạn phượt phù hợp. |

---

## 4. Interactive Map (Phân hệ Bản đồ tương tác & GIS)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_MAP_01** | Xem bản đồ (View Map) | Khách vãng lai | Map Service | Xem bản đồ cơ sở hiển thị các địa điểm du lịch. |
| **UC_MAP_02** | Phóng to / Thu nhỏ bản đồ (Zoom Map) | Khách vãng lai | - | Điều chỉnh tỷ lệ thu phóng của góc nhìn bản đồ. |
| **UC_MAP_03** | Di chuyển bản đồ (Pan Map) | Khách vãng lai | - | Kéo hoặc di chuyển góc nhìn bản đồ để xem các khu vực khác. |
| **UC_MAP_04** | Thay đổi bản đồ nền (Switch Base Map) | Khách vãng lai | Map Service | Đổi giao diện lớp bản đồ nền (Bản đồ vệ tinh, bản đồ địa hình...). |
| **UC_MAP_05** | Tìm kiếm vị trí (Search Location) | Khách vãng lai | Geocoding API | Tra cứu vị trí địa lý thông qua thanh tìm kiếm. |
| **UC_MAP_06** | Lọc danh mục địa điểm du lịch (Filter Tourist Categories) | Khách vãng lai | - | Lọc nhanh các điểm đến theo loại hình (Khách sạn, Nhà hàng, Điểm tham quan). |
| **UC_MAP_07** | Xem chi tiết địa điểm du lịch (View Tourist Attraction Details) | Khách vãng lai | - | Xem thông tin mô tả, đánh giá và hình ảnh chi tiết của một điểm du lịch. |
| **UC_MAP_08** | Xem bản đồ nhiệt check-in (View Heatmap) | Khách vãng lai | - | Hiển thị mật độ điểm check-in của các phượt thủ dưới dạng bản đồ nhiệt. |
| **UC_MAP_09** | Xác định & Cập nhật vị trí hiện tại (Get & Update Current Location) | Người dùng đăng ký | - | Định vị và gửi cập nhật tọa độ GPS của thiết bị lên hệ thống. |
| **UC_MAP_10** | Tìm địa điểm xung quanh (Find Nearby Places) | Người dùng đăng ký | - | Khám phá các địa danh và cơ sở dịch vụ lân cận vị trí hiện tại. |
| **UC_MAP_11** | Xem chỉ đường lộ trình (View Route Directions) | Người dùng đăng ký | Routing API | Vẽ đường đi và hướng dẫn di chuyển giữa các điểm mốc trên bản đồ. |
| **UC_MAP_12** | Hiển thị gợi ý địa điểm bằng AI trên bản đồ (Display AI Recommendations on Map) | Người dùng đăng ký | - | Hiển thị các điểm đến do AI gợi ý cá nhân hóa trực quan trên bản đồ. |
| **UC_MAP_13** | Tìm người lân cận chia sẻ vị trí (bán kính 100km) (Find Nearby Users - 100km) | Người dùng đăng ký | - | Quét và hiển thị danh sách người dùng đang chia sẻ vị trí trực tuyến trong bán kính 100km. |
| **UC_MAP_14** | Thực hiện check-in địa điểm (Perform Check-in) | Người dùng đăng ký | OpenStreetMap | Check-in lưu tọa độ, hình ảnh, đánh giá và ghi chú địa danh thực tế. |
| **UC_MAP_15** | Tải lên hình ảnh check-in (Upload Check-in Photo) | Người dùng đăng ký | - | Tải hình ảnh thực tế lên kèm theo bài đăng check-in địa điểm. |
| **UC_MAP_16** | Xem Community Check-Ins (View Community Check-ins) | Khách vãng lai | - | Tra cứu các bài đăng check-in và hình ảnh thực tế của mọi người tại các địa điểm. |

---

## 5. AI Chatbot (Phân hệ Trợ lý ảo AI & RAG)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_AI_01** | Trò chuyện với trợ lý ảo đa Agent (Chat with Multi-Agent Chatbot) | Người dùng đăng ký | OpenAI API, vietnamadminunits API, OpenStreetMap | Thực hiện hỏi đáp thông tin ẩm thực, văn hóa, thời tiết, điểm đến du lịch với chatbot tích hợp Agent thông minh. |
| **UC_AI_02** | Quản lý phiên hội thoại chat (Manage Chat Conversations) | Người dùng đăng ký | - | Liệt kê danh sách lịch sử các luồng chat và thực hiện xóa các luồng chat không còn nhu cầu sử dụng. |
| **UC_AI_03** | Tái tạo phản hồi đa phiên bản (Regenerate Chat Response) | Người dùng đăng ký | OpenAI API | Yêu cầu trợ lý ảo sinh lại một câu trả lời mới cho câu hỏi trước đó và xem lại các phiên bản cũ đã lưu. |
| **UC_AI_04** | Đánh giá chất lượng phản hồi AI (Submit AI Answer Rating) | Người dùng đăng ký | - | Gửi đánh giá (Thumb Up/Down) kèm bình luận chi tiết về câu trả lời của trợ lý ảo để tinh chỉnh prompt. |
| **UC_AI_05** | Tra cứu tri thức sâu thông qua RAG (RAG Semantic Search) | Người dùng đăng ký | OpenAI API | Truy vấn các kiến thức thực tế địa phương dựa trên embeddings vector lai kết hợp chuỗi ký tự thô. |
| **UC_AI_06** | Quản lý danh sách món ăn yêu thích (Manage Favorite Foods) | Người dùng đăng ký | - | Lưu trữ và quản lý danh sách món ăn đặc sản địa phương đã được trợ lý ẩm thực giới thiệu và người dùng yêu thích. |

---

## 6. Administration (Phân hệ Quản trị & Vận hành)
| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_ADM_01** | Xem dashboard thống kê hệ thống (View Analytics Charts) | Người dùng đăng ký | - | Giám sát biểu đồ hiệu năng hệ thống, tốc độ phản hồi CSDL, lượng người dùng hoạt động và check-in thời gian thực. |
| **UC_ADM_02** | Nạp kho tri thức RAG (Ingest RAG Knowledge Base) | Người dùng đăng ký | OpenAI API | Tải các tệp tài liệu du lịch thô lên để hệ thống sinh embeddings vector lưu trữ vào kho tri thức RAG. |
| **UC_ADM_03** | Chuẩn hóa dữ liệu địa phương (Sanitize & Clean Raw Data) | Người dùng đăng ký | - | Chạy tiến trình tiền xử lý, chuẩn hóa địa danh và làm sạch cấu trúc dữ liệu thô Cà Mau. |
| **UC_ADM_04** | Quản lý và làm sạch bộ nhớ cache (Manage System Caching) | Người dùng đăng ký | - | Giám sát dung lượng cache Redis/Prisma và thực hiện xóa các khóa cache đã hết hạn để giải phóng tài nguyên. |
