# Tổng quan hệ thống SmartTravel
=====================================================

## Giới thiệu
---------------

Dự án SmartTravel là một hệ thống chatbot tư vấn du lịch cá nhân hóa. Mục tiêu của dự án là tạo ra một hệ thống có thể tư vấn cho người dùng về các điểm du lịch phù hợp với sở thích và nhu cầu của họ.

## Kiến trúc Tổng thể
---------------------

### Mô hình hoạt động

Hệ thống SmartTravel được xây dựng trên mô hình kiến trúc **Modular Monolith (Đơn khối mô-đun)** kết hợp với một **FastAPI sidecar** chuyên trách cho các tác vụ AI phụ trợ. Hệ thống bao gồm các thành phần sau:

* **Frontend**: Thiết kế dạng React Single Page Application (SPA), sử dụng **MapLibre GL** cho bản đồ số và **Redux Toolkit** kết hợp **React Query** quản lý trạng thái. Giao diện được xây dựng bằng **Tailwind CSS**.
* **Backend Monolith (Express)**: Đóng vai trò là trung tâm xử lý nghiệp vụ chính, định tuyến các API REST và tích hợp công nghệ Socket.io cho các tính năng thời gian thực.
* **AI FastAPI Sidecar**: Đóng vai trò là sidecar chạy song song hỗ trợ tính toán khoảng cách vector và chạy các công cụ đánh giá tự động (RAG evaluation metrics).
* **Cơ sở dữ liệu**: Sử dụng **PostgreSQL** kết hợp với tiện ích mở rộng **pgvector** cho việc tìm kiếm tri thức ngữ nghĩa và **Prisma ORM** để ánh xạ dữ liệu.

### Cách giao tiếp giữa các module

* **REST API**: Giao tiếp nội bộ giữa Frontend và Backend Monolith qua REST API.
* **WebSockets (Socket.io)**: Frontend kết nối trực tiếp đến Backend Monolith để cập nhật vị trí GPS trực tuyến và thông báo real-time.
* **Prisma ORM**: Backend Monolith tương tác trực tiếp với cơ sở dữ liệu PostgreSQL.

---

## Các tính năng nổi bật
-------------------------

### RAG Chatbot
Hệ thống chatbot đa Agent (Multi-Agent) cho phép hỏi đáp thông tin thời tiết, ẩm thực và văn hóa với độ tin cậy cao nhờ luồng tri thức RAG trên PostgreSQL pgvector.

### AI Route Optimizer (TSP Solver)
Tự động tối ưu lộ trình chuyến đi theo thuật toán TSP (Brute-force cho N <= 8; Greedy cho N > 8).

### Bộ nhớ AI (AI Memory)
Tự động lưu vết sở thích, thói quen du lịch của người dùng thông qua các cuộc hội thoại để cá nhân hóa các gợi ý.

### AI Companion Matching
Tính toán mức độ tương hợp giữa các sở thích du lịch cá nhân để ghép cặp bạn đồng hành tự động.

---

## Phân tích chất lượng & Đề xuất cải tiến
-----------------------------------------

### Ưu điểm
* Kiến trúc Modular Monolith giúp đơn giản hóa việc triển khai, tránh độ trễ mạng của microservices nhưng vẫn đảm bảo tính cô lập nghiệp vụ giữa các module.
* Sử dụng pgvector trực tiếp trên PostgreSQL giúp giảm thiểu sự phức tạp và chi phí của hạ tầng cơ sở dữ liệu.
* Quản lý trạng thái bằng Redux Toolkit và React Query đem lại trải nghiệm mượt mà trên UI bản đồ MapLibre GL.

### Nhược điểm
* Việc lưu trữ cache đệm (`SystemCache`) trực tiếp trên đĩa PostgreSQL có thể làm giảm tốc độ I/O khi hệ thống mở rộng quy mô người dùng lớn.

### Đề xuất cải tiến
* Tách bộ nhớ đệm cache đĩa PostgreSQL sang bộ nhớ RAM chuyên trách sử dụng **Redis** để tăng hiệu năng tối đa.
* Bổ sung chỉ mục GIN cho các trường mảng sở thích du lịch của người dùng.

## Kết luận
----------
Hệ thống SmartTravel là nền tảng tư vấn du lịch cá nhân hóa mạnh mẽ sử dụng kiến trúc Modular Monolith hiện đại và an toàn, sẵn sàng đáp ứng yêu cầu vận hành thực tế.