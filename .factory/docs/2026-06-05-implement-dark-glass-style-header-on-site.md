# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng chọn kiểu Header là "Dark Glass", giao diện trên website thực tế vẫn đang hiển thị kiểu Allbirds do chưa được viết code render riêng. Để sửa điều này, chúng ta cần:
- Thêm hiệu ứng trượt trơn tru khi cuộn trang (scroll): ở trên cùng thì rộng và phẳng, khi cuộn xuống thì thu nhỏ thành một thanh kẹp (pill sticky) lơ lửng.
- Thêm các nút mạng xã hội (YouTube, TikTok, Facebook, Instagram) và nút "Liên hệ" (CTA) bo tròn màu trắng.
- Lấy link mạng xã hội thực tế từ cấu hình hệ thống (DB) thông qua hook `useSocialLinks`.

## 2. Elaboration & Self-Explanation
Hiện tại, `components/site/Header.tsx` chịu trách nhiệm render Header ở môi trường thực tế (production site). Khi người dùng lưu cấu hình `header_style = 'darkglass'`, trang preview trong admin hiển thị đúng giao diện Dark Glass (do đã được cài đặt trong `HeaderMenuPreview.tsx`), nhưng trang web bên ngoài chỉ fall-through về layout Allbirds.

Chúng ta sẽ mở rộng `Header.tsx` để render đầy đủ giao diện Dark Glass trên site thực tế. Bản thiết kế này sẽ dùng 2 thẻ `<header>` song song (như dự án nguồn dohy):
1. **Header Top**: dạng `absolute top-0 w-full` có nền đen mờ (`bg-black/50 backdrop-blur-lg`).
2. **Header Sticky**: dạng `fixed top-4 left-1/2 -translate-x-1/2 w-[96%]` có bo tròn hoàn toàn (`rounded-full`), trượt xuống từ trên khi người dùng cuộn chuột qua 50px nhờ class transition `translate-y-0 opacity-100` và `-translate-y-[150%] opacity-0`.
Cả hai header này sẽ hiển thị đúng danh sách Menu động từ DB (`menuTree`), Social Icons (sử dụng SVG inline sạch sẽ và màu sắc chuẩn thương hiệu), và nút CTA "Liên hệ".

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Khi truy cập trang chủ, Header sẽ nằm ẩn trong ảnh bìa (hero banner) với nền tối trong suốt. Khi cuộn trang xuống để đọc nội dung, một thanh điều hướng nhỏ, xinh xắn hình viên thuốc (pill) bo tròn sẽ nhẹ nhàng trượt từ trên cùng màn hình xuống và dính chặt ở đó để người dùng có thể click chuyển trang bất kỳ lúc nào.
- **Hình ảnh đời thường**: Giống như khay điều khiển của máy bay trực thăng. Khi đỗ trên mặt đất thì nó ẩn vào bảng điều khiển chung, khi cất cánh bay lên cao thì khay định vị thông tin khẩn cấp tự động trượt ra ngay trước tầm mắt phi công.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- Component `components/site/Header.tsx` hiện chỉ có 3 nhánh render chính:
  - Dòng 974: `if (headerStyle === 'classic')`
  - Dòng 1483: `if (headerStyle === 'topbar')`
  - Dòng 1855: `return ( ... )` (Nhánh mặc định của Allbirds)
- Chưa có state `isScrolled` hay scroll listener nào để cập nhật trạng thái dính (sticky pill) cho Dark Glass.
- Mặc dù type `HeaderStyle` đã chứa `'darkglass'` và các size map đã được cập nhật, ta cần bổ sung nhánh render thực tế để không bị fall-through sang Allbirds.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Nhánh logic render cho `'darkglass'` chưa tồn tại trong `components/site/Header.tsx`, khiến nó sử dụng nhánh mặc định cuối cùng (Allbirds style).
- **Giả thuyết đối chứng**: Nếu chỉ sửa fallback màu sắc trong Allbirds thì không đạt được hiệu ứng trượt pill sticky đặc trưng và thiếu các social icons tùy chỉnh ở góc phải theo đúng yêu cầu dự án nguồn dohy.

---

# IV. Proposal (Đề xuất)

1. **Import bổ sung**:
   - Thêm `useSocialLinks` từ `./hooks` vào `components/site/Header.tsx`.
2. **Khai báo States & Hooks**:
   - Thêm `isScrolled` state và `useEffect` lắng nghe sự kiện `scroll` (chỉ kích hoạt khi `headerStyle === 'darkglass'`).
3. **Thêm nhánh Render Dark Glass**:
   - Viết inline khối `if (headerStyle === 'darkglass') { return ( ... ) }` ngay trước nhánh Allbirds cuối cùng.
   - Sử dụng cấu trúc 2 header (Top Header absolute và Sticky Header fixed pill) với CSS Tailwind chuẩn.
   - Thừa hưởng toàn bộ cấu trúc dropdown menu (`menuTree`) của Desktop và Mobile giống như Allbirds để giữ trọn vẹn các tính năng UX (hover delay, alignment, multi-level).
   - Hiển thị mạng xã hội động dựa vào `socialLinks` nhận được từ `useSocialLinks()`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
- [Header.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx): Thêm import `useSocialLinks`, thêm hook scroll listener, implement nhánh render `darkglass` với 2 trạng thái absolute & sticky pill.

---

# VI. Execution Preview (Xem trước thực thi)

1. Mở `components/site/Header.tsx`.
2. Sửa dòng import ở dòng 10: `import { useBrandColors, useSiteSettings } from './hooks';` thành `import { useBrandColors, useSiteSettings, useSocialLinks } from './hooks';`.
3. Trong `Header` component, khai báo `const socialLinks = useSocialLinks();` và state `isScrolled`.
4. Thêm `useEffect` lắng nghe scroll để set `isScrolled` khi scroll > 50px.
5. Thêm code render `if (headerStyle === 'darkglass') { ... }` trước Allbirds Style.
6. Commit thay đổi.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static check):
- Chạy `bunx tsc --noEmit` hoặc để hệ thống Git Hook tự chạy oxlint và tsc trước khi commit để đảm bảo không có lỗi TypeScript hay cú pháp.

### Kiểm tra thủ công (Manual Verification):
- Người dùng chuyển đổi sang giao diện Dark Glass trong Experience Menu Editor, ấn lưu.
- Kiểm tra trang chủ website thực tế:
  - Khi ở trên cùng: Header có màu đen mờ, full-width.
  - Khi cuộn trang xuống: Header biến mất và một thanh pill tròn nhỏ trượt xuống mượt mà.
  - Các links hoạt động tốt, dropdown hoạt động chuẩn.
  - Social icons hiển thị đúng link cấu hình.

---

# VIII. Todo

- [ ] Import `useSocialLinks` vào `components/site/Header.tsx`
- [ ] Khai báo state `isScrolled` và scroll effect listener
- [ ] Cài đặt nhánh render `darkglass` đầy đủ trong `Header.tsx`
- [ ] Chạy Git commit để Harness Engine kiểm tra chất lượng code

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Giao diện Dark Glass hiển thị chuẩn trên website thực tế khi cấu hình `header_style` là `darkglass`.
- Thanh sticky pill tròn xuất hiện khi scroll xuống > 50px.
- Các social links hoạt động bình thường, nút liên hệ trỏ đúng link CTA.
- Không có lỗi compile hay crash runtime.
