# ✈️ Terraholic - AI-Powered Travel Planning & Social Platform

Chào mừng bạn đến với **Terraholic**, một nền tảng mạng xã hội kết hợp lập kế hoạch du lịch thông minh, tối ưu hóa lộ trình di chuyển và hỗ trợ tra cứu thông tin văn hóa ẩm thực địa phương thông qua Trí tuệ nhân tạo (AI).

Tài liệu này được biên soạn chi tiết giúp các lập trình viên mới tiếp cận dự án có thể nhanh chóng nắm bắt mục đích, kiến trúc, công nghệ, cấu trúc mã nguồn và luồng hoạt động của hệ thống.

---

## 📌 BẢN ĐỒ PHÂN TÍCH DỰ ÁN (20 CHỦ ĐỀ CỐT LÕI)

### 1. Mục đích của dự án
*   **Mục đích cốt lõi:** Xây dựng một ứng dụng mạng xã hội du lịch thông minh, nơi người dùng có thể lên kế hoạch cho các chuyến đi của mình một cách khoa học nhất nhờ sự hỗ trợ đắc lực từ AI.
*   **Giá trị mang lại:**
    *   Giúp người dùng giải phóng thời gian lập kế hoạch nhờ AI sinh lịch trình tự động.
    *   Tối ưu hóa quãng đường di chuyển thực tế bằng thuật toán giải bài toán người bán hàng du lịch (TSP).
    *   Kết nối những người đam mê xê dịch qua các tính năng mạng xã hội (đăng bài, viết blog, check-in, chia sẻ vị trí realtime).
    *   Bảo tồn và quảng bá tri thức văn hóa, lễ hội, lịch sử vùng miền bằng mô hình RAG (Retrieval-Augmented Generation).

### 2. Dự án giải quyết bài toán gì
*   **Bài toán lên lịch trình phức tạp:** AI tự động phân bổ hoạt động sáng - trưa - tối dựa trên ngân sách, số ngày, sở thích, tránh việc người dùng phải tự tìm kiếm rời rạc.
*   **Bài toán tối ưu hóa di chuyển (Routing Optimization):** Khi người dùng muốn đi nhiều điểm trong một ngày, hệ thống sẽ giải bài toán TSP để sắp xếp thứ tự đi tối ưu nhất, hạn chế đi đường vòng, tiết kiệm xăng cộ và thời gian.
*   **Bài toán ảo tưởng của AI (LLM Hallucination):** Khi hỏi về văn hóa truyền thống, lịch sử, AI thông thường có thể trả lời sai lệch. Hệ thống giải quyết bằng cách áp dụng **RAG** để tìm kiếm thông tin chính xác từ kho tri thức nội bộ rồi mới đưa vào ngữ cảnh trả lời của AI.
*   **Bài toán cá nhân hóa (Personalization):** Lưu lại thông tin sở thích, thói quen ăn uống, ngân sách của từng người dùng vào bộ nhớ dài hạn của AI (AI Memory) để các đề xuất sau này ngày càng chuẩn xác hơn.
*   **Bài toán tương tác thời gian thực (Realtime Collaboration):** Hỗ trợ nhiều người dùng cùng chỉnh sửa một lịch trình du lịch (Co-planning) và cập nhật vị trí GPS của bạn bè trên bản đồ thời gian thực.

### 3. Kiến trúc tổng thể
Hệ thống được thiết kế theo mô hình **Modular Monolith** ở Backend và **Single Page Application (SPA)** ở Frontend:

```mermaid
graph TD
    subgraph Frontend [React SPA Client]
        UI[Tailwind & Lucide UI] --> RC[React Components]
        RC --> RQ[React Query / Redux Store]
        RC --> MapLibre[Bản đồ MapLibre GL]
        RQ --> Axios[Axios API Client]
        RC --> SocketClient[Socket.io Client]
    end

    subgraph Backend [Express TypeScript Server]
        Axios --> Router[Express Router / Middlewares]
        Router --> Controllers[Controllers]
        Controllers --> Services[Services Layer]
        Services --> Agents[AI Multi-Agents Executor]
        Agents --> Tools[Agent Tools: Weather, Maps, RAG]
        Services --> TSP[TSP Optimizer Algorithm]
        Services --> Prisma[Prisma ORM]
        SocketClient <--> SocketServer[Socket.io Realtime Server]
    end

    subgraph External [Dịch vụ bên ngoài]
        Services --> OpenAI[OpenAI API: GPT-4o-mini & Embeddings]
        Services --> Firebase[Firebase Admin SDK: Google Login]
    end

    subgraph Database [Lớp lưu trữ]
        Prisma --> PostgreSQL[(PostgreSQL Database)]
        Services -.-> Redis[(Redis Cache)]
    end
```

### 4. Công nghệ sử dụng
*   **Frontend Framework:** React 19 (RC), TypeScript, Vite.
*   **State Management:** Redux Toolkit (quản lý Auth), React Query / TanStack Query v5 (quản lý data caching từ API).
*   **CSS & Icons:** Tailwind CSS, Lucide React.
*   **GIS/Maps:** MapLibre GL, React Map GL (hiển thị danh mục điểm đến, vẽ route).
*   **Backend Runtime:** Node.js, Express, TypeScript.
*   **Database ORM:** Prisma Client v5.
*   **Database:** PostgreSQL.
*   **Realtime:** Socket.io & Socket.io-client.
*   **AI Integration:** OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), Firebase Admin SDK.
*   **Security:** JSON Web Token (JWT) Access/Refresh tokens, bcryptjs.

### 5. Cấu trúc thư mục

```text
Thuc_Tap_NDT/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # Các bản cập nhật cấu trúc database
│   │   └── schema.prisma       # Định nghĩa các Model Database (PostgreSQL)
│   ├── src/
│   │   ├── config/             # Cấu hình db, firebase, database seed
│   │   ├── modules/            # Chứa 20 module nghiệp vụ độc lập
│   │   │   ├── auth/           # Đăng ký, đăng nhập, JWT middleware
│   │   │   ├── trips/          # CRUD Trip, lập kế hoạch AI, TSP route optimize
│   │   │   ├── posts/          # Bài viết, likes, bookmarks, comments
│   │   │   ├── map/            # Check-in, live GPS location, GIS helper
│   │   │   ├── chatbot/        # Tin nhắn Chatbot, Message Versioning, AI Memory
│   │   │   ├── ai-agents/      # AI Agents (Travel, Food, Culture, Recommendation) & Tools
│   │   │   ├── rag/            # Vector embeddings, Vector store search, Prompt builder
│   │   │   ├── optimizer/      # Thuật toán TSP (Exhaustive & Greedy)
│   │   │   └── ...             # Các module phụ trợ khác (travel-history, analytics...)
│   │   ├── app.ts              # Cấu hình Express app & đăng ký router
│   │   └── server.ts           # Khởi tạo HTTP, Socket.io, database seeding
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Component dùng chung (Map, Auth, Feed, Layout...)
│   │   ├── config/             # Cấu hình API endpoints
│   │   ├── features/           # Chứa giao diện trang theo tính năng
│   │   │   ├── auth/           # Trang Login/Register
│   │   │   ├── chatbot/        # Trang Chatbot AI, cài đặt Memory
│   │   │   ├── map/            # Trang Bản đồ tương tác check-in, live friend location
│   │   │   ├── profile/        # Trang cá nhân, preferences
│   │   │   └── ...             # Các trang blog, feed, stories, analytics...
│   │   ├── hooks/              # Custom hooks (useRequireAuth.ts)
│   │   ├── services/           # Trục kết nối API Axios (smartTravel.service.ts)
│   │   ├── store/              # Redux Toolkit setup (authSlice.ts)
│   │   ├── App.tsx             # Quản lý routing chính của ứng dụng
│   │   └── main.tsx            # Điểm khởi chạy React
│   ├── package.json
│   └── tailwind.config.js
└── README.md                   # Tài liệu hướng dẫn (File này)
```

### 6. Chức năng của từng module
Hệ thống backend chia làm 20 module cốt lõi:
1.  **auth:** Quản lý vòng đời tài khoản, cấp phát Access Token và Refresh Token, tích hợp đăng nhập Google qua Firebase.
2.  **trips:** Lập kế hoạch chuyến đi thủ công hoặc bằng AI (`/ai-generate`). Hỗ trợ sao chép (`/clone`) chuyến đi công khai của người khác.
3.  **posts:** Bài viết mạng xã hội của người dùng, hỗ trợ tải ảnh, thích (like), lưu bài viết (bookmark), bình luận phân cấp.
4.  **map:** Xử lý GIS, cập nhật vị trí trực tiếp (live GPS) của người dùng, check-in địa điểm du lịch, tìm các địa điểm xung quanh.
5.  **recommendations:** Gợi ý điểm đến cá nhân hóa dựa trên thuật toán Content-Based và gợi ý điểm đến xung quanh tọa độ hiện tại.
6.  **social:** Quản lý profile người dùng, follow/unfollow, danh sách bạn bè, gửi thông báo realtime (like, comment, follow).
7.  **chatbot:** Quản lý hội thoại với AI, cơ chế lưu tin nhắn đa phiên bản (Message Versioning), quản lý bộ nhớ AI Memory.
8.  **ai-agents:** Lớp AI Agent thông minh. Sử dụng Strategy Pattern chia làm 4 Agent: Travel, Food, Culture và Recommendation Agent; lưu vết các cuộc gọi công cụ bên ngoài (`ToolCall`).
9.  **rag:** Cơ sở dữ liệu tri thức. Tạo vector embedding cho tài liệu lịch sử/văn hóa vùng miền và tìm kiếm tương đồng Cosine Similarity để làm ngữ cảnh trả lời cho AI.
10. **optimizer:** Chứa thuật toán tối ưu hóa hành trình (giải bài toán TSP).
11. **cache:** Cache kết quả gọi API thời tiết, địa điểm, blog ngoài vào DB nhằm tăng tốc và tối ưu chi phí API.
12. **travel-history:** Ghi lại lịch sử các điểm người dùng đã đi qua, đánh giá và tổng chi phí.
13. **favorite-foods:** Lưu trữ và quản lý danh sách các món ăn ưa thích của người dùng.
14. **saved-places:** Lưu trữ các địa điểm (nhà hàng, khách sạn, điểm tham quan) ưa thích để vẽ nhanh lên bản đồ.
15. **feedback:** Đánh giá phản hồi tin nhắn AI của người dùng (rating, góp ý).
16. **tool-calls:** Ghi nhật ký các lần AI Agent gọi Weather, Maps, Itinerary, Culture tools.
17. **analytics:** Cung cấp dữ liệu báo cáo thống kê, biểu đồ cột chi phí du lịch, heatmap vị trí check-in, lịch sử gọi AI cho Admin.
18. **itinerary:** Quản lý các bản nháp lịch trình do AI tạo ra.
19. **favorite-foods (route):** APIs quản lý món ăn yêu thích.
20. **saved-places (route):** APIs quản lý địa điểm đã lưu.

### 7. Luồng hoạt động của hệ thống (Workflows)
*   **Luồng Lên kế hoạch du lịch bằng AI:**
    1. Người dùng chọn điểm đến, số ngày, ngân sách, sở thích trên UI.
    2. Frontend gửi request lên `/api/v1/trips/ai-generate`.
    3. Backend gọi `generateAIItinerary` (gọi OpenAI `gpt-4o-mini` kèm System Prompt định nghĩa cấu trúc JSON đầu ra rất khắt khe).
    4. AI trả về lịch trình dưới dạng JSON (bao gồm toạ độ đoán trước của địa điểm).
    5. Backend lưu vết lịch trình này vào bảng `AIHistory` và trả dữ liệu về Frontend.
    6. Frontend vẽ lịch trình từng ngày lên bản đồ MapLibre.
*   **Luồng Tối ưu hóa lộ trình di chuyển (TSP):**
    1. Người dùng thêm nhiều địa điểm tham quan vào một ngày đi trên bản đồ.
    2. Nhấn nút "Tối ưu hóa đường đi".
    3. Frontend gửi mảng toạ độ (`waypoints`) lên `/api/v1/trips/optimize-route`.
    4. Backend dùng `gis-helper` tính ma trận khoảng cách giữa toàn bộ các cặp điểm (Haversine Formula).
    5. Chạy thuật toán TSP: Nếu số điểm <= 8, dùng thuật toán Duyệt cạn hoán vị (Exhaustive Permutation Search) để tìm ra đường đi ngắn nhất tuyệt đối O(N!). Nếu số điểm > 8, dùng thuật toán tham lam lân cận gần nhất (Greedy Nearest Neighbor) O(N^2) để trả về kết quả nhanh chóng.
    6. Trả về mảng điểm đã sắp xếp tối ưu.
    7. Bản đồ ở Frontend tự vẽ lại đường nối (polyline) di chuyển theo thứ tự mới.
*   **Luồng Chatbot AI hỗ trợ RAG & AI Memory:**
    1. Người dùng gửi tin nhắn: "Hãy giới thiệu cho tôi lễ hội nổi bật ở Hà Giang".
    2. Frontend gọi API `/api/v1/chatbot/conversations/:id/messages`.
    3. Chatbot Service nhận request, truy vấn DB lấy thông tin bộ nhớ `AIMemory` của người dùng và lịch sử trò chuyện.
    4. Gửi yêu cầu qua `AgentExecutorService` -> Phân tích NLP từ khóa phát hiện từ "lễ hội" -> Điều hướng (route) request sang `CultureAgent`.
    5. `CultureAgent` gọi `CultureTool` -> `CultureTool` truy xuất cơ sở tri thức cục bộ bằng **RAG**: sinh vector embedding cho câu hỏi và truy vấn Cosine Similarity trên bảng `DocumentKnowledge` để tìm các tài liệu lễ hội Hà Giang liên quan nhất.
    6. Tổng hợp bối cảnh tri thức (Context) vào prompt gửi tới OpenAI (hoặc fallback cục bộ).
    7. Lưu vết cuộc gọi công cụ vào bảng `ToolCall` và tạo bản ghi phản hồi mới (`ChatMessageVersion` v1).
    8. Trả kết quả về cho người dùng.

### 8. API đang sử dụng
*   **Lớp API nội bộ (RESTful):**
    *   `/api/v1/auth`: Đăng ký, đăng nhập, token refresh.
    *   `/api/v1/trips`: CRUD chuyến đi, AI planner, TSP optimizer.
    *   `/api/v1/posts`: Quản lý bài đăng mạng xã hội, tương tác.
    *   `/api/v1/map`: Cập nhật GPS trực tiếp, check-in, bạn bè.
    *   `/api/v1/chatbot`: Chatbot, AI Memory.
    *   `/api/v1/rag`: Nạp tài liệu tri thức, truy vấn thử nghiệm RAG.
*   **Lớp API bên ngoài:**
    *   OpenAI API: `/v1/chat/completions` (sinh lịch trình, trả lời chatbot) và `/v1/embeddings` (sinh vector RAG).
    *   Firebase Authentication: Xác thực người dùng qua Google OAuth.

### 9. Database được thiết kế như thế nào
Database PostgreSQL được thiết kế chặt chẽ và nhất quán qua Prisma ORM:

```text
[User] ──(1:1)── [Profile]
  │
  ├──(1:1)── [TravelPreferences] (preferredPace, dailyBudget, activities, foodPreferences...)
  ├──(1:1)── [AIMemory] (Bộ nhớ sở thích dài hạn của AI về User)
  ├──(1:N)── [Trip] ──(1:N)── [TripDay] ──(1:N)── [TripActivity] ──(N:1)── [Destination] (Địa điểm bản đồ)
  ├──(1:N)── [Post] (Bài viết MXH) ──(1:N)── [Comment] (Bình luận đa cấp parent-child)
  │            │
  │            ├──(1:N)── [Like]
  │            └──(1:N)── [Bookmark]
  ├──(1:N)── [CheckIn] (Check-in địa điểm)
  ├──(1:N)── [ChatConversation] ──(1:N)── [ChatMessage] ──(1:N)── [ChatMessageVersion] (Lịch sử phiên bản)
  │                                           │
  │                                           ├──(1:1)── [AIFeedback] (Đánh giá của người dùng)
  │                                           └──(1:N)── [ToolCall] (Nhật ký gọi tool)
  ├──(1:1)── [Location] (Tọa độ định vị GPS realtime của User)
  └──(1:N)── [Follower] (Bảng quan hệ nhiều-nhiều tự tham chiếu để follow chéo)
```

Ngoài ra còn có:
*   `DocumentKnowledge`: Lưu trữ tài liệu tri thức RAG (`embedding Float[]`).
*   `PlaceCache`, `FoodCache`, `BlogCache`: Lưu dữ liệu cache API bên ngoài dưới dạng JSON kèm thời gian hết hạn (`expiresAt`).

### 10. Authentication & Authorization
*   **Xác thực (Authentication):**
    *   Sử dụng cơ chế Dual JWT (Access Token & Refresh Token).
    *   Access Token đính kèm ở header `Authorization: Bearer <token>`, thời gian sống ngắn.
    *   Refresh Token lưu ở localStorage và Database (đối chiếu), thời gian sống dài.
    *   Đăng nhập Google: Frontend nhận `idToken` từ Google Auth -> gửi lên Backend -> Backend dùng Firebase Admin SDK verify -> Nếu hợp lệ, tự động tạo tài khoản hoặc đăng nhập User tương ứng và cấp phát cặp JWT nội bộ.
*   **Phân quyền (Authorization):**
    *   `requireAuth`: Middleware giải mã JWT và gán `{ sub, role }` vào `req.user`. Nếu không có hoặc token hết hạn, trả về 401.
    *   `requireAdmin`: Kiểm tra `req.user.role === 'ADMIN'`, nếu không phải, chặn và trả về 403.
    *   `optionalAuth`: Thử giải mã token để hiển thị nội dung cá nhân hóa nếu có, nếu không có vẫn cho phép request đi qua dưới danh nghĩa khách vãng lai (Anonymous).
    *   *Kiểm tra sở hữu:* Trước khi sửa đổi Trip, Post, Comment, Memory, Backend luôn kiểm tra `record.ownerId === req.user.sub`.

### 11. Các service
*   **Backend Services:**
    *   `ChatbotService`: Điều phối lưu trữ tin nhắn, gọi Agent Executor, lưu trữ các Chat Message Versions, quản lý Memory.
    *   `AgentExecutorService`: Chứa logic Dependency Injection tiêm các Tool vào Agent và định tuyến Natural Language Routing dựa trên từ khóa câu hỏi.
    *   `EmbeddingsService`: Quản lý sinh vector. Nếu OpenAI API lỗi/thiếu key, tự động chuyển sang **Local Hashing Engine** dùng thuật toán băm DJB2 và normalize L2.
    *   `VectorStoreService`: Thực hiện lưu trữ tài liệu tri thức và tính toán Cosine Similarity trực tiếp trên RAM phục vụ việc tìm kiếm ngữ nghĩa (Semantic Search).
    *   `RetrieverService`: Phối hợp sinh vector câu hỏi và tìm kiếm tài liệu từ Vector Store.
    *   `PromptBuilderService`: Đóng gói câu hỏi và tài liệu tri thức thành prompt chuyên nghiệp gửi tới AI.
*   **Frontend Services (`smartTravel.service.ts`):**
    *   Đóng gói toàn bộ các REST APIs backend thành các đối tượng có kiểu dữ liệu (Types) rõ ràng: `authService`, `tripsService`, `postsService`, `mapService`, `recommendationsService`, `socialService`, `chatbotService`, `feedbackService`.

### 12. Các helper
*   **Backend Helpers:**
    *   `gis-helper.ts`:
        *   `calculateHaversineDistance`: Tính khoảng cách vòng lớn giữa 2 tọa độ GPS (km).
        *   `calculateBoundingBox`: Tính khoảng toạ độ giới hạn (min/max Lat, min/max Lng) xung quanh một điểm với bán kính R để truy vấn tối ưu bằng Index trong Database trước khi tính toán Haversine chính xác.
        *   `checkGeofence`: Kiểm tra một tọa độ có nằm trong vùng đa giác địa lý (Geofence) hay không bằng thuật toán bắn tia Ray-Casting (Jordan Curve).
    *   `chatbot.utils.ts` & `ai-planner.ts`: Chứa các hàm sinh câu trả lời chatbot giả lập bằng Regex/từ khóa và sinh lịch trình fallback khi hệ thống chạy ở chế độ offline/không cấu hình API key.
*   **Frontend Helpers:**
    *   Axios Interceptors:
        *   *Request:* Tự động chèn JWT Access Token vào mọi request nếu có trong `localStorage`.
        *   *Response:* Nếu API trả về lỗi `401` (hết hạn Access Token), tự động gọi API `/auth/refresh` lấy token mới rồi gửi lại request cũ. Nếu Refresh Token cũng hết hạn, tự động xóa sạch phiên đăng nhập, phát đi sự kiện `auth:logout` để cập nhật Redux store và đẩy người dùng về trang đăng nhập `/auth`.

### 13. Middleware
*   **Backend Middlewares:**
    *   `requireAuth`, `requireAdmin`, `optionalAuth`: Xử lý xác thực và phân quyền người dùng.
    *   `validateCreateConversation`, `validateSendMessage`, `validateSaveMemory`: Xác thực dữ liệu đầu vào (Payload Validation) của chatbot.
    *   `saved-place.validation.ts`, `recommendation.validation.ts`: Đảm bảo toạ độ GPS gửi lên hợp lệ.
*   **Frontend Middlewares:**
    *   `ProtectedRoute`: React component đóng gói bảo vệ các trang yêu cầu đăng nhập. Nếu chưa đăng nhập, tự động lưu lại trang hiện tại và chuyển hướng về `/auth`.

### 14. Hooks
*   `useRequireAuth.ts`: Hook kiểm tra trạng thái xác thực từ Redux Store và cung cấp hàm kiểm tra nhanh để điều hướng người dùng sang trang `/auth` nếu cần bảo vệ hành động nào đó (ví dụ nhấn nút Thích bài viết hoặc Lưu địa điểm khi chưa đăng nhập).

### 15. Component dùng chung
*   `Map`: Component bản đồ tương tác (dựa trên MapLibre GL). Hỗ trợ hiển thị các icon marker phân loại theo danh mục (khách sạn, nhà hàng, điểm tham quan), vẽ đường đi lịch trình, hiển thị vòng tròn bán kính tìm kiếm lân cận, marker check-in, và hiển thị vị trí thời gian thực của bạn bè.
*   `LoadingOverlay`: Component hiển thị hiệu ứng xoay tròn tải dữ liệu phủ lên màn hình.
*   `UserMenuDropdown`: Dropdown menu hiển thị ảnh đại diện người dùng, liên kết nhanh tới Trang cá nhân, Cài đặt và nút Đăng xuất.

### 16. Các trang chính
Ứng dụng gồm 18 trang chính (được khai báo tập trung trong `frontend/src/App.tsx`):
1.  **`/auth` (AuthPage):** Giao diện đăng nhập/đăng ký/đăng nhập Google.
2.  **`/` (SocialFeedPage):** Bảng tin mạng xã hội hiển thị bài đăng, hình ảnh xê dịch của cộng đồng.
3.  **`/explore` (BlogPage):** Trang đọc bài viết blog du lịch chuyên sâu.
4.  **`/explore/post/:id` (ExploreArticlePage):** Chi tiết bài blog.
5.  **`/explore/cam-nang/:type` (ExploreHandbookPage):** Đọc cẩm nang du lịch (văn hóa, ẩm thực, lịch sử).
6.  **`/map` (MapDashboard):** Bản đồ tương tác lớn xem check-in lân cận, GPS live location.
7.  **`/trips` (TripPlanner):** Giao diện lập kế hoạch chuyến đi, thiết lập lịch trình từng ngày tự động bằng AI và tối ưu hóa TSP.
8.  **`/chat` (ChatbotPage):** Khung chat trò chuyện với trợ lý ảo AI, xem các bản tin nhắn cũ/mới, cập nhật sở thích cho AI Memory.
9.  **`/guide/culture-food` (CultureFoodGuidePage):** Cẩm nang tra cứu nhanh văn hóa địa phương.
10. **`/journeys/create` (CreateStoryPage):** Tạo tin ngắn/hình ảnh hành trình nhanh.
11. **`/profile` (ProfilePage):** Trang cá nhân, danh sách bài viết đã đăng, chuyến đi đã lên kế hoạch.
12. **`/profile/following` (FollowingPage):** Danh sách người đang theo dõi và người theo dõi mình.
13. **`/profile/saved` (SavedPage):** Xem lại các bài viết và địa điểm bản đồ đã lưu.
14. **`/profile/settings` (SettingsPage):** Cập nhật thông tin cá nhân và bảng sở thích du lịch cá nhân hóa.
15. **`/notifications` (NotificationsPage):** Danh sách thông báo tương tác xã hội.
16. **`/analytics` (AdminDashboard):** Trang quản trị viên thống kê số lượng check-in (heatmap), cuộc gọi AI, biểu đồ chi phí du lịch.

### 17. State management
*   **Redux Toolkit (Global State):** Quản lý trạng thái đăng nhập của người dùng (`auth` slice). Giúp toàn bộ ứng dụng biết được thông tin User hiện tại là ai và có đang đăng nhập hay không.
*   **React Query / TanStack Query (Server State):** Chịu trách nhiệm gọi API, lưu cache dữ liệu từ Server (ví dụ danh sách bài đăng, thông tin chuyến đi) để tránh gọi API lặp lại khi chuyển trang, tự động đồng bộ lại khi người dùng thao tác.
*   **React useState/useRef (Local State):** Quản lý trạng thái giao diện tạm thời như mở/đóng modal, tin nhắn đang nhập, bộ lọc tìm kiếm.

### 18. Quy trình dữ liệu từ Frontend → Backend → Database
Sơ đồ mô tả luồng di chuyển của dữ liệu qua các lớp kiến trúc (Ví dụ: Hành động gửi tin nhắn Chatbot):

```text
[Frontend UI]
  │  (Người dùng gõ tin nhắn "Hà Nội đi đâu ngon?" và nhấn Gửi)
  ▼
[chatbotService.sendMessage] ──(Axios Request Interceptor chèn JWT Token)──> [HTTP POST /api/v1/chatbot/conversations/:id/messages]
                                                                                │
                                                                                ▼
                                                                        [requireAuth Middleware] (Giải mã JWT và xác thực người dùng)
                                                                                │
                                                                                ▼
                                                                        [validateSendMessage] (Xác thực nội dung tin nhắn không rỗng)
                                                                                │
                                                                                ▼
                                                                        [ChatbotController.sendMessage]
                                                                                │
                                                                                ▼
                                                                        [ChatbotService.sendMessage]
                                                                                │
                                                                                ├─> [ChatbotRepository.createMessage] ──> [DB: ChatMessage & Version]
                                                                                ├─> [ChatbotRepository.getMemoryByUserId] ──> [DB: AIMemory]
                                                                                ├─> [ChatbotRepository.getConversationHistoryForAI] ──> [DB: ChatHistory]
                                                                                │
                                                                                ▼
                                                                        [AgentExecutorService.execute] (Tự động định tuyến NLP)
                                                                                │
                                                                                ├─> Phân tích từ khóa "ngon" -> Gọi [FoodAgent]
                                                                                │
                                                                                ▼
                                                                        [FoodAgent.execute]
                                                                                │
                                                                                ├─> Chạy [FoodTool.execute]
                                                                                │     └─> Tìm kiếm món ăn đặc sản Hà Nội từ DB/Cache
                                                                                │
                                                                                ▼
                                                                        [Prisma Client] ──(Lưu nhật ký gọi công cụ)──> [DB: ToolCall]
                                                                                │
                                                                                ▼
                                                                        [FoodAgent] tổng hợp kết quả -> Trả về văn bản gợi ý ẩm thực
                                                                                │
                                                                                ▼
                                                                        [ChatbotService] ──> [ChatbotRepository.createMessageVersion] (Lưu câu trả lời AI)
                                                                                │
                                                                                ▼
[Frontend UI] <──(Trả về HTTP 200 JSON kèm tin nhắn User & AI + danh sách ToolCall)── [ChatbotController]
  │
  ▼
(React Query cập nhật cache -> Giao diện render tin nhắn và hiển thị icon "Đã gọi công cụ Food")
```

### 19. Những điểm cần chú ý
*   **Mô hình Agent Strategy & Dependency Injection:** Lớp AI Agent được thiết kế rất chuẩn mực. Khi muốn mở rộng thêm Agent mới (như HotelAgent, FlightAgent), lập trình viên chỉ cần tạo class kế thừa `AgentStrategy` và cấu hình tiêm các tool tương ứng vào mà không cần chỉnh sửa code của chatbot core.
*   **Cơ chế Offline-Fallback thông minh:** Dự án không bị phụ thuộc cứng vào OpenAI API. Khi thiếu API key hoặc API bị lỗi, hệ thống sẽ tự động dùng Local Hashing Engine (DJB2 + L2 Normalize) để sinh vector và tìm kiếm tương đồng Cosine ngay trên bộ nhớ, đồng thời sinh lịch trình mẫu được cấu hình sẵn. Dự án luôn chạy mượt mà ở môi trường phát triển cục bộ (Local).
*   **ChatMessageVersion (Message Versioning):** Mỗi tin nhắn phản hồi của AI có thể có nhiều phiên bản. Khi người dùng nhấn nút "Tái sinh câu trả lời" (Regenerate), hệ thống sẽ tạo một bản ghi `ChatMessageVersion` mới với số hiệu phiên bản tăng dần và đánh dấu phiên bản cũ là `isActive = false`. Đây là thiết kế cơ sở dữ liệu rất thông minh và thực tế.
*   **Tối ưu hóa GIS:** Sử dụng `calculateBoundingBox` để truy vấn khoanh vùng toạ độ bằng SQL index trên PostgreSQL trước khi tính khoảng cách Haversine chi tiết bằng code TS. Việc này giúp giảm tải hàng triệu phép toán căn bậc hai phức tạp cho CPU khi dữ liệu điểm đến phình to.

### 20. Những phần còn thiếu hoặc có thể cải thiện
*   **Tính toán Cosine Similarity trực tiếp trên PostgreSQL:**
    *   *Hiện tại:* RAG service đang tải toàn bộ tài liệu từ bảng `DocumentKnowledge` lên RAM rồi dùng vòng lặp JS tính Cosine Similarity. Việc này sẽ gây nghẽn cổ chai và tràn bộ nhớ nếu hệ thống có hàng vạn tài liệu.
    *   *Cải tiến:* Cần cài đặt extension `pgvector` trên PostgreSQL và thay thế hàm tìm kiếm bằng câu lệnh Raw SQL:
        ```sql
        SELECT id, title, content, category, (embedding <=> $1) as distance 
        FROM "DocumentKnowledge" 
        WHERE category = $2 
        ORDER BY distance ASC 
        LIMIT $3;
        ```
*   **Xác thực Email OTP thực tế:** Đã thiết kế trường `isVerified` và `verificationToken` trong bảng `User` nhưng chưa tích hợp nodemailer/SendGrid để gửi mail xác thực tài khoản thực sự khi đăng ký.
*   **Function Calling chính thức:** Lớp AI Agent hiện tại định tuyến ý định của người dùng bằng cách tìm kiếm từ khóa thô sơ trong chuỗi (`lowerInput.includes('ăn')`). Cần nâng cấp lên cơ chế Function Calling chính thức của OpenAI hoặc Gemini API để AI tự động trích xuất các tham số (Ví dụ: `destination`, `days`, `budget`) một cách chính xác nhất.
*   **Cơ chế dọn dẹp Cache (TTL Cleanup):** Các bảng cache (`PlaceCache`, `FoodCache`, `BlogCache`) lưu trữ dữ liệu API ngoài nhưng chưa được thiết kế cơ chế dọn dẹp các bản ghi đã quá hạn (`expiresAt < NOW()`). Cần thiết lập một Cron Job chạy định kỳ hàng ngày để xóa sạch dữ liệu cache rác trong DB.
*   **Xử lý xung đột đồng tác giả (Collaborative Editing Conflict Resolution):** Socket.io mới chỉ broadcast sự kiện chỉnh sửa chuyến đi (`trip_updated`) để vẽ lại trên client khác, nhưng chưa có cơ chế giải quyết xung đột khi hai người dùng cùng kéo thả hoặc chỉnh sửa một hoạt động ở cùng một giây. Nên nghiên cứu áp dụng OT (Operational Transformation) hoặc CRDTs.

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN DÀNH CHO LẬP TRÌNH VIÊN MỚI

### 1. Yêu cầu hệ thống
*   Node.js (v18 trở lên)
*   PostgreSQL Database
*   Cấu hình cổng mạng mặc định: Backend (`5000`), Frontend (`3000`)

### 2. Thiết lập Backend
1.  Di chuyển vào thư mục backend:
    ```bash
    cd backend
    ```
2.  Cài đặt dependencies:
    ```bash
    npm install
    ```
3.  Tạo file `.env` từ cấu hình mẫu sau:
    ```env
    PORT=5000
    NODE_ENV=development
    DATABASE_URL="postgresql://postgres:password@localhost:5432/smarttravel?schema=public"
    JWT_SECRET="your_jwt_secret_key_here"
    OPENAI_API_KEY="your_openai_api_key_here" # Để trống nếu muốn chạy Offline-Fallback
    FRONTEND_URL="http://localhost:3000"
    ```
4.  Đồng bộ Database Schema và Sinh dữ liệu Seed mẫu (User, Posts, Destinations):
    ```bash
    npx prisma db push
    # Hệ thống sẽ tự động chạy script auto-seed khi server khởi động thành công.
    ```
5.  Khởi chạy server ở chế độ Development:
    ```bash
    npm run dev
    ```

### 3. Thiết lập Frontend
1.  Di chuyển vào thư mục frontend:
    ```bash
    cd ../frontend
    ```
2.  Cài đặt dependencies:
    ```bash
    npm install
    ```
3.  Tạo file `.env` từ cấu hình mẫu sau:
    ```env
    VITE_API_URL="http://localhost:5000/api/v1"
    ```
4.  Khởi chạy Frontend:
    ```bash
    npm run dev
    ```
5.  Truy cập vào trình duyệt tại địa chỉ: [http://localhost:3000](http://localhost:3000).

### 4. Tài khoản kiểm thử (Mock Users)
Bạn có thể đăng nhập bằng một trong các tài khoản seed sẵn có dưới đây (Mật khẩu mặc định cho tất cả tài khoản: `password123`):
*   **Minh Quân Nguyễn:** `minhquan@smarttravel.com`
*   **Sarah Miller:** `sarah@smarttravel.com`
*   **Linh Trần:** `linhtran@smarttravel.com`
*   **Alex Chen:** `alexchen@smarttravel.com`
*   **Tom Vũ:** `tomvu@smarttravel.com`

---
*Chúc bạn có những trải nghiệm lập trình thú vị cùng SmartTravel! Nếu có bất kỳ câu hỏi nào về kiến trúc hoặc logic giải thuật, hãy liên hệ ngay với người hướng dẫn dự án.*
