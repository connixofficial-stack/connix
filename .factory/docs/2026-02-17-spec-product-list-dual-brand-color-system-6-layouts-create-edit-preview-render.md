# Spec: ProductList 6 layouts chưa áp dụng đầy đủ `dual-brand-color-system` (Create + Edit + Preview + Render)

## Mục tiêu
Đánh giá và chốt kế hoạch fix **toàn bộ ProductList** (route edit/create/preview/render) để tuân thủ đầy đủ skill `.factory/skills/dual-brand-color-system` cho cả 6 layout: `minimal`, `commerce`, `bento`, `carousel`, `compact`, `showcase`.

---

## Kết luận nhanh sau review
**Chưa áp dụng đầy đủ skill.**

### Bằng chứng trực tiếp từ code
1. `app/admin/home-components/create/shared.tsx` (`useBrandColors`) không đọc `site_brand_mode`, luôn trả secondary hợp lệ/complementary (dual-like behavior), khác site runtime.
2. `components/site/hooks.ts` trả `secondary=''` khi mode `single`, nhưng ProductList render không resolve secondary theo mode trước khi dùng.
3. `app/admin/home-components/product-list/_components/ProductListPreview.tsx` và `components/site/ProductListSection.tsx` đang duplicate 2 bộ JSX/layout riêng -> drift giữa preview và render.
4. Vi phạm rule heading:
   - Preview: `bento/carousel/compact/showcase` có `h2` không gán `brandColor`.
   - Site: `SectionHeader` luôn `text-slate-900`, không dùng `brandColor` cho `h2`.
5. Dùng `secondary` trực tiếp cho alpha string trong site (`${secondary}05`, `${secondary}08`, `${secondary}10`), single mode sẽ thành CSS invalid.
6. `BrandBadge` variant `solid` dùng `backgroundColor: secondary` + text trắng cứng, không có APCA guard cho dynamic colors.
7. `app/admin/home-components/product-list/[id]/edit/page.tsx` chưa có dirty-state parity: nút save chỉ `disabled={isSubmitting}`.

---

## Scope
### In scope
- ProductList create/edit/preview/render cho 6 layouts.
- Chuẩn hóa mode `single|dual`, harmony, APCA, Single Source of Truth.
- Fix Save button dirty-state ở edit ProductList.

### Out of scope
- Không refactor component khác (Blog/ServiceList/Stats/Hero...).
- Không đổi schema Convex.

---

## Problem Graph
1. [Main] ProductList chưa compliant full skill dual-brand-color-system xuyên suốt create/edit/preview/site <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [Sub] Mismatch hợp đồng màu giữa admin preview và site runtime <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Có 2 hook brand-color khác nhau; create/edit không theo `site_brand_mode`, site thì có
   1.2 [Sub] Single mode không được resolve secondary an toàn trước khi render <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] ProductList chưa có color engine `_lib/colors.ts` để `resolveSecondaryForMode(...)` + APCA/OKLCH
   1.3 [Sub] Preview và render lệch nhau theo layout <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Duplicate 6 layouts ở 2 file khác nhau, không shared renderer/token
   1.4 [Sub] Vi phạm element-level color rules (heading/CTA/accent) <- depends on 1.4.1
      1.4.1 [ROOT CAUSE] Heading nhiều layout dùng neutral thay vì primary; màu được gán inline ad-hoc
   1.5 [Sub] Edit UX chưa đạt safety rule S3 <- depends on 1.5.1
      1.5.1 [ROOT CAUSE] Thiếu `initialData + hasChanges + reset pristine` pattern cho save button

---

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Nếu không thống nhất contract mode, preview đúng giả lập nhưng site sẽ sai khi single mode.
   - Action: Chuẩn hóa ProductList nhận `mode` explicit ở create/edit/preview/site và persist `harmony` trong config.
   - Observation: Loại bỏ lệch hành vi do mỗi nơi tự suy diễn secondary.
   - Reflection: ✓ Đây là root cause lớn nhất gây “nhìn đúng ở admin nhưng lệch runtime”.

2. Solving 1.2.1...
   - Thought: Cần một color engine riêng như Hero/Stats thay vì nối string màu inline.
   - Action: Tạo `product-list/_lib/colors.ts` (OKLCH + APCA + harmony + safe parse + secondary resolver).
   - Observation: Giải quyết cùng lúc runtime safety, contrast, và token hóa màu.
   - Reflection: ✓ Chặn lỗi kiểu single mode + secondary rỗng ngay từ nền tảng.

3. Solving 1.3.1...
   - Thought: Không thể giữ 2 bộ JSX 6 layouts nếu muốn “render = preview”.
   - Action: Tạo shared renderer 6 layouts dùng chung cho preview và site.
   - Observation: Mọi fix màu/chuẩn sẽ áp cùng lúc cho cả 2 context.
   - Reflection: ✓ DRY + giảm regressions mạnh nhất.

4. Solving 1.4.1...
   - Thought: Rule heading/CTA/accent phải encode thành token semantics, không để từng layout tự chọn.
   - Action: Token hóa roles (`headingPrimary`, `ctaPrimary`, `subtitleSecondary`, `accentSecondary`, `neutralSurface`).
   - Observation: Đảm bảo 60-30-10 ở content state và heading luôn primary.
   - Reflection: ✓ Đúng mục tiêu skill, tránh tranh cãi layout-by-layout.

5. Solving 1.5.1...
   - Thought: Dirty-state save là safety rule v11.1, ProductList edit chưa đạt.
   - Action: Áp pattern Hero/Stats: `initialData`, `hasChanges`, disable save khi pristine, reset sau save success.
   - Observation: UX nhất quán, tránh submit thừa.
   - Reflection: ✓ Root cause UX/safety được xử lý triệt để.

---

## Plan triển khai chi tiết (step-by-step, không chia phase)

1. **Chuẩn hóa type ProductList**
   - File: `app/admin/home-components/product-list/_types/index.ts`
   - Thêm:
     - `export type ProductListBrandMode = 'single' | 'dual';`
     - `export type ProductListHarmony = 'analogous' | 'complementary' | 'triadic';`
     - mở rộng config runtime để chứa `harmony?: ProductListHarmony`.

2. **Bổ sung constants harmony mặc định**
   - File: `app/admin/home-components/product-list/_lib/constants.ts`
   - Thêm `DEFAULT_PRODUCT_LIST_HARMONY = 'analogous'`.

3. **Tạo color engine ProductList (single source màu)**
   - File mới: `app/admin/home-components/product-list/_lib/colors.ts`
   - Implement:
     - `safeParseOklch`, `clampLightness`, `withAlpha` (không dùng `${secondary}xx`).
     - `getAPCATextColor(bg, size, weight)`.
     - `getAnalogous/getComplementary/getTriadic`.
     - `resolveSecondaryForMode(primary, secondary, mode, harmony)`.
     - `getProductListColorTokens({ primary, secondary, mode, harmony, style })` trả token semantic cho 6 layout.
   - Bắt buộc mọi text trên nền dynamic dùng APCA text token.

4. **Tạo shared renderer 6 layouts dùng chung preview/site**
   - File mới: `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx`
   - Props:
     - `items`, `subTitle`, `sectionTitle`, `style`, `tokens`, `context: 'preview' | 'site'`, `device?`, `showViewAll?`.
   - Render đầy đủ 6 layout hiện có, nhưng màu chỉ lấy từ `tokens`.
   - Bắt buộc `h2` dùng token heading primary cho cả 6 layout.

5. **Refactor ProductListPreview sang shared renderer + color engine**
   - File: `app/admin/home-components/product-list/_components/ProductListPreview.tsx`
   - Thay đổi:
     - thêm props `mode: ProductListBrandMode`, `harmony: ProductListHarmony`.
     - bỏ inline color styles ad-hoc, dùng `getProductListColorTokens`.
     - dùng `ProductListSectionShared` để render 6 layout.
   - Giữ `PreviewWrapper`, `BrowserFrame`, style/device switch như cũ.

6. **Refactor ProductList site render về shared renderer**
   - File: `components/site/ProductListSection.tsx`
   - Thay đổi:
     - thêm prop `mode: ProductListBrandMode`.
     - parse `harmony` từ `config` (fallback default).
     - giữ logic query/select products hiện tại.
     - bỏ 6 nhánh JSX duplicate hiện tại, thay bằng `ProductListSectionShared` + tokens từ color engine.

7. **Truyền mode từ ComponentRenderer vào ProductListSection**
   - File: `components/site/ComponentRenderer.tsx`
   - Sửa case `ProductList` để truyền `mode` từ `useBrandColors()` xuống `ProductListSection`.

8. **Đồng bộ create page ProductList theo mode + harmony**
   - File: `app/admin/home-components/create/product-list/page.tsx`
   - Thay đổi:
     - query `site_brand_mode`, derive `brandMode`.
     - thêm state `productHarmony` (default constants).
     - khi `type === 'ProductList' && brandMode === 'single'`, hiển thị select harmony.
     - submit config ProductList thêm `harmony`.
     - truyền `mode`, `harmony` vào `ProductListPreview`.

9. **Đồng bộ edit page ProductList theo mode + harmony + dirty-state**
   - File: `app/admin/home-components/product-list/[id]/edit/page.tsx`
   - Thay đổi:
     - query `site_brand_mode`, derive `brandMode`.
     - load `harmony` từ config (fallback default).
     - thêm state `initialData` + `hasChanges`.
     - so sánh `title/active/style/selectionMode/itemCount/sortBy/subTitle/sectionTitle/selectedProductIds/harmony`.
     - save button: `disabled={isSubmitting || !hasChanges}`; label `Đang lưu.../Lưu thay đổi/Đã lưu`.
     - sau save success: reset pristine.
     - truyền `mode`, `harmony` vào `ProductListPreview`.

10. **Mở rộng ProductListForm để chỉnh harmony ở edit**
    - File: `app/admin/home-components/product-list/_components/ProductListForm.tsx`
    - Thêm props `brandMode`, `harmony`, `setHarmony`.
    - Chỉ hiện harmony select khi `brandMode === 'single'`.

11. **Loại bỏ secondary-string invalid trong UI shared**
    - File: `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx`
    - Thay toàn bộ `${secondary}05/08/10/...` bằng token alpha từ helper `withAlpha(...)`.

12. **APCA compliance cho badge/button text dynamic**
    - Files:
      - `components/site/shared/BrandColorHelpers.tsx` (nếu tiếp tục dùng cho ProductList)
      - hoặc đảm bảo trong shared renderer ProductList không còn phụ thuộc solid badge text hardcoded trắng.
    - Quy tắc: text trên nền dynamic dùng `getAPCATextColor`.

13. **Validation TypeScript**
    - Chạy: `bunx tsc --noEmit`.

14. **Manual QA matrix bắt buộc**
    - 6 layouts × 3 context (create preview, edit preview, homepage render) × 2 mode (single/dual).
    - Kiểm tra:
      - heading luôn primary.
      - không còn style invalid khi single (`secondary=''`).
      - preview = site (màu + hierarchy).
      - save button edit đúng pristine/dirty.

---

## Acceptance Criteria
- [ ] ProductList có color engine riêng theo OKLCH/APCA/harmony.
- [ ] Single mode không dùng `secondary` rỗng trực tiếp trong bất kỳ layout nào.
- [ ] Cả 6 layout dùng heading primary ở preview và site.
- [ ] Preview và site dùng chung renderer/layout logic (single source of truth).
- [ ] Create/Edit ProductList có mode-aware + harmony trong single mode.
- [ ] Edit ProductList có dirty-state save parity (disable khi pristine).
- [ ] `bunx tsc --noEmit` pass.

---

## Rủi ro & giảm thiểu
1. **Rủi ro:** refactor shared renderer ảnh hưởng layout spacing/UX.
   - **Giảm thiểu:** giữ nguyên cấu trúc class hiện tại, chỉ thay lớp màu trước.
2. **Rủi ro:** thay type/config làm mất tương thích data cũ.
   - **Giảm thiểu:** `harmony` optional + fallback `analogous`.
3. **Rủi ro:** mode logic lan sang component khác nếu sửa shared hook.
   - **Giảm thiểu:** không sửa global hook create/shared trong ticket này; chỉ xử lý tại ProductList pages.

---

## Ghi chú triển khai
- Tuân thủ KISS/YAGNI/DRY: chỉ chạm ProductList path liên quan trực tiếp.
- Không thêm feature ngoài yêu cầu (không thêm analytics/filter mới).
- Ưu tiên fix gốc (mode contract + shared renderer + color engine) thay vì patch từng layout rời rạc.
