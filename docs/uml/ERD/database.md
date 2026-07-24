# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU TOÀN DIỆN (DATABASE ARCHITECTURE & DESIGN DOCUMENT)
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Tài liệu này tổng hợp toàn bộ thiết kế, cấu trúc, mối quan hệ, chỉ mục và các quy tắc nghiệp vụ của cơ sở dữ liệu hệ thống, phục vụ công tác phát triển phần mềm và báo cáo tốt nghiệp.

---

## 1. GIỚI THIỆU CHUNG (INTRODUCTION)

Hệ thống thông tin du lịch Việt Nam (Terraholic) yêu cầu lưu trữ và xử lý một lượng lớn dữ liệu đa dạng bao gồm:
* Thông tin địa lý hành chính, điểm đến du lịch, ẩm thực vùng miền và lễ hội văn hóa Việt Nam.
* Dữ liệu phi cấu trúc và bán cấu trúc phục vụ cho các thuật toán AI Agent và hệ thống RAG (Chatbot AI).
* Dữ liệu tương tác mạng xã hội thời gian thực, vị trí định vị GPS động và lịch trình di chuyển tối ưu hóa.

Để đáp ứng các yêu cầu phức tạp này, hệ thống lựa chọn công nghệ cơ sở dữ liệu **PostgreSQL** kết hợp với tiện ích mở rộng **pgvector** và lớp ánh xạ đối tượng **Prisma ORM**.

---

## 2. KIẾN TRÚC CƠ SỞ DỮ LIỆU (DATABASE ARCHITECTURE)

Hệ thống sử dụng mô hình kiến trúc phân tầng dữ liệu hiện đại:

```
  ┌────────────────────────────────────────────────────────┐
  │              MÃ NGUỒN BACKEND (Express / TS)           │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │                 LỚP ORM (Prisma Client)                │
  │     - Ánh xạ Typescript Types từ CSDL vật lý           │
  │     - Tự động sinh SQL Queries an toàn chống Injection │
  └───────────────────────────┬────────────────────────────┘
                              │
  ┌───────────────────────────▼────────────────────────────┐
  │             HỆ QUẢN TRỊ CSDL (PostgreSQL 15+)          │
  │     - Cột dữ liệu Quan hệ tiêu chuẩn (Relational)      │
  │     - Cột dữ liệu Vector không gian (pgvector)         │
  └────────────────────────────────────────────────────────┘
```

* **Hệ quản trị CSDL chính**: **PostgreSQL** bảo đảm tính toàn vẹn giao dịch (ACID), khả năng mở rộng tốt và hỗ trợ hiệu quả các kiểu dữ liệu mảng, không gian địa lý.
* **Tiện ích Vector Search**: Tiện ích mở rộng **pgvector** được cài đặt trực tiếp trong CSDL (`extensions = [vector]`) cho phép lưu trữ và thực hiện các phép toán tìm kiếm khoảng cách vector (Cosine Similarity) cho tri thức RAG trên PostgreSQL mà không cần trang bị thêm một Vector Database chuyên biệt (như Pinecone hay Milvus), giúp tối ưu hóa chi phí vận hành hạ tầng.
* **Lớp giao tiếp ORM**: **Prisma ORM** quản lý cấu trúc bảng thông qua schema file, kiểm soát lịch sử migration dữ liệu và hỗ trợ cơ chế nạp chồng dữ liệu quan hệ (Eager/Lazy Loading) tối ưu.

---

## 3. DANH SÁCH TOÀN BỘ CÁC THỰC THỂ (ENTITY LIST)

CSDL hệ thống bao gồm **51 thực thể (tables)** được phân chia theo các phân hệ chức năng:

### 3.1. Phân hệ Người dùng & Cá nhân hóa
1. **User**: Lưu tài khoản đăng nhập, email, hash mật khẩu, vai trò, trạng thái xác thực và các token OTP (`verificationToken`, `resetPasswordToken`).
2. **Profile**: Thông tin cá nhân mở rộng (họ tên, số điện thoại, ảnh đại diện, bio).
3. **TravelPreferences**: Lưu trữ sở thích du lịch cá nhân (budget, pace, activities, food).
4. **AIMemory**: Bộ nhớ động do AI tự động bóc tách từ các cuộc hội thoại chat.
5. **Follower**: Quản lý quan hệ theo dõi chéo giữa các người dùng.
6. **Notification**: Lưu trữ thông báo gửi đến người dùng.
7. **Location**: Tọa độ GPS trực tiếp của người dùng.
8. **LocationHistory**: Nhật ký lưu vết tọa độ GPS di chuyển thô.
9. **TravelHistory**: Quản lý nhật ký di chuyển thực tế (đánh giá, chi phí chuyến đi đã qua).
10. **FavoriteFood**: Lưu trữ danh mục món ăn địa phương yêu thích của người dùng.

### 3.2. Phân hệ Lập lịch trình & Hành trình du lịch
11. **Trip**: Chuyến đi chính thức (tên điểm đến, ngày đi, tổng ngân sách, phong cách, trạng thái `TripStatus` như `DRAFT_USER`, `PUBLISHED`).
12. **TripDay**: Các ngày cụ thể trong một chuyến đi.
13. **TripActivity**: Chi tiết hoạt động tham quan từng ngày (thời gian, thứ tự di chuyển, chi phí).
14. **Journey**: Bản ghi du ký, chia sẻ hành trình di chuyển thực tế của người dùng.
15. **Route**: Chặng đường di chuyển nằm trong hành trình du ký.
16. **RoutePoint**: Các điểm tọa độ GPS cụ thể vẽ cung đường thực tế của phượt thủ.

### 3.3. Phân hệ Địa điểm & GIS
17. **Destination**: Danh mục điểm đến, di tích lịch sử, nhà hàng, khách sạn.
18. **CheckIn**: Nhật ký check-in thực tế của du khách tại điểm đến kèm ảnh.
19. **SavedPlace**: Địa chỉ địa danh do người dùng lưu lại cá nhân.
20. **Recommendation**: Gợi ý điểm đến tương ứng đính kèm chuyến đi.
21. **UserRecommendation**: Gợi ý địa điểm hệ thống tự đề xuất riêng cho người dùng.
22. **SafetyWarning**: Cảnh báo nguy hiểm thời tiết, thiên tai theo tọa độ GPS.

### 3.4. Phân hệ Mạng xã hội & Tương tác
23. **Post**: Bài chia sẻ trải nghiệm chuyến đi (Blog/Story) kèm hình ảnh.
24. **Comment**: Bình luận dưới bài viết.
25. **Like**: Lượt thích bài viết của người dùng.
26. **Bookmark**: Đánh dấu lưu trữ bài viết của người khác vào thư viện cá nhân.

### 3.5. Phân hệ Sự kiện & Kết nối
27. **Event**: Lễ hội văn hóa, meetup hoặc giao lưu địa phương trên bản đồ.
28. **EventAttendee**: Danh sách người đăng ký tham dự sự kiện.
29. **TravelerMatch**: AI tự động so khớp bạn đồng hành dựa trên TravelPreferences.
30. **Conversation**: Cuộc trò chuyện nhắn tin P2P trực tiếp giữa những người dùng.
31. **Message**: Tin nhắn gửi đi trong cuộc trò chuyện P2P.

### 3.6. Phân hệ Trợ lý Chatbot AI & RAG
32. **ChatConversation**: Phiên hội thoại giữa người dùng và chatbot AI.
33. **ChatMessage**: Tin nhắn hỏi/đáp thuộc phiên trò chuyện AI.
34. **ChatMessageVersion**: Các phiên bản câu trả lời khác nhau khi người dùng regenerate phản hồi AI.
35. **ToolCall**: Nhật ký hành động gọi công cụ (Weather, Maps API) của tác tử AI.
36. **AIFeedback**: Đánh giá chất lượng câu trả lời chatbot AI.
37. **KnowledgeContent**: Tài liệu văn bản tri thức văn hóa, ẩm thực địa phương.
38. **KnowledgeQuestion**: Câu hỏi mẫu tương ứng tài liệu tri thức, chứa vector đặc trưng ngữ nghĩa.
39. **KnowledgeAnswer**: Câu trả lời mẫu chuẩn đã được biên soạn.

### 3.7. Phân hệ Quản trị & Giám sát AI (AI Governance)
40. **ModelRegistry**: Đăng ký danh mục các mô hình LLM được sử dụng trong hệ thống.
41. **KnowledgeVersion**: Quản lý lịch sử các phiên bản tri thức RAG được cập nhật.
42. **PromptVersion**: Quản lý các phiên bản prompt hệ thống.
43. **AIChatLog**: Lưu chi tiết log gọi AI phục vụ thống kê chi phí token và giám sát.
44. **UserFeedback**: Phản hồi đánh giá tổng quan của người dùng về dịch vụ AI.
45. **EvaluationHistory**: Nhật ký đánh giá tự động (faithfulness, answer_relevance, v.v.).
46. **GuardrailEvent**: Nhật ký sự kiện vi phạm an toàn prompt hoặc độc hại bị block.
47. **KnowledgeFreshness**: Giám sát độ tươi mới tri thức RAG để tránh trôi dạt thông tin.
48. **AuditTrail**: Nhật ký vết kiểm toán các hành động quản trị hệ thống AI.
49. **AIHistory**: Thống kê số lượng gọi dịch vụ sinh lịch trình của AI.

### 3.8. Phân hệ Bộ nhớ đệm (Caching)
50. **SystemCache**: Đệm lưu trữ các phản hồi API hoặc dữ liệu nặng với khóa composite `[key, type]`.
51. **CacheMetadata**: Siêu dữ liệu Caching ngữ nghĩa phục vụ tìm kiếm embeddings.

---

## 4. QUAN HỆ GIỮA CÁC THỰC THỂ (DATABASE RELATIONSHIPS)

CSDL biểu diễn đầy đủ các quan hệ thực thể quan trọng:

* **Quan hệ Một - Một (1:1)**: Được thực thi bằng từ khóa khóa ngoại và chỉ dẫn `@unique` ở thực thể con (ví dụ: `User` — `Profile`, `User` — `TravelPreferences`, `ChatMessage` — `AIFeedback`).
* **Quan hệ Một - Nhiều (1:N)**: Bản ghi cha quản lý danh sách con (ví dụ: `Trip` — `TripDay` — `TripActivity`, `ChatConversation` — `ChatMessage` — `ChatMessageVersion`).
* **Quan hệ Nhiều - Nhiều (N:N)**: Được phân tách thông qua các Junction Tables rõ ràng (`Follower` liên kết `User`-`User`, `EventAttendee` liên kết `User`-`Event`, `Like`/`Bookmark` liên kết `User`-`Post`).
* **Quan hệ Đệ quy (Self-Reference)**: Tự tham chiếu ngược lại bảng (ví dụ: `Comment` tự tham chiếu `Comment` qua `parentId` để phản hồi; `Trip` tự tham chiếu `Trip` qua `cloneSourceId` để nhân bản).
* **Quan hệ Hợp thành (Composition)**: Ràng buộc xóa vật lý `onDelete: Cascade` từ bảng cha xuống bảng con (Xóa User -> Xóa Profile; Xóa Trip -> Xóa TripDay -> Xóa TripActivity).
* **Quan hệ Thu nạp (Aggregation)**: Ràng buộc giữ lại dữ liệu `onDelete: SetNull` hoặc `onDelete: Restrict` (Xóa Trip -> Bài viết Post liên quan không bị xóa mà chỉ chuyển trường `tripId` về `NULL`).

---

## 5. CÁC QUY LUẬT NGHIỆP VỤ (BUSINESS RULES)

CSDL tích hợp các ràng buộc nghiệp vụ để duy trì chất lượng dữ liệu:

1. **Ràng buộc thời gian hành trình**: Ngày bắt đầu chuyến đi `startDate` luôn nhỏ hơn hoặc bằng ngày kết thúc `endDate` trong bảng `Trip`.
2. **Quy tắc duy nhất tương tác**: Một người dùng chỉ được phép Thích hoặc Bookmark bài viết duy nhất một lần (được bảo vệ bằng chỉ mục phức hợp `@unique([postId, userId])`).
3. **Quy tắc sĩ số sự kiện**: Khi người dùng đăng ký vào bảng `EventAttendee`, hệ thống phải kiểm tra xem số lượng tham gia thực tế `currentCount` ở bảng `Event` có vượt quá giới hạn tối đa `maxAttendees` hay không.
4. **Quy tắc dọn dẹp Cache**: Mọi dữ liệu cache (`SystemCache`, `CacheMetadata`) đều có thời hạn hết hiệu lực `expiresAt`. Khi đọc cache, hệ thống sẽ từ chối trả về nếu `expiresAt` nhỏ hơn thời gian hiện tại. Có tiến trình chạy ngầm dọn sạch các cache hết hạn định kỳ.
5. **Quy tắc phiên bản câu trả lời AI**: Trong danh sách các phiên bản câu trả lời `ChatMessageVersion` thuộc về một tin nhắn `ChatMessage`, chỉ được phép có tối đa duy nhất một phiên bản được gán trạng thái đang hoạt động `isActive = true`.

---

## 6. RÀNG BUỘC TOÀN VẸN (INTEGRITY CONSTRAINTS)

* **Toàn vẹn thực thể (Entity Integrity)**: Đảm bảo mọi dòng dữ liệu đều có khóa chính PK duy nhất không rỗng.
* **Toàn vẹn tham chiếu (Referential Integrity)**: Tất cả các trường khóa ngoại (FK) đều phải trỏ tới bản ghi tồn tại ở bảng đích. CSDL sử dụng các cơ chế kích hoạt hành động xóa phân cấp (`Cascade`, `SetNull`) để ngăn chặn việc xuất hiện dữ liệu mồ côi (orphaned data).
* **Toàn vẹn miền giá trị (Domain Integrity)**: Áp dụng ràng buộc kiểu dữ liệu nghiêm ngặt cho tọa độ địa lý (vĩ độ `[-90, 90]`, kinh độ `[-180, 180]`), điểm đánh giá (từ 1.0 đến 5.0), số lượng sĩ số sự kiện (lớn hơn hoặc bằng 0).

---

## 7. HỆ THỐNG CHỈ MỤC CSDL (DATABASE INDEXING SYSTEM)

CSDL được cấu hình hệ thống chỉ mục (Indices) phong phú để tăng tốc độ truy vấn:

1. **Chỉ mục B-Tree chuẩn (Standard B-Tree Indices)**:
   * Được áp dụng tự động cho các khóa chính, khóa ngoại (`ownerId`, `tripId`, `recipientId`) và các cột có ràng buộc `@unique` (như `email` của User).
   * Giúp tăng tốc 95% các phép Join bảng trong các truy vấn quan hệ.
2. **Chỉ mục không gian địa lý (Spatial Indices)**:
   * Chỉ mục phức hợp `@@index([latitude, longitude])` trên các bảng `Destination`, `LocationHistory` và `SafetyWarning`.
   * Giúp hệ thống thực hiện các phép truy vấn tìm kiếm lân cận (Spatial Bounding Box Queries) cực nhanh trên bản đồ mà không phải duyệt quét toàn bộ bảng tọa độ.
3. **Chỉ mục Vector ngữ nghĩa (Vector Indices)**:
   * Thường sử dụng chỉ mục **IVFFlat** hoặc **HNSW** (Hierarchical Navigable Small World) của pgvector trên trường `embeddingOpenAI` / `embeddingLocal` của bảng `KnowledgeQuestion`.
   * Hỗ trợ tăng tốc độ tìm kiếm tương đồng vector cho hàng vạn câu hỏi tri thức RAG.

---

## 8. TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN (PERFORMANCE OPTIMIZATIONS)

* **Tối ưu hóa tìm kiếm lân cận**: Sử dụng phép toán truy vấn bounding box (khoảng giới hạn Min/Max Latitude/Longitude) trước để lọc bớt 90% địa danh ngoài vùng ảnh hưởng, sau đó mới áp dụng công thức lượng giác Haversine phức tạp trên các điểm còn lại để tìm khoảng cách chính xác.
* **Phân lớp Caching thông minh**: Đệm dữ liệu JSON của các địa danh, ẩm thực địa phương giúp giảm tải số lượng kết nối mạng đi ra ngoài API của MapLibre/OpenWeatherMap, cải thiện tốc độ phản hồi từ hàng giây xuống hàng miligiây.
* **Tối ưu tìm kiếm ngữ nghĩa RAG**: Thực hiện tính độ tương đồng cosine vector trực tiếp bằng câu lệnh SQL thô ở mức CSDL thông qua pgvector thay vì tải dữ liệu lên RAM Backend để tính toán:
```sql
SELECT "contentId", 1 - (embedding_openai <=> $1) AS similarity
FROM "KnowledgeQuestion"
ORDER BY similarity DESC
LIMIT 5;
```

---

## 9. KHUYẾN NGHỊ PHÁT TRIỂN & CẢI TIẾN (RECOMMENDATIONS)

Để hệ thống vận hành tối ưu ở quy mô doanh nghiệp lớn, đề xuất áp dụng 3 khuyến nghị cải tiến:

1. **Di chuyển Cache lên Redis**: Thay thế các bảng cache vật lý (`SystemCache`, `CacheMetadata`) trong PostgreSQL bằng một cơ sở dữ liệu RAM chuyên biệt như **Redis**. Điều này giúp giải phóng hoàn toàn tài nguyên đọc/ghi đĩa của PostgreSQL, hỗ trợ tự động hết hạn cache (TTL) ở mức hạ tầng mà không cần viết cron-job quét thủ công.
2. **Hợp nhất thực thể nháp và thực thể chính**: Hợp nhất cấu trúc bảng lịch trình AI nháp `Itinerary` vào bảng `Trip` chính thức bằng việc sử dụng một trường trạng thái phân loại (`TripStatus`). Việc này giúp tinh gọn lược đồ thực thể quan hệ, giảm thiểu việc viết các câu lệnh chuyển đổi dữ liệu phức tạp trên mã nguồn Backend.
3. **Áp dụng Chỉ mục GIN cho thuộc tính mảng**: Đối với các thuộc tính mảng nguyên thủy trong `TravelPreferences` và `AIMemory`, cần bổ sung chỉ mục **GIN (Generalized Inverted Index)** trong PostgreSQL để tối ưu hóa hiệu năng cho các truy vấn lọc chéo sở thích người dùng.

---
*Tài liệu đặc tả kiến trúc cơ sở dữ liệu Terraholic hoàn thành.*
