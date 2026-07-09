**Tổng quan Database**

Cơ sở dữ liệu được xây dựng trên nền tảng PostgreSQL và sử dụng Prisma ORM để quản lý dữ liệu.

**Giải thích các bảng (Models)**

### User

- **id**: Khóa chính, là một chuỗi UUID.
- **email**: Email của người dùng, duy nhất.
- **passwordHash**: Mật khẩu đã được mã hóa.
- **role**: Vai trò của người dùng (USER hoặc ADMIN).
- **isVerified**: Đã xác minh email chưa.
- **verificationToken**: Token xác minh email.
- **resetPasswordToken**: Token phục hồi mật khẩu.
- **createdAt**: Thời gian tạo tài khoản.
- **updatedAt**: Thời gian cập nhật tài khoản.
- **profile**: Thông tin cá nhân của người dùng.
- **preferences**: Lựa chọn của người dùng.
- **trips**: Các chuyến đi của người dùng.
- **posts**: Các bài đăng của người dùng.
- **comments**: Các bình luận của người dùng.
- **likes**: Các lượt thích của người dùng.
- **bookmarks**: Các dấu trang của người dùng.
- **checkIns**: Các điểm đến của người dùng.
- **notifications**: Các thông báo của người dùng.
- **aiHistories**: Lịch sử tương tác với AI của người dùng.
- **liveLocation**: Vị trí hiện tại của người dùng.
- **chatbotConversations**: Các cuộc trò chuyện với chatbot của người dùng.
- **aiMemory**: Lưu trữ thông tin về sở thích và hành vi của người dùng.
- **itineraries**: Các lịch trình du lịch của người dùng.
- **userRecommendations**: Các gợi ý du lịch của người dùng.
- **travelHistories**: Lịch sử du lịch của người dùng.
- **favoriteFoods**: Các món ăn yêu thích của người dùng.
- **savedPlaces**: Các địa điểm được lưu trữ của người dùng.
- **aiFeedbacks**: Các phản hồi về AI của người dùng.

### Message

- **id**: Khóa chính, là một chuỗi UUID.
- **conversationId**: ID cuộc trò chuyện.
- **senderId**: ID người gửi.
- **content**: Nội dung tin nhắn.
- **createdAt**: Thời gian gửi tin nhắn.
- **updatedAt**: Thời gian cập nhật tin nhắn.
- **conversation**: Cuộc trò chuyện liên quan.
- **sender**: Người gửi tin nhắn.

### Destination

- **id**: Khóa chính, là một chuỗi UUID.
- **name**: Tên địa điểm.
- **description**: Mô tả địa điểm.
- **latitude**: Vĩ độ của địa điểm.
- **longitude**: Kinh độ của địa điểm.
- **category**: Loại địa điểm (ví dụ: nhà hàng, khách sạn, điểm tham quan).
- **averageRating**: Điểm đánh giá trung bình của địa điểm.
- **address**: Địa chỉ của địa điểm.
- **openingHours**: Giờ mở cửa của địa điểm.
- **activities**: Các hoạt động liên quan đến địa điểm.
- **checkIns**: Các điểm đến của địa điểm.
- **recommendations**: Các gợi ý liên quan đến địa điểm.

### KnowledgeContent

- **id**: Khóa chính, là một chuỗi UUID.
- **title**: Tiêu đề nội dung tri thức.
- **body**: Nội dung tri thức.
- **category**: Loại tri thức (ví dụ: văn hóa, lễ hội, ẩm thực, lịch sử, điểm đến).
- **questions**: Các câu hỏi liên quan đến nội dung tri thức.
- **answers**: Các đáp án liên quan đến nội dung tri thức.

### KnowledgeQuestion

- **id**: Khóa chính, là một chuỗi UUID.
- **contentId**: ID nội dung tri thức liên quan.
- **questionText**: Nội dung câu hỏi.
- **embeddingOpenAI**: Vector embedding OpenAI.
- **embeddingLocal**: Vector embedding Local.

### KnowledgeAnswer

- **id**: Khóa chính, là một chuỗi UUID.
- **contentId**: ID nội dung tri thức liên quan.
- **answerText**: Nội dung đáp án.
- **createdAt**: Thời gian tạo đáp án.
- **updatedAt**: Thời gian cập nhật đáp án.

### AIMemory

- **id**: Khóa chính, là một chuỗi UUID.
- **userId**: ID người dùng liên quan.
- **travelPreferences**: Lựa chọn du lịch của người dùng.
- **favoriteFoods**: Các món ăn yêu thích của người dùng.
- **budget**: Ngân sách của người dùng.
- **transportation**: Phương tiện di chuyển của người dùng.
- **favoriteLocations**: Các địa điểm yêu thích của người dùng.
- **createdAt**: Thời gian tạo lưu trữ thông tin.
- **updatedAt**: Thời gian cập nhật lưu trữ thông tin.

### ToolCall

- **id**: Khóa chính, là một chuỗi UUID.
- **messageId**: ID tin nhắn liên quan.
- **toolName**: Tên công cụ AI đã sử dụng.
- **input**: Thông tin đầu vào gửi tới công cụ.
- **output**: Kết quả phản hồi từ công cụ.
- **status**: Trạng thái chạy công cụ.
- **createdAt**: Thời gian tạo tin nhắn.

### PlaceCache

- **key**: Khóa tìm kiếm cache.
- **value**: Dữ liệu JSON của địa điểm được cache.
- **expiresAt**: Thời gian hết hạn của cache.
- **createdAt**: Thời gian tạo cache.
- **updatedAt**: Thời gian cập nhật cache.

### FoodCache

- **key**: Khóa tìm kiếm cache.
- **value**: Dữ liệu JSON của món ăn được cache.
- **expiresAt**: Thời gian hết hạn của cache.
- **createdAt**: Thời gian tạo cache.
- **updatedAt**: Thời gian cập nhật cache.

### BlogCache

- **key**: Khóa tìm kiếm cache.
- **value**: Dữ liệu JSON của blog được cache.
- **expiresAt**: Thời gian hết hạn của cache.
- **createdAt**: Thời gian tạo cache.
- **updatedAt**: Thời gian cập nhật cache.

### Follower

- **id**: Khóa chính, là một chuỗi UUID.
- **followerId**: ID người theo dõi.
- **followingId**: ID người được theo dõi.
- **createdAt**: Thời gian tạo mối quan hệ.

### Conversation

- **id**: Khóa chính, là một chuỗi UUID.
- **createdAt**: Thời gian tạo cuộc trò chuyện.
- **updatedAt**: Thời gian cập nhật cuộc trò chuyện.
- **participants**: Các người tham gia cuộc trò chuyện.
- **messages**: Các tin nhắn trong cuộc trò chuyện.

### ChatMessage

- **id**: Khóa chính, là một chuỗi UUID.
- **conversationId**: ID cuộc trò chuyện liên quan.
- **role**: Vai trò của người gửi tin nhắn (ví dụ: người dùng, AI, hệ thống).
- **createdAt**: Thời gian gửi tin nhắn.
- **updatedAt**: Thời gian cập nhật tin nhắn.
- **conversation**: Cuộc trò chuyện liên quan.
- **versions**: Các phiên bản của tin nhắn.
- **feedback**: Phản hồi về tin nhắn.
- **toolCalls**: Các cuộc gọi công cụ liên quan đến tin nhắn.

### ChatMessageVersion

- **id**: Khóa chính, là một chuỗi UUID.
- **messageId**: ID tin nhắn liên quan.
- **content**: Nội dung phiên bản tin nhắn.
- **version**: Phiên bản của tin nhắn.
- **isActive**: Có hiệu lực hay không.
- **createdAt**: Thời gian tạo phiên bản.
- **message**: Tin nhắn liên quan.

### Recommendation

- **id**: Khóa chính, là một chuỗi UUID.
- **tripId**: ID chuyến đi liên quan.
- **destinationId**: ID địa điểm liên quan.
- **score**: Điểm đánh giá của gợi ý.
- **recommendationReason**: Lý do gợi ý.
- **createdAt**: Thời gian tạo gợi ý.
- **updatedAt**: Thời gian cập nhật gợi ý.
- **trip**: Chuyến đi liên quan.
- **destination**: Địa điểm liên quan.

### TravelHistory

- **id**: Khóa chính, là một chuỗi UUID.
- **userId**: ID người dùng liên quan.
- **location**: Địa điểm đã đi.
- **time**: Thời gian đi.
- **rating**: Đánh giá.
- **cost**: Chi phí.
- **createdAt**: Thời gian tạo lịch sử du lịch.
- **updatedAt**: Thời gian cập nhật lịch sử du lịch.
- **user**: Người dùng liên quan.

### FavoriteFood

- **id**: Khóa chính, là một chuỗi UUID.
- **userId**: ID người dùng liên quan.
- **name**: Tên món ăn.
- **region**: Khu vực (ví dụ: Miền Bắc, Hà Nội, v.v.).
- **description**: Mô tả món ăn.
- **rating**: Điểm đánh giá (0 - 5).
- **createdAt**: Thời gian tạo lưu trữ thông tin.
- **updatedAt**: Thời gian cập nhật lưu trữ thông tin.
- **user**: Người dùng liên quan.

### SavedPlace

- **id**: Khóa chính, là một chuỗi UUID.
- **userId**: ID người dùng liên quan.
- **name**: Tên địa điểm.
- **category**: Loại địa điểm (ví dụ: nhà hàng, khách sạn, điểm tham quan).
- **latitude**: Vĩ độ của địa điểm.
- **longitude**: Kinh độ của địa điểm.
- **address**: Địa chỉ của địa điểm.
- **imageUrl**: Hình ảnh đại diện hoặc hình ảnh địa điểm.
- **createdAt**: Thời gian tạo lưu trữ thông tin.
- **updatedAt**: Thời gian cập nhật lưu trữ thông tin.
- **user**: Người dùng liên quan.

### AIFeedback

- **