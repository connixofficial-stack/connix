## Audit Summary
- Observation: `HomeComponentStickyFooter` đang hard-code `lg:left-[280px]`, nên chỉ đúng khi sidebar mở full. Evidence: `app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx`.
- Observation: Sidebar admin có 2 width desktop: `lg:w-[280px]` khi mở và `lg:w-[80px]` khi thu gọn. Evidence: `app/admin/components/Sidebar.tsx`.
- Observation: Footer hiện không đọc được state `isSidebarCollapsed`, nên khi toggle ẩn sidebar thì footer vẫn chừa 280px bên trái, tạo khoảng trống/lệch như screenshot user gửi. Evidence: `Sidebar.tsx` giữ state local, còn footer chỉ dùng class cố định.
- Observation: `AdminLayout` chưa expose trạng thái collapsed xuống descendants; footer shared vì vậy không có source of truth để sync offset. Evidence: `app/admin/layout.tsx` chỉ render `<Sidebar />` và `<main />`, không có context/state chia sẻ.

## Root Cause Confidence
**High** — Root cause là mismatch giữa offset cố định của sticky footer và width động của sidebar. Chỉ chỉnh CSS ở footer mà không lấy được trạng thái collapsed thì bug sẽ lặp lại ở toggle state còn lại.

## TL;DR kiểu Feynman
- Sidebar có 2 độ rộng, nhưng footer chỉ đang biết 1 độ rộng.
- Nên khi thu gọn sidebar, footer vẫn tránh chỗ cũ 280px và bị lệch.
- Cần cho layout chia sẻ trạng thái sidebar collapsed ra ngoài.
- Footer shared sẽ đọc trạng thái đó để dùng left offset đúng: 280px hoặc 80px.
- Sửa đúng 1 chỗ shared sẽ tự áp cho các create/edit home-components.

## Files Impacted
### Shared layout state
- `Sửa: app/admin/layout.tsx`
  - Vai trò hiện tại: dựng shell admin với `Sidebar`, `Header`, `main`.
  - Thay đổi: nâng state collapsed lên layout-level hoặc cung cấp context nhỏ để descendants đọc được trạng thái sidebar desktop.
- `Sửa: app/admin/components/Sidebar.tsx`
  - Vai trò hiện tại: giữ local state `isSidebarCollapsed` và render 2 width 280/80.
  - Thay đổi: nhận state/handler từ layout hoặc ghi state vào shared context thay vì giữ local-only.

### Shared footer
- `Sửa: app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx`
  - Vai trò hiện tại: sticky footer dùng chung cho create/edit home-components.
  - Thay đổi: thay `lg:left-[280px]` cố định bằng class/style phụ thuộc trạng thái sidebar collapsed để offset đúng theo products-like layout trong cả 2 mode.

### Có thể giữ nguyên
- `Có thể giữ nguyên: app/admin/home-components/create/shared.tsx`
  - Vai trò hiện tại: wrapper create gọi shared footer.
  - Thay đổi: dự kiến không cần sửa thêm nếu footer tự đọc state layout.
- `Có thể giữ nguyên: app/admin/home-components/**/[id]/edit/page.tsx`
  - Vai trò hiện tại: các edit page gọi shared footer.
  - Thay đổi: không cần sửa từng page.

## Root Cause / Counter-Hypothesis
1. Triệu chứng: khi toggle thu gọn sidebar, footer save lệch trái và chừa khoảng trống sai.
2. Phạm vi: toàn bộ create/edit home-components dùng `HomeComponentStickyFooter`.
3. Tái hiện: ổn định vì sidebar có 2 width nhưng footer chỉ có 1 offset cứng.
4. Mốc thay đổi gần nhất: footer vừa được chuẩn hóa theo products layout với `lg:left-[280px]`, nhưng chưa cover collapsed state.
5. Dữ liệu thiếu: không thiếu thêm; screenshot + code hiện tại đủ kết luận.
6. Giả thuyết thay thế đã loại trừ: không phải z-index hay spacing; screenshot cho thấy lỗi khoảng trống ngang do offset sai.
7. Rủi ro nếu fix sai nguyên nhân: nếu chỉ đổi padding/margin, footer vẫn lệch khi toggle.
8. Tiêu chí pass/fail: sidebar mở thì footer bắt đầu sau 280px; sidebar thu gọn thì footer bắt đầu sau 80px; không bị hở/lệch.

## Proposal
1. Tạo source of truth cho sidebar collapse ở admin layout:
   - Option được khuyến nghị: đưa `isSidebarCollapsed` lên `AdminLayoutContent` và truyền xuống `Sidebar` + descendants qua context nhỏ.
2. Refactor `Sidebar` để dùng state từ layout thay vì local-only.
3. Cho `HomeComponentStickyFooter` đọc context đó và set offset desktop tương ứng:
   - expanded: `left = 280px`
   - collapsed: `left = 80px`
4. Giữ nguyên mobile behavior (`left-0`) và giữ products-like alignment hiện tại.
5. Review nhanh các footer shared khác nếu cùng pattern, nhưng không mở rộng scope chỉnh ngoài home-components trong task này.

## Execution Preview
1. Đọc/chỉnh `app/admin/layout.tsx` để đặt shared sidebar state/context.
2. Đọc/chỉnh `app/admin/components/Sidebar.tsx` để consume state mới.
3. Đọc/chỉnh `HomeComponentStickyFooter.tsx` để dùng offset động.
4. Review tĩnh call-sites của footer shared.
5. Chạy `bunx tsc --noEmit` sau khi implement.

## Acceptance Criteria
- Khi sidebar desktop mở full, footer home-components bắt đầu sau mép sidebar 280px.
- Khi sidebar desktop thu gọn, footer cập nhật theo 80px và không còn khoảng trống lớn bên trái.
- Nút Hủy/Lưu vẫn giữ bố cục hiện tại như products.
- Mobile không bị ảnh hưởng.
- Không cần sửa từng page create/edit home-component.

## Verification Plan
- Static review: kiểm tra state flow giữa layout → sidebar → footer shared.
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công cho tester:
  1. mở `homepage-category-hero` edit,
  2. toggle sidebar desktop qua lại,
  3. quan sát footer ở cả 2 trạng thái,
  4. kiểm tra thêm một create page home-component bất kỳ.

## Out of Scope
- Không refactor toàn bộ sticky footer của products/posts/services trong task này.
- Không đổi UI khác của sidebar ngoài việc chia sẻ state collapsed.

## Risk / Rollback
- Risk: đụng layout shared admin nên cần giữ thay đổi nhỏ, chỉ thêm state/context tối thiểu.
- Rollback: revert 3 file `layout.tsx`, `Sidebar.tsx`, `HomeComponentStickyFooter.tsx` là đủ.

Không cần thêm câu hỏi vì bug và hướng fix đã rõ từ screenshot + code hiện tại.