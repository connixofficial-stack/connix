# Spec: Cấu hình Hiệu ứng Combo & Nút mạng xã hội trên trang Chi tiết sản phẩm

Tài liệu này đặc tả chi tiết kế hoạch thiết kế và triển khai thêm 2 tuỳ chọn cấu hình trải nghiệm cho trang chi tiết sản phẩm (PDP):
1. **Hiệu ứng Combo (Combo Animate):** Cho phép tuỳ chọn hiệu ứng chuyển động hoặc làm nổi bật khối Combo.
2. **Nút mạng xã hội (Social Buttons):** Cho phép cấu hình hiển thị các liên kết mua hàng/liên hệ bên thứ ba (Shopee, Lazada, Zalo, Tiktok...) ngay dưới nút CTA chính.

---

# I. Primer

## 1. TL;DR kiểu Feynman
- **Hiệu ứng Combo:** Giúp khối Combo "ngọ nguậy" (nhảy nhảy, đổi màu, viền cầu vồng) để đập vào mắt người mua hàng nhanh hơn, kích thích họ mua số lượng lớn.
- **Nút mạng xã hội:** Đặt một hàng nút đẹp mắt (Shopee, Lazada, Tiktok, Zalo...) ngay dưới nút liên hệ chính để khách hàng có thể click nhảy sang sàn thương mại điện tử hoặc chat trực tiếp qua mạng xã hội khác chỉ trong 1 nốt nhạc.
- **Quản lý:** Tất cả cấu hình này được tuỳ chỉnh trực tiếp trong trang quản lý Trải nghiệm (Experience Editor) tại `system/experiences/product-detail` với đầy đủ tính năng bật/tắt, sửa nhãn, load nhanh từ thông tin shop có sẵn và xem trước (Preview) theo thời gian thực.

## 2. Elaboration & Self-Explanation
- Khi trang chi tiết sản phẩm được bật tính năng Combo và chế độ bán hàng qua liên hệ, khối Combo đóng vai trò cực kỳ lớn trong việc tăng doanh số (AOV - Average Order Value). Để làm khối này nổi bật hơn nữa, chúng ta bổ sung thuộc tính cấu hình `comboAnimateType` vào trong tệp cấu hình trải nghiệm `product_detail_ui`. Khi Admin chọn một kiểu hiệu ứng (ví dụ: Viền cầu vồng chuyển động - Rainbow Border), khối combo ngoài storefront sẽ được áp dụng class CSS đặc biệt để sinh hoạt ảnh động mượt mà.
- Đồng thời, đối với các sản phẩm bán đa kênh, khách hàng có thói quen mua trên các sàn TMĐT (Shopee, Lazada) hoặc các nền tảng chat khác. Việc cấu hình linh hoạt danh sách nút liên kết mạng xã hội `socialButtons` kèm khả năng kéo thả sắp xếp thứ tự và load nhanh dữ liệu từ cấu hình chung giúp Admin tiết kiệm tối đa thời gian vận hành, tăng tỉ lệ chuyển đổi nhờ tối ưu luồng tiếp cận của người dùng.

## 3. Concrete Examples & Analogies
- **Hiệu ứng Combo:** Giống như tấm biển hiệu ngoài đời thực. Biển hiệu bình thường thì ít ai để ý (Animate: None), nhưng nếu gắn thêm đèn LED nhấp nháy đổi màu (Animate: Border Rainbow) hoặc biển vẫy đung đưa (Animate: Bounce) thì khách đi ngang qua sẽ bị thu hút ánh nhìn ngay lập tức.
- **Nút mạng xã hội:** Giống như quầy tiếp tân đa kênh. Ngoài nút chuông gọi cửa chính (CTA Zalo chính), quầy còn để sẵn các mã QR hoặc biểu tượng chỉ dẫn: "Mua qua Shopee tại đây", "Chat qua Messenger tại đây", giúp khách dễ dàng chọn kênh liên lạc quen thuộc nhất với họ.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Cấu trúc lưu trữ cấu hình trải nghiệm:** Cấu hình PDP được lưu trong bảng `settings` dưới key `product_detail_ui`. Trường `value` của bảng `settings` là `v.any()`, cho phép mở rộng dữ liệu linh hoạt mà không cần chỉnh sửa DB Schema của Convex.
- **Mã nguồn trang Admin Config:** Trang `app/system/experiences/product-detail/page.tsx` sử dụng React hook `useExperienceConfig` để quản lý local state của config và gọi mutation `api.settings.setMultiple` để ghi đè dữ liệu.
- **Mã nguồn Storefront PDP:** Tệp `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` nhận cấu hình và render block Combo cùng với các layout Classic, Modern, Minimal.
- **Icon Svg & Brand Colors:** Tệp `app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx` đã định nghĩa sẵn các SVG chất lượng cao và mã màu chuẩn của Shopee (`#ee4d2d`), Zalo (`#0084ff`), TikTok, Lazada (`#0f1689`), Tiki (`#1a94ff`), Messenger, v.v. Chúng ta sẽ tái sử dụng lại các định nghĩa này để tránh duplicated code hoặc tự vẽ lại.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- *Không áp dụng vì đây là tính năng mới mở rộng (New Feature Requirement), không phải sửa lỗi.*

---

# IV. Proposal (Đề xuất)

### 1. Mở rộng kiểu dữ liệu cấu hình trải nghiệm
Thêm các thuộc tính mới vào kiểu `ProductDetailExperienceConfig` trong `app/system/experiences/product-detail/page.tsx`:
- `comboAnimateType`: `'none' | 'pulse' | 'bounce' | 'text-highlight' | 'border-rainbow'` (mặc định `'none'`).
- `showSocialButtons`: `boolean` (mặc định `false`).
- `socialButtons`: `Array<{ id: string; icon: string; label: string; url: string; active: boolean }>` (mặc định trống `[]`).

### 2. Thiết kế giao diện quản trị (Admin UI/UX)
Tại `app/system/experiences/product-detail/page.tsx`:
- **Khối Hiệu ứng Combo:** Thêm nhóm điều khiển trong phần cấu hình chung:
  - Một `SelectRow` chọn kiểu hiệu ứng `comboAnimateType`.
- **Khối Nút Mạng Xã Hội:** Thêm một `ControlCard` mới có tên "Nút liên hệ mạng xã hội" ở cột bên trái:
  - Toggle `showSocialButtons` để bật/tắt toàn bộ.
  - Khi bật, hiển thị danh sách các nút liên kết mạng xã hội hiện có.
  - Cho phép Admin thêm mới nút, sửa Nhãn, sửa URL, chọn Icon đại diện (qua picker inline từ danh sách biểu tượng).
  - Có nút "Tải từ cấu hình hệ thống" để tự động điền các mạng xã hội đã cài đặt ở phần thông tin liên hệ chung (Zalo, Facebook, TikTok, Shopee, Lazada, v.v.).
  - Hỗ trợ kéo thả sắp xếp (Drag & Drop) thứ tự giống như cấu hình SpeedDial.
- **Tích hợp Preview:** Cập nhật hàm `getPreviewProps` để truyền các thuộc tính mới sang `ProductDetailPreview`.

### 3. Thiết kế hiển thị ngoài Storefront & Preview (PDP UI/UX)
Tại `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`:
- **Áp dụng hiệu ứng Combo:**
  - Nếu `comboAnimateType` khác `'none'`, thêm class tương ứng vào thẻ bao bọc của `ProductCombosBlock`.
  - Định nghĩa các CSS keyframe animations (hoặc các lớp Tailwind) ở cuối tệp hoặc trong file css dùng chung:
    - `.animate-combo-pulse`: Nhấp nháy opacity mượt mà.
    - `.animate-combo-bounce`: Nhảy tâng nhẹ theo phương thẳng đứng.
    - `.animate-combo-text-highlight`: Đổi màu chữ liên tục từ đỏ sang cam/vàng.
    - `.animate-combo-border-rainbow`: Chạy dải màu cầu vồng (linear-gradient chuyển động liên tục) trên phần viền của khối Combo.
- **Hiển thị nút mạng xã hội:**
  - Đặt khối nút mạng xã hội ngay dưới khu vực nút CTA mua hàng / liên hệ chính.
  - Thiết kế dạng danh sách các nút nằm ngang hoặc lưới 2 cột tùy theo breakpoint màn hình di động/desktop.
  - Mỗi nút có dạng icon tròn hoặc viên thuốc (pill badge) chứa icon + nhãn ngắn (ví dụ: "Mua tại Shopee", "Chat Zalo"), sử dụng đúng mã màu của brand (ví dụ Shopee nền cam chữ trắng, hoặc viền cam chữ cam sang trọng).
  - Sử dụng chung các SVG icon chất lượng cao được chiết xuất từ module SpeedDial.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI & Configuration
- #### [MODIFY] [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
  - *Vai trò hiện tại:* Hiển thị trang chi tiết sản phẩm.
  - *Thay đổi:* Áp dụng hiệu ứng động cho khối Combo dựa theo thuộc tính `comboAnimateType` từ cấu hình trải nghiệm; render danh sách các nút mạng xã hội ở vị trí dưới nút CTA liên hệ chính.
- #### [MODIFY] [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/experiences/previews/ProductDetailPreview.tsx)
  - *Vai trò hiện tại:* Render giao diện mô phỏng (preview) trang chi tiết sản phẩm trong Experience Editor.
  - *Thay đổi:* Tích hợp hiển thị hiệu ứng động của Combo và mockup danh sách các nút mạng xã hội tương thích với cấu hình thời gian thực.
- #### [MODIFY] [page.tsx (Experiences Product Detail)](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/system/experiences/product-detail/page.tsx)
  - *Vai trò hiện tại:* Trang cấu hình trải nghiệm chi tiết sản phẩm cho Admin.
  - *Thay đổi:* Mở rộng định nghĩa kiểu cấu hình `ProductDetailExperienceConfig`; thêm các trường nhập liệu chọn hiệu ứng Combo; thêm form quản lý danh sách nút mạng xã hội (CRUD, kéo thả sắp xếp, load từ settings).

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và Khảo sát mã nguồn:** Xem chi tiết cách component `SpeedDialForm` render các SVG icon và thực hiện kéo thả để tái sử dụng tối đa logic/giao diện đẹp mắt.
2. **Cập nhật Trang Quản Trị Trải Nghiệm:** Sửa đổi `app/system/experiences/product-detail/page.tsx`, mở rộng interface, thiết kế form quản lý nút mạng xã hội và dropdown chọn hiệu ứng Combo.
3. **Cập nhật Component Preview:** Cập nhật `ProductDetailPreview.tsx` để hiển thị trực quan các cấu hình mới trong quá trình Admin tinh chỉnh.
4. **Cập nhật Storefront PDP:** Sửa đổi `ProductDetailPage.tsx` để kích hoạt hiệu ứng động trên khối Combo thật ngoài trang chi tiết sản phẩm và kết nối danh sách nút mạng xã hội bên dưới nút liên hệ chính.
5. **Định nghĩa các Class Hiệu ứng động:** Thêm css keyframes cho rainbow-border, text-highlight vào `app/globals.css` hoặc khai báo inline class CSS trong component.
6. **Xác minh lỗi biên dịch:** Chạy `bunx tsc --noEmit` để đảm bảo hệ thống không có lỗi TypeScript sau khi thay đổi kiểu cấu hình.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo không có lỗi kiểu dữ liệu phát sinh.

### Manual Verification Checklist
1. **Kiểm tra Cấu hình Admin:**
   - Truy cập `http://localhost:3000/system/experiences/product-detail`.
   - Thay đổi hiệu ứng Combo -> Đảm bảo giao diện Preview cập nhật hiệu ứng tức thì.
   - Bật nút Mạng xã hội -> Nhấp nút "+ Thêm" -> Chọn "Shopee" -> Nhập URL -> Đảm bảo Preview xuất hiện nút Shopee với logo cam và nhãn chính xác.
   - Thử kéo thả sắp xếp thứ tự các nút mạng xã hội -> Đảm bảo Preview cập nhật đúng thứ tự mới.
   - Nhấp nút "Tải từ cấu hình hệ thống" -> Kiểm tra danh sách các mạng xã hội được tự động điền đầy đủ và đúng thông tin của shop.
   - Nhấp nút "Lưu" -> F5 tải lại trang -> Đảm bảo cấu hình được lưu trữ và khôi phục chính xác.
2. **Kiểm tra PDP Storefront:**
   - Truy cập trang sản phẩm ngoài storefront.
   - Kiểm tra khối Combo có hoạt động hiệu ứng động (Pulse, Bounce, Rainbow Border) mượt mà không.
   - Xác nhận sự xuất hiện của các nút mạng xã hội dưới nút liên hệ chính và khi click vào sẽ chuyển hướng tab mới sang URL tương ứng chính xác.

---

# VIII. Todo

- [ ] Sửa đổi định nghĩa cấu hình và bổ sung các trường nhập liệu trong trang Admin `app/system/experiences/product-detail/page.tsx`
- [ ] Tích hợp kéo thả, tải cấu hình nhanh từ hệ thống cho danh sách nút liên hệ mạng xã hội trong trang Admin
- [ ] Bổ sung hiển thị và hoạt họa (Animate) cho Combo trong tệp preview `ProductDetailPreview.tsx`
- [ ] Bổ sung hiển thị và hoạt họa cho Combo trong tệp storefront `ProductDetailPage.tsx`
- [ ] Định nghĩa các hiệu ứng động CSS trong dự án
- [ ] Biên dịch kiểm tra TypeScript bằng `bunx tsc --noEmit`

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Giao diện cấu hình trong Admin thân thiện, trực quan, có kéo thả sắp xếp các nút mạng xã hội.
- Giao diện Preview trên trang cấu hình cập nhật ngay lập tức các thay đổi về hoạt ảnh combo và các nút mạng xã hội khi Admin thay đổi cài đặt.
- Ngoài trang chi tiết sản phẩm ngoài storefront, hiệu ứng động của combo chạy chính xác theo tuỳ cấu hình (Pulse nhấp nháy, Bounce nhảy nhảy, Rainbow Border chạy viền cầu vồng bắt mắt, Highlight text đổi màu liên tục).
- Các nút mạng xã hội hiển thị tinh tế dưới nút Zalo/Liên hệ chính ở cả 3 phong cách (Classic, Modern, Minimal) và mở đúng liên kết khi click.
- Lệnh `bunx tsc --noEmit` không trả ra bất kỳ lỗi TypeScript nào.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Cấu trúc dữ liệu cấu hình trải nghiệm bị lưu đè làm mất các cấu hình PDP hiện tại của shop.
- **Hoàn tác:** Khôi phục các file thay đổi về trạng thái Git commit gần nhất. Dữ liệu trong bảng `settings` có thể được cấu hình lại thủ công từ giao diện Admin.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không can thiệp vào trang thanh toán, giỏ hàng, hoặc checkout của shop.
- Không thay đổi hành vi của tính năng Combo chính (như giá cả, quy tắc mua hàng) mà chỉ tập trung vào phần hiển thị và tương tác người dùng.
