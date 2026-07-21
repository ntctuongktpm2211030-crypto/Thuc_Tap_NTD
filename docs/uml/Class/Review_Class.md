# Đánh giá Hệ thống Sơ đồ Lớp (UML Class Diagrams Review)

Tài liệu này tổng hợp kết quả đánh giá hệ thống Sơ đồ lớp sau khi đã được chỉnh sửa trực tiếp, loại bỏ Việt hóa để tương thích 1:1 với Database và Source Code.

---

## 1. Tiêu chí đặt tên chuẩn cơ sở dữ liệu
*   **Tên lớp**: Giữ nguyên tên tiếng Anh gốc trùng khớp 100% với tên Model trong Prisma (Ví dụ: `User`, `Profile`, `Trip`, `TripDay`, `TripActivity`, `Destination`, `Post`, `Comment`, `Like`, `Bookmark`).
*   **Thuộc tính & Kiểu dữ liệu**: Trùng khớp với định nghĩa trong CSDL (Ví dụ: `id: String`, `ownerId: String`, `createdAt: DateTime`, `totalBudget: Float`).
*   **Nhãn liên kết & Bản số**: Sử dụng các nhãn quan hệ chuẩn và bản số chuẩn UML (`1`, `0..1`, `0..*`) để thuận tiện cho việc đối chiếu tự động.

---

## 2. Kết quả đạt được
1.  **Tính nhất quán tuyệt đối**: Có thể đối chiếu song song giữa sơ đồ lớp và mã nguồn Prisma Schema.
2.  **Đầy đủ thuộc tính**: Đã bổ sung toàn bộ các trường tùy chọn (`[0..1]`) và trường thời gian (`createdAt`, `updatedAt`) bị thiếu trong phiên bản trước.
3.  **Ràng buộc qua UML Notes**: Thể hiện các ràng buộc phức hợp của Prisma (`@@unique([postId, userId])`) một cách tường minh.
