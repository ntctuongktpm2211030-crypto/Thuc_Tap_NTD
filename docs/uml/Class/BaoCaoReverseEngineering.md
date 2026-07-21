# Báo cáo Kỹ nghệ Ngược & Phân tích Kiến trúc Backend (Reverse Engineering Report)

Báo cáo này tổng hợp kết quả của quá trình phân tích và kỹ nghệ ngược (Reverse Engineering) toàn bộ mã nguồn hệ thống Backend của ứng dụng Hỗ trợ Du lịch Thông minh (Smart Travel Monolith Core). 

---

## 1. Phương pháp thực hiện (Methodology)
Quá trình kỹ nghệ ngược được thực hiện bằng cách đọc hiểu và phân tích trực tiếp các tệp tin TypeScript trong thư mục `backend/src`. Chúng tôi bỏ qua cấu trúc của cơ sở dữ liệu vật lý (Database Schema) và chỉ tập trung vào các lớp đối tượng, các hàm chức năng, các middleware, controller, service, repository và router thực tế trong mã nguồn ứng dụng để xây dựng các sơ đồ lớp UML.

---

## 2. Kiến trúc tổng quan (System Architecture)
Mã nguồn Backend được xây dựng theo mô hình **Modular Monolith** kết hợp với kiến trúc nhiều lớp (Layered Architecture):

```
[Client (ReactJS)] ──(HTTP/JSON)──> [Routing Layer (Express Router)]
                                           │ (Auth Middleware)
                                           ▼
                               [Controller Layer (Controllers)]
                                           │
                                           ▼
                                 [Service Layer (Services)]
                                           │
                                           ▼
                               [Repository Layer (Repositories)]
                                           │
                                           ▼
                                  [ORM (Prisma Client)] ──> [PostgreSQL / Supabase]
```

### Các lớp Kiến trúc chính:
1.  **Routing & Middleware Layer**: Định tuyến các yêu cầu API, xác thực quyền truy cập thông qua token JWT (`auth.middleware.ts`), kiểm soát kích thước payload và xử lý lỗi tập trung.
2.  **Controller Layer**: Nhận dữ liệu đầu vào từ HTTP Request, kiểm tra định dạng dữ liệu (Validation) và gọi tầng Service tương ứng.
3.  **Service Layer (Nghiệp vụ)**: Chứa toàn bộ các logic tính toán, xử lý nghiệp vụ của ứng dụng và điều phối hoạt động giữa các hệ thống AI.
4.  **Repository Layer (Truy xuất CSDL)**: Độc lập hóa các câu truy vấn cơ sở dữ liệu thông qua Prisma Client để tối ưu hóa khả năng bảo trì và nâng cấp.

---

## 3. Các mẫu thiết kế đặc trưng (Design Patterns)

### A. Strategy Pattern (AI Agent)
*   **Áp dụng**: Hệ thống AI Agents sử dụng `AgentStrategy` làm giao diện chung và cài đặt 4 chiến lược đại lý độc lập: `TravelAgent`, `FoodAgent`, `CultureAgent`, và `RecommendationAgent`.
*   **Lợi ích**: Dễ dàng mở rộng và bổ sung các đại lý mới mà không cần sửa đổi cấu trúc cốt lõi của lớp điều phối `AgentExecutorService`.

### B. Command Pattern (Agent Tools)
*   **Áp dụng**: Các công cụ mà AI Agent sử dụng (như `MapTool`, `WeatherTool`, `ItineraryTool`, v.v.) kế thừa từ lớp cơ sở `BaseTool` và đóng gói hành động xử lý trong phương thức `run()`.
*   **Lợi ích**: Tách biệt logic gọi API bên ngoài ra khỏi logic suy luận của AI Agent.

### C. Pipeline Pattern (RAG Pipeline)
*   **Áp dụng**: Lớp `RagPipelineService` thực hiện tuần tự một chuỗi các bước xử lý từ nhận câu hỏi -> phân tích an toàn đầu vào -> sinh embedding -> tìm kiếm vector tương đồng -> bổ sung ngữ cảnh -> sinh câu trả lời -> xác thực tính chân thực (Fact Verification) -> sinh trích dẫn -> kiểm duyệt an toàn đầu ra.
*   **Lợi ích**: Đảm bảo chất lượng câu trả lời cao nhất và giảm thiểu hiện tượng ảo tưởng (Hallucination) của LLM trong doanh nghiệp.

### D. FSM (Finite State Machine - Máy trạng thái hội thoại)
*   **Áp dụng**: Lớp `ConversationStateMachine` và `ConversationIntelligence` (CIM) dùng để quản lý luồng hội thoại giữa Chatbot và người dùng, chuyển đổi trạng thái dựa trên ý định thực tế và cảm xúc của khách hàng thay vì hỏi dồn dập các thông tin lịch trình.
