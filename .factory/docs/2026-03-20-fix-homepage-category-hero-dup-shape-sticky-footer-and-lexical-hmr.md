## TL;DR kiểu Feynman
- Mega menu đang bị lặp cảm giác vì title nhóm và item đầu đôi khi thực chất là cùng một nghĩa nhưng code chỉ so khớp rất “ngây thơ”, nên không ẩn được.
- Hero danh mục cần thêm shape avatar toàn cục, tương tự size/mode hiện có: tròn, vuông bo góc, vuông sắc.
- Toàn bộ create/edit của home-components đang thiếu sticky save footer thống nhất như trang product edit.
- Lỗi Lexical là lỗi nóng reload với Turbopack/HMR; hướng an toàn là cô lập Lexical bằng dynamic client-only boundary để tránh instantiate trực tiếp module nặng trong page graph.
- Em sẽ spec theo scope user đã chốt: sticky footer cho tất cả home-components create/edit, avatar shape global 3 lựa chọn.

## Audit Summary
### Observation
1. Ở `components/site/HomepageCategoryHeroSection.tsx`, logic ẩn tiêu đề nhóm chỉ chạy khi:
   - `items.length === 1`
   - `group.title.toLowerCase() === firstLabel.toLowerCase()`
   Evidence: `renderMegaMenuColumns()` và block mobile cùng dùng `hideGroupTitle` kiểu so sánh text đơn giản.
2. Với case user chụp màn hình, nhóm `Thiết bị trao đổi nhiệt` và item con đầu tiên thực chất bị trùng về meaning, nhưng hiện code không normalize đủ mạnh (accent/case/spacing/punctuation/đ vs d/line-break), nên UI vẫn hiện hai dòng gần giống nhau.
3. `HomepageCategoryHero` hiện đã có config size + mode, nhưng chưa có config shape avatar. Thumb runtime vẫn đang render cứng `rounded-full` ở cả image/icon/fallback.
4. `app/admin/home-components/create/shared.tsx` đang dùng footer nút submit thường ở cuối form, không sticky. Trong khi `admin/products/[id]/edit/page.tsx` và nhiều page admin khác đã có fixed bottom save bar.
5. Scope sticky footer user đã chốt là: `Tất cả home-components create/edit`.
6. Scope avatar shape user đã chốt là: `Global 3 lựa chọn tròn / vuông bo góc / vuông sắc`.
7. `app/admin/components/LexicalEditor.tsx` import trực tiếp toàn bộ `@lexical/react/*` ở top-level. Error user cung cấp là Turbopack HMR runtime:
   - `module factory is not available`
   - instantiate chain bắt đầu từ `@swc/helpers` ← `lexical/Lexical.dev.mjs` ← `LexicalEditor.tsx`
8. Repo đang dùng `next 16.1.1`, `react 19.2.3`, `lexical 0.39.0`; hiện chưa thấy pattern `dynamic(..., { ssr: false })` cho Lexical editor.

### Inference
- Vấn đề dup không nằm ở data source duy nhất; một phần nằm ở presentation rule quá yếu. Chỉ cần dữ liệu gần giống nhưng không identical là UI sẽ lặp khó chịu.
- Shape avatar là mở rộng contract config giống size/mode, nên phải đi xuyên suốt types/default/form/preview/runtime.
- Sticky footer nên chuẩn hoá ở shared wrappers thay vì vá riêng từng page home-component, nếu không sẽ lệch UX và tốn công maintain.
- Lỗi Lexical nhiều khả năng là HMR/Turbopack boundary issue hơn là lỗi business logic editor; sửa theo hướng isolate/lazy-load editor sẽ an toàn và rollback dễ hơn việc đụng sâu vào editor internals.

### Counter-hypothesis
- Có thể dup đến từ auto-generate tạo trùng dữ liệu, không chỉ do render. Em chưa thấy evidence trực tiếp từ screenshot để kết luận 100% là source data hay render. Vì vậy plan nên xử lý 2 lớp:
  1. Presentation dedupe để loại cảm giác lặp ở UI.
  2. Review normalize/auto-generate path để tránh persist group title = first link label khi regenerate.
- Có thể lỗi Lexical do cache dev server thay vì code. Nhưng vì user muốn fix trong codebase, hướng dynamic client boundary vẫn đáng làm vì giảm rủi ro HMR về lâu dài.

## Root Cause Confidence
**Medium-High**
- Dup title/link: **High** vì evidence trực tiếp thấy current compare quá hẹp ở `HomepageCategoryHeroSection.tsx`.
- Sticky footer thiếu chuẩn hoá: **High** vì create wrapper hiện footer thường, còn product/services/posts đã có pattern sticky.
- Lexical HMR: **Medium** vì error stack rất rõ ở module instantiate chain, nhưng chưa có runtime repro log nội bộ; vẫn đủ mạnh để spec theo hướng isolate editor boundary.

## Files Impacted
### HomepageCategoryHero
- `components/site/HomepageCategoryHeroSection.tsx` — Vai trò hiện tại: render menu/mega-menu/thumb avatar; **Sửa:** thêm normalize compare để ẩn title/item bị trùng về nghĩa, và support avatar shape token/class cho image/icon/fallback.
- `app/admin/home-components/homepage-category-hero/_types/index.ts` — Vai trò hiện tại: định nghĩa config của hero; **Sửa:** thêm `categoryImageShape` kiểu global.
- `app/admin/home-components/homepage-category-hero/_lib/constants.ts` — Vai trò hiện tại: default config + normalize categories/config; **Sửa:** thêm default/fallback cho shape mới và helper option nếu cần.
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx` — Vai trò hiện tại: form create/edit cho hero; **Sửa:** thêm selector shape toàn cục và microcopy rõ cho 3 lựa chọn.
- `app/admin/home-components/create/homepage-category-hero/page.tsx` — Vai trò hiện tại: create state/payload; **Sửa:** nối shape vào state + payload + preview.
- `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx` — Vai trò hiện tại: edit hydrate/dirty/save; **Sửa:** hydrate + dirty-state + payload cho shape.

### Home-component shared UX
- `app/admin/home-components/create/shared.tsx` — Vai trò hiện tại: shared wrapper cho create pages; **Sửa:** chuẩn hoá sticky footer bottom bar theo pattern product edit.
- Các page edit home-components dùng layout riêng, trước mắt tối thiểu gồm `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx` và các edit pages đồng pattern — Vai trò hiện tại: mỗi page tự render nút save riêng; **Sửa:** chuyển sang sticky footer thống nhất hoặc trích shared action bar dùng lại cho toàn bộ home-components create/edit.
- Có thể cần thêm shared component mới, ví dụ `app/admin/home-components/_shared/components/HomeComponentStickyActionBar.tsx` — **Thêm:** bar hành động save/cancel thống nhất cho create/edit.

### Lexical
- `app/admin/components/LexicalEditor.tsx` — Vai trò hiện tại: editor full client import top-level; **Sửa:** tách phần implementation thực tế khỏi export public để có lazy boundary ổn định hơn.
- `app/admin/components/LexicalEditor.client.tsx` hoặc tên tương đương — **Thêm:** giữ toàn bộ logic Lexical thật ở client-only module.
- `app/admin/components/LexicalEditor.tsx` (wrapper mới) — **Sửa/Thêm:** export component bằng `next/dynamic` với `ssr: false` + fallback loading nhẹ.
- Các page đang dùng Lexical (`posts`, `products`, `services`, `system/seo`) — Vai trò hiện tại: import editor trực tiếp; **Sửa nhẹ nếu cần:** giữ API cũ để không phải sửa call sites, hoặc cập nhật import path nếu tách wrapper.

## Execution Preview
1. Audit `HomepageCategoryHeroSection` để gom logic so sánh trùng title/link vào helper normalize string.
2. Thiết kế helper normalize:
   - trim + collapse whitespace
   - lowercase
   - remove dấu tiếng Việt
   - chuẩn hoá `đ/Đ`
   - bỏ punctuation nhẹ nếu cần
3. Áp dụng helper đó cho desktop/mobile mega-menu để ẩn title nếu canonical title = canonical first item label.
4. Review đường auto/manual categories để tránh nhóm 1 item lặp title quá rõ khi regenerate.
5. Mở rộng config `categoryImageShape: 'circle' | 'rounded' | 'square'`.
6. Nối shape vào create/edit/form/preview/runtime; runtime map shape thành class tương ứng cho image/icon/fallback.
7. Chuẩn hoá sticky footer:
   - tạo shared bottom action bar cho home-components
   - áp dụng cho create wrapper
   - áp dụng cho edit pages home-components theo cùng contract `hasChanges / isSubmitting / saveStatus`
8. Refactor Lexical:
   - tách implementation client-only
   - export qua `next/dynamic` với `ssr: false`
   - giữ API props cũ để giảm blast radius.
9. Review tĩnh toàn bộ call sites và type safety.
10. Verification bằng typecheck `bunx tsc --noEmit` sau khi user duyệt và em implement.

## Acceptance Criteria
- Không còn hiện title nhóm + item đầu bị lặp nghĩa như case `Thiết bị trao đổi nhiệt` trong UI runtime/preview khi chúng chỉ khác nhau về viết hoa/dấu/khoảng trắng nhẹ.
- `HomepageCategoryHero` có thêm tuỳ chọn shape avatar toàn cục: `Tròn / Vuông bo góc / Vuông sắc`.
- Shape áp dụng đồng nhất cho ảnh, icon mode và fallback chữ cái.
- Tất cả home-components create/edit có sticky save footer theo pattern nhất quán, dễ thao tác như trang product edit.
- Lexical editor không còn import trực tiếp kiểu dễ vỡ HMR trong public entry; boundary mới giảm lỗi runtime Turbopack module factory missing.
- Call sites hiện tại của Lexical không bị breaking API.
- Dữ liệu cũ không có `categoryImageShape` vẫn render an toàn theo default `circle`.

## Verification Plan
- Audit tĩnh:
  1. grep toàn bộ `rounded-full` liên quan avatar hero để chắc shape không bị hardcode sót
  2. grep toàn bộ home-components create/edit để xác nhận action bar đã thống nhất
  3. grep usage `LexicalEditor` để chắc wrapper mới không breaking import
  4. review helper normalize string với các case dấu/hoa/thừa khoảng trắng
- Typecheck: `bunx tsc --noEmit`
- Repro manual sau implement:
  1. mở `HomepageCategoryHero` preview/runtime với case title-link trùng
  2. đổi shape giữa 3 mode và quan sát avatar
  3. mở create/edit một vài home-components để kiểm tra sticky footer
  4. reload nóng page dùng Lexical như `posts/[id]/edit` để xem lỗi HMR còn xuất hiện không
- Không chạy lint/build theo guideline repo.

## Risk / Rollback
- Sticky footer áp cho tất cả home-components có thể đụng layout ở vài page edit custom. Em sẽ ưu tiên shared bar + integrate dần theo pattern, không ép một refactor quá rộng trong 1 bước.
- Normalize text quá mạnh có thể ẩn title trong một số case mà người dùng muốn giữ. Em sẽ giới hạn rule vào scenario `group chỉ có 1 item` để tránh over-collapse.
- Dynamic wrapper cho Lexical có thể làm initial load editor chậm nhẹ; tradeoff chấp nhận được để đổi lấy ổn định HMR hơn.
- Rollback khá dễ vì các thay đổi tách theo 3 vùng độc lập: hero UI, sticky footer, lexical boundary.

## Out of Scope
- Không redesign toàn bộ home-component editor layout ngoài sticky action bar.
- Không thay đổi business schema của posts/products/services ngoài việc bọc Lexical boundary.
- Không xử lý mọi dạng duplicate semantic phức tạp nhiều-item nhiều-group; chỉ fix rõ case title nhóm trùng item đầu và rà generator liên quan.

## Open Questions
- Không còn ambiguity lớn: user đã chốt sticky footer toàn bộ home-components create/edit và avatar shape global 3 lựa chọn.