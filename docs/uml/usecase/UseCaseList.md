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

## 4. Interactive Map (Phân hệ Bản đồ tương tác & Định vị)

| ID | Use Case Name | Primary Actor | Supporting Actors | Brief Description |
| :--- | :--- | :--- | :--- | :--- |
| **UC_MAP_01** | Xem bản đồ tương tác (View Interactive Map) | Khách vãng lai | OpenStreetMap (OSM) | Xem bản đồ nhiệt check-in, định vị các điểm nổi bật, danh lam thắng cảnh và cảnh báo an toàn. |
| **UC_MAP_02** | Check-in địa điểm du lịch (Perform Check-in) | Người dùng đăng ký | OpenStreetMap (OSM) | Lưu dấu chân check-in, viết ghi chú và đánh giá trải nghiệm tại một tọa độ địa lý. |
| **UC_MAP_03** | Trích xuất GPS từ siêu dữ liệu ảnh chụp (EXIF GPS Extraction) | Người dùng đăng ký | - | Tải ảnh chụp lên để hệ thống tự động giải mã tọa độ GPS từ dữ liệu EXIF của ảnh phục vụ check-in nhanh. |
| **UC_MAP_04** | Chia sẻ & Theo dõi vị trí thời gian thực (Real-time Location Sync) | Người dùng đăng ký | - | Chia sẻ vị trí hiện tại của mình và theo dõi vị trí live của bạn bè trên bản đồ qua WebSockets. |
| **UC_MAP_05** | Quản lý & Tham gia sự kiện địa phương (Manage & Join Local Events) | Người dùng đăng ký | - | Tạo hoặc tham gia các sự kiện du lịch, meetup tại một điểm tọa độ cụ thể được đánh dấu trên bản đồ. |
| **UC_MAP_06** | Quản lý địa điểm đã lưu (Manage Saved Places) | Người dùng đăng ký | - | Ghim và quản lý danh sách các địa điểm lưu trữ yêu thích trên bản đồ để phục vụ xem và dẫn đường nhanh. |

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
| **UC_ADM_01** | Xem dashboard thống kê hệ thống (View Analytics Charts) | Quản trị viên | - | Giám sát biểu đồ hiệu năng hệ thống, tốc độ phản hồi CSDL, lượng người dùng hoạt động và check-in thời gian thực. |
| **UC_ADM_02** | Nạp kho tri thức RAG (Ingest RAG Knowledge Base) | Quản trị viên | OpenAI API | Tải các tệp tài liệu du lịch thô lên để hệ thống sinh embeddings vector lưu trữ vào kho tri thức RAG. |
| **UC_ADM_03** | Chuẩn hóa dữ liệu địa phương (Sanitize & Clean Raw Data) | Quản trị viên | - | Chạy tiến trình tiền xử lý, chuẩn hóa địa danh và làm sạch cấu trúc dữ liệu thô Cà Mau. |
| **UC_ADM_04** | Quản lý và làm sạch bộ nhớ cache (Manage System Caching) | Quản trị viên | - | Giám sát dung lượng cache Redis/Prisma và thực hiện xóa các khóa cache đã hết hạn để giải phóng tài nguyên. |
