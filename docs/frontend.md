# Phân tích Frontend SmartTravel

## Tổng quan Frontend

SmartTravel là một ứng dụng web sử dụng thư viện React và Next.js để xây dựng giao diện người dùng. Cấu trúc thư mục dự án được tổ chức theo mô hình thư mục chuẩn của Next.js.

### Thư viện sử dụng

* React: thư viện JavaScript để xây dựng giao diện người dùng
* Next.js: thư viện để xây dựng ứng dụng web dựa trên React

### Cấu trúc thư mục dự án

* `components`: thư mục chứa các component React
* `features`: thư mục chứa các tính năng của ứng dụng
* `hooks`: thư mục chứa các hook React
* `pages`: thư mục chứa các trang chính của ứng dụng
* `services`: thư mục chứa các dịch vụ API
* `store`: thư mục chứa các trạng thái ứng dụng

## Routing & Pages

Cấu trúc các trang chính của ứng dụng bao gồm:

* `Home`: trang chủ của ứng dụng
* `Chat`: trang chat của ứng dụng
* `Login/Register`: trang đăng nhập và đăng ký của ứng dụng

### Mô tả cấu trúc các trang chính

* `Home`: trang chủ của ứng dụng, hiển thị thông tin về ứng dụng và các tính năng chính
* `Chat`: trang chat của ứng dụng, cho phép người dùng gửi và nhận tin nhắn
* `Login/Register`: trang đăng nhập và đăng ký của ứng dụng, cho phép người dùng tạo tài khoản và đăng nhập vào ứng dụng

## Quản lý State & Context

Ứng dụng sử dụng Zustand và React Context để quản lý trạng thái ứng dụng.

### Zustand

* Zustand là một thư viện để quản lý trạng thái ứng dụng
* Ứng dụng sử dụng Zustand để lưu trữ thông tin về người dùng và các tính năng của ứng dụng

### React Context

* React Context là một thư viện để chia sẻ trạng thái ứng dụng giữa các component
* Ứng dụng sử dụng React Context để chia sẻ trạng thái ứng dụng giữa các component

## Tích hợp API & Kết nối

Ứng dụng sử dụng Axios để kết nối với backend và gửi/nhận tin nhắn chat theo thời gian thực.

### Axios

* Axios là một thư viện để gửi và nhận yêu cầu HTTP
* Ứng dụng sử dụng Axios để gửi và nhận tin nhắn chat theo thời gian thực

## UI Components & Responsive

Ứng dụng sử dụng các component React để xây dựng giao diện người dùng.

### Các component chính

* `Chatbox`: component chatbox của ứng dụng
* `Message`: component tin nhắn của ứng dụng
* `Sidebar`: component sidebar của ứng dụng

### Phong cách CSS

* Ứng dụng sử dụng phong cách CSS Material-UI để xây dựng giao diện người dùng

## Mermaid Flow

Luồng render component và cập nhật state khi người dùng gửi tin nhắn mới như sau:

```mermaid
graph LR
    A[Người dùng gửi tin nhắn] -->|Axios|> B[Backend xử lý tin nhắn]
    B -->|Axios|> C[Ứng dụng cập nhật trạng thái]
    C -->|Zustand|> D[Ứng dụng cập nhật trạng thái]
    D -->|React Context|> E[Component chatbox cập nhật trạng thái]
    E -->|React|> F[Giao diện người dùng cập nhật]
```

Lưu ý: Luồng trên chỉ là một ví dụ và có thể thay đổi tùy thuộc vào cấu trúc ứng dụng.