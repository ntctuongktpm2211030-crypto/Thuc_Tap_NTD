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

CSDL hệ thống bao gồm **46 thực thể (tables)** được phân chia theo 8 mô-đun chức năng chính:

### 3.1. Mô-đun Người dùng & Cá nhân hóa
1. **User**: Lưu tài khoản đăng nhập, email, hash mật khẩu và vai trò phân quyền.
2. **Profile**: Thông tin cá nhân cơ bản hiển thị (họ tên, ảnh đại diện, tiểu sử).
3. **TravelPreferences**: Tùy chọn sở thích du lịch cá nhân (ngân sách, loại hình hoạt động).
4. **AIMemory**: Bộ nhớ sở thích du lịch lâu dài được AI tự động bóc tách từ các hội thoại chat.
5. **Follower**: Bảng liên kết trung gian quản lý theo dõi chéo giữa các người dùng.
6. **Notification**: Thông báo hệ thống gửi tới người dùng về tương tác xã hội hoặc an toàn.
7. **Location**: Tọa độ vị trí GPS trực tiếp phục vụ hiển thị bản đồ trực quan.

### 3.2. Mô-đun Hành trình & Chuyến đi
8. **Trip**: Bản ghi chuyến đi chính thức (tên điểm đến, ngày đi, tổng ngân sách, phong cách).
9. **TripDay**: Ngày đi thuộc chuyến đi (chia ngày 1, ngày 2...).
10. **TripActivity**: Chi tiết hoạt động tham quan (thời gian, thứ tự di chuyển, chi phí ước tính).
11. **Itinerary**: Lịch trình AI sinh tạm thời (bản nháp lịch trình) khi đang khảo sát thông tin.
12. **ItineraryDay**: Ngày đi thuộc lịch trình AI nháp.
13. **ItineraryActivity**: Hoạt động tham quan thuộc lịch trình AI nháp.
14. **Journey**: Bản ghi câu chuyện du lịch di chuyển thực tế (du ký).
15. **Route**: Chặng đường di chuyển nằm trong hành trình du ký.
16. **RoutePoint**: Điểm tọa độ GPS cụ thể vẽ sơ đồ đường đi thực tế của phượt thủ.
17. **LocationHistory**: Nhật ký tọa độ GPS lưu vết chuyển động thô của người dùng.

### 3.3. Mô-đun Địa điểm & GIS
18. **Destination**: Danh mục điểm đến, di tích lịch sử, nhà hàng, khách sạn Việt Nam.
19. **CheckIn**: Nhật ký check-in thực tế của du khách tại điểm đến.
20. **SavedPlace**: Địa chỉ địa danh do người dùng đánh dấu lưu lại cá nhân.
21. **Recommendation**: Gợi ý điểm đến tương ứng đính kèm chuyến đi.
22. **UserRecommendation**: Gợi ý địa điểm hệ thống tự đề xuất riêng cho người dùng.
23. **SafetyWarning**: Cảnh báo nguy hiểm thời tiết, lũ lụt, thiên tai theo tọa độ GPS.

### 3.4. Mô-đun Mạng xã hội & Tương tác
24. **Post**: Bài chia sẻ trải nghiệm chuyến đi (Blog/Story) kèm hình ảnh.
25. **Comment**: Bình luận dưới bài viết (hỗ trợ đệ quy replies).
26. **Like**: Lượt thích bài viết của người dùng.
27. **Bookmark**: Đánh dấu lưu trữ bài viết của người khác vào thư viện cá nhân.

### 3.5. Mô-đun Sự kiện & Kết nối
28. **Event**: Lễ hội văn hóa, meetup hoặc tour du lịch kết nối tại điểm đến.
29. **EventAttendee**: Danh sách người đăng ký tham dự sự kiện.
30. **TravelerMatch**: Cặp đôi du khách có chung sở thích được AI ghép cặp kết bạn đồng hành.
31. **Conversation**: Cuộc trò chuyện nhắn tin trực tiếp giữa những người dùng.
32. **Message**: Tin nhắn gửi đi trong cuộc trò chuyện giữa những người dùng.

### 3.6. Mô-đun Trợ lý Chatbot AI
33. **ChatConversation**: Phiên hội thoại giữa người dùng và chatbot Terraholic AI.
34. **ChatMessage**: Tin nhắn hỏi/đáp thuộc phiên trò chuyện AI.
35. **ChatMessageVersion**: Các phiên bản câu trả lời khác nhau khi người dùng regenerate tin nhắn AI.
36. **ToolCall**: Nhật ký hành động gọi công cụ bổ trợ (Weather, Maps API) của tác tử AI.
37. **AIFeedback**: Nhận xét đánh giá chất lượng câu trả lời chatbot AI.

### 3.7. Mô-đun Đệm Caching & Nhật ký phụ trợ
38. **PlaceCache**: Đệm lưu trữ thông tin địa điểm từ API ngoài.
39. **FoodCache**: Đệm lưu trữ thông tin món ăn ngon địa phương.
40. **BlogCache**: Đệm lưu trữ danh sách bài viết blog ngoài.
41. **FavoriteFood**: Lưu món ăn yêu thích cá nhân hóa của người dùng.
42. **AIHistory**: Thống kê số lượng, hành vi và kết quả gọi dịch vụ sinh lịch trình của AI.

### 3.8. Mô-đun RAG & Cơ sở Tri thức
43. **KnowledgeContent**: Tài liệu văn bản tri thức văn hóa, ẩm thực Việt Nam thô.
44. **KnowledgeQuestion**: Câu hỏi mẫu tương ứng tài liệu tri thức, chứa vector đặc trưng ngữ nghĩa.
45. **KnowledgeAnswer**: Câu trả lời mẫu chuẩn đã được biên soạn.

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
4. **Quy tắc dọn dẹp Cache**: Mọi dữ liệu cache (`PlaceCache`, `FoodCache`, `BlogCache`) đều có thời hạn hết hiệu lực `expiresAt`. Khi đọc cache, hệ thống sẽ từ chối trả về nếu `expiresAt` nhỏ hơn thời gian hiện tại. Có tiến trình chạy ngầm dọn sạch các cache hết hạn định kỳ.
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

1. **Di chuyển Cache lên Redis**: Thay thế các bảng cache vật lý (`PlaceCache`, `FoodCache`, `BlogCache`) trong PostgreSQL bằng một cơ sở dữ liệu RAM chuyên biệt như **Redis**. Điều này giúp giải phóng hoàn toàn tài nguyên đọc/ghi đĩa của PostgreSQL, hỗ trợ tự động hết hạn cache (TTL) ở mức hạ tầng mà không cần viết cron-job quét thủ công.
2. **Hợp nhất thực thể nháp và thực thể chính**: Hợp nhất cấu trúc bảng lịch trình AI nháp `Itinerary` vào bảng `Trip` chính thức bằng việc sử dụng một trường trạng thái phân loại (`TripStatus`). Việc này giúp tinh gọn lược đồ thực thể quan hệ, giảm thiểu việc viết các câu lệnh chuyển đổi dữ liệu phức tạp trên mã nguồn Backend.
3. **Áp dụng Chỉ mục GIN cho thuộc tính mảng**: Đối với các thuộc tính mảng nguyên thủy trong `TravelPreferences` và `AIMemory`, cần bổ sung chỉ mục **GIN (Generalized Inverted Index)** trong PostgreSQL để tối ưu hóa hiệu năng cho các truy vấn lọc chéo sở thích người dùng.

---
*Tài liệu đặc tả kiến trúc cơ sở dữ liệu Terraholic hoàn thành.*
