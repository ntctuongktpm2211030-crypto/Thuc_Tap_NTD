# BÁO CÁO KIỂM TOÁN NGHIỆP VỤ & USE CASE TOÀN DIỆN (SYSTEM USE CASE AUDIT REPORT)

*Tác giả: Senior Software Architect / Business Analyst*  
*Quy chuẩn: UML 2.5 & IEEE Std 830-1998 SRS*

---

## I. MỤC TIÊU VÀ PHẠM VI KIỂM TOÁN (AUDIT SCOPE & OBJECTIVE)

Báo cáo thực hiện quét toàn bộ mã nguồn của dự án **SmartTravel** nhằm phát hiện tất cả các hành vi nghiệp vụ mà một tác nhân con người (Actor) có thể thực hiện. Quy trình kiểm toán không chỉ dựa trên các Router API ở Backend mà còn đối chiếu trực tiếp với luồng định tuyến (Routes), giao diện người dùng (Pages/Components), các hooks tương tác trong Frontend, cơ chế Websocket thời gian thực và kịch bản nạp dữ liệu tri thức của RAG Pipeline.

---

## II. DANH SÁCH TÁC NHÂN (ACTORS) & PHÂN HỆ (MODULES)

### 1. Tác nhân (Actors)
*   **Khách vãng lai (Guest)**: Tác nhân chưa định danh. Quyền hạn: Xem bảng tin bài viết, xem bản đồ Leaflet, tìm kiếm địa danh du lịch, xem cẩm nang văn hóa tĩnh, đăng ký & đăng nhập.
*   **Người dùng đăng ký (Registered Traveler)**: Tác nhân đã định danh. Quyền hạn: Quản lý hồ sơ, cấu hình sở thích du lịch, tạo chuyến đi liên kết bản đồ, tự tạo hành trình tự do (custom itinerary), check-in, ghim lưu địa điểm, chia sẻ vị trí live WebSocket, trò chuyện với Trợ lý ảo AI, thích/bookmark/bình luận bài viết, ghép cặp bạn đồng hành.
*   **Quản trị viên (Admin)**: Tác nhân vận hành. Quyền hạn: Xem dashboards thống kê tương tác, 플랫폼 stats, nạp tài liệu RAG, chạy các script chuẩn hóa dữ liệu địa phương.
*   **Firebase Auth (External System)**: Hỗ trợ xác thực đăng nhập Google OAuth.
*   **OpenStreetMap (OSM - External System)**: Cung cấp bản đồ nền, geocoding địa chỉ và tính khoảng cách địa lý.
*   **OpenAI API (External System)**: Hỗ trợ sinh lịch trình AI, chatbot đa Agent, so khớp bạn phượt, vector hóa tài liệu RAG.
*   **vietnamadminunits (External System)**: Hỗ trợ chuẩn hóa và phân tích phân cấp hành chính.
*   **SMTP Mail Server (External System)**: Gửi mã thông báo kích hoạt tài khoản.

### 2. Các phân hệ nghiệp vụ (Business Modules)
1.  **Authentication & Profile (AUTH)**: Quản lý bảo mật tài khoản, tùy chọn cá nhân hóa và mạng lưới liên kết xã hội (Follow).
2.  **Trip Planning & Custom Itineraries (TRIP)**: Các công cụ lên kế hoạch chuyến đi (tự động qua AI hoặc thủ công) và dòng thời gian tự do.
3.  **Community & Social Feed (SOC)**: Bảng tin tương tác bài đăng và các thuật toán ghép bạn đồng hành.
4.  **Interactive GIS Map & Live Tracking (MAP)**: Bản đồ địa vị trí trực quan, check-in, định vị live và tổ chức meetup.
5.  **AI Chatbot & RAG (AI)**: Trò chuyện trợ lý ảo, cẩm nang đặc sản yêu thích và bộ nhớ AI.
6.  **System Administration (ADM)**: Bảng điều khiển phân tích và nạp tài liệu.

---

## III. CHI TIẾT DANH SÁCH USE CASES

### 1. Phân hệ Xác thực & Thành viên (Authentication & Profile)

#### UC_AUTH_01: Đăng ký tài khoản (Register Account)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: SMTP Mail Server
*   **Preconditions**: Chưa đăng nhập và dùng email chưa đăng ký.
*   **Main Flow**: Nhập Email, mật khẩu, Tên -> Gửi yêu cầu -> Hệ thống tạo bản ghi tạm `unverified` -> Gửi mail xác thực qua SMTP.
*   **Alternative Flow**: Trùng email -> Thông báo lỗi và dừng.
*   **Postconditions**: Tạo bản ghi tạm chờ kích hoạt.
*   **Source File**: [auth.router.ts:L31](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L31)

#### UC_AUTH_02: Xác thực email (Verify Email Address)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: SMTP Mail Server
*   **Preconditions**: Đã nhận được email chứa JWT kích hoạt.
*   **Main Flow**: Nhấn link xác thực -> Hệ thống xác nhận JWT -> Cập nhật trạng thái `isVerified = true`.
*   **Alternative Flow**: Token hết hạn (quá 24h) -> Thông báo token hết hiệu lực -> Yêu cầu gửi lại link.
*   **Postconditions**: Tài khoản được kích hoạt thành công.
*   **Source File**: [auth.router.ts:L298](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L298)

#### UC_AUTH_03: Đăng nhập truyền thống (Traditional Log In)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: Tài khoản đã được kích hoạt.
*   **Main Flow**: Nhập Email & Mật khẩu -> Hệ thống băm kiểm tra -> Trả về Access Token & Refresh Token.
*   **Alternative Flow**: Nhập sai pass/email -> Thông báo lỗi bảo mật.
*   **Postconditions**: Thiết lập phiên đăng nhập của người dùng.
*   **Source File**: [auth.router.ts:L91](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L91)

#### UC_AUTH_04: Đăng nhập Google SSO (Google Log In)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: Firebase Auth
*   **Preconditions**: Có tài khoản Google hợp lệ.
*   **Main Flow**: Chọn Login Google -> Nhận Google ID Token -> Backend giải mã verify -> Tạo/Đăng nhập user tương ứng.
*   **Alternative Flow**: Token Google không hợp lệ -> Báo lỗi đăng nhập.
*   **Postconditions**: Thiết lập phiên đăng nhập.
*   **Source File**: [auth.router.ts:L216](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L216)

#### UC_AUTH_05: Xem hồ sơ cá nhân của mình (Retrieve Personal Profile)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Vào trang cá nhân -> Hệ thống đọc CSDL Profile hiện lên thông tin.
*   **Alternative Flow**: Không tìm thấy Profile -> Redirect về trang cấu hình.
*   **Postconditions**: Hiển thị thông tin cá nhân.
*   **Source File**: [auth.router.ts:L170](file:///d:/Thuc_Tap_NDT/backend/src/modules/auth/auth.router.ts#L170)

#### UC_AUTH_06: Cập nhật thông tin cá nhân (Update Personal Profile)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Nhập tên mới, bio, upload avatar (Base64) -> Nhấn Lưu -> Hệ thống ghi nhận vào Profile CSDL.
*   **Alternative Flow**: Avatar quá dung lượng -> Báo lỗi định dạng.
*   **Postconditions**: Profile CSDL được cập nhật.
*   **Source File**: [social.router.ts:L42](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L42)

#### UC_AUTH_07: Xem trang cá nhân thành viên khác (Retrieve User Profile)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Nhấn vào tên/avatar thành viên trên bảng tin -> Hiện trang cá nhân công khai của họ.
*   **Alternative Flow**: Tài khoản bị xóa -> Báo lỗi không tồn tại.
*   **Postconditions**: Hiển thị thông tin công khai.
*   **Source File**: [social.router.ts:L10](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L10)

#### UC_AUTH_08: Quản lý tùy chọn sở thích du lịch (Manage Travel Preferences)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Chọn Pace, Budget, Activities, Food -> Lưu -> CSDL cập nhật `TravelPreferences`.
*   **Alternative Flow**: Dữ liệu không hợp lệ -> Báo lỗi.
*   **Postconditions**: Sở thích du lịch được cập nhật.
*   **Source File**: [social.router.ts:L177](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L177)

#### UC_AUTH_09: Theo dõi thành viên khác (Follow Member)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập, không tự follow mình.
*   **Main Flow**: Nhấn "Theo dõi" -> Tạo bản ghi `Follower` -> Gửi thông báo đến người được theo dõi.
*   **Alternative Flow**: Đã follow từ trước -> Chuyển thành Unfollow.
*   **Postconditions**: Tăng số lượng following/followers.
*   **Source File**: [social.router.ts:L68](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L68)

#### UC_AUTH_10: Hủy theo dõi thành viên khác (Unfollow Member)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã theo dõi đối tượng trước đó.
*   **Main Flow**: Nhấn "Đang theo dõi" -> Hệ thống xóa bản ghi trong bảng `Follower`.
*   **Alternative Flow**: Chưa từng follow -> Báo lỗi nghiệp vụ.
*   **Postconditions**: Xóa mối quan hệ follow trong CSDL.
*   **Source File**: [social.router.ts:L68](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L68)

#### UC_AUTH_11: Xem danh sách người đang theo dõi (View Following List)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Mở tab "Đang theo dõi" tại profile -> Hiện danh sách tài khoản liên kết.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách.
*   **Source File**: [social.router.ts:L127](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L127)

#### UC_AUTH_12: Xem danh sách người theo dõi mình (View Followers List)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Mở tab "Người theo dõi" -> Hiện danh sách tài khoản follow.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách.
*   **Source File**: [social.router.ts:L110](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L110)

#### UC_AUTH_13: Xem lịch sử thông báo cá nhân (View Notifications History)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Click biểu tượng Chuông -> Lấy và hiển thị các bản ghi thông báo chưa đọc.
*   **Alternative Flow**: Không có thông báo -> Hiện trống.
*   **Postconditions**: Hiển thị thông báo.
*   **Source File**: [social.router.ts:L144](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L144)

#### UC_AUTH_14: Đánh dấu đã đọc tất cả thông báo (Mark All Notifications as Read)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Có thông báo ở trạng thái chưa đọc.
*   **Main Flow**: Nhấn "Đọc tất cả" -> Cập nhật trạng thái `isRead = true` cho tất cả thông báo của người dùng.
*   **Alternative Flow**: -
*   **Postconditions**: Số thông báo chưa đọc trở về 0.
*   **Source File**: [social.router.ts:L161](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L161)

#### UC_AUTH_15: Tìm kiếm thành viên (Search Profiles)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Gõ từ khóa vào thanh tìm kiếm -> Backend truy vấn Like trên bảng Profile -> Trả về danh sách trùng khớp.
*   **Alternative Flow**: Không tìm thấy -> Hiện "Không tìm thấy kết quả".
*   **Postconditions**: Hiển thị danh sách kết quả.
*   **Source File**: [social.router.ts:L210](file:///d:/Thuc_Tap_NDT/backend/src/modules/social/social.router.ts#L210)

---

### 2. Phân hệ Kế hoạch & Hành trình (Trip Planning & Custom Itineraries)

#### UC_TRIP_01: Xem danh sách chuyến đi cá nhân (List Personal Trips)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Vào "Kế hoạch của tôi" -> Hệ thống truy vấn các `Trip` sở hữu bởi userId.
*   **Alternative Flow**: Chưa có chuyến đi nào -> Hiện gợi ý tạo chuyến đi.
*   **Postconditions**: Hiển thị danh sách chuyến đi.
*   **Source File**: [trips.router.ts:L34](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L34)

#### UC_TRIP_02: Xem chi tiết chuyến đi (View Trip Details)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Người dùng sở hữu chuyến đi hoặc chuyến đi ở chế độ public.
*   **Main Flow**: Nhấn chọn chuyến đi -> Tải toàn bộ cấu trúc TripDay, TripActivity và vẽ lộ trình lên bản đồ.
*   **Alternative Flow**: Chuyến đi riêng tư của người khác -> Báo lỗi "Access Denied".
*   **Postconditions**: Hiển thị chi tiết dòng thời gian chuyến đi.
*   **Source File**: [trips.router.ts:L64](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L64)

#### UC_TRIP_03: Tạo chuyến đi thủ công (Create Trip Manually)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Điền Tiêu đề, điểm đến, ngày đi/về -> Nhấn lưu -> Hệ thống lưu bản ghi `Trip` mới.
*   **Alternative Flow**: Ngày đi sau ngày về -> Báo lỗi logic thời gian.
*   **Postconditions**: Tạo chuyến đi mới thành công.
*   **Source File**: [trips.router.ts:L105](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L105)

#### UC_TRIP_04: Cập nhật thông tin chuyến đi (Update Trip Details)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập và là chủ sở hữu chuyến đi.
*   **Main Flow**: Sửa đổi thông tin trên giao diện -> Nhấn cập nhật -> Hệ thống update dữ liệu.
*   **Alternative Flow**: Thay đổi ngày làm lệch cấu trúc TripDay -> Hệ thống tự động re-align hoặc cảnh báo.
*   **Postconditions**: Dữ liệu chuyến đi được lưu thay đổi.
*   **Source File**: [trips.router.ts:L360](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L360)

#### UC_TRIP_05: Xóa chuyến đi (Delete Trip)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập và là chủ sở hữu chuyến đi.
*   **Main Flow**: Nhấn "Xóa chuyến đi" -> Xác nhận -> Xóa toàn bộ Cascade TripDay, TripActivity trong CSDL.
*   **Alternative Flow**: Hủy xác nhận -> Dừng thao tác.
*   **Postconditions**: Chuyến đi bị xóa khỏi hệ thống.
*   **Source File**: [trips.router.ts:L403](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L403)

#### UC_TRIP_06: Tạo lịch trình tự động bằng AI (Generate AI Itinerary)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Thiết lập ngân sách, Pace và các sở thích.
*   **Main Flow**: Nhấn "Tạo lịch trình AI" -> Backend gọi OpenAI API với Prompt -> Trả về cấu trúc JSON -> Lưu tự động vào `Trip`.
*   **Alternative Flow**: API quá tải -> Thông báo lỗi và giữ lại form để người dùng thử lại.
*   **Postconditions**: Tạo chuyến đi thành công kèm theo đầy đủ TripDay, TripActivity chi tiết.
*   **Source File**: [trips.router.ts:L234](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L234)

#### UC_TRIP_07: Tái tạo một phần lịch trình bằng AI (Regenerate Specific Itinerary Day)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Chuyến đi đã tồn tại.
*   **Main Flow**: Chọn một ngày hoạt động -> Nhấn "AI sinh lại ngày này" -> AI đề xuất các địa điểm khác -> Cập nhật CSDL.
*   **Alternative Flow**: OpenAI trả về dữ liệu sai cấu trúc -> Fallback giữ nguyên lịch trình cũ.
*   **Postconditions**: Lịch trình ngày được thay thế bằng gợi ý mới.
*   **Source File**: [trips.router.ts:L275](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L275)

#### UC_TRIP_08: Tối ưu hóa thứ tự điểm dừng (Optimize Route - TSP Solver)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Ngày lịch trình có tối thiểu 3 hoạt động trở lên.
*   **Main Flow**: Chọn ngày -> Nhấn "Tối ưu đường đi" -> Hệ thống chạy giải thuật TSP dựa trên khoảng cách giữa các tọa độ -> Cập nhật lại `sequenceOrder` của hoạt động.
*   **Alternative Flow**: Tọa độ các điểm bị lỗi -> Không thể tối ưu hóa và giữ nguyên.
*   **Postconditions**: Thứ tự hoạt động được sắp xếp tối ưu.
*   **Source File**: [trips.router.ts:L330](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L330)

#### UC_TRIP_09: Nhân bản lịch trình công khai (Clone Public Trip)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Chuyến đi của người khác có trạng thái `isPublic = true`.
*   **Main Flow**: Nhấn nút "Nhân bản/Copy" -> Hệ thống sao chép thông tin và tạo bản ghi Trip mới với `ownerId` là người dùng hiện tại.
*   **Alternative Flow**: Chuyến đi riêng tư -> Không tìm thấy nút nhân bản.
*   **Postconditions**: Bản ghi sao chép xuất hiện trong kho cá nhân của người dùng.
*   **Source File**: [trips.router.ts:L420](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L420)

#### UC_TRIP_10: Tìm kiếm & Khám phá lịch trình cộng đồng (Browse Public Trips)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Truy cập tab Khám phá -> Lọc theo điểm đến hoặc phong cách -> Hệ thống trả về danh sách các `Trip` có `isPublic = true`.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị kết quả tìm kiếm.
*   **Source File**: [trips.router.ts:L474](file:///d:/Thuc_Tap_NDT/backend/src/modules/trips/trips.router.ts#L474)

#### UC_TRIP_11: Xem danh sách hành trình tự do (List Custom Itineraries)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Chọn phân hệ "Hành trình tự do" -> Hệ thống lấy các bản ghi `Itinerary` tương ứng.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách hành trình tự do.
*   **Source File**: [itinerary.router.ts:L16](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L16)

#### UC_TRIP_12: Xem chi tiết hành trình tự do (View Custom Itinerary Details)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Chủ sở hữu hành trình.
*   **Main Flow**: Click hành trình tự do -> Hiện chi tiết ItineraryDay và ItineraryActivity.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị chi tiết hành trình.
*   **Source File**: [itinerary.router.ts:L17](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L17)

#### UC_TRIP_13: Tạo hành trình tự do mới (Create Custom Itinerary)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Nhập tên hành trình, mô tả -> Nhấn tạo -> Lưu bản ghi `Itinerary`.
*   **Alternative Flow**: Thiếu tên -> Báo lỗi.
*   **Postconditions**: Tạo bản ghi Itinerary trống.
*   **Source File**: [itinerary.router.ts:L15](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L15)

#### UC_TRIP_14: Thêm ngày vào hành trình tự do (Add Day to Custom Itinerary)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Hành trình tự do tồn tại.
*   **Main Flow**: Nhấn "Thêm ngày" -> Tạo mới bản ghi `ItineraryDay` tăng `dayIndex`.
*   **Alternative Flow**: -
*   **Postconditions**: Thêm ngày mới vào hành trình.
*   **Source File**: [itinerary.router.ts:L20](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L20)

#### UC_TRIP_15: Thêm hoạt động vào hành trình tự do (Add Activity to Itinerary)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã tạo ItineraryDay.
*   **Main Flow**: Điền Title, Mô tả, Time, Location, Cost -> Nhấn thêm -> Tạo bản ghi `ItineraryActivity`.
*   **Alternative Flow**: Sai định dạng giờ -> Yêu cầu sửa đổi.
*   **Postconditions**: Hoạt động mới được hiển thị trên dòng thời gian.
*   **Source File**: [itinerary.router.ts:L23](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L23)

#### UC_TRIP_16: Cập nhật hoạt động hành trình tự do (Update Itinerary Activity)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Hoạt động tự do tồn tại.
*   **Main Flow**: Thay đổi thông tin trên biểu mẫu -> Nhấn Lưu -> Hệ thống update dữ liệu.
*   **Alternative Flow**: -
*   **Postconditions**: Cập nhật thông tin hoạt động tự do.
*   **Source File**: [itinerary.router.ts:L24](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L24)

#### UC_TRIP_17: Xóa hoạt động khỏi hành trình tự do (Delete Itinerary Activity)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Hoạt động tự do tồn tại.
*   **Main Flow**: Click "Xóa hoạt động" -> Backend xóa bản ghi `ItineraryActivity`.
*   **Alternative Flow**: -
*   **Postconditions**: Hoạt động bị xóa khỏi ngày.
*   **Source File**: [itinerary.router.ts:L25](file:///d:/Thuc_Tap_NDT/backend/src/modules/itinerary/routes/itinerary.router.ts#L25)

#### UC_TRIP_18: Tạo bản ghi lịch sử du lịch thực tế (Create Travel History Entry)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đi du lịch và đăng nhập.
*   **Main Flow**: Nhập Địa danh đã đi, Thời gian, Chi phí, Đánh giá -> Tạo bản ghi `TravelHistory`.
*   **Alternative Flow**: Thiếu dữ liệu bắt buộc -> Báo lỗi.
*   **Postconditions**: Thêm thành công nhật ký lịch sử đi lại.
*   **Source File**: [travel-history.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/travel-history/routes/travel-history.router.ts#L12)

#### UC_TRIP_19: Xem danh sách lịch sử du lịch (List Travel Histories)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Truy cập tab "Lịch sử đi lại" -> Hiển thị danh sách các địa danh đã từng check-in du lịch.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách lịch sử.
*   **Source File**: [travel-history.router.ts:L13](file:///d:/Thuc_Tap_NDT/backend/src/modules/travel-history/routes/travel-history.router.ts#L13)

#### UC_TRIP_20: Cập nhật bản ghi lịch sử du lịch (Update Travel History Entry)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bản ghi lịch sử du lịch tồn tại.
*   **Main Flow**: Sửa đổi chi phí, đánh giá sao -> Nhấn Lưu -> Hệ thống update dữ liệu.
*   **Alternative Flow**: -
*   **Postconditions**: Bản ghi lịch sử du lịch được cập nhật.
*   **Source File**: [travel-history.router.ts:L14](file:///d:/Thuc_Tap_NDT/backend/src/modules/travel-history/routes/travel-history.router.ts#L14)

#### UC_TRIP_21: Xóa bản ghi lịch sử du lịch (Delete Travel History Entry)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bản ghi lịch sử du lịch tồn tại.
*   **Main Flow**: Nhấn Xóa -> Hệ thống xóa bản ghi `TravelHistory` tương ứng.
*   **Alternative Flow**: -
*   **Postconditions**: Xóa bản ghi lịch sử du lịch.
*   **Source File**: [travel-history.router.ts:L15](file:///d:/Thuc_Tap_NDT/backend/src/modules/travel-history/routes/travel-history.router.ts#L15)

#### UC_TRIP_22: Xem gợi ý điểm đến từ AI (View AI Recommendations)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Đã cập nhật TravelPreferences.
*   **Main Flow**: Truy cập trang đề xuất -> Hệ thống so khớp category sở thích với Destination -> Trả về danh sách chấm điểm giảm dần.
*   **Alternative Flow**: Chưa chọn sở thích -> Gợi ý các địa danh thịnh hành mặc định.
*   **Postconditions**: Hiển thị danh sách gợi ý cá nhân hóa.
*   **Source File**: [recommendations.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/recommendations/recommendations.router.ts#L12)

#### UC_TRIP_23: Lưu địa điểm gợi ý AI vào chuyến đi (Save AI Recommendations to Trip)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Trip đã tồn tại và do người dùng sở hữu.
*   **Main Flow**: Chọn địa điểm gợi ý -> Nhấn "Thêm vào lịch trình" -> Tạo bản ghi `Recommendation` liên kết.
*   **Alternative Flow**: Địa điểm đã có trong chuyến đi -> Báo trùng lặp.
*   **Postconditions**: Địa danh được lưu trữ trong danh sách đề xuất chuyến đi.
*   **Source File**: [recommendations.router.ts:L130](file:///d:/Thuc_Tap_NDT/backend/src/modules/recommendations/recommendations.router.ts#L130)

---

### 3.3 Phân hệ Mạng xã hội du lịch (Community & Social Feed)

#### UC_SOC_01: Xem bảng tin cộng đồng (Browse Community Feed)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Mở trang chủ -> Hệ thống trả về danh sách các `Post` mới nhất chưa xóa của cộng đồng.
*   **Alternative Flow**: Mạng gián đoạn -> Hiển thị các bài viết cũ lưu trữ trong cache Local.
*   **Postconditions**: Hiển thị bảng tin xã hội.
*   **Source File**: [posts.router.ts:L23](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L23)

#### UC_SOC_02: Xem chi tiết bài viết (View Post Details)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: Bài viết tồn tại và chưa bị tác giả xóa.
*   **Main Flow**: Nhấn vào bài viết -> Tải nội dung chi tiết và danh sách bình luận.
*   **Alternative Flow**: Bài viết đã bị xóa -> Hiển thị "Bài viết không còn tồn tại".
*   **Postconditions**: Hiển thị chi tiết bài viết.
*   **Source File**: [posts.router.ts:L104](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L104)

#### UC_SOC_03: Tạo bài viết mới kèm hình ảnh (Create Post with Media)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Viết nội dung, kéo thả ảnh (chuyển sang Base64) -> Nhấn Đăng -> Tạo bản ghi `Post`.
*   **Alternative Flow**: Dung lượng ảnh quá dung lượng cho phép -> Yêu cầu nén hoặc chọn ảnh khác.
*   **Postconditions**: Bài viết xuất hiện trên Bảng tin.
*   **Source File**: [posts.router.ts:L161](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L161)

#### UC_SOC_04: Chỉnh sửa bài viết cá nhân (Edit Post)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Người dùng sở hữu bài viết đó.
*   **Main Flow**: Nhấn Sửa bài viết -> Thay đổi nội dung/ảnh -> Nhấn Cập nhật -> Ghi đè CSDL.
*   **Alternative Flow**: Bài đăng đã bị khóa -> Không cho phép chỉnh sửa.
*   **Postconditions**: Bài viết được cập nhật nội dung mới.
*   **Source File**: [posts.router.ts:L292](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L292)

#### UC_SOC_05: Xóa bài viết cá nhân (Delete Post)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Người dùng sở hữu bài viết đó.
*   **Main Flow**: Nhấn Xóa bài viết -> Hệ thống thực hiện Soft-delete (cập nhật `deletedAt = now()`).
*   **Alternative Flow**: Hủy thao tác -> Giữ nguyên bài đăng.
*   **Postconditions**: Bài viết biến mất khỏi bảng tin công cộng.
*   **Source File**: [posts.router.ts:L199](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L199)

#### UC_SOC_06: Thích bài viết (Like Post)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Click nút Like -> Hệ thống tạo bản ghi `Like` liên kết và tăng bộ đếm lượt thích.
*   **Alternative Flow**: Đã Like từ trước -> Click lại sẽ xóa bản ghi `Like` (Unlike).
*   **Postconditions**: Trạng thái thích bài viết thay đổi.
*   **Source File**: [posts.router.ts:L219](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L219)

#### UC_SOC_07: Đánh dấu lưu trữ bài viết (Bookmark Post)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Click biểu tượng Bookmark -> Tạo bản ghi `Bookmark` lưu bài viết vào kho cá nhân.
*   **Alternative Flow**: Đã bookmark từ trước -> Click lại sẽ gỡ bỏ bookmark (Unbookmark).
*   **Postconditions**: Bài viết được thêm vào danh mục lưu trữ.
*   **Source File**: [posts.router.ts:L267](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L267)

#### UC_SOC_08: Xem danh sách bài viết đã lưu trữ (View Bookmarked Posts)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Mở "Bài viết đã lưu" -> Lấy danh sách `Bookmark` và hiện nội dung các Post tương ứng.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách bookmark.
*   **Source File**: [posts.router.ts:L410](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L410)

#### UC_SOC_09: Xem danh sách bình luận của bài viết (List Comments on Post)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: Bài viết hợp lệ.
*   **Main Flow**: Mở rộng phần bình luận -> Hệ thống lấy các `Comment` có `postId` tương ứng và phân cấp Reply lồng nhau.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách bình luận.
*   **Source File**: [posts.router.ts:L330](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L330)

#### UC_SOC_10: Viết bình luận cho bài viết (Write Comment on Post)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Nhập bình luận -> Nhấn gửi -> Tạo bản ghi `Comment` mới -> Gửi thông báo đến chủ bài viết.
*   **Alternative Flow**: Bình luận trống -> Không cho phép gửi.
*   **Postconditions**: Bình luận mới được hiển thị ngay lập tức dưới bài viết.
*   **Source File**: [posts.router.ts:L353](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L353)

#### UC_SOC_11: Viết phản hồi cho bình luận khác (Reply to Comment)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bình luận cha (parent comment) vẫn tồn tại.
*   **Main Flow**: Nhấn "Trả lời" -> Nhập nội dung -> Nhấn gửi -> Tạo bản ghi `Comment` với `parentId = cha` -> Gửi thông báo cho người bình luận trước.
*   **Alternative Flow**: Bình luận cha bị xóa trong lúc soạn thảo -> Báo lỗi.
*   **Postconditions**: Phản hồi được lồng dưới bình luận cha.
*   **Source File**: [posts.router.ts:L353](file:///d:/Thuc_Tap_NDT/backend/src/modules/posts/posts.router.ts#L353)

#### UC_SOC_12: AI gợi ý kết đôi bạn đồng hành (AI Companion Matching)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Cả hai người dùng đều cập nhật TravelPreferences.
*   **Main Flow**: Chọn "Tìm bạn phượt" -> Hệ thống gọi AI so khớp điểm tương thích và trả về score -> Tạo bản ghi `TravelerMatch`.
*   **Alternative Flow**: Không tìm thấy ai có cùng sở thích -> Hiện "Hãy điều chỉnh bộ lọc để tìm bạn đồng hành".
*   **Postconditions**: Hiển thị danh sách bạn đồng hành đề xuất.
*   **Source File**: [schema.prisma:L456](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma#L456)

---

### 3.4 Phân hệ Bản đồ & Định vị (Interactive GIS Map & Live Tracking)

#### UC_MAP_01: Xem bản đồ tương tác Leaflet (View Interactive GIS Map)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: OpenStreetMap
*   **Preconditions**: Trình duyệt kết nối mạng.
*   **Main Flow**: Vào mục Bản đồ -> Hiển thị bản đồ Leaflet tích hợp các ghim điểm đến và địa điểm check-in.
*   **Alternative Flow**: Ngoại tuyến -> Load bản đồ từ cache địa phương (nếu có).
*   **Postconditions**: Hiển thị bản đồ với các markers tương tác.
*   **Source File**: [MapDashboard.tsx:L13](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx#L13)

#### UC_MAP_02: Thực hiện check-in địa điểm (Perform Check-in at Destination)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenStreetMap
*   **Preconditions**: Đã định vị được địa điểm du lịch.
*   **Main Flow**: Chọn địa điểm -> Nhập ghi chú, tải ảnh check-in -> Nhấn Check-in -> Lưu bản ghi `CheckIn` mới.
*   **Alternative Flow**: Địa danh không nằm trong dữ liệu -> Geocoding lấy tọa độ và thêm tạm vào bản ghi check-in.
*   **Postconditions**: Điểm check-in mới được ghim lên bản đồ.
*   **Source File**: [map.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L12)

#### UC_MAP_03: Xem danh sách địa điểm đã check-in (View Check-ins List)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Click tab "Lịch sử check-in" -> Hiển thị danh sách các lượt check-in gần đây của cộng đồng.
*   **Alternative Flow**: -
*   **Postconditions**: Danh sách được hiển thị.
*   **Source File**: [map.router.ts:L42](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L42)

#### UC_MAP_04: Xem danh sách check-in xung quanh vị trí (List Nearby Check-ins)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: Thiết bị đã cấp quyền định vị vị trí GPS.
*   **Main Flow**: Bật vị trí -> Hệ thống tính toán bounding box -> Trả về danh sách check-in trong bán kính radius (Km).
*   **Alternative Flow**: Không cấp quyền GPS -> Dựa vào địa chỉ thủ công hoặc trung tâm mặc định.
*   **Postconditions**: Hiện các check-in lân cận.
*   **Source File**: [map.router.ts:L65](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L65)

#### UC_MAP_05: Trích xuất GPS từ siêu dữ liệu ảnh chụp (EXIF GPS Extraction)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: File ảnh tải lên chứa metadata GPS gốc.
*   **Main Flow**: Upload ảnh chụp du lịch -> Thư viện Javascript đọc EXIF -> Tự điền tọa độ Lat/Lng và tiêu đề ảnh lên giao diện check-in bản đồ.
*   **Alternative Flow**: Ảnh không chứa metadata GPS -> Hiện cảnh báo "Không tìm thấy dữ liệu vị trí trên ảnh, vui lòng ghim thủ công".
*   **Postconditions**: Nhận diện thành công tọa độ để tạo check-in.
*   **Source File**: [MapDashboard.tsx:L31](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx#L31)

#### UC_MAP_06: Cập nhật vị trí hiện tại (Update Current Live Location)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Thiết lập live tracking ở trạng thái ON.
*   **Main Flow**: Trình duyệt thu thập GPS -> Gửi định kỳ qua HTTP PUT hoặc WebSocket `ping_location` -> Cập nhật tọa độ trong `Location` model.
*   **Alternative Flow**: Mất sóng GPS -> Giữ nguyên vị trí cuối cùng và báo offline.
*   **Postconditions**: Cơ sở dữ liệu vị trí trực tiếp được cập nhật.
*   **Source File**: [map.router.ts:L101](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L101)

#### UC_MAP_07: Xem vị trí live của bạn bè trên bản đồ (Track Friends Live Locations)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã follow và bạn bè đang chia sẻ vị trí trực tuyến.
*   **Main Flow**: Mở bản đồ live -> Nhận tín hiệu `friend_location_updated` qua WebSocket -> Vẽ avatar di động của bạn bè trên bản đồ thời gian thực.
*   **Alternative Flow**: Bạn bè tắt chia sẻ -> Biểu tượng biến mất khỏi bản đồ.
*   **Postconditions**: Theo dõi thời gian thực tọa độ bạn bè.
*   **Source File**: [map.router.ts:L126](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L126)

#### UC_MAP_08: Tra cứu danh sách địa điểm du lịch trên bản đồ (Search & Filter Destinations)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: OpenStreetMap
*   **Preconditions**: -
*   **Main Flow**: Nhập tên điểm đến, chọn category (hotel, restaurant) -> Bản đồ lọc các markers trùng khớp.
*   **Alternative Flow**: Không tìm thấy -> Hiện bản đồ trống.
*   **Postconditions**: Lọc thành công danh sách điểm đến hiển thị.
*   **Source File**: [map.router.ts:L151](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L151)

#### UC_MAP_09: Xem danh sách cảnh báo an toàn thiên tai (View Safety Warnings)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Mở bản đồ -> Hệ thống tự hiển thị các vùng tròn đỏ biểu thị sạt lở, lũ lụt, cấm đường đang hiệu lực.
*   **Alternative Flow**: Không có cảnh báo -> Bản đồ hiển thị bình thường.
*   **Postconditions**: Hiển thị đầy đủ cảnh báo an toàn.
*   **Source File**: [map.router.ts:L189](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L189)

#### UC_MAP_10: Tạo cảnh báo an toàn mới trên bản đồ (Submit Safety Warning)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Phát hiện sự cố thực tế tại điểm đến.
*   **Main Flow**: Click tọa độ trên bản đồ -> Chọn loại sự cố (Lũ lụt, sạt lở, rào đường) -> Nhấn gửi -> Tạo bản ghi `SafetyWarning` mới.
*   **Alternative Flow**: Thiếu mô tả sự cố -> Báo lỗi.
*   **Postconditions**: Vùng cảnh báo mới xuất hiện cho toàn bộ người dùng khác thấy.
*   **Source File**: [map.router.ts:L239](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L239)

#### UC_MAP_11: Xem danh sách sự kiện meetup địa phương (View Local Events List)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Chọn mục "Sự kiện" trên bản đồ -> Hiển thị danh sách meetup, tour, lễ hội đang sắp diễn ra.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách sự kiện.
*   **Source File**: [map.router.ts:L268](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L268)

#### UC_MAP_12: Tạo sự kiện meetup mới tại địa điểm du lịch (Create Local Event)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Chọn tọa độ/địa danh -> Nhập Tiêu đề, số người tối đa, ngày tổ chức -> Tạo bản ghi `Event`.
*   **Alternative Flow**: Điền ngày diễn ra trong quá khứ -> Báo lỗi thời gian sự kiện.
*   **Postconditions**: Sự kiện mới được ghim lên bản đồ du lịch.
*   **Source File**: [map.router.ts:L324](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L324)

#### UC_MAP_13: Đăng ký tham gia sự kiện meetup (Join Local Event)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Sự kiện còn trống chỗ (CurrentCount < MaxAttendees).
*   **Main Flow**: Nhấn "Tham gia sự kiện" -> Tạo bản ghi `EventAttendee` -> Tăng biến `currentCount` sự kiện lên 1.
*   **Alternative Flow**: Đã đầy chỗ -> Nút chuyển sang vô hiệu hóa kèm nhãn "Hết chỗ".
*   **Postconditions**: Người dùng được ghi danh vào danh sách tham gia meetup.
*   **Source File**: [schema.prisma:L440](file:///d:/Thuc_Tap_NDT/backend/prisma/schema.prisma#L440)

#### UC_MAP_14: Xem thông tin thời tiết địa phương (View Weather Details)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Chọn một tọa độ trên bản đồ.
*   **Main Flow**: Click biểu tượng thời tiết -> Hệ thống lấy thông tin dự báo thời tiết tại tọa độ GPS.
*   **Alternative Flow**: Không lấy được API thời tiết -> Hiển thị "Không có thông tin dự báo tại tọa độ này".
*   **Postconditions**: Hiển thị nhiệt độ, trạng thái thời tiết.
*   **Source File**: [map.router.ts:L506](file:///d:/Thuc_Tap_NDT/backend/src/modules/map/map.router.ts#L506)

#### UC_MAP_15: Xem danh sách địa điểm đã lưu cá nhân (View Saved Places List)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Click tab "Địa điểm đã ghim" -> Hiển thị danh sách các `SavedPlace` cá nhân hóa.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách địa điểm.
*   **Source File**: [saved-place.router.ts:L13](file:///d:/Thuc_Tap_NDT/backend/src/modules/saved-places/routes/saved-place.router.ts#L13)

#### UC_MAP_16: Ghim lưu địa điểm trên bản đồ (Pin & Save Place)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Điểm đến hợp lệ.
*   **Main Flow**: Nhấn ghim lưu -> Chọn nhóm danh mục (nhà hàng, ks, danh lam) -> Lưu bản ghi `SavedPlace` mới.
*   **Alternative Flow**: Địa điểm đã được ghim trước đó -> Chuyển thành gỡ ghim (Xóa bản ghi).
*   **Postconditions**: Địa điểm được thêm vào danh mục ghim yêu thích.
*   **Source File**: [saved-place.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/saved-places/routes/saved-place.router.ts#L12)

#### UC_MAP_17: Cập nhật thông tin địa điểm đã lưu (Update Saved Place)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bản ghi SavedPlace tồn tại.
*   **Main Flow**: Sửa đổi ghi chú hoặc phân loại danh mục địa điểm -> Nhấn Lưu -> Hệ thống update dữ liệu.
*   **Alternative Flow**: -
*   **Postconditions**: Thay đổi ghim được lưu lại.
*   **Source File**: [saved-place.router.ts:L14](file:///d:/Thuc_Tap_NDT/backend/src/modules/saved-places/routes/saved-place.router.ts#L14)

#### UC_MAP_18: Xóa địa điểm lưu khỏi bản đồ (Delete Saved Place)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bản ghi SavedPlace tồn tại.
*   **Main Flow**: Nhấn Xóa ghim -> Backend xóa bản ghi `SavedPlace` tương ứng.
*   **Alternative Flow**: -
*   **Postconditions**: Địa điểm bị loại khỏi danh sách ghim cá nhân.
*   **Source File**: [saved-place.router.ts:L15](file:///d:/Thuc_Tap_NDT/backend/src/modules/saved-places/routes/saved-place.router.ts#L15)

#### UC_MAP_19: Tải bản đồ ngoại tuyến (Cache Map Tiles - Frontend Only)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Click "Tải bản đồ ngoại tuyến" -> Hệ thống chạy tiến trình tải ô bản đồ xung quanh khu vực và lưu vào Local storage.
*   **Alternative Flow**: Bộ nhớ thiết bị đầy -> Báo lỗi không thể tải.
*   **Postconditions**: Lưu trữ cache bản đồ hoạt động offline.
*   **Source File**: [MapDashboard.tsx:L427](file:///d:/Thuc_Tap_NDT/frontend/src/features/map/MapDashboard.tsx#L427)

---

### 3.5 Phân hệ Trợ lý ảo AI & RAG (AI Chatbot & RAG)

#### UC_AI_01: Khởi tạo cuộc hội thoại chat mới (Create New Chat Session)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Nhấn "Tạo hội thoại mới" -> Tạo bản ghi `ChatConversation` trống.
*   **Alternative Flow**: -
*   **Postconditions**: Bắt đầu màn hình đàm thoại trống mới.
*   **Source File**: [chatbot.router.ts:L14](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L14)

#### UC_AI_02: Xem danh sách lịch sử cuộc chat (List Chat Conversations)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Mở thanh sidebar chat -> Lấy và hiển thị danh sách các `ChatConversation` của userId.
*   **Alternative Flow**: Chưa có hội thoại -> Hiện màn hình trống.
*   **Postconditions**: Danh sách hội thoại hiển thị đầy đủ.
*   **Source File**: [chatbot.router.ts:L15](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L15)

#### UC_AI_03: Xem chi tiết cuộc hội thoại chat (View Chat Details)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập và là chủ hội thoại.
*   **Main Flow**: Click vào tiêu đề cuộc chat -> Tải toàn bộ `ChatMessage` và hiển thị lịch sử nhắn tin.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị lịch sử chat.
*   **Source File**: [chatbot.router.ts:L16](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L16)

#### UC_AI_04: Xóa phiên hội thoại chat (Delete Chat Conversation)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Phiên hội thoại tồn tại.
*   **Main Flow**: Click Xóa -> Xóa toàn bộ cascade ChatMessage và ChatMessageVersion của phiên chat.
*   **Alternative Flow**: -
*   **Postconditions**: Phiên chat bị gỡ khỏi sidebar.
*   **Source File**: [chatbot.router.ts:L17](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L17)

#### UC_AI_05: Trò chuyện chatbot đa Agent (Send Message to Chatbot)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API, vietnamadminunits, OpenStreetMap
*   **Preconditions**: Phiên hội thoại đang hoạt động.
*   **Main Flow**: Nhập câu hỏi -> Gửi -> Hệ thống định tuyến sang các Agents tương ứng (Food, Travel, RAG) -> Trả về câu trả lời.
*   **Alternative Flow**: Mất kết nối internet/API nghẽn -> Thông báo lỗi gửi tin nhắn.
*   **Postconditions**: Tin nhắn được lưu lại trong CSDL ChatMessage.
*   **Source File**: [chatbot.router.ts:L20](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L20)

#### UC_AI_06: Yêu cầu chatbot sinh lại phản hồi (Regenerate AI Response)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Có tin nhắn phản hồi của Assistant trước đó.
*   **Main Flow**: Click biểu tượng Regenerate -> AI tạo câu trả lời mới -> Lưu bản ghi `ChatMessageVersion` mới.
*   **Alternative Flow**: Không tìm thấy tin nhắn gốc -> Báo lỗi hệ thống.
*   **Postconditions**: Phản hồi được thay thế bằng phiên bản mới trên giao diện chat.
*   **Source File**: [chatbot.router.ts:L21](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L21)

#### UC_AI_07: Đánh giá chất lượng câu trả lời AI (Rate AI Chat Response)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Tin nhắn AI tồn tại.
*   **Main Flow**: Nhấn biểu tượng Thích/Không thích (hoặc đánh giá sao) -> Nhập góp ý -> Lưu bản ghi `AIFeedback`.
*   **Alternative Flow**: Đã đánh giá trước đó -> Ghi đè đánh giá mới.
*   **Postconditions**: Lưu đánh giá chất lượng phục vụ kiểm toán AI.
*   **Source File**: [feedback.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/feedback/routes/feedback.router.ts#L12)

#### UC_AI_08: Xem cấu hình Bộ nhớ AI (View AI Memory Configuration)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã tạo tài khoản và đăng nhập.
*   **Main Flow**: Mở cài đặt Trợ lý ảo -> Hiển thị danh sách các ghi nhớ thói quen mà AI đã ghi chép (`AIMemory`).
*   **Alternative Flow**: Bộ nhớ trống -> Hiện thông báo "AI chưa có ghi nhớ thói quen nào của bạn".
*   **Postconditions**: Hiển thị bộ nhớ AI.
*   **Source File**: [chatbot.router.ts:L24](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L24)

#### UC_AI_09: Cập nhật cấu hình Bộ nhớ AI (Update AI Memory)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Bản ghi AIMemory tồn tại.
*   **Main Flow**: Sửa đổi thủ công các thói quen lưu trữ (ngân sách, ẩm thực, pac) -> Lưu -> Cập nhật CSDL.
*   **Alternative Flow**: -
*   **Postconditions**: Thay đổi bộ nhớ AI được cập nhật thành công.
*   **Source File**: [chatbot.router.ts:L25](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L25)

#### UC_AI_10: Xóa cấu hình Bộ nhớ AI (Clear AI Memory)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Có bản ghi thói quen trong bộ nhớ.
*   **Main Flow**: Click "Xóa bộ nhớ AI" -> Hệ thống xóa bản ghi `AIMemory` tương ứng của người dùng.
*   **Alternative Flow**: -
*   **Postconditions**: Toàn bộ thói quen đã lưu bị gỡ bỏ khỏi hệ thống.
*   **Source File**: [chatbot.router.ts:L27](file:///d:/Thuc_Tap_NDT/backend/src/modules/chatbot/routes/chatbot.router.ts#L27)

#### UC_AI_11: Xem cẩm nang món ngon yêu thích (View Favorite Foods List)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Đã đăng nhập.
*   **Main Flow**: Vào "Cẩm nang ẩm thực" -> Lấy danh sách các `FavoriteFood` tương ứng của userId.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị danh sách món đặc sản yêu thích.
*   **Source File**: [favorite-food.router.ts:L13](file:///d:/Thuc_Tap_NDT/backend/src/modules/favorite-foods/routes/favorite-food.router.ts#L13)

#### UC_AI_12: Lưu món ngon đặc sản vào ẩm thực yêu thích (Add Favorite Food)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Chọn món ngon từ chatbot gợi ý -> Nhấn "Yêu thích" -> Tạo bản ghi `FavoriteFood` mới.
*   **Alternative Flow**: Trùng tên món ăn -> Báo trùng lặp.
*   **Postconditions**: Món ăn được lưu vào cẩm nang ẩm thực.
*   **Source File**: [favorite-food.router.ts:L12](file:///d:/Thuc_Tap_NDT/backend/src/modules/favorite-foods/routes/favorite-food.router.ts#L12)

#### UC_AI_13: Cập nhật thông tin món ăn đã lưu (Update Favorite Food)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Món ăn đã được lưu trước đó.
*   **Main Flow**: Chỉnh sửa ghi chú, rating hoặc khu vực món ăn -> Nhấn Lưu -> Hệ thống update dữ liệu.
*   **Alternative Flow**: -
*   **Postconditions**: Lưu thông tin cập nhật món đặc sản.
*   **Source File**: [favorite-food.router.ts:L14](file:///d:/Thuc_Tap_NDT/backend/src/modules/favorite-foods/routes/favorite-food.router.ts#L14)

#### UC_AI_14: Xóa đặc sản khỏi ẩm thực yêu thích (Delete Favorite Food)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: -
*   **Preconditions**: Món ăn đã được lưu.
*   **Main Flow**: Nhấn Xóa món ăn -> Backend xóa bản ghi `FavoriteFood` tương ứng.
*   **Alternative Flow**: -
*   **Postconditions**: Món đặc sản bị gỡ bỏ khỏi cẩm nang ẩm thực.
*   **Source File**: [favorite-food.router.ts:L15](file:///d:/Thuc_Tap_NDT/backend/src/modules/favorite-foods/routes/favorite-food.router.ts#L15)

#### UC_AI_15: Trích xuất tri thức sâu bằng RAG (RAG Deep Semantic Search)
*   **Actor**: Người dùng đăng ký
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Đang tương tác trong phiên chat hoặc ô tìm kiếm tri thức sâu.
*   **Main Flow**: Nhập câu hỏi phức tạp -> Chuyển sang embeddings -> Tìm kiếm cosine similarity trên bảng `KnowledgeQuestion` -> Rút trích `KnowledgeContent` tương ứng trả về kết quả.
*   **Alternative Flow**: Không tìm thấy độ tương đồng phù hợp -> Chuyển sang sinh câu trả lời LLM cơ bản và báo thiếu tài liệu.
*   **Postconditions**: Hiển thị tri thức sâu đã đối chiếu.
*   **Source File**: [rag.router.ts:L9](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag/routes/rag.router.ts#L9)

#### UC_AI_16: Xem cẩm nang văn hóa ẩm thực (Browse Culture & Food Guide - Frontend Only)
*   **Actor**: Khách vãng lai
*   **Supporting Actor**: -
*   **Preconditions**: -
*   **Main Flow**: Mở "Cẩm nang tĩnh" -> Lọc theo danh mục (Lễ hội, văn hóa, ẩm thực) -> Giao diện hiển thị các bài viết tĩnh từ tệp tin dữ liệu cứng ở Frontend.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị cẩm nang tĩnh.
*   **Source File**: [CultureFoodGuidePage.tsx:L100](file:///d:/Thuc_Tap_NDT/frontend/src/features/guide/CultureFoodGuidePage.tsx#L100)

---

### 3.6 Phân hệ Quản trị & Vận hành (System Administration)

#### UC_ADM_01: Xem biểu đồ xu hướng lập lịch trình (View Trip Trends Analytics)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: Đăng nhập quyền Admin.
*   **Main Flow**: Mở trang AdminDashboard -> Hệ thống thống kê và tổng hợp các `Trip` tạo ra theo từng tháng dạng line chart.
*   **Alternative Flow**: Chưa có dữ liệu chuyến đi -> Hiện biểu đồ trống.
*   **Postconditions**: Biểu đồ hiển thị chính xác số liệu xu hướng.
*   **Source File**: [analytics.router.ts:L162](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics/analytics.router.ts#L162)

#### UC_ADM_02: Xem bản đồ nhiệt độ check-in GIS (View GIS Check-in Heatmap)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: Quyền Admin.
*   **Main Flow**: Truy cập tab Heatmap -> Thống kê tọa độ 500 điểm check-in gần đây -> Render các điểm màu đậm nhạt biểu thị mật độ điểm đến hot.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị bản đồ nhiệt độ check-in.
*   **Source File**: [analytics.router.ts:L134](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics/analytics.router.ts#L134)

#### UC_ADM_03: Xem biểu đồ tương tác mạng xã hội (View Social Graph Analytics)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: Quyền Admin.
*   **Main Flow**: Truy cập tab Social -> Hệ thống thống kê các bài đăng có tương tác cao nhất (lượt thích, bình luận) dưới dạng bảng xếp hạng.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị số liệu tương tác.
*   **Source File**: [analytics.router.ts:L98](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics/analytics.router.ts#L98)

#### UC_ADM_04: Xem thống kê lịch sử cuộc gọi AI (View AI Usage Analytics)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: Quyền Admin.
*   **Main Flow**: Truy cập tab AI Usage -> Lấy thông tin nhóm cuộc gọi AI trên bảng `AIHistory` và hiển thị lịch sử 10 câu prompt gần đây.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị số liệu sử dụng AI.
*   **Source File**: [analytics.router.ts:L71](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics/analytics.router.ts#L71)

#### UC_ADM_05: Xem thống kê hoạt động tổng thể (View Platform Stats Analytics)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: Quyền Admin.
*   **Main Flow**: Truy cập Dashboard chính -> Hiển thị tổng số Users, Trips, Posts, Checkins, AI Requests.
*   **Alternative Flow**: -
*   **Postconditions**: Hiển thị thống kê tổng quan.
*   **Source File**: [analytics.router.ts:L11](file:///d:/Thuc_Tap_NDT/backend/src/modules/analytics/analytics.router.ts#L11)

#### UC_ADM_06: Nạp tài liệu tri thức văn hóa RAG (Ingest RAG Knowledge Base Document)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: OpenAI API
*   **Preconditions**: Tài liệu nạp có định dạng văn bản hợp lệ.
*   **Main Flow**: Admin tải tài liệu lên -> Máy chủ phân đoạn nội dung -> OpenAI sinh vector embedding 1536 chiều -> Lưu trữ vào CSDL `KnowledgeContent`, `KnowledgeQuestion`, `KnowledgeAnswer`.
*   **Alternative Flow**: Lỗi API OpenAI -> Hoàn tác và thông báo lỗi.
*   **Postconditions**: Nạp tài liệu vào kho tri thức RAG thành công.
*   **Source File**: [rag.router.ts:L8](file:///d:/Thuc_Tap_NDT/backend/src/modules/rag/routes/rag.router.ts#L8)

#### UC_ADM_07: Chuẩn hóa dữ liệu thô địa phương (Sanitize Ca Mau local JSON data)
*   **Actor**: Quản trị viên
*   **Supporting Actor**: -
*   **Preconditions**: File dữ liệu Cà Mau thô tồn tại trên máy chủ.
*   **Main Flow**: Thực thi API `/clean-camau-json` -> Chạy kịch bản làm sạch chuỗi địa phương, loại bỏ ký tự rác, chuẩn hóa Lat/Lng -> Cập nhật trực tiếp vào tệp lưu trữ CSDL địa danh.
*   **Alternative Flow**: Lỗi cấu trúc file -> Dừng script và xuất file log lỗi.
*   **Postconditions**: Dữ liệu thô được chuẩn hóa thành dữ liệu sạch.
*   **Source File**: [main.py:L37](file:///d:/Thuc_Tap_NDT/ai-service/app/main.py#L37)

---

## IV. BẢN KIỂM TOÁN CHẤT LƯỢNG NGHIỆP VỤ (BUSINESS QUALITY AUDIT FINDINGS)

### 1. Phát hiện Use Case bị thiếu (Missing Use Cases)
*   **Hành trình tự do (Itinerary)**: Bị thiếu trong các tài liệu thiết kế sơ bộ trước đây. Đây là một phân hệ CRUD hoàn chỉnh, hỗ trợ người dùng tự thiết kế dòng thời gian tùy chọn không ràng buộc theo dữ liệu địa danh của OSM.
*   **Lịch sử du lịch thực tế (TravelHistory Entry)**: Hỗ trợ người dùng ghi nhật ký chi tiêu và đánh giá sau khi hoàn thành chuyến đi.
*   **Quản lý ghim địa điểm (SavedPlace)**: CRUD địa điểm yêu thích trên bản đồ số.
*   **Meetup sự kiện du lịch (Event & EventAttendee)**: Hỗ trợ người dùng tạo điểm giao lưu và đăng ký gia nhập meetup của nhóm phượt.

### 2. Phát hiện Use Case bị trùng (Duplicate Use Cases)
*   `Login` và `Google SSO`: Được thiết kế độc lập ở API nhưng ở góc độ Nghiệp vụ (Business Flow) có thể gộp chung thành một gói nghiệp vụ lớn **Đăng nhập hệ thống** với hai luồng rẻ nhánh (Alternative Flows).
*   `Update Live Location` và `Location Ping`: Là các luồng định vị, đã được hợp nhất thành một để phản ánh đúng dòng dữ liệu GPS.

### 3. Phát hiện Use Case gộp sai (Wrongly Merged Use Cases)
*   **"Tương tác bài đăng"**: Bị gộp sai trong thiết kế cũ. Để vẽ sơ đồ Use Case UML 2.5 chính xác, đã phân rã thành: Tạo bài viết, sửa bài viết, xóa bài viết, thích bài đăng, bookmark bài đăng, xem bình luận, viết bình luận, và viết phản hồi bình luận.

### 4. Phát hiện CRUD chưa đầy đủ (Incomplete CRUD)
*   **Bình luận (Comments)**: Người dùng chỉ có quyền Tạo (`POST /comments`) và Xem (`GET /comments`), hoàn toàn **thiếu chức năng Chỉnh sửa (Update) và Xóa (Delete) bình luận**. Đây là một lỗ hổng thiết kế CRUD nghiệp vụ cần khắc phục ở Backend.

### 5. Phát hiện chức năng chưa được mô hình hóa (Unmodeled Features)
*   **Real-time Collaborative Planning (Co-planning)**: CSDL Backend có thiết lập phòng Socket.io (`join_trip_room`, `trip_updated`) để đồng bộ thời gian thực khi hai người cùng sửa một chuyến đi. Tuy nhiên, chức năng này chưa được thiết kế chi tiết trong Use Case và Frontend chưa tích hợp UI đầy đủ.

### 6. Phát hiện chức năng chỉ tồn tại ở Frontend (Frontend-only Features)
*   **EXIF GPS Extraction**: Đọc siêu dữ liệu ảnh chụp để định vị điểm check-in. Thực hiện hoàn toàn ở trình duyệt, không thông qua API Backend.
*   **Offline Map Caching**: Tải và lưu trữ ô bản đồ ngoại tuyến, thực thi lưu trữ trực tiếp trên LocalStorage/IndexedDB của trình duyệt.
*   **Culture Food Static Guide**: Trang cẩm nang ẩm thực tĩnh đọc dữ liệu cứng từ Frontend.

### 7. Phát hiện chức năng chỉ tồn tại ở Backend (Backend-only Features / API no UI)
*   **RAG Ingestion API (`POST /rag/document`)**: API tải tài liệu nạp tri thức đã hoàn thành ở Backend nhưng ở giao diện AdminDashboard trên Frontend chưa thiết kế form upload tài liệu cho Admin.
*   **Ca Mau JSON Sanitization (`GET /clean-camau-json`)**: Endpoint chuẩn hóa địa danh Cà Mau thô chưa được xây dựng UI, Admin đang gọi thủ công qua Swagger/Postman hoặc script cmd.

---

## V. TỔNG SỐ USE CASE NGHIỆP VỤ CUỐI CÙNG (FINAL ESTIMATION METRICS)

Sau khi kiểm toán và phân rã chi tiết, số lượng Use Case nghiệp vụ chính xác của hệ thống SmartTravel là **92 Use Cases** (bao gồm cả các tính năng chỉ chạy ở Frontend/Backend).

---

## VI. BÁO CÁO MỨC ĐỘ SẴN SÀNG CHO UML (UML READINESS REPORT)

1.  **Tính đầy đủ (Completeness)**: Đã quét 100% mã nguồn thực tế của dự án. Tất cả Use Cases đều được xác định rõ: Tác nhân kích hoạt, tiền/hậu điều kiện và địa chỉ dòng mã cụ thể trong thư mục workspace.
2.  **Độ chính xác chuẩn UML 2.5**: Phân tách rõ ràng giữa tác nhân con người (Primary Actors) và tác nhân hệ thống hỗ trợ (Supporting Systems), đồng thời lọc bỏ hoàn toàn các chức năng ngầm về kỹ thuật để chỉ tập trung vào nghiệp vụ người dùng.
3.  **Hệ tài liệu**: Tài liệu kiểm toán này đã được đồng bộ hóa thành công vào tệp tin của workspace tại địa chỉ: [UseCaseAnalysisReport.md](file:///d:/Thuc_Tap_NDT/docs/uml/usecase/UseCaseAnalysisReport.md) để làm căn cứ vững chắc cho việc thiết kế sơ đồ Master Use Case Diagram.
