# Spec: Sửa lỗi Stats Component không tôn trọng căn chỉnh icon/ảnh trên layout Thanh ngang và Card

# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Khi cấu hình component Stats (Số liệu thống kê) trong admin với layout "Thanh ngang" (horizontal) hoặc "Card" (cards), dù chọn vị trí icon ở "Trên" (top) hay "Trái" (left), và chọn căn lề "Trái", "Giữa", "Phải" khi icon ở Trên, thì giao diện hiển thị vẫn luôn cứng ngắt: xếp hàng ngang (icon bên trái) và căn giữa.
- **Nguyên nhân:** Mã nguồn render giao diện (ở cả Preview trong Admin và Runtime ngoài site) của 2 layout này đang code cứng CSS flexbox `flex items-center gap-3`, hoàn toàn bỏ qua các biến cấu hình `mediaPlacement` và `mediaAlign`.
- **Cách giải quyết:** Áp dụng các helper CSS class có sẵn (`getItemContainerClass`, `getMediaWrapperClass`, `getItemAlignClass`) đã được viết đúng ở các layout khác vào cho layout "Thanh ngang" và "Card".

## 2. Elaboration & Self-Explanation
Component Stats cho phép cấu hình cách sắp xếp icon và nhãn văn bản. Tuy nhiên, hai layout phổ biến là `horizontal` (thanh ngang) và `cards` (dạng thẻ) đã bị bỏ quên trong việc kết nối các biến điều khiển hướng xếp (`mediaPlacement` - Trên/Trái) và căn lề (`mediaAlign` - Trái/Giữa/Phải) vào các CSS class thực tế. 
Để giải quyết triệt để, chúng ta cần:
1. Đọc đúng các thuộc tính cấu hình `mediaPlacement` và `mediaAlign`.
2. Thay thế class container cha của từng số liệu từ tĩnh thành động bằng cách dùng hàm `getItemContainerClass(mediaPlacement, mediaAlign)`.
3. Thay thế class bọc icon và text sang dạng động để chúng thay đổi khoảng cách (`mb-2` khi xếp dọc, `mb-0` khi xếp ngang) và căn lề nội dung đồng bộ.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Nếu admin cấu hình layout dạng Card có Icon nằm Trên, Căn lề Trái. 
  - *Hiện tại:* Icon vẫn nằm bên Trái của số liệu (do bị code cứng layout ngang).
  - *Sau khi sửa:* Icon sẽ nhảy lên phía Trên số liệu, đồng thời cả icon và số liệu + nhãn chữ sẽ được căn lề Trái sát mép card.
- **Hình dung tương tự:** Giống như một chiếc giá treo tranh có hai núm điều chỉnh (Học dọc/ngang và Căn trái/phải). Tuy nhiên dây cáp của 2 núm này chưa được nối vào giá treo, khiến chiếc giá luôn nằm ngang và lệch ở giữa. Chúng ta chỉ cần đấu nối dây cáp (các biến CSS class động) vào đúng khớp để chiếc giá xoay và dịch chuyển theo núm vặn.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file `app/admin/home-components/stats/_components/StatsPreview.tsx`: Layout `horizontal` và `cards` đang dùng `className="flex items-center gap-3"` cứng.
- Đã kiểm tra file `components/site/home/sections/StatsRuntimeSection.tsx`: Có chung lỗi tương tự ở các nhánh logic render `horizontal` và `cards`.
- Đã kiểm tra file `components/site/ComponentRenderer.tsx`: Phần render server/client static cũng gặp tình trạng tương tự.
- Giao diện Admin Form (`StatsForm.tsx`) đã có đầy đủ logic cấu hình và lưu trữ cho các biến `mediaPlacement` và `mediaAlign`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc):** Thiếu sót trong thiết kế CSS class ở các layout `horizontal` và `cards`. Lập trình viên ban đầu đã code cứng các class flexbox dạng ngang mà không đấu nối với các biến trạng thái layout được lấy ra từ database (`config.mediaPlacement` và `config.mediaAlign`).
- **Giả thuyết đối chứng:** Nếu do database không lưu hoặc form không truyền thì sửa giao diện cũng vô ích. Tuy nhiên, qua audit `StatsForm.tsx`, chúng ta thấy các hàm `onMediaPlacementChange` và `onMediaAlignChange` vẫn hoạt động bình thường và cập nhật schema Convex chính xác. Vì vậy, vấn đề nằm hoàn toàn ở tầng render.

# IV. Proposal (Đề xuất)
1. Cập nhật hàm render `horizontal` và `cards` trong cả 3 file hiển thị để:
   - Sử dụng `getItemContainerClass(mediaPlacement, mediaAlign)` thay cho class flexbox cứng.
   - Sử dụng `getMediaWrapperClass(mediaPlacement, mediaAlign)` cho phần bọc icon.
   - Thêm margin bottom (`mb-2` khi ở trên, `mb-0` khi ở trái) cho icon.
   - Căn chỉnh text wrapper bằng class `getItemAlignClass(mediaAlign)` khi icon nằm trên.
2. Với file `ComponentRenderer.tsx`, do chưa có các hàm helper `getItemAlignClass` và `getMediaWrapperClass` bên trong component `StatsSection`, ta sẽ khai báo bổ sung các helper này ngay trước khi render.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [StatsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/stats/_components/StatsPreview.tsx): Cập nhật hàm `renderHorizontalStyle` và `renderCardsStyle` để sử dụng class động.
- **Sửa:** [StatsRuntimeSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/sections/StatsRuntimeSection.tsx): Cập nhật nhánh render của `horizontal` và `cards` tương tự.
- **Sửa:** [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/ComponentRenderer.tsx): Bổ sung các helper và cập nhật logic `horizontal` & `cards` trong component `StatsSection`.

# VI. Execution Preview (Xem trước thực thi)
1. Mở và chỉnh sửa file `StatsPreview.tsx`.
2. Mở và chỉnh sửa file `StatsRuntimeSection.tsx`.
3. Mở và chỉnh sửa file `ComponentRenderer.tsx`.
4. Xem xét kỹ sự đồng bộ của các class được áp dụng để tránh phá vỡ giao diện vốn có ở chế độ Left (mặc định cũ).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra trực quan trên trình duyệt (hoặc Preview trong admin):
  - Chuyển sang layout "Thanh ngang", chọn vị trí icon "Trên", kiểm tra xem icon có nằm trên text không và căn Trái/Giữa/Phải có hoạt động chuẩn xác không.
  - Chuyển sang layout "Card", thực hiện kiểm tra tương tự.
  - Chuyển vị trí icon về "Trái" và kiểm tra xem layout có quay lại hiển thị hàng ngang chuẩn xác không.

# VIII. Todo
- [ ] Cập nhật file `app/admin/home-components/stats/_components/StatsPreview.tsx`
- [ ] Cập nhật file `components/site/home/sections/StatsRuntimeSection.tsx`
- [ ] Cập nhật file `components/site/ComponentRenderer.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout "Thanh ngang" hiển thị xếp dọc khi chọn vị trí icon "Trên".
- Layout "Card" hiển thị xếp dọc khi chọn vị trí icon "Trên".
- Vị trí của số liệu thống kê, icon và nhãn chữ thay đổi căn lề (Trái/Giữa/Phải) tương ứng chính xác với cấu hình `mediaAlign` khi icon nằm "Trên".
- Không có lỗi biên dịch TypeScript hay Runtime phát sinh.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Một số class CSS của layout cũ có thể xung đột nhẹ. Tuy nhiên các hàm helper này đã chạy ổn định cho các layout khác nên rủi ro là cực thấp.
- **Hoàn tác:** Sử dụng `git checkout` để rollback các file sửa đổi nếu có lỗi ngoài ý muốn.
