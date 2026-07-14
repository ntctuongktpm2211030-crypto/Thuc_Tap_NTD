---
name: Terraholic
description: Premium Travel Platform with Ocean Navigation design system
colors:
  primary: "#2563eb"
  primary-dark: "#1d4ed8"
  primary-light: "#3b82f6"
  neutral-bg: "#0b0f19"
  neutral-surface: "#111827"
  neutral-elevated: "#1f2937"
  text-primary: "#f9fafb"
  text-secondary: "#d1d5db"
  text-muted: "#6b7280"
  accent-teal: "#14b8a6"
  accent-emerald: "#10b981"
  accent-rose: "#f43f5e"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.8rem, 4vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.15
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(1.3rem, 2.5vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  card-glass:
    backgroundColor: "rgba(17, 24, 39, 0.75)"
    rounded: "{rounded.lg}"
    padding: "16px"
  input-text:
    backgroundColor: "{colors.neutral-elevated}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: Terraholic

## 1. Overview

**Creative North Star: "The Ocean Navigator"**

Hệ thống thiết kế của Terraholic hướng tới cảm giác của một cuốn nhật trình thám hiểm biển cả cao cấp, tinh tế và đầy cảm hứng tự do. Nền tảng sử dụng phông nền màu tối sâu thẳm của đại dương kết hợp các dải màu nước ven bờ và rặng san hô, mang lại độ tương phản cao, hiện đại và tập trung tối đa vào thông tin du lịch và bản đồ số.

**Key Characteristics:**
- **Độ sâu đại dương:** Sử dụng các tông màu tối phân cấp rõ ràng (từ nền đen nước sâu đến bề mặt các trạm điều hướng nổi lên).
- **Tập trung vào bản đồ:** Các công cụ và bảng thông tin bản đồ hiển thị gọn gàng, tinh tế và tối ưu diện tích.
- **Tinh tế tạp chí:** Kết hợp kiểu chữ serif truyền thống (Playfair Display) cho tiêu đề để tạo tính chất biên tập báo chí du lịch cao cấp.

## 2. Colors

Bảng màu mang sắc thái của đại dương sâu thẳm, rặng san hô ven bờ và những tia nắng bình minh.

### Primary
- **Ocean Voyage Blue** (#2563eb): Màu xanh chủ đạo của biển cả, dùng cho các nút hành động chính (CTA), liên kết nổi bật và trạng thái kích hoạt.

### Neutral
- **Deep Ocean Abyssal** (#0b0f19): Màu nền tối toàn cục của ứng dụng, gợi cảm giác đại dương vô tận.
- **Dark Sea Floor** (#111827): Màu nền bề mặt (surfaces) cho thẻ bài viết, widget sidebar và danh sách chat.
- **Elevated Reef** (#1f2937): Màu nền của các thành phần nổi lên khi được tương tác hoặc nâng cao (overlays, dropdowns).

### Named Rules
**The Ocean Rarity Rule.** Màu xanh Ocean Voyage Blue (`--gold`) chỉ được sử dụng tối đa cho 10% diện tích giao diện trên bất kỳ trang nào. Rực rỡ và hiếm hoi chính là điểm nhấn của hành trình du lịch.

## 3. Typography

**Display Font:** Playfair Display (Serif)  
**Body Font:** Inter (Sans-serif)  
**Label/Mono Font:** Plus Jakarta Sans (Sans-serif)

Kiểu chữ mang tính chất tương phản cao giữa tiêu đề cổ điển kiểu tạp chí và phần nội dung/thông số kỹ thuật hiện đại dễ đọc.

### Hierarchy
- **Display** (800, clamp(1.8rem, 4vw, 3.5rem), 1.15): Dùng cho tiêu đề bài viết lớn, banner chính.
- **Headline** (700, clamp(1.3rem, 2.5vw, 2rem), 1.2): Tiêu đề các mục lớn, thẻ bài viết nổi bật.
- **Title** (600, 1.25rem, 1.3): Tiêu đề phần nhỏ, tên người dùng.
- **Body** (400, 15px, 1.6): Nội dung mô tả, bài đăng. Giới hạn độ rộng tối đa từ 65–75 ký tự (ch) để duy trì khả năng đọc tối ưu.
- **Label** (700, 0.68rem, 1.2): Nhãn danh mục, kicker chữ in hoa, thông số khoảng cách.

## 4. Elevation

Giao diện phẳng ở trạng thái tĩnh. Chiều sâu được dựng lên qua cách phân tầng màu sắc thay vì đổ bóng đậm. Bóng đổ chỉ xuất hiện để phản hồi tương tác.

### Shadow Vocabulary
- **Response Ambient Glow** (`box-shadow: 0 8px 40px rgba(0,0,0,0.4)`): Bóng đổ mờ nhẹ xuất hiện khi hover lên thẻ, báo hiệu phần tử có thể click.
- **Floating Sheet** (`box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08)`): Độ nổi cho khung nhập liệu chat nổi và các thông báo tạm thời.

### Named Rules
**The Flat-At-Rest Rule.** Giao diện hoàn toàn phẳng ở trạng thái nghỉ. Mọi chuyển động hoặc nâng cao chiều sâu (shadow, border glow) chỉ được kích hoạt để phản hồi tương tác từ người dùng (hover, focus, active).

## 5. Components

### Buttons
- **Shape:** Tròn hoàn toàn (rounded-full, 9999px) cho các nút hành động chính để tạo sự mềm mại.
- **Primary:** Nền màu xanh Ocean Voyage Blue, chữ trắng, padding (`8px 16px`).
- **Hover / Focus:** Phóng to nhẹ (`scale-105` trên nút nổi chatbot) và chuyển màu nền sẫm hơn (`#1d4ed8`), viền focus ring xanh dịu nhẹ.

### Cards / Containers
- **Corner Style:** Bo góc mềm mại (16px) cho thẻ bài viết lớn, bo góc vừa (12px) cho thẻ bài viết nhỏ.
- **Background:** Nền tối `var(--bg-surface)` có viền mỏng (`1px solid var(--border-subtle)`).
- **Shadow Strategy:** Không bóng đổ ở trạng thái tĩnh; hover tăng shadow nhẹ và dịch chuyển vị trí (`translateY(-4px)`).

### Inputs / Fields
- **Style:** Nền tối `var(--bg-primary)` kết hợp viền mỏng nhẹ, bo góc vừa (12px).
- **Focus:** Tự động chuyển viền sang màu xanh Ocean Voyage Blue và kích hoạt bóng mờ xanh nhạt.

### Navigation
- **Style:** Thanh menu trên cùng mờ đục với hiệu ứng backdrop-blur và viền dưới tinh tế. Các nút danh mục hiển thị nhãn chữ rõ ràng kèm icon mượt mà.

## 6. Do's and Don'ts

### Do:
- **Do** Duy trì độ tương phản văn bản tối thiểu là 4.5:1 (đặc biệt đối với các nhãn phụ màu xám trong Light Mode).
- **Do** Áp dụng bộ lọc `@media (prefers-reduced-motion: reduce)` để vô hiệu hóa các chuyển động trượt/phóng to khi người dùng bật chế độ giảm chuyển động.
- **Do** Đóng tất cả các menu, modal bằng phím Escape để tăng khả năng tiếp cận bàn phím.

### Don't:
- **Don't** Sử dụng các hiệu ứng phóng to, thu nhỏ trực tiếp trên thẻ ảnh `<img>` khi hover. Animate thẻ card thay vì ảnh.
- **Don't** Sử dụng chữ gradient (`background-clip: text`) trên bất kỳ tiêu đề hoặc nhãn nào. Chỉ dùng màu chữ solid.
- **Don't** Sử dụng viền sọc một bên trái hoặc phải (`border-l-4`) dày hơn 1px làm điểm nhấn trang trí cho thẻ hoặc dòng trạng thái. Thay thế bằng màu nền hoặc viền bao quanh mỏng nhẹ.
