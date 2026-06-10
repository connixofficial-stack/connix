## Problem Graph
1. [Main] CategoryProducts site render lệch màu so với preview <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Site chưa truyền `mode` vào `CategoryProductsSection` nên logic single/dual/custom không được resolve đúng
   1.2 [Sub] Site đang hardcode nhiều màu/opacity (`${secondary}15`, `bg-slate-*`, `text-slate-*`) thay vì dùng token engine
   1.3 [Sub] CategoryProducts site chưa dùng chung `getCategoryProductsColors(...)` như preview nên phá vỡ single source of truth

## Execution (with reflection)
1. Solving 1.1.1 (mode parity từ ComponentRenderer)
   - Thought: Nếu không truyền mode từ `resolvedColors.mode`, site sẽ luôn render như dual giả lập qua `secondary`.
   - Action: Trong `components/site/ComponentRenderer.tsx`, sửa case `CategoryProducts` để pass `mode={resolvedColors.mode}` vào `CategoryProductsSection`; cập nhật signature `CategoryProductsSection` nhận `mode: 'single' | 'dual'`.
   - Reflection: ✓ Valid, đây là điều kiện bắt buộc để custom/single hoạt động đúng contract.

2. Solving 1.2 + 1.3 (tokenize toàn bộ 6 styles)
   - Thought: Cần refactor theo pattern đã chuẩn ở `ProductCategoriesSection` và skill dual-brand-color-system: render dùng token, không hardcode/opacity string.
   - Action:
     - Import `getCategoryProductsColors` từ `app/admin/home-components/category-products/_lib/colors`.
     - Tạo `const colors = React.useMemo(() => getCategoryProductsColors(brandColor, secondary, mode), [brandColor, secondary, mode]);`
     - Refactor toàn bộ `CategoryProductsSection` để tất cả semantic màu dùng tokens này:
       - heading/title → `colors.heading`
       - accent line/icon → `colors.sectionAccent` / `colors.iconColor`
       - card/surface/border → `colors.cardBackground`, `colors.cardBorder`, `colors.neutralBackground`, `colors.neutralSurface`, `colors.neutralBorder`
       - button/link/action → `colors.buttonBackground`, `colors.buttonBorder`, `colors.buttonText`
       - price/pill → `colors.priceText`, `colors.pillBackground`, `colors.pillBorder`, `colors.pillText`
       - empty state → `colors.emptyStateBackground`, `colors.emptyStateIconBackground`, `colors.emptyStateIcon`, `colors.emptyStateText`
       - featured badge → `colors.featuredBadgeBackground`, `colors.featuredBadgeText`
     - Loại bỏ toàn bộ literal màu theo pattern:
       - `${secondary}..` (05/08/10/15/20/30/40/dd…)
       - `bg-slate-*`, `text-slate-*`, `border-slate-*` trong phần CategoryProductsSection
       - gradient màu thương hiệu hardcoded bằng opacity từ secondary
     - Giữ nguyên layout/behavior hiện có (không mở rộng scope), chỉ thay color source.
   - Reflection: ✓ Valid, đảm bảo full parity create/edit preview ↔ site cho cả 6 styles theo yêu cầu user.

3. Enforce single/dual/custom contract nghiêm ngặt
   - Thought: User đã xác nhận strict single=monochromatic.
   - Action:
     - Dựa trên `getCategoryProductsColors` (đã resolveSecondaryForMode):
       - mode single => secondary token collapse về primary
       - mode dual/custom => dùng secondary hợp lệ hoặc harmony fallback
     - Không override ngược secondary ở site.
   - Reflection: ✓ Valid, thống nhất với skill contract và preview hiện tại.

4. Verification (theo rule repo)
   - Thought: Repo yêu cầu chỉ chạy typecheck trước commit.
   - Action: Chạy `bunx tsc --noEmit` sau khi sửa.
   - Reflection: ✓ đủ để chặn lỗi type/signature khi thêm `mode` và tokens.

5. Commit plan (sẽ thực hiện sau khi bạn duyệt spec)
   - Stage các file code đã sửa + thêm `.factory/docs` nếu có phát sinh theo rule repo.
   - Commit message đề xuất: `fix(category-products): align site color rendering with preview tokens across single/dual/custom`

## File-level changes dự kiến
- `components/site/ComponentRenderer.tsx`
  - Update switch case `CategoryProducts` truyền `mode`.
  - Update function `CategoryProductsSection` signature.
  - Inject `getCategoryProductsColors` + thay mapping màu cho 6 styles bằng tokens.
  - Remove hardcoded color literals/opacity expressions trong vùng CategoryProducts.

## Checklist nghiệm thu
- [ ] Single mode: site chỉ dùng 1 màu (secondary collapse = primary) giống preview.
- [ ] Dual mode: site hiển thị đúng primary/secondary theo token như preview.
- [ ] Custom mode: site nhận đúng effectiveColors + mode từ type override.
- [ ] Cả 6 style của CategoryProducts đồng nhất màu preview/site.
- [ ] Không còn `${secondary}xx` và màu hardcode slate trong CategoryProductsSection.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Tạo commit local (không push).