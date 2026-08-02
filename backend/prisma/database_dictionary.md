# BẢNG TỪ ĐIỂN DỮ LIỆU CÁC BẢNG CỐT LÕI (DATABASE DICTIONARY)

Tài liệu từ điển dữ liệu chuẩn hóa cho 21 bảng cốt lõi của ứng dụng SmartTravel dựa trên file `schema.dbml` đã tinh giản.

Cấu trúc cột tuân thủ chính xác theo mẫu:
| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |

---

### 1. Bảng User (Tài khoản người dùng)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã định danh duy nhất (UUID) |
| 2 | email | VARCHAR(255) | | UK | Địa chỉ Email đăng nhập |
| 3 | passwordHash | VARCHAR(255) | | | Mật khẩu đã mã hóa (Bcrypt) |
| 4 | role | VARCHAR(20) | | | Vai trò người dùng (USER, ADMIN) |
| 5 | isVerified | BOOLEAN | | | Trạng thái xác thực tài khoản |
| 6 | verificationToken | VARCHAR(255) | x | | Mã Token xác thực Email |
| 7 | resetPasswordToken | VARCHAR(255) | x | | Mã Token khôi phục mật khẩu |
| 8 | createdAt | TIMESTAMP | | | Thời điểm tạo tài khoản |
| 9 | updatedAt | TIMESTAMP | | | Thời điểm cập nhật gần nhất |

---

### 2. Bảng Profile (Hồ sơ cá nhân)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã định danh hồ sơ |
| 2 | userId | VARCHAR(36) | | FK, UK | Khóa ngoại trỏ đến User(id) |
| 3 | fullName | VARCHAR(100) | | | Họ và tên người dùng |
| 4 | avatarUrl | TEXT | x | | Đường dẫn ảnh đại diện |
| 5 | coverUrl | TEXT | x | | Đường dẫn ảnh bìa trang cá nhân |
| 6 | bio | TEXT | x | | Tiểu sử / Giới thiệu bản thân |
| 7 | phoneNumber | VARCHAR(20) | x | | Số điện thoại liên hệ |
| 8 | homeLocation | VARCHAR(255) | x | | Địa chỉ thường trú / Quê quán |

---

### 3. Bảng TravelPreferences (Sở thích du lịch)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã sở thích du lịch |
| 2 | userId | VARCHAR(36) | | FK, UK | Khóa ngoại trỏ đến User(id) |
| 3 | preferredPace | VARCHAR(50) | | | Nhịp độ chuyến đi ưa thích (slow, moderate, fast) |
| 4 | dailyBudget | FLOAT | | | Ngân sách chi tiêu dự kiến / ngày (VND) |
| 5 | activities | TEXT[] | | | Danh sách hoạt động yêu thích (nghỉ dưỡng, khám phá...) |
| 6 | destinationTypes | TEXT[] | | | Loại điểm đến ưu tiên (biển, núi, đô thị...) |
| 7 | foodPreferences | TEXT[] | | | Sở thích ẩm thực (ẩm thực đường phố, chay...) |

---

### 4. Bảng Trip (Chuyến đi / Lịch trình)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã định danh chuyến đi |
| 2 | ownerId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) tạo chuyến đi |
| 3 | title | VARCHAR(255) | | | Tên chuyến đi |
| 4 | description | TEXT | x | | Mô tả chi tiết chuyến đi |
| 5 | destinationName | VARCHAR(255) | | | Tên điểm đến chính |
| 6 | startDate | TIMESTAMP | x | | Ngày bắt đầu chuyến đi |
| 7 | endDate | TIMESTAMP | x | | Ngày kết thúc chuyến đi |
| 8 | totalBudget | FLOAT | | | Tổng ngân sách dự toán (VND) |
| 9 | travelStyle | VARCHAR(50) | | | Hình thức du lịch (solo, family, friends...) |
| 10 | isPublic | BOOLEAN | | | Trạng thái công khai với cộng đồng |
| 11 | status | VARCHAR(30) | | | Trạng thái chuyến đi (DRAFT_AI, DRAFT_USER, CONFIRMED) |
| 12 | cloneSourceId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Trip(id) nếu được sao chép |
| 13 | createdAt | TIMESTAMP | | | Thời điểm tạo |
| 14 | updatedAt | TIMESTAMP | | | Thời điểm cập nhật |

---

### 5. Bảng TripDay (Ngày trong lịch trình)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã ngày trong lịch trình |
| 2 | tripId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Trip(id) |
| 3 | dayIndex | INT | | | Thứ tự ngày (1, 2, 3...) |
| 4 | date | TIMESTAMP | x | | Ngày diễn ra cụ thể |

---

### 6. Bảng TripActivity (Hoạt động / Điểm dừng)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã hoạt động |
| 2 | tripDayId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến TripDay(id) |
| 3 | destinationId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Destination(id) hệ thống |
| 4 | title | VARCHAR(255) | x | | Tên hoạt động tự do |
| 5 | location | VARCHAR(255) | x | | Tên vị trí / địa điểm |
| 6 | description | TEXT | x | | Mô tả chi tiết nội dung hoạt động |
| 7 | startTime | VARCHAR(10) | x | | Giờ bắt đầu (HH:mm) |
| 8 | endTime | VARCHAR(10) | x | | Giờ kết thúc (HH:mm) |
| 9 | estimatedCost | FLOAT | | | Chi phí dự tính (VND) |
| 10 | sequenceOrder | INT | | | Thứ tự sắp xếp hoạt động trong ngày |
| 11 | notes | TEXT | x | | Ghi chú thêm về hoạt động |

---

### 7. Bảng Destination (Địa danh / Địa điểm du lịch)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã địa điểm hệ thống |
| 2 | name | VARCHAR(255) | | | Tên địa danh / địa điểm |
| 3 | description | TEXT | x | | Mô tả địa điểm |
| 4 | latitude | DOUBLE | | | Tọa độ vĩ độ GPS (WGS84) |
| 5 | longitude | DOUBLE | | | Tọa độ kinh độ GPS (WGS84) |
| 6 | category | VARCHAR(50) | | | Phân loại (attraction, restaurant, hotel...) |
| 7 | averageRating | FLOAT | | | Điểm đánh giá trung bình (0.0 - 5.0) |
| 8 | address | VARCHAR(255) | x | | Địa chỉ chi tiết |
| 9 | openingHours | VARCHAR(255) | x | | Giờ mở cửa / đóng cửa |

---

### 8. Bảng Post (Bài viết / Nhật ký chuyến đi)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã bài viết |
| 2 | authorId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) tác giả |
| 3 | content | TEXT | | | Nội dung bài viết |
| 4 | mediaUrls | TEXT[] | | | Mảng đường dẫn hình ảnh / video đính kèm |
| 5 | tripId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Trip(id) liên quan |
| 6 | locationId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Destination(id) liên quan |
| 7 | createdAt | TIMESTAMP | | | Thời điểm đăng bài |
| 8 | deletedAt | TIMESTAMP | x | | Thời điểm xóa tạm (Soft Delete) |

---

### 9. Bảng Comment (Bình luận)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã bình luận |
| 2 | postId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Post(id) |
| 3 | authorId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 4 | content | TEXT | | | Nội dung bình luận |
| 5 | parentId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Comment(id) cha (Trả lời bình luận) |
| 6 | createdAt | TIMESTAMP | | | Thời điểm bình luận |

---

### 10. Bảng Like (Yêu thích bài viết)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã lượt thích |
| 2 | postId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Post(id) |
| 3 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 4 | createdAt | TIMESTAMP | | | Thời điểm bấm thích |

---

### 11. Bảng Bookmark (Lưu bài viết)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã lượt lưu bài |
| 2 | postId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Post(id) |
| 3 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 4 | createdAt | TIMESTAMP | | | Thời điểm bấm lưu |

---

### 12. Bảng Follower (Theo dõi người dùng)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã lượt theo dõi |
| 2 | followerId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) người theo dõi |
| 3 | followingId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) người được theo dõi |
| 4 | createdAt | TIMESTAMP | | | Thời điểm bắt đầu theo dõi |

---

### 13. Bảng CheckIn (Check-in địa điểm)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã lượt check-in |
| 2 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 3 | destinationId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Destination(id) |
| 4 | note | TEXT | x | | Ghi chú khi check-in |
| 5 | createdAt | TIMESTAMP | | | Thời điểm check-in |

---

### 14. Bảng SavedPlace (Địa điểm đã lưu cá nhân)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã địa điểm đã lưu |
| 2 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 3 | name | VARCHAR(255) | | | Tên địa điểm lưu |
| 4 | category | VARCHAR(50) | | | Phân loại địa điểm |
| 5 | latitude | DOUBLE | | | Tọa độ vĩ độ GPS |
| 6 | longitude | DOUBLE | | | Tọa độ kinh độ GPS |
| 7 | address | VARCHAR(255) | x | | Địa chỉ địa điểm |
| 8 | imageUrl | TEXT | x | | Ảnh minh họa địa điểm |
| 9 | createdAt | TIMESTAMP | | | Thời điểm lưu |

---

### 15. Bảng Journey (Hành trình GPS du ký)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã hành trình |
| 2 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) tác giả |
| 3 | title | VARCHAR(255) | | | Tên hành trình du ký |
| 4 | description | TEXT | x | | Mô tả chi tiết hành trình |
| 5 | coverImageUrl | TEXT | x | | Ảnh bìa hành trình |
| 6 | isPublic | BOOLEAN | | | Trạng thái công khai |
| 7 | status | VARCHAR(30) | | | Trạng thái hành trình (draft, active, completed) |
| 8 | startDate | TIMESTAMP | x | | Ngày bắt đầu |
| 9 | endDate | TIMESTAMP | x | | Ngày kết thúc |
| 10 | totalDistance | FLOAT | | | Tổng quãng đường di chuyển (km) |
| 11 | createdAt | TIMESTAMP | | | Thời điểm tạo |

---

### 16. Bảng Route (Tuyến đường trong hành trình)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã tuyến đường |
| 2 | journeyId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Journey(id) |
| 3 | name | VARCHAR(255) | | | Tên tuyến đường |
| 4 | description | TEXT | x | | Mô tả tuyến đường |
| 5 | transportMode | VARCHAR(50) | | | Phương tiện (walking, driving, cycling...) |
| 6 | distanceKm | FLOAT | | | Độ dài tuyến đường (km) |
| 7 | durationMin | INT | | | Thời gian di chuyển dự kiến (phút) |
| 8 | color | VARCHAR(20) | | | Mã màu hiển thị polyline (#HEX) |
| 9 | createdAt | TIMESTAMP | | | Thời điểm tạo |

---

### 17. Bảng RoutePoint (Tọa độ GPS điểm dừng)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã điểm tọa độ GPS |
| 2 | routeId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến Route(id) |
| 3 | latitude | DOUBLE | | | Vĩ độ GPS |
| 4 | longitude | DOUBLE | | | Kinh độ GPS |
| 5 | altitude | DOUBLE | x | | Độ cao so với mực nước biển (m) |
| 6 | sequenceOrder | INT | | | Thứ tự sắp xếp chuỗi GPS |
| 7 | timestamp | TIMESTAMP | | | Thời điểm ghi nhận GPS |
| 8 | note | TEXT | x | | Ghi chú tại điểm dừng |
| 9 | photoUrl | TEXT | x | | Ảnh chụp tại điểm dừng GPS |

---

### 18. Bảng Event (Sự kiện / Lễ hội địa phương)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã sự kiện |
| 2 | title | VARCHAR(255) | | | Tên sự kiện / lễ hội |
| 3 | description | TEXT | x | | Mô tả nội dung sự kiện |
| 4 | coverImageUrl | TEXT | x | | Ảnh banner sự kiện |
| 5 | destinationId | VARCHAR(36) | x | FK | Khóa ngoại trỏ đến Destination(id) nếu có |
| 6 | latitude | DOUBLE | | | Vĩ độ vị trí diễn ra |
| 7 | longitude | DOUBLE | | | Kinh độ vị trí diễn ra |
| 8 | startDate | TIMESTAMP | | | Thời điểm bắt đầu |
| 9 | endDate | TIMESTAMP | x | | Thời điểm kết thúc |
| 10 | category | VARCHAR(50) | | | Loại sự kiện (festival, meetup, workshop...) |
| 11 | maxAttendees | INT | x | | Số lượng người tham gia tối đa |
| 12 | currentCount | INT | | | Số lượng người đã đăng ký |
| 13 | organizerId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) ban tổ chức |
| 14 | isPublic | BOOLEAN | | | Trạng thái công khai sự kiện |
| 15 | createdAt | TIMESTAMP | | | Thời điểm tạo |

---

### 19. Bảng ChatConversation (Cuộc trò chuyện AI)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã cuộc trò chuyện AI |
| 2 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 3 | title | VARCHAR(255) | x | | Tiêu đề phiên trò chuyện |
| 4 | createdAt | TIMESTAMP | | | Thời điểm tạo |
| 5 | updatedAt | TIMESTAMP | | | Thời điểm cập nhật |

---

### 20. Bảng ChatMessage (Tin nhắn AI Assistant)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã tin nhắn |
| 2 | conversationId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến ChatConversation(id) |
| 3 | role | VARCHAR(20) | | | Vai trò gửi tin (user, assistant, system) |
| 4 | createdAt | TIMESTAMP | | | Thời điểm gửi tin |

---

### 21. Bảng AIHistory (Lịch sử tạo sinh AI)

| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | id | VARCHAR(36) | | PK | Mã lịch sử tạo AI |
| 2 | userId | VARCHAR(36) | | FK | Khóa ngoại trỏ đến User(id) |
| 3 | promptText | TEXT | | | Câu lệnh Prompt gửi đến AI |
| 4 | responseJson | TEXT | | | Kết quả phản hồi dạng JSON |
| 5 | type | VARCHAR(50) | | | Loại tác vụ AI (itinerary, route_optimization...) |
| 6 | createdAt | TIMESTAMP | | | Thời điểm tạo |
