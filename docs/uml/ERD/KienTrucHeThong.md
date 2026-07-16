# KIẾN TRÚC HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)
## TÀI LIỆU PHÂN TÍCH REVERSE ENGINEERING MÃ NGUỒN

Tài liệu này được biên soạn bởi Principal Software Architect, Database Architect, UML Expert và Business Analyst nhằm phân tích, tổng hợp toàn bộ kiến trúc thực tế của hệ thống dựa trên phương pháp **Reverse Engineering (Kỹ nghệ ngược)** trực tiếp từ mã nguồn của dự án (Frontend, Backend, Prisma Database, AI Services).

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE OVERVIEW)

Hệ thống được thiết kế theo mô hình **Modular Monolith (Monolith mô-đun hóa)** ở phía Backend và **Single Page Application (SPA)** ở phía Frontend, tích hợp lớp **Multi-Agent Orchestration Layer** & **RAG Pipeline (Retrieval-Augmented Generation)** để phục vụ các tính năng thông minh.

### Sơ đồ phân tầng kiến trúc thực tế (Architectural Layers)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (React)                      │
│   (Vite + React Router + Redux Toolkit + Leaflet/MapLibre GL Map)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / WSS
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       GATEWAY & ROUTING LAYER (Express)                │
│    (Defines /api/v1 endpoints, mounts 21 Modular Routers onto App)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                        MIDDLEWARE LAYER (Security & QA)                │
│  (CORS, Parser, requireAuth JWT, requireAdmin, validators: validate*)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                      DIALOGUE LAYER & MULTI-AGENT LAYER                │
│  - Dialogue Layer: ConversationState, TravelReranker, SlotFilling      │
│  - Multi-Agent: AgentExecutor, Strategies (Travel, Food, Culture, Rec) │
│  - Tools: MapTool, WeatherTool, FoodTool, CultureTool, ItineraryTool   │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │                               │
┌──────────────────▼─────────────────┐   ┌─────────▼─────────────────────┐
│       BUSINESS SERVICES LAYER      │   │          RAG PIPELINE         │
│   (Trips, SavedPlaces, Feedbacks,  │   │  (Embeddings, Vector Search,  │
│    FavoriteFoods, Sockets, etc.)   │   │   Knowledge Query & Citations)│
└──────────────────┬─────────────────┘   └─────────┬─────────────────────┘
                   │                               │
┌──────────────────▼───────────────────────────────▼─────────────────────┐
│                  DATA ACCESS LAYER (Prisma Client ORM)                 │
│      (Hides native PostgreSQL queries, handles pgvector inputs)        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ TCP / Vector Extensions
┌──────────────────────────────────▼─────────────────────────────────────┐
│                       DATABASE LAYER (PostgreSQL)                      │
│     (Schema models, Spatial Bounding Box Indices, vector(1536/128))    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PHÂN TÍCH CHI TIẾT 21 MODULES CỦA HỆ THỐNG
Hệ thống Backend được phân mảnh thành đúng **21 module nghiệp vụ và hạ tầng** nằm trong thư mục `backend/src/modules/`. Dưới đây là bảng phân tích toàn diện vai trò, các file Router, Controller, Service, Repository, Validation và Prisma Model của từng module:

| STT | Tên Module | Router File | Controller File | Service File | Repository File | DTO / Validation / Middleware | Thực thể / Model DB tương ứng | Mô tả chức năng |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **1** | **auth** | `auth.router.ts` | *(Tích hợp trực tiếp tại Router)* | `email.service.ts` | *(Sử dụng trực tiếp qua Prisma)* | `auth.middleware.ts` (`requireAuth`, `requireAdmin`, `optionalAuth`) | `User`, `Profile` | Đăng ký, đăng nhập JWT, làm mới token, xác thực email, đăng nhập qua Google (Firebase Sync ID Token). |
| **2** | **trips** | `trips.router.ts` | *(Tích hợp trực tiếp tại Router)* | `ai-planner.ts` (ở module `ai`) | *(Sử dụng trực tiếp qua Prisma)* | Middleware kiểm tra phân quyền sở hữu chuyến đi | `Trip`, `TripDay`, `TripActivity`, `Destination` | Quản lý vòng đời chuyến đi (CRUD), nhân bản chuyến đi công khai (Clone Trip), sinh lịch trình du lịch bằng AI và tối ưu lộ trình. |
| **3** | **posts** | `posts.router.ts` | *(Tích hợp trực tiếp tại Router)* | *(Sử dụng trực tiếp qua Prisma)* | *(Sử dụng trực tiếp qua Prisma)* | Middleware tự động dọn dẹp bài viết đã xóa quá 15 ngày | `Post`, `Comment`, `Like`, `Bookmark` | Đăng bài viết chia sẻ trải nghiệm (Blog/Story), bình luận phân tầng (Replies), thích (Like) và đánh dấu (Bookmark) bài viết. |
| **4** | **map** | `map.router.ts` | *(Tích hợp trực tiếp tại Router)* | *(Sử dụng trực tiếp qua helper)* | *(Sử dụng trực tiếp qua Prisma)* | `gis-helper.ts` (Haversine, Bounding Box) | `CheckIn`, `Destination`, `Location` | Check-in địa điểm, theo dõi vị trí GPS thời gian thực (Live Location), tìm bạn bè xung quanh, truy vấn địa điểm lân cận. |
| **5** | **recommendations** | `routes/recommendation.router.ts` & `recommendations.router.ts` | `controllers/recommendation.controller.ts` | `services/recommendation.service.ts` | `repositories/recommendation.repository.ts` | `middlewares/recommendation.validation.ts` | `Destination`, `TravelPreferences`, `UserRecommendation` | Gợi ý địa điểm thông minh dựa trên hành vi, sở thích cá nhân (Content-based Scoring) và vị trí địa lý của người dùng. |
| **6** | **social** | `social.router.ts` | *(Tích hợp trực tiếp tại Router)* | *(Sử dụng trực tiếp qua Prisma)* | *(Sử dụng trực tiếp qua Prisma)* | Phân quyền tương tác | `Follower`, `Notification`, `User` | Quản lý Profile cá nhân, tính năng theo dõi/hủy theo dõi (Follow/Unfollow), gửi thông báo (Notifications) thời gian thực. |
| **7** | **analytics** | `analytics.router.ts` | *(Tích hợp trực tiếp tại Router)* | *(Sử dụng trực tiếp qua Prisma)* | *(Sử dụng trực tiếp qua Prisma)* | Admin Verification (demo bypass in dev) | Toàn bộ các bảng trong CSDL | Thống kê số lượng thực thể, xếp hạng điểm đến được check-in nhiều nhất, phân tích tần suất sử dụng các dịch vụ AI. |
| **8** | **chatbot** | `routes/chatbot.router.ts` | `controllers/chatbot.controller.ts` | `services/chatbot.service.ts` | `repositories/chatbot.repository.ts` | `middlewares/chatbot.validation.ts` | `ChatConversation`, `ChatMessage`, `ChatMessageVersion`, `AIMemory` | Quản lý hội thoại đa lượt của người dùng với trợ lý AI, hỗ trợ lưu vết lịch sử chat, phiên bản câu trả lời và bộ nhớ sở thích (Memory). |
| **9** | **itinerary** | `routes/itinerary.router.ts` | `controllers/itinerary.controller.ts` | `services/itinerary.service.ts` | `repositories/itinerary.repository.ts` | `middlewares/itinerary.validation.ts` | `Itinerary`, `ItineraryDay`, `ItineraryActivity` | Quản lý lịch trình du lịch đã sinh, chia ngày đi chi tiết và điều phối các hoạt động cụ thể (thời gian bắt đầu, kết thúc, chi phí). |
| **10** | **favorite-foods** | `routes/favorite-food.router.ts` | `controllers/favorite-food.controller.ts` | `services/favorite-food.service.ts` | `repositories/favorite-food.repository.ts` | `middlewares/favorite-food.validation.ts` | `FavoriteFood` | Lưu giữ sở thích ẩm thực cá nhân hóa của người dùng (tên món, vùng miền, đánh giá chất lượng) phục vụ gợi ý ẩm thực. |
| **11** | **saved-places** | `routes/saved-place.router.ts` | `controllers/saved-place.controller.ts` | `services/saved-place.service.ts` | `repositories/saved-place.repository.ts` | `middlewares/saved-place.validation.ts` | `SavedPlace` | Cho phép người dùng lưu lại các địa điểm (nhà hàng, khách sạn, danh lam thắng cảnh) kèm tọa độ vẽ lên bản đồ. |
| **12** | **feedback** | `routes/feedback.router.ts` | `controllers/feedback.controller.ts` | `services/feedback.service.ts` | `repositories/feedback.repository.ts` | `middlewares/feedback.validation.ts` | `AIFeedback` | Thu thập phản hồi (thích/không thích, ý kiến đóng góp) của người dùng về chất lượng của từng tin nhắn chatbot AI cụ thể. |
| **13** | **tool-calls** | `routes/tool-call.router.ts` | `controllers/tool-call.controller.ts` | `services/tool-call.service.ts` | `repositories/tool-call.repository.ts` | `middlewares/tool-call.validation.ts` | `ToolCall` | Ghi nhật ký chi tiết các hành động gọi công cụ (Maps, Weather, RAG...) của các tác tử AI để giám sát hành vi hệ thống. |
| **14** | **cache** | `routes/cache.router.ts` | `controllers/cache.controller.ts` | `services/cache.service.ts` | `repositories/cache.repository.ts` | Cache Cleanup Job trong `server.ts` (6 tiếng/lần) | `PlaceCache`, `FoodCache`, `BlogCache` | Lớp đệm cache dữ liệu bên thứ ba hoặc các truy vấn nặng về địa điểm, món ăn, blog du lịch có cơ chế hết hạn (TTL-based). |
| **15** | **ai-agents** | `routes/agent.router.ts` | `controllers/agent.controller.ts` | `services/agent-executor.service.ts` | *(Sử dụng gián tiếp qua DB)* | `tools/agent.tools.ts`, `strategies/` | `User`, `AIMemory`, `ToolCall` | Nhân điều phối các tác tử AI (Travel, Food, Culture, Rec) giao tiếp dựa trên các Agent Strategy & Tools cụ thể. |
| **16** | **rag** | `routes/rag.router.ts` | `controllers/rag.controller.ts` | `services/rag-pipeline.service.ts` | *(Sử dụng trực tiếp qua Prisma)* | Vector Embeddings processing | `KnowledgeContent`, `KnowledgeQuestion`, `KnowledgeAnswer` | Tìm kiếm tài liệu tri thức văn hóa, lễ hội Việt Nam dựa trên độ tương đồng ngữ nghĩa Vector thông qua PostgreSQL pgvector. |
| **17** | **optimizer** | *(Sử dụng qua Trips Module)* | *(Sử dụng qua Trips Controller)* | `route-optimizer.ts` (TSP Algorithm) | *(Không lưu trữ)* | Thuật toán tối ưu hóa sắp xếp tọa độ Waypoints | *(Không lưu trữ)* | Cung cấp thuật toán tối ưu hóa lộ trình di chuyển (Travelling Salesperson Problem - TSP) cho các chặng hoạt động trong ngày. |
| **18** | **dialogue** | *(Sử dụng qua AI-Agents)* | *(Sử dụng qua AI-Agents)* | `conversation-state.service.ts`, `travel-intent.service.ts`, v.v. | *(Không lưu trữ)* | Dialogue flow management | `ChatConversation` | Quản lý hội thoại đa lượt, bóc tách ý định (Intent), Slot-Filling (điền thông tin thiếu), gợi ý câu hỏi tiếp theo. |
| **19** | **ai** | *(Sử dụng qua Trips Router)* | *(Sử dụng qua Trips Controller)* | `ai-planner.ts` | *(Sử dụng trực tiếp qua Prisma)* | Llama-3.1-8b LLM API | `Trip`, `Destination` | Xử lý việc sinh lịch trình tự động từ mô tả mong muốn của người dùng bằng cách tương tác trực tiếp với API Groq LLM. |
| **20** | **destinations** | *(Tích hợp vào Recommendations/Map)* | *(Tích hợp vào Recommendations)* | *(Sử dụng qua các module)* | *(Sử dụng trực tiếp qua Prisma)* | Spatial Bounding Box search | `Destination` | Module phụ trách việc quản lý danh mục địa danh du lịch Việt Nam (được cập nhật địa chỉ và Geocoding tự động). |
| **21** | **travel-history** | `routes/travel-history.router.ts` | `controllers/travel-history.controller.ts` | `services/travel-history.service.ts` | `repositories/travel-history.repository.ts` | `middlewares/travel-history.validation.ts` | `TravelHistory` | Lưu vết lịch sử các chuyến du lịch thực tế người dùng đã đi (thời gian, chi phí, địa điểm) nhằm làm giàu dữ liệu gợi ý. |

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUYÊN SÂU (DATABASE SCHEMA & PRISMA MODELS)

Hệ thống sử dụng cơ sở dữ liệu **PostgreSQL** kết hợp với tiện ích mở rộng **pgvector** (`extensions = [vector]`) thông qua Prisma ORM.

### Sơ đồ quan hệ thực thể cốt lõi (Core ERD Relationships)

```
       ┌───────────────┐
       │   Profile     │
       └───────┬───────┘
               │ 1:1
       ┌───────┴───────┐             1:N              ┌───────────────┐
       │     User      ├─────────────────────────────>│     Trip      │
       └───┬───────┬───┘                              └───────┬───────┘
           │ 1:N   │ 1:N                                      │ 1:N
           │       │                                  ┌───────▼───────┐
           │       └──────────────┐                   │    TripDay    │
           │                      │                   └───────┬───────┘
           │                      │                           │ 1:N
           │                      │                   ┌───────▼───────┐
           │                      │                   │ TripActivity  │
           │                      │                   └───────┬───────┘
           │                      │                           │ N:1
           │                      │                   ┌───────▼───────┐
           │                      │                   │  Destination  │
           │                      │                   └───────────────┘
           │                      │
           │ 1:N                  │ 1:1
   ┌───────▼───────┐      ┌───────▼───────┐
   │ChatConversation│     │   AIMemory    │
   └───────┬───────┘      └───────────────┘
           │ 1:N
   ┌───────▼───────┐             1:N              ┌───────────────┐
   │  ChatMessage  ├─────────────────────────────>│   ToolCall    │
   └───────┬───────┘                              └───────────────┘
           ├─────────────────────────────┐
           │ 1:1                         │ 1:N
   ┌───────▼───────┐             ┌───────▼──────────┐
   │  AIFeedback   │             │ChatMessageVersion│
   └───────────────┘             └──────────────────┘
```

### Chi tiết các thực thể trong Schema (`schema.prisma`)

#### A. Nhóm Quản lý Người dùng & Cá nhân hóa
1. **User**
   - Định nghĩa: Thực thể đại diện cho tài khoản người dùng trên hệ thống.
   - Các trường khóa: `id` (UUID - PK), `email` (String - Unique - Index).
   - Trường bảo mật: `passwordHash` (String).
   - Trường trạng thái: `role` (UserRole: ADMIN, USER), `isVerified` (Boolean), `verificationToken` (String?), `resetPasswordToken` (String?).
   - Quan hệ: Quan hệ 1:1 với `Profile`, `TravelPreferences`, `AIMemory`, quan hệ 1:N với `Trip`, `Post`, `Comment`, `Like`, `Bookmark`, `CheckIn`, `Notification`, `AIHistory`, `Location`, `ChatConversation`, `Itinerary`, `UserRecommendation`, `TravelHistory`, `FavoriteFood`, `SavedPlace`, `AIFeedback`, `Follower` (mối quan hệ tự tham chiếu chéo follower/following), `Message`, `Journey`, `LocationHistory`, `EventAttendee`.

2. **Profile**
   - Định nghĩa: Thông tin cá nhân cơ bản hiển thị trên giao diện của người dùng.
   - Các trường khóa: `id` (UUID - PK), `userId` (String - FK - Unique).
   - Các trường dữ liệu: `fullName` (String), `avatarUrl` (String?), `coverUrl` (String?), `bio` (String?), `phoneNumber` (String?), `homeLocation` (String?).
   - Quan hệ: Cascade onDelete khi `User` bị xóa.

3. **TravelPreferences**
   - Định nghĩa: Lưu trữ các tùy chọn và thói quen du lịch tự khai báo của người dùng.
   - Các trường khóa: `id` (UUID - PK), `userId` (String - FK - Unique).
   - Các trường dữ liệu: `preferredPace` (String: "slow", "moderate", "fast"), `dailyBudget` (Float), `activities` (String[]), `destinationTypes` (String[]), `foodPreferences` (String[]).

#### B. Nhóm Nghiệp vụ Chuyến đi & Địa điểm
4. **Trip**
   - Định nghĩa: Bản ghi tổng quan về một kế hoạch hành trình du lịch.
   - Các trường khóa: `id` (UUID - PK), `ownerId` (String - FK - Index).
   - Các trường dữ liệu: `title` (String), `description` (String?), `destinationName` (String), `startDate` (DateTime), `endDate` (DateTime), `totalBudget` (Float), `travelStyle` (String: "solo", "family", "friends", "couple"), `isPublic` (Boolean), `cloneSourceId` (String? - FK - Index - dùng để lưu vết nguồn nhân bản chuyến đi).
   - Quan hệ: Một `Trip` chứa nhiều `TripDay`, có thể liên kết với nhiều `Post`, `Recommendation`.

5. **TripDay**
   - Định nghĩa: Chia nhỏ chuyến đi theo từng ngày.
   - Các trường khóa: `id` (UUID - PK).
   - Ràng buộc: `@@unique([tripId, dayIndex])` (Mỗi chuyến đi chỉ có duy nhất một Day Index trùng lặp).
   - Các trường dữ liệu: `dayIndex` (Int - ngày thứ mấy), `date` (DateTime).

6. **TripActivity**
   - Định nghĩa: Hoạt động cụ thể được lên lịch tại một địa điểm trong ngày.
   - Các trường khóa: `id` (UUID - PK), `tripDayId` (String - FK - Index), `destinationId` (String - FK - Index).
   - Các trường dữ liệu: `startTime` (String: HH:MM), `endTime` (String: HH:MM), `estimatedCost` (Float), `sequenceOrder` (Int - số thứ tự sắp xếp trong ngày), `notes` (String? - hỗ trợ lưu dạng JSON chứa metadata chi tiết của hoạt động).

7. **Destination**
   - Định nghĩa: Danh mục các danh lam thắng cảnh, nhà hàng, khách sạn tại Việt Nam.
   - Các trường khóa: `id` (UUID - PK).
   - Các trường không gian địa lý: `latitude` (Float), `longitude` (Float) - đính kèm chỉ mục phức hợp `@@index([latitude, longitude])` giúp tối ưu hóa thuật toán truy vấn bounding box tìm kiếm lân cận.
   - Các trường dữ liệu: `name` (String), `description` (String?), `category` (String: "restaurant", "hotel", "attraction"), `averageRating` (Float), `address` (String?), `openingHours` (String?).

#### C. Nhóm Cộng đồng & Tương tác Xã hội
8. **Post**
   - Định nghĩa: Bài viết chia sẻ hành trình du lịch.
   - Các trường khóa: `id` (UUID - PK), `authorId` (String - FK - Index), `tripId` (String? - FK - Index).
   - Các trường dữ liệu: `content` (String), `mediaUrls` (String[]), `createdAt` (DateTime), `deletedAt` (DateTime? - dùng để xóa tạm thời (soft-delete)).

9. **Comment**
   - Định nghĩa: Bình luận tương tác dưới bài viết, hỗ trợ cấu trúc cây phân cấp (nested replies).
   - Các trường khóa: `id` (UUID - PK), `postId` (String - FK - Index), `authorId` (String - FK - Index), `parentId` (String? - FK - Index - tự tham chiếu đến bình luận cha).

10. **Like** & **Bookmark**
    - Ràng buộc: Đảm bảo tính duy nhất qua `@@unique([postId, userId])`.

11. **Follower**
    - Định nghĩa: Mối quan hệ mạng xã hội nhiều-nhiều (followers/following).
    - Ràng buộc: `@@unique([followerId, followingId])` để chống theo dõi trùng lặp.

12. **Notification**
    - Định nghĩa: Các thông báo nội bộ hệ thống gửi cho người dùng.
    - Các trường dữ liệu: `recipientId` (String - FK), `type` (String: "like", "comment", "friend_request", "invitation"), `content` (String), `isRead` (Boolean).

13. **CheckIn**
    - Định nghĩa: Nhật ký check-in thực tế của người dùng tại các Destination.
    - Tối ưu hóa: Gắn chỉ mục `@@index([userId])`, `@@index([destinationId])`.

#### D. Nhóm Trợ lý Chatbot AI & Tác tử (Agent)
14. **ChatConversation**
    - Định nghĩa: Phiên làm việc (cuộc hội thoại) của người dùng với Chatbot AI.
    - Các trường khóa: `id` (UUID - PK), `userId` (String - FK - Index).

15. **ChatMessage**
    - Định nghĩa: Một tin nhắn cụ thể trong cuộc hội thoại (hỗ trợ lưu vết AI/User).
    - Các trường dữ liệu: `conversationId` (String - FK), `role` (String: "user", "assistant", "system").

16. **ChatMessageVersion**
    - Định nghĩa: Các phiên bản câu trả lời khác nhau của Chatbot AI (khi người dùng bấm Regenerate).
    - Các trường dữ liệu: `messageId` (String - FK), `content` (String), `version` (Int: 1, 2, 3...), `isActive` (Boolean).

17. **AIMemory**
    - Định nghĩa: Bộ nhớ lưu trữ lâu dài (Long-term Memory) về thói quen du lịch tự động bóc tách từ các đoạn hội thoại của người dùng.
    - Trường dữ liệu: `travelPreferences` (String[]), `favoriteFoods` (String[]), `budget` (String?), `transportation` (String[]), `favoriteLocations` (String[]).

18. **ToolCall**
    - Định nghĩa: Lịch sử gọi công cụ trong quá trình chạy tác tử.
    - Trường dữ liệu: `messageId` (String - FK), `toolName` (String), `input` (String), `output` (String?), `status` (String: "success", "failed").

19. **AIFeedback**
    - Định nghĩa: Đánh giá chất lượng của từng tin nhắn chatbot AI.
    - Ràng buộc: Mối quan hệ 1:1 với ChatMessage (`messageId` là unique).
    - Các trường dữ liệu: `rating` (Int - điểm số), `comment` (String?).

#### E. Nhóm Vector Search & RAG (Retrieval-Augmented Generation)
20. **KnowledgeContent**
    - Định nghĩa: Văn bản dữ liệu tri thức thô dùng làm cơ sở ngữ cảnh cho RAG.
    - Các trường dữ liệu: `title` (String), `body` (String), `category` (String - Index).

21. **KnowledgeQuestion**
    - Định nghĩa: Các câu hỏi mẫu tương ứng với nội dung tri thức, lưu giữ vector embeddings để thực thi tìm kiếm tương đồng ngữ nghĩa.
    - Các trường dữ liệu: `contentId` (String - FK).
    - Trường Vector (Chỉ mục không gian vector):
      - `embeddingOpenAI`: Định dạng `Unsupported("vector(1536)")`? (Sử dụng OpenAI Ada embeddings).
      - `embeddingLocal`: Định dạng `Unsupported("vector(128)")`? (Sử dụng mô hình local embeddings gọn nhẹ).

22. **KnowledgeAnswer**
    - Định nghĩa: Các đáp án mẫu đã được tinh chỉnh tương ứng với nội dung tri thức.

#### F. Nhóm Mở rộng và Hạ tầng khác
23. **Itinerary**, **ItineraryDay**, **ItineraryActivity**: Dùng để quản lý các lịch trình AI sinh ra một cách độc lập không gắn liền với Trip du lịch chính thức.
24. **PlaceCache**, **FoodCache**, **BlogCache**: Các bảng đệm lưu trữ dữ liệu dạng JSON.
25. **SafetyWarning**: Cảnh báo thời tiết/giao thông nguy hiểm thời gian thực theo tọa độ địa lý.
26. **Journey**, **Route**, **RoutePoint**: Lưu trữ bản ghi nhật ký nhật trình GPS di chuyển thực tế của người dùng.
27. **LocationHistory**: Nhật ký tọa độ vị trí GPS lịch sử của người dùng theo thời gian.
28. **Event**, **EventAttendee**: Tổ chức các sự kiện văn hóa, lễ hội hoặc giao lưu kết bạn tại các Destination du lịch.
29. **TravelerMatch**: Đề xuất kết bạn đồng hành tự động bằng AI dựa trên sự tương đồng về sở thích và lịch trình chuyến đi (`compatScore` [0.0 - 1.0]).

---

## 4. CHI TIẾT CÁC THÀNH PHẦN KỸ THUẬT (TECHNICAL COMPONENTS BREAKDOWN)

### A. Middlewares (Lớp trung gian điều phối)
1. **requireAuth** (trong [auth.middleware.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.middleware.ts)):
   - Giải nén token JWT được gửi kèm từ Header `Authorization: Bearer <Token>`.
   - Xác thực tính hợp lệ của Token qua `jwt.verify` với mã bí mật `JWT_SECRET`.
   - Lưu trữ thông tin định danh `{ sub: userId, role: role }` vào đối tượng `req.user`.
   - Trả về mã lỗi `401 Unauthorized` nếu token không hợp lệ hoặc hết hạn.

2. **requireAdmin** (trong [auth.middleware.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.middleware.ts)):
   - Ràng buộc phân quyền chỉ cho phép tài khoản có `req.user.role === 'ADMIN'` đi qua.
   - Thường sử dụng phía sau `requireAuth` để bảo vệ các API quản trị như Analytics, quản lý Tri thức.

3. **optionalAuth** (trong [auth.middleware.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.middleware.ts)):
   - Thử bóc tách token JWT từ Header nếu có để lấy ngữ cảnh người dùng (phục vụ cá nhân hóa hoặc kiểm tra xem người dùng đã Like/Bookmark bài viết chưa).
   - Nếu không có token hoặc token sai, middleware **vẫn cho phép đi qua** dưới dạng khách vãng lai (Anonymous) thay vì chặn lại bằng lỗi 401.

### B. Validations (Kiểm tra dữ liệu đầu vào)
Sử dụng các hàm validation tùy biến và kiểm tra trực tiếp kiểu dữ liệu (Manual Type Guarding) lồng trong Middleware để bảo vệ API trước các cuộc tấn công phá hoại cấu trúc dữ liệu hoặc dữ liệu rác:
- **validateCreateConversation**: Kiểm tra tính hợp lệ của trường `title` (phải là String).
- **validateSendMessage**: Đảm bảo trường `content` trong body không trống, là chuỗi ký tự hợp lệ.
- **validateSaveMemory**: Ràng buộc kiểu dữ liệu cho bộ nhớ AI: `travelPreferences` (Array string), `favoriteFoods` (Array string), `budget` (String/Null), `transportation` (Array string), `favoriteLocations` (Array string).

### C. Utilities (Các hàm hỗ trợ hệ thống)
1. **gis-helper.ts** (trong [gis-helper.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/gis-helper.ts)):
   - `calculateBoundingBox`: Tính toán tọa độ giới hạn hình vuông (Min/Max Latitude và Longitude) từ một tâm tọa độ và bán kính (Km) cho trước. Sử dụng để thu hẹp phạm vi truy vấn SQL trong cơ sở dữ liệu qua chỉ mục index tọa độ trước khi áp dụng thuật toán phức tạp hơn.
   - `calculateHaversineDistance`: Áp dụng công thức lượng giác Haversine để tính toán khoảng cách đường cong mặt cầu chính xác giữa hai điểm tọa độ GPS trên Trái Đất (đơn vị Km).

2. **logger.ts** (trong [logger.ts](file:///d:/Thuc_Tap_NDT/backend/src/utils/logger.ts) & [logger.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/utils/logger.ts)):
   - Hệ thống ghi nhật ký (logging) tập trung phân tầng (INFO, WARN, ERROR, DEBUG).
   - Cho phép định danh `requestId` (UUID) xuyên suốt một vòng đời request giúp dễ dàng debug và truy vết hành động lỗi trên hệ thống headless server.

3. **agent.utils.ts** (trong [agent.utils.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/ai-agents/utils/agent.utils.ts)):
   - `removeDiacritics`: Chuẩn hóa văn bản tiếng Việt, loại bỏ dấu (ví dụ: "Phú Quốc" -> "Phu Quoc") giúp việc so khớp từ khóa và bóc tách thực thể hiệu quả hơn.
   - `findBestBleuMatch`: Thuật toán tính độ tương đồng Bleu Match để so khớp câu hỏi người dùng với bộ tri thức văn hóa địa phương.
   - `classifyIntentWithLLM`: Gọi mô hình ngôn ngữ lớn để phân loại mục đích tương tác của khách du lịch (Lên lịch trình, Hỏi ẩm thực, Hỏi văn hóa lịch sử, Tìm địa điểm lân cận).

### D. Shared Components (Thành phần dùng chung ở Frontend)
Toàn bộ Frontend của hệ thống nằm trong thư mục `frontend/` được liên kết chặt chẽ với kiến trúc Monolith thông qua các dịch vụ API:
1. **ProtectedRoute** (trong [ProtectedRoute.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/components/auth/ProtectedRoute.tsx)):
   - Thành phần bọc ngoài (Wrapper Component) để bảo vệ các tuyến đường (routes) yêu cầu đăng nhập.
   - Kiểm tra trạng thái `isAuthenticated` từ Redux Store. Nếu chưa đăng nhập, tự động chuyển hướng người dùng về trang `/auth`.

2. **MapLibreMap** (trong [MapLibreMap.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/components/Map/MapLibreMap.tsx)):
   - Bản đồ Vector tương tác cao, kết xuất các địa điểm du lịch, khách sạn, nhà hàng từ API.
   - Cho phép vẽ lộ trình chuyến đi sau khi đã được tối ưu bằng thuật toán TSP, xử lý sự kiện check-in và hiển thị vị trí thời gian thực của bạn bè.

3. **ThemeContext** & **LanguageContext** (trong [ThemeContext.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/contexts/ThemeContext.tsx) & [LanguageContext.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/contexts/LanguageContext.tsx)):
   - Quản lý giao diện tối/sáng (Dark/Light mode) và đa ngôn ngữ (Tiếng Việt/Tiếng Anh) toàn hệ thống.

---

## 5. BẢN ĐỒ GIAO TIẾP VÀ LUỒNG DỮ LIỆU THỰC TẾ (DATA FLOW DIAGRAM)

### A. Luồng xử lý một Request thông thường (REST API)
```
[Client App] ──(1) HTTP Request + JWT Header──> [Express Server (app.ts)]
                                                      │
                                                 (2) requireAuth Middleware
                                                      │
                                                 (3) Route Guard & validate*
                                                      │
                                                 (4) Controller Action
                                                      │
                                                 (5) Business Service Layer
                                                      │
                                                 (6) Repository / Prisma Client
                                                      │
                                                 (7) PostgreSQL DB Query
                                                      │
[Client App] <──(8) JSON HTTP Response ───────────────┘
```

### B. Luồng hoạt động của hệ thống Chatbot RAG Multi-Agent thời gian thực
```
[User Chat Input] ────> [Chatbot Controller] ────> [Chatbot Service]
                                                       │
                                            (Tải Memory & Lịch sử)
                                                       │
                                                       ▼
                                            [Agent Executor Service]
                                                       │
                                            (Phân loại Ý định / Intent)
                                                       │
                           ┌───────────────────────────┼───────────────────────────┐
                           ▼                           ▼                           ▼
                     [Travel Agent]               [Food Agent]              [Culture Agent]
                           │                           │                           │
                    (Gọi ItineraryTool,          (Gọi FoodTool,              (Gọi CultureTool,
                     MapTool, WeatherTool)        RAG Vector Search)          RAG Vector Search)
                           │                           │                           │
                           └───────────────────────────┼───────────────────────────┘
                                                       │
                                                       ▼
                                            [Dialogue Manager Layer]
                                       (Reranker, Slot-Filling, Suggestions)
                                                       │
                                                       ▼
[User App Chat UI] <─── (Tin nhắn + Citations) ────────┘
```

---
*Tài liệu phân tích kỹ nghệ ngược kiến trúc hệ thống hoàn tất. Hệ thống sẵn sàng cho bước thiết kế biểu đồ UML Use Case và ERD chính thức.*
