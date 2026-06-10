# Spec: Triển khai Style 'kanban' Tự Thích Ứng Nền Cho Component Contact

# I. Primer

## 1. TL;DR kiểu Feynman
* Khi bạn đổi màu nền trang chủ thành màu đen hoặc màu tối, một số khối nội dung liên hệ (Contact) trước đây hiển thị nền trắng trông sẽ rất thô và lệch tông.
* Chúng ta sẽ tạo ra một kiểu hiển thị mới tên là **'kanban'** (Mẫu tối giản Kanban - Layout 7).
* Kiểu hiển thị này hoạt động như một chiếc bảng Kanban thu nhỏ: chia thông tin thành các cột dọc mỏng (Thông tin liên hệ, Form điền, Bản đồ).
* Đặc biệt, nó có thể tự xem màu nền trang chủ đang chọn là sáng hay tối để tự động đổi màu sắc của chính nó (dùng nền tối mờ khi nền web tối, hoặc nền sáng khi nền web sáng).
* Trong trang quản trị (Admin), khung xem trước (Preview) cũng sẽ tự đổi màu nền khớp với trang chủ thực tế để người dùng thấy ngay kết quả.

## 2. Elaboration & Self-Explanation
Chúng ta giải quyết vấn đề không đồng bộ về mặt thẩm mỹ khi trang chủ của hệ thống có tùy chọn cấu hình nền trang chủ (`homePageBackground` - lưu trong cơ sở dữ liệu Convex). Khi nền trang chủ được thiết lập là màu tối hoặc màu đen, các style hiện tại của component Contact (như `modern`, `floating`, `grid`, `elegant`, `minimal`, `centered`) do được thiết kế mặc định cho nền sáng nên sẽ bị lộ viền trắng, hoặc nền trắng nổi lên một cách thô kệch.

Giải pháp là bổ sung style mới tên là `'kanban'` (đại diện cho Layout 7).
Style `'kanban'` tuân thủ chặt chẽ triết lý thiết kế **"Calm Productivity UI / Ultra-Minimal Dense"**:
* **Density over whitespace:** Sử dụng spacing cực nhỏ (`p-2.5`, `p-3`, `gap-3`), các thông tin liên hệ được pack gọn gàng thành các card dọc giống hệt các task card trên bảng Kanban.
* **Tự thích ứng màu nền (Background-Adaptive):** Sử dụng hook `useQuery(api.homeComponentSystemConfig.getConfig)` để lấy cấu hình màu nền của trang chủ từ Convex. Sau đó, tính toán độ sáng (luma) để xác định xem nền trang chủ hiện tại là sáng hay tối (`isDarkBg`).
  * Nếu nền tối: các card và container sẽ dùng nền tối mờ (`rgba(9, 9, 11, 0.3)`) và viền màu tối (`#27272a`), chữ sáng màu.
  * Nếu nền sáng: các card dùng nền sáng (`#ffffff` / `rgba(244, 244, 245, 0.4)`) và viền màu sáng (`#e4e4e7`), chữ tối màu.
* **Customize Form:** Bằng cách tận dụng selector tùy biến của Tailwind CSS (ví dụ: `[&_input]:rounded-none [&_button]:rounded-none [&_input]:text-xs`), chúng ta có thể ép form gửi liên hệ (`ContactInquiryForm`) chuyển sang dạng tối giản (không bo góc, chữ nhỏ, spacing nhỏ) mà không cần phải can thiệp phá vỡ cấu trúc code hiện có của form đó.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi style `'kanban'` được áp dụng:
  * Nếu admin đổi nền trang chủ thành Black (#000000) tại `/system/home-components`. Giao diện liên hệ sẽ hiển thị gồm 3 cột dọc phẳng, nền mờ đen trong suốt ôm khít lấy các card thông tin có viền xám đậm. Form gửi tin nhắn sẽ có các ô nhập liệu vuông vức màu đen xám, nút "Gửi" phẳng và sắc cạnh.
  * Nếu admin đổi nền trang chủ thành White (#ffffff). Giao diện liên hệ lập tức chuyển sang các cột dọc nền xám sáng mỏng, card thông tin màu trắng tinh tế, inputs của form có nền trắng viền xám nhạt.
* **Analogy:** Hãy tưởng tượng component giống như một chiếc kính đổi màu (Transition Lenses). Khi bạn đi ra ngoài trời nắng gắt (nền web tối), mắt kính tự động hóa đen để bảo vệ mắt và giữ thẩm mỹ. Khi đi vào trong nhà (nền web sáng), kính tự động trở lại trong suốt.

# II. Audit Summary (Tóm tắt kiểm tra)

* Lỗi TypeScript pre-commit gần nhất (`task-189`) liên quan đến sự thiếu đồng bộ của type `AboutStyle` trong `app/admin/home-components/_shared/legacy/previews.tsx`. Khi chúng ta thêm `'kanban'` vào `about/_types/index.ts`, chúng ta quên cập nhật `previews.tsx`.
* Do đó, đối với component `Contact` lần này, chúng ta cần sửa đồng thời cả 2 file định nghĩa type: `app/admin/home-components/contact/_types/index.ts` và `app/admin/home-components/_shared/legacy/previews.tsx`.
* Đồng thời, nhân cơ hội này chúng ta sẽ sửa luôn cả type `AboutStyle` bị thiếu `'kanban'` trong `previews.tsx` để dập tắt lỗi Husky pre-commit.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Root Cause (TypeScript mismatch):** Các component edit panel trong thư mục `_shared/legacy` (chương trình cũ) import các type từ `previews.tsx`. Nhưng khi ta nâng cấp type riêng của từng module (như `about/_types` hoặc `contact/_types`), ta chưa đồng bộ ngược lại các kiểu style mới vào `previews.tsx`, dẫn đến lỗi gán type (`TS2322`) khi biên dịch.
* **Giải pháp khắc phục:** Cập nhật đồng bộ các style mới vào cả `previews.tsx`.

# IV. Proposal (Đề xuất)

1. Mở rộng type `ContactStyle` để hỗ trợ `'kanban'`.
2. Đồng bộ `'kanban'` cho cả `AboutStyle` và `ContactStyle` trong `app/admin/home-components/_shared/legacy/previews.tsx`.
3. Bổ sung `'kanban'` vào danh sách hằng số `CONTACT_STYLES` trong `contact/_lib/constants.ts`.
4. Cập nhật `ContactPreview.tsx` để lấy `getConfig` từ Convex và tự động đặt background màu thực tế bao quanh khung Preview.
5. Cập nhật `ContactSectionShared.tsx` để query `getConfig` lấy màu nền trang chủ, tính toán `isDarkBg`, viết hàm `renderKanban()` và đăng ký style `'kanban'` trong component chính.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Module Contact & Common Previews

#### [MODIFY] [previews.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/legacy/previews.tsx)
* Thêm `'kanban'` vào type `AboutStyle` (sửa lỗi TS2322 cũ).
* Thêm `'kanban'` vào type `ContactStyle`.

#### [MODIFY] [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/contact/_types/index.ts)
* Thêm `'kanban'` vào type `ContactStyle`.

#### [MODIFY] [constants.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/contact/_lib/constants.ts)
* Thêm style `'kanban'` vào `CONTACT_STYLES` với label `'Mẫu tối giản Kanban (Layout 7)'`.

#### [MODIFY] [ContactPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/contact/_components/ContactPreview.tsx)
* Query `getConfig` từ Convex.
* Áp dụng màu nền thực tế lên wrapper bao quanh `BrowserFrame` của Preview.

#### [MODIFY] [ContactSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/contact/_components/ContactSectionShared.tsx)
* Query `getConfig` từ Convex, tính toán `isDarkBg`.
* Implement `renderKanban()` theo cấu trúc bảng Kanban 3 cột phẳng, mỏng, tự thích ứng màu nền tối/sáng và override form inputs/buttons thành tối giản.
* Đăng ký style trong hàm render chính.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và chỉnh sửa `previews.tsx` và `contact/_types/index.ts` để đồng bộ type.
2. Thêm hằng số trong `contact/_lib/constants.ts`.
3. Sửa `ContactPreview.tsx` để đồng bộ màu nền preview trong admin.
4. Sửa `ContactSectionShared.tsx` để implement layout và logic tự thích ứng.
5. Chạy test build tĩnh (tự review và check type lỗi bằng `tsc --noEmit`).

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` sau khi sửa để đảm bảo toàn bộ lỗi TypeScript đã biến mất hoàn toàn.

### Manual Verification
1. Truy cập `http://localhost:3000/system/home-components` chỉnh nền thành đen.
2. Mở `http://localhost:3000/admin/home-components/contact/mx7evj98mqdhd5jw7sskvkgr4d8808pm/edit`.
3. Chọn style "Mẫu tối giản Kanban (Layout 7)".
4. Kiểm tra xem khung preview có tự đổi nền sang đen, card liên hệ và form có đổi sang màu tối mỏng không chói không.
5. Lưu cấu hình, kiểm tra ngoài trang chủ.

# VIII. Todo
- [ ] Chỉnh sửa `app/admin/home-components/_shared/legacy/previews.tsx` (thêm 'kanban' cho AboutStyle và ContactStyle).
- [ ] Chỉnh sửa `app/admin/home-components/contact/_types/index.ts` (thêm 'kanban' cho ContactStyle).
- [ ] Chỉnh sửa `app/admin/home-components/contact/_lib/constants.ts` (thêm 'kanban' vào CONTACT_STYLES).
- [ ] Chỉnh sửa `app/admin/home-components/contact/_components/ContactPreview.tsx` (query config nền và áp dụng lên preview wrapper).
- [ ] Chỉnh sửa `app/admin/home-components/contact/_components/ContactSectionShared.tsx` (query config nền, tính toán isDarkBg, viết renderKanban).
- [ ] Chạy kiểm tra TypeScript typecheck tĩnh.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thêm thành công style `'kanban'` cho Contact.
* Giao diện Kanban hiển thị dạng cột phẳng, dense, bo góc 2px (`rounded-sm`).
* Tự thích ứng nền tối/sáng của trang chủ:
  * Nền tối -> Card tối mờ (`rgba(9,9,11,0.3)`), viền tối (`#27272a`), chữ sáng.
  * Nền sáng -> Card sáng (`#ffffff`), viền sáng (`#e4e4e7`), chữ tối.
* Preview trong Admin tự động đổi màu nền theo cấu hình thực tế.
* TypeScript biên dịch thành công mà không có lỗi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Ảnh hưởng đến giao diện của các style liên hệ cũ.
* **Giải pháp giảm thiểu:** style `'kanban'` được viết độc lập bằng một nhánh `if (style === 'kanban')` riêng biệt, không thay đổi bất kỳ logic CSS hay JSX nào của các style cũ (`modern`, `floating`, v.v.).
* **Hoàn tác:** `git checkout -- <file>` nếu phát sinh sự cố lớn.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế của các style liên hệ cũ (`modern`, `floating`, v.v.).
* Thay đổi logic submit form và logic lưu trữ dữ liệu của liên hệ trong Convex.
