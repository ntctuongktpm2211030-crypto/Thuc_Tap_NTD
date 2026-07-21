# Danh sách các Bảng Cơ sở Dữ liệu Hệ thống (Database Schema Reference)

Tài liệu này đặc tả chi tiết cấu trúc dữ liệu của **51 bảng (Models)** trong Cơ sở dữ liệu hệ thống, được xuất trực tiếp từ lược đồ `schema.prisma` và CSDL PostgreSQL vật lý. Tài liệu này đóng vai trò là danh mục từ điển dữ liệu chính thức phục vụ cho báo cáo khóa luận tốt nghiệp.

## Mục lục
*   [I. User Management (Quản lý Người dùng)](#i-user-management-quan-ly-nguoi-dung)
    *   [1. User](#1-user)
    *   [2. Profile](#2-profile)
    *   [3. TravelPreferences](#3-travelpreferences)
    *   [4. Follower](#4-follower)
    *   [5. Notification](#5-notification)
    *   [6. Location](#6-location)
    *   [7. LocationHistory](#7-locationhistory)
*   [II. Trip Management (Quản lý Chuyến đi)](#ii-trip-management-quan-ly-chuyen-di)
    *   [8. Trip](#8-trip)
    *   [9. TripDay](#9-tripday)
    *   [10. TripActivity](#10-tripactivity)
    *   [11. Destination](#11-destination)
    *   [12. SavedPlace](#12-savedplace)
    *   [13. FavoriteFood](#13-favoritefood)
    *   [14. CheckIn](#14-checkin)
    *   [15. TravelHistory](#15-travelhistory)
*   [III. Social Network (Mạng xã hội)](#iii-social-network-mang-xa-hoi)
    *   [16. Post](#16-post)
    *   [17. Comment](#17-comment)
    *   [18. Like](#18-like)
    *   [19. Bookmark](#19-bookmark)
*   [IV. Chat System (Trò chuyện thời gian thực)](#iv-chat-system-tro-chuyen-thoi-gian-thuc)
    *   [20. Conversation](#20-conversation)
    *   [21. Message](#21-message)
*   [V. Event Management (Quản lý Sự kiện)](#v-event-management-quan-ly-su-kien)
    *   [22. Event](#22-event)
    *   [23. EventAttendee](#23-eventattendee)
*   [VI. Journey Tracking (Nhật ký Cung đường)](#vi-journey-tracking-nhat-ky-cung-duong)
    *   [24. Journey](#24-journey)
    *   [25. Route](#25-route)
    *   [26. RoutePoint](#26-routepoint)
*   [VII. AI & Recommendation (Trí tuệ nhân tạo & Đề xuất)](#vii-ai-recommendation-tri-tue-nhan-tao--de-xuat)
    *   [27. ChatConversation](#27-chatconversation)
    *   [28. ChatMessage](#28-chatmessage)
    *   [29. ChatMessageVersion](#29-chatmessageversion)
    *   [30. AIMemory](#30-aimemory)
    *   [31. UserRecommendation](#31-userrecommendation)
    *   [32. Recommendation](#32-recommendation)
    *   [33. AIHistory](#33-aihistory)
    *   [34. AIFeedback](#34-aifeedback)
    *   [35. ToolCall](#35-toolcall)
    *   [36. TravelerMatch](#36-travelermatch)
*   [VIII. Knowledge Base (RAG) (Kho Tri thức RAG)](#viii-knowledge-base-rag-kho-tri-thuc-rag)
    *   [37. KnowledgeContent](#37-knowledgecontent)
    *   [38. KnowledgeQuestion](#38-knowledgequestion)
    *   [39. KnowledgeAnswer](#39-knowledgeanswer)
    *   [40. SafetyWarning](#40-safetywarning)
*   [IX. System Audit & Logging (Kiểm toán AI & Nhật ký)](#ix-system-audit--logging-kiem-toan-ai--nhat-ky)
    *   [41. ModelRegistry](#41-modelregistry)
    *   [42. KnowledgeVersion](#42-knowledgeversion)
    *   [43. PromptVersion](#43-promptversion)
    *   [44. AIChatLog](#44-aichatlog)
    *   [45. UserFeedback](#45-userfeedback)
    *   [46. EvaluationHistory](#46-evaluationhistory)
    *   [47. GuardrailEvent](#47-guardrailevent)
    *   [48. KnowledgeFreshness](#48-knowledgefreshness)
    *   [49. AuditTrail](#49-audittrail)
*   [X. Cache & Metadata (Bộ nhớ tạm & Siêu dữ liệu)](#x-cache--metadata-bo-nho-tam--sieu-du-lieu)
    *   [50. SystemCache](#50-systemcache)
    *   [51. CacheMetadata](#51-cachemetadata)
*   [XI. Thống kê hệ thống](#xi-thong-ke-he-thong)

---

# I. User Management (Quản lý Người dùng)

## 1. User
### Mục đích
Lưu trữ thông tin tài khoản đăng nhập chính của người dùng và các liên kết khóa ngoại tới thông tin cá nhân.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| email | String | | | | | Email đăng nhập |
| passwordHash | String | | | | | Mật khẩu đã mã hóa |
| role | UserRole | | | | USER | Vai trò của tài khoản (USER, ADMIN) |
| isVerified | Boolean | | | | false | Trạng thái xác thực email |
| verificationToken | String | | | ✓ | | Mã token xác thực tài khoản |
| resetPasswordToken| String | | | ✓ | | Mã token đặt lại mật khẩu |
| createdAt | DateTime | | | | now() | Thời gian tạo tài khoản |
| updatedAt | DateTime | | | | | Thời gian cập nhật gần nhất |

### Quan hệ
*   User — Profile: One-to-One
*   User — TravelPreferences: One-to-One
*   User — Trip: One-to-Many
*   User — Post: One-to-Many
*   User — Comment: One-to-Many
*   User — Like: One-to-Many
*   User — Bookmark: One-to-Many
*   User — Notification: One-to-Many
*   User — Follower: One-to-Many

### Ghi chú
*   `@@index([email])` tăng tốc độ tìm kiếm tài khoản.

---

## 2. Profile
### Mục đích
Lưu trữ thông tin cá nhân bổ sung của người dùng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| fullName | String | | | | | Họ tên đầy đủ |
| avatarUrl | String | | | ✓ | | Đường dẫn ảnh đại diện |
| coverUrl | String | | | ✓ | | Đường dẫn ảnh bìa |
| bio | String | | | ✓ | | Tóm tắt tiểu sử |
| phoneNumber | String | | | ✓ | | Số điện thoại |
| homeLocation | String | | | ✓ | | Địa chỉ quê quán |

### Quan hệ
*   Profile — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@unique` trên trường `userId` đảm bảo mỗi tài khoản chỉ có 1 hồ sơ cá nhân.

---

## 3. TravelPreferences
### Mục đích
Lưu trữ thông tin sở thích tĩnh của người dùng do chính họ cung cấp khi khởi tạo tài khoản.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| preferredPace | String | | | | | Nhịp độ chuyến đi ("slow", "moderate", "fast") |
| dailyBudget | Float | | | | | Ngân sách ước tính mỗi ngày |
| activities | String[] | | | | | Mảng danh sách các hoạt động ưu thích |
| destinationTypes | String[] | | | | | Mảng danh sách loại địa điểm |
| foodPreferences | String[] | | | | | Mảng sở thích ẩm thực |

### Quan hệ
*   TravelPreferences — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@unique` trên trường `userId`.

---

## 4. Follower
### Mục đích
Lưu trữ quan hệ theo dõi chéo (Follower - Following) giữa các người dùng với nhau.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| followerId | String | | ✓ | | | Khóa ngoại người theo dõi tham chiếu User.id |
| followingId | String | | ✓ | | | Khóa ngoại người được theo dõi tham chiếu User.id |
| createdAt | DateTime | | | | now() | Thời gian tạo quan hệ |

### Quan hệ
*   Follower — User (follower): Many-to-One (`onDelete: Cascade`)
*   Follower — User (following): Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@unique([followerId, followingId])` ngăn chặn theo dõi trùng lặp.

---

## 5. Notification
### Mục đích
Lưu trữ và theo dõi các thông báo hệ thống gửi đến cho từng người dùng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| recipientId | String | | ✓ | | | Khóa ngoại người nhận tham chiếu User.id |
| type | String | | | | | Loại thông báo ("like", "comment", "friend_request") |
| content | String | | | | | Nội dung văn bản thông báo |
| isRead | Boolean | | | | false | Trạng thái đã đọc |
| createdAt | DateTime | | | | now() | Thời điểm tạo thông báo |

### Quan hệ
*   Notification — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([recipientId])` tăng tốc hiển thị thông báo ở UI.

---

## 6. Location
### Mục đích
Lưu trữ tọa độ GPS thời gian thực (Live Location) của người dùng để quét tìm bạn đồng hành lân cận.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| latitude | Float | | | | | Vĩ độ hiện tại |
| longitude | Float | | | | | Kinh độ hiện tại |
| updatedAt | DateTime | | | | | Thời điểm cập nhật cuối |

### Quan hệ
*   Location — User: One-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@unique` trên trường `userId`.

---

## 7. LocationHistory
### Mục đích
Lưu trữ vết tọa độ GPS lịch sử (breadcrumbs) phục vụ thống kê phân tích cung đường di chuyển thực tế.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| latitude | Float | | | | | Vĩ độ |
| longitude | Float | | | | | Kinh độ |
| accuracy | Float | | | ✓ | | Độ chính xác GPS (mét) |
| speed | Float | | | ✓ | | Tốc độ di chuyển (m/s) |
| heading | Float | | | ✓ | | Hướng di chuyển (độ) |
| createdAt | DateTime | | | | now() | Thời điểm ghi nhận vị trí |

### Quan hệ
*   LocationHistory — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([userId])`, `@@index([createdAt])`, `@@index([latitude, longitude])`.

---

# II. Trip Management (Quản lý Chuyến đi)

## 8. Trip
### Mục đích
Lưu trữ thông tin cơ bản của một chuyến đi do người dùng hoặc AI khởi tạo.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| ownerId | String | | ✓ | | | Khóa ngoại người sở hữu tham chiếu User.id |
| title | String | | | | | Tiêu đề chuyến đi |
| description | String | | | ✓ | | Mô tả hành trình |
| destinationName| String | | | | | Tên địa danh tổng quát |
| startDate | DateTime | | | ✓ | | Ngày bắt đầu chuyến đi |
| endDate | DateTime | | | ✓ | | Ngày kết thúc chuyến đi |
| totalBudget | Float | | | | 0.0 | Tổng ngân sách ước tính |
| travelStyle | String | | | | "solo" | Phong cách du lịch (solo, family, couple) |
| isPublic | Boolean | | | | false | Trạng thái công khai của chuyến đi |
| status | TripStatus | | | | CONFIRMED | Trạng thái chuyến đi (DRAFT_AI, DRAFT_USER, CONFIRMED) |
| cloneSourceId | String | | ✓ | ✓ | | Khóa ngoại trỏ đến Trip gốc nếu được sao chép |
| createdAt | DateTime | | | | now() | Ngày tạo chuyến đi |
| updatedAt | DateTime | | | | | Ngày cập nhật chuyến đi |

### Quan hệ
*   Trip — User (owner): Many-to-One (`onDelete: Cascade`)
*   Trip — Trip (cloneSource): Many-to-One
*   Trip — TripDay: One-to-Many
*   Trip — Post: One-to-Many

### Ghi chú
*   `@@index([ownerId])`, `@@index([cloneSourceId])`.

---

## 9. TripDay
### Mục đích
Đại diện cho một ngày nằm trong kế hoạch chi tiết của chuyến đi.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| tripId | String | | ✓ | | | Khóa ngoại tham chiếu Trip.id |
| dayIndex | Int | | | | | Chỉ số ngày (ví dụ: ngày 1, ngày 2) |
| date | DateTime | | | ✓ | | Ngày tháng cụ thể |

### Quan hệ
*   TripDay — Trip: Many-to-One (`onDelete: Cascade`)
*   TripDay — TripActivity: One-to-Many

### Ghi chú
*   `@@unique([tripId, dayIndex])` tránh việc trùng chỉ số ngày trong cùng một chuyến đi.

---

## 10. TripActivity
### Mục đích
Mô tả chi tiết các hoạt động diễn ra trong từng ngày của chuyến đi.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| tripDayId | String | | ✓ | | | Khóa ngoại tham chiếu TripDay.id |
| destinationId | String | | ✓ | ✓ | | Khóa ngoại trỏ tới địa điểm chính thức (Destination.id) |
| title | String | | | ✓ | | Tiêu đề hoạt động tự do |
| location | String | | | ✓ | | Mô tả vị trí hoạt động tự do |
| description | String | | | ✓ | | Chi tiết hoạt động |
| startTime | String | | | ✓ | | Thời gian bắt đầu hoạt động (HH:MM) |
| endTime | String | | | ✓ | | Thời gian kết thúc hoạt động (HH:MM) |
| estimatedCost | Float | | | | 0.0 | Chi phí dự kiến của hoạt động |
| sequenceOrder | Int | | | | | Thứ tự sắp xếp các hoạt động trong ngày |
| notes | String | | | ✓ | | Ghi chú thêm |

### Quan hệ
*   TripActivity — TripDay: Many-to-One (`onDelete: Cascade`)
*   TripActivity — Destination: Many-to-One (`onDelete: SetNull`)

### Ghi chú
*   `@@index([tripDayId])`, `@@index([destinationId])`.

---

## 11. Destination
### Mục đích
Lưu trữ thông tin chi tiết các địa danh du lịch, nhà hàng, khách sạn chính thức trong hệ thống.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| name | String | | | | | Tên địa danh |
| description | String | | | ✓ | | Mô tả chi tiết địa danh |
| latitude | Float | | | | | Vĩ độ bản đồ |
| longitude | Float | | | | | Kinh độ bản đồ |
| category | String | | | | | Phân loại địa điểm ("restaurant", "hotel", "attraction") |
| averageRating | Float | | | | 0.0 | Điểm đánh giá trung bình của địa danh |
| address | String | | | ✓ | | Địa chỉ thực tế |
| openingHours | String | | | ✓ | | Giờ mở cửa |

### Quan hệ
*   Destination — TripActivity: One-to-Many
*   Destination — CheckIn: One-to-Many
*   Destination — Recommendation: One-to-Many
*   Destination — Event: One-to-Many

### Ghi chú
*   `@@index([latitude, longitude])` tối ưu hóa truy vấn tìm địa điểm lân cận.

---

## 12. SavedPlace
### Mục đích
Lưu trữ các địa danh mà người dùng lưu trữ (Bookmark địa điểm) từ ứng dụng bản đồ.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| name | String | | | | | Tên địa điểm |
| category | String | | | | | Loại địa điểm |
| latitude | Float | | | | | Vĩ độ địa điểm |
| longitude | Float | | | | | Kinh độ địa điểm |
| address | String | | | ✓ | | Địa chỉ |
| imageUrl | String | | | ✓ | | Đường dẫn ảnh địa điểm |
| createdAt | DateTime | | | | now() | Ngày lưu |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   SavedPlace — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([userId])`.

---

## 13. FavoriteFood
### Mục đích
Danh sách món ăn ưa thích được người dùng đánh dấu và xếp hạng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| name | String | | | | | Tên món ăn |
| region | String | | | ✓ | | Vùng miền ẩm thực |
| description | String | | | ✓ | | Mô tả món ăn |
| rating | Float | | | ✓ | | Điểm xếp hạng món ăn của user |
| createdAt | DateTime | | | | now() | Ngày lưu |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   FavoriteFood — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([userId])`.

---

## 14. CheckIn
### Mục đích
Ghi nhận vị trí check-in của người dùng tại các địa điểm du lịch chính thức.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| destinationId | String | | ✓ | | | Khóa ngoại tham chiếu Destination.id |
| note | String | | | ✓ | | Ghi chú check-in |
| createdAt | DateTime | | | | now() | Thời điểm check-in |

### Quan hệ
*   CheckIn — User: Many-to-One (`onDelete: Cascade`)
*   CheckIn — Destination: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([userId])`, `@@index([destinationId])`.

---

## 15. TravelHistory
### Mục đích
Lưu lịch sử các địa danh mà người dùng đã thực sự ghé thăm phục vụ huấn luyện bộ nhớ AI.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| location | String | | | | | Địa danh đã đi qua (tự do) |
| destinationId | String | | ✓ | ✓ | | Khóa ngoại liên kết Destination.id |
| time | DateTime | | | | | Thời gian đi |
| rating | String | | | ✓ | | Đánh giá cảm nhận |
| cost | Float | | | | 0.0 | Chi phí thực tế đã chi |
| createdAt | DateTime | | | | now() | Ngày ghi nhận |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   TravelHistory — User: Many-to-One (`onDelete: Cascade`)
*   TravelHistory — Destination: Many-to-One (`onDelete: SetNull`)

### Ghi chú
*   `@@index([userId])`, `@@index([destinationId])`.

---

# III. Social Network (Mạng xã hội)

## 16. Post
### Mục đích
Lưu thông tin các bài đăng trên bảng tin cộng đồng do người dùng chia sẻ.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| authorId | String | | ✓ | | | Khóa ngoại người viết tham chiếu User.id |
| content | String | | | | | Nội dung văn bản bài đăng |
| mediaUrls | String[] | | | | | Danh sách đường dẫn ảnh đính kèm |
| tripId | String | | ✓ | ✓ | | Khóa ngoại liên kết chuyến đi được chia sẻ (Trip.id) |
| locationId | String | | | ✓ | | Tọa độ hoặc địa danh check-in gắn liền |
| createdAt | DateTime | | | | now() | Thời gian tạo bài viết |
| deletedAt | DateTime | | | ✓ | | Thời điểm xóa mềm |

### Quan hệ
*   Post — User (author): Many-to-One (`onDelete: Cascade`)
*   Post — Trip: Many-to-One (`onDelete: SetNull`)
*   Post — Comment: One-to-Many
*   Post — Like: One-to-Many
*   Post — Bookmark: One-to-Many

### Ghi chú
*   `@@index([authorId])`, `@@index([tripId])`.

---

## 17. Comment
### Mục đích
Lưu trữ các bình luận phân cấp dưới các bài đăng mạng xã hội.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| postId | String | | ✓ | | | Khóa ngoại tham chiếu Post.id |
| authorId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| content | String | | | | | Nội dung văn bản bình luận |
| parentId | String | | ✓ | ✓ | | Khóa ngoại trỏ đến bình luận cha (phục vụ bình luận nhiều cấp) |
| createdAt | DateTime | | | | now() | Ngày bình luận |

### Quan hệ
*   Comment — Post: Many-to-One (`onDelete: Cascade`)
*   Comment — User (author): Many-to-One (`onDelete: Cascade`)
*   Comment — Comment (parent): Many-to-One (`onDelete: Cascade`)
*   Comment — Comment (replies): One-to-Many

### Ghi chú
*   `@@index([postId])`, `@@index([authorId])`, `@@index([parentId])`.

---

## 18. Like
### Mục đích
Lưu trữ trạng thái thích bài viết của người dùng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| postId | String | | ✓ | | | Khóa ngoại tham chiếu Post.id |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| createdAt | DateTime | | | | now() | Ngày thích |

### Quan hệ
*   Like — Post: Many-to-One (`onDelete: Cascade`)
*   Like — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@unique([postId, userId])` đảm bảo mỗi user chỉ được thích một bài đăng tối đa 1 lần.

---

## 19. Bookmark
### Mục đích
Lưu vết các bài đăng được người dùng bookmark lại để xem sau.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| postId | String | | ✓ | | | Khóa ngoại tham chiếu Post.id |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| createdAt | DateTime | | | | now() | Ngày lưu |

### Quan hệ
*   Bookmark — Post: Many-to-One (`onDelete: Cascade`)
*   Bookmark — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@unique([postId, userId])`.

---

# IV. Chat System (Trò chuyện thời gian thực)

## 20. Conversation
### Mục đích
Quản lý các phòng chat trò chuyện trực tuyến giữa các thành viên.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính phòng chat |
| createdAt | DateTime | | | | now() | Thời điểm tạo phòng chat |
| updatedAt | DateTime | | | | | Thời điểm cập nhật cuối |

### Quan hệ
*   Conversation — User (participants): Many-to-Many
*   Conversation — Message: One-to-Many

---

## 21. Message
### Mục đích
Lưu trữ các tin nhắn trò chuyện của người dùng trong các phòng chat.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính tin nhắn |
| conversationId| String | | ✓ | | | Khóa ngoại tham chiếu Conversation.id |
| senderId | String | | ✓ | | | Khóa ngoại người gửi tham chiếu User.id |
| content | String | | | | | Nội dung văn bản tin nhắn |
| createdAt | DateTime | | | | now() | Thời gian gửi tin nhắn |

### Quan hệ
*   Message — Conversation: Many-to-One (`onDelete: Cascade`)
*   Message — User (sender): Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([conversationId])`.

---

# V. Event Management (Quản lý Sự kiện)

## 22. Event
### Mục đích
Tổ chức các hoạt động sự kiện, lễ hội hoặc buổi tụ họp tại các điểm đến du lịch.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| title | String | | | | | Tên sự kiện |
| description | String | | | ✓ | | Mô tả chi tiết sự kiện |
| coverImageUrl | String | | | ✓ | | Ảnh bìa sự kiện |
| destinationId | String | | ✓ | ✓ | | Khóa ngoại tham chiếu Destination.id |
| latitude | Float | | | | | Vĩ độ diễn ra sự kiện |
| longitude | Float | | | | | Kinh độ diễn ra sự kiện |
| startDate | DateTime | | | | | Ngày bắt đầu |
| endDate | DateTime | | | ✓ | | Ngày kết thúc |
| category | String | | | | | Phân loại ("festival", "meetup", "tour") |
| maxAttendees | Int | | | ✓ | | Số người tham gia tối đa |
| currentCount | Int | | | | 0 | Số lượng người đăng ký hiện tại |
| organizerId | String | | ✓ | | | Khóa ngoại người tổ chức tham chiếu User.id |
| isPublic | Boolean | | | | true | Sự kiện công khai |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   Event — Destination: Many-to-One (`onDelete: SetNull`)
*   Event — User (organizer): Many-to-One (`onDelete: Cascade`)
*   Event — EventAttendee: One-to-Many

### Ghi chú
*   `@@index([latitude, longitude])`, `@@index([startDate])`, `@@index([category])`, `@@index([organizerId])`.

---

## 23. EventAttendee
### Mục đích
Bảng trung gian quản lý danh sách đăng ký tham gia sự kiện của người dùng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| eventId | String | | ✓ | | | Khóa ngoại tham chiếu Event.id |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| status | String | | | | "going" | Trạng thái tham dự ("going", "interested") |
| createdAt | DateTime | | | | now() | Ngày đăng ký |

### Quan hệ
*   EventAttendee — Event: Many-to-One (`onDelete: Cascade`)
*   EventAttendee — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@unique([eventId, userId])`.

---

# VI. Journey Tracking (Nhật ký Cung đường)

## 24. Journey
### Mục đích
Lưu nhật ký hành trình (Trip Journal) biểu diễn câu chuyện chuyến đi kèm cung đường GPS thực tế.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| title | String | | | | | Tiêu đề câu chuyện |
| description | String | | | ✓ | | Mô tả hành trình |
| coverImageUrl | String | | | ✓ | | Đường dẫn ảnh đại diện |
| isPublic | Boolean | | | | true | Đăng công khai |
| status | String | | | | "draft" | Trạng thái ("draft", "active", "completed") |
| startDate | DateTime | | | ✓ | | Ngày khởi hành |
| endDate | DateTime | | | ✓ | | Ngày kết thúc |
| totalDistance | Float | | | | 0 | Tổng quãng đường di chuyển (Km) |
| createdAt | DateTime | | | | now() | Ngày viết |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   Journey — User: Many-to-One (`onDelete: Cascade`)
*   Journey — Route: One-to-Many

### Ghi chú
*   `@@index([userId])`, `@@index([status])`.

---

## 25. Route
### Mục đích
Đại diện cho một cung đường cụ thể trong chuỗi các tuyến đường di chuyển của Journey.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| journeyId | String | | ✓ | | | Khóa ngoại tham chiếu Journey.id |
| name | String | | | | | Tên chặng đường |
| description | String | | | ✓ | | Mô tả chặng |
| transportMode | String | | | | "walking" | Phương tiện di chuyển (walking, driving, cycling) |
| distanceKm | Float | | | | 0 | Chiều dài chặng đường (Km) |
| durationMin | Int | | | | 0 | Thời gian di chuyển (phút) |
| color | String | | | | "#D4A843" | Mã màu polyline vẽ trên bản đồ |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   Route — Journey: Many-to-One (`onDelete: Cascade`)
*   Route — RoutePoint: One-to-Many

### Ghi chú
*   `@@index([journeyId])`.

---

## 26. RoutePoint
### Mục đích
Lưu tọa độ GPS chi tiết của từng điểm mốc nằm trên tuyến đường di chuyển của Route.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| routeId | String | | ✓ | | | Khóa ngoại tham chiếu Route.id |
| latitude | Float | | | | | Vĩ độ |
| longitude | Float | | | | | Kinh độ |
| altitude | Float | | | ✓ | | Cao độ |
| sequenceOrder | Int | | | | | Thứ tự điểm mốc trên đường vẽ |
| timestamp | DateTime | | | | now() | Thời gian đi qua điểm |
| note | String | | | ✓ | | Ghi chú tại điểm mốc |
| photoUrl | String | | | ✓ | | Ảnh chụp tại điểm mốc |

### Quan hệ
*   RoutePoint — Route: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([routeId])`, `@@index([latitude, longitude])`.

---

# VII. AI & Recommendation (Trí tuệ nhân tạo & Đề xuất)

## 27. ChatConversation
### Mục đích
Quản lý các phiên hội thoại riêng biệt của người dùng với trợ lý ảo AI Chatbot.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính phiên trò chuyện |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| title | String | | | ✓ | "New Conversation"| Tiêu đề đoạn hội thoại AI |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   ChatConversation — User: Many-to-One (`onDelete: Cascade`)
*   ChatConversation — ChatMessage: One-to-Many

### Ghi chú
*   `@@index([userId])`.

---

## 28. ChatMessage
### Mục đích
Lưu chi tiết các tin nhắn trong phiên hội thoại trò chuyện với AI Chatbot.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| conversationId| String | | ✓ | | | Khóa ngoại tham chiếu ChatConversation.id |
| role | String | | | | | Vai trò người gửi ("user", "assistant", "system") |
| createdAt | DateTime | | | | now() | Ngày tạo tin nhắn |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   ChatMessage — ChatConversation: Many-to-One (`onDelete: Cascade`)
*   ChatMessage — ChatMessageVersion: One-to-Many
*   ChatMessage — AIFeedback: One-to-One
*   ChatMessage — ToolCall: One-to-Many
*   ChatMessage — AIChatLog: One-to-One

### Ghi chú
*   `@@index([conversationId])`.

---

## 29. ChatMessageVersion
### Mục đích
Quản lý các phiên bản nội dung chỉnh sửa hoặc tái tạo của tin nhắn AI.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| messageId | String | | ✓ | | | Khóa ngoại tham chiếu ChatMessage.id |
| content | String | | | | | Nội dung văn bản của phiên bản tin nhắn |
| version | Int | | | | | Chỉ số phiên bản (1, 2, 3, v.v.) |
| isActive | Boolean | | | | true | Trạng thái phiên bản hoạt động hiện tại |
| createdAt | DateTime | | | | now() | Thời gian tạo |

### Quan hệ
*   ChatMessageVersion — ChatMessage: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([messageId])`.

---

## 30. AIMemory
### Mục đích
Lưu thông tin đúc rút sở thích động của người dùng do AI học được qua phân tích tin nhắn.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| travelPreferences | String[] | | | | | Mảng sở thích du lịch đúc rút |
| favoriteFoods | String[] | | | | | Mảng món ăn ưa thích học được |
| budget | String | | | ✓ | | Phân khúc ngân sách ("thấp", "trung bình", "cao") |
| transportation| String[] | | | | | Mảng phương tiện ưu tiên |
| favoriteLocations | String[]| | | | | Mảng địa danh ưu tiên |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   AIMemory — User: One-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@unique` trên trường `userId` đảm bảo mỗi user chỉ có tối đa 1 bộ nhớ AI.

---

## 31. UserRecommendation
### Mục đích
Bảng lưu vết gợi ý cụ thể về địa điểm, ẩm thực hoặc hoạt động cho người dùng từ hệ thống AI Agent.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| location | String | | | | | Địa danh gợi ý dạng text |
| destinationId | String | | ✓ | ✓ | | Khóa ngoại tham chiếu Destination.id |
| priority | String | | | | | Độ ưu tiên gợi ý ("high", "medium", "low") |
| reason | String | | | ✓ | | Lý do đề xuất của AI |
| type | String | | | | | Phân loại gợi ý ("destination", "food", "activity") |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   UserRecommendation — User: Many-to-One (`onDelete: Cascade`)
*   UserRecommendation — Destination: Many-to-One (`onDelete: SetNull`)

### Ghi chú
*   `@@index([userId])`, `@@index([destinationId])`.

---

## 32. Recommendation
### Mục đích
Bảng ghi nhận điểm số khuyến nghị của các địa danh đối với từng chuyến đi phục vụ bộ lọc địa điểm.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| tripId | String | | ✓ | | | Khóa ngoại tham chiếu Trip.id |
| destinationId | String | | ✓ | | | Khóa ngoại tham chiếu Destination.id |
| score | Float | | | | | Điểm số gợi ý [0.0 - 1.0] |
| recommendationReason| String | | | ✓ | | Lý do gợi ý |

### Quan hệ
*   Recommendation — Trip: Many-to-One (`onDelete: Cascade`)
*   Recommendation — Destination: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([tripId])`.

---

## 33. AIHistory
### Mục đích
Lưu nhật ký tương tác thô của người dùng với các dịch vụ AI khác ngoài chatbot (ví dụ: tối ưu cung đường, dự báo chi phí).

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| promptText | String | | | | | Đầu vào văn bản gửi AI |
| responseJson | String | | | | | Kết quả JSON trả về |
| type | String | | | | | Phân loại ("itinerary", "route_optimization") |
| createdAt | DateTime | | | | now() | Thời gian tạo |

### Quan hệ
*   AIHistory — User: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([userId])`.

---

## 34. AIFeedback
### Mục đích
Lưu trữ phản hồi nhanh của người dùng (Thumbs up/down) cho từng tin nhắn của AI Chatbot.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại tham chiếu User.id |
| messageId | String | | ✓ | | | Khóa ngoại tham chiếu ChatMessage.id |
| rating | Int | | | | | Điểm số đánh giá (ví dụ: 1 hoặc -1) |
| comment | String | | | ✓ | | Ý kiến đóng góp bằng văn bản |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   AIFeedback — User: Many-to-One (`onDelete: Cascade`)
*   AIFeedback — ChatMessage: One-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@unique` trên trường `messageId` đảm bảo mỗi tin nhắn AI chỉ nhận tối đa 1 feedback.
*   `@@index([userId])`, `@@index([messageId])`.

---

## 35. ToolCall
### Mục đích
Lưu vết các lệnh gọi công cụ hỗ trợ ngoài (Maps, Weather, v.v.) của AI Agent để giải quyết bài toán nghiệp vụ.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| messageId | String | | ✓ | | | Khóa ngoại tham chiếu ChatMessage.id |
| toolName | String | | | | | Tên tool đã gọi (e.g. Maps, Weather) |
| input | String | | | | | Tham số đầu vào dạng chuỗi |
| output | String | | | ✓ | | Kết quả trả về của tool |
| status | String | | | | | Trạng thái thực thi ("success", "failed") |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   ToolCall — ChatMessage: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([messageId])`.

---

## 36. TravelerMatch
### Mục đích
Bảng lưu điểm số ghép đôi đồng hành giữa các người dùng dựa trên thuật toán AI so khớp sở thích.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| userId | String | | ✓ | | | Khóa ngoại người thứ nhất (User.id) |
| matchedUserId | String | | ✓ | | | Khóa ngoại người thứ hai (User.id) |
| compatScore | Float | | | | | Điểm số tương thích [0.0 - 1.0] |
| matchReasons | String[]| | | | | Danh sách lý do ghép đôi tương thích |
| status | String | | | | "suggested" | Trạng thái ghép đôi ("suggested", "accepted") |
| createdAt | DateTime | | | | now() | Ngày đề xuất |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   TravelerMatch — User (user): Many-to-One (`onDelete: Cascade`)
*   TravelerMatch — User (matchedUser): Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@unique([userId, matchedUserId])` ngăn chặn tạo trùng lặp cặp ghép đôi.
*   `@@index([userId])`, `@@index([matchedUserId])`, `@@index([compatScore])`.

---

# VIII. Knowledge Base (RAG) (Kho Tri thức RAG)

## 37. KnowledgeContent
### Mục đích
Lưu trữ các nội dung văn bản tri thức nền tảng (vùng miền, văn hóa, ẩm thực) phục vụ nghiệp vụ tra cứu RAG.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| title | String | | | | | Tiêu đề bài tri thức |
| body | String | | | | | Nội dung văn bản tri thức gốc |
| category | String | | | | | Thể loại tri thức ("culture", "food", "history") |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   KnowledgeContent — KnowledgeQuestion: One-to-Many
*   KnowledgeAnswer — KnowledgeContent: One-to-Many

### Ghi chú
*   `@@index([category])`.

---

## 38. KnowledgeQuestion
### Mục đích
Lưu trữ các câu hỏi mẫu tương ứng với nội dung tri thức và lưu các Vector Embeddings để tìm kiếm tương đồng ngữ nghĩa.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| contentId | String | | ✓ | | | Khóa ngoại tham chiếu KnowledgeContent.id |
| questionText | String | | | | | Nội dung văn bản câu hỏi |
| embeddingOpenAI| Unsupported("vector(1536)") | | | ✓ | | Vector nhúng OpenAI (1536 dims) |
| embeddingLocal | Unsupported("vector(128)") | | | ✓ | | Vector nhúng Local (128 dims) |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   KnowledgeQuestion — KnowledgeContent: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([contentId])`.

---

## 39. KnowledgeAnswer
### Mục đích
Lưu trữ các đáp án mẫu đi kèm với tri thức để hỗ trợ bot trả lời nhanh các câu hỏi phổ biến.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| contentId | String | | ✓ | | | Khóa ngoại tham chiếu KnowledgeContent.id |
| answerText | String | | | | | Nội dung văn bản câu trả lời mẫu |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   KnowledgeAnswer — KnowledgeContent: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([contentId])`.

---

## 40. SafetyWarning
### Mục đích
Lưu trữ các cảnh báo về an toàn giao thông, thiên tai, thời tiết tại các khu vực địa lý cụ thể.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| type | String | | | | | Loại cảnh báo ("FLOOD", "CLOSED_ROAD", "STORM") |
| description | String | | | | | Mô tả chi tiết cảnh báo |
| latitude | Float | | | | | Vĩ độ tâm cảnh báo |
| longitude | Float | | | | | Kinh độ tâm cảnh báo |
| radiusKm | Float | | | | 1.0 | Bán kính vùng cảnh báo (Km) |
| createdAt | DateTime | | | | now() | Ngày tạo |
| expiresAt | DateTime | | | ✓ | | Ngày hết hiệu lực cảnh báo |

### Ghi chú
*   `@@index([latitude, longitude])`.

---

# IX. System Audit & Logging (Kiểm toán AI & Nhật ký)

## 41. ModelRegistry
### Mục đích
Đăng ký và quản lý các mô hình ngôn ngữ lớn (LLM), Embeddings hoặc Reranker được sử dụng trong RAG.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| name | String | | | | | Tên mô hình (e.g. "gpt-4o", "claude-3") |
| provider | String | | | | | Nhà cung cấp (openai, anthropic) |
| type | String | | | | | Phân loại ("llm", "embedding") |
| version | String | | | | | Phiên bản |
| isActive | Boolean | | | | true | Trạng thái hoạt động |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Quan hệ
*   ModelRegistry — AIChatLog: One-to-Many

### Ghi chú
*   `@unique` trên trường `name`.

---

## 42. KnowledgeVersion
### Mục đích
Theo dõi các phiên bản commit tri thức để hỗ trợ khôi phục hoặc giám sát tính cập nhật.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| versionNumber | Int | | | | | Số phiên bản duy nhất |
| commitMessage | String | | | ✓ | | Mô tả cập nhật |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   KnowledgeVersion — KnowledgeFreshness: One-to-Many

### Ghi chú
*   `@unique` trên trường `versionNumber`.

---

## 43. PromptVersion
### Mục đích
Quản lý lịch sử thay đổi và phiên bản các Prompt hệ thống của chatbot.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| templateName | String | | | | | Tên mẫu prompt |
| versionHash | String | | | | | Mã hash phiên bản (duy nhất) |
| templateText | String | | | | | Nội dung chi tiết văn bản prompt |
| isActive | Boolean | | | | true | Trạng thái kích hoạt sử dụng |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   PromptVersion — AIChatLog: One-to-Many

### Ghi chú
*   `@unique` trên trường `versionHash`.

---

## 44. AIChatLog
### Mục đích
Bảng ghi chi tiết các thông số kỹ thuật của từng tin nhắn AI nhằm phục vụ giám sát độ tin cậy và chi phí tokens.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| messageId | String | | ✓ | | | Khóa ngoại tham chiếu ChatMessage.id |
| query | String | | | | | Câu hỏi gốc |
| llmPrompt | String | | | | | Prompt hoàn chỉnh gửi lên LLM |
| llmResponse | String | | | | | Phản hồi của LLM |
| similarityScore| Float | | | | | Điểm tương đồng Vector RAG |
| confidenceScore| Int | | | | | Điểm độ tin cậy của câu trả lời |
| reliabilityLevel| String | | | | | Phân cấp độ tin cậy |
| groundednessScore| Int | | | | | Điểm đối chứng sự thật |
| claimVerScore | Int | | | | | Điểm xác minh tuyên bố |
| retrievedContext| String | | | | | Chuỗi JSON chứa tài liệu RAG đã lấy |
| promptTokens | Int | | | | | Số lượng tokens của prompt |
| completionTokens| Int | | | | | Số lượng tokens của phản hồi |
| totalTokens | Int | | | | | Tổng số tokens đã dùng |
| apiCostUsd | Float | | | | | Chi phí USD của API cuộc gọi |
| latencyMs | Int | | | | | Độ trễ phản hồi (ms) |
| ttftMs | Int | | | | | Thời gian nhận token đầu tiên (ms) |
| guardrailsBlocked| Boolean| | | | false | Có bị chặn bởi guardrail |
| securityThreatType| String| | | ✓ | | Loại đe dọa (PROMPT_INJECTION) |
| unsupportedClaims| Int | | | | 0 | Số tuyên bố không có nguồn trích |
| modelId | String | | ✓ | | | Khóa ngoại tham chiếu ModelRegistry.id |
| promptId | String | | ✓ | | | Khóa ngoại tham chiếu PromptVersion.id |
| createdAt | DateTime | | | | now() | Ngày ghi log |

### Quan hệ
*   AIChatLog — ChatMessage: One-to-One (`onDelete: Cascade`)
*   AIChatLog — ModelRegistry: Many-to-One
*   AIChatLog — PromptVersion: Many-to-One
*   AIChatLog — UserFeedback: One-to-Many
*   AIChatLog — EvaluationHistory: One-to-Many
*   AIChatLog — GuardrailEvent: One-to-Many

### Ghi chú
*   `@unique` trên trường `messageId`.
*   `@@index([confidenceScore])`, `@@index([reliabilityLevel])`.

---

## 45. UserFeedback
### Mục đích
Lưu phản hồi cải thiện chất lượng AI từ người dùng (Upvote/Downvote kèm văn bản sửa lỗi).

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| chatLogId | String | | ✓ | | | Khóa ngoại tham chiếu AIChatLog.id |
| rating | Int | | | | | Đánh giá (1: Upvote, -1: Downvote) |
| comment | String | | | ✓ | | Ý kiến phản hồi |
| correctedText | String | | | ✓ | | Câu trả lời đúng do người dùng tự nhập |
| isProcessed | Boolean | | | | false | Trạng thái quản trị viên đã duyệt |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   UserFeedback — AIChatLog: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([chatLogId])`.

---

## 46. EvaluationHistory
### Mục đích
Lưu lịch sử đánh giá chất lượng tự động bằng mô hình (LLM-as-a-judge).

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| chatLogId | String | | ✓ | | | Khóa ngoại tham chiếu AIChatLog.id |
| metricName | String | | | | | Tên tiêu chí đánh giá ("faithfulness") |
| score | Float | | | | | Điểm số đánh giá tự động |
| evaluatorModel | String | | | | | Tên model thực hiện đánh giá |
| reasoning | String | | | ✓ | | Lập luận giải thích của model eval |
| createdAt | DateTime | | | | now() | Ngày tạo |

### Quan hệ
*   EvaluationHistory — AIChatLog: Many-to-One (`onDelete: Cascade`)

### Ghi chú
*   `@@index([chatLogId])`.

---

## 47. GuardrailEvent
### Mục đích
Ghi nhận các sự kiện Prompt hoặc Response bị phát hiện vi phạm quy tắc an toàn thông tin hệ thống.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| chatLogId | String | | ✓ | ✓ | | Khóa ngoại liên kết AIChatLog.id |
| ruleViolated | String | | | | | Luật vi phạm ("TOXICITY", "PROMPT_INJECTION") |
| severity | String | | | | | Mức độ nghiêm trọng ("HIGH", "CRITICAL") |
| payloadBlocked| String | | | | | Nội dung văn bản bị chặn |
| actionTaken | String | | | | | Biện pháp ứng phó ("BLOCKED", "REDACTED") |
| createdAt | DateTime | | | | now() | Ngày phát hiện |

### Quan hệ
*   GuardrailEvent — AIChatLog: Many-to-One (`onDelete: SetNull`)

### Ghi chú
*   `@@index([chatLogId])`.

---

## 48. KnowledgeFreshness
### Mục đích
Lưu trữ nhật ký kiểm tra tính tươi mới của tài liệu tri thức tránh hiện tượng trôi lệch tri thức (data drift).

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| contentId | String | | | | | ID của tài liệu tri thức (KnowledgeContent.id) |
| knowledgeCat | String | | | | | Thể loại tri thức |
| lastCheckedAt | DateTime | | | | now() | Thời điểm kiểm tra gần nhất |
| driftDetected | Boolean | | | | false | Có phát hiện trôi lệch tri thức |
| sourceHash | String | | | ✓ | | Mã băm của nguồn gốc |
| versionId | Int | | ✓ | | | Khóa ngoại tham chiếu KnowledgeVersion.versionNumber |

### Quan hệ
*   KnowledgeFreshness — KnowledgeVersion: Many-to-One

### Ghi chú
*   `@@index([contentId])`.

---

## 49. AuditTrail
### Mục đích
Ghi nhật ký vết hành động quản trị hệ thống phục vụ an ninh bảo mật và truy vết lỗi.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| actionType | String | | | | | Thể loại hành động ("PROMPT_UPDATE", "MODEL_SWITCH") |
| actorName | String | | | | | Tên người thực hiện hành động |
| description | String | | | | | Mô tả chi tiết hành động |
| ipAddress | String | | | ✓ | | Địa chỉ IP của máy thực hiện |
| createdAt | DateTime | | | | now() | Thời gian thực hiện |

---

# X. Cache & Metadata (Bộ nhớ tạm & Siêu dữ liệu)

## 50. SystemCache
### Mục đích
Lưu trữ các kết quả truy vấn đệm tĩnh nhằm tăng hiệu năng phản hồi API cho người dùng.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| key | String | ✓ | | | | Khóa tìm kiếm cache |
| type | String | ✓ | | | | Phân loại dữ liệu đệm |
| value | String | | | | | Chuỗi JSON serialize lưu trữ dữ liệu |
| expiresAt | DateTime | | | | | Thời hạn hết hạn đệm |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Ghi chú
*   `@@id([key, type])` định nghĩa khóa chính phức hợp (Composite Primary Key).
*   `@@index([type])` tăng tốc tìm và dọn dẹp cache theo nhóm.

---

## 51. CacheMetadata
### Mục đích
Lưu thông tin siêu dữ liệu cache ngữ nghĩa (Semantic Cache) phục vụ việc tái sử dụng câu trả lời tương tự của AI.

### Cấu trúc bảng
| Trường | Kiểu | PK | FK | Nullable | Default | Mô tả |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| id | String | ✓ | | | uuid() | Khóa chính |
| cacheKey | String | | | | | Mã băm đại diện của Vector câu hỏi |
| queryText | String | | | | | Câu hỏi gốc dạng văn bản |
| responseJson | String | | | | | Câu trả lời tương ứng được lưu trữ |
| hitCount | Int | | | | 1 | Số lần tái sử dụng (Hit Count) |
| expiresAt | DateTime | | | | | Thời điểm hết hạn |
| createdAt | DateTime | | | | now() | Ngày tạo |
| updatedAt | DateTime | | | | | Ngày cập nhật |

### Ghi chú
*   `@unique` trên trường `cacheKey`.

---

# XI. Thống kê hệ thống

Dưới đây là bảng thống kê tổng lượng thực thể và liên kết cấu trúc dữ liệu của toàn bộ lược đồ:

| Nội dung | Số lượng |
| :--- | :--- |
| **Tổng Models (Bảng)** | 51 |
| **Tổng Fields (Trường)** | 243 |
| **Tổng Khóa chính (PK)** | 51 |
| **Tổng Khóa ngoại (FK)** | 48 |
| **Tổng Quan hệ 1-1** | 7 |
| **Tổng Quan hệ 1-N** | 39 |
| **Tổng Quan hệ N-N** | 2 |
