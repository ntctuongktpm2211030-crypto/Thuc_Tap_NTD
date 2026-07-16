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

## 4. Interactive Map Module (Bản đồ tương tác & Định vị)

### UC_MAP_01: Xem bản đồ tương tác (View Interactive Map)
*   **Use Case ID**: UC_MAP_01
*   **Name**: Xem bản đồ tương tác (View Interactive Map)
*   **Goal**: Hiển thị trực quan vị trí địa lý của các điểm đến du lịch, các hoạt động check-in và cảnh báo an toàn trên nền tảng bản đồ số.
*   **Primary Actor**: Khách vãng lai (Guest)
*   **Supporting Actors**: OpenStreetMap (OSM)
*   **Preconditions**: Trình duyệt có kết nối internet ổn định để tải bản đồ Leaflet.
*   **Trigger**: Người dùng truy cập mục "Bản đồ du lịch".
*   **Main Success Scenario**:
    1. Người dùng truy cập trang Bản đồ.
    2. Frontend khởi tạo bản đồ Leaflet và tải các ô bản đồ địa lý từ máy chủ OpenStreetMap.
    3. Frontend gọi API `GET /api/v1/map/markers` lấy toàn bộ tọa độ check-in công khai, điểm danh lam thắng cảnh và danh sách sự kiện đang hoạt động.
    4. Backend truy vấn CSDL và trả về danh sách tọa độ cùng nhãn tiêu đề tương ứng.
    5. Bản đồ hiển thị trực quan các biểu tượng điểm ghim (markers) và bản đồ nhiệt (heat map) của các khu vực đông check-in.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không thể kết nối đến máy chủ bản đồ*: Hệ thống hiển thị thông báo lỗi `Lỗi tải bản đồ, vui lòng kiểm tra kết nối mạng` và sử dụng bản đồ dự phòng tĩnh.
*   **Postconditions**: Bản đồ tương tác hiển thị thành công với các điểm ghim hoạt động đầy đủ.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_MAP_02` (Check-in địa điểm du lịch).

---

### UC_MAP_02: Check-in địa điểm du lịch (Perform Check-in)
*   **Use Case ID**: UC_MAP_02
*   **Name**: Check-in địa điểm du lịch (Perform Check-in)
*   **Goal**: Lưu lại bằng chứng số của việc đã đặt chân đến một địa danh kèm theo cảm xúc, hình ảnh để chia sẻ lên bản đồ cộng đồng.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: OpenStreetMap (OSM)
*   **Preconditions**: Thiết bị cho phép truy cập tọa độ GPS hiện tại hoặc người dùng ghim trực tiếp trên bản đồ.
*   **Trigger**: Người dùng nhấn nút "Check-in tại đây" trên bản đồ.
*   **Main Success Scenario**:
    1. Người dùng cấp quyền GPS, hệ thống tự động xác định tọa độ hiện tại hoặc người dùng click chọn tọa độ thủ công trên bản đồ Leaflet.
    2. Người dùng nhập ghi chú trải nghiệm, đánh giá chất lượng dịch vụ và tải ảnh chụp thực tế.
    3. Người dùng chọn chế độ chia sẻ (Công khai / Chỉ bạn bè / Riêng tư).
    4. Người dùng nhấn nút "Hoàn tất Check-in".
    5. Backend tiếp nhận yêu cầu, lưu thông tin vào bảng `Checkin` trong CSDL.
    6. Nếu chọn chế độ công khai, điểm check-in sẽ hiển thị ngay lập tức thành một điểm ghim mới trên bản đồ tương tác cộng đồng.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Không có quyền truy cập định vị*: Nếu trình duyệt chặn quyền định vị GPS, hệ thống yêu cầu người dùng chọn địa điểm check-in thủ công bằng cách nhấn chuột trên bản đồ.
*   **Postconditions**: Dữ liệu check-in được cập nhật vào CSDL thành công.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ tương tác), `UC_MAP_03` (Trích xuất GPS từ siêu dữ liệu ảnh chụp).

---

### UC_MAP_03: Trích xuất GPS từ siêu dữ liệu ảnh chụp (EXIF GPS Extraction)
*   **Use Case ID**: UC_MAP_03
*   **Name**: Trích xuất GPS từ siêu dữ liệu ảnh chụp (EXIF GPS Extraction)
*   **Goal**: Hỗ trợ người dùng tự động điền thông tin địa điểm check-in dựa trên tọa độ GPS được ghi nhận khi chụp bức ảnh đó.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Bức ảnh tải lên phải được chụp bằng thiết bị có bật tính năng định vị lưu GPS và không bị xóa EXIF khi truyền tải.
*   **Trigger**: Người dùng chọn nút "Tải ảnh từ thư viện để tự xác định tọa độ" tại màn hình check-in.
*   **Main Success Scenario**:
    1. Người dùng chọn tải lên bức ảnh phong cảnh đã chụp tại điểm đến.
    2. Frontend sử dụng thư viện JavaScript nhị phân để giải mã khối thông tin EXIF của ảnh ngay tại phía client.
    3. Hệ thống trích xuất thành công tọa độ vĩ độ (Latitude) và kinh độ (Longitude) từ EXIF.
    4. Hệ thống tự động di chuyển tâm bản đồ về tọa độ vừa trích xuất và điền tọa độ vào biểu mẫu check-in.
    5. Người dùng tiếp tục thực hiện các bước lưu check-in như luồng chính của `UC_MAP_02`.
*   **Alternative Flows**: Không có.
*   **Exception Flows**:
    *   *Ảnh không chứa siêu dữ liệu GPS*: Nếu ảnh không có thông tin tọa độ EXIF, hệ thống hiển thị cảnh báo `Không tìm thấy tọa độ GPS trong ảnh này` và yêu cầu người dùng định vị thủ công trên bản đồ.
*   **Postconditions**: Tọa độ biểu mẫu check-in được điền tự động thành công từ thông tin ảnh.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_MAP_02` (Check-in địa điểm du lịch).

---

### UC_MAP_04: Chia sẻ & Theo dõi vị trí thời gian thực (Real-time Location Sync)
*   **Use Case ID**: UC_MAP_04
*   **Name**: Chia sẻ & Theo dõi vị trí thời gian thực (Real-time Location Sync)
*   **Goal**: Cho phép các thành viên trong nhóm phượt hoặc bạn bè theo dõi vị trí live của nhau trên bản đồ trong suốt hành trình di chuyển để tránh bị thất lạc.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã kết nối WebSockets (Socket.io) thành công và bật định vị trên thiết bị di động.
*   **Trigger**: Người dùng bật chế độ "Chia sẻ vị trí trực tiếp" trên màn hình Bản đồ.
*   **Main Success Scenario**:
    1. Người dùng kích hoạt nút "Chia sẻ vị trí trực tiếp".
    2. Thiết bị tự động lấy tọa độ GPS định kỳ mỗi 15 giây và emit sự kiện `ping_location` chứa tọa độ hiện tại kèm token định danh lên máy chủ qua kết nối Socket.io.
    3. Socket.io Server nhận dữ liệu, cập nhật tọa độ mới nhất vào bảng cache `Location` trong bộ nhớ tạm.
    4. Server xác định danh sách các follower/bạn bè của người dùng này đang online và cùng mở bản đồ.
    5. Server broadcast sự kiện `friend_location_updated` chứa tọa độ mới và avatar của người dùng đến thiết bị của các bạn bè tương ứng.
    6. Trình duyệt của bạn bè nhận sự kiện, tự động di chuyển vị trí biểu tượng avatar của người dùng trên bản đồ mà không cần tải lại trang.
*   **Alternative Flows**:
    *   *Tắt chia sẻ vị trí (Alternative Flow A)*: Người dùng nhấn tắt nút chia sẻ, client dừng gửi tọa độ và server thông báo cho bạn bè xóa marker tương ứng.
*   **Exception Flows**:
    *   *Mất kết nối mạng đột ngột*: Thiết bị mất kết nối websocket, biểu tượng avatar của người dùng sẽ đứng yên tại tọa độ cuối cùng và hiển thị trạng thái "Mất kết nối" (Offline) sau 1 phút không nhận được ping.
*   **Postconditions**: Vị trí live được cập nhật liên tục và hiển thị đồng bộ giữa các thành viên đang hoạt động.
*   **Business Rules**: BR_MAP_01 (Tọa độ chia sẻ trực tiếp chỉ được ghi nhận vào bộ nhớ cache tạm thời và tự động xóa sạch khi người dùng ngắt kết nối WebSocket để bảo vệ quyền riêng tư).
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ tương tác).

---

### UC_MAP_05: Quản lý & Tham gia sự kiện địa phương (Manage & Join Local Events)
*   **Use Case ID**: UC_MAP_05
*   **Name**: Quản lý & Tham gia sự kiện địa phương (Manage & Join Local Events)
*   **Goal**: Cho phép người dùng kết nối, giao lưu trực tiếp thông qua các sự kiện văn hóa, lễ hội hoặc các buổi giao lưu của cộng đồng phượt thủ được tổ chức tại các địa danh cụ thể.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng tạo sự kiện mới hoặc chọn tham gia một sự kiện hiện có trên bản đồ.
*   **Main Success Scenario**:
    *   *Tạo sự kiện mới*:
        1. Người dùng chọn tọa độ trên bản đồ, điền tiêu đề sự kiện, mô tả hoạt động, thời gian bắt đầu, thời gian kết thúc.
        2. Người dùng nhấn "Tạo sự kiện".
        3. Backend ghi nhận và tạo bản ghi mới trong bảng `Event` trong CSDL, mặc định người tạo là Creator.
        4. Điểm ghim sự kiện xuất hiện trên bản đồ để các thành viên khác có thể click vào xem và đăng ký tham gia.
*   **Alternative Flows**:
    *   *Đăng ký tham gia sự kiện (Alternative Flow A)*: Người dùng khác mở chi tiết sự kiện và nhấn nút "Tham gia". Backend tạo liên kết vào bảng `EventAttendee`. Danh sách người tham gia được cập nhật hiển thị công khai.
*   **Exception Flows**:
    *   *Thời gian sự kiện trong quá khứ*: Hệ thống từ chối tạo và hiển thị thông báo lỗi định dạng thời gian.
*   **Postconditions**: Sự kiện mới hoặc trạng thái tham gia sự kiện của người dùng được cập nhật trong CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ tương tác).

---

### UC_MAP_06: Quản lý địa điểm đã lưu (Manage Saved Places)
*   **Use Case ID**: UC_MAP_06
*   **Name**: Quản lý địa điểm đã lưu (Manage Saved Places)
*   **Goal**: Cho phép người dùng đánh dấu và quản lý các địa điểm cá nhân (khách sạn, quán ăn ngon, điểm ngắm cảnh đẹp) trên bản đồ để lập kế hoạch di chuyển nhanh hơn.
*   **Primary Actor**: Người dùng đăng ký (Registered Traveler)
*   **Supporting Actors**: -
*   **Preconditions**: Người dùng đã đăng nhập hệ thống.
*   **Trigger**: Người dùng nhấn nút "Lưu địa điểm" (Save) khi click vào một điểm bất kỳ trên bản đồ Leaflet.
*   **Main Success Scenario**:
    1. Người dùng chọn một điểm ghim trên bản đồ và nhấn nút "Lưu địa điểm".
    2. Người dùng chọn nhóm lưu trữ (ví dụ: "Muốn đi", "Quán ăn ngon", "Yêu thích").
    3. Backend nhận yêu cầu `POST /api/v1/saved-places` chứa tọa độ và tên địa điểm.
    4. Backend ghi nhận và tạo liên kết trong bảng `SavedPlace` gắn với ID của người dùng.
    5. Hệ thống hiển thị biểu tượng ngôi sao màu vàng tại tọa độ đó trên bản đồ cá nhân của người dùng.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Địa điểm lưu trữ được ghi nhận thành công vào CSDL.
*   **Business Rules**: Không có.
*   **Related Use Cases**: `UC_MAP_01` (Xem bản đồ tương tác).

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

### UC_ADM_01: Xem dashboard thống kê hệ thống (View Analytics Charts)
*   **Use Case ID**: UC_ADM_01
*   **Name**: Xem dashboard thống kê hệ thống (View Analytics Charts)
*   **Goal**: Giúp quản trị viên có cái nhìn trực quan về tình hình hoạt động của hệ thống, số lượng người dùng, tần suất check-in và hiệu suất phản hồi của server.
*   **Primary Actor**: Quản trị viên (Admin)
*   **Supporting Actors**: -
*   **Preconditions**: Quản trị viên đã đăng nhập và được xác thực có quyền `ADMIN`.
*   **Trigger**: Quản trị viên chọn mục "Báo cáo thống kê" trên thanh quản trị.
*   **Main Success Scenario**:
    1. Quản trị viên truy cập trang Dashboard.
    2. Frontend gửi request lên API `GET /api/v1/analytics/stats`.
    3. Backend thực hiện tổng hợp số liệu từ các bảng `User`, `Trip`, `Checkin`, `ChatMessage` trong CSDL.
    4. Backend trả về tập dữ liệu thống kê phân loại theo thời gian (ngày, tuần, tháng).
    5. Giao diện quản trị hiển thị trực quan các biểu đồ đường, biểu đồ tròn thể hiện lượng tăng trưởng người dùng, biểu đồ nhiệt check-in và thời gian phản hồi API trung bình.
*   **Alternative Flows**: Không có.
*   **Exception Flows**: Không có.
*   **Postconditions**: Dashboard dữ liệu phân tích hệ thống hiển thị thành công.
*   **Business Rules**: Không có.
*   **Related Use Cases**: Không có.

---

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
