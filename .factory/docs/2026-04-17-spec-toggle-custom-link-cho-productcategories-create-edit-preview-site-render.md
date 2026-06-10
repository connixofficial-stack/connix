## TL;DR kiểu Feynman
- Hiện tại mỗi danh mục luôn link theo mặc định `/products?category={slug}` nên không có chỗ nhập link riêng.
- Sẽ thêm 1 toggle **"Custom link"** trong **Cấu hình hiển thị** cho từng item danh mục.
- Khi bật toggle: hiện khối chỉnh link, gồm 2 gợi ý nhanh: **Combobox sản phẩm** (tạo `/products/{slug}`) hoặc **Link bất kỳ** (nhập URL).
- Nếu bật custom mà để trống link thì **không cho lưu** (validate lỗi).
- Màu phân biệt link chỉ hiển thị trong form admin: **mặc định xanh dương**, **custom vàng**.
- Thay đổi áp dụng đồng bộ: **create + edit + preview + site render**.

## Audit Summary
### Observation
- Form ProductCategories hiện chỉ chọn `categoryId` + ảnh (`customImage`, `imageMode`), chưa có field link custom.  
  Evidence: `app/admin/home-components/product-categories/_types/index.ts`, `ProductCategoriesForm.tsx`.
- Create/Edit hiện serialize `config.categories` chỉ gồm `categoryId/customImage/imageMode`.  
  Evidence: `app/admin/home-components/create/product-categories/page.tsx`, `app/admin/home-components/product-categories/[id]/edit/page.tsx`.
- Site render đang hardcode link danh mục theo slug category (`/products?category=${cat.slug}`).  
  Evidence: `components/site/ComponentRenderer.tsx` (ProductCategoriesSection).
- Preview admin chưa render link đích theo per-item; chủ yếu là block preview tĩnh theo style.  
  Evidence: `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`.

### Inference
- Root issue không phải bug runtime mà là thiếu schema + thiếu UI control cho custom link per-item.
- Nếu chỉ sửa form mà không sửa site renderer sẽ lệch hành vi giữa admin và site.

### Decision
- Mở rộng `CategoryConfigItem` để chứa cấu hình link (mode + value + metadata nguồn gợi ý), sau đó nối xuyên suốt create/edit/preview/site render.
- Giữ backward compatibility: bản ghi cũ không có custom link vẫn chạy link mặc định.

## Root Cause Confidence
**High** — vì đã xác định đủ 4 điểm bắt buộc:
1) Triệu chứng: không có custom link, luôn về danh mục mặc định.  
2) Repro: vào create/edit ProductCategories, không thấy trường link và site luôn dùng slug category.  
3) Giả thuyết thay thế: lỗi do route/site config ngoài component đã bị loại trừ vì render link hardcode trực tiếp trong ProductCategoriesSection.  
4) Pass/fail: có toggle + link custom lưu/đọc được + site đi đúng URL custom.

## Mermaid (data flow)
```mermaid
flowchart LR
  A[Admin Form] --> B[Config categories[]]
  B --> C[Convex homeComponents]
  C --> D[Site ComponentRenderer]
  D --> E[Anchor href]
  A --> P[Preview]
```
<!-- Legend: categories[] sẽ chứa linkMode/linkValue/sourceProductId -->

## Files Impacted
### UI (admin)
- **Sửa:** `app/admin/home-components/product-categories/_types/index.ts`  
  Vai trò hiện tại: định nghĩa kiểu config item và config component.  
  Thay đổi: thêm field link như `linkMode: 'default'|'custom'`, `customLinkType?: 'product'|'external'`, `customLinkValue?: string`, `sourceProductId?: string`.

- **Sửa:** `app/admin/home-components/product-categories/_components/ProductCategoriesForm.tsx`  
  Vai trò hiện tại: form dùng chung cho edit, quản lý danh mục/ảnh.  
  Thay đổi: thêm toggle “Custom link” trong khối Cấu hình hiển thị (áp dụng trong form item), thêm combobox searchable chọn sản phẩm + input link bất kỳ + badge màu trạng thái link (xanh/vàng trong admin).

- **Sửa:** `app/admin/home-components/create/product-categories/page.tsx`  
  Vai trò hiện tại: create page và submit config.  
  Thay đổi: mở rộng state/submit payload cho fields link mới + validate trước submit (bật custom mà rỗng => chặn lưu, toast lỗi).

- **Sửa:** `app/admin/home-components/product-categories/[id]/edit/page.tsx`  
  Vai trò hiện tại: load config, edit, update component.  
  Thay đổi: parse dữ liệu link cũ/mới, serialize payload link mới, validate tương tự create.

- **Sửa:** `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx`  
  Vai trò hiện tại: preview style hiển thị danh mục trong admin.  
  Thay đổi: resolve `href` theo default/custom để preview đúng hành vi (không đổi màu theo yêu cầu, vì màu chỉ admin form).

### Site render
- **Sửa:** `components/site/ComponentRenderer.tsx` (khối `ProductCategoriesSection`)  
  Vai trò hiện tại: render link danh mục hardcode theo slug category.  
  Thay đổi: ưu tiên link custom nếu `linkMode=custom` và hợp lệ, fallback link mặc định nếu không custom/không hợp lệ dữ liệu cũ.

## Execution Preview
1. Đọc pattern combobox searchable đang có sẵn trong repo (ưu tiên component tái sử dụng, không thêm lib mới).  
2. Mở rộng type `CategoryConfigItem` cho cấu hình link.  
3. Cập nhật UI form: toggle + quick options (combobox sản phẩm / link bất kỳ) + hiển thị trạng thái màu ở admin.  
4. Nối create/edit payload + parse initial data + validate bắt buộc khi custom link bật.  
5. Cập nhật preview và site renderer resolve `href` theo config mới.  
6. Static self-review: typing/null-safety/backward compatibility.

## Acceptance Criteria
- Tại create + edit ProductCategories, mỗi item danh mục có thể bật/tắt custom link.
- Khi custom link bật:
  - Chọn sản phẩm từ combobox => lưu ra URL `/products/{slug}`.
  - Hoặc nhập link bất kỳ => lưu đúng giá trị.
  - Nếu để trống => hiện lỗi validate và không cho lưu.
- Màu trạng thái link trong **form admin**:
  - Link mặc định: xanh dương.
  - Link custom khác mặc định: vàng.
- Preview admin và site render đi đúng link đã cấu hình.
- Dữ liệu cũ chưa có fields mới vẫn hoạt động bình thường với link mặc định.

## Verification Plan
- **Typecheck:** `bunx tsc --noEmit` (sau khi implement code TS).
- **Repro thủ công (tester):**
  1) Tạo mới component, bật custom, chọn sản phẩm, lưu, kiểm tra site click ra `/products/{slug}`.  
  2) Edit component cũ (không custom), xác nhận vẫn đi link mặc định.  
  3) Bật custom nhưng để trống, xác nhận không lưu được.  
  4) Nhập external URL, lưu, click ra đúng URL.

## Out of Scope
- Không đổi palette màu link ở preview/site (theo yêu cầu chỉ hiển thị màu trong form admin).
- Không thay đổi UX các home-component khác.
- Không thêm analytics tracking cho click link.

## Risk / Rollback
- Risk chính: dữ liệu cũ thiếu field mới -> giải bằng fallback mặc định tại parser + renderer.
- Rollback nhanh: revert các file đã sửa về version trước, vì thay đổi cô lập trong ProductCategories flow.