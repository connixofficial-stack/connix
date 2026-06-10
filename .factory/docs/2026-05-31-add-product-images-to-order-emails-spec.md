# I. Primer

## 1. TL;DR kiểu Feynman
Khi khách hàng nhận email đặt hàng, hiện tại có hai vấn đề:
1. Chi tiết sản phẩm chỉ có chữ, không có ảnh minh họa nên trông thiếu chuyên nghiệp.
2. Link tra cứu đơn hàng và link quản trị bị đặt cứng là `https://thanshoes.vn`, không tự động đổi theo cấu hình "URL Website" trong cài đặt Admin (ví dụ khi chạy thử ở localhost hay đổi tên miền).

Để sửa hai vấn đề này:
- Chúng ta lấy cấu hình "URL Website" (`site_url`) động từ cơ sở dữ liệu.
- Thay thế các link cứng `https://thanshoes.vn` bằng địa chỉ cấu hình động đó.
- Thêm một cột ảnh sản phẩm nhỏ (thumbnail 50x50px) trong bảng chi tiết đơn hàng của email. Nếu ảnh dùng link tương đối (như `/images/...`), chúng ta sẽ chắp thêm địa chỉ trang web cấu hình ở trên để ảnh hiện lên chính xác.

## 2. Elaboration & Self-Explanation
Hiện tại, hệ thống của Thanshoes sử dụng các hàm dựng template email (`getOrderPlacedCustomerTemplate` cho khách và `getOrderPlacedShopTemplate` cho shop) trong file `convex/emailTemplates.ts`.

Chúng ta sẽ sửa đổi các hàm này để chấp nhận thêm tham số `siteUrl` (được đọc từ setting `site_url` trong cơ sở dữ liệu khi tạo đơn hàng):
1. **Lấy địa chỉ website động**: Trong mutation `placeOrder` của `convex/orders.ts`, truy vấn setting `site_url`. Nếu rỗng, sử dụng fallback mặc định là `https://thanshoes.vn`.
2. **Chuẩn hóa liên kết**: Thay thế toàn bộ link cứng `https://thanshoes.vn` trong email template bằng `siteUrl`.
3. **Thêm ảnh sản phẩm**: Trong bảng danh sách sản phẩm, thêm cột ảnh đại diện (kích thước 50x50px, bo góc 8px, viền xám). Nếu `productImage` là đường dẫn tương đối (bắt đầu bằng `/`), helper `formatImageUrl` sẽ ghép nối `siteUrl` để chuyển thành link tuyệt đối. Nếu không có ảnh, hiển thị placeholder xám nhẹ.

## 3. Concrete Examples & Analogies
- **Ví dụ**:
  - Khi chạy ở máy cá nhân (localhost), cấu hình "URL Website" là `http://localhost:3000`.
  - Email gửi đi sẽ chứa link tra cứu: `http://localhost:3000/tra-cuu-don-hang?orderNumber=ORD-...` thay vì `https://thanshoes.vn/...`.
  - Ảnh sản phẩm lưu `/assets/giay.png` sẽ hiển thị từ `http://localhost:3000/assets/giay.png`.
- **Analogy**: Giống như việc in thiệp mời dự tiệc. Thay vì in sẵn địa chỉ nhà hàng cố định lên hàng nghìn thiệp (hardcode), bạn để trống phần địa chỉ và dùng một con dấu cao su đóng địa chỉ cụ thể của chi nhánh tổ chức tiệc lên đó (động). Như vậy, nếu tiệc chuyển sang chi nhánh khác, bạn chỉ cần đổi con dấu thay vì vứt bỏ toàn bộ thiệp.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Triệu chứng quan sát**: 
  1. Email xác nhận đơn hàng thiếu hình ảnh đại diện sản phẩm trong bảng chi tiết sản phẩm.
  2. Các đường dẫn trong email (link tra cứu đơn hàng của khách, link xử lý đơn hàng của shop) bị đặt cứng là `https://thanshoes.vn` thay vì lấy theo cài đặt cấu hình `site_url` ở trang Admin Settings.
- **Mức độ ảnh hưởng**: Trải nghiệm người dùng (UX) kém, thiếu chuyên nghiệp và gây lỗi liên kết khi chạy thử nghiệm trên localhost hoặc chuyển đổi tên miền.
- **Khả năng tái hiện**: Tái hiện ổn định 100% với mọi đơn đặt hàng mới.
- **Tiêu chuẩn pass/fail**:
  - *Pass*: Email gửi đi hiển thị ảnh sản phẩm 50x50px bên cạnh tên sản phẩm. Các đường liên kết tra cứu đơn hàng và link quản trị trỏ đúng địa chỉ cấu hình trong Admin Settings (`site_url`).
  - *Fail*: Email bị vỡ bố cục, link ảnh bị hỏng, hoặc các liên kết vẫn trỏ về tên miền cứng `https://thanshoes.vn`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: 
  1. Trong file [emailTemplates.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/emailTemplates.ts), hàm `getOrderPlacedCustomerTemplate` và `getOrderPlacedShopTemplate` không vẽ thẻ `<img>` cho sản phẩm và đặt cứng địa chỉ URL `https://thanshoes.vn` trong mã HTML.
  2. Trong [orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/orders.ts), hàm gửi email không truy vấn cấu hình `site_url` từ cơ sở dữ liệu để truyền vào các hàm dựng template.
- **Giả thuyết đối chứng**:
  - Không có giả thuyết đối chứng khác do mã nguồn hiển thị rất rõ ràng việc hardcode chuỗi `"https://thanshoes.vn"` và thiếu logic render ảnh.

---

# IV. Proposal (Đề xuất)

1. **Cập nhật `convex/emailTemplates.ts`**:
   - Viết helper `formatImageUrl(src, siteUrl)` chuyển đổi link tương đối thành tuyệt đối.
   - Viết helper `formatSiteUrl(siteUrl)` để xóa ký tự `/` thừa ở cuối URL website nếu có, tránh việc nối chuỗi bị nhân đôi dấu `/`.
   - Sửa hàm `getOrderPlacedCustomerTemplate(order, siteUrl)` và `getOrderPlacedShopTemplate(order, customer, siteUrl)` nhận tham số `siteUrl`.
   - Cập nhật HTML bảng sản phẩm: Thêm cột hiển thị ảnh trước cột tên.
   - Thay thế các chuỗi `"https://thanshoes.vn"` thành biến `${formatSiteUrl(siteUrl)}`.
2. **Cập nhật `convex/orders.ts`**:
   - Trong mutation `placeOrder`, truy vấn `site_url` từ bảng `settings`.
   - Truyền `siteUrl` động vào `getOrderPlacedCustomerTemplate` và `getOrderPlacedShopTemplate` khi lên lịch gửi email.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **[convex/emailTemplates.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/emailTemplates.ts)**:
  - *Sửa*: Thêm helper `formatImageUrl`, `formatSiteUrl`, thêm tham số `siteUrl` cho các hàm template, vẽ cột ảnh sản phẩm và thay thế link hardcode bằng link động.
- **[convex/orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/orders.ts)**:
  - *Sửa*: Truy vấn setting `site_url` trong `placeOrder` và truyền vào các hàm template.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa file [convex/emailTemplates.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/emailTemplates.ts) tích hợp hiển thị ảnh và URL website động.
2. Sửa file [convex/orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/orders.ts) truy vấn cấu hình website và truyền vào template.
3. Chạy `oxlint` hoặc `tsc` để kiểm tra kiểu dữ liệu tĩnh.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

- **Kiểm tra biên dịch**: Chạy oxlint/tsc để đảm bảo không có lỗi kiểu dữ liệu.
- **Kiểm tra thủ công**:
  1. Thay đổi cấu hình "URL Website" ở cài đặt admin thành `http://localhost:3000`.
  2. Đặt một đơn hàng thử nghiệm.
  3. Đọc console log/email log để kiểm tra xem link tra cứu đơn hàng có trỏ đúng về `http://localhost:3000/tra-cuu-don-hang...` và ảnh sản phẩm có dạng `http://localhost:3000/...` hay không.

---

# VIII. Todo

- [ ] Sửa [convex/emailTemplates.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/emailTemplates.ts) để hỗ trợ render cột ảnh sản phẩm và thay đổi liên kết động.
- [ ] Sửa [convex/orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/orders.ts) để lấy `site_url` từ db và truyền vào template email.
- [ ] Verify tĩnh (oxlint/tsc).

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Email gửi cho khách hàng và shop hiển thị ảnh đại diện sản phẩm bên cạnh tên sản phẩm.
- Ảnh có kích thước cố định 50x50px, bo góc và viền tinh tế. Nếu sản phẩm không có ảnh, hiển thị khối placeholder xám gọn gàng.
- Link tra cứu đơn hàng trong email trỏ động theo cấu hình `site_url`.
- Link quản trị đơn hàng cho shop trỏ động theo cấu hình `site_url`.
- Bố cục danh sách sản phẩm trong email cân đối và không bị lệch dòng.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Nếu `site_url` cấu hình sai (ví dụ chứa các ký tự lạ hoặc trống hoàn toàn), ảnh sản phẩm có thể không hiển thị được.
- **Cách giảm thiểu**: Helper `formatImageUrl` sẽ có cơ chế fallback. Nếu `siteUrl` rỗng hoặc không hợp lệ, ta sẽ fallback về `https://thanshoes.vn` hoặc giữ nguyên link gốc.
- **Rollback**: Dùng `git checkout` để khôi phục lại trạng thái cũ của file `convex/emailTemplates.ts` và `convex/orders.ts`.

---

# XI. Out of Scope (Ngoài phạm vi)

- Việc upload, lưu trữ ảnh sản phẩm mới hoặc thay đổi cách quản lý media.
- Thay đổi các email template khác không chứa danh sách chi tiết sản phẩm (như email OTP, email Đơn hàng đã giao, Đơn hàng bị hủy).
