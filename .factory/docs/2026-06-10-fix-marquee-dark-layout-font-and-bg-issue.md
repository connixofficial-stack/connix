# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Khi xem ở trang quản trị (admin preview), chữ chạy (Marquee) hiển thị rất đẹp với nền đen chữ trắng và đúng font chữ đã chọn. Nhưng khi ra trang web thực tế (site thực), chữ chạy lại hiển thị sai font và nền không có màu đen (bị ám xanh).
- **Nguyên nhân**: 
  1. Font chữ bị sai vì site thực tế không truyền biến CSS font và class font trực tiếp vào component chữ chạy, khiến trình duyệt sử dụng font mặc định do các CSS rule khác đè lên.
  2. Nền bị ám xanh là do cấu hình giao diện `style` của layout Dark thiết lập màu nền `darkBg` là Slate 900 (`#0f172a`), màu này thực chất là màu xanh đen chứ không phải đen tuyền. Đồng thời, nền đen tuyền không có ranh giới rõ ràng làm thị giác có cảm giác chữ không được căn giữa theo chiều dọc.
- **Giải pháp**:
  1. Sửa code render để truyền đầy đủ font và class font trực tiếp vào component chữ chạy ở site thực tế.
  2. Thay đổi màu nền `darkBg` trong `colors.ts` từ `#0f172a` sang `#000000` (đen tuyền).
  3. Thêm một đường border trên/dưới siêu mỏng màu trắng mờ 10% (`rgba(255, 255, 255, 0.1)`) cho `DarkLayout` để phân tách ranh giới rõ ràng, tạo sự cân đối thị giác tối ưu hơn (UX).

## 2. Elaboration & Self-Explanation
Giao diện site thực tế hiển thị các khối (home components) bằng cách nạp danh sách từ database và render qua `ComponentRenderer.tsx`. Đối với component Marquee (chữ chạy), trang preview trong admin truyền trực tiếp class `font-active` và style chứa biến font `--font-active` vào component `MarqueeSectionShared`. Điều này giúp text và toàn bộ section nhận diện đúng font chữ tùy chỉnh.

Tuy nhiên, ở site thực tế (`ComponentRenderer.tsx`), component `MarqueeSection` được bọc bên ngoài bởi một thẻ `div` chứa font, nhưng bản thân thẻ `<section>` bên trong lại không nhận được class và style trực tiếp này. Khi CSS global hoặc các class Tailwind đè font-family lên các phần tử con, cơ chế kế thừa từ `div` bên ngoài bị mất tác dụng.

Đối với lỗi nền không đen, khi cấu hình `style` là `'dark'`, component sẽ render `DarkLayout` với style inline `backgroundColor: tokens.darkBg` (màu `#0f172a`). Màu này chứa ánh xanh đậm của Slate 900. Bằng cách cập nhật `darkBg` thành `#000000` trong `colors.ts`, nền sẽ trở thành đen tuyền hoàn hảo. Đồng thời, thêm class `border-y` và `borderColor: rgba(255, 255, 255, 0.1)` cho `DarkLayout` để định vị rõ ranh giới dải chạy chữ trên nền tối, giúp giải quyết cảm giác chữ bị lệch không căn giữa.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Khi ta chọn font Montserrat và layout Dark cho Marquee:
  - Ở Admin: Render `<section class="font-active" style="--font-active: var(--font-montserrat)">` trực tiếp -> Chữ hiển thị đúng font Montserrat và nền đen.
  - Ở Site thực tế: Render `<div class="font-active" style="--font-active: var(--font-montserrat)"><section class="undefined" style="undefined">` -> Thẻ `<section>` không có class font trực tiếp, các thẻ `span` bên trong bị CSS của website đè font mặc định Be Vietnam Pro.
  - Border-y phân định ranh giới: Giống như một cái khung ảnh đen trên tường đen, nếu không có viền mờ thì bạn không biết khung ảnh bắt đầu từ đâu và kết thúc từ đâu, làm bức ảnh bên trong trông như bị lệch. Khi có đường viền mỏng, bạn sẽ lập tức nhận ra bố cục cân đối của nó.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra cơ chế render font của `ComponentRenderer.tsx` và `MarqueeSectionShared.tsx`.
- Phát hiện sự không đồng bộ: Preview admin truyền trực tiếp `fontStyle` và `fontClassName` xuống `MarqueeSectionSharedProps`, trong khi site thực tế (`ComponentRenderer.tsx`) chỉ dùng `wrapWithFont` bọc ngoài mà không truyền trực tiếp.
- Đã query dữ liệu thật từ Convex DB: Component Marquee có ID `mx75t4kxmaz560fb6rmv8yzx45881z45` thực sự đang lưu cấu hình `"style": "dark"`. 
- Đã thay đổi màu nền sang đen tuyền `#000000`.
- Đã bổ sung border-y trắng mờ 10% để tối ưu hóa căn chỉnh thị giác (UX).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**:
  1. **Lỗi Font**: Thẻ `<section>` của `MarqueeSectionShared` không nhận được `fontClassName` và `fontStyle` ở site thực tế, khiến nó không áp dụng class `font-active` trực tiếp lên element cha của Marquee, dẫn đến các class Tailwind khác đè font-family.
  2. **Lỗi Nền không đen (ám xanh)**: Cấu hình màu nền `darkBg` trong `colors.ts` sử dụng màu Slate 900 (`#0f172a`) có tone xanh lam thay vì đen thuần.
  3. **Lỗi thị giác lệch tâm**: Thiếu đường viền phân định ranh giới dải chạy chữ trên nền đen tuyền.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Nếu chúng ta truyền đúng font trực tiếp, đổi màu nền sang `#000000`, và thêm viền border-y mờ, giao diện sẽ hiển thị chuẩn xác, cân đối.

---

# IV. Proposal (Đề xuất)
1. Cập nhật `ComponentRenderer.tsx` để truyền trực tiếp `fontStyle` và `fontClassName="font-active"` vào component `MarqueeSection`.
2. Sửa signature của `MarqueeSection` trong `ComponentRenderer.tsx` để nhận `fontStyle` và `fontClassName` rồi truyền tiếp xuống `MarqueeSectionShared`.
3. Thay đổi `darkBg` thành `#000000` trong `colors.ts`.
4. Bổ sung `border-y` và `borderColor: 'rgba(255, 255, 255, 0.1)'` vào component `DarkLayout` trong `MarqueeSectionShared.tsx`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/ComponentRenderer.tsx)
  - Cập nhật cách gọi `MarqueeSection` ở switch case `Marquee`.
  - Cập nhật định nghĩa component `MarqueeSection` để nhận và truyền tiếp `fontStyle`, `fontClassName`.
- `Sửa`: [colors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/marquee/_lib/colors.ts)
  - Đổi màu `darkBg` thành `#000000`.
- `Sửa`: [MarqueeSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/marquee/_components/MarqueeSectionShared.tsx)
  - Bổ sung `border-y` và style inline `borderColor: 'rgba(255, 255, 255, 0.1)'` vào component `DarkLayout`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Sửa đổi file `components/site/ComponentRenderer.tsx` theo đề xuất (Đã làm).
2. Thay đổi màu `darkBg` trong `colors.ts` (Đã làm).
3. Sửa đổi file `MarqueeSectionShared.tsx` để thêm border-y trắng mờ (Đã làm).
4. Xác minh và dọn dẹp (Đang làm).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Tải lại trang site thực tế `http://localhost:3000/`.
- Xác nhận:
  - Font chữ Montserrat hiển thị chính xác.
  - Màu nền đen tuyền `#000000` hiển thị chính xác.
  - Có 2 đường line trắng mờ siêu mỏng bao quanh trên dưới dải chạy chữ.

---

# VIII. Todo
- [x] Cập nhật file `components/site/ComponentRenderer.tsx` để truyền font props trực tiếp.
- [x] Thay đổi màu `darkBg` trong `colors.ts` thành `#000000`.
- [x] Thêm border-y mờ vào `DarkLayout` trong `MarqueeSectionShared.tsx`.
- [x] Kiểm tra hiển thị trên trình duyệt ở localhost.
- [ ] Viết walkthrough.md và commit code.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Component Marquee hiển thị đúng font chữ đã cấu hình ở site thực tế.
- Component Marquee hiển thị đúng màu nền đen tuyền (`#000000`) ở layout Dark trên site thực tế.
- Dải Marquee có viền trên dưới màu trắng mờ nhẹ phân tách ranh giới, giúp cân chỉnh thị giác rõ ràng.
- Không phát sinh lỗi TypeScript hay lỗi biên dịch.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây chỉ là thay đổi nhỏ về prop truyền nhận và style hiển thị của component Marquee.
- Rollback dễ dàng bằng git checkout.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa các phần logic lưu trữ hoặc schema database.
- Không sửa đổi các layout của các component khác ngoài Marquee.
