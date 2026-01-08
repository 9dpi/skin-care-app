## 🤖 Chế độ Tự động hoàn toàn (Full Automation)

Đây là "Trái tim" của hệ thống, giúp bạn không cần chạm vào máy tính mà vẫn có bài đăng đều đặn.

### ⚙️ Cách hoạt động của Bot:
1.  **Quét Video**: Bot tự động kiểm tra thư mục `videos_raw`.
2.  **AI Viết bài**: Tự động dùng AI để đặt tiêu đề (Title), mô tả và hashtag cực cuốn.
3.  **Lách bản quyền**: Tự động lật gương (Mirror) và chèn thêm âm thanh để tránh bị TikTok quét re-post.
4.  **Hẹn giờ**: Tự động đăng vào đúng **06:00 sáng** và **15:00 chiều** hàng ngày.

### 🚀 Cách khởi động Bot:
1.  **Chuẩn bị Video**:
    Copy các video gốc của bạn vào thư mục `videos_raw`.
2.  **Chạy Bot bằng Node.js**:
    Mở terminal tại thư mục này và chạy lệnh:
    ```bash
    node automation_engine.js
    ```
    *Bot sẽ tự động chạy và kiểm tra giờ đăng (06:00 và 15:00) mỗi ngày.*

### 🛠️ Lưu ý về Video Processing (Mirror/Audio):
- Hệ thống sử dụng công cụ **FFmpeg** để lật gương và chèn âm thanh. 
- Nếu máy bạn chưa cài FFmpeg, Bot vẫn sẽ chạy và dùng AI để viết nội dung, nhưng sẽ bỏ qua bước xử lý hình ảnh vật lý.
- Để lách bản quyền tốt nhất, bạn nên tải **FFmpeg** về máy.

## 🖥️ Dashboard (Giao diện điều khiển)
Bạn vẫn có thể mở file `index.html` để:
- Kiểm tra trạng thái các video đang chờ.
- Xem trước (Preview) nội dung AI đã tạo.
- Bật/Tắt chế độ tự động nhanh chóng.
