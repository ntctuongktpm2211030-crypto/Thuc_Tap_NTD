# BÁO CÁO PHÂN CHIA CÔNG VIỆC CHI TIẾT (PHIÊN BẢN HỌC THUẬT)

Bản báo cáo này cung cấp sơ đồ phân công công việc chi tiết tuyệt đối giữa **Thành viên 1 (AI & Optimization Specialist)** và **Thành viên 2 (Web Core & GIS Specialist)** của dự án **Terraholic**. Mọi phân công đều dựa trên cấu trúc tệp tin, lớp đối tượng, các bảng dữ liệu trong Prisma, và các hàm nghiệp vụ thực tế có trong mã nguồn dự án.

---

## I. BẢNG PHÂN CHIA HỆ THỐNG FILE & THƯ MỤC CỤ THỂ (BẢNG 1)

Dưới đây là bảng phân chia quyền sở hữu và trách nhiệm phát triển đối với các tệp tin/thư mục cụ thể trong dự án:

| Component | Đường dẫn tệp tin / thư mục trong Source Code | Thành viên phụ trách | Vai trò phát triển |
| :--- | :--- | :---: | :--- |
| **Backend AI** | [ai-planner.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai/ai-planner.ts) | Thành viên 1 | Lập trình cấu trúc sinh lịch trình bằng OpenAI GPT-4o-mini và parse JSON. |
| **Backend AI** | [ai-agents/](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai-agents) | Thành viên 1 | Triển khai Agent Executor, định tuyến ý định, Prompts và các Agent. |
| **Backend AI** | [rag/](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag) | Thành viên 1 | Xây dựng thuật toán nhúng Embeddings, Vector Store, Reranker, RAG Pipeline. |
| **Backend AI** | [chatbot/](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot) | Thành viên 1 | Viết API lưu trữ tin nhắn, Message Versioning, AI Memory và feedback đánh giá. |
| **Backend AI** | [dialogue/](file:///d:/Thuc_Tap_NDT/backend/src/modules/dialogue) | Thành viên 1 | Xử lý Slot-filling, trích xuất Intent, Prompt Composer, gợi ý câu hỏi thông minh. |
| **Backend AI** | [optimizer/](file:///d:/Thuc_Tap_NDT/backend/src/modules/optimizer) | Thành viên 1 | Triển khai thuật toán tối ưu hóa đường đi ngắn nhất TSP (Exhaustive & Greedy). |
| **Backend AI** | [recommendations/](file:///d:/Thuc_Tap_NDT/backend/src/modules/recommendations) | Thành viên 1 | Thuật toán so khớp mức độ tương đồng sở thích du lịch và danh mục địa danh. |
| **Backend AI** | [itinerary/](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary) | Thành viên 1 | CRUD các lịch trình ảo (itinerary) sinh ra từ hội thoại chatbot. |
| **AI Service** | [ai-service/app/](file:///d:/Thuc_Tap_NDT/ai-service/app) | Thành viên 1 | Ứng dụng độc lập FastAPI: Tiền xử lý dữ liệu địa giới hành chính, clean data. |
| **Backend Core**| [auth/](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth) | Thành viên 2 | Viết Middleware bảo mật JWT, phân quyền RBAC, router đăng ký/Google Auth. |
| **Backend Core**| [map/](file:///d:/Thuc_Tap_NDT/backend/src/modules/map) | Thành viên 2 | Xử lý API check-in địa lý, GIS Helper (Haversine) và live GPS tracking. |
| **Backend Core**| [trips/](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips) | Thành viên 2 | Lập trình các API CRUD chuyến đi thực tế (`trips.router.ts`) và Deep Clone. |
| **Backend Core**| [posts/](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts) | Thành viên 2 | API đăng bài viết (`posts.router.ts`), threaded comments, likes, bookmarks. |
| **Backend Core**| [social/](file:///d:/Thuc_Tap_NDT/backend/src/modules/social) | Thành viên 2 | Xử lý theo dõi người dùng, thông báo tự động (notifications), preferences. |
| **Backend Core**| [analytics/](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics) | Thành viên 2 | Tính toán dữ liệu thống kê nền tảng & đo lường hiệu năng kỹ thuật. |
| **Backend Core**| [cache/](file:///d:/Thuc_Tap_NDT/backend/src/modules/cache) | Thành viên 2 | Cung cấp bộ cache TTL trong Postgres/Redis để tối ưu hóa tốc độ tải dữ liệu. |
| **Backend Core**| [server.ts](file:///d:/Thuc_Tap_NDT/backend/src/server.ts) & [app.ts](file:///d:/Thuc_Tap_NDT/backend/src/app.ts) | Thành viên 2 | Thiết lập WebSockets, tích hợp các Middleware toàn cục và khởi động server. |
| **Frontend UI** | [ChatbotPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/chatbot/ChatbotPage.tsx) | Thành viên 1 | Giao diện Chatbot AI, hiển thị tác nhân hoạt động, chọn version phản hồi. |
| **Frontend UI** | [MemoryManager.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/chatbot/MemoryManager.tsx) | Thành viên 1 | Giao diện hiển thị, cấu hình & cập nhật bộ nhớ thói quen của trợ lý AI. |
| **Frontend UI** | [CultureFoodGuidePage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/guide/CultureFoodGuidePage.tsx) | Thành viên 1 | Giao diện cẩm nang tra cứu thông tin văn hóa, ẩm thực kết nối với RAG. |
| **Frontend UI** | [TripPlanner.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/trips/TripPlanner.tsx) (AI parts) | Thành viên 1 | Giao diện cấu hình yêu cầu sinh lịch trình AI & Nút tối ưu hóa TSP. |
| **Frontend UI** | [AuthPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/auth/AuthPage.tsx) | Thành viên 2 | Trang Đăng nhập, Đăng ký truyền thống và xác thực Google. |
| **Frontend UI** | [MapDashboard.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx) | Thành viên 2 | Bản đồ Leaflet tương tác, cluster markers, check-in, live tracking, EXIF extractor. |
| **Frontend UI** | [SocialFeedPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/feed/SocialFeedPage.tsx) | Thành viên 2 | Trang bảng tin mạng xã hội, tương tác like, bình luận đa cấp, bookmark. |
| **Frontend UI** | [CreateStoryPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/stories/CreateStoryPage.tsx) | Thành viên 2 | Trình soạn thảo viết câu chuyện du lịch đa phương tiện, đính kèm chuyến đi. |
| **Frontend UI** | [CreatePostPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/posts/CreatePostPage.tsx) | Thành viên 2 | Trang đăng trạng thái nhanh kèm hình ảnh. |
| **Frontend UI** | [ProfilePage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/profile/ProfilePage.tsx) | Thành viên 2 | Trang cá nhân, danh sách theo dõi, lịch sử đi lại, bài viết đã bookmark. |
| **Frontend UI** | [AdminDashboard.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/admin/AdminDashboard.tsx) | Thành viên 2 | Giao diện quản trị, xem số liệu thống kê và biểu đồ độ trễ hệ thống. |
| **Frontend UI** | [TripPlanner.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/trips/TripPlanner.tsx) (Web parts)| Thành viên 2 | Trình kéo thả lịch trình thủ công, timeline hoạt động, quản lý ngân sách. |
| **Frontend UI** | [App.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/App.tsx) | Thành viên 2 | Quản lý định tuyến SPA (React Router), layout chung, đa ngôn ngữ, polling. |

---

## II. BẢNG PHÂN CHIA THIẾT KẾ CƠ SỞ DỮ LIỆU PRISMA (BẢNG 2)

Dựa trên lược đồ [schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma) thực tế, cơ sở dữ liệu được phân chia trách nhiệm thiết kế chi tiết:

| Thực thể dữ liệu (Model) | Thành viên phụ trách thiết kế | Mục đích sử dụng & Quan hệ liên kết |
| :--- | :---: | :--- |
| **AIMemory** | Thành viên 1 | Lưu trữ sở thích cá nhân hóa học từ chat. Quan hệ 1-1 với `User`. |
| **ChatConversation** | Thành viên 1 | Quản lý các phiên trò chuyện của người dùng với AI. Quan hệ 1-nhiều với `ChatMessage`. |
| **ChatMessage** | Thành viên 1 | Chứa thông tin tin nhắn chat. Liên kết với `ChatMessageVersion`, `AIFeedback`, `ToolCall`. |
| **ChatMessageVersion** | Thành viên 1 | Lưu vết các phiên bản câu trả lời khi người dùng bấm Regenerate. Quan hệ n-1 với `ChatMessage`. |
| **AIFeedback** | Thành viên 1 | Đánh giá chất lượng câu trả lời AI (rating, comment). Quan hệ 1-1 với `ChatMessage`. |
| **ToolCall** | Thành viên 1 | Nhật ký thực thi các công cụ mà Agent đã gọi. Quan hệ n-1 với `ChatMessage`. |
| **KnowledgeContent** | Thành viên 1 | Lưu văn bản tri thức thô dùng cho RAG. Quan hệ 1-nhiều với `Question`/`Answer`. |
| **KnowledgeQuestion** | Thành viên 1 | Chứa các câu hỏi mẫu và trường lưu trữ vector `embeddingOpenAI` & `embeddingLocal`. |
| **KnowledgeAnswer** | Thành viên 1 | Lưu trữ các câu trả lời tương ứng với tri thức văn hóa du lịch. |
| **AIHistory** | Thành viên 1 | Nhật ký sử dụng tính năng sinh lịch trình AI, tối ưu hóa đường đi để phục vụ thống kê. |
| **UserRecommendation** | Thành viên 1 | Danh sách gợi ý địa điểm cá nhân hóa được tự động tính toán. |
| **User & Profile** | Thành viên 2 | Lưu trữ tài khoản người dùng, băm mật khẩu, phân quyền. Quan hệ 1-1. |
| **TravelPreferences** | Thành viên 2 | Lưu các thiết lập sở thích du lịch (ngân sách, phương tiện, kiểu đồng hành). |
| **Trip, TripDay, TripActivity**| Thành viên 2 | Cấu trúc phân cấp chuyến đi. Có ràng buộc duy nhất để sắp xếp thứ tự các hoạt động. |
| **Destination** | Thành viên 2 | Danh mục địa điểm, tích hợp chỉ mục tọa độ kép `@@index([latitude, longitude])`. |
| **Post, Comment, Like, Bookmark**| Thành viên 2 | Toàn bộ cơ cấu mạng xã hội chia sẻ hành trình du lịch. Comment hỗ trợ liên kết đệ quy. |
| **Follower** | Thành viên 2 | Bảng liên kết tự tham chiếu (Self-referencing) để quản lý người theo dõi. |
| **Notification** | Thành viên 2 | Lưu các thông báo đẩy thời gian thực khi có tương tác xã hội. |
| **Location** | Thành viên 2 | Lưu tọa độ GPS live mới nhất của người dùng phục vụ Live Tracking. |
| **Journey, Route, RoutePoint**| Thành viên 2 | Cơ sở dữ liệu ghi chép nhật ký hành trình phượt (GPX tracking) và tọa độ thực tế. |
| **LocationHistory** | Thành viên 2 | Nhật ký di chuyển lịch sử dạng breadcrumbs của người dùng. |
| **Event & EventAttendee** | Thành viên 2 | Quản lý các sự kiện, lễ hội du lịch và danh sách người dùng tham gia. |
| **Place/Food/BlogCache** | Thành viên 2 | Các bảng cache dữ liệu với thời gian sống TTL để tối ưu tốc độ truy xuất. |

---

## III. BẢNG PHÂN CHIA TÍCH HỢP API & KIỂM THỬ (BẢNG 3)

| Hoạt động | Nhiệm vụ kỹ thuật | Thành viên 1 (AI & Optimization) | Thành viên 2 (Web Core & GIS) |
| :--- | :--- | :---: | :---: |
| **Tích hợp API** | **OpenAI API** | **Chính (100%)** | |
| | **vietnamadminunits API** | **Chính (100%)** | |
| | **Firebase Admin Auth API** | | **Chính (100%)** |
| | **OpenStreetMap Tiles Server** | | **Chính (100%)** |
| | **WebSockets (Socket.io-client)** | | **Chính (100%)** |
| **Kiểm thử** | **Unit Test (Vitest)** | **Chính (100%)** | |
| | **Integration Test (Vitest)** | **Chính (100%)** | |
| | **Regression Test (Vitest)** | **Chính (100%)** | |
| | **API Endpoint CRUD Test** | | **Chính (100%)** |
| | **WebSocket Concurrency Test** | | **Chính (100%)** |

---

## IV. PHẦN CÔNG VIỆC CHI TIẾT CỦA THÀNH VIÊN 1

### 1. Vai trò và Triết lý Kiến trúc AI
Thành viên 1 chịu trách nhiệm xây dựng bộ não thông minh (AI Engine) và hệ thống tối ưu hóa của Terraholic. Công việc xoay quanh thiết kế mô hình hội thoại định hướng tác vụ (Task-oriented Dialogue), kỹ thuật truy xuất thông tin in-memory (RAG), tiền xử lý và nhúng từ (Embedding), và các giải thuật tối ưu toán học trên đồ thị.

### 2. Các File mã nguồn & Logic xử lý chi tiết

#### A. Phân hệ Lập kế hoạch Du lịch bằng AI ([ai-planner.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai/ai-planner.ts))
*   **Chức năng:** Nhận cấu hình chuyến đi (điểm đến, số ngày, ngân sách, phong cách du lịch) từ client, cấu trúc prompt hệ thống để gọi mô hình OpenAI `gpt-4o-mini`.
*   **Logic chi tiết:**
    *   Hàm `generateAIItinerary`: Xây dựng prompt chứa các yêu cầu chi tiết (định dạng đầu ra là JSON chuẩn hóa, chứa các mảng ngày dừng chân, thời gian hoạt động bắt đầu/kết thúc, mô tả trải nghiệm, danh mục ẩm thực và chi phí ước tính). Thực hiện parse kết quả JSON trả về một cách an toàn và lưu nhật ký vào bảng `AIHistory` phục vụ phân tích.
    *   Hàm `regenerateItineraryPart`: Cho phép người dùng tái tạo lại một phần lịch trình (một ngày cụ thể hoặc một buổi sáng/chiều/tối cụ thể) mà không thay đổi toàn bộ chuyến đi bằng cách nhúng lịch trình hiện tại và các địa điểm cần loại bỏ (`excludePlaces`) vào prompt ngữ cảnh mới.

#### B. Phân hệ Điều phối Đa tác nhân ([ai-agents/](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai-agents))
*   **Chức năng:** Lập trình hệ thống Multi-Agent có cấu trúc điều phối bằng lớp `AgentExecutorService`.
*   **Logic chi tiết:**
    *   `agent-executor.service.ts`: Sử dụng cơ chế phân tích từ khóa và định dạng câu hỏi (Natural Language Routing) để quyết định Agent nào sẽ trả lời:
        *   `travel.agent.ts`: Gọi API bản đồ và thời tiết để tư vấn lộ trình đi lại.
        *   `food.agent.ts`: Kết nối bảng dữ liệu ẩm thực địa phương để tư vấn ăn uống.
        *   `culture.agent.ts`: Nhúng ngữ cảnh tri thức để giải thích lịch sử, lễ hội.
        *   `recommendation.agent.ts`: Đề xuất địa điểm dựa trên tệp sở thích.
    *   `agent.tools.ts`: Khai báo các công cụ nghiệp vụ để Agent tự động gọi trong quá trình suy luận. Lớp này kết nối với DB để ghi nhật ký `ToolCall`.

#### C. Quy trình RAG và Semantic Search ([rag/](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag))
*   **Chức năng:** Thực hiện tìm kiếm ngữ nghĩa trên cơ sở dữ liệu tri thức nội bộ về văn hóa ẩm thực Việt Nam để bổ sung ngữ cảnh cho LLM.
*   **Logic chi tiết:**
    *   `embeddings.service.ts`: Chịu trách nhiệm chuyển hóa văn bản thành mảng vector số thực. Tích hợp giải thuật **Local Hashing Engine** dự phòng (khi OpenAI API lỗi hoặc không có API Key, hàm tự động sử dụng giải thuật băm DJB2 trên chuỗi tokens để tạo ra vector 128 chiều, thực hiện chuẩn hóa L2 normalization bằng cách chia cho độ dài Euclidean).
    *   `vector-store.service.ts`: Chứa hàm `search` tải toàn bộ các vector từ bảng `KnowledgeQuestion` lên bộ nhớ RAM, thực hiện phép nhân vô hướng để tính độ tương đồng Cosine (Cosine Similarity) giữa vector câu hỏi và vector tài liệu. Trả về top K tài liệu có điểm tương đồng lớn nhất vượt ngưỡng threshold.
    *   `prompt-builder.service.ts`: Định dạng các tài liệu tìm được thành ngữ cảnh nguồn rõ ràng có đánh số trích dẫn (Citations) gửi kèm trong prompt của OpenAI.
    *   `rag.controller.ts` & `rag.router.ts`: Khai báo các endpoints `POST /document` để ingest tài liệu mới và `POST /query` để tìm kiếm ngữ nghĩa.

#### D. Trợ lý ảo AI & Bộ nhớ cá nhân ([chatbot/](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot) & [dialogue/](file:///d:/Thuc_Tap_NDT/backend/src/modules/dialogue))
*   **Chức năng:** Lập trình bộ lưu trữ hội thoại đa phiên bản và cơ chế học thói quen người dùng.
*   **Logic chi tiết:**
    *   `chatbot.service.ts` & `chatbot.controller.ts`: Lập trình API tạo cuộc hội thoại (`ChatConversation`), lấy tin nhắn và gửi tin nhắn mới. Khi có yêu cầu tạo lại phản hồi từ client, hệ thống gọi hàm `regenerateResponse`, vô hiệu hóa phiên bản tin nhắn hiện tại (`isActive: false`), gọi Agent tạo câu trả lời mới và lưu vào bảng `ChatMessageVersion` với số thứ tự phiên bản tiếp theo.
    *   `conversation-state.service.ts` & `slot-filling.service.ts`: Phân tích hội thoại để trích xuất các thông tin sở thích của người dùng. Nếu thông tin bị thiếu (ví dụ: chưa rõ ngân sách hoặc phương tiện ưa thích), hệ thống gọi `SlotFillingService` để sinh câu hỏi gợi mở tiếp theo nhằm thu thập dữ liệu điền vào bảng `AIMemory`.
    *   `recommendations.router.ts` ([recommendations/](file:///d:/Thuc_Tap_NDT/backend/src/modules/recommendations)): Lập trình thuật toán đề xuất địa danh dựa trên việc đo khoảng cách tương đồng giữa mảng sở thích trong `AIMemory` hoặc `TravelPreferences` với danh mục địa điểm, trả về danh sách ưu tiên.

#### E. Giải thuật tối ưu hóa lộ trình di chuyển ([route-optimizer.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/optimizer/route-optimizer.ts))
*   **Chức năng:** Nhận danh sách các tọa độ địa lý dừng chân, tính toán ma trận khoảng cách bằng công thức Haversine và tìm thứ tự di chuyển tối ưu nhất.
*   **Logic chi tiết:**
    *   Hàm `solveTSPExhaustive`: Sử dụng giải thuật đệ quy vét cạn để duyệt qua tất cả $(N-1)!$ hoán vị của các điểm dừng (bắt đầu từ điểm 0), tìm đường đi ngắn nhất tuyệt đối. Giải thuật này chỉ kích hoạt khi số điểm dừng $N \le 8$ để tránh quá tải bộ nhớ và CPU.
    *   Hàm `solveTSPGreedy`: Sử dụng thuật toán tham lam lân cận gần nhất (Nearest Neighbor) khi số lượng điểm dừng $N > 8$, duyệt tìm điểm gần nhất chưa đi qua từ điểm hiện tại, độ phức tạp thuật toán giảm xuống còn $O(N^2)$ để phản hồi lập tức cho client.

#### F. Frontend AI UI & Kiểm thử tự động
*   [ChatbotPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/chatbot/ChatbotPage.tsx): Thiết kế giao diện khung chat trợ lý ảo chuyên nghiệp, hiển thị trạng thái đang nhập chữ của AI, hiển thị danh mục các công cụ (Maps, Weather...) được tác nhân sử dụng, và tích hợp bộ chọn phiên bản tin nhắn (dropdown chọn V1, V2, V3...).
*   [MemoryManager.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/chatbot/MemoryManager.tsx): Giao diện hiển thị dạng thẻ các sở thích ăn uống, phương tiện, ngân sách mà trợ lý AI đã "học" được từ thói quen chat của người dùng, hỗ trợ nút xóa hoặc sửa trực tiếp thông tin.
*   [CultureFoodGuidePage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/guide/CultureFoodGuidePage.tsx): Giao diện cẩm nang văn hóa, cho phép tìm kiếm tự do, hiển thị các tài liệu tri thức liên quan lấy từ RAG kèm hiển thị các trích dẫn tài liệu tham khảo cụ thể.
*   **Kiểm thử tự động ([__tests__](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag/__tests__)):** Lập trình các ca kiểm thử bằng Vitest:
    *   `category-detection.test.ts`: Kiểm định bộ phân loại ý định ẩm thực, văn hóa, lễ hội.
    *   `reranking.test.ts`: Kiểm thử thuật toán lọc điểm tương đồng và sắp xếp tài liệu.
    *   `rag-pipeline.test.ts`: Kiểm định toàn bộ quy trình RAG từ lúc nhận câu hỏi đến khi LLM trả lời.

---

## V. PHẦN CÔNG VIỆC CHI TIẾT CỦA THÀNH VIÊN 2

### 1. Vai trò và Triết lý Kiến trúc Web & GIS
Thành viên 2 chịu trách nhiệm thiết lập nền tảng hệ thống (System Foundation), cơ chế bảo mật xác thực, phân phối dữ liệu thời gian thực (Real-time Event-Driven WebSockets), bản đồ tương tác GIS và toàn bộ các tính năng cộng đồng mạng xã hội của Terraholic. Công việc tập trung vào hiệu năng I/O, độ trễ truyền dữ liệu, tính mượt mà của giao diện đồ họa bản đồ, và tính bền vững của các cấu trúc dữ liệu quan hệ.

### 2. Các File mã nguồn & Logic xử lý chi tiết

#### A. Cơ chế Xác thực & Middleware Bảo mật ([auth/](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth))
*   **Chức năng:** Đảm bảo hệ thống vận hành an toàn, ngăn ngừa việc chiếm dụng API bất hợp pháp.
*   **Logic chi tiết:**
    *   `auth.router.ts`: Triển khai API đăng ký, đăng nhập truyền thống, mã hóa mật khẩu 12 vòng bằng `bcryptjs`. Thiết kế cơ chế phát sinh và xác thực cặp đôi Access Token & Refresh Token.
    *   `auth.middleware.ts`: Lớp Middleware kiểm tra tính hợp lệ của JWT token nằm trong Header Authorization. Trích xuất thông tin định danh và gán vào đối tượng `req.user`. Đồng thời triển khai middleware `requireAdmin` kiểm tra trường `role === 'ADMIN'` để cấp quyền truy cập dashboard quản trị.
    *   **Google Auth Integration:** Tích hợp SDK Firebase Admin phía backend để xác thực ID Token gửi lên từ client khi người dùng click Đăng nhập Google, tự động đồng bộ thông tin và tạo tài khoản trong PostgreSQL nếu chưa tồn tại.
    *   [AuthPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/auth/AuthPage.tsx): Thiết kế giao diện form đăng ký, đăng nhập responsive, chuyển động vi mô khi tương tác lỗi và kết nối nút đăng nhập Google.

#### B. Phân hệ Bản đồ Tương tác GIS & live tracking ([map/](file:///d:/Thuc_Tap_NDT/backend/src/modules/map))
*   **Chức năng:** Bản đồ tương tác hiển thị dữ liệu địa lý và chia sẻ vị trí trực tiếp.
*   **Logic chi tiết:**
    *   [MapDashboard.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx) (Frontend):
        *   Tích hợp bản đồ Leaflet sử dụng nguồn tiles OpenStreetMap.
        *   Lập trình tính năng Marker Cluster giúp tự động gom cụm các địa điểm khi thu nhỏ bản đồ bằng thư viện `Leaflet.markercluster`.
        *   Thiết lập Heatmap Overlay vẽ bản đồ nhiệt biểu diễn tần suất check-in của cộng đồng.
        *   **Trích xuất tọa độ GPS từ ảnh chụp (EXIF Extractor):** Tự viết hàm giải mã nhị phân file JPEG (`parseEXIFGPS` sử dụng đối tượng `DataView` và cấu trúc `ArrayBuffer` ở phía client). Hàm quét file ảnh tải lên để tìm byte marker EXIF (`0xFFE1`), giải mã cấu trúc cây thư mục ảnh TIFF, trích xuất dữ liệu thẻ vĩ độ/kinh độ GPS, đổi sang định dạng độ thập phân (Decimal Degrees) để định vị nhanh điểm check-in trên bản đồ mà không cần thông qua server.
    *   `map.router.ts` & `gis-helper.ts` (Backend):
        *   Hàm `calculateHaversineDistance`: Tính toán khoảng cách cung lớn giữa hai cặp tọa độ trên bề mặt Trái Đất để phục vụ tìm kiếm địa danh xung quanh trong bán kính xác định.
        *   **WebSocket Live Tracking:** Trong file `server.ts`, khởi tạo Socket.io Server lắng nghe sự kiện `ping_location`. Server nhận tọa độ trực tiếp của người dùng, cập nhật vào bảng `Location`, sau đó gọi hàm phát sóng `socket.to(room).emit('friend_location_updated')` gửi vị trí trực tiếp của người dùng đến những bạn bè đang theo dõi để vẽ vị trí trực tiếp lên bản đồ.

#### C. Lập kế hoạch chuyến đi (Web & CRUD) ([trips/](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips) & [trips/TripPlanner.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/trips/TripPlanner.tsx))
*   **Chức năng:** Quản lý quy trình lập kế hoạch du lịch thủ công và cộng tác lịch trình.
*   **Logic chi tiết:**
    *   `trips.router.ts`: Cung cấp các endpoints CRUD chuyến đi, lưu trữ các hoạt động trong ngày kèm theo các thông tin chi tiết (`startTime`, `endTime`, `estimatedCost`).
    *   **Giải thuật Deep Clone:** Lập trình API `POST /trips/:id/clone` cho phép sao chép chuyến đi công khai của thành viên khác. Hàm thực thi truy vấn Prisma tạo mới bản ghi `Trip`, đồng thời sao chép toàn bộ danh sách `TripDay` và `TripActivity` liên kết tương ứng sang tài khoản người dùng mới.
    *   [TripPlanner.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/trips/TripPlanner.tsx): Phát triển giao diện lập kế hoạch kéo thả trực quan. Tích hợp thanh trượt quản lý ngân sách chuyến đi, danh sách các hoạt động xếp theo timeline dạng dọc, kết nối các địa điểm hoạt động với các marker hiển thị trên bản đồ Leaflet đi kèm.

#### D. Mạng xã hội du lịch & Câu chuyện du lịch ([posts/](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts) & [stories/](file:///d:/Thuc_Tap_NDT/frontend/src/features/stories))
*   **Chức năng:** Nơi giao lưu chia sẻ hành trình phượt của cộng đồng du lịch.
*   **Logic chi tiết:**
    *   `posts.router.ts` & `social.router.ts`: Cung cấp các API CRUD bài viết, xử lý mảng hình ảnh tải lên. Lập trình tính năng thích bài viết, bookmark bài viết.
    *   **Bình luận đa cấp (Threaded Comments):** Thiết kế bảng `Comment` liên kết tự tham chiếu qua khóa ngoại `parentId`. Phía backend xử lý truy vấn đệ quy để gom cụm các bình luận con lồng nhau dưới bình luận cha. Phía frontend xử lý đệ quy React components để kết xuất ra giao diện luồng bình luận có thụt lề trực quan.
    *   [CreateStoryPage.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/stories/CreateStoryPage.tsx): Giao diện viết Blog hành trình du lịch cao cấp (dung lượng file 84KB), hỗ trợ người dùng nhập liệu phong phú, chọn ảnh hàng loạt, và đặc biệt là đính kèm trực tiếp ID chuyến đi của mình vào Story để người đọc có thể nhấp vào xem bản đồ lộ trình hoặc bấm nút clone chuyến đi.

#### E. Bảng quản trị & Caching ([analytics/](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics) & [cache/](file:///d:/Thuc_Tap_NDT/backend/src/modules/cache))
*   **Chức năng:** Quản lý hiệu năng hệ thống, lưu bộ đệm và giao diện giám sát Admin.
*   **Logic chi tiết:**
    *   `analytics.router.ts`: Tổng hợp các chỉ số cơ sở dữ liệu (tổng số người dùng, số lượt check-in, bài đăng). Tính toán độ trễ trung bình của các kết nối Websocket chia sẻ vị trí và thời gian phản hồi của dịch vụ RAG.
    *   `cache.service.ts` ([cache/](file:///d:/Thuc_Tap_NDT/backend/src/modules/cache)): Lập trình bộ đệm lưu trữ PostgreSQL (`PlaceCache`, `FoodCache`, `BlogCache`) hoạt động theo cơ chế khóa key-value đi kèm trường thời gian hết hạn `expiresAt` (TTL Caching) giúp lưu trữ tạm thời các địa điểm hoặc bài viết truy xuất thường xuyên, giảm tải cho ổ đĩa I/O và tăng tốc thời gian phản hồi API xuống dưới 5ms.
    *   [AdminDashboard.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/admin/AdminDashboard.tsx): Giao diện Admin trực quan hiển thị các biểu đồ tiến trình hoạt động của hệ thống và các chỉ số đo lường hiệu năng kỹ thuật của AI.

#### F. Thiết kế Cơ sở Dữ liệu & Kiểm thử
*   **Thiết kế Database:** Tạo lập cấu trúc các bảng cốt lõi trong [schema.prisma](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma) (25 bảng hệ thống web), tối ưu hóa các liên kết khóa ngoại (`onDelete: Cascade`), thiết lập chỉ mục kép vĩ độ/kinh độ phục vụ tìm kiếm bounding box.
*   **Kiểm thử chức năng:** Thực hiện kiểm thử toàn bộ vòng đời của các REST API bằng Postman/Insomnia, thực thi kiểm thử tích hợp kết nối thời gian thực WebSocket (Socket.io) giả lập nhiều kết nối client để đo độ chịu tải của server định vị GPS.

---

## VI. ĐÁNH GIÁ MỨC ĐỘ CÂN BẰNG KHỐI LƯỢNG CÔNG VIỆC

Qua phân tích chi tiết đến cấp độ tệp tin và dòng code, khối lượng công việc được phân chia đạt trạng thái **Cân bằng hoàn hảo (~50% - 50%)** theo cấu trúc phân bổ sau:

1.  **Frontend & Backend:** Cả hai thành viên đều làm Full-Stack (tự lập trình từ giao diện React UI, Redux State đến tầng Router, Controller, Service và database query của module mình).
2.  **Mức độ Phức tạp:**
    *   **Thành viên 1:** Gánh vác sự phức tạp về mặt thuật toán khoa học máy tính: Tích hợp mô hình AI, RAG Pipeline ngữ nghĩa, tính tương đồng cosine vector, băm Local Hashing nhị phân, giải thuật đồ thị TSP đệ quy tối ưu lộ trình và bộ nhớ chatbot.
    *   **Thành viên 2:** Gánh vác sự phức tạp về mặt quy mô hệ thống Web thực tế: Lập trình giao diện bản đồ GIS Leaflet, trích xuất dữ liệu EXIF JPEG nhị phân, truyền tải WebSocket thời gian thực, cơ chế bảo mật JWT Token Rotation phức tạp, threaded comments đệ quy, trình soạn thảo Story 84KB, cache TTL và bảng quản trị Admin.
3.  **Tích hợp API & Kiểm thử:** Thành viên 1 phụ trách các API AI và kiểm thử tự động (Vitest Unit/Integration Tests); Thành viên 2 phụ trách các API bản đồ, bảo mật và kiểm thử tích hợp thủ công, WebSocket concurrency.

Bản phân chia chi tiết này là cơ sở khoa học và thực tế vững chắc nhất giúp hai thành viên tự tin bảo vệ khóa luận trước hội đồng, chứng minh rõ ràng vai trò và sự đóng góp của mình vào dự án **Terraholic**.
