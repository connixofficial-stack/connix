## Audit Summary
- Observation: Sau khi bấm `Sinh ngay`, mega panel của `homepage-category-hero` có thể lặp tên danh mục cha ở 2 chỗ: heading panel bên trên và title group bên trong. Evidence: `components/site/HomepageCategoryHeroSection.tsx` luôn render heading panel bằng `resolveMenuLabel(item.category)`, còn `renderMegaMenuColumns()` lại tiếp tục render `group.title`.
- Observation: Generator fallback hiện tạo group title đúng bằng tên `rootCategory`. Evidence: `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts` đoạn `rootGroups.push(buildGroup(0, rootCategory.name, items))` khi root không có `levelOne` hoặc chỉ có fallback products.
- Observation: Logic ẩn title hiện tại chỉ cover case `items.length === 1` và `group.title === first item label`, không cover case `group.title === panel heading`. Evidence: `HomepageCategoryHeroSection.tsx` biến `hideGroupTitle` chỉ so `normalizedTitle` với `normalizedFirst`.
- Observation: User nói auto-generate “làm khá đúng ý”, nên mục tiêu là bỏ phần dup chứ không đổi sâu rule sinh menu/cây danh mục.

## Root Cause Confidence
**High** — Dup đến từ contract giữa generator fallback và renderer: generator tạo `group.title` trùng `rootCategory.name`, còn renderer không có guard để ẩn title khi nó trùng panel heading. Đây là lỗi trình bày/contract nhỏ, không phải sai business logic của auto-generate.

## TL;DR kiểu Feynman
- `Sinh ngay` sinh menu khá đúng.
- Nhưng với vài case, tên danh mục cha bị in 2 lần.
- Một lần là tiêu đề panel lớn, một lần là tiêu đề group bên trong.
- Mình sẽ thêm rule để title trùng panel thì không hiện nữa.
- Giữ nguyên logic auto-generate chính, chỉ bỏ phần lặp khó chịu.

## Files Impacted
### Runtime / preview renderer
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render panel + group titles cho site thật và preview admin.
  - Thay đổi: bổ sung guard để ẩn `group.title` nếu nó trùng với category heading hiện tại của panel, kể cả khi group có nhiều items; áp cho cả desktop và mobile rendering.

### Generator contract (nếu cần fix tận gốc tối thiểu)
- `Có thể sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: sinh `groups` cho auto-generate/fallback.
  - Thay đổi: cân nhắc cho fallback root-products dùng title rỗng hoặc semantic title khác khi nó chỉ lặp lại tên root; chỉ làm nếu cần để contract sạch hơn, nhưng ưu tiên giữ thay đổi nhỏ ở renderer trước.

## Root Cause / Counter-Hypothesis
1. Triệu chứng: panel auto-generated hiển thị tên danh mục cha bị lặp/dup.
2. Phạm vi: create/edit preview và runtime site của `homepage-category-hero` khi menu được auto-generate, nhất là nhánh fallback products của root.
3. Tái hiện: ổn định ở case group title trùng category heading.
4. Mốc thay đổi gần nhất: hệ auto-generate đã được productize; hiện renderer chỉ mới tránh dup với first item chứ chưa tránh dup với panel heading.
5. Dữ liệu thiếu: không thiếu thêm; screenshot + code đủ chốt nguyên nhân.
6. Giả thuyết thay thế đã loại trừ: không phải do preview riêng; preview đang dùng chung runtime section. Cũng không phải do user nhập tay vì user nói bấm `Sinh ngay`.
7. Rủi ro nếu fix sai nguyên nhân: nếu chỉnh generator sâu quá có thể làm đổi structure menu mà user đang thấy “khá đúng ý”.
8. Tiêu chí pass/fail: không còn lặp title panel/group, nhưng menu links/items vẫn giữ đúng như auto-generate hiện tại.

## Proposal
1. Fix nhỏ, ưu tiên ở renderer:
   - truyền thêm ngữ cảnh `panelTitle` vào logic hide-title,
   - ẩn `group.title` nếu nó normalize bằng `item.category.name`,
   - giữ nguyên title nếu nó thật sự mang nghĩa khác.
2. Áp cùng rule cho cả desktop mega panel và mobile expanded panel để parity.
3. Chỉ nếu sau review thấy contract generator quá “bẩn” thì bổ sung hardening nhỏ ở `auto-generate.ts` cho nhánh fallback root-products; không đổi scoring/sort/tree logic.

## Execution Preview
1. Đọc/chỉnh `HomepageCategoryHeroSection.tsx` tại phần render group title desktop/mobile.
2. Thêm helper so sánh normalized giữa `group.title`, `panel heading`, và `first item label`.
3. Áp rule ẩn title trùng cho cả desktop + mobile.
4. Chỉ nếu cần mới chạm `auto-generate.ts` để cleanup fallback title.
5. Review tĩnh và chạy `bunx tsc --noEmit` sau khi implement.

## Acceptance Criteria
- Sau khi bấm `Sinh ngay`, panel không còn lặp lại tên danh mục cha ở cả heading và group title.
- Danh sách links/items sinh ra vẫn giữ đúng logic hiện tại.
- Create preview, edit preview và runtime site có behavior thống nhất.
- Không ảnh hưởng các case manual mà group title thật sự khác category heading.

## Verification Plan
- Static review: kiểm tra cả desktop branch và mobile branch của `HomepageCategoryHeroSection.tsx`.
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công cho tester:
  1. mở edit/create `homepage-category-hero`,
  2. bấm `Sinh ngay`,
  3. chọn category đang bị dup,
  4. xác nhận còn items nhưng không còn title lặp.

## Out of Scope
- Không đổi thuật toán score/ranking của auto-generate.
- Không redesign layout panel.
- Không chỉnh các home-component khác.

## Risk / Rollback
- Risk thấp: nếu rule ẩn title quá rộng có thể làm mất title ở case title có chủ đích giống panel heading.
- Rollback: chủ yếu revert `HomepageCategoryHeroSection.tsx` (và `auto-generate.ts` nếu có chạm).