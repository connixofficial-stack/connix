# I. Primer

## 1. TL;DR kiểu Feynman
Để khung tải ảnh của từng phiên bản sản phẩm không bị "lỏ" (tức là chỉ có nút chọn file thô sơ), chúng ta nâng cấp nó lên chuẩn chuyên nghiệp:
- Hiển thị ô vuông nhỏ 40x40px trong bảng.
- Khi người dùng click vào, một menu bong bóng (Popover) sẽ mở ra ngay tại đó.
- Menu này cho phép: chọn file ảnh, dán ảnh trực tiếp từ Clipboard, nhập link URL ảnh từ ngoài, bấm nút "Cắt / Sửa" để mở hộp thoại cắt ảnh/xoá nền chuẩn của hệ thống, hoặc xóa ảnh.
- Nhờ vậy, giao diện bảng biến thể vừa siêu gọn gàng, vừa có đầy đủ các tính năng upload thông minh giống hệt khu vực upload ảnh chính.

## 2. Elaboration & Self-Explanation
Chúng ta đã tạo ra ô upload ảnh cơ bản cho variant ở phiên bản trước, nhưng trải nghiệm người dùng chưa đồng bộ với hai bộ uploader chính (`ImageUploader` và `SettingsImageUploader`). Để đạt chất lượng UX cao nhất (2026 standards), chúng ta tích hợp:
- **Radix Popover:** Menu bong bóng xuất hiện ngay trên ô ảnh biến thể mà không làm biến dạng cấu trúc dòng của bảng.
- **ImageSourceActions logic:** Phân loại nguồn ảnh (Upload file / Dán URL).
- **Clipboard API:** Đọc ảnh trực tiếp từ bộ nhớ tạm (Dán ảnh) tương tự logo settings.
- **ImageEditorDialog:** Cho phép người dùng chỉnh sửa ảnh (Crop, remove background) cho từng phiên bản ngay trong bảng.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang nhập sản phẩm "Áo thun bé gái Cotton". Bạn có ảnh một bé mặc áo màu hồng trên mạng, bạn chỉ cần copy ảnh đó (hoặc copy URL ảnh) rồi click vào ô ảnh biến thể màu Hồng, chọn "Dán từ Clipboard" hoặc "URL" để áp dụng ngay lập tức mà không cần tải ảnh về máy rồi upload lại. 
Nếu hình ảnh bị lệch tỉ lệ, bạn bấm "Cắt / Sửa", một khung cắt ảnh hình vuông hiện lên giúp bạn căn chỉnh vị trí đẹp nhất cho sản phẩm. Tất cả thao tác này diễn ra trơn tru ngay tại dòng của biến thể đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta có sẵn các UI components và dialog sau:
1. `@/app/admin/components/ImageEditorDialog`: Dialog chỉnh sửa cắt ảnh có sẵn trong dự án.
2. `Popover, PopoverTrigger, PopoverContent` được định nghĩa trong `app/admin/components/ui.tsx`.
3. Icon `ClipboardPaste, Crop, Link2, Loader2, Pencil, Plus, Trash2, Upload, X` từ `lucide-react`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:** Ô upload ảnh biến thể hiện tại chỉ sử dụng một thẻ `<input type="file" />` ẩn và kích hoạt trực tiếp, thiếu các tính năng nâng cao (cắt ảnh, dán clipboard, link URL) khiến cho trải nghiệm UX bị lệch tông (inconsistent) so với phần còn lại của hệ thống.
- **Giả thuyết đối đối chứng:** Việc sử dụng một Popover cục bộ trên từng Cell thay vì render toàn bộ uploader trực tiếp sẽ giúp giữ nguyên chiều cao của các dòng trong bảng ma trận mà vẫn đem lại đầy đủ tính năng cao cấp cho người dùng.

---

# IV. Proposal (Đề xuất)

### Nâng cấp `VariantImageCell` trong `inline-matrix-builder.tsx`
- Tích hợp `Popover`, `PopoverTrigger`, và `PopoverContent` để làm menu bong bóng.
- Tích hợp `ImageEditorDialog` từ `../../components/ImageEditorDialog`.
- Cung cấp 2 tab: **Upload** (gồm chọn file từ thiết bị và nút dán từ clipboard) và **URL** (nhập liên kết ảnh trực tiếp).
- Cung cấp các nút hành động nhanh bên dưới khi đã có ảnh: **Cắt / Sửa** (mở `ImageEditorDialog`) và **Xóa ảnh**.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. `app/admin/products/components/inline-matrix-builder.tsx`
- *Thay đổi:* Import thêm `Popover, PopoverTrigger, PopoverContent`, import `ImageEditorDialog`, và viết lại hoàn toàn component `VariantImageCell` có Popover chọn nguồn ảnh & chỉnh sửa ảnh.

---

# VI. Execution Preview (Xem trước thực thi)

1. Cập nhật các import trong `inline-matrix-builder.tsx`.
2. Thay thế component `VariantImageCell` bằng phiên bản nâng cấp có Popover.
3. Chạy `bunx tsc --noEmit` để kiểm tra compile lỗi Type.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Automated Tests
- Chạy kiểm tra lỗi type:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### 2. Manual Verification (Thực hiện bởi Tester)
- Mở trang chỉnh sửa hoặc tạo sản phẩm có nhiều biến thể.
- Click vào ô upload ảnh biến thể (nút `+`). Xác nhận Popover mở ra mượt mà.
- Kiểm tra tính năng **Upload file** và **Dán từ Clipboard**.
- Sau khi upload ảnh thành công, click lại vào ảnh đó, bấm **Cắt / Sửa**. Xác nhận Dialog cắt ảnh mở ra, tiến hành cắt ảnh và lưu lại.
- Bấm **Xóa ảnh** để kiểm tra tính năng xóa.

---

# VIII. Todo

- [ ] Thay thế component `VariantImageCell` nâng cấp trong `inline-matrix-builder.tsx`
- [ ] Kiểm tra lỗi biên dịch TypeScript (`bunx tsc --noEmit`)

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Ô upload ảnh biến thể sử dụng Popover hiển thị các nút chức năng chọn nguồn ảnh chuyên nghiệp.
- Cho phép cắt/sửa ảnh thông qua `ImageEditorDialog`.
- Cho phép dán ảnh từ clipboard và nhập URL ảnh.
- Compile thành công không lỗi Type.
