# Báo cáo Kiểm toán Tính Nhất quán giữa Sơ đồ Lớp UML và CSDL (Database ↔ Class Diagram Audit Report)

Báo cáo này đối chiếu chi tiết giữa **Sơ đồ Lớp UML (UML Class Diagrams)** và **Cơ sở dữ liệu vật lý (Prisma Schema / PostgreSQL)** của hệ thống Backend nhằm đánh giá mức độ chính xác của tài liệu thiết kế so với triển khai thực tế.

---

## 1. Summary (Tóm tắt kết quả)
*   **Database ↔ Class Diagram Consistency Score**: **45%**
*   **Giải thích điểm trừ (Deductions)**:
    *   **-30%**: Hầu hết các sơ đồ lớp UML tập trung mô tả kiến trúc logic (Controller, Service, Repository) mà bỏ qua việc định nghĩa các thực thể dữ liệu bền vững (Persistent Entities). Trong số 35+ bảng cơ sở dữ liệu thực tế, sơ đồ lớp UML chỉ mô tả khoảng 8 thực thể.
    *   **-15%**: Các thực thể được mô tả (như `TripEntity`, `LocationEntity`, `EventEntity`) có nhiều thuộc tính bị sai lệch tên trường (như `ownerId` thành `userId`), sai kiểu dữ liệu (như thiếu thuộc tính tùy chọn `?`) hoặc chứa các trường ảo không tồn tại trong CSDL thực tế (như trường `address` trong `Location`).
    *   **-10%**: Thiếu các thực thể liên kết (Junction Tables) đại diện cho mối quan hệ nhiều-nhiều như `Follower`, `EventAttendee`, `ConversationParticipants`.

---

## 2. Missing Classes (Các thực thể thiếu trong Sơ đồ lớp)
Các bảng dữ liệu tồn tại trong CSDL thực tế nhưng hoàn toàn thiếu lớp thực thể tương ứng trong Sơ đồ Lớp UML:
1.  **User**: Thực thể người dùng cốt lõi.
2.  **Profile**: Thông tin chi tiết của người dùng (fullName, avatarUrl, coverUrl, bio, phoneNumber, homeLocation).
3.  **TravelPreferences**: Tùy chọn du lịch (preferredPace, dailyBudget, activities, destinationTypes, foodPreferences).
4.  **TripDay & TripActivity**: Cấu trúc ngày và các hoạt động chi tiết trong một chuyến đi.
5.  **Destination**: Thực thể địa danh dùng chung cho các mô-đun.
6.  **Follower**: Mối quan hệ theo dõi chéo giữa người dùng.
7.  **Conversation & Message**: Thực thể phục vụ tính năng chat thời gian thực.
8.  **Notification**: Thực thể lưu trữ thông báo tương tác.
9.  **CheckIn**: Ghi nhận check-in của người dùng tại địa danh.
10. **Journey, Route, RoutePoint**: Cấu trúc nhật ký hành trình tự do và tọa độ GPS của Route.
11. **LocationHistory**: Vết di chuyển lịch sử của thiết bị.
12. **EventAttendee**: Thực thể liên kết người tham gia sự kiện.
13. **TravelerMatch**: AI đề xuất ghép đôi bạn đồng hành.
14. **ChatConversation, ChatMessage, ChatMessageVersion, AIFeedback, ToolCall**: Các thực thể phục vụ hệ thống chatbot và kiểm toán chatbot.
15. **SystemCache**: Cache hệ thống thô.
16. **KnowledgeContent, KnowledgeQuestion, KnowledgeAnswer**: Tri thức RAG của hệ thống.
17. **ModelRegistry, KnowledgeVersion, PromptVersion, AIChatLog, UserFeedback, CacheMetadata, EvaluationHistory, GuardrailEvent, KnowledgeFreshness, AuditTrail**: Toàn bộ hệ thống quản trị và kiểm toán AI mới.

---

## 3. Missing Fields (Trường thông tin bị thiếu)
*   **TripEntity** thiếu: `description`, `isPublic`, `cloneSourceId`, `createdAt`, `updatedAt`.
*   **EventEntity** thiếu: `coverImageUrl`, `maxAttendees`, `currentCount`, `isPublic`, `updatedAt`.

---

## 4. Missing FK & Wrong FK (Thiếu & Sai khóa ngoại)
*   **TripEntity**: Khóa ngoại liên kết với User được đặt tên là `userId` trong sơ đồ lớp, nhưng trong CSDL thực tế là `ownerId`.
*   **EventEntity**: Sơ đồ lớp sử dụng trường `location` kiểu String làm địa điểm, trong khi CSDL thực tế sử dụng khóa ngoại `destinationId` trỏ đến bảng `Destination`.

---

## 5. Wrong Cardinality & Multiplicity (Sai bản số & Quan hệ)
*   Trong `Class_Posts.puml`, mối quan hệ giữa `Post` và `Comment`, `Like`, `Bookmark` được biểu diễn dưới dạng **Composition (`*--`)**. Tuy nhiên, trên phương diện CSDL, đây là quan hệ kết hợp (Association) có kèm quy tắc xóa Cascade (`onDelete: Cascade`), việc dùng Composition trong UML lớp chưa hoàn toàn chuẩn hóa.
*   Thiếu các quan hệ liên kết chéo từ `User` đến các thực thể con trong tất cả các sơ đồ lớp.

---

## 6. Wrong Data Types (Sai kiểu dữ liệu)
*   **TripEntity**: Các trường `startDate` và `endDate` được mô tả là bắt buộc (`DateTime`), nhưng trong CSDL thực tế là tùy chọn (`DateTime?`).
*   **EventEntity**: Trường `endDate` trong CSDL là tùy chọn (`DateTime?`), nhưng sơ đồ lớp mô tả là bắt buộc.

---

## 7. Wrong Naming (Sai lệch đặt tên)
*   Thực thể **Trip** trong CSDL được đặt tên là `TripEntity` trong sơ đồ lớp.
*   Thực thể **Location** trong CSDL được đặt tên là `LocationEntity` trong sơ đồ lớp.
*   Thực thể **Event** trong CSDL được đặt tên là `EventEntity` trong sơ đồ lớp.

---

## 8. Normalization Issues (Vấn đề chuẩn hóa CSDL)
*   **Bảng `ChatMessage` và `ChatMessageVersion`**: Lưu trữ nhiều phiên bản chỉnh sửa tin nhắn. Mặc dù đạt chuẩn 3NF thông qua khóa ngoại liên kết, nhưng việc cập nhật nội dung tin nhắn liên tục cần được giám sát chặt chẽ để tránh phình to dung lượng bảng.
*   **Bảng `AIChatLog`**: Lưu trữ dữ liệu context thô dạng JSON (`retrievedContext`). Điều này làm giảm tính chuẩn hóa (đăng ký quan hệ) nhưng là cần thiết để lưu vết kiểm toán nhanh mà không cần join quá nhiều bảng.

---

## 9. Improvement Suggestions (Đề xuất cải tiến)
1.  **Đồng bộ hóa các thực thể bền vững**: Cập nhật lại các sơ đồ lớp UML (như `Class_User.puml`, `Class_Trips.puml`) để bổ sung các thực thể thực sự từ Prisma client (User, Profile, TripDay, TripActivity).
2.  **Khớp thuộc tính thuộc tính**: Sửa các trường `userId` thành `ownerId` trong `TripEntity` và loại bỏ trường `address` ảo trong `LocationEntity`.
3.  **Tách biệt lớp Logic và lớp Dữ liệu**: Tạo một package riêng biệt tên là `Entities` hoặc `Models` trong PlantUML để chứa toàn bộ định nghĩa các bảng dữ liệu, giúp phân định rõ ràng với các lớp Controller/Service.
