# Spec: Audit + Full Fix `ProductCategories` theo `dual-brand-color-system` (Create/Edit/Preview/Render, đủ 6 layouts)

## Mục tiêu
Xác minh route `http://localhost:3000/admin/home-components/product-categories/:id/edit` (kèm create, preview, site render) đã áp dụng **đầy đủ** skill `.factory/skills/dual-brand-color-system` hay chưa, tìm **đầy đủ root causes** bằng DARE, và đưa ra plan implement chi tiết 1 lần.

## Kết luận nhanh
Hiện tại **chưa áp dụng đầy đủ skill** cho `ProductCategories` ở 3 điểm gốc:
1. Chưa enforce mode-aware end-to-end (single/dual) theo rule S2.
2. Chưa có dirty-state save button parity theo rule S3 ở trang edit.
3. Thiếu contract type + propagation `mode` xuyên suốt create/edit/preview/site render cho 6 layouts.

---

## Bằng chứng kỹ thuật (đã đọc đúng route + luồng liên quan)

### 1) Route edit theo URL localhost
- `app/admin/home-components/product-categories/[id]/edit/page.tsx`
  - Dùng `useBrandColors()` từ `create/shared` (line 20), chỉ lấy `{ primary, secondary }`.
  - Không query `site_brand_mode`.
  - Nút save: `disabled={isSubmitting}` (line 184), không có `hasChanges`.

### 2) Route create tương ứng
- `app/admin/home-components/create/product-categories/page.tsx`
  - Dùng `useBrandColors()` từ `create/shared` (line 22), chỉ `{ primary, secondary }`.
  - Không query `site_brand_mode`.
  - Preview nhận `brandColor + secondary` trực tiếp.

### 3) Preview 6 layouts
- `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
  - Có đủ 6 styles: `grid | carousel | cards | minimal | marquee | circular`.
  - Gọi `getProductCategoriesColors(brandColor, secondary)` (line 37), **không có mode**.

### 4) Site render tương ứng 6 layouts
- `components/site/ComponentRenderer.tsx`
  - `case 'ProductCategories'` không truyền `mode` vào `ProductCategoriesSection`.
  - `ProductCategoriesSection` gọi `getProductCategoriesColors(brandColor, secondary)` (line 5193), **không có mode**.

### 5) Color helper hiện tại
- `app/admin/home-components/product-categories/_lib/colors.ts`
  - Đã có `safeParseOklch` + fallback (điểm tốt, gần S1).
  - Nhưng signature chính vẫn là `(primary, secondary)`; chưa có `mode`/`resolveSecondaryForMode` theo chuẩn S2.

### 6) Hook nguồn màu của admin create/edit
- `app/admin/home-components/create/shared.tsx`
  - `useBrandColors()` không query `site_brand_mode`.
  - Nếu `site_brand_secondary` rỗng thì fallback complementary, không có branch single-mode rõ ràng.
  - Đây là nguyên nhân khiến create/edit preview có thể lệch kỳ vọng single-mode.

---

## Problem Graph
1. [Main] ProductCategories chưa full-compliance với skill dual-brand-color-system trên create/edit/preview/site-render (đủ 6 layouts) <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Sub] Single-mode behavior chưa được enforce end-to-end <- depends on 1.1.1, 1.1.2
      1.1.1 [ROOT CAUSE] `create/shared.useBrandColors()` không có mode contract nên admin create/edit không biết single/dual
      1.1.2 [ROOT CAUSE] `getProductCategoriesColors(...)` + call sites không nhận `mode`, nên không thể buộc `resolveSecondaryForMode(...)`
   1.2 [Sub] Rule S2 của skill bị vi phạm ở contract level <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Pipeline màu đang dựa vào “caller truyền secondary đúng”, thay vì rule bắt buộc “resolve theo mode trước khi build palette”
   1.3 [Sub] UX save-state ở edit chưa parity với Hero <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] `product-categories/[id]/edit/page.tsx` thiếu `initialData + hasChanges + reset pristine sau save`
   1.4 [Sub] Regression dễ tái phát khi thêm/chỉnh layout <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Chưa có QA matrix bắt buộc cho 6 layouts × (single/dual) × (create preview/edit preview/site render)

---

## Execution (with reflection)
1. Solving 1.1.1 (mode awareness ở admin flow)
   - Thought: Nếu create/edit không có `brandMode`, preview sẽ phụ thuộc vào cách `secondary` được suy diễn ngầm.
   - Action: Bổ sung query `site_brand_mode` ngay ở page create/edit ProductCategories, derive `brandMode`.
   - Reflection: ✓ Đúng KISS, chạm đúng boundary component, không tạo side-effect toàn hệ thống.

2. Solving 1.1.2 + 1.2.1 (mode-aware color contract)
   - Thought: Rule S2 chỉ chắc chắn khi helper nhận `mode` và tự resolve secondary.
   - Action: Đổi signature helper sang `getProductCategoriesColors(primary, secondary, mode)` + thêm `resolveSecondaryForMode(...)`.
   - Reflection: ✓ Khóa logic ngay tại single source of truth, không phụ thuộc caller.

3. Solving 1.3.1 (save button parity)
   - Thought: Hero đã có pattern chuẩn, ProductCategories edit cần parity 1:1.
   - Action: Thêm `initialData`, `hasChanges`, compare effect, disable save khi pristine, reset sau save thành công.
   - Reflection: ✓ Đúng yêu cầu skill S3, UX nhất quán.

4. Solving 1.4.1 (chống tái phát)
   - Thought: Không có matrix test thì layout mới dễ làm vỡ single-mode hoặc save-state.
   - Action: Chốt QA matrix bắt buộc trong spec (12 case cốt lõi + full matrix 36 case nếu QA sâu).
   - Reflection: ✓ Chặn regressions thực tế.

---

## Scope
### In scope
- ProductCategories create/edit/preview/site-render cho đúng 6 layouts.
- Enforce S2 (mode-aware resolve secondary) và S3 (dirty save-state).
- Giữ nguyên behavior thẩm mỹ hiện tại, chỉ sửa phần compliance + consistency.

### Out of scope
- Refactor các home-components khác.
- Sửa global `create/shared.useBrandColors()` cho toàn dự án (tránh side-effect ngoài ticket).
- Thay đổi schema Convex.

---

## File dự kiến thay đổi
1. `app/admin/home-components/product-categories/_types/index.ts`
2. `app/admin/home-components/product-categories/_lib/colors.ts`
3. `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`
4. `app/admin/home-components/create/product-categories/page.tsx`
5. `app/admin/home-components/product-categories/[id]/edit/page.tsx`
6. `components/site/ComponentRenderer.tsx`

---

## Plan triển khai chi tiết (step-by-step actionable, không chia phase)
1. **Types** (`_types/index.ts`)
   - Thêm `export type ProductCategoriesBrandMode = 'single' | 'dual';`.

2. **Color helper mode-aware** (`_lib/colors.ts`)
   - Thêm helper `resolveSecondaryForMode(primary, secondary, mode)`:
     - `single` => luôn dùng `primary`.
     - `dual` => dùng `secondary` nếu non-empty, fallback `primary`.
   - Đổi signature `getProductCategoriesColors(primary, secondary, mode)`.
   - Dùng `secondaryResolved` cho toàn bộ secondary palette.
   - Giữ nguyên `safeParseOklch` hiện có (đã tốt theo S1).

3. **Preview contract** (`ProductCategoriesPreview.tsx`)
   - Import type `ProductCategoriesBrandMode`.
   - Thêm prop `mode`.
   - Đổi `useMemo` gọi helper mới: `getProductCategoriesColors(brandColor, secondary, mode)`.
   - Không đổi UI layout logic.

4. **Create page propagate mode** (`create/product-categories/page.tsx`)
   - Query `modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' })`.
   - Derive `brandMode`.
   - Truyền `mode={brandMode}` vào `ProductCategoriesPreview`.

5. **Edit page propagate mode** (`product-categories/[id]/edit/page.tsx`)
   - Query + derive `brandMode` như bước 4.
   - Truyền `mode={brandMode}` vào `ProductCategoriesPreview`.

6. **Edit page dirty-state parity (S3)** (`product-categories/[id]/edit/page.tsx`)
   - Thêm state `initialData` gồm:
     - `title`, `active`, `categories`, `style`, `showProductCount`, `columnsDesktop`, `columnsMobile`.
   - Thêm state `hasChanges`.
   - Sau khi load component: set form state + set `initialData` + `hasChanges(false)`.
   - Thêm `useEffect` compare current vs initial (dùng `JSON.stringify` cho mảng categories).
   - Button submit: `disabled={isSubmitting || !hasChanges}`.
   - Label: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu`.
   - Sau save success: cập nhật `initialData` mới + `hasChanges(false)`.

7. **Site render propagate mode** (`ComponentRenderer.tsx`)
   - `case 'ProductCategories'`: truyền thêm `mode` từ `useBrandColors()` vào `ProductCategoriesSection`.
   - Update signature `ProductCategoriesSection(..., mode: 'single' | 'dual')`.
   - Đổi call helper màu trong section sang `getProductCategoriesColors(brandColor, secondary, mode)`.

8. **Type-safety compile pass**
   - Sửa import/type errors do signature mới ở tất cả call sites ProductCategories.

9. **Validation kỹ thuật**
   - Chạy: `bunx tsc --noEmit`.

10. **Manual QA matrix (bắt buộc)**
   - **6 layouts**: grid, carousel, cards, minimal, marquee, circular.
   - **3 contexts**: create preview, edit preview, site render.
   - **2 modes**: single + dual.
   - Checklist mỗi case:
     1) Single mode: không xuất hiện dual-color artifacts (secondary phải resolve về primary).
     2) Dual mode: primary/secondary tách biệt đúng.
     3) Không crash runtime.
     4) Edit save button: pristine disabled, dirty enabled, save xong disabled lại.

---

## Acceptance Criteria
- [ ] ProductCategories create/edit/preview/site-render đều mode-aware theo S2.
- [ ] `getProductCategoriesColors(...)` bắt buộc nhận `mode` và tự resolve secondary.
- [ ] Single mode hiển thị đúng cho cả 6 layouts ở cả 3 context.
- [ ] Trang edit ProductCategories có dirty-state save button parity như Hero (S3).
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. **Rủi ro**: Đổi signature helper gây sót call site.
   - **Giảm thiểu**: TS compile sẽ bắt hết; grep `getProductCategoriesColors(` toàn repo.
2. **Rủi ro**: Dirty-check false positive do thứ tự categories.
   - **Giảm thiểu**: Compare đúng mảng theo thứ tự người dùng đang edit (không sort ngầm), reset initial sau save.
3. **Rủi ro**: Chỉnh edit page quá rộng.
   - **Giảm thiểu**: chỉ thêm state/effect/button logic, không đụng UI layout con.

---

## Ghi chú triển khai
- Tuân thủ KISS/YAGNI/DRY: chỉ chạm ProductCategories đúng theo scope.
- Không mở rộng sang global refactor hook dùng chung nếu không bắt buộc.
- Khi implement xong code TS: chạy `bunx tsc --noEmit` trước khi commit theo quy ước dự án.
