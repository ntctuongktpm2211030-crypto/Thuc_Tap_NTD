# TÀI LIỆU DANH SÁCH THỰC THỂ CƠ SỞ DỮ LIỆU CHUYÊN SÂU (DATA DICTIONARY)
## HỆ THỐNG THÔNG TIN DU LỊCH VIỆT NAM (SMARTTRAVEL / TERRAHOLIC)

Tài liệu này cung cấp từ điển dữ liệu (Data Dictionary) chi tiết cho toàn bộ **51 thực thể** của hệ thống, được rút trích trực tiếp từ tệp cấu hình cơ sở dữ liệu `schema.prisma`.

---

## 1. MÔ-ĐUN: NGƯỜI DÙNG & CÁ NHÂN HÓA (ACCOUNTS & PERSONALIZATION)

### 1.1. Thực thể: `User` (Người dùng)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã người dùng | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính tự sinh dạng UUID |
| `email` | email đăng nhập | String | Không | Có | Index | | Địa chỉ email đăng ký độc nhất |
| `passwordHash`| mật khẩu hash | String | Không | Không | Không | | Mật khẩu đã được băm mã hóa |
| `role` | vai trò người dùng | UserRole (Enum) | Không | Không | Không | `USER` | Quyền hạn tài khoản: USER |
| `isVerified` | đã xác minh | Boolean | Không | Không | Không | `false` | Đánh dấu xác minh hòm thư điện tử |
| `verificationToken`| mã xác minh | String | Có | Không | Không | | Mã token gửi qua email xác thực |
| `resetPasswordToken`| mã reset mật khẩu | String | Có | Không | Không | | Mã token dùng khi quên mật khẩu |
| `createdAt` | ngày khởi tạo | DateTime | Không | Không | Không | `now()` | Thời điểm tạo tài khoản |
| `updatedAt` | ngày cập nhật | DateTime | Không | Không | Không | | Thời điểm cập nhật cuối cùng |

---

### 1.2. Thực thể: `Profile` (Hồ sơ)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (FK trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã hồ sơ | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính của hồ sơ |
| `userId` | mã người dùng | String (UUID) | Không | Có | FK, Unique | | Khóa ngoại trỏ đến bảng `User` |
| `fullName` | họ tên người dùng | String | Không | Không | Không | | Tên đầy đủ hiển thị công khai |
| `avatarUrl` | ảnh đại diện | String | Có | Không | Không | | Đường dẫn URL ảnh đại diện |
| `coverUrl` | ảnh bìa | String | Có | Không | Không | | Đường dẫn URL ảnh nền cá nhân |
| `bio` | tiểu sử | String | Có | Không | Không | | Mô tả ngắn giới thiệu bản thân |
| `phoneNumber` | số điện thoại | String | Có | Không | Không | | Số điện thoại liên lạc |
| `homeLocation`| quê quán / nơi ở | String | Có | Không | Không | | Nơi sinh sống hiện tại |

---

### 1.3. Thực thể: `TravelPreferences` (Sở thích du lịch)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (FK trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã sở thích | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Có | FK, Unique | | Khóa ngoại liên kết tới `User` |
| `preferredPace`| nhịp độ hành trình | String | Không | Không | Không | | Phong cách di chuyển ("slow", "fast")|
| `dailyBudget` | ngân sách ngày | Float | Không | Không | Không | | Hạn mức chi tiêu hàng ngày |
| `activities` | danh sách hoạt động | String[] | Không | Không | Không | | Mảng các hoạt động yêu thích |
| `destinationTypes`| loại điểm đến thích | String[] | Không | Không | Không | | Mảng các loại địa hình ưa thích |
| `foodPreferences`| gu ẩm thực | String[] | Không | Không | Không | | Mảng thể loại ẩm thực chọn lọc |

---

### 1.4. Thực thể: `AIMemory` (Bộ nhớ AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (FK trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã bộ nhớ AI | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính bộ nhớ |
| `userId` | mã người dùng | String (UUID) | Không | Có | FK, Unique | | Khóa ngoại liên kết tới `User` |
| `travelPreferences`| sở thích đi lại AI | String[] | Không | Không | Không | | Sở thích trích xuất từ chat |
| `favoriteFoods`| món ăn ưa thích AI | String[] | Không | Không | Không | | Món ngon trích xuất từ chat |
| `budget` | ngân sách AI nhận diện | String | Có | Không | Không | | Tầm ngân sách nhận diện thói quen |
| `transportation`| phương tiện AI nhận diện | String[] | Không | Không | Không | | Phương tiện ưa chuộng trích từ chat |
| `favoriteLocations`| vùng miền AI nhận diện | String[] | Không | Không | Không | | Điểm đến hay tương tác từ chat |
| `createdAt` | ngày tạo bộ nhớ | DateTime | Không | Không | Không | `now()` | Ngày ghi nhận bộ nhớ |
| `updatedAt` | ngày cập nhật | DateTime | Không | Không | Không | | Ngày cập nhật gần nhất |

---

### 1.5. Thực thể: `Follower` (Người theo dõi)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `followerId` (trỏ tới `User.id`), `followingId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã quan hệ | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `followerId` | mã người theo dõi | String (UUID) | Không | Không | FK, Index | | Unique với `followingId` |
| `followingId` | mã người được theo dõi| String (UUID) | Không | Không | FK, Index | | Unique với `followerId` |
| `createdAt` | ngày theo dõi | DateTime | Không | Không | Không | `now()` | |

---

### 1.6. Thực thể: `Notification` (Thông báo)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `recipientId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã thông báo | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `recipientId` | mã người nhận | String (UUID) | Không | Không | FK, Index | | Người nhận thông báo |
| `type` | loại thông báo | String | Không | Không | Không | | Thể loại: "like", "comment"... |
| `content` | nội dung thông báo | String | Không | Không | Không | | Đoạn text hiển thị thông báo |
| `isRead` | trạng thái đã đọc | Boolean | Không | Không | Không | `false` | Đánh dấu thông báo đã được xem |
| `createdAt` | ngày gửi thông báo | DateTime | Không | Không | Không | `now()` | Ngày tạo thông báo |

---

### 1.7. Thực thể: `Location` (Vị trí trực tiếp)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã vị trí | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Có | FK, Unique | | Tài khoản được định vị |
| `latitude` | vĩ độ hiện tại | Float | Không | Không | Không | | Tọa độ vĩ độ định vị động |
| `longitude` | kinh độ hiện tại | Float | Không | Không | Không | | Tọa độ kinh độ định vị động |
| `updatedAt` | ngày định vị | DateTime | Không | Không | Không | | Cập nhật tọa độ cuối cùng |

---

## 2. MÔ-ĐUN: HÀNH TRÌNH & CHUYẾN ĐI (TRIPS & JOURNEYS)

### 2.1. Thực thể: `Trip` (Chuyến đi)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `ownerId` (trỏ tới `User.id`), `cloneSourceId` (trỏ tới `Trip.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã chuyến đi | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `ownerId` | mã người sở hữu | String (UUID) | Không | Không | FK, Index | | Người lập kế hoạch chuyến đi |
| `title` | tiêu đề chuyến đi | String | Không | Không | Không | | Ví dụ: "Đi phượt Mù Cang Chải" |
| `description` | mô tả chuyến đi | String | Có | Không | Không | | Mô tả hành trình chi tiết |
| `destinationName`| tên điểm đến chính | String | Không | Không | Không | | Tỉnh/thành phố du lịch chính |
| `startDate` | ngày bắt đầu đi | DateTime | Có | Không | Không | | Ngày bắt đầu (Cho phép NULL với lịch trình nháp) |
| `endDate` | ngày kết thúc đi | DateTime | Có | Không | Không | | Ngày kết thúc (Cho phép NULL với lịch trình nháp) |
| `totalBudget` | tổng ngân sách | Float | Không | Không | Không | `0.0` | Ngân sách dự trù cho cả hành trình |
| `travelStyle` | phong cách du lịch | String | Không | Không | Không | `"solo"` | Kiểu du lịch ("solo", "family") |
| `isPublic` | công khai hành trình | Boolean | Không | Không | Không | `false` | Cho phép người khác sao chép |
| `status` | trạng thái chuyến đi | TripStatus | Không | Không | Index | `CONFIRMED` | Trạng thái: DRAFT_AI, DRAFT_USER, CONFIRMED |
| `cloneSourceId` | mã chuyến đi gốc | String (UUID) | Có | Không | FK, Index | | Lưu vết chuyến đi nguồn nhân bản |
| `createdAt` | ngày khởi tạo | DateTime | Không | Không | Không | `now()` | Ngày tạo chuyến đi |
| `updatedAt` | ngày cập nhật | DateTime | Không | Không | Không | | Ngày cập nhật |

---

### 2.2. Thực thể: `TripDay` (Ngày chuyến đi)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `tripId` (trỏ tới `Trip.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã ngày | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `tripId` | mã chuyến đi | String (UUID) | Không | Không | FK | | Unique với `dayIndex` |
| `dayIndex` | thứ tự ngày | Int | Không | Không | Không | | Unique với `tripId` |
| `date` | ngày lịch cụ thể | DateTime | Có | Không | Không | | Ngày chi tiết theo lịch dương (Cho phép NULL nếu là lịch trình nháp) |

---

### 2.3. Thực thể: `TripActivity` (Hoạt động chuyến đi)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `tripDayId` (trỏ tới `TripDay.id`), `destinationId` (trỏ tới `Destination.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã hoạt động | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `tripDayId` | mã ngày chuyến đi | String (UUID) | Không | Không | FK, Index | | Thuộc ngày thứ mấy của chuyến đi |
| `destinationId` | mã điểm đến | String (UUID) | Có | Không | FK, Index | | Địa danh tham quan/ăn uống từ GIS (Cho phép NULL nếu hoạt động tự do) |
| `title` | tên hoạt động | String | Có | Không | Không | | Tên hoạt động tự do/AI sinh |
| `location` | vị trí hoạt động | String | Có | Không | Không | | Mô tả vị trí tự do/AI sinh |
| `description` | chi tiết hoạt động | String | Có | Không | Không | | Mô tả chi tiết hoạt động |
| `startTime` | giờ bắt đầu | String | Có | Không | Không | | Khung giờ xuất phát (HH:MM format, optional) |
| `endTime` | giờ kết thúc | String | Có | Không | Không | | Khung giờ kết thúc (HH:MM format, optional) |
| `estimatedCost` | chi phí ước tính | Float | Không | Không | Không | `0.0` | Chi phí dự chi tại điểm dừng chân |
| `sequenceOrder` | thứ tự hoạt động | Int | Không | Không | Không | | Sắp xếp trình tự đi trong ngày |
| `notes` | ghi chú hoạt động | String | Có | Không | Không | | Ghi chú lộ trình chi tiết |

### 2.4. Thực thể: `Journey` (Nhật ký hành trình)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã hành trình | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Chủ nhân cuốn du ký hành trình |
| `title` | tiêu đề du ký | String | Không | Không | Không | | Ví dụ: "Độc hành Tây Bắc mùa lúa chín"|
| `description` | mô tả du ký | String | Có | Không | Không | | Tổng quan du ký |
| `coverImageUrl` | ảnh bìa hành trình | String | Có | Không | Không | | URL ảnh đại diện cho hành trình |
| `isPublic` | hiển thị công khai | Boolean | Không | Không | Không | `true` | Cho phép cộng đồng xem |
| `status` | trạng thái hành trình | String | Không | Không | Index | `draft` | Trạng thái: draft, active, completed |
| `startDate` | ngày khởi hành | DateTime | Có | Không | Không | | Ngày bắt đầu di chuyển |
| `endDate` | ngày kết thúc | DateTime | Có | Không | Không | | Ngày kết thúc di chuyển |
| `totalDistance` | tổng quãng đường | Float | Không | Không | Không | `0` | Quãng đường định vị thực tế (Km) |
| `createdAt` | ngày tạo | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày cập nhật |

---

### 2.5. Thực thể: `Route` (Tuyến đường)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `journeyId` (trỏ tới `Journey.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | ma_tuyen_duong | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `journeyId` | mã hành trình | String (UUID) | Không | Không | FK, Index | | Thuộc về hành trình du ký nào |
| `name` | tên chặng đường | String | Không | Không | Không | | Ví dụ: "Chặng leo đèo Khau Phạ" |
| `description` | mô tả chặng đường | String | Có | Không | Không | | Mô tả chặng |
| `transportMode` | phương tiện đi lại | String | Không | Không | Không | `walking` | Phương tiện: walking, driving... |
| `distanceKm` | chiều dài chặng | Float | Không | Không | Không | `0` | Chiều dài chặng di chuyển (Km) |
| `durationMin` | thời lượng di chuyển | Int | Không | Không | Không | `0` | Thời gian ước lượng (phút) |
| `color` | màu vẽ tuyến đường | String | Không | Không | Không | `#D4A843` | Mã hex màu vẽ polyline trên map |
| `createdAt` | ngày tạo chặng | DateTime | Không | Không | Không | `now()` | Ngày tạo |

---

### 2.6. Thực thể: `RoutePoint` (Điểm tuyến đường)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `routeId` (trỏ tới `Route.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã tọa độ GPS | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `routeId` | mã chặng đường | String (UUID) | Không | Không | FK, Index | | Khóa ngoại liên kết chặng `Route` |
| `latitude` | vĩ độ điểm | Float | Không | Không | Index kết hợp | | Tọa độ vĩ độ GPS |
| `longitude` | kinh độ điểm | Float | Không | Không | Index kết hợp | | Tọa độ kinh độ GPS |
| `altitude` | độ cao điểm | Float | Có | Không | Không | | Độ cao so với mực nước biển (mét) |
| `sequenceOrder` | thứ tự điểm | Int | Không | Không | Không | | Số thứ tự điểm dừng vẽ đường đi |
| `timestamp` | thời gian ghi nhận | DateTime | Không | Không | Không | `now()` | Thời điểm thiết bị cập nhật GPS |
| `note` | ghi chú điểm | String | Có | Không | Không | | Ghi chú tại điểm dừng chân |
| `photoUrl` | ảnh chụp tại điểm | String | Có | Không | Không | | Ảnh lưu niệm tại điểm định vị này |

---

### 2.7. Thực thể: `LocationHistory` (Lịch sử vị trí)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã lịch sử tọa độ | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Tài khoản được định vị |
| `latitude` | vĩ độ lịch sử | Float | Không | Không | Index kết hợp | | Tọa độ vĩ độ GPS |
| `longitude` | kinh độ lịch sử | Float | Không | Không | Index kết hợp | | Tọa độ kinh độ GPS |
| `accuracy` | độ chính xác | Float | Có | Không | Không | | Bán kính chính xác GPS (mét) |
| `speed` | vận tốc | Float | Có | Không | Không | | Vận tốc di chuyển thực tế (m/s) |
| `heading` | hướng di chuyển | Float | Có | Không | Không | | Hướng di chuyển (độ) |
| `createdAt` | thời điểm lưu | DateTime | Không | Không | Index | `now()` | Ngày ghi nhận |

---

## 3. MÔ-ĐUN: ĐỊA ĐIỂM & GIS (PLACES, GEOGRAPHY & WARNINGS)

### 3.1. Thực thể: `Destination` (Điểm đến)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã điểm đến | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `name` | tên điểm đến | String | Không | Không | Không | | Tên địa danh/khách sạn/nhà hàng |
| `description` | mô tả chi tiết | String | Có | Không | Không | | Giới thiệu về di tích hoặc món ăn |
| `latitude` | vĩ độ | Float | Không | Không | Index kết hợp | | Tọa độ vĩ độ |
| `longitude` | kinh độ | Float | Không | Không | Index kết hợp | | Tọa độ kinh độ |
| `category` | phân loại địa điểm | String | Không | Không | Không | | Loại: "restaurant", "hotel", "attraction"|
| `averageRating` | đánh giá trung bình | Float | Không | Không | Không | `0.0` | Điểm đánh giá (0 - 5 sao) |
| `address` | địa chỉ cụ thể | String | Có | Không | Không | | Địa chỉ đường phố |
| `openingHours` | giờ đóng mở cửa | String | Có | Không | Không | | Khung giờ mở cửa đón khách |

---

### 3.2. Thực thể: `CheckIn` (Điểm check-in)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`), `destinationId` (trỏ tới `Destination.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã check-in | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người thực hiện check-in |
| `destinationId` | mã điểm đến | String (UUID) | Không | Không | FK, Index | | Địa danh được check-in |
| `note` | cảm nghĩ check-in | String | Có | Không | Không | | Nhận xét hoặc ghi chú của du khách |
| `createdAt` | ngày check-in | DateTime | Không | Không | Không | `now()` | Thời điểm check-in |

---

### 3.3. Thực thể: `SavedPlace` (Địa điểm đã lưu)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã địa điểm lưu | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người lưu địa danh |
| `name` | tên địa danh | String | Không | Không | Không | | Tên địa danh |
| `category` | phân loại | String | Không | Không | Không | | Loại địa điểm |
| `latitude` | vĩ độ | Float | Không | Không | Không | | Tọa độ vĩ độ |
| `longitude` | kinh độ | Float | Không | Không | Không | | Tọa độ kinh độ |
| `address` | địa chỉ | String | Có | Không | Không | | Địa chỉ |
| `imageUrl` | ảnh đại diện điểm | String | Có | Không | Không | | Ảnh chụp |
| `createdAt` | ngày lưu | DateTime | Không | Không | Không | `now()` | Ngày lưu |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

### 3.4. Thực thể: `SafetyWarning` (Cảnh báo an toàn)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã cảnh báo | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `type` | loại cảnh báo | String | Không | Không | Không | | Loại thiên tai: "FLOOD", "STORM"... |
| `description` | chi tiết cảnh báo | String | Không | Không | Không | | Chi tiết cứu hộ giao thông/an toàn |
| `latitude` | vĩ độ tâm vùng | Float | Không | Không | Index kết hợp | | Tọa độ vĩ độ vùng nguy hiểm |
| `longitude` | kinh độ tâm vùng | Float | Không | Không | Index kết hợp | | Tọa độ kinh độ vùng nguy hiểm |
| `radiusKm` | bán kính nguy hiểm | Float | Không | Không | Không | `1.0` | Bán kính ảnh hưởng (Km) |
| `createdAt` | ngày ban hành | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `expiresAt` | ngày hết hiệu lực | DateTime | Có | Không | Không | | Thời gian hết hạn cảnh báo |

---

## 4. MÔ-ĐUN: MẠNG XÃ HỘI & TƯƠNG TÁC (SOCIAL NETWORK)

### 4.1. Thực thể: `Post` (Bài đăng)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `authorId` (trỏ tới `User.id`), `tripId` (trỏ tới `Trip.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã bài viết | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `authorId` | mã tác giả | String (UUID) | Không | Không | FK, Index | | Người đăng bài |
| `content` | nội dung bài viết | String | Không | Không | Không | | Văn bản chia sẻ kinh nghiệm |
| `mediaUrls` | mảng ảnh/video | String[] | Không | Không | Không | | Danh sách URL đa phương tiện đính kèm |
| `tripId` | mã chuyến đi đi kèm | String (UUID) | Có | Không | FK, Index | | Chuyến đi được liên kết để chia sẻ |
| `locationId` | mã địa điểm đính kèm | String | Có | Không | Không | | Gắn nhãn địa điểm check-in |
| `createdAt` | ngày đăng bài | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `deletedAt` | ngày xóa bài | DateTime | Có | Không | Không | | Ngày xóa tạm (Soft-delete) |

---

### 4.2. Thực thể: `Comment` (Bình luận)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `postId` (trỏ tới `Post.id`), `authorId` (trỏ tới `User.id`), `parentId` (trỏ tới `Comment.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã bình luận | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `postId` | mã bài viết | String (UUID) | Không | Không | FK, Index | | Bài viết bị bình luận |
| `authorId` | mã tác giả bình luận | String (UUID) | Không | Không | FK, Index | | Người bình luận |
| `content` | nội dung bình luận | String | Không | Không | Không | | Văn bản bình luận |
| `parentId` | mã bình luận cha | String (UUID) | Có | Không | FK, Index | | Khóa ngoại tự tham chiếu bình luận cha |
| `createdAt` | ngày bình luận | DateTime | Không | Không | Không | `now()` | Ngày tạo |

---

### 4.3. Thực thể: `Like` (Lượt thích)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `postId` (trỏ tới `Post.id`), `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã lượt thích | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `postId` | mã bài viết | String (UUID) | Không | Không | FK | | Unique với `userId` |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK | | Unique với `postId` |
| `createdAt` | ngày bấm thích | DateTime | Không | Không | Không | `now()` | |

---

### 4.4. Thực thể: `Bookmark` (Đánh dấu)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `postId` (trỏ tới `Post.id`), `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã đánh dấu | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `postId` | mã bài viết | String (UUID) | Không | Không | FK | | Unique với `userId` |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK | | Unique với `postId` |
| `createdAt` | ngày đánh dấu | DateTime | Không | Không | Không | `now()` | |

---

## 5. MÔ-ĐUN: SỰ KIỆN & KẾT NỐI (EVENTS & PEER CONNECTIONS)

### 5.1. Thực thể: `Event` (Sự kiện)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `destinationId` (trỏ tới `Destination.id`), `organizerId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã sự kiện | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `title` | tên sự kiện | String | Không | Không | Không | | Ví dụ: "Lễ hội đua ghe Ngo Sóc Trăng" |
| `description` | mô tả sự kiện | String | Có | Không | Không | | Chi tiết chương trình |
| `coverImageUrl` | ảnh banner sự kiện | String | Có | Không | Không | | Banner sự kiện |
| `destinationId` | mã địa danh liên kết | String (UUID) | Có | Không | FK | | Điểm đến tổ chức lễ hội |
| `latitude` | vĩ độ điểm sự kiện | Float | Không | Không | Index kết hợp | | Vĩ độ diễn ra sự kiện |
| `longitude` | kinh độ điểm sự kiện | Float | Không | Không | Index kết hợp | | Kinh độ diễn ra sự kiện |
| `startDate` | ngày bắt đầu sự kiện | DateTime | Không | Không | Index | | Ngày bắt đầu sự kiện |
| `endDate` | ngày kết thúc sự kiện | DateTime | Có | Không | Không | | Ngày kết thúc |
| `category` | thể loại sự kiện | String | Không | Không | Index | | Thể loại: "festival", "meetup"... |
| `maxAttendees` | số người tối đa | Int | Có | Không | Không | | Giới hạn tối đa người đi |
| `currentCount` | sĩ số hiện tại | Int | Không | Không | Không | `0` | Số du khách đã bấm tham gia |
| `organizerId` | mã người tổ chức | String (UUID) | Không | Không | FK, Index | | Người đứng ra chủ trì sự kiện |
| `isPublic` | sự kiện công khai | Boolean | Không | Không | Không | `true` | Trạng thái hiển thị |
| `createdAt` | ngày đăng sự kiện | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày cập nhật | DateTime | Không | Không | Không | | Ngày sửa |

---

### 5.2. Thực thể: `EventAttendee` (Người tham gia sự kiện)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `eventId` (trỏ tới `Event.id`), `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã tham gia | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `eventId` | mã sự kiện | String (UUID) | Không | Không | FK | | Unique với `userId` |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK | | Unique với `eventId` |
| `status` | trạng thái tham dự | String | Không | Không | Không | `going` | Trạng thái: "going", "interested"...|
| `createdAt` | ngày đăng ký | DateTime | Không | Không | Không | `now()` | |

---

### 5.3. Thực thể: `TravelerMatch` (Ghép đôi du khách)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`), `matchedUserId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Ràng buộc kết hợp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã ghép đôi | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng 1 | String (UUID) | Không | Không | FK, Index | | Unique với `matchedUserId` |
| `matchedUserId` | mã người dùng 2 | String (UUID) | Không | Không | FK, Index | | Unique với `userId` |
| `compatScore` | điểm tương đồng AI | Float | Không | Không | Index | | Thang điểm từ 0.0 đến 1.0 |
| `matchReasons` | lý do ghép đôi | String[] | Không | Không | Không | | Mảng lý do: "chung sở thích"... |
| `status` | trạng thái ghép đôi | String | Không | Không | Không | `suggested` | Trạng thái đề xuất/chấp nhận |
| `createdAt` | ngày tạo | DateTime | Không | Không | Không | `now()` | |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | |

---

### 5.4. Thực thể: `Conversation` (Cuộc hội thoại người dùng)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã cuộc hội thoại | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `createdAt` | ngày tạo phòng chat | DateTime | Không | Không | Không | `now()` | Ngày khởi tạo |
| `updatedAt` | ngày nhắn tin cuối | DateTime | Không | Không | Không | | Ngày cập nhật tin nhắn cuối |

---

### 5.5. Thực thể: `Message` (Tin nhắn người dùng)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `conversationId` (trỏ tới `Conversation.id`), `senderId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã tin nhắn | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `conversationId` | mã cuộc hội thoại | String (UUID) | Không | Không | FK, Index | | Liên kết cuộc chat |
| `senderId` | mã người gửi | String (UUID) | Không | Không | FK | | Người gửi tin nhắn |
| `content` | nội dung tin nhắn | String | Không | Không | Không | | Văn bản tin nhắn trò chuyện |
| `createdAt` | ngày nhắn tin | DateTime | Không | Không | Không | `now()` | Ngày gửi |

---

## 6. MÔ-ĐUN: TRỢ LÝ CHATBOT AI (AI CHATBOT)

### 6.1. Thực thể: `ChatConversation` (Cuộc hội thoại AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã cuộc hội thoại AI | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Chủ cuộc trò chuyện AI |
| `title` | tiêu đề cuộc hội thoại | String | Có | Không | Không | `New Conversation`| Tiêu đề tự động sinh |
| `createdAt` | ngày mở phòng chat | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày có phản hồi cuối | DateTime | Không | Không | Không | | Ngày cập nhật |

---

### 6.2. Thực thể: `ChatMessage` (Tin nhắn AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `conversationId` (trỏ tới `ChatConversation.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã tin nhắn AI | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `conversationId` | mã cuộc hội thoại AI | String (UUID) | Không | Không | FK, Index | | Thuộc cuộc hội thoại nào |
| `role` | vai trò phát ngôn | String | Không | Không | Không | | Vai trò: "user", "assistant" |
| `createdAt` | ngày gửi | DateTime | Không | Không | Không | `now()` | Ngày gửi |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

### 6.3. Thực thể: `ChatMessageVersion` (Phiên bản tin nhắn AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `messageId` (trỏ tới `ChatMessage.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã phiên bản tin nhắn | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `messageId` | mã tin nhắn gốc | String (UUID) | Không | Không | FK, Index | | Liên kết tới tin nhắn AI cha |
| `content` | nội dung câu trả lời | String | Không | Không | Không | | Văn bản nội dung câu trả lời |
| `version` | số thứ tự phiên bản | Int | Không | Không | Không | | Chỉ số phiên bản (1, 2, 3...) |
| `isActive` | đang hoạt động | Boolean | Không | Không | Không | `true` | Đang được hiển thị trên UI |
| `createdAt` | ngày tạo phiên bản | DateTime | Không | Không | Không | `now()` | Ngày tạo |

---

### 6.4. Thực thể: `ToolCall` (Gọi công cụ AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `messageId` (trỏ tới `ChatMessage.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã cuộc gọi công cụ | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `messageId` | mã tin nhắn AI | String (UUID) | Không | Không | FK, Index | | Tin nhắn AI kích hoạt gọi công cụ |
| `toolName` | tên công cụ AI | String | Không | Không | Không | | Tên công cụ (Maps, Weather...) |
| `input` | dữ liệu đầu vào | String | Không | Không | Không | | Dữ liệu đầu vào gửi đi dạng text |
| `output` | dữ liệu đầu ra | String | Có | Không | Không | | Kết quả phản hồi nhận về từ công cụ |
| `status` | trạng thái cuộc gọi | String | Không | Không | Không | | Trạng thái: "success", "failed" |
| `createdAt` | ngày gọi | DateTime | Không | Không | Không | `now()` | Ngày gọi |

---

### 6.5. Thực thể: `AIFeedback` (Đánh giá tin nhắn AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`), `messageId` (trỏ tới `ChatMessage.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã đánh giá | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người dùng gửi feedback |
| `messageId` | mã tin nhắn AI | String (UUID) | Không | Có | FK, Index | | Tin nhắn AI bị đánh giá |
| `rating` | điểm đánh giá | Int | Không | Không | Không | | Điểm: Upvote (1) hoặc Downvote (-1) |
| `comment` | nhận xét góp ý | String | Có | Không | Không | | Chi tiết góp ý |
| `createdAt` | ngày đánh giá | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

## 7. MÔ-ĐUN: ĐỆM CACHING & NHẬT KÝ (CACHES & HISTORY LOGS)

### 7.1. Thực thể: `SystemCache` (Đệm hệ thống)
* **Khóa chính (PK)**: Khóa chính Composite `[key, type]`
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `key` | khóa cache tìm kiếm | String | Không | Không | PK | | Khóa tìm kiếm đệm (ví dụ: query, coords) |
| `type` | phân loại cache | String | Không | Không | PK, Index | | Loại đối tượng: "place", "food", "blog", "hotel" |
| `value` | dữ liệu đệm JSON | String | Không | Không | Không | | Dữ liệu JSON được serialize thành chuỗi |
| `expiresAt` | ngày hết hiệu lực | DateTime | Không | Không | Không | | Thời điểm hết hạn của cache |
| `createdAt` | ngày tạo cache | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa cache | DateTime | Không | Không | Không | | Ngày sửa |

---

### 7.2. Thực thể: `FavoriteFood` (Món ăn yêu thích)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã món ăn yêu thích | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người thích món ăn này |
| `name` | tên món ăn | String | Không | Không | Không | | Ví dụ: "Bún chả Hà Nội" |
| `region` | vùng miền ẩm thực | String | Có | Không | Không | | Ví dụ: "Miền Bắc" |
| `description` | ghi nhận cảm nghĩ | String | Có | Không | Không | | Ghi chú lý do yêu thích |
| `rating` | điểm đánh giá | Float | Có | Không | Không | | Điểm số đánh giá cá nhân (0 - 5 sao) |
| `createdAt` | ngày lưu | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

### 7.3. Thực thể: `AIHistory` (Lịch sử gọi AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã lịch sử gọi AI | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người yêu cầu sinh lịch trình |
| `promptText` | câu lệnh prompt | String | Không | Không | Không | | Prompt chi tiết gửi đi |
| `responseJson` | kết quả sinh JSON | String | Không | Không | Không | | Kết quả JSON trả về từ AI |
| `type` | loại tác vụ AI | String | Không | Không | Không | | Loại: "itinerary", "optimization"... |
| `createdAt` | ngày ghi nhật ký | DateTime | Không | Không | Không | `now()` | Ngày gọi AI |

---

### 7.4. Thực thể: `TravelHistory` (Lịch sử chuyến đi)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `userId` (trỏ tới `User.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã lịch sử chuyến đi | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người dùng đã đi chuyến đi này |
| `location` | điểm du lịch đã đi | String | Không | Không | Không | | Tên địa điểm đã từng đi |
| `time` | thời điểm thực đi | DateTime | Không | Không | Không | | Thời gian đi chuyến đi |
| `rating` | đánh giá chuyến đi | String | Có | Không | Không | | Đánh giá cảm quan |
| `cost` | chi phí thực chi | Float | Không | Không | Không | `0.0` | Chi phí thực tế của chuyến đi đó |
| `createdAt` | ngày lưu | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

## 8. MÔ-ĐUN: RAG & CƠ SỞ TRI THỨC (RAG KNOWLEDGE BASE)

### 8.1. Thực thể: `KnowledgeContent` (Nội dung tri thức)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã tài liệu tri thức | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `title` | tiêu đề tri thức | String | Không | Không | Không | | Tiêu đề tài liệu tri thức |
| `body` | văn bản tri thức gốc | String | Không | Không | Không | | Nội dung văn bản tri thức thô |
| `category` | thể loại tri thức | String | Không | Không | Index | | Loại: "culture", "festival", "food"... |
| `createdAt` | ngày lưu tri thức | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa đổi | DateTime | Không | Không | Không | | Ngày sửa |

---

### 8.2. Thực thể: `KnowledgeQuestion` (Câu hỏi tri thức)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `contentId` (trỏ tới `KnowledgeContent.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã câu hỏi mẫu | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `contentId` | mã tài liệu tri thức | String (UUID) | Không | Không | FK, Index | | Thuộc tri thức gốc nào |
| `questionText` | nội dung câu hỏi mẫu | String | Không | Không | Không | | Nội dung câu hỏi mẫu |
| `embeddingOpenAI`| mảng vector OpenAI | Unsupported | Có | Không | Không | | Vector đặc trưng OpenAI (1536 dims) |
| `embeddingLocal` | mảng vector local | Unsupported | Có | Không | Không | | Vector đặc trưng Local (128 dims) |
| `createdAt` | ngày tạo | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

### 8.3. Thực thể: `KnowledgeAnswer` (Đáp án tri thức)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `contentId` (trỏ tới `KnowledgeContent.id`)
* **Chi tiết các cột thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã đáp án chuẩn | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `contentId` | mã tài liệu tri thức | String (UUID) | Không | Không | FK, Index | | Thuộc tri thức gốc nào |
| `answerText` | câu trả lời chuẩn | String | Không | Không | Không | | Nội dung câu trả lời |
| `createdAt` | ngày tạo | DateTime | Không | Không | Không | `now()` | Ngày tạo |
| `updatedAt` | ngày sửa | DateTime | Không | Không | Không | | Ngày sửa |

---

## 9. MÔ-ĐUN: GIÁM SÁT AI & BỘ NHỚ ĐỆM (AI GOVERNANCE & CACHING)

### 9.1. Thực thể: `ModelRegistry` (Danh mục mô hình LLM)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã mô hình | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `modelName` | tên mô hình | String | Không | Có | Unique | | Tên định danh mô hình LLM |
| `provider` | nhà cung cấp | String | Không | Không | Không | | OpenAI, Google, Anthropic, v.v. |
| `isActive` | đang hoạt động | Boolean | Không | Không | Không | `true` | Đánh dấu mô hình mặc định |

### 9.2. Thực thể: `KnowledgeVersion` (Phiên bản tri thức)
* **Khóa chính (PK)**: `versionNumber` (Int - Tự tăng)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `versionNumber`| số hiệu phiên bản | Int | Không | Có | PK | | Khóa chính tự tăng |
| `description` | mô tả cập nhật | String | Có | Không | Không | | Nhật ký thay đổi tri thức |
| `createdAt` | ngày cập nhật | DateTime | Không | Không | Không | `now()` | Ngày xuất bản phiên bản |

### 9.3. Thực thể: `PromptVersion` (Phiên bản Prompt)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã prompt | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `systemPrompt` | nội dung prompt | String | Không | Không | Không | | Nội dung văn bản Prompt hệ thống |
| `version` | số phiên bản | Int | Không | Không | Không | | Số hiệu phiên bản prompt |
| `isActive` | đang hoạt động | Boolean | Không | Không | Không | `true` | Đánh dấu prompt đang áp dụng |

### 9.4. Thực thể: `AIChatLog` (Nhật ký gọi AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `modelId` (trỏ tới `ModelRegistry.id`), `userId` (trỏ tới `User.id`)
* **Chi tiết thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã log chat | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `userId` | mã người dùng | String (UUID) | Không | Không | FK, Index | | Người gọi dịch vụ |
| `modelId` | mã mô hình LLM | String (UUID) | Không | Không | FK, Index | | Mô tả LLM chạy chính |
| `promptTokens` | số token vào | Int | Không | Không | Không | `0` | Chi phí token prompt |
| `completionTokens`| số token ra | Int | Không | Không | Không | `0` | Chi phí token phản hồi |
| `latencyMs` | độ trễ phản hồi | Int | Không | Không | Không | `0` | Thời gian thực thi (milliseconds) |

### 9.5. Thực thể: `UserFeedback` (Đánh giá dịch vụ AI)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `chatLogId` (trỏ tới `AIChatLog.id`)

### 9.6. Thực thể: `EvaluationHistory` (Lịch sử đánh giá tự động)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `chatLogId` (trỏ tới `AIChatLog.id`)

### 9.7. Thực thể: `GuardrailEvent` (Nhật ký vi phạm an toàn)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `chatLogId` (trỏ tới `AIChatLog.id`)

### 9.8. Thực thể: `KnowledgeFreshness` (Độ tươi mới tri thức)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: `versionId` (trỏ tới `KnowledgeVersion.versionNumber`)

### 9.9. Thực thể: `AuditTrail` (Vết kiểm toán hệ thống)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.

### 9.10. Thực thể: `CacheMetadata` (Siêu dữ liệu Caching ngữ nghĩa)
* **Khóa chính (PK)**: `id` (String - UUID)
* **Khóa ngoại (FK)**: Không có.
* **Chi tiết thuộc tính**:

| Tên Thuộc tính | Tên Tiếng Việt | Kiểu dữ liệu | Nullable | Unique | Chỉ mục (Index) | Giá trị mặc định | Mô tả chi tiết |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | mã cache | String (UUID) | Không | Có | PK | `uuid()` | Khóa chính |
| `cacheKey` | khóa băm cache | String | Không | Có | Unique | | Hash đặc trưng embedding của câu hỏi |
| `queryText` | câu hỏi gốc | String | Không | Không | Không | | Nội dung câu hỏi dạng text thô |
| `responseJson` | đệm kết quả JSON | String | Không | Không | Không | | Phản hồi dạng JSON |
| `hitCount` | số lượt hit | Int | Không | Không | Không | `1` | Thống kê số lần trúng cache đệm |
| `expiresAt` | ngày hết hạn | DateTime | Không | Không | Không | | Thời gian sống của cache |

---
*Kết thúc từ điển danh sách thực thể dữ liệu.*
