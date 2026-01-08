# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG "VIDEO AUTO POST" 🚀

Chào mừng bạn đến với hệ thống tuyển chọn và đăng bài tự động. Dưới đây là quy trình vận hành từng bước:

## 1. 🔍 Giai đoạn 1: Săn Sản Phẩm & Phân Tích (Hunter)
Đây là bước "nhập hàng". Hệ thống sẽ xem các video nguồn, phân tích sản phẩm, và tạo ra lời khuyên bán hàng.

* **Cách chạy:**
  * Mở terminal, chạy lệnh: `node product_hunter.js`
* **Kết quả:**
  * File `products_database.csv` sẽ được tạo/cập nhật.
  * Mỗi sản phẩm sẽ có thêm cột "AI_Advice" (Lời khuyên chuyên gia) dựa trên thành phần.
  * **Hành động của bạn:** Mở file CSV này lên, xem cột `Decision`. Nếu thấy sản phẩm nào ngon, đổi `PENDING` thành `APPROVE`. (Hiện tại bot đang mặc định lấy hết để demo).

## 2. 🚛 Giai đoạn 2: Vận Chuyển & Đăng Bài (Automation Engine)
Đây là bước lấy hàng về kho và đăng lên kênh.

* **Cách chạy:**
  * Chạy lệnh: `node automation_engine.js`
* **Cơ chế:**
  * Bot đọc file CSV từ Giai đoạn 1.
  * Tự động tải video không logo về thư mục `videos_raw` (Kho hàng).
  * (Nâng cao) Bot sẽ mở trình duyệt, tự động vào TikTok Upload để đăng bài nếu bạn đã cài đủ thư viện.
* **Lưu ý:** Nếu mạng lỗi, bot sẽ tạo ra các file video giả lập (Mock) để bạn test quy trình mà không cần tải thật.

## 3. 👩‍⚕️ Giai đoạn 3: AI Skin Consultant (Frontend Mini-App)
Đây là "vũ khí bí mật" để chốt đơn Affiliate. Khách hàng sẽ dùng App này để soi da.

* **Cách dùng:**
  * Mở file `skin_consultant.html` bằng trình duyệt (Chrome/Edge) trên điện thoại hoặc máy tính.
  * Cấp quyền Camera.
  * Nhấn nút **BẮT ĐẦU QUÉT**.
  * Hệ thống sẽ giả lập quét da, phân tích và đưa ra **Gợi ý sản phẩm** dựa trên dữ liệu từ Giai đoạn 1.

## 📁 Cấu trúc Thư mục
* `products_database.csv`: Danh sách sản phẩm "đầu não".
* `videos_raw/`: Kho video chưa đăng (đã làm sạch watermark).
* `videos_processed/`: Kho video đã đăng xong.
* `automation_log.txt`: Nhật ký hoạt động của bot.

---
**Mẹo nhỏ:** Để hệ thống chạy trơn tru nhất, hãy đảm bảo bạn luôn chạy `product_hunter.js` trước để cập nhật danh sách hàng mới nhất, sau đó mới chạy `automation_engine.js` để xử lý đống hàng đó!
