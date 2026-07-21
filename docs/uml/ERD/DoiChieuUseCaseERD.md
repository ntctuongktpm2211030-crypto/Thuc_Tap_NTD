# BẢO CÁO ĐỐI CHIẾU USE CASE VỚI LƯỢC ĐỒ ERD (USE CASE TO ERD MAPPING REPORT)
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Báo cáo này đối chiếu chi tiết giữa danh sách các Use Case nghiệp vụ chính của hệ thống với lược đồ thực thể quan hệ ERD đã thiết kế, nhằm đảm bảo tính đồng bộ, phát hiện các điểm thiếu sót ở cấp cơ sở dữ liệu để đáp ứng các nghiệp vụ của phần mềm.

---

## I. MÔ ĐUN 1: XÁC THỰC & CÁ NHÂN HÓA (AUTHENTICATIONS)

### 1. UC-AUTH-01: Đăng ký tài khoản
* **Thực thể sử dụng**: `User`, `Profile`.
* **Quan hệ sử dụng**: `User ||--|| Profile` ("sở hữu hồ sơ").
* **Thao tác CRUD**:
  * **Create**: Thêm mới bản ghi vào bảng `User` và `Profile` (trong một Transaction duy nhất).
* **Entity & Quan hệ thiếu**: Không có.

### 2. UC-AUTH-02: Đăng nhập
* **Thực thể sử dụng**: `User`, `Profile`.
* **Quan hệ sử dụng**: `User ||--|| Profile` ("sở hữu hồ sơ").
* **Thao tác CRUD**:
  * **Read**: Truy vấn email và so khớp password hash. Đọc thông tin hồ sơ đi kèm.
* **Entity & Quan hệ thiếu**: Không có.

### 3. UC-AUTH-03: Xác thực email
* **Thực thể sử dụng**: `User`.
* **Thao tác CRUD**:
  * **Update**: Cập nhật trạng thái `isVerified = true` và xóa `verificationToken`.
* **Entity & Quan hệ thiếu**: Không có.

### 4. UC-AUTH-04: Khôi phục mật khẩu
* **Thực thể sử dụng**: `User`.
* **Thao tác CRUD**:
  * **Update**: Cập nhật `passwordHash` mới sau khi đối khớp thành công `resetPasswordToken`.
* **Entity & Quan hệ thiếu**: Không có.

### 5. UC-AUTH-05: Quản lý hồ sơ cá nhân
* **Thực thể sử dụng**: `Profile`, `User`.
* **Quan hệ sử dụng**: `User ||--|| Profile`.
* **Thao tác CRUD**:
  * **Read**: Đọc thông tin Profile dựa trên `userId`.
  * **Update**: Cập nhật các trường `fullName`, `avatarUrl`, `coverUrl`, `bio`, `phoneNumber`.
* **Entity & Quan hệ thiếu**: Không có.

### 6. UC-AUTH-06: Quản lý sở thích du lịch
* **Thực thể sử dụng**: `TravelPreferences`, `User`.
* **Quan hệ sử dụng**: `User ||--|| TravelPreferences` ("cấu hình sở thích").
* **Thao tác CRUD**:
  * **Create/Update**: Ghi nhận hoặc chỉnh sửa ngân sách, nhip độ, loại hình ưa thích.
  * **Read**: Đọc dữ liệu để cá nhân hóa kết quả tìm kiếm.
* **Entity & Quan hệ thiếu**: Không có.

---

## II. MÔ ĐUN 2: LẬP KẾ HOẠCH CHUYẾN ĐI (TRIP PLANNING)

### 7. UC-TRIP-01: Tạo chuyến đi du lịch (CRUD)
* **Thực thể sử dụng**: `Trip`, `TripDay`, `TripActivity`, `Destination`.
* **Quan hệ sử dụng**:
  * `User ||--o{ Trip` (sở hữu chuyến đi).
  * `Trip ||--o{ TripDay` (gồm các ngày).
  * `TripDay ||--o{ TripActivity` (các chặng hoạt động).
  * `Destination ||--o{ TripActivity` (định vị điểm đến).
* **Thao tác CRUD**:
  * **Create**: Thêm mới bản ghi chuyến đi và hoạt động trong các ngày đi tương ứng.
* **Entity & Quan hệ thiếu**: Không có.

### 8. UC-TRIP-02: Cập nhật & Tối ưu hóa chuyến đi
* **Thực thể sử dụng**: `Trip`, `TripDay`, `TripActivity`.
* **Thao tác CRUD**:
  * **Update**: Thay đổi thứ tự sắp xếp hoạt động `sequenceOrder` (áp dụng thuật toán TSP).
* **Entity & Quan hệ thiếu**: Không có.

### 9. UC-TRIP-03: Nhân bản chuyến đi công khai (Clone Trip)
* **Thực thể sử dụng**: `Trip`, `TripDay`, `TripActivity`.
* **Quan hệ sử dụng**: `Trip ||--o{ Trip` (Tự tham chiếu nhân bản qua `cloneSourceId`).
* **Thao tác CRUD**:
  * **Create**: Sao chép toàn bộ cấu trúc ngày và hoạt động từ chuyến đi gốc sang chuyến đi mới của User.
* **Entity & Quan hệ thiếu**: Không có.

### 10. UC-TRIP-04: Sinh lịch trình du lịch bằng AI
* **Thực thể sử dụng**: `Trip`, `TripDay`, `TripActivity`, `AIHistory`.
* **Quan hệ sử dụng**:
  * `User ||--o{ AIHistory` (Nhật ký gọi AI).
  * `User ||--o{ Trip` (sở hữu chuyến đi ở trạng thái `DRAFT_AI`).
* **Thao tác CRUD**:
  * **Create**: Tạo lịch trình thô do AI sinh ra dưới dạng `Trip` với `status = DRAFT_AI`. Lưu vết prompt và kết quả json vào `AIHistory`.
* **Entity & Quan hệ thiếu**: Không có.
* **Giải pháp khắc phục**: Đã hỗ trợ hoàn hảo bằng cách lưu trực tiếp lịch trình nháp AI vào bảng `Trip` với trạng thái `status = DRAFT_AI` (Enum `TripStatus`), kết hợp các trường ngày giờ nullable, giúp tránh nhân đôi cấu trúc bảng (Entity Bloat).

---

## III. MÔ ĐUN 3: CỘNG ĐỒNG & TƯƠNG TÁC (COMMUNITY)

### 11. UC-SOCIAL-01: Đăng bài viết chia sẻ (Blog/Story)
* **Thực thể sử dụng**: `Post`, `User`, `Trip`.
* **Quan hệ sử dụng**:
  * `User ||--o{ Post` (tác giả bài đăng).
  * `Trip ||--o{ Post` (chia sẻ kèm chuyến đi).
* **Thao tác CRUD**:
  * **Create**: Tạo bài viết mới kèm danh sách ảnh.
* **Entity & Quan hệ thiếu**: Không có.

### 12. UC-SOCIAL-02: Tương tác bài đăng (Thích & Đánh dấu)
* **Thực thể sử dụng**: `Like`, `Bookmark`, `Post`, `User`.
* **Quan hệ sử dụng**:
  * `User ||--o{ Like` & `Post ||--o{ Like` (Junction Table `Like`).
  * `User ||--o{ Bookmark` & `Post ||--o{ Bookmark` (Junction Table `Bookmark`).
* **Thao tác CRUD**:
  * **Create**: Thích/Đánh dấu.
  * **Delete**: Bỏ thích/Bỏ đánh dấu.
* **Entity & Quan hệ thiếu**: Không có.

### 13. UC-SOCIAL-03: Bình luận và Phản hồi bình luận
* **Thực thể sử dụng**: `Comment`, `Post`, `User`.
* **Quan hệ sử dụng**:
  * `Post ||--o{ Comment` (bài viết có bình luận).
  * `Comment ||--o{ Comment` (Tự tham chiếu đệ quy qua `parentId` phản hồi).
* **Thao tác CRUD**:
  * **Create**: Tạo bình luận mới.
  * **Read**: Đọc cây phân tầng bình luận.
* **Entity & Quan hệ thiếu**: Không có.

### 14. UC-SOCIAL-04: Theo dõi người dùng (Follow/Unfollow)
* **Thực thể sử dụng**: `Follower`, `User`.
* **Quan hệ sử dụng**: `User }o--o{ User` thông qua bảng trung gian `Follower`.
* **Thao tác CRUD**:
  * **Create**: Bấm theo dõi.
  * **Delete**: Hủy theo dõi.
* **Entity & Quan hệ thiếu**: Không có.

### 15. UC-SOCIAL-05: Xem thông báo
* **Thực thể sử dụng**: `Notification`.
* **Thao tác CRUD**:
  * **Read**: Xem danh sách thông báo chưa đọc.
  * **Update**: Đổi trạng thái `isRead = true`.
* **Entity & Quan hệ thiếu**: Không có.

---

## IV. MÔ ĐUN 4: BẢN ĐỒ TƯƠNG TÁC & GIS (INTERACTIVE MAP)

### 16. UC-MAP-01: Check-in địa điểm du lịch
* **Thực thể sử dụng**: `CheckIn`, `Destination`, `User`.
* **Quan hệ sử dụng**:
  * `User ||--o{ CheckIn`.
  * `Destination ||--o{ CheckIn`.
* **Thao tác CRUD**:
  * **Create**: Lưu nhật ký check-in kèm cảm nghĩ tại điểm đến.
* **Entity & Quan hệ thiếu**: Không có.

### 17. UC-MAP-02: Theo dõi vị trí trực tiếp & Tìm bạn lân cận
* **Thực thể sử dụng**: `Location`, `User`.
* **Quan hệ sử dụng**: `User ||--|| Location` (vị trí hiện tại).
* **Thao tác CRUD**:
  * **Update**: Cập nhật tọa độ GPS thời gian thực.
  * **Read**: Truy vấn các Location lân cận thông qua Haversine formula để tìm bạn bè.
* **Entity & Quan hệ thiếu**: **Có thiếu sót logic**. Cần một bảng lưu vết lịch sử di chuyển phục vụ vẽ lộ trình hành trình và thống kê vị trí đã đi.
* **Giải pháp khắc phục**: Đã thiết kế thực thể `LocationHistory` để giải quyết việc lưu vết tọa độ.

### 18. UC-MAP-03: Gợi ý điểm đến cá nhân hóa
* **Thực thể sử dụng**: `Recommendation`, `Destination`, `TravelPreferences`.
* **Thao tác CRUD**:
  * **Read**: Đối khớp sở thích và địa danh để tính toán điểm số tương thích.
* **Entity & Quan hệ thiếu**: Không có.

### 19. UC-MAP-04: Xem cảnh báo an toàn thiên tai
* **Thực thể sử dụng**: `SafetyWarning`.
* **Thao tác CRUD**:
  * **Read**: Đọc các cảnh báo còn hiệu lực trong khu vực tọa độ GPS của người dùng.
* **Entity & Quan hệ thiếu**: Không có.

---

## V. MÔ ĐUN 5: TRỢ LÝ CHATBOT AI (AI CHATBOT)

### 20. UC-AI-01: Trò chuyện và Phân loại ý định (RAG & Agent)
* **Thực thể sử dụng**: `ChatConversation`, `ChatMessage`, `ChatMessageVersion`, `AIMemory`.
* **Quan hệ sử dụng**:
  * `User ||--o{ ChatConversation` (chủ cuộc trò chuyện).
  * `ChatConversation ||--o{ ChatMessage` (gồm các tin nhắn).
  * `ChatMessage ||--o{ ChatMessageVersion` (phần sinh câu trả lời).
* **Thao tác CRUD**:
  * **Create**: Ghi nhận tin nhắn mới và cập nhật bộ nhớ sở thích (`AIMemory`).
* **Entity & Quan hệ thiếu**: Không có.

### 21. UC-AI-02: Sinh lại câu trả lời AI (Regenerate)
* **Thực thể sử dụng**: `ChatMessage`, `ChatMessageVersion`.
* **Thao tác CRUD**:
  * **Create**: Tạo bản ghi `ChatMessageVersion` mới có chỉ số `version` tăng thêm 1.
  * **Update**: Đặt `isActive = true` cho phiên bản mới và `false` cho phiên bản cũ.
* **Entity & Quan hệ thiếu**: Không có.

### 22. UC-AI-03: Gọi công cụ bổ trợ (Tool-Call Logger)
* **Thực thể sử dụng**: `ToolCall`, `ChatMessage`.
* **Quan hệ sử dụng**: `ChatMessage ||--o{ ToolCall` (tin nhắn AI gọi công cụ).
* **Thao tác CRUD**:
  * **Create**: Ghi nhật ký tên công cụ, dữ liệu đầu vào và đầu ra khi Agent thực thi.
* **Entity & Quan hệ thiếu**: Không có.

### 23. UC-AI-04: Đánh giá câu trả lời của AI
* **Thực thể sử dụng**: `AIFeedback`, `ChatMessage`.
* **Quan hệ sử dụng**: `ChatMessage ||--|| AIFeedback` (tin nhắn được đánh giá).
* **Thao tác CRUD**:
  * **Create**: Người dùng gửi upvote/downvote kèm nhận xét phản hồi câu trả lời AI.
* **Entity & Quan hệ thiếu**: Không có.

---

## VI. MÔ ĐUN 6: QUẢN TRỊ NỀN TẢNG (ADMINISTRATIONS)

### 24. UC-ADMIN-01: Quản lý cơ sở tri thức RAG
* **Thực thể sử dụng**: `KnowledgeContent`, `KnowledgeQuestion`, `KnowledgeAnswer`.
* **Quan hệ sử dụng**:
  * `KnowledgeContent ||--o{ KnowledgeQuestion` (tri thức chứa các câu hỏi vector).
  * `KnowledgeContent ||--o{ KnowledgeAnswer` (tri thức chứa câu trả lời).
* **Thao tác CRUD**:
  * **Create/Update/Delete**: Quản trị viên quản lý, đăng tải tài liệu tri thức văn hóa, lễ hội.
* **Entity & Quan hệ thiếu**: Không có.


### 25. UC-ADMIN-02: Cấu hình và Dọn dẹp cache hệ thống
* **Thực thể sử dụng**: `PlaceCache`, `FoodCache`, `BlogCache`.
* **Thao tác CRUD**:
  * **Delete**: Quét dọn dẹp các cache hết hạn (`expiresAt < now()`).
* **Entity & Quan hệ thiếu**: Không có.


---

## VII. ĐÁNH GIÁ MỨC ĐỘ BAO PHỦ CỦA LƯỢC ĐỒ ERD (COVERAGE SUMMARY)

* **Tỷ lệ bao phủ**: **100%**.
* **Đánh giá chung**:
  * Mọi Use Case nghiệp vụ được xác định từ phần phân tích chức năng đều có các thực thể và mối quan hệ tương ứng trong CSDL để lưu trữ dữ liệu.
  * Các Use Case phức tạp như **Theo dõi vị trí GPS ngầm**, **Sinh lại câu trả lời AI**, **Gọi công cụ bổ trợ Agent**, và **Lập lịch trình AI nháp** đều được hỗ trợ tối ưu bằng thiết kế các thực thể chuyên biệt hoặc đa trạng thái trong CSDL (`LocationHistory`, `ChatMessageVersion`, `ToolCall`, `Trip` với trạng thái `DRAFT_AI`).
  * Các quy tắc ràng buộc cấp CSDL (`Cascade onDelete` hoặc `SetNull`) đảm bảo hỗ trợ tối đa cho các luồng xử lý CRUD của Use Case mà không gây ra lỗi toàn vẹn dữ liệu.

---
*Tài liệu đối chiếu Use Case và ERD hoàn thành. Sẵn sàng tích hợp vào tài liệu báo cáo tốt nghiệp.*
