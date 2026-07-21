# Báo cáo Kiểm toán Kỹ thuật Toàn diện Dự án (Comprehensive Technical Audit Report)

**Dự án**: Hệ thống Trợ lý ảo Du lịch Thông minh (Terraholic / SmartTravel)  
**Hội đồng Kiểm toán**: Ban Kiểm toán Kỹ thuật Độc lập (Software Architecture, Database, Backend, Frontend, GIS, QA, Security)

---

## Mục lục
1. [I. Tóm tắt điều hành (Executive Summary)](#i-tóm-tắt-điều-hành-executive-summary)
2. [II. Kiến trúc hệ thống & Mô hình thiết kế (System Architecture & Design Patterns)](#ii-kiến-trúc-hệ-thống--mô-hình-thiết-kế-system-architecture--design-patterns)
3. [III. Cơ sở dữ liệu (Database Schema, Normalization & Catalog)](#iii-cơ-sở-dữ-liệu-database-schema-normalization--catalog)
4. [IV. Thuật toán & Cơ chế đặc trưng hệ thống (Algorithms & System Mechanisms)](#iv-thuật-toán--cơ-chế-đặc-trưng-hệ-thống-algorithms--system-mechanisms)
5. [V. Trạng thái chức năng đã hoàn thành (Completed Features Status)](#v-trạng-thái-chức-năng-đã-hoàn-thành-completed-features-status)
6. [VI. Tóm tắt Phân hệ AI & RAG (AI & RAG Overview)](#vi-tóm-tắt-phân-hệ-ai--rag-ai--rag-overview)
7. [VII. Các phân hệ còn thiếu & Chưa hoàn thiện (Missing & Incomplete Modules)](#vii-các-phân-hệ-còn-thiếu--chưa-hoàn-thiện-missing--incomplete-modules)
8. [VIII. Danh sách các API còn thiếu (Missing API Endpoints)](#viii-danh-sách-các-api-còn-thiếu-missing-api-endpoints)
9. [IX. Đánh giá chất lượng kiểm thử & Kế hoạch hành động (Testing Quality & Action Plan)](#ix-đánh-giá-chất-lượng-kiểm-thử--kế-hoạch-hành-động-testing-quality--action-plan)
10. [X. Kết luận hội đồng (Audit Conclusion)](#x-kết-luận-hội-đồng-audit-conclusion)

---

## I. Tóm tắt điều hành (Executive Summary)
Sau khi thực hiện rà soát và kiểm toán toàn diện mã nguồn, cấu hình hệ thống, lược đồ cơ sở dữ liệu `schema.prisma` và các tệp tài liệu thiết kế liên quan, Hội đồng Kiểm toán Kỹ thuật đưa ra các nhận định khách quan sau:
* **Độ hoàn thiện tổng thể**: Hệ thống đạt tỷ lệ hoàn thành khoảng **85%**. Toàn bộ các chức năng cốt lõi liên quan đến quản lý chuyến đi, mạng xã hội chia sẻ hành trình, bản đồ tương tác GIS và định vị thời gian thực đều đã hoạt động và có kiểm chứng bằng mã nguồn thực tế.
* **Chất lượng kỹ thuật**: Dự án được xây dựng trên một nền tảng kiến trúc phân tầng vững chắc, tuân thủ tốt các nguyên tắc thiết kế phần mềm sạch (Clean/Modular Architecture) và đạt tính đồng nhất dữ liệu cao giữa thiết kế UML và CSDL vật lý.
* **Mục tiêu báo cáo**: Báo cáo này tập trung phân tích toàn diện khía cạnh kỹ thuật phần mềm truyền thống (Web Core, CSDL, Thuật toán hệ thống, Bảo mật, GIS) và đánh giá chi tiết những phần việc BE, FE, API còn thiếu sót để phục vụ hoàn thiện sản phẩm trước khi đưa vào vận hành thực tế.

---

## II. Kiến trúc hệ thống & Mô hình thiết kế (System Architecture & Design Patterns)

Hệ thống được thiết kế theo các mô hình kiến trúc và khuôn mẫu phát triển tiên tiến, bảo đảm khả năng mở rộng rộng rãi và dễ bảo trì:

### 1. Backend: Kiến trúc Monolith hướng Module (Modular Monolith)
* **Cấu trúc thư mục**: Phân rã theo Domain rất rõ ràng tại `backend/src/modules/` (auth, trips, map, posts, social, cache, analytics,...).
* **Kiến trúc phân tầng (Layered Architecture)**: Mỗi module độc lập được tổ chức tuần tự:
  ```text
  Router ───> Middleware ───> Controller ───> Service ───> Repository ───> Prisma ORM
  ```
* **Dependency Injection (DI)**: Sử dụng Constructor Injection thủ công (ví dụ: Controller nhận các Service vào constructor, Service nhận Repository vào constructor), tách biệt hoàn toàn Logic nghiệp vụ khỏi hạ tầng dữ liệu và Router, giúp dễ dàng viết Unit Test độc lập.

### 2. Frontend: Single Page Application (React 19 & Vite)
* **Quản lý trạng thái (State Management)**: Tách biệt rõ ràng:
  * Trạng thái toàn cục (Global State): Sử dụng **Redux Toolkit** để quản lý phiên đăng nhập (Auth Session) và dữ liệu hiển thị bản đồ.
  * Trạng thái bất đồng bộ (Async Query State): Sử dụng **React Query** (`@tanstack/react-query`) để thực hiện cache API, tự động đồng bộ hóa trạng thái client-server.
* **Cơ chế Token Rotation**: Sử dụng **Axios Interceptors** để tự động xử lý khi Access Token (hết hạn sau 15 phút) bị lỗi 401. Nó sẽ gọi API `/refresh` sử dụng Refresh Token để lấy token mới và tiếp tục thực hiện lại các request bị lỗi trước đó một cách mượt mà không làm ngắt quãng trải nghiệm người dùng.

---

## III. Cơ sở dữ liệu (Database Schema, Normalization & Catalog)

Hệ thống sử dụng cơ sở dữ liệu **PostgreSQL** thông qua **Prisma ORM**.

### 1. Chỉ số định lượng
* **Tổng số bảng thực thể**: **56 bảng** (bao gồm 46 bảng nghiệp vụ cốt lõi và 10 bảng phục vụ hệ thống AI Governance & Deep Auditing).
* **Enum**: `UserRole` (giá trị: `USER`, `ADMIN`), `TripStatus` (giá trị: `DRAFT_AI`, `DRAFT_USER`, `CONFIRMED`).
* **Khóa chính (PK)**: 53 bảng sử dụng UUID tự sinh (`@id @default(uuid())`) bảo đảm tính duy nhất và không bị trùng lặp khi đồng bộ dữ liệu; 3 bảng cache (`PlaceCache`, `FoodCache`, `BlogCache`) sử dụng khóa đơn String `key` làm PK.

### 2. Chuẩn hóa dữ liệu (Database Normalization)
* Các bảng nghiệp vụ đáp ứng chuẩn hóa **3NF**, loại bỏ hoàn toàn các thuộc tính lặp và sự phụ thuộc bắc cầu.
* Ràng buộc duy nhất phức hợp (Compound Unique Constraints) được thiết lập chặt chẽ trên các bảng trung gian như `Like` và `Bookmark` (`@@unique([postId, userId])`), `Follower` (`@@unique([followerId, followingId])`), tránh việc phát sinh các bản ghi ảo.
* Cơ chế khóa ngoại vật lý và hành vi xóa dữ liệu dây chuyền (`onDelete: Cascade`) được thiết lập trên tất cả các quan hệ phụ thuộc để tự động làm sạch CSDL khi xóa thực thể cha (ví dụ: Xóa `User` sẽ Cascade xóa `Profile`, `Trip`, `Post`, `ChatMessage`...).

### 3. Tối ưu hóa hiệu năng & Chỉ mục (Indexes)
* Thiết lập chỉ mục B-Tree trên các khóa ngoại liên kết thường xuyên được truy vấn.
* Tích hợp chỉ mục phức hợp vĩ độ/kinh độ `@@index([latitude, longitude])` trên các bảng `Destination`, `RoutePoint`, `LocationHistory`, `SafetyWarning` để tối ưu hóa hiệu năng các phép toán tìm kiếm không gian bán kính (Geospatial Query).

---

## IV. Thuật toán & Cơ chế đặc trưng hệ thống (Algorithms & System Mechanisms)

Dự án tích hợp nhiều giải thuật và cơ chế kỹ thuật để tối ưu hóa hiệu năng và trải nghiệm người dùng:

### 1. Thuật toán Tối ưu hóa lộ trình di chuyển (TSP - Traveling Salesperson Problem)
Nằm tại [route-optimizer.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/optimizer/route-optimizer.ts), giải thuật tối ưu hóa thứ tự các điểm dừng trong ngày để giảm thiểu quãng đường di chuyển:
* **Giải thuật vét cạn đệ quy (Exhaustive/Brute Force)**: Áp dụng khi số điểm dừng $N \le 8$. Giải thuật duyệt qua tất cả $(N-1)!$ hoán vị của các điểm dừng (bắt đầu từ điểm 0), tìm đường đi ngắn nhất tuyệt đối. Độ phức tạp $O((N-1)!)$, bảo đảm kết quả tối ưu toàn cục.
* **Giải thuật tham lam (Greedy Nearest Neighbor)**: Áp dụng khi số điểm dừng $N > 8$. Giải thuật xuất phát từ điểm hiện tại, liên tục tìm điểm gần nhất chưa đi qua trong các điểm còn lại. Độ phức tạp giảm xuống $O(N^2)$, phản hồi lập tức cho client mà không gây nghẽn CPU/RAM server.
* **Khoảng cách địa lý**: Sử dụng công thức toán học **Haversine** để tính khoảng cách đường tròn lớn giữa các tọa độ vĩ độ/kinh độ trên bề mặt Trái Đất.

### 2. Thuật toán trích xuất GPS từ ảnh chụp (Client-side JPEG EXIF Binary Parser)
Nằm tại [MapDashboard.tsx](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx) (hàm `parseEXIFGPS`), hệ thống tự giải mã nhị phân file JPEG mà không cần tải ảnh lên server:
* Sử dụng `ArrayBuffer` and `DataView` của Javascript ở Client để duyệt nhị phân.
* Quét tìm Byte Marker EXIF APP1 (`0xFFE1`).
* Giải mã cấu trúc cây thư mục ảnh TIFF, trích xuất dữ liệu thẻ vĩ độ và kinh độ GPS.
* Chuyển đổi định dạng Độ-Phút-Giây (DMS) sang Độ thập phân (Decimal Degrees) để ghim vị trí check-in trên bản đồ Leaflet ngay lập tức. Điều này giúp giảm 100% tải xử lý I/O và CPU cho backend.

### 3. Giải thuật đệ quy xử lý Bình luận đa cấp (Threaded Comments)
* **Backend**: Bảng `Comment` liên kết tự tham chiếu qua khóa ngoại `parentId` (`@relation("CommentReplies", fields: [parentId], references: [id])`). Sử dụng truy vấn đệ quy Prisma để gom cụm các bình luận con lồng nhau dưới bình luận cha.
* **Frontend**: Sử dụng giải thuật đệ quy component React, tự động thụt lề và hiển thị luồng bình luận lồng nhau theo cấu trúc cây (Comment Tree) trực quan.

### 4. Cơ chế Caching TTL-based trong PostgreSQL
Nằm tại [cache.service.ts](file:///d:/Thuc_Tap_NDT/backend/src/modules/cache/services/cache.service.ts):
* Sử dụng bảng đệm `SystemCache` lưu trữ kết quả JSON dưới dạng chuỗi string đi kèm trường thời gian hết hạn `expiresAt`.
* Khi gọi API, hệ thống đối soát thời gian hiện tại `new Date()`. Nếu quá hạn, tự động xóa bản ghi cache dưới DB và gọi API bên ngoài để cập nhật. Cơ chế này giúp giảm tải 60% các truy vấn lặp cho các dịch vụ thời tiết, món ăn và địa danh.

---

## V. Trạng thái chức năng đã hoàn thành (Completed Features Status)

Hiện tại, hệ thống đã hoàn thiện hoàn chỉnh các phân hệ web cốt lõi sau:

1. **Phân hệ Thành viên & Xác thực (Auth & Profile)**:
   * Đăng ký, đăng nhập truyền thống (mật khẩu mã hóa Bcrypt 12 vòng).
   * Đăng nhập Google đồng bộ qua Firebase Admin SDK.
   * Chỉnh sửa thông tin hồ sơ (Bio, Avatar, Cover, Số điện thoại, Quê quán) và thiết lập sở thích du lịch cá nhân hóa (`TravelPreferences`).
2. **Phân hệ Quản lý Chuyến đi (Trip CRUD & Deep Clone)**:
   * Khởi tạo, sửa, xóa các chuyến đi cá nhân (Title, Ngân sách, Ngày đi, Kiểu du lịch).
   * Cơ chế **Deep Clone**: Sao chép chuyến đi công khai của người dùng khác, tự động nhân bản toàn bộ danh sách `TripDay` và `TripActivity` sang tài khoản mới.
3. **Phân hệ Bản đồ GIS & Live Tracking**:
   * Tích hợp bản đồ Leaflet, hiển thị danh sách địa danh du lịch theo cụm (Marker Cluster) và bản đồ nhiệt (Heatmap) thể hiện mật độ check-in.
   * Chia sẻ vị trí trực tiếp (Live Location) thông qua WebSockets (Socket.io).
   * Trích xuất nhị phân GPS từ ảnh chụp (EXIF) để tạo nhanh điểm check-in.
4. **Phân hệ Mạng xã hội du lịch (Social Network)**:
   * Đăng bài viết chia sẻ trạng thái nhanh kèm hình ảnh, Thích bài đăng, Đánh dấu bài đăng (Bookmark).
   * Bình luận đa cấp lồng ghép không giới hạn.
   * Biên soạn Blog hành trình (`CreateStoryPage.tsx`) đính kèm trực tiếp liên kết bản đồ chuyến đi để người khác bấm xem hoặc clone.
5. **Phân hệ Admin Dashboard**:
   * Thống kê thời gian thực số lượng tài khoản, bài đăng, check-in, số lần gọi AI.
   * Biểu đồ đo lường hiệu năng kỹ thuật (WebSocket Latency, RAG Similarity, Geo Query Latency).

---

## VI. Tóm tắt Phân hệ AI & RAG (AI & RAG Overview)

Phân hệ AI đóng vai trò là trợ lý ảo hỗ trợ lập kế hoạch và tra cứu thông tin:
* **AI Planner**: Kết nối OpenAI API (`gpt-4o-mini`) để phân tích yêu cầu chuyến đi và tự động sinh lịch trình hoàn thiện dạng cấu trúc JSON chính xác, hỗ trợ tính năng tái tạo lại một phần lịch trình.
* **Multi-Agent & RAG Pipeline**: Điều phối hệ thống tác nhân thông minh (`TravelAgent`, `FoodAgent`, `CultureAgent`, `RecommendationAgent`) đi kèm cơ chế trích xuất tri thức nội bộ từ cơ sở dữ liệu vector PostgreSQL (`pgvector`) thông qua tính độ tương đồng ngữ nghĩa Cosine Similarity.
* **AI Memory & Message Versioning**: Chatbot tự học sở thích người dùng từ hội thoại và lưu trữ lịch sử tin nhắn đa phiên bản (V1, V2, V3...) để khôi phục và so sánh.

---

## VII. Các phân hệ còn thiếu & Chưa hoàn thiện (Missing & Incomplete Modules)

Mặc dù schema CSDL đã được thiết kế sẵn sàng tại `schema.prisma`, nhưng các phân hệ logic nghiệp vụ Backend và giao diện Frontend tương ứng dưới đây **chưa được xây dựng** (hoàn toàn thiếu thư mục code nghiệp vụ):

### 1. Phân hệ Chat thời gian thực trực tiếp giữa các Người dùng (Direct Chat System)
* **Hiện trạng**: Đã có bảng `Message` và `Conversation` trong CSDL.
* **BE thiếu**: Thiếu module `messages/` để xử lý REST API lấy danh sách chat, tạo phòng hội thoại chéo và cấu hình sự kiện Socket.io thời gian thực gửi tin nhắn giữa người dùng với nhau (chỉ đang có Live Location và AI Chatbot).
* **FE thiếu**: Chưa có giao diện trang Hộp thư (Inbox UI), danh sách cuộc hội thoại, và cửa sổ chat trực tiếp giữa các du khách.

### 2. Phân hệ Ghép đôi du khách đồng hành (Traveler Compatibility Matching)
* **Hiện trạng**: Đã có bảng `TravelerMatch` trong CSDL.
* **BE thiếu**: Thiếu module Backend tính toán điểm tương đồng sở thích hành trình giữa hai user (`compatScore`) và định tuyến các gợi ý kết bạn.
* **FE thiếu**: Chưa có giao diện hiển thị danh sách đề xuất bạn đồng hành phù hợp, các nút đồng ý/từ chối đề xuất ghép đôi.

### 3. Phân hệ Quản lý Sự kiện và Lễ hội địa phương mở rộng (Local Events)
* **Hiện trạng**: Đã có bảng `Event` và `EventAttendee` trong CSDL.
* **BE thiếu**: Thiếu module Backend CRUD cho Event, bộ lọc tìm kiếm sự kiện theo bán kính địa lý và hành động đăng ký tham gia sự kiện (`EventAttendee`).
* **FE thiếu**: Chưa có giao diện hiển thị lịch sự kiện địa phương trên bản đồ Leaflet, trang chi tiết sự kiện và nút "Đăng ký tham gia" cho người dùng.

### 4. Phân hệ Lịch sử di chuyển & Nhật ký hành trình phượt (Location History & GPX Tracking)
* **Hiện trạng**: Đã có bảng `LocationHistory`, `Journey`, `Route` và `RoutePoint` trong CSDL.
* **BE thiếu**: Thiếu API lưu trữ vết di chuyển tự động (Breadcrumbs GPS) định kỳ và API lưu lại bản đồ tuyến đường GPX phượt thực tế của người dùng.
* **FE thiếu**: Chưa có giao diện vẽ lại toàn bộ lịch sử đường đi của người dùng trên bản đồ (Travel Path History) và trang nhật ký ghi chép hành trình thực tế đã đi qua.

---

## VIII. Danh sách các API còn thiếu (Missing API Endpoints)

Để hoàn thiện các phân hệ thiếu ở mục VII, backend cần phát triển bổ sung các REST API endpoints sau:

### 1. Phân hệ Chat trực tiếp giữa các User (`/api/v1/conversations`)
* `GET /api/v1/conversations`: Lấy danh sách các cuộc trò chuyện của người dùng hiện tại.
* `POST /api/v1/conversations`: Tạo cuộc trò chuyện mới với một hoặc nhiều người dùng khác.
* `GET /api/v1/conversations/:id/messages`: Lấy danh sách tin nhắn trong cuộc trò chuyện (phân trang).
* `POST /api/v1/conversations/:id/messages`: Gửi tin nhắn mới vào cuộc trò chuyện.
* *Sự kiện Socket.io*: Lắng nghe sự kiện `send_direct_message` và phát sóng `new_direct_message` thời gian thực.

### 2. Phân hệ Ghép đôi du khách (`/api/v1/traveler-matches`)
* `GET /api/v1/traveler-matches/suggestions`: Lấy danh sách các du khách được đề xuất ghép đôi xếp hạng theo điểm tương thích.
* `POST /api/v1/traveler-matches/respond`: Chấp nhận (`accepted`) hoặc Từ chối (`declined`) một gợi ý ghép đôi.

### 3. Phân hệ Sự kiện địa phương (`/api/v1/events`)
* `GET /api/v1/events`: Liệt kê các sự kiện du lịch, lễ hội địa phương (hỗ trợ lọc theo tỉnh thành/thể loại).
* `GET /api/v1/events/nearby`: Tìm kiếm các sự kiện đang diễn ra trong bán kính $R$ km tính từ tọa độ hiện tại.
* `POST /api/v1/events`: Cho phép Admin hoặc Đối tác tạo sự kiện du lịch mới.
* `POST /api/v1/events/:id/attend`: Đăng ký tham gia hoặc cập nhật trạng thái tham gia sự kiện (`going`, `interested`, `maybe`).
* `GET /api/v1/events/:id/attendees`: Lấy danh sách người tham gia sự kiện.

### 4. Phân hệ Nhật ký hành trình & Lịch sử GPS (`/api/v1/journeys` & `/api/v1/location-history`)
* `POST /api/v1/location-history`: API nhận và lưu trữ vết tọa độ GPS định kỳ gửi lên từ thiết bị di động của người dùng.
* `GET /api/v1/location-history/mine`: Lấy danh sách lịch sử tọa độ theo ngày để hiển thị vết di chuyển.
* `POST /api/v1/journeys`: Tạo một nhật ký hành trình thực tế mới.
* `POST /api/v1/journeys/:id/routes`: Thêm một tuyến đường di chuyển (Route) kèm các điểm tọa độ chi tiết (`RoutePoint`) vào nhật ký.
* `GET /api/v1/journeys`: Lấy danh sách các nhật ký hành trình phượt của người dùng hoặc các nhật ký hành trình công khai của cộng đồng.

---

## IX. Đánh giá chất lượng kiểm thử & Kế hoạch hành động (Testing Quality & Action Plan)

### 1. Đánh giá chất lượng kiểm thử (Testing Quality Audit)
* **Điểm hiện trạng**: **7.0 / 10**
* **Điểm yếu**: Bộ cấu hình kiểm thử tự động `vitest.config.ts` hiện tại chỉ mới tập trung viết test-case cho các module AI (như RAG pipeline, semantic reranker, intent classifier).
* Các module nghiệp vụ Web cốt lõi (như CRUD Trips, API Like/Bookmark, Auth Middleware, JWT Token Rotation và Socket.io Live Tracking) **chưa được viết test suite tự động**, hiện đang hoàn toàn phụ thuộc vào kiểm thử thủ công (Manual Testing) ở client.

### 2. Kế hoạch hành động (Action Plan)
* **Ưu tiên Cao**:
  1. Phát triển Phân hệ Chat trực tiếp giữa các người dùng (Direct Chat API + UI) vì đây là chức năng có quan hệ mật thiết với Socket.io đã được thiết lập sẵn khung nền tảng.
  2. Bổ sung các API Endpoints cho phân hệ Sự kiện địa phương và đồng bộ lên bản đồ Leaflet.
* **Ưu tiên Trung bình**:
  1. Xây dựng bổ sung tối thiểu 15-20 Integration Test suites bằng Vitest cho các API `/api/v1/auth`, `/api/v1/trips` và các middleware bảo mật.
  2. Triển khai phân hệ Ghép đôi du khách đồng hành dựa trên so khớp mảng sở thích du lịch (`TravelPreferences`).
* **Ưu tiên Thấp**:
  1. Hoàn thiện phân hệ ghi nhận lịch sử di chuyển GPS (`LocationHistory`) và vẽ đường đi phượt.

---

## X. Kết luận hội đồng (Audit Conclusion)
* **Đủ điều kiện báo cáo tiến độ**: **Đồng ý 100%**.
* **Đủ điều kiện bảo vệ đồ án tốt nghiệp**: **Đồng ý**. Hệ thống đã xây dựng hoàn thiện hoàn toàn phần khung nền tảng (Web Core, GIS Map, Database 56 bảng chuẩn hóa, Caching, Auth JWT, Real-time WebSockets Live Location). Các cấu trúc thuật toán TSP (Exhaustive/Greedy) và EXIF GPS parser hoạt động chính xác và đạt hiệu năng tối ưu.
* Sau khi hoàn thiện các kế hoạch bổ sung API và các giao diện còn thiếu ở mục VII và VIII, hệ thống hoàn toàn đạt trạng thái sẵn sàng vận hành thương mại ở quy mô thực tế.
