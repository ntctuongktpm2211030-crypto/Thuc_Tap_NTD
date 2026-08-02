import os

tables = [
    {
        "name": "1. Bảng User (Tài khoản người dùng)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã định danh duy nhất (UUID)"),
            ("email", "VARCHAR(255)", "", "UK", "Địa chỉ Email đăng nhập"),
            ("passwordHash", "VARCHAR(255)", "", "", "Mật khẩu đã mã hóa (Bcrypt)"),
            ("role", "VARCHAR(20)", "", "", "Vai trò người dùng (USER, ADMIN)"),
            ("isVerified", "BOOLEAN", "", "", "Trạng thái xác thực tài khoản"),
            ("verificationToken", "VARCHAR(255)", "x", "", "Mã Token xác thực Email"),
            ("resetPasswordToken", "VARCHAR(255)", "x", "", "Mã Token khôi phục mật khẩu"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo tài khoản"),
            ("updatedAt", "TIMESTAMP", "", "", "Thời điểm cập nhật gần nhất")
        ]
    },
    {
        "name": "2. Bảng Profile (Hồ sơ cá nhân)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã định danh hồ sơ"),
            ("userId", "VARCHAR(36)", "", "FK, UK", "Khóa ngoại trỏ đến User(id)"),
            ("fullName", "VARCHAR(100)", "", "", "Họ và tên người dùng"),
            ("avatarUrl", "TEXT", "x", "", "Đường dẫn ảnh đại diện"),
            ("coverUrl", "TEXT", "x", "", "Đường dẫn ảnh bìa trang cá nhân"),
            ("bio", "TEXT", "x", "", "Tiểu sử / Giới thiệu bản thân"),
            ("phoneNumber", "VARCHAR(20)", "x", "", "Số điện thoại liên hệ"),
            ("homeLocation", "VARCHAR(255)", "x", "", "Địa chỉ thường trú / Quê quán")
        ]
    },
    {
        "name": "3. Bảng TravelPreferences (Sở thích du lịch)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã sở thích du lịch"),
            ("userId", "VARCHAR(36)", "", "FK, UK", "Khóa ngoại trỏ đến User(id)"),
            ("preferredPace", "VARCHAR(50)", "", "", "Nhịp độ chuyến đi ưa thích (slow, moderate, fast)"),
            ("dailyBudget", "FLOAT", "", "", "Ngân sách chi tiêu dự kiến / ngày (VND)"),
            ("activities", "TEXT[]", "", "", "Danh sách hoạt động yêu thích (nghỉ dưỡng, khám phá...)"),
            ("destinationTypes", "TEXT[]", "", "", "Loại điểm đến ưu tiên (biển, núi, đô thị...)"),
            ("foodPreferences", "TEXT[]", "", "", "Sở thích ẩm thực (ẩm thực đường phố, chay...)")
        ]
    },
    {
        "name": "4. Bảng Trip (Chuyến đi / Lịch trình)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã định danh chuyến đi"),
            ("ownerId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) tạo chuyến đi"),
            ("title", "VARCHAR(255)", "", "", "Tên chuyến đi"),
            ("description", "TEXT", "x", "", "Mô tả chi tiết chuyến đi"),
            ("destinationName", "VARCHAR(255)", "", "", "Tên điểm đến chính"),
            ("startDate", "TIMESTAMP", "x", "", "Ngày bắt đầu chuyến đi"),
            ("endDate", "TIMESTAMP", "x", "", "Ngày kết thúc chuyến đi"),
            ("totalBudget", "FLOAT", "", "", "Tổng ngân sách dự toán (VND)"),
            ("travelStyle", "VARCHAR(50)", "", "", "Hình thức du lịch (solo, family, friends...)"),
            ("isPublic", "BOOLEAN", "", "", "Trạng thái công khai với cộng đồng"),
            ("status", "VARCHAR(30)", "", "", "Trạng thái chuyến đi (DRAFT_AI, DRAFT_USER, CONFIRMED)"),
            ("cloneSourceId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Trip(id) nếu được sao chép"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo"),
            ("updatedAt", "TIMESTAMP", "", "", "Thời điểm cập nhật")
        ]
    },
    {
        "name": "5. Bảng TripDay (Ngày trong lịch trình)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã ngày trong lịch trình"),
            ("tripId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Trip(id)"),
            ("dayIndex", "INT", "", "", "Thứ tự ngày (1, 2, 3...)"),
            ("date", "TIMESTAMP", "x", "", "Ngày diễn ra cụ thể")
        ]
    },
    {
        "name": "6. Bảng TripActivity (Hoạt động / Điểm dừng)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã hoạt động"),
            ("tripDayId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến TripDay(id)"),
            ("destinationId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Destination(id) hệ thống"),
            ("title", "VARCHAR(255)", "x", "", "Tên hoạt động tự do"),
            ("location", "VARCHAR(255)", "x", "", "Tên vị trí / địa điểm"),
            ("description", "TEXT", "x", "", "Mô tả chi tiết nội dung hoạt động"),
            ("startTime", "VARCHAR(10)", "x", "", "Giờ bắt đầu (HH:mm)"),
            ("endTime", "VARCHAR(10)", "x", "", "Giờ kết thúc (HH:mm)"),
            ("estimatedCost", "FLOAT", "", "", "Chi phí dự tính (VND)"),
            ("sequenceOrder", "INT", "", "", "Thứ tự sắp xếp hoạt động trong ngày"),
            ("notes", "TEXT", "x", "", "Ghi chú thêm về hoạt động")
        ]
    },
    {
        "name": "7. Bảng Destination (Địa danh / Địa điểm du lịch)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã địa điểm hệ thống"),
            ("name", "VARCHAR(255)", "", "", "Tên địa danh / địa điểm"),
            ("description", "TEXT", "x", "", "Mô tả địa điểm"),
            ("latitude", "DOUBLE", "", "", "Tọa độ vĩ độ GPS (WGS84)"),
            ("longitude", "DOUBLE", "", "", "Tọa độ kinh độ GPS (WGS84)"),
            ("category", "VARCHAR(50)", "", "", "Phân loại (attraction, restaurant, hotel...)"),
            ("averageRating", "FLOAT", "", "", "Điểm đánh giá trung bình (0.0 - 5.0)"),
            ("address", "VARCHAR(255)", "x", "", "Địa chỉ chi tiết"),
            ("openingHours", "VARCHAR(255)", "x", "", "Giờ mở cửa / đóng cửa")
        ]
    },
    {
        "name": "8. Bảng Post (Bài viết / Nhật ký chuyến đi)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã bài viết"),
            ("authorId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) tác giả"),
            ("content", "TEXT", "", "", "Nội dung bài viết"),
            ("mediaUrls", "TEXT[]", "", "", "Mảng đường dẫn hình ảnh / video đính kèm"),
            ("tripId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Trip(id) liên quan"),
            ("locationId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Destination(id) liên quan"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm đăng bài"),
            ("deletedAt", "TIMESTAMP", "x", "", "Thời điểm xóa tạm (Soft Delete)")
        ]
    },
    {
        "name": "9. Bảng Comment (Bình luận)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã bình luận"),
            ("postId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Post(id)"),
            ("authorId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("content", "TEXT", "", "", "Nội dung bình luận"),
            ("parentId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Comment(id) cha (Trả lời bình luận)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm bình luận")
        ]
    },
    {
        "name": "10. Bảng Like (Yêu thích bài viết)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã lượt thích"),
            ("postId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Post(id)"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm bấm thích")
        ]
    },
    {
        "name": "11. Bảng Bookmark (Lưu bài viết)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã lượt lưu bài"),
            ("postId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Post(id)"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm bấm lưu")
        ]
    },
    {
        "name": "12. Bảng Follower (Theo dõi người dùng)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã lượt theo dõi"),
            ("followerId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) người theo dõi"),
            ("followingId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) người được theo dõi"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm bắt đầu theo dõi")
        ]
    },
    {
        "name": "13. Bảng CheckIn (Check-in địa điểm)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã lượt check-in"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("destinationId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Destination(id)"),
            ("note", "TEXT", "x", "", "Ghi chú khi check-in"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm check-in")
        ]
    },
    {
        "name": "14. Bảng SavedPlace (Địa điểm đã lưu cá nhân)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã địa điểm đã lưu"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("name", "VARCHAR(255)", "", "", "Tên địa điểm lưu"),
            ("category", "VARCHAR(50)", "", "", "Phân loại địa điểm"),
            ("latitude", "DOUBLE", "", "", "Tọa độ vĩ độ GPS"),
            ("longitude", "DOUBLE", "", "", "Tọa độ kinh độ GPS"),
            ("address", "VARCHAR(255)", "x", "", "Địa chỉ địa điểm"),
            ("imageUrl", "TEXT", "x", "", "Ảnh minh họa địa điểm"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm lưu")
        ]
    },
    {
        "name": "15. Bảng Journey (Hành trình GPS du ký)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã hành trình"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) tác giả"),
            ("title", "VARCHAR(255)", "", "", "Tên hành trình du ký"),
            ("description", "TEXT", "x", "", "Mô tả chi tiết hành trình"),
            ("coverImageUrl", "TEXT", "x", "", "Ảnh bìa hành trình"),
            ("isPublic", "BOOLEAN", "", "", "Trạng thái công khai"),
            ("status", "VARCHAR(30)", "", "", "Trạng thái hành trình (draft, active, completed)"),
            ("startDate", "TIMESTAMP", "x", "", "Ngày bắt đầu"),
            ("endDate", "TIMESTAMP", "x", "", "Ngày kết thúc"),
            ("totalDistance", "FLOAT", "", "", "Tổng quãng đường di chuyển (km)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo")
        ]
    },
    {
        "name": "16. Bảng Route (Tuyến đường trong hành trình)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã tuyến đường"),
            ("journeyId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Journey(id)"),
            ("name", "VARCHAR(255)", "", "", "Tên tuyến đường"),
            ("description", "TEXT", "x", "", "Mô tả tuyến đường"),
            ("transportMode", "VARCHAR(50)", "", "", "Phương tiện (walking, driving, cycling...)"),
            ("distanceKm", "FLOAT", "", "", "Độ dài tuyến đường (km)"),
            ("durationMin", "INT", "", "", "Thời gian di chuyển dự kiến (phút)"),
            ("color", "VARCHAR(20)", "", "", "Mã màu hiển thị polyline (#HEX)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo")
        ]
    },
    {
        "name": "17. Bảng RoutePoint (Tọa độ GPS điểm dừng)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã điểm tọa độ GPS"),
            ("routeId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến Route(id)"),
            ("latitude", "DOUBLE", "", "", "Vĩ độ GPS"),
            ("longitude", "DOUBLE", "", "", "Kinh độ GPS"),
            ("altitude", "DOUBLE", "x", "", "Độ cao so với mực nước biển (m)"),
            ("sequenceOrder", "INT", "", "", "Thứ tự sắp xếp chuỗi GPS"),
            ("timestamp", "TIMESTAMP", "", "", "Thời điểm ghi nhận GPS"),
            ("note", "TEXT", "x", "", "Ghi chú tại điểm dừng"),
            ("photoUrl", "TEXT", "x", "", "Ảnh chụp tại điểm dừng GPS")
        ]
    },
    {
        "name": "18. Bảng Event (Sự kiện / Lễ hội địa phương)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã sự kiện"),
            ("title", "VARCHAR(255)", "", "", "Tên sự kiện / lễ hội"),
            ("description", "TEXT", "x", "", "Mô tả nội dung sự kiện"),
            ("coverImageUrl", "TEXT", "x", "", "Ảnh banner sự kiện"),
            ("destinationId", "VARCHAR(36)", "x", "FK", "Khóa ngoại trỏ đến Destination(id) nếu có"),
            ("latitude", "DOUBLE", "", "", "Vĩ độ vị trí diễn ra"),
            ("longitude", "DOUBLE", "", "", "Kinh độ vị trí diễn ra"),
            ("startDate", "TIMESTAMP", "", "", "Thời điểm bắt đầu"),
            ("endDate", "TIMESTAMP", "x", "", "Thời điểm kết thúc"),
            ("category", "VARCHAR(50)", "", "", "Loại sự kiện (festival, meetup, workshop...)"),
            ("maxAttendees", "INT", "x", "", "Số lượng người tham gia tối đa"),
            ("currentCount", "INT", "", "", "Số lượng người đã đăng ký"),
            ("organizerId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id) ban tổ chức"),
            ("isPublic", "BOOLEAN", "", "", "Trạng thái công khai sự kiện"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo")
        ]
    },
    {
        "name": "19. Bảng ChatConversation (Cuộc trò chuyện AI)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã cuộc trò chuyện AI"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("title", "VARCHAR(255)", "x", "", "Tiêu đề phiên trò chuyện"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo"),
            ("updatedAt", "TIMESTAMP", "", "", "Thời điểm cập nhật")
        ]
    },
    {
        "name": "20. Bảng ChatMessage (Tin nhắn AI Assistant)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã tin nhắn"),
            ("conversationId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến ChatConversation(id)"),
            ("role", "VARCHAR(20)", "", "", "Vai trò gửi tin (user, assistant, system)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm gửi tin")
        ]
    },
    {
        "name": "21. Bảng AIHistory (Lịch sử tạo sinh AI)",
        "cols": [
            ("id", "VARCHAR(36)", "", "PK", "Mã lịch sử tạo AI"),
            ("userId", "VARCHAR(36)", "", "FK", "Khóa ngoại trỏ đến User(id)"),
            ("promptText", "TEXT", "", "", "Câu lệnh Prompt gửi đến AI"),
            ("responseJson", "TEXT", "", "", "Kết quả phản hồi dạng JSON"),
            ("type", "VARCHAR(50)", "", "", "Loại tác vụ AI (itinerary, route_optimization...)"),
            ("createdAt", "TIMESTAMP", "", "", "Thời điểm tạo")
        ]
    }
]

out_md = "# BẢNG TỪ ĐIỂN DỮ LIỆU CÁC BẢNG CỐT LÕI (DATABASE DICTIONARY)\n\n"
out_md += "Tài liệu từ điển dữ liệu chuẩn hóa cho 21 bảng cốt lõi của ứng dụng SmartTravel dựa trên file `schema.dbml` đã tinh giản.\n\n"
out_md += "Cấu trúc cột tuân thủ chính xác yêu cầu mẫu:\n"
out_md += "| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |\n\n"
out_md += "---\n\n"

for t in tables:
    out_md += f"### {t['name']}\n\n"
    out_md += "| STT | Thuộc tính | Kiểu dữ liệu | Null | Khóa | Mô tả |\n"
    out_md += "| :--- | :--- | :--- | :---: | :---: | :--- |\n"
    for idx, col in enumerate(t["cols"], 1):
        stt = str(idx)
        name, dtype, nullable, key, desc = col
        out_md += f"| {stt} | {name} | {dtype} | {nullable} | {key} | {desc} |\n"
    out_md += "\n---\n\n"

file_path = r"d:\Thuc_Tap_NDT\backend\prisma\database_dictionary.md"
with open(file_path, "w", encoding="utf-8") as f:
    f.write(out_md)

print("SUCCESSFULLY_GENERATED_DATABASE_DICTIONARY")
