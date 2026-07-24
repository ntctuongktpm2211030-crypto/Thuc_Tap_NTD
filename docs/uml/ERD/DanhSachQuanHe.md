# TÀI LIỆU DANH SÁCH MỐI QUAN HỆ CƠ SỞ DỮ LIỆU CHUYÊN SÂU
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Tài liệu này chi tiết toàn bộ các mối quan hệ (Relationships) cấp cơ sở dữ liệu vật lý và logic nghiệp vụ, đồng thời đặc tả cách thức xử lý ràng buộc xóa (Cascade, SetNull, Restrict) của hệ thống.

---

## 1. PHÂN LOẠI MỐI QUAN HỆ CẤP CƠ SỞ DỮ LIỆU (RELATION TYPES)

### 1.1. Mối quan hệ Một - Một (1-1)
Sử dụng chỉ dẫn `@unique` ở trường khóa ngoại để ép buộc tính độc bản giữa hai bản ghi.

| STT | Thực thể Nguồn (Source) | Thực thể Đích (Target) | Khóa ngoại (FK) | Ràng buộc xóa | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `User` | `Profile` | `userId` | Cascade | Một tài khoản sở hữu tối đa một hồ sơ cá nhân công khai. |
| 2 | `User` | `TravelPreferences` | `userId` | Cascade | Một người dùng cấu hình một bộ tùy chọn thói quen đi lại. |
| 3 | `User` | `AIMemory` | `userId` | Cascade | Một người dùng sở hữu tối đa một bản ghi bộ nhớ AI tích lũy. |
| 4 | `User` | `Location` | `userId` | Cascade | Một người dùng có tối đa một vị trí GPS định vị trực tiếp. |
| 5 | `ChatMessage` | `AIFeedback` | `messageId` | Cascade | Mỗi tin nhắn AI nhận tối đa một lượt đánh giá từ người dùng. |

---

### 1.2. Mối quan hệ Một - Nhiều (1-N)
Mối quan hệ cha-con tiêu chuẩn, cho phép một cha quản lý nhiều con.

| STT | Thực thể Cha (1) | Thực thể Con (N) | Khóa ngoại (FK) | Ràng buộc xóa | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `User` | `Trip` | `ownerId` | Cascade | Người dùng lập nhiều kế hoạch chuyến đi chính thức. |
| 2 | `User` | `Post` | `authorId` | Cascade | Tác giả đăng nhiều bài viết chia sẻ kinh nghiệm du ký. |
| 3 | `User` | `Comment` | `authorId` | Cascade | Người dùng viết nhiều bình luận tương tác. |
| 4 | `User` | `CheckIn` | `userId` | Cascade | Người dùng thực hiện check-in nhiều địa danh. |
| 5 | `User` | `Notification` | `recipientId` | Cascade | Người dùng nhận nhiều thông báo đẩy từ hệ thống. |
| 6 | `User` | `AIHistory` | `userId` | Cascade | Người dùng lưu trữ nhiều lịch sử sinh lịch trình tự động. |
| 7 | `User` | `ChatConversation`| `userId` | Cascade | Người dùng mở nhiều phiên thảo luận chat với AI. |
| 8 | `User` | `UserRecommendation`| `userId` | Cascade | Người dùng nhận nhiều đề xuất riêng từ hệ thống. |
| 9 | `User` | `TravelHistory` | `userId` | Cascade | Người dùng ghi nhận nhiều điểm du lịch trong lịch sử đi. |
| 10 | `User` | `FavoriteFood` | `userId` | Cascade | Người dùng lưu trữ nhiều món ăn ngon yêu thích. |
| 11 | `User` | `SavedPlace` | `userId` | Cascade | Người dùng lưu trữ nhiều địa điểm yêu thích cá nhân. |
| 12 | `User` | `Journey` | `userId` | Cascade | Du khách đăng nhiều hành trình thực tế đi phượt. |
| 13 | `User` | `LocationHistory` | `userId` | Cascade | Thiết bị lưu vết nhiều tọa độ GPS di chuyển của người dùng. |
| 14 | `User` | `Message` | `senderId` | Cascade | Người dùng gửi nhiều tin nhắn trong phòng chat đôi. |
| 15 | `Trip` | `TripDay` | `tripId` | Cascade | Chuyến đi chính thức/nháp chia nhỏ thành nhiều ngày. |
| 16 | `TripDay` | `TripActivity` | `tripDayId` | Cascade | Ngày đi gồm nhiều chặng hoạt động vui chơi xếp thứ tự. |
| 17 | `Destination` | `TripActivity` | `destinationId` | SetNull | Địa danh liên kết tới các chặng hoạt động (Nếu xóa địa danh, liên kết của hoạt động gán về NULL). |
| 18 | `Destination` | `CheckIn` | `destinationId` | Cascade | Địa danh lưu trữ nhiều bản ghi check-in của du khách. |
| 19 | `Trip` | `Recommendation` | `tripId` | Cascade | Chuyến đi nhận nhiều gợi ý địa điểm thông minh. |
| 20 | `Destination` | `Recommendation` | `destinationId` | Cascade | Điểm đến được đề xuất đính kèm trong chuyến đi. |
| 21 | `Post` | `Comment` | `postId` | Cascade | Bài viết chứa nhiều lượt bình luận tương tác. |
| 22 | `ChatConversation`| `ChatMessage` | `conversationId` | Cascade | Phiên trò chuyện AI gồm nhiều lượt tin nhắn trao đổi. |
| 23 | `ChatMessage` | `ChatMessageVersion`| `messageId` | Cascade | Lượt phản hồi của AI lưu giữ nhiều phiên bản sinh lại. |
| 24 | `ChatMessage` | `ToolCall` | `messageId` | Cascade | Một phản hồi AI có thể gọi nhiều công cụ bổ trợ. |
| 25 | `Journey` | `Route` | `journeyId` | Cascade | Cuốn nhật ký hành trình chia thành nhiều chặng đi. |
| 26 | `Route` | `RoutePoint` | `routeId` | Cascade | Chặng di chuyển vẽ bằng tập hợp nhiều điểm tọa độ. |
| 27 | `KnowledgeContent`| `KnowledgeQuestion`| `contentId` | Cascade | Tài liệu tri thức gốc có nhiều câu hỏi mẫu vector. |
| 28 | `KnowledgeContent`| `KnowledgeAnswer` | `contentId` | Cascade | Tài liệu tri thức gốc có nhiều phương án đáp án chuẩn. |
| 29 | `Destination` | `Event` | `destinationId` | SetNull | Địa danh tổ chức sự kiện (Nếu xóa điểm đến, sự kiện gán địa chỉ về NULL để cập nhật sau). |
| 30 | `User` | `Event` (Organizer) | `organizerId` | Cascade | Người dùng tổ chức nhiều lễ hội/sự kiện kết nối. |
| 31 | `Event` | `EventAttendee` | `eventId` | Cascade | Sự kiện có nhiều người tham dự đăng ký. |
| 32 | `Conversation` | `Message` | `conversationId` | Cascade | Phòng chat chứa nhiều tin nhắn trò chuyện trực tiếp. |
| 33 | `User` | `AIChatLog` | `userId` | Cascade | Người dùng thực hiện các cuộc gọi hội thoại AI. |
| 34 | `ModelRegistry` | `AIChatLog` | `modelId` | Cascade | Các cuộc gọi AI sử dụng mô hình LLM tương ứng. |
| 35 | `AIChatLog` | `UserFeedback` | `chatLogId` | Cascade | Người dùng gửi feedback đánh giá chất lượng phiên AI log. |
| 36 | `AIChatLog` | `EvaluationHistory` | `chatLogId` | Cascade | Lưu vết chi tiết điểm số đánh giá tự động cho log chat AI. |
| 37 | `AIChatLog` | `GuardrailEvent` | `chatLogId` | SetNull | Log chat AI vi phạm các luật an toàn hệ thống. |
| 38 | `KnowledgeVersion` | `KnowledgeFreshness` | `versionId` | Cascade | Giám sát độ tươi mới của phiên bản tri thức RAG. |

---

### 1.3. Mối quan hệ Nhiều - Nhiều (N-N)
Được chuẩn hóa vật lý qua các bảng liên kết trung gian (Junction Tables) để quản lý đa chiều.

| STT | Thực thể A | Thực thể B | Bảng trung gian | Khóa liên kết | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `User` | `User` | `Follower` | `followerId`, `followingId` | Mạng lưới theo dõi (Follow/Unfollow) mạng xã hội. |
| 2 | `User` | `Post` | `Like` | `userId`, `postId` | Người dùng thích nhiều bài viết, bài viết được thích bởi nhiều người. |
| 3 | `User` | `Post` | `Bookmark` | `userId`, `postId` | Lưu giữ bài đăng hữu ích của người khác vào bộ sưu tập. |
| 4 | `User` | `Event` | `EventAttendee` | `userId`, `eventId` | Du khách đăng ký tham dự các lễ hội, sự kiện. |
| 5 | `User` | `Conversation` | `ConversationParticipants` | Virtual (Prisma managed) | Liên kết người dùng tham gia các phòng chat thời gian thực. |

---

### 1.4. Mối quan hệ Tự tham chiếu / Đệ quy (Self-Reference / Recursive)
Khóa ngoại của thực thể trỏ ngược lại khóa chính của chính nó.

| Thực thể | Thuộc tính khóa ngoại | Trỏ đến | Loại quan hệ | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- | :--- | :--- |
| `Comment` | `parentId` | `Comment.id` | 1-N (Optional) | Bình luận cha - phản hồi con (Replies). Xóa cha -> Xóa con. |
| `Trip` | `cloneSourceId` | `Trip.id` | 1-N (Optional) | Nhân bản chuyến đi công khai từ hành trình mẫu của du khách khác. |

---

## 2. CHI TIẾT CƠ CHẾ BẢO VỆ TOÀN VẸN KHI XÓA (DELETE ACTIONS)

CSDL định cấu hình 3 loại hành động xóa chính:

1. **Cascade (Xóa bắc cầu)**:
   * **Cơ chế**: Khi dòng dữ liệu ở bảng cha bị xóa, toàn bộ dòng dữ liệu liên quan ở bảng con sẽ bị xóa tự động theo.
   * **Áp dụng**: Bảo vệ mối quan hệ Hợp thành (Composition). Giúp CSDL tự động giải phóng các bản ghi phụ thuộc như `TripDay` (khi xóa `Trip`), `ChatMessage` (khi xóa `ChatConversation`), tránh xảy ra lỗi dữ liệu mồ côi (orphans).
2. **SetNull (Gán rỗng)**:
   * **Cơ chế**: Khi dòng ở bảng cha bị xóa, khóa ngoại của dòng ở bảng con sẽ tự động gán về `NULL`.
   * **Áp dụng**: Sử dụng cho quan hệ Aggregation (sở hữu lỏng lẻo). Ví dụ: Khi xóa chuyến đi `Trip`, bài viết `Post` liên kết với nó chỉ bị gán trường `tripId` về rỗng chứ không bị xóa khỏi luồng Social Feed của tác giả.
3. **Restrict (Chặn xóa)**:
   * **Cơ chế**: CSDL sẽ từ chối và chặn hành động xóa bảng cha nếu vẫn còn bất kỳ bản ghi con nào đang liên kết trỏ tới.
   * **Áp dụng**: Ngăn chặn việc vô ý xóa các địa danh cốt lõi `Destination` đang được sử dụng trong các kế hoạch chuyến đi (`TripActivity`) của du khách. Quản trị viên chỉ xóa được Destination khi đã dọn dẹp sạch các hoạt động liên kết.

---
*Kết thúc tài liệu đặc tả quan hệ và ràng buộc CSDL.*
