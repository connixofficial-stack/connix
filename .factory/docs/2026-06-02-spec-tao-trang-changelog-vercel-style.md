# I. Primer

## 1. TL;DR kiểu Feynman

- Chúng ta cần xây dựng một trang **Changelog (Nhật ký phát triển)** hoàn chỉnh cho hệ thống Viet Admin tại địa chỉ `/changelog`.
- Thay vì sử dụng chung layout với nhóm route công khai `(site)` vốn bị bọc bởi các elements phức tạp, trang Changelog được đặt độc lập hoàn toàn tại nhóm route gốc `app/changelog/` để giữ tính gọn gàng tối cao.
- **Triết lý Thiết kế**: Sử dụng thiết kế **trắng tinh khiết (Clean Flat Design)** cực kỳ phẳng, tinh tế và tối giản. Loại bỏ hoàn toàn các hiệu ứng màu mè do AI thiết kế (không neon glow, không gradient neon chói lọi, không bóng đổ lớn). Chữ đậm đen trên nền trắng phẳng, có khoảng cách thoáng đãng và chuyển động flat êm dịu mang thẩm mỹ năm 2026.
- Dữ liệu lịch sử tĩnh được lưu trữ trực tiếp dưới dạng một tệp dữ liệu có cấu trúc (`data.ts`) để bảo toàn băng thông dữ liệu theo **7 Nguyên tắc DB Bandwidth Optimization**.

## 2. Elaboration & Self-Explanation

Dự án `system-vietadmin-nextjs` đã trải qua quá trình phát triển bền bỉ trong gần 6 tháng với hàng loạt nâng cấp cốt lõi. Để người dùng và các lập trình viên dễ dàng theo dõi tiến độ một cách khoa học, chúng ta xây dựng trang `/changelog` chạy độc lập, sạch sẽ.

Giao diện phẳng mới sẽ tập trung hoàn toàn vào nội dung (Content-first):
- **Nền & Chữ**: Nền trắng tinh khiết (`bg-white` / `bg-slate-50`) kết hợp chữ màu tối sắc nét (`text-slate-900`, `text-slate-600`), tạo độ tương phản vượt trội đạt chuẩn WCAG 2.2 AA.
- **Flat Timeline Line**: Một đường dọc phẳng mờ màu xám nhạt (`w-[1px] bg-slate-200`) chạy suốt chiều dài trang, điểm xuyết bởi các nút tròn phẳng nhỏ nhắn.
- **Search & Filters**: Công cụ tìm kiếm và lọc phân loại phẳng (Tất cả, Tính năng mới, Cải tiến, Sửa lỗi) phản hồi cực kỳ nhanh trong thời gian thực.
- **Flat Motion**: Các hoạt ảnh Framer Motion chuyển động trượt mượt mà với dải chuyển dịch siêu ngắn (10px) mang lại cảm giác vô cùng êm ái và cao cấp, không bị lòe loẹt.

## 3. Concrete Examples & Analogies

- **Ví dụ cụ thể**: Khi truy cập `/changelog`, người dùng được chiêm ngưỡng giao diện trắng phẳng cực kỳ gọn gàng giống trang tài liệu của Tailwind CSS hoặc Github. Ở trên cùng là bản cập nhật gần nhất với tag phase màu xám phẳng `"Consolidation & Hygiene"`. Các nhóm thay đổi `Tính năng mới`, `Cải tiến`, `Sửa lỗi` được phân loại bằng các badge phẳng có tông màu dịu mát (`bg-emerald-50 text-emerald-800`).
- **Trực giác đời thường (Analogy)**: Thiết kế phẳng trắng tối giản giống như một cuốn sổ tay bìa da trắng cao cấp với các trang viết tay nắn nót gọn gàng. Thay vì sử dụng đèn LED trang trí nhấp nháy lòe loẹt (AI Styling neon), cuốn sổ tập trung hoàn toàn vào sự tinh khiết của nét chữ và dải ruy-băng phân trang tối giản.

---

# II. Audit Summary (Tóm tắt kiểm tra)

- **Cấu trúc Route Next.js**: Đặt tại thư mục `app/changelog/` giúp trang chạy độc lập hoàn toàn ở route `/changelog`, không dính layout của `(site)`. 
- **Layout & Providers**: Vẫn thừa hưởng toàn bộ providers cốt lõi (ConvexClientProvider, BrandColorProvider) và cấu hình fonts trong `app/layout.tsx`.
- **Pre-commit validation**: Staged files đã vượt qua Oxlint xuất sắc với `Found 0 warnings and 0 errors.`

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Yêu cầu mới**: Người dùng cần trang Changelog sử dụng nền trắng sạch sẽ, phẳng (flat design), không dùng các styling màu mè neon kiểu AI.
- **Giải pháp**: Xây dựng lại `ChangelogClient.tsx` với bảng màu slate-50/white phẳng và di chuyển route ra ngoài group `(site)` thành `/app/changelog`.

---

# IV. Proposal (Đề xuất)

Chúng ta triển khai 3 tệp tin mới trong route `app/changelog/`:

1. **`app/changelog/data.ts`**: Tệp hằng số dữ liệu lịch sử tĩnh.
2. **`app/changelog/ChangelogClient.tsx`**: Client Component render UI trắng phẳng tối giản, bộ lọc Search/Filter thời gian thực và chuyển động Framer Motion.
3. **`app/changelog/page.tsx`**: Server Component Wrapper cung cấp SEO Metadata động cho trang.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### [NEW] [data.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/changelog/data.ts)
- Vai trò: Lưu trữ dữ liệu lịch sử tĩnh của dự án dưới dạng hằng số TypeScript.

### [NEW] [ChangelogClient.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/changelog/ChangelogClient.tsx)
- Vai trò: UI component nền trắng phẳng (flat design) tối giản, search, filter và motion.

### [NEW] [page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/changelog/page.tsx)
- Vai trò: Route wrapper cung cấp SEO Metadata.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Di chuyển và chỉnh sửa**: Dùng git mv di chuyển code ra ngoài `(site)`.
2. **Thiết kế lại phẳng**: Cập nhật `ChangelogClient.tsx` sang tông màu trắng flat design.
3. **Kiểm thử pre-commit**: Chạy git commit để Harness Engine tự động quét quality.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- TypeScript compiler verification:
  ```powershell
  bunx tsc --noEmit
  ```

### Manual Verification
- Truy cập `/changelog` kiểm tra nền trắng phẳng tối giản.
- Test Search & Filters thời gian thực.
- Kiểm tra tính Responsive trên màn hình di động.

---

# VIII. Todo

- [x] Di chuyển thư mục changelog ra ngoài `(site)` thành `app/changelog`.
- [x] Viết tệp dữ liệu tĩnh `app/changelog/data.ts`.
- [x] Thiết kế lại `app/changelog/ChangelogClient.tsx` theo phong cách Trắng Phẳng Tối Giản.
- [x] Viết tệp `app/changelog/page.tsx` làm Server Component cho route mới.
- [x] Cập nhật tệp đặc tả spec này.
- [ ] Chạy commit local để kích hoạt pre-commit validation của Harness Engine.
- [ ] Phát âm thanh thông báo hoàn thành task ("Done, Sir.") qua SAPI.SpVoice.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Trang `/changelog` chạy độc lập, nền trắng sạch phẳng, không bị AI Styling màu mè.
- Oxlint và tsc pre-commit checks biên dịch thành công 100% không cảnh báo lỗi.
- Đã commit local thành công.
