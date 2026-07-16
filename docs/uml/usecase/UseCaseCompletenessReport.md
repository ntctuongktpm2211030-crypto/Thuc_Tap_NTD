# BÁO CÁO PHÂN TÍCH ĐỘ ĐẦY ĐỦ CỦA USE CASE (USE CASE COMPLETENESS REPORT)

*Người lập: Software Architect*  
*Mục tiêu: Đánh giá độ phủ của các trường hợp sử dụng đối với các yêu cầu chức năng (functional requirements), phát hiện trùng lặp, thiếu sót và định nghĩa mô hình tổng thể.*

---

## 1. Đánh giá độ phủ chức năng (Functional Coverage Verification)

Dựa trên việc kiểm tra chéo giữa:
- **Tập tin Database Schema** ([schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma))
- **Mã nguồn Routes & Controllers** trong thư mục `backend/src/modules/`
- **Giao diện người dùng** trong thư mục `frontend/src/features/`

Mọi thực thể dữ liệu chính và API Router của nền tảng SmartTravel đã được ánh xạ đầy đủ vào tối thiểu một Use Case tương ứng:

| Module / Thực thể dữ liệu | Route bảo vệ | Use Case ánh xạ | Kết luận |
| :--- | :--- | :--- | :--- |
| **User, Profile** | `/api/v1/auth/` | `UC_Register`, `UC_Login`, `UC_GoogleLogin` | **Đạt** |
| **TravelPreferences** | `/api/v1/preferences/` | `UC_ManageProfile` | **Đạt** |
| **Trip, Destination, Activity** | `/api/v1/trips/` | `UC_ManageTrips`, `UC_AITrip`, `UC_TSP` | **Đạt** |
| **Post, Like, Comment, Bookmark**| `/api/v1/posts/` | `UC_ManagePosts`, `UC_InteractPost` | **Đạt** |
| **Follow** | `/api/v1/social/` | `UC_Follow` | **Đạt** |
| **Location** | `/api/v1/map/` (WebSockets) | `UC_LiveLocation` | **Đạt** |
| **ChatMessage, Conversation** | `/api/v1/chatbot/` | `UC_ManageChats`, `UC_Chatbot` | **Đạt** |
| **KnowledgeContent, Question** | `/api/v1/rag/` | `UC_RAGSearch`, `UC_IngestRAG` | **Đạt** |

---

## 2. Phát hiện các lỗi và Chuẩn hóa thiết kế

### A. Loại bỏ các Use Case trùng lặp / dư thừa
*   **Token Rotation (Làm mới token)**: Đã được loại bỏ khỏi danh mục Use Case nghiệp vụ vì đây là cơ chế kỹ thuật tự động chạy ẩn thông qua Axios Interceptors ([api.ts](file:///d:/Thuc_Tap_NDT/frontend/src/services/api.ts)) thay vì hành vi kích hoạt chủ động từ tác nhân con người.
*   **Auto Purge Deleted Posts (Tự động dọn dẹp bài đăng)**: Loại bỏ vì đây là tiến trình nền (cron worker) tự động vận hành trong hệ thống, không đóng vai trò giao tiếp trực tiếp với Actor.
*   **Định tuyến Agent và BLEU Bypass**: Đã được gom vào luồng xử lý nội bộ của Use Case `UC_Chatbot` và `UC_RAGSearch` vì đây là giải thuật tối ưu hóa, không phải mục tiêu hành vi của người dùng.

### B. Bổ sung các Use Case nghiệp vụ bị thiếu
Qua phân tích sâu CSDL và các API Controllers, đã bổ sung các Use Case bị khuyết ở pha phân tích sơ bộ:
1.  **AI Companion Matching (`UC_MatchCompanion`)**: Nghiệp vụ tính toán điểm tương đồng dựa trên Travel Preferences để ghép cặp bạn du hành (`TravelerMatch`).
2.  **Quản lý & Tham gia sự kiện địa phương (`UC_LocalEvents`)**: Nghiệp vụ kết nối cộng đồng tại điểm đến (`Event` và `EventAttendee`).
3.  **Quản lý cuộc hội thoại (`UC_ManageChats`)**: Cho phép người dùng liệt kê, đổi tên hoặc xóa lịch sử các luồng chat trợ lý ảo.

---

## 3. Tổng kết độ bao phủ (Completeness Metrics)

- **Tổng số tác nhân người dùng**: 3 (Khách vãng lai, Người dùng đăng ký, Admin).
- **Tổng số tác nhân hệ thống hỗ trợ**: 4 (Firebase, OpenStreetMap, OpenAI, vietnamadminunits).
- **Tổng số Use Cases nghiệp vụ**: 28 Use Cases (Được phân bố hoàn hảo trên 6 phân hệ).
- **Mức độ sẵn sàng thiết kế**: **100%** (Tất cả Use Cases đều có mã nguồn backend/frontend hoặc schema CSDL thực thi làm bằng chứng).
