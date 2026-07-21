# IEEE Std 830-1998 Software Requirement Specification (SRS)
## Section 3: Specific Requirements - Use Case Specifications

---

## 1. Authentication Module (Xác thực & Thành viên)

### UC_AUTH_01: Đăng ký tài khoản (Register Account)
*   **Use Case ID**: UC_AUTH_01
*   **Name**: Đăng ký tài khoản (Register Account)
*   **Goal**: Cho phép Khách vãng lai tạo tài khoản thành viên mới trong hệ thống.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: SMTP Mail Server (NodeMailer)
*   **Preconditions**: Khách vãng lai chưa đăng nhập và sử dụng email chưa từng đăng ký trên hệ thống.
*   **Trigger**: Khách vãng lai truy cập màn hình đăng ký và nhấn nút "Đăng ký".
*   **Main Success Scenario**:
    1. Người dùng nhập Email, Mật khẩu, Tên hiển thị vào biểu mẫu đăng ký.
    2. Người dùng nhấn nút "Đăng ký".
    3. Hệ thống kiểm tra định dạng email và độ mạnh của mật khẩu (tối thiểu 8 ký tự).
    4. Hệ thống kiểm tra tính duy nhất của email trong CSDL.
    5. Hệ thống mã hóa mật khẩu (sử dụng bcrypt).
    6. Hệ thống tạo bản ghi người dùng mới ở trạng thái `unverified` và tạo mã xác thực email (JWT token hết hạn sau 24h).
    7. Hệ thống kích hoạt SMTP Mail Server gửi email chứa liên kết kích hoạt đến email người dùng.
    8. Hệ thống thông báo yêu cầu người dùng kiểm tra hộp thư email.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Email đã tồn tại*: Tại bước 4, nếu phát hiện email đã đăng ký, hệ thống thông báo lỗi `Email đã được sử dụng` và dừng luồng.
    *   *Mật khẩu yếu*: Tại bước 3, nếu mật khẩu không đạt yêu cầu, hệ thống yêu cầu người dùng nhập lại mật khẩu mạnh hơn.
*   **Postconditions**: Tài khoản mới được tạo ở trạng thái tạm khóa (unverified) chờ xác thực.
*   **Business Rules**: BR_AUTH_01 (Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số).
*   **Related Use Cases**: `UC_AUTH_02` (Xác thực tài khoản qua Email).

---

### UC_AUTH_02: Xác thực tài khoản qua Email (Verify Email)
*   **Use Case ID**: UC_AUTH_02
*   **Name**: Xác thực tài khoản qua Email (Verify Email)
*   **Goal**: Xác thực tính chính xác của email đăng ký để kích hoạt tài khoản thành viên.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: SMTP Mail Server (NodeMailer)
*   **Preconditions**: Tài khoản đã được tạo ở trạng thái `unverified` qua `UC_AUTH_01`.
*   **Trigger**: Người dùng nhấn vào liên kết xác thực gửi trong email.
*   **Main Success Scenario**:
    1. Người dùng nhấn vào liên kết xác thực chứa mã token kích hoạt trong hộp thư email.
    2. Frontend trích xuất mã token và gửi API kiểm tra `GET /api/v1/auth/verify-email?token=...` lên Backend.
    3. Backend giải mã và xác thực token JWT.
    4. Backend đối chiếu thông tin người dùng trong CSDL.
    5. Backend cập nhật trạng thái người dùng thành `verified` (hoạt động) và lưu vết thời gian xác thực.
    6. Hệ thống hiển thị thông báo kích hoạt thành công trên giao diện và điều hướng sang màn hình đăng nhập.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Token hết hạn hoặc không hợp lệ*: Tại bước 3, nếu token hết hạn (quá 24h) hoặc bị chỉnh sửa, Backend trả về mã lỗi `Token không hợp lệ hoặc đã hết hạn`. Hệ thống gợi ý gửi lại mã kích hoạt mới.
*   **Postconditions**: Trạng thái người dùng chuyển thành `verified`, kích hoạt hoàn toàn quyền đăng nhập.
*   **Business Rules**: BR_AUTH_02 (Token kích hoạt chỉ có hiệu lực duy nhất 1 lần và hết hạn sau 24h từ lúc đăng ký).
*   **Related Use Cases**: `UC_AUTH_01` (Đăng ký tài khoản).

---

### UC_AUTH_03: Đăng nhập tài khoản (Log In)
*   **Use Case ID**: UC_AUTH_03
*   **Name**: Đăng nhập tài khoản (Log In)
*   **Goal**: Cung cấp quyền truy cập các tính năng cá nhân hóa của nền tảng cho thành viên.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: Firebase Auth (đối với đăng nhập Google)
*   **Preconditions**: Tài khoản đã được kích hoạt trạng thái `verified`.
*   **Trigger**: Người dùng truy cập màn hình đăng nhập, nhập thông tin đăng nhập hoặc chọn đăng nhập Google.
*   **Main Success Scenario**:
    *   *Luồng đăng nhập truyền thống*:
        1. Người dùng nhập Email và Mật khẩu, nhấn "Đăng nhập".
        2. Backend kiểm tra sự tồn tại của email và đối chiếu hash mật khẩu trong CSDL.
        3. Kiểm tra trạng thái tài khoản.
        4. Backend tạo Access Token (JWT hết hạn sau 15 phút) và Refresh Token (JWT hết hạn sau 7 ngày).
        5. Backend lưu Refresh Token vào HTTP-Only Cookie và trả Access Token cho Frontend.
        6. Frontend lưu Access Token vào bộ nhớ ứng dụng và chuyển sang trang chủ cá nhân.
*   **Alternative Flows**:
    *   *Luồng đăng nhập Google SSO (Alternative Flow A)*:
        1. Người dùng chọn nút "Đăng nhập bằng Google".
        2. Frontend gọi SDK Firebase Auth để yêu cầu người dùng xác thực tài khoản Google.
        3. Firebase trả về client một mã ID Token.
        4. Frontend gửi mã ID Token lên Backend qua API `POST /api/v1/auth/google`.
        5. Backend sử dụng Firebase Admin SDK để giải mã và xác thực tính hợp lệ của token.
        6. Backend kiểm tra email trong CSDL: Nếu chưa có thì tạo tài khoản tự động (OAuth user), nếu có rồi thì liên kết.
        7. Chạy tiếp bước 4, 5, 6 của luồng chính.
*   **Exception Flows**:
    *   *Sai thông tin mật khẩu*: Tại bước 2, nếu sai mật khẩu, Backend trả về lỗi `Sai email hoặc mật khẩu`.
    *   *Tài khoản chưa kích hoạt*: Tại bước 3, nếu tài khoản ở trạng thái `unverified`, Backend trả về thông báo lỗi yêu cầu xác thực email trước khi đăng nhập.
*   **Postconditions**: Người dùng đăng nhập thành công, sở hữu Access Token hoạt động trong phiên làm việc.
*   **Business Rules**: BR_AUTH_03 (Access Token bắt buộc phải gửi ở Header Authorization `Bearer <token>` ở mỗi request API được bảo vệ).
*   **Related Use Cases**: `UC_AUTH_04` (Quản lý hồ sơ & sở thích du lịch).

---

### UC_AUTH_04: Quản lý hồ sơ & sở thích du lịch (Manage Profile & Preferences)
*   **Use Case ID**: UC_AUTH_04
*   **Name**: Quản lý hồ sơ & sở thích du lịch (Manage Profile & Preferences)
*   **Goal**: Cho phép thành viên tự quản lý thông tin cá nhân và cấu hình sở thích du lịch để AI tối ưu gợi ý.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: vietnamadminunits API
*   **Preconditions**: Người dùng đã đăng nhập hệ thống thành công.
*   **Trigger**: Người dùng truy cập trang "Cài đặt tài khoản" / "Sở thích du lịch".
*   **Main Success Scenario**:
    1. Người dùng thay đổi thông tin cá nhân (Tên hiển thị, Ảnh đại diện, Tiểu sử) hoặc cập nhật Sở thích du lịch (Khoảng ngân sách mong muốn, Tốc độ đi, Phong cách ẩm thực ưa thích, Danh sách hoạt động yêu thích).
    2. Người dùng nhấn nút "Lưu thay đổi".
    3. Backend kiểm tra dữ liệu đầu vào.
    4. Backend gọi API `vietnamadminunits` để chuẩn hóa dữ liệu địa phương cư trú (Tỉnh/Thành phố) nếu có cập nhật.
    5. Backend cập nhật thông tin tương ứng vào bảng `Profile` và `TravelPreferences` trong CSDL.
    6. Hệ thống phản hồi cập nhật thành công và cập nhật lại giao diện người dùng.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Địa phương không hợp lệ*: Tại bước 4, nếu API chuẩn hóa báo lỗi tỉnh/thành không tồn tại thực tế, hệ thống từ chối cập nhật và hiển thị lỗi.
*   **Postconditions**: Dữ liệu hồ sơ và tùy chọn sở thích du lịch của người dùng được cập nhật trong CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_TRIP_02` (Tạo lịch trình tự động bằng AI), `UC_SOC_04` (AI gợi ý bạn đồng hành).

---

### UC_AUTH_05: Theo dõi thành viên khác (Follow Members)
*   **Use Case ID**: UC_AUTH_05
*   **Name**: Theo dõi thành viên khác (Follow Members)
*   **Goal**: Thiết lập mối quan hệ theo dõi giữa hai thành viên trên mạng xã hội du lịch để nhận cập nhật.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập và đang xem trang cá nhân của thành viên khác.
*   **Trigger**: Người dùng nhấn nút "Theo dõi" (Follow) hoặc "Bỏ theo dõi" (Unfollow).
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Theo dõi" tại trang hồ sơ của một thành viên khác.
    2. Frontend gửi request `POST /api/v1/social/follow/:targetUserId` lên Backend.
    3. Backend kiểm tra tính hợp lệ của mã người dùng mục tiêu.
    4. Backend ghi nhận bản ghi mới vào bảng `Follow` trong CSDL.
    5. Hệ thống gửi thông báo ngầm (Notification) đến người được theo dõi.
    6. Nút bấm trên giao diện chuyển sang trạng thái "Đang theo dõi" (Following).
*   **Alternative Flows**:
    *   *Hủy theo dõi (Alternative Flow A)*:
        1. Người dùng nhấn nút "Đang theo dõi" (để hủy).
        2. Backend kiểm tra và xóa bản ghi liên kết trong bảng `Follow`.
        3. Nút bấm trên giao diện chuyển lại trạng thái "Theo dõi".
*   **Exception Flows**:
    *   *Tự theo dõi chính mình*: Tại bước 3, nếu `targetUserId` trùng với ID của chính người gửi yêu cầu, Backend trả về lỗi `Bạn không thể tự theo dõi chính mình`.
*   **Postconditions**: Mối quan hệ theo dõi được cập nhật trong CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_SOC_01` (Xem bảng tin cộng đồng).

---

## 2. Trip Planning Module (Lập kế hoạch & Tối ưu lộ trình)

### UC_TRIP_01: Quản lý chuyến đi (Manage Travel Itineraries)
*   **Use Case ID**: UC_TRIP_01
*   **Name**: Quản lý chuyến đi (Manage Travel Itineraries)
*   **Goal**: Cung cấp đầy đủ các thao tác CRUD cơ bản để người dùng tự thiết kế lịch trình du lịch cá nhân.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng điều hướng đến mục "Chuyến đi của tôi" và chọn tạo mới, chỉnh sửa hoặc xóa chuyến đi.
*   **Main Success Scenario**:
    *   *Tạo chuyến đi thủ công*:
        1. Người dùng điền tên chuyến đi, ngày bắt đầu, ngày kết thúc và mô tả.
        2. Người dùng nhấn nút "Tạo".
        3. Backend tạo bản ghi mới trong bảng `Trip` với trạng thái mặc định là `draft`.
        4. Người dùng thêm thủ công các Điểm dừng (Destination) và Hoạt động (Activity) cho từng ngày của chuyến đi.
        5. Mỗi hoạt động gồm thông tin: Tên hoạt động, Mô tả, Thời gian bắt đầu, Thời gian kết thúc, Tọa độ địa lý (Latitude/Longitude) và Chi phí ước tính.
        6. Hệ thống tự động tính toán tổng chi phí ước tính và lưu lại.
*   **Alternative Flows**:
    *   *Cập nhật / Xóa lịch trình (Alternative Flow A)*: Người dùng thay đổi thông tin hoạt động hoặc chọn xóa toàn bộ chuyến đi. Hệ thống cập nhật/xóa bản ghi tương ứng trong CSDL.
*   **Exception Flows**:
    *   *Ngày kết thúc trước ngày bắt đầu*: Hệ thống từ chối lưu và báo lỗi logic thời gian.
*   **Postconditions**: Chuyến đi được cập nhật trong CSDL và phản hồi lên màn hình kế hoạch.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_TRIP_03` (Tối ưu hóa TSP).

---

### UC_TRIP_02: Tạo lịch trình tự động bằng AI (AI Itinerary Generation)
*   **Use Case ID**: UC_TRIP_02
*   **Name**: Tạo lịch trình tự động bằng AI (AI Itinerary Generation)
*   **Goal**: Tự động thiết kế toàn bộ lộ trình hoạt động dựa trên mong muốn và ngân sách của người dùng nhờ AI.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenAI API
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng chọn "Tạo lịch trình bằng AI" tại giao diện lập kế hoạch.
*   **Main Success Scenario**:
    1. Người dùng nhập: Điểm đến (Tên địa danh), Số ngày đi, Ngân sách dự kiến, Phong cách du lịch (Nghỉ dưỡng, Khám phá, Tiết kiệm).
    2. Người dùng nhấn nút "Tạo bằng AI".
    3. Backend nhận yêu cầu, xây dựng cấu trúc prompt nghiệp vụ chặt chẽ, gửi yêu cầu sinh lịch trình đến OpenAI API.
    4. OpenAI API phân tích và phản hồi một chuỗi JSON chuẩn chứa danh sách hoạt động, thời gian chi tiết và chi phí dự tính cho từng ngày.
    5. Backend phân tích chuỗi JSON, lưu thông tin vào bảng `Trip` và các bảng liên quan.
    6. Lưu nhật ký truy vấn vào bảng `AIHistory` để thống kê hiệu năng.
    7. Trả dữ liệu chuyến đi hoàn chỉnh cho Frontend hiển thị lên bản đồ và timeline của người dùng.
*   **Alternative Flows**:
    *   *Tái tạo một phần lịch trình (Alternative Flow A)*: Người dùng chọn thay đổi một hoạt động hoặc một ngày lịch trình cụ thể. Hệ thống gửi yêu cầu riêng biệt đến OpenAI để sinh lại lựa chọn thay thế cho phần đó.
*   **Exception Flows**:
    *   *Lỗi kết nối OpenAI hoặc cấu trúc JSON lỗi*: Hệ thống ghi nhận lỗi, tự động thử lại (retry) tối đa 3 lần. Nếu thất bại hoàn toàn, thông báo lỗi `Tạo lịch trình AI không thành công, vui lòng thử lại` và gợi ý chuyển sang lập thủ công.
*   **Postconditions**: Một chuyến đi hoàn chỉnh được thiết lập tự động trong CSDL của người dùng.
*   **Business Rules**: BR_TRIP_01 (Giới hạn tối đa tạo lịch trình bằng AI là 10 lần/ngày trên một tài khoản thường).
*   **Related Use Cases**: `UC_TRIP_01` (Quản lý chuyến đi), `UC_TRIP_03` (Tối ưu hóa TSP).

---

### UC_TRIP_03: Tối ưu hóa lộ trình ngắn nhất (Route Optimization - TSP)
*   **Use Case ID**: UC_TRIP_03
*   **Name**: Tối ưu hóa lộ trình ngắn nhất (Route Optimization - TSP)
*   **Goal**: Sắp xếp thứ tự di chuyển giữa các địa điểm check-in trong ngày một cách khoa học nhất để tiết kiệm thời gian và quãng đường.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Ngày lịch trình hiện tại phải có ít nhất 2 hoạt động có tọa độ GPS hợp lệ.
*   **Trigger**: Người dùng nhấn nút "Tối ưu hóa đường đi" trên giao diện kế hoạch ngày.
*   **Main Success Scenario**:
    1. Người dùng chọn một ngày cụ thể trong chuyến đi và nhấn nút "Tối ưu hóa".
    2. Frontend gửi danh sách tọa độ các điểm dừng của ngày đó lên API `POST /api/v1/trips/optimize-route`.
    3. Backend tính toán ma trận khoảng cách giữa các điểm bằng công thức Haversine.
    4. Kiểm tra số lượng điểm dừng ($N$):
        *   Nếu $N \le 8$: Hệ thống chạy thuật toán duyệt đệ quy vét cạn (Exhaustive Search) tìm ra hoán vị có tổng quãng đường ngắn nhất tuyệt đối.
        *   Nếu $N > 8$: Hệ thống chạy thuật toán tham lam (Greedy / Nearest Neighbor) để tìm lời giải xấp xỉ tối ưu tức thời.
    5. Backend cập nhật lại trường thứ tự (`sequence`) của các hoạt động trong ngày đó trong CSDL.
    6. Lưu thông tin tối ưu vào bảng `AIHistory`.
    7. Trả kết quả danh sách đã sắp xếp và tổng quãng đường ước tính về Frontend.
    8. Frontend cập nhật lại giao diện timeline và vẽ lại các đường nối (polyline) trên bản đồ Leaflet.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Dữ liệu tọa độ bị thiếu*: Nếu có điểm dừng không có tọa độ GPS, hệ thống báo lỗi `Yêu cầu tọa độ GPS hợp lệ để tối ưu hóa` và bỏ qua điểm dừng đó.
*   **Postconditions**: Thứ tự di chuyển của các địa điểm trong ngày được sắp xếp lại tối ưu nhất trong CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_TRIP_01` (Quản lý chuyến đi).

---

### UC_TRIP_04: Nhân bản lịch trình công khai (Clone Public Itineraries)
*   **Use Case ID**: UC_TRIP_04
*   **Name**: Nhân bản lịch trình công khai (Clone Public Itineraries)
*   **Goal**: Giúp người dùng nhanh chóng có lịch trình du lịch dựa trên kế hoạch thành công của người khác.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Lịch trình được sao chép phải ở trạng thái công khai (`public`).
*   **Trigger**: Người dùng nhấn nút "Nhân bản lịch trình" (Clone) khi đang xem chi tiết một chuyến đi công khai.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Nhân bản".
    2. Frontend gửi yêu cầu `POST /api/v1/trips/:id/clone` lên Backend.
    3. Backend kiểm tra chuyến đi gốc có tồn tại và công khai hay không.
    4. Backend tạo bản sao mới của chuyến đi (`Trip`), các ngày (`TripDay`) và các hoạt động (`Activity`) gắn với ID người dùng hiện tại làm chủ sở hữu. Trạng thái bản sao được đặt là `draft`.
    5. Lưu liên kết nguồn sao chép qua trường `cloneSourceId` trong bảng `Trip` để phục vụ thống kê lượt nhân bản.
    6. Hệ thống phản hồi nhân bản thành công và mở trang kế hoạch chuyến đi mới của người dùng.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Chuyến đi gốc đã chuyển sang chế độ riêng tư*: Hệ thống báo lỗi `Chuyến đi này không còn ở chế độ công khai` và hủy thao tác.
*   **Postconditions**: Một bản sao lịch trình mới được thêm vào tài khoản của người dùng.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_TRIP_05` (Tìm kiếm & Tra cứu lịch trình cộng đồng).

---

### UC_TRIP_05: Tìm kiếm & Tra cứu lịch trình cộng đồng (Discover Public Trips)
*   **Use Case ID**: UC_TRIP_05
*   **Name**: Tìm kiếm & Tra cứu lịch trình cộng đồng (Discover Public Trips)
*   **Goal**: Giúp Khách vãng lai và thành viên tìm kiếm các lịch trình mẫu chất lượng cao được chia sẻ.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Không có.
*   **Trigger**: Người dùng nhập từ khóa tìm kiếm điểm đến hoặc lọc danh sách lịch trình tại trang "Khám phá".
*   **Main Success Scenario**:
    1. Người dùng nhập tên điểm đến (ví dụ: "Cà Mau") hoặc lọc theo số ngày, chi phí tại trang khám phá lịch trình.
    2. Frontend gửi request lên API `GET /api/v1/trips/discover/public?search=...`.
    3. Backend truy vấn các chuyến đi trong CSDL có trạng thái là `public`, khớp với các điều kiện tìm kiếm.
    4. Backend trả về danh sách lịch trình kèm theo thông tin tổng quan (tên, số điểm dừng, tổng chi phí, lượt thích, lượt clone).
    5. Hệ thống hiển thị kết quả lên giao diện dạng thẻ danh sách.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Hiển thị danh sách lịch trình phù hợp với tiêu chí tìm kiếm.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_TRIP_04` (Nhân bản lịch trình công khai).

---

### UC_TRIP_06: Quản lý lịch sử đi lại thực tế (Manage Travel History)
*   **Use Case ID**: UC_TRIP_06
*   **Name**: Quản lý lịch sử đi lại thực tế (Manage Travel History)
*   **Goal**: Ghi lại lịch sử hoạt động thực tế đã trải qua để lưu trữ làm kỷ niệm hoặc chia sẻ kinh nghiệm chi tiết.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng truy cập mục "Lịch sử chuyến đi" và chọn thêm nhật ký chuyến đi mới.
*   **Main Success Scenario**:
    1. Người dùng điền: Địa danh đã đi, Ngày đi, Chi phí thực tế đã tiêu dùng, Đánh giá cá nhân (Rating) và Ghi chú kinh nghiệm.
    2. Người dùng nhấn nút "Lưu lịch sử".
    3. Backend xác thực và tạo bản ghi mới trong bảng `TravelHistory` trong CSDL.
    4. Hệ thống cập nhật danh sách lịch sử du lịch trên giao diện hồ sơ của người dùng.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Nhật ký lịch sử đi lại được lưu trữ lâu dài trong CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AUTH_04` (Quản lý hồ sơ & sở thích du lịch).

---

## 3. Community Module (Mạng xã hội & Cộng đồng)

### UC_SOC_01: Xem bảng tin cộng đồng (Browse Community Feed)
*   **Use Case ID**: UC_SOC_01
*   **Name**: Xem bảng tin cộng đồng (Browse Community Feed)
*   **Goal**: Cho phép người dùng duyệt xem các chia sẻ trải nghiệm du lịch từ cộng đồng thành viên.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Không có.
*   **Trigger**: Người dùng truy cập trang chủ Bảng tin cộng đồng.
*   **Main Success Scenario**:
    1. Người dùng truy cập trang chủ của bảng tin.
    2. Frontend gọi API `GET /api/v1/posts`.
    3. Backend truy vấn CSDL lấy danh sách các bài đăng mới nhất ở trạng thái công khai, thực hiện phân trang (pagination).
    4. Trả về danh sách bài đăng kèm thông tin tác giả, hình ảnh, liên kết chuyến đi (nếu có), số lượt thích và bình luận.
    5. Giao diện hiển thị danh sách bài viết cuộn vô hạn (infinite scroll).
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Hiển thị bảng tin cộng đồng thành công.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_SOC_02` (Quản lý bài viết chia sẻ), `UC_SOC_03` (Tương tác bài đăng).

---

### UC_SOC_02: Quản lý bài viết chia sẻ (Manage Blog/Story Posts)
*   **Use Case ID**: UC_SOC_02
*   **Name**: Quản lý bài viết chia sẻ (Manage Blog/Story Posts)
*   **Goal**: Đăng tải các câu chuyện, bài viết chia sẻ kinh nghiệm thực tế về chuyến đi của cá nhân lên bảng tin cộng đồng.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng chọn "Viết bài mới" trên giao diện mạng xã hội.
*   **Main Success Scenario**:
    1. Người dùng nhập tiêu đề, nội dung bài viết, tải lên hình ảnh và tùy chọn liên kết với một lịch trình chuyến đi của mình.
    2. Người dùng nhấn nút "Đăng bài".
    3. Backend xác thực người dùng và lưu trữ hình ảnh tải lên.
    4. Backend tạo bản ghi mới trong bảng `Post` trong CSDL ở chế độ công khai.
    5. Hệ thống hiển thị bài viết mới lên đầu trang bảng tin cộng đồng.
*   **Alternative Flows**:
    *   *Sửa / Xóa bài đăng (Alternative Flow A)*: Người dùng chỉnh sửa nội dung bài đăng hiện tại hoặc chọn xóa vĩnh viễn. Backend cập nhật hoặc thực hiện xóa mềm/xóa cứng bản ghi trong CSDL.
*   **Exception Flows**:
    *   *Tải ảnh quá kích thước cho phép*: Hệ thống từ chối đăng và yêu cầu tải ảnh dung lượng nhỏ hơn.
*   **Postconditions**: Bài đăng mới được công khai lên bảng tin cộng đồng.
*   **Business Rules**: BR_SOC_01 (Mỗi hình ảnh đính kèm bài đăng không vượt quá 5MB và hỗ trợ định dạng jpeg, png).
*   **Related Use Cases**: `UC_SOC_01` (Xem bảng tin cộng đồng).

---

### UC_SOC_03: Tương tác bài đăng cộng đồng (Interact with Posts)
*   **Use Case ID**: UC_SOC_03
*   **Name**: Tương tác bài đăng cộng đồng (Interact with Posts)
*   **Goal**: Tạo ra sự gắn kết, phản hồi thông tin giữa các thành viên mạng xã hội thông qua các hành vi tương tác bài đăng.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng nhấn các nút tương tác (Thích, Bình luận, Đánh dấu) dưới một bài viết trên bảng tin.
*   **Main Success Scenario**:
    *   *Tương tác Thích (Like)*:
        1. Người dùng nhấn nút "Thích".
        2. Backend thêm bản ghi vào bảng `Like` liên kết giữa người dùng và bài viết.
        3. Tăng số đếm thích của bài đăng trên giao diện lên 1 đơn vị. Gửi thông báo đến chủ bài viết.
*   **Alternative Flows**:
    *   *Tương tác Bình luận (Comment - Alternative Flow A)*: Người dùng nhập nội dung bình luận (hỗ trợ bình luận lồng nhau/reply). Backend lưu vào bảng `Comment`. Bình luận hiển thị ngay lập tức dưới bài viết.
    *   *Đánh dấu lưu trữ (Bookmark - Alternative Flow B)*: Người dùng nhấn "Lưu bài viết". Backend thêm liên kết vào bảng `Bookmark` phục vụ việc xem lại sau này tại trang cá nhân.
*   **Exception Flows**: Không có.
*   **Postconditions**: Các tương tác được ghi nhận đầy đủ vào CSDL và gửi thông báo tương ứng đến tác giả bài đăng.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_SOC_01` (Xem bảng tin bảng tin cộng đồng).

---

### UC_SOC_04: AI gợi ý bạn đồng hành tương thích (AI Companion Matching)
*   **Use Case ID**: UC_SOC_04
*   **Name**: AI gợi ý bạn đồng hành tương thích (AI Companion Matching)
*   **Goal**: Giúp tìm kiếm các thành viên khác có cùng chí hướng, phong cách du lịch để kết bạn và cùng đồng hành trong các hành trình du lịch phượt.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenAI API
*   **Preconditions**: Người dùng đã thiết lập đầy đủ thông tin sở thích du lịch (`TravelPreferences`).
*   **Trigger**: Người dùng nhấn chọn mục "Tìm bạn đồng hành" trên menu mạng xã hội.
*   **Main Success Scenario**:
    1. Người dùng truy cập trang gợi ý bạn đồng hành.
    2. Backend lấy thông tin `TravelPreferences` của người dùng hiện tại và các thành viên khác.
    3. Backend chạy thuật toán so khớp cơ bản để lọc ra nhóm 10 ứng viên có điểm tương đồng thô cao nhất.
    4. Backend xây dựng cấu trúc prompt gửi hồ sơ sở thích của người dùng và nhóm ứng viên lên OpenAI API.
    5. OpenAI API phân tích và trả về điểm tương thích chi tiết (Compatibility Score - %) và danh sách lý do phù hợp (Match Reasons).
    6. Backend lưu kết quả so khớp vào bảng `TravelerMatch` làm bộ nhớ đệm cache (hết hạn sau 24 giờ).
    7. Giao diện hiển thị danh sách ứng viên được xếp hạng từ cao xuống thấp kèm nút kết bạn/theo dõi.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Hệ thống thiếu dữ liệu sở thích*: Nếu người dùng chưa cập nhật tùy chọn sở thích du lịch, hệ thống hiển thị thông báo yêu cầu người dùng cấu hình sở thích trước để AI có thể phân tích.
*   **Postconditions**: Gợi ý bạn đồng hành thành công và lưu kết quả khớp vào CSDL.
*   **Business Rules**: BR_SOC_02 (Gợi ý bạn đồng hành AI được tự động cập nhật lại sau mỗi 24 giờ để đảm bảo cập nhật thay đổi mới).
*   **Related Use Cases**: `UC_AUTH_04` (Quản lý hồ sơ & sở thích du lịch), `UC_AUTH_05` (Theo dõi thành viên khác).

---

## 4. Interactive Map Module (Bản đồ tương tác & GIS)

### UC_MAP_01: Xem bản đồ (View Map)
*   **Use Case ID**: UC_MAP_01
*   **Name**: Xem bản đồ (View Map)
*   **Goal**: Hiển thị trực quan bản đồ số cơ sở chứa các điểm du lịch cho khách vãng lai và thành viên.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: Dịch vụ Bản đồ (Map Service)
*   **Preconditions**: Người dùng truy cập vào phần mềm và có kết nối Internet hoạt động.
*   **Trigger**: Người dùng truy cập mục "Bản đồ".
*   **Main Success Scenario**:
    1. Người dùng chọn chức năng Xem bản đồ.
    2. Hệ thống tải lớp bản đồ số thông qua Dịch vụ Bản đồ (Map Service).
    3. Hệ thống hiển thị bản đồ toàn cảnh vùng du lịch kèm các biểu tượng địa điểm nổi bật.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không kết nối mạng*: Hệ thống hiển thị thông báo "Không thể tải bản đồ, vui lòng kiểm tra kết nối mạng".
*   **Postconditions**: Bản đồ cơ sở được hiển thị chính xác.
*   **Related Use Cases**: `UC_MAP_02` (Zoom Map), `UC_MAP_03` (Pan Map), `UC_MAP_04` (Switch Base Map).

---

### UC_MAP_05: Tìm kiếm vị trí (Search Location)
*   **Use Case ID**: UC_MAP_05
*   **Name**: Tìm kiếm vị trí (Search Location)
*   **Goal**: Tìm và định vị vị trí địa lý dựa trên địa danh hoặc tọa độ người dùng nhập.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: API Địa mã hóa (Geocoding API)
*   **Preconditions**: Người dùng đang mở màn hình bản đồ tương tác.
*   **Trigger**: Người dùng nhập tên địa điểm vào ô tìm kiếm và nhấn Enter hoặc biểu tượng Tìm kiếm.
*   **Main Success Scenario**:
    1. Người dùng nhập từ khóa tìm kiếm (Ví dụ: "Mũi Cà Mau").
    2. Hệ thống gửi truy vấn đến API Địa mã hóa (Geocoding API) để tra cứu tọa độ địa lý.
    3. Hệ thống hiển thị danh sách kết quả gợi ý.
    4. Người dùng chọn kết quả mong muốn; hệ thống tự động di chuyển góc nhìn (Pan/Zoom) và ghim vị trí đó trên bản đồ.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không tìm thấy vị trí*: Hệ thống hiển thị thông báo "Không tìm thấy địa điểm phù hợp".
*   **Postconditions**: Vị trí tìm kiếm được ghim và hiển thị đúng tiêu điểm trên bản đồ.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ).

---

### UC_MAP_06: Lọc danh mục địa điểm du lịch (Filter Tourist Categories)
*   **Use Case ID**: UC_MAP_06
*   **Name**: Lọc danh mục địa điểm du lịch (Filter Tourist Categories)
*   **Goal**: Giới hạn hiển thị các điểm đến trên bản đồ theo nhóm loại hình (Ẩm thực, Nghỉ dưỡng, Khám phá).
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Bản đồ đã tải và hiển thị danh sách điểm ghim.
*   **Trigger**: Người dùng tick chọn một hoặc nhiều danh mục trên thanh công cụ lọc địa điểm.
*   **Main Success Scenario**:
    1. Người dùng mở bảng lọc danh mục địa điểm.
    2. Người dùng tick chọn danh mục mong muốn (Ví dụ: "Nhà hàng / Ẩm thực").
    3. Hệ thống xử lý dữ liệu ở client và lọc bỏ các điểm ghim không khớp danh mục lựa chọn.
    4. Bản đồ cập nhật hiển thị chỉ các điểm ghim thuộc danh mục đã lọc.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Bản đồ cập nhật hiển thị chính xác các danh mục được chọn lọc.
*   **Related Use Cases**: `UC_MAP_05` (Search Location).

---

### UC_MAP_07: Xem chi tiết địa điểm du lịch (View Tourist Attraction Details)
*   **Use Case ID**: UC_MAP_07
*   **Name**: Xem chi tiết địa điểm du lịch (View Tourist Attraction Details)
*   **Goal**: Xem thông tin giới thiệu, hình ảnh, bài đánh giá và dịch vụ của một địa điểm du lịch.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đang xem điểm ghim hoặc tìm thấy địa điểm đó từ thanh tìm kiếm.
*   **Trigger**: Người dùng click vào biểu tượng điểm ghim hoặc kết quả tìm kiếm trên bản đồ.
*   **Main Success Scenario**:
    1. Người dùng click vào một điểm ghim địa điểm du lịch trên bản đồ.
    2. Hệ thống gọi API lấy chi tiết địa điểm du lịch tương ứng.
    3. Hệ thống mở bảng thông tin chi tiết (Pop-up/Slide-over) hiển thị tên địa danh, đánh giá, giờ mở cửa, hình ảnh và bài viết liên quan.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Lỗi kết nối dữ liệu*: Hệ thống báo lỗi "Không thể tải chi tiết địa điểm, vui lòng thử lại sau".
*   **Postconditions**: Giao diện chi tiết điểm đến được hiển thị đầy đủ cho người dùng.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ), `UC_MAP_05` (Search Location).

---

### UC_MAP_08: Xem bản đồ nhiệt check-in (View Heatmap)
*   **Use Case ID**: UC_MAP_08
*   **Name**: Xem bản đồ nhiệt check-in (View Heatmap)
*   **Goal**: Hiển thị mật độ phân bố điểm check-in của các thành viên dưới dạng bản đồ nhiệt trực quan.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đang ở màn hình bản đồ.
*   **Trigger**: Người dùng chọn nút "Xem Bản đồ nhiệt" trên thanh công cụ điều khiển bản đồ.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút bật tính năng Bản đồ nhiệt.
    2. Hệ thống thu thập các tọa độ check-in công khai của người dùng trên toàn hệ thống.
    3. Hệ thống phủ một lớp bản đồ nhiệt (Heatmap layer) lên trên bản đồ nền cơ sở với độ chuyển màu từ xanh (mật độ thấp) sang đỏ (mật độ cao).
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Bản đồ hiển thị lớp bản đồ nhiệt check-in hoạt động mượt mà.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ).

---

### UC_MAP_09: Xác định & Cập nhật vị trí hiện tại (Get & Update Current Location)
*   **Use Case ID**: UC_MAP_09
*   **Name**: Xác định & Cập nhật vị trí hiện tại (Get & Update Current Location)
*   **Goal**: Định vị tọa độ thực tế của thiết bị và gửi bản ghi cập nhật lên hệ thống để lưu vết.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Thiết bị hỗ trợ định vị GPS và người dùng đã đăng nhập hệ thống.
*   **Trigger**: Hệ thống định kỳ gửi định vị hoặc người dùng bấm nút "Định vị của tôi".
*   **Main Success Scenario**:
    1. Thiết bị định vị tọa độ GPS (Vĩ độ, Kinh độ).
    2. Frontend gửi API `PUT /api/v1/map/location` lên Backend để cập nhật vị trí hiện tại.
    3. Backend ghi nhận và lưu/cập nhật bản ghi trong bảng `Location` của người dùng.
    4. Bản đồ di chuyển tiêu điểm (Pan) và hiển thị chấm xanh vị trí trên giao diện.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Chặn quyền định vị*: Hệ thống hiển thị cảnh báo yêu cầu bật định vị GPS trong phần cài đặt.
*   **Postconditions**: Vị trí GPS hiện thời được định vị và cập nhật thành công lên máy chủ.
*   **Related Use Cases**: `UC_MAP_10` (Find Nearby Places), `UC_MAP_13` (Find Nearby Users).

---

### UC_MAP_10: Tìm địa điểm xung quanh (Find Nearby Places)
*   **Use Case ID**: UC_MAP_10
*   **Name**: Tìm địa điểm xung quanh (Find Nearby Places)
*   **Goal**: Khám phá và gợi ý danh sách các quán ăn, điểm lưu trú nằm gần vị trí hiện tại của người dùng.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã cấp quyền xác định vị trí hiện tại (`UC_MAP_09`).
*   **Trigger**: Người dùng chọn nút "Tìm quanh đây" trên màn hình.
*   **Main Success Scenario**:
    1. Người dùng chạy ca sử dụng Xác định vị trí hiện tại (`UC_MAP_09`).
    2. Người dùng nhấn nút "Tìm quanh đây".
    3. Hệ thống tính toán khoảng cách địa lý và truy vấn CSDL để lấy các địa điểm trong bán kính 5km.
    4. Bản đồ hiển thị khoanh vùng bán kính và danh sách các điểm xung quanh kèm khoảng cách thực tế (ví dụ: "Cách bạn 450m").
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Danh sách địa điểm lân cận được hiển thị trực quan.
*   **Related Use Cases**: `UC_MAP_09` (Get Current Location).

---

### UC_MAP_11: Xem chỉ đường lộ trình (View Route Directions)
*   **Use Case ID**: UC_MAP_11
*   **Name**: Xem chỉ đường lộ trình (View Route Directions)
*   **Goal**: Hướng dẫn đường đi ngắn nhất giữa hai vị trí cụ thể trên bản đồ.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: API Lộ trình (Routing API)
*   **Preconditions**: Bản đồ đã hiển thị vị trí khởi hành và điểm đến.
*   **Trigger**: Người dùng chọn một địa điểm trên bản đồ và nhấn nút "Chỉ đường".
*   **Main Success Scenario**:
    1. Người dùng chọn điểm đích trên bản đồ và nhấn "Chỉ đường".
    2   Hệ thống lấy tọa độ điểm khởi hành (mặc định là Vị trí hiện tại qua `UC_MAP_09` hoặc điểm do người dùng tự chọn).
    3. Hệ thống gửi yêu cầu tính lộ trình chứa điểm đầu và điểm cuối tới API Lộ trình (Routing API).
    4. API trả về danh sách các điểm nút tọa độ tạo nên tuyến đường tối ưu.
    5. Hệ thống vẽ tuyến đường (Polyline) nổi bật trên bản đồ kèm theo thông tin tổng chiều dài (km) và thời gian di chuyển dự kiến.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không tính được lộ trình*: API định tuyến báo lỗi do khoảng cách địa lý không hợp lệ hoặc thiếu dữ liệu mạng đường bộ, hệ thống thông báo "Không tìm thấy lộ trình di chuyển phù hợp".
*   **Postconditions**: Lộ trình chỉ đường được vẽ trực quan trên bản đồ.
*   **Related Use Cases**: `UC_MAP_09` (Get Current Location).

---

### UC_MAP_12: Hiển thị gợi ý địa điểm bằng AI trên bản đồ (Display AI Recommendations on Map)
*   **Use Case ID**: UC_MAP_12
*   **Name**: Hiển thị gợi ý địa điểm bằng AI trên bản đồ (Display AI Recommendations on Map)
*   **Goal**: Hiển thị trực quan danh sách các địa điểm du lịch gợi ý cá nhân hóa do AI phân tích trên bản đồ GIS.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã cấu hình sở thích du lịch (`UC_AUTH_04`).
*   **Trigger**: Người dùng nhấn nút "Gợi ý AI" trên thanh công cụ bản đồ.
*   **Main Success Scenario**:
    1. Người dùng nhấn biểu tượng gợi ý bằng AI trên bản đồ.
    2. Hệ thống phân tích lịch sử đi lại và sở thích để gửi yêu cầu lấy danh sách điểm đề xuất.
    3. Hệ thống hiển thị các điểm gợi ý AI dưới dạng ghim màu vàng nổi bật kèm nhãn "Đề xuất AI dành cho bạn".
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Các địa danh gợi ý AI hiển thị đầy đủ và nổi bật trên giao diện bản đồ.
*   **Related Use Cases**: `UC_AUTH_04` (Manage Profile & Preferences).

---

### UC_MAP_13: Tìm người lân cận chia sẻ vị trí (bán kính 100km) (Find Nearby Users Sharing Location - 100km)
*   **Use Case ID**: UC_MAP_13
*   **Name**: Tìm người lân cận chia sẻ vị trí (bán kính 100km) (Find Nearby Users Sharing Location - 100km)
*   **Goal**: Cho phép người dùng đã đăng nhập tìm kiếm và xem danh sách các thành viên khác đang online và chia sẻ vị trí trực tiếp trong phạm vi 100km xung quanh.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập và đã chia sẻ vị trí của mình (`UC_MAP_09`).
*   **Trigger**: Người dùng bật chế độ "Tìm người xung quanh" trên bản đồ.
*   **Main Success Scenario**:
    1. Người dùng kích hoạt chức năng Tìm người lân cận.
    2. Frontend gửi API `GET /api/v1/map/friends-locations` (hoặc api vị trí lân cận tương tự) lên Backend kèm theo tọa độ hiện tại.
    3. Backend tính khoảng cách hình học Haversine giữa tọa độ người gửi với tọa độ lưu trong bảng `Location` của các người dùng khác.
    4. Backend lọc danh sách người dùng trực tuyến trong bán kính 100km và trả về dữ liệu.
    5. Bản đồ hiển thị avatar của các thành viên lân cận tại tọa độ tương ứng trên bản đồ.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không bật GPS*: Hệ thống thông báo yêu cầu bật và cập nhật vị trí hiện thời trước khi quét người xung quanh.
*   **Postconditions**: Avatar của các thành viên đang chia sẻ vị trí trong bán kính 100km hiển thị chính xác.
*   **Related Use Cases**: `UC_MAP_09` (Get & Update Current Location).

---

### UC_MAP_14: Thực hiện check-in địa điểm (Perform Check-in)
*   **Use Case ID**: UC_MAP_14
*   **Name**: Thực hiện check-in địa điểm (Perform Check-in)
*   **Goal**: Ghi nhận và lưu lại dấu chân check-in thực tế của người dùng tại các địa điểm du lịch kèm ghi chú, ảnh và tag.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: OpenStreetMap
*   **Preconditions**: Người dùng đã đăng nhập hệ thống và đang ở giao diện Bản đồ.
*   **Trigger**: Người dùng điền thông tin vào biểu mẫu check-in và nhấn nút "Đăng Check-In".
*   **Main Success Scenario**:
    1. Người dùng chọn một địa điểm từ danh sách các điểm đến trên bản đồ.
    2. Người dùng nhập nội dung chia sẻ trải nghiệm (ghi chú) và chọn tag phân loại (Ẩm thực, Nghỉ dưỡng, Cà phê, Thiên nhiên).
    3. Người dùng đính kèm hình ảnh thực tế (tùy chọn) và nhấn "Đăng Check-In".
    4. Frontend đóng gói dữ liệu và gọi API `POST /api/v1/map/checkin` lên Backend.
    5. Backend kiểm tra tính hợp lệ của địa điểm và lưu dữ liệu vào bảng `CheckIn` trong CSDL.
    6. Hệ thống phản hồi check-in thành công và cập nhật điểm check-in mới lên bản đồ và sidebar.
*   **Alternative Flows**:
    *   *Check-in kèm hình ảnh (Alternative Flow A)*: Người dùng chọn tải ảnh thực tế lên biểu mẫu check-in, ảnh được đính kèm và mã hóa/gửi lên cùng payload check-in nhờ Use Case `UC_MAP_15`.
*   **Exception Flows**:
    *   *Chưa chọn địa điểm*: Hệ thống cảnh báo "Vui lòng chọn địa điểm!" và dừng thao tác.
*   **Postconditions**: Bản ghi check-in mới được lưu trữ và ghim điểm lên bản đồ Leaflet.
*   **Related Use Cases**: `UC_MAP_15` (Upload Check-in Photo), `UC_MAP_16` (View Community Check-ins).

---

### UC_MAP_15: Tải lên hình ảnh check-in (Upload Check-in Photo)
*   **Use Case ID**: UC_MAP_15
*   **Name**: Tải lên hình ảnh check-in (Upload Check-in Photo)
*   **Goal**: Cho phép người dùng đính kèm và tải lên hình ảnh chụp thực tế tại địa điểm du lịch trong quá trình thực hiện check-in.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đang điền thông tin check-in tại `UC_MAP_14`.
*   **Trigger**: Người dùng nhấn chọn biểu tượng tải ảnh và chọn một tệp ảnh hợp lệ.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Thêm ảnh" trong biểu mẫu check-in.
    2. Người dùng chọn một tệp ảnh từ thiết bị (định dạng JPG/PNG).
    3. Hệ thống tải tệp ảnh lên bộ nhớ tạm của ứng dụng, hiển thị ảnh xem trước (preview) và nút xóa ảnh trên giao diện.
    4. Khi đăng check-in, ảnh được đóng gói cùng ghi chú gửi lên server để lưu trữ.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Tệp tải lên không phải là ảnh hoặc quá kích thước*: Hệ thống hiển thị cảnh báo lỗi và từ chối nhận file.
*   **Postconditions**: Hình ảnh được đính kèm thành công vào thông tin check-in địa điểm.
*   **Related Use Cases**: `UC_MAP_14` (Perform Check-in).

---

### UC_MAP_16: Xem Community Check-Ins (View Community Check-ins)
*   **Use Case ID**: UC_MAP_16
*   **Name**: Xem Community Check-Ins (View Community Check-ins)
*   **Goal**: Cho phép người dùng duyệt và xem danh sách các lượt check-in của cộng đồng phượt thủ liên quan đến khu vực đang hiển thị.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Không có.
*   **Trigger**: Người dùng truy cập tab Bản đồ hoặc chọn một marker check-in của thành viên khác trên bản đồ.
*   **Main Success Scenario**:
    1. Người dùng truy cập trang Bản đồ.
    2. Frontend tự động gọi API `GET /api/v1/map/checkins` để lấy danh sách check-in gần đây của cộng đồng.
    3. Hệ thống hiển thị các lượt check-in dưới dạng marker đặc trưng trên bản đồ Leaflet và danh sách ở panel sidebar bên phải.
    4. Người dùng có thể nhấp chọn một lượt check-in để xem thông tin chi tiết (Tên người dùng, Avatar, nội dung bình luận, ảnh đính kèm và thời gian check-in).
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Hiển thị chính xác các hoạt động check-in công khai của cộng đồng trên bản đồ và giao diện.
*   **Related Use Cases**: `UC_MAP_14` (Perform Check-in).

---

### UC_MAP_17: Xem danh sách sự kiện và lễ hội (Browse Events & Festivals)
*   **Use Case ID**: UC_MAP_17
*   **Name**: Xem danh sách sự kiện và lễ hội (Browse Events & Festivals)
*   **Goal**: Cho phép người dùng duyệt và xem danh sách các lễ hội văn hóa tĩnh hoặc sự kiện meetup động lân cận khu vực bản đồ đang hiển thị.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đang ở giao diện Bản đồ.
*   **Trigger**: Người dùng bật chế độ "Lễ hội" (GIS Layer) hoặc di chuyển bản đồ đến khu vực mới.
*   **Main Success Scenario**:
    1. Người dùng bật layer "LỄ HỘI" ở góc phải bản đồ.
    2. Frontend gửi API `GET /api/v1/map/events` và `GET /api/v1/map/destinations` lên Backend để lấy danh sách địa danh có `category` là `festival` và các sự kiện meetup hoạt động trong bán kính 30km.
    3. Backend kiểm tra và trả về danh sách các địa điểm lễ hội và meetup.
    4. Bản đồ hiển thị các điểm này dưới dạng marker biểu tượng Lịch màu tím.
    5. Người dùng click vào biểu tượng Lịch để xem thông tin tóm tắt (Tên lễ hội, mô tả ngắn, ngày diễn ra, địa chỉ).
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Bản đồ hiển thị trực quan các điểm lễ hội và sự kiện meetup.
*   **Related Use Cases**: `UC_MAP_18` (Register to Join Event), `UC_MAP_19` (Create Local Event).

---

### UC_MAP_18: Đăng ký tham gia sự kiện (Register to Join Event)
*   **Use Case ID**: UC_MAP_18
*   **Name**: Đăng ký tham gia sự kiện (Register to Join Event)
*   **Goal**: Ghi nhận đăng ký tham dự của người dùng vào sự kiện/lễ hội để cập nhật sĩ số và lưu trữ trạng thái.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống và đang xem chi tiết một sự kiện meetup/lễ hội.
*   **Trigger**: Người dùng nhấn nút "Tham gia" (Join / Going) trên popup thông tin sự kiện.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Tham gia" tại chi tiết sự kiện trên bản đồ.
    2. Frontend gửi request lên API backend để đăng ký tham gia.
    3. Backend kiểm tra sĩ số tối đa (MaxAttendees) của sự kiện. Nếu còn chỗ, hệ thống tạo bản ghi liên kết mới trong bảng `EventAttendee` với trạng thái `status` là "going".
    4. Backend tăng số lượng người tham gia thực tế `currentCount` ở bảng `Event` lên 1 đơn vị.
    5. Hệ thống phản hồi đăng ký thành công và hiển thị nút trạng thái "Đã tham gia" trên giao diện.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Sự kiện đã hết chỗ*: Tại bước 3, nếu số lượng thực tế đã đạt tối đa (`currentCount` >= `maxAttendees`), hệ thống báo lỗi "Sự kiện đã đủ số lượng người đăng ký!" và dừng thao tác.
*   **Postconditions**: Bản ghi đăng ký mới được lưu lại, trạng thái giao diện cập nhật và tăng sĩ số sự kiện.
*   **Related Use Cases**: `UC_MAP_17` (Browse Events & Festivals).

---

### UC_MAP_19: Tạo sự kiện địa phương mới (Create Local Event)
*   **Use Case ID**: UC_MAP_19
*   **Name**: Tạo sự kiện địa phương mới (Create Local Event)
*   **Goal**: Cho phép người dùng đứng ra tổ chức một sự kiện meetup hoặc buổi giao lưu địa phương mới trên bản đồ để cộng đồng cùng tham gia.
*   **Primary Actor**: Người dùng đăng ký (Registered User)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống và đang xem bản đồ.
*   **Trigger**: Người dùng click chọn tọa độ trên bản đồ hoặc nhấn nút "Tạo sự kiện".
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Tạo sự kiện" (hoặc chọn ghim tạo sự kiện tại một địa điểm du lịch cụ thể).
    2. Biểu mẫu tạo sự kiện hiện ra yêu cầu nhập: Tiêu đề sự kiện, Mô tả, Ngày bắt đầu, Ngày kết thúc, Thể loại và Số lượng người tham gia tối đa.
    3. Người dùng điền đầy đủ thông tin và nhấn "Tạo".
    4. Frontend gửi API `POST /api/v1/map/event` lên Backend.
    5. Backend kiểm tra thông tin và lưu bản ghi mới vào bảng `Event` trong CSDL với `organizerId` là ID người dùng đang đăng nhập.
    6. Hệ thống phản hồi tạo sự kiện thành công và tự động ghim biểu tượng Lịch màu tím tại tọa độ sự kiện lên bản đồ.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Thời gian không hợp lệ*: Tại bước 5, nếu ngày bắt đầu nằm trong quá khứ hoặc sau ngày kết thúc, Backend báo lỗi và yêu cầu nhập lại thời gian hợp lệ.
*   **Postconditions**: Sự kiện mới được ghim lên bản đồ du lịch, sẵn sàng cho cộng đồng tìm kiếm và đăng ký tham gia.
*   **Related Use Cases**: `UC_MAP_17` (Browse Events & Festivals).

---

## 5. AI Chatbot Module (Trợ lý ảo AI & RAG)

### UC_AI_01: Trò chuyện với trợ lý ảo đa Agent (Chat with Multi-Agent Chatbot)
*   **Use Case ID**: UC_AI_01
*   **Name**: Trò chuyện với trợ lý ảo đa Agent (Chat with Multi-Agent Chatbot)
*   **Goal**: Cung cấp giao diện đàm thoại thông minh giúp giải đáp tức thời và chính xác mọi thắc mắc của người dùng về chuyến đi, đặc sản, lịch sử địa phương thông qua hệ thống AI đa nhân lực.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenAI API, vietnamadminunits API, OpenStreetMap
*   **Preconditions**: Người dùng đang mở cửa sổ chat và có luồng hội thoại hoạt động.
*   **Trigger**: Người dùng nhập nội dung câu hỏi và nhấn gửi.
*   **Main Success Scenario**:
    1. Người dùng gửi tin nhắn hỏi thông tin (ví dụ: "Ở Năm Căn Cà Mau có món gì ngon?").
    2. Backend định tuyến tin nhắn đến `AgentExecutorService` để chạy luồng phân loại ý định (nhận diện ý định ẩm thực `food` tại địa danh "Năm Căn Cà Mau").
    3. Hệ thống chuẩn hóa địa danh hành chính thông qua API `vietnamadminunits` và định vị tọa độ địa lý thông qua OpenStreetMap.
    4. Kích hoạt RAG để tìm kiếm thông tin đặc sản liên quan trong CSDL địa phương.
    5. Chọn Agent tương ứng (`FoodAgent`) nạp thông tin ngữ cảnh RAG cùng thói quen của người dùng (`AIMemory`) để xây dựng prompt hoàn chỉnh.
    6. Gửi yêu cầu sinh phản hồi đến OpenAI API sử dụng mô hình GPT-4o-mini.
    7. OpenAI xử lý và trả về phản hồi văn bản đã được định dạng Markdown.
    8. Backend lưu nội dung tin nhắn và phiên bản tin nhắn vào bảng `ChatMessage` và `ChatMessageVersion`.
    9. Trả câu trả lời kèm các thẻ trích dẫn nguồn dữ liệu thực tế về cho Frontend hiển thị.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Địa danh không có thực hoặc không tìm thấy tọa độ*: Hệ thống phản hồi yêu cầu người dùng làm rõ lại địa danh muốn nhắc tới và không kích hoạt sinh câu trả lời sai lệch.
*   **Postconditions**: Nội dung tin nhắn được lưu trữ đầy đủ trong CSDL và phản hồi trả về cho người dùng.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_02` (Quản lý phiên hội thoại chat), `UC_AI_05` (Tra cứu tri thức RAG).

---

### UC_AI_02: Quản lý phiên hội thoại chat (Manage Chat Conversations)
*   **Use Case ID**: UC_AI_02
*   **Name**: Quản lý phiên hội thoại chat (Manage Chat Conversations)
*   **Goal**: Cho phép người dùng tổ chức các phiên trò chuyện độc lập theo từng chủ đề hoặc từng chuyến đi khác nhau để dễ dàng tra cứu lại.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng chọn tạo luồng chat mới, liệt kê danh sách hoặc xóa luồng chat cũ tại thanh thanh điều hướng chatbot.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Tạo hội thoại mới".
    2. Backend tạo bản ghi luồng chat mới trong bảng `Conversation` gắn với ID người dùng.
    3. Người dùng có thể trò chuyện độc lập trong luồng mới này.
    4. Người dùng có thể đổi tên tiêu đề cuộc hội thoại hoặc chọn xóa cuộc hội thoại. Khi xóa, Backend sẽ xóa cứng hoặc xóa mềm toàn bộ tin nhắn liên kết của cuộc hội thoại đó trong CSDL.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: CSDL cập nhật chính xác trạng thái các luồng hội thoại của người dùng.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_01` (Trò chuyện với trợ lý ảo đa Agent).

---

### UC_AI_03: Tái tạo phản hồi đa phiên bản (Regenerate Chat Response)
*   **Use Case ID**: UC_AI_03
*   **Name**: Tái tạo phản hồi đa phiên bản (Regenerate Chat Response)
*   **Goal**: Cho phép người dùng tìm kiếm phương án trả lời thay thế tốt hơn từ AI cho cùng một câu hỏi và dễ dàng so sánh kết quả giữa các phiên bản.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenAI API
*   **Preconditions**: Đang xem câu trả lời của trợ lý ảo tại một phiên chat hoạt động.
*   **Trigger**: Người dùng nhấn nút "Tái tạo câu trả lời" (Regenerate) dưới câu trả lời của chatbot.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút "Tái tạo".
    2. Frontend gửi request lên API `POST /api/v1/chatbot/messages/:messageId/regenerate`.
    3. Backend lấy lại nội dung câu hỏi ban đầu, thiết lập lại tham số nhiệt độ (temperature) của OpenAI API lên cao hơn một chút để tạo độ phong phú và gửi yêu cầu sinh mới.
    4. OpenAI sinh câu trả lời mới.
    5. Backend lưu câu trả lời mới thành một bản ghi mới trong bảng `ChatMessageVersion` liên kết với tin nhắn gốc. Cập nhật chỉ số phiên bản hiển thị (`currentVersionIndex` tăng lên).
    6. Trả câu trả lời mới về Frontend.
    7. Frontend hiển thị câu trả lời mới kèm công cụ chuyển đổi phiên bản dạng `1/2`, `2/2` để người dùng bấm chọn xem lại các câu trả lời cũ.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Bản ghi phiên bản câu trả lời mới được lưu trữ thành công vào CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_01` (Trò chuyện với trợ lý ảo đa Agent).

---

### UC_AI_04: Đánh giá chất lượng phản hồi AI (Submit AI Answer Rating)
*   **Use Case ID**: UC_AI_04
*   **Name**: Đánh giá chất lượng phản hồi AI (Submit AI Answer Rating)
*   **Goal**: Thu thập phản hồi thực tế từ người dùng về mức độ chính xác của chatbot để cải tiến prompt và tri thức hệ thống.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đang mở hội thoại chat và có tin nhắn phản hồi của AI.
*   **Trigger**: Người dùng nhấn nút biểu tượng Thích (Like/Thumps Up) hoặc Không thích (Dislike/Thumbs Down) dưới tin nhắn trả lời của AI.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút Dislike dưới câu trả lời của trợ lý ảo.
    2. Một cửa sổ nhỏ hiện lên yêu cầu người dùng tùy chọn nhập lý do không hài lòng (ví dụ: "Thông tin địa danh bị sai", "Câu trả lời quá ngắn", "Thông tin cũ").
    3. Người dùng nhập lý do và nhấn "Gửi phản hồi".
    4. Backend nhận dữ liệu và tạo bản ghi mới trong bảng `Feedback` lưu trữ liên kết tin nhắn, đánh giá rating và lý do chi tiết.
    5. Hệ thống hiển thị thông báo ghi nhận đóng góp của người dùng thành công và đóng cửa sổ phản hồi.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Phản hồi đánh giá chất lượng được lưu trữ thành công vào CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_01` (Trò chuyện với trợ lý ảo đa Agent).

---

### UC_AI_05: Tra cứu tri thức sâu thông qua RAG (RAG Semantic Search)
*   **Use Case ID**: UC_AI_05
*   **Name**: Tra cứu tri thức sâu thông qua RAG (RAG Semantic Search)
*   **Goal**: Tìm kiếm chính xác các tài liệu, thông tin về lịch sử, sự tích, quy tắc ứng xử của địa phương nhằm bổ túc ngữ cảnh chuẩn xác cho AI, hạn chế việc AI tự ảo tưởng thông tin (hallucination).
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenAI API
*   **Preconditions**: Kho dữ liệu tri thức của hệ thống đã được nạp và sinh vector embeddings đầy đủ trong bảng `KnowledgeQuestion`.
*   **Trigger**: Chatbot chạy quy trình tìm kiếm ngữ cảnh cho câu hỏi hoặc người dùng sử dụng thanh tìm kiếm tri thức chuyên sâu.
*   **Main Success Scenario**:
    1. Hệ thống tiếp nhận truy vấn văn bản của người dùng.
    2. Backend gửi yêu cầu đến OpenAI Embeddings API sử dụng mô hình `text-embedding-3-small` để sinh vector biểu diễn 1536 chiều của câu hỏi.
    3. **Tìm kiếm Vector**: Hệ thống chạy câu lệnh truy vấn SQL so sánh khoảng cách cosine giữa vector câu hỏi và trường `embeddingOpenAI` trong bảng `KnowledgeQuestion`. Lọc ra 5 kết quả có độ tương đồng cao nhất.
    4. **Tìm kiếm Văn bản thô**: Hệ thống đồng thời chạy truy vấn tìm kiếm văn bản khớp từ khóa (Fuzzy Text Search) trong bảng `KnowledgeContent`. Lấy 5 kết quả tốt nhất.
    5. **Xếp hạng lai (RRF)**: Hệ thống chạy giải thuật Reciprocal Rank Fusion (RRF) để xếp hạng lại độ ưu tiên của toàn bộ kết quả, chọn ra 3 tài liệu khớp nhất.
    6. Trích xuất nội dung các tài liệu này và đính kèm vào hệ thống làm ngữ cảnh trả lời.
*   **Alternative Flows**:
    *   *OpenAI API gặp lỗi (Alternative Flow A)*: Hệ thống tự động chuyển sang sử dụng thuật toán băm nội bộ (Local Hashing Engine) để sinh vector 128 chiều và so khớp với trường `embeddingLocal` trong CSDL nhằm đảm bảo hệ thống không bị gián đoạn.
*   **Exception Flows**: Không có.
*   **Postconditions**: Ngữ cảnh dữ liệu thực tế chuẩn xác được trích xuất thành công.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_01` (Trò chuyện với trợ lý ảo đa Agent), `UC_ADM_02` (Nạp kho tri thức RAG).

---

### UC_AI_06: Quản lý danh sách món ăn yêu thích (Manage Favorite Foods)
*   **Use Case ID**: UC_AI_06
*   **Name**: Quản lý danh sách món ăn yêu thích (Manage Favorite Foods)
*   **Goal**: Cho phép người dùng lưu trữ nhanh các đặc sản ẩm thực được đề xuất bởi Chatbot để xây dựng cẩm nang ăn uống cá nhân cho chuyến đi.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng nhấn nút "Lưu vào danh sách món ngon" khi đọc đề xuất ẩm thực từ chatbot.
*   **Main Success Scenario**:
    1. Người dùng nhấn nút Lưu dưới phần giới thiệu món ăn của Chatbot.
    2. Backend tiếp nhận yêu cầu gửi qua API `POST /api/v1/favorite-foods`.
    3. Backend tạo bản ghi mới trong bảng `FavoriteFood` lưu trữ thông tin tên món ăn, địa danh và mô tả thô.
    4. Điểm đếm món ngon trên trang cá nhân được cập nhật.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Đặc sản yêu thích được cập nhật thành công vào CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_01` (Trò chuyện với trợ lý ảo đa Agent).

---

## 6. Administration Module (Quản trị & Vận hành)


### UC_ADM_02: Nạp kho tri thức RAG (Ingest RAG Knowledge Base)
*   **Use Case ID**: UC_ADM_02
*   **Name**: Nạp kho tri thức RAG (Ingest RAG Knowledge Base)
*   **Goal**: Cập nhật thêm các kiến thức thực tế địa phương mới vào cơ sở dữ liệu vector để nâng cấp độ hiểu biết của Trợ lý ảo.
*   **Primary Actor**: Quản trị viên (Admin)
*   **Supporting Actors**: OpenAI API
*   **Preconditions**: Quản trị viên đã đăng nhập và có quyền `ADMIN`, chuẩn bị sẵn tệp tin tài liệu tri thức định dạng PDF hoặc JSON.
*   **Trigger**: Quản trị viên tải tệp tin tài liệu lên thông qua công cụ nạp tri thức của trang quản trị.
*   **Main Success Scenario**:
    1. Quản trị viên chọn tệp tin tài liệu du lịch mới (ví dụ: cẩm nang lễ hội Nghinh Ông Cà Mau) và nhấn "Nạp tài liệu".
    2. Backend tiếp nhận tệp, thực hiện bóc tách văn bản thô, chia nhỏ văn bản thành các phân đoạn (chunks) có kích thước 500 ký tự và có chồng lấn 50 ký tự để bảo toàn ngữ cảnh.
    3. Với mỗi phân đoạn, Backend gửi yêu cầu đến OpenAI Embeddings API để tạo vector biểu diễn 1536 chiều.
    4. Backend ghi dữ liệu phân đoạn thô vào bảng `KnowledgeContent` và lưu các vector embeddings tương ứng vào bảng `KnowledgeQuestion`.
    5. Hệ thống phản hồi số lượng phân đoạn đã được nạp thành công và cập nhật trạng thái kho tri thức.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Sai cấu trúc định dạng tệp*: Nếu tải tệp tin bị hỏng hoặc sai định dạng, hệ thống thông báo lỗi `Định dạng tệp không được hỗ trợ` và hủy quy trình.
*   **Postconditions**: Kho dữ liệu tri thức RAG được bổ sung thêm kiến thức và vector embeddings mới phục vụ tìm kiếm.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_AI_05` (Tra cứu tri thức sâu thông qua RAG).

---

### UC_ADM_03: Chuẩn hóa dữ liệu địa phương (Sanitize & Clean Raw Data)
*   **Use Case ID**: UC_ADM_03
*   **Name**: Chuẩn hóa dữ liệu địa phương (Sanitize & Clean Raw Data)
*   **Goal**: Làm sạch, sửa đổi các lỗi chính tả, chuẩn hóa các trường thông tin của dữ liệu thô thu thập từ địa phương trước khi nạp vào hệ thống RAG để đảm bảo độ chính xác của câu trả lời.
*   **Primary Actor**: Quản trị viên (Admin)
*   **Supporting Actors**: -
*   **Preconditions**: Kho dữ liệu thô (ví dụ: JSON dữ liệu Cà Mau) đã được đặt trên máy chủ.
*   **Trigger**: Quản trị viên kích hoạt nút "Chuẩn hóa dữ liệu thô" trên bảng điều khiển vận hành.
*   **Main Success Scenario**:
    1. Quản trị viên nhấn nút kích hoạt chuẩn hóa dữ liệu.
    2. Backend gửi tín hiệu chạy script làm sạch dữ liệu địa phương thô.
    3. Hệ thống quét qua toàn bộ dữ liệu, tự động loại bỏ các ký tự rác, chuẩn hóa các địa danh viết sai chính tả địa phương, loại bỏ các bản ghi trùng lặp nội dung.
    4. Ghi nhận dữ liệu đã được làm sạch hoàn chỉnh thành một tệp tin chuẩn hóa mới sẵn sàng cho việc nạp RAG.
    5. Hệ thống phản hồi số lượng bản ghi đã được xử lý thành công.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Dữ liệu thô được làm sạch và lưu thành công ở trạng thái sẵn sàng sử dụng.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_ADM_02` (Nạp kho tri thức RAG).

---

### UC_ADM_04: Quản lý và làm sạch bộ nhớ cache (Manage System Caching)
*   **Use Case ID**: UC_ADM_04
*   **Name**: Quản lý và làm sạch bộ nhớ cache (Manage System Caching)
*   **Goal**: Giải phóng bộ nhớ đệm tạm thời của máy chủ để giải quyết các xung đột dữ liệu cũ và tối ưu hiệu suất truy cập CSDL của hệ thống.
*   **Primary Actor**: Quản trị viên (Admin)
*   **Supporting Actors**: -
*   **Preconditions**: Quản trị viên đã đăng nhập và có quyền `ADMIN`.
*   **Trigger**: Quản trị viên nhấn nút "Dọn dẹp Cache" tại trang cấu hình hệ thống.
*   **Main Success Scenario**:
    1. Quản trị viên truy cập mục cấu hình bộ nhớ đệm, kiểm tra dung lượng cache đang sử dụng.
    2. Quản trị viên nhấn nút "Xóa Cache".
    3. Backend gửi lệnh quét qua các khóa cache tạm thời của database Redis/Prisma và thực hiện xóa toàn bộ các khóa cache đã hết hạn hoặc toàn bộ cache truy vấn lịch trình du lịch mẫu.
    4. Giải phóng tài nguyên RAM của máy chủ.
    5. Hệ thống cập nhật lại dung lượng trống và hiển thị thông báo dọn dẹp thành công.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Bộ nhớ đệm cache hệ thống được làm sạch thành công.
*   **Business Rules**: Không có.
*   **Related Use Cases**: Không có.
