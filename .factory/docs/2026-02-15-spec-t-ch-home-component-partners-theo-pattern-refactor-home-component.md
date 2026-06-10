## Problem Graph
1. [Main] Tách Partners khỏi monolithic edit/preview theo pattern Hero ← depends on 1.1, 1.2, 1.3
   1.1 [Sub] Xác định phạm vi Partners hiện tại (edit + previews + create) ← depends on 1.1.1
      1.1.1 [ROOT CAUSE] Partners đang được xử lý chung trong `app/admin/home-components/[id]/edit/page.tsx`, `app/admin/home-components/previews.tsx`, `app/admin/home-components/create/gallery/page.tsx`
   1.2 [Sub] Tạo module Partners feature-based (types/lib/components/route)
   1.3 [Sub] Redirect + cleanup code cũ, update create/preview dùng module mới

## Execution (with reflection)
1. Solving 1.2 — tạo module Partners mới
   - Thought: Theo pattern Hero, cần module riêng với types/lib/components + route edit.
   - Action:
     - Tạo `app/admin/home-components/partners/_types/index.ts`:
       - `export type PartnersStyle = 'grid' | 'marquee' | 'mono' | 'badge' | 'carousel' | 'featured'`.
       - `export interface PartnerItem extends ImageItem { id: string | number; url: string; link: string; name?: string }`.
     - Tạo `app/admin/home-components/partners/_lib/constants.ts`:
       - `PARTNERS_STYLES` array `{ id, label }` cho 6 style (Grid/Marquee/Mono/Badge/Carousel/Featured).
     - Tạo `app/admin/home-components/partners/_components/PartnersForm.tsx`:
       - UI upload logo dùng `MultiImageUploader` (folder `partners`, extraFields chỉ `link`), giữ logic y hệt form Partners cũ.
     - Tạo `app/admin/home-components/partners/_components/PartnersPreview.tsx`:
       - Tách các render styles Partners từ `previews.tsx` (Grid/Marquee/Mono/Badge/Carousel/Featured).
       - Dùng `PreviewWrapper`, `BrowserFrame`, `PreviewImage`, `usePreviewDevice`, `cn` giống Hero.
       - Giữ logic empty state + info (`${items.length} logo`) như hiện tại.
       - **AutoScrollSlider**: tách ra `_shared/components/AutoScrollSlider.tsx` để Gallery + Partners dùng chung (tránh trùng code), hoặc giữ local nếu cần tối giản (ưu tiên shared để DRY).
     - Tạo route `app/admin/home-components/partners/[id]/edit/page.tsx`:
       - `useQuery(api.homeComponents.getById)` + `useMutation(api.homeComponents.update)`.
       - Nếu `component.type !== 'Partners'` → `router.replace(/admin/home-components/${id}/edit?type=${component.type.toLowerCase()})`.
       - Init state: `title`, `active`, `partnersItems`, `partnersStyle` từ `config.items` + `config.style` (default `grid`).
       - Submit: `config = { items: partnersItems.map(({ url, link, name }) => ({ url, link, name })), style: partnersStyle }`.
       - Layout 2 cột: nút lưu bên trái, preview sticky bên phải (y như Hero).
   - Reflection: ✓ Giữ nguyên hành vi cũ, chỉ tách module và tái dùng shared preview utilities.

2. Solving 1.3 — redirect + cleanup code cũ
   - Thought: Monolithic edit/preview không còn xử lý Partners.
   - Action:
     - `app/admin/home-components/[id]/edit/page.tsx`:
       - Trong `useEffect` init, nếu `component.type === 'Partners'` → redirect sang `/admin/home-components/partners/${id}/edit`.
       - Xóa `case 'Partners'` trong init config và trong `buildConfig()`.
       - Xóa block UI `component.type === 'Partners'` khỏi phần Gallery/Partners/TrustBadges (giữ Gallery + TrustBadges).
     - `app/admin/home-components/previews.tsx`:
       - Tách `GalleryPreview` chỉ còn Gallery (remove `componentType` và toàn bộ render styles Partners).
       - Di chuyển `Partners` styles/render sang `PartnersPreview` mới.
       - Nếu tách `AutoScrollSlider` ra shared, update import cả GalleryPreview + PartnersPreview.
     - `app/admin/home-components/create/gallery/page.tsx`:
       - Khi `type === 'Partners'`, render `PartnersPreview` thay vì `GalleryPreview`.
       - Tách state `galleryStyle` và `partnersStyle` để không dùng chung `GalleryStyle`.
       - `onSubmit`: `finalStyle` = `partnersStyle` hoặc `galleryStyle` tùy type.
       - Phần “Image Guidelines”: dùng đúng state (`galleryStyle`/`partnersStyle`) cho điều kiện hiển thị.
   - Reflection: ✓ Code cũ được dọn sạch, đường edit cũ chỉ còn redirect cho Partners.

3. Solving 1.1 — xác nhận phạm vi ảnh hưởng/import
   - Thought: Cần đảm bảo import/type mới không làm vỡ chỗ khác.
   - Action:
     - Cập nhật các import `GalleryStyle/GalleryPreview` chỉ còn dùng cho Gallery.
     - Thêm import mới `PartnersPreview` + `PartnersStyle` ở `create/gallery` và `partners/[id]/edit`.
   - Reflection: ✓ Phạm vi thay đổi gói gọn trong admin home-components.

## Lưu ý theo yêu cầu
- Khi implement: **KHÔNG** chạy `bunx oxlint`, `bun run lint`, `bunx tsc --noEmit` và **KHÔNG commit**.
- Không mở rộng hành vi ngoài scope; chỉ tách module theo pattern Hero.

## Checklist xác nhận sau implement
- `/admin/home-components/partners/[id]/edit` hoạt động + preview đủ 6 styles.
- Redirect từ route cũ khi `type === 'Partners'`.
- Create page dùng PartnersPreview đúng style.
- Không còn logic Partners trong `previews.tsx` và edit monolithic.