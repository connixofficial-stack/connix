## Audit Summary
- **Observation:** Spec cũ đúng hướng ở chỗ tách `AR source-of-truth` khỏi dữ liệu khung, nhưng còn hơi rộng và chưa khóa đủ cơ chế tích hợp thực tế với code hiện có.
- **Observation:** Repo đã có contract AR dùng thật ở nhiều nơi: `lib/modules/configs/products.config.ts`, `app/(site)/products/page.tsx`, `components/site/ProductListSection.tsx`, `components/site/ComponentRenderer.tsx`, `components/experiences/previews/ProductDetailPreview.tsx`.
- **Observation:** `app/admin/settings/page.tsx` đang là page settings dạng key/value tổng quát của module `settings`, chưa có pattern sẵn cho một manager CRUD phức tạp nằm trực tiếp trong form save hiện tại.
- **Observation:** `convex/admin/modules.ts:setModuleSetting` hiện chỉ patch giá trị module setting, chưa có hook lifecycle cho trường hợp `defaultImageAspectRatio` đổi.
- **Inference:** Nếu giữ đúng spec cũ theo hướng “nhét nhiều logic vào settings page + cleanup implicit”, lúc implement dễ bị 3 vấn đề: coupling quá chặt với form settings hiện tại, cleanup AR không có điểm chặn rõ ràng, và render overlay bị copy/paste trên nhiều surface.
- **Decision:** Nâng cấp spec theo hướng **3 lớp rõ ràng**: `Products module contract` → `Frame registry + cleanup service` → `Shared overlay renderer`. `/admin/settings` vẫn là nơi thao tác như anh yêu cầu, nhưng UI manager phải là block riêng, không trộn vào save flow hiện tại của settings form.

## Root Cause Confidence
- **High** — vì đã có evidence cụ thể trong repo:
  - `lib/modules/configs/products.config.ts`: AR là source-of-truth thật.
  - `convex/admin/modules.ts`: chưa có lifecycle hook khi module setting đổi.
  - `app/admin/settings/page.tsx`: settings page hiện optimized cho field-based settings, chưa phù hợp để nhét nguyên registry CRUD vào `handleSave` hiện có.
  - `components/site/ProductListSection.tsx`, `components/site/ComponentRenderer.tsx`, `app/(site)/products/page.tsx`: nhiều nơi render box ảnh sản phẩm, cần shared wrapper để tránh lệch.
  - `components/experiences/previews/ProductDetailPreview.tsx`: preview đã có logic frame layout nội bộ, nên cần phân biệt rõ “frame layout của preview” với “product marketing frame overlay” mới.

## TL;DR kiểu Feynman
- Khung viền sản phẩm nên là **lớp phủ chung**, không sửa ảnh gốc.
- AR trong module Products là “kích thước chuẩn”; khung nào khác chuẩn đó thì bị xóa.
- Admin vẫn quản lý ở `/admin/settings`, nhưng phần này nên là **manager riêng** chứ không trộn vào form settings hiện tại.
- Hệ thống cần 3 loại khung đầu tiên: upload overlay, line-border generator, logo-based custom.
- Mọi chỗ hiển thị ảnh sản phẩm phải dùng **1 wrapper chung** để khung luôn giống nhau.
- Khi đổi AR ở `/system/modules/products`, phải cleanup registry ngay tại backend mutation/hook, không chờ UI tự xử lý.

## Elaboration & Self-Explanation
Spec cũ đúng ở ý tưởng sản phẩm, nhưng chưa đủ “sát repo” ở chỗ điểm chèn logic. Hiện tại `/admin/settings` là một màn hình lưu các field của module `settings`. Nếu mình nhét luôn danh sách frame, upload, preset clone, xóa, active, line generator, logo generator vào chung `handleSave`, code sẽ rất dễ rối vì lifecycle của frame không giống lifecycle của key/value settings.

Vì vậy cách an toàn hơn là: `/admin/settings` chỉ là **vỏ chứa**. Bên trong nó có một `ProductFrameManager` độc lập, tự gọi query/mutation riêng của frame registry. Như vậy vẫn đúng yêu cầu “admin sửa ở /admin/settings”, nhưng kiến trúc sạch hơn và rollback dễ hơn.

Điểm quan trọng thứ hai là cleanup theo AR. Nếu chỉ dựa vào frontend phát hiện AR đổi rồi xóa frame lệch, sẽ có rủi ro dữ liệu bẩn khi admin khác đổi AR, hoặc khi mutation được gọi từ nơi khác. Do đó cleanup phải bám vào backend tại điểm update `defaultImageAspectRatio`.

Điểm thứ ba là render. Vì repo đã có nhiều nơi tự dựng `div.relative + aspectRatio style`, nếu sửa từng nơi thủ công thì rất dễ sót. Ta nên tạo một wrapper chung kiểu `ProductImageFrameBox` hoặc `ProductImageWithFrame`, nhận `aspectRatio`, `frameConfig`, `children/image`, rồi dùng lại ở site + preview + home-components. Như vậy toàn hệ thống đồng bộ hơn.

## Concrete Examples & Analogies
- **Ví dụ 1:** Products module đang để AR = `square`. Admin vào `/admin/settings`, chọn preset `noel-square`, active. Tất cả list sản phẩm, detail, related, home-components đều hiện chung khung Noel.
- **Ví dụ 2:** Admin tạo khung line Tết từ 1 cấu hình line đỏ-vàng. Hệ thống render 4 cạnh bằng CSS/SVG nên không cần upload 4 file riêng.
- **Ví dụ 3:** Sau đó system đổi AR từ `square` sang `portrait`. Mutation backend tự xóa frame `square`, clear `activeProductFrameId`, UI về empty state để admin chọn khung mới đúng AR.
- **Analogy:** AR giống như size áo. Registry frame là kho quần áo theo size. Khi đổi từ size M sang L thì đồ size M không nên giữ ở trạng thái đang mặc nữa; backend phải dọn ngay, không chờ người dùng tự nhớ.

```mermaid
flowchart TD
  A[/system/modules/products/] --> B[setModuleSetting]
  B --> C{settingKey = AR?}
  C -- no --> D[Patch setting only]
  C -- yes --> E[Patch AR]
  E --> F[Cleanup mismatched frames]
  F --> G[Reset active frame if invalid]
  G --> H[UI empty state / pick new frame]

  I[/admin/settings/] --> J[ProductFrameManager]
  J --> K[Frame registry CRUD]
  K --> L[Shared resolver]
  L --> M[ProductImageFrameBox]
  M --> N[/products]
  M --> O[product detail]
  M --> P[home-components]
  M --> Q[preview]
```

## Nâng cấp quan trọng so với spec cũ
1. **Không trộn frame CRUD vào generic settings save flow**
   - `/admin/settings` chỉ host manager riêng.
   - Tránh làm `handleSave()` hiện tại phình to và khó kiểm soát side effects.

2. **Cleanup AR phải nằm ở backend path đổi module setting**
   - Cụ thể: mở rộng `convex/admin/modules.ts:setModuleSetting` hoặc tách helper server-side được gọi từ đây.
   - Không để cleanup phụ thuộc frontend.

3. **Tách rõ “preview layout frame” và “marketing frame overlay”**
   - File preview hiện có `getProductImageFrameConfig(...)` để điều khiển layout khung hiển thị ảnh.
   - Tính năng mới là overlay trang trí/branding, không nên trộn semantics với layout frame cũ.

4. **Shared overlay wrapper là bắt buộc**
   - Nếu không, `ProductListSection`, `ComponentRenderer`, `/products`, product detail sẽ dễ lệch behavior.

5. **Preset library nên seed theo AR, không phải seed chung một cục**
   - Ví dụ: `noel-square`, `noel-portrait`, `tet-square`.
   - Khi AR đổi, chỉ surface preset đúng AR được giữ/hiện.

## Đối chiếu SaaS / pattern quốc tế
### Observation
- Các SaaS ecommerce quốc tế thường đi theo 4 pattern mạnh:
  1. Non-destructive overlay.
  2. Seasonal preset library.
  3. Brand/custom asset composition.
  4. One-source render contract cho mọi storefront surfaces.

### Inference
- Repo này nên ưu tiên runtime overlay + config registry thay vì bake ảnh.
- `line border` và `logo-based frame` nên là generator config, không phụ thuộc hoàn toàn vào raster.

### Decision
- Phase triển khai sẽ giữ 3 source type đầu tiên:
  - `uploaded_overlay`
  - `line_generator`
  - `logo_generator`
- Chưa làm AI generate hoặc scheduler theo ngày ở phase này.

## Đề xuất kiến trúc triển khai
### 1) Contract mới ở Products module
Thêm các `moduleSettings` cho `products`:
- `enableProductFrames: boolean`
- `activeProductFrameId: string | null`
- `productFrameMode: 'preset' | 'custom' | 'mixed'`
- `productFrameCleanupOnArChange: boolean` mặc định `true`
- `productFrameOverlayFit: 'contain' | 'cover'`

Ghi chú: **không** lưu danh sách frame ở `settings`; chỉ lưu global switches và active pointer ở `moduleSettings`.

### 2) Registry dữ liệu riêng
Thêm table `productImageFrames` trong `convex/schema.ts`.

Đề xuất shape tối thiểu:
- `name`, `slug`, `status`
- `aspectRatio`
- `sourceType: 'system_preset' | 'uploaded_overlay' | 'line_generator' | 'logo_generator'`
- `overlayImageUrl?`, `overlayStorageId?`
- `lineConfig?`
- `logoConfig?`
- `seasonKey?`
- `isSystemPreset`, `isDeleted`
- `createdBy`, `updatedBy`
- `metadata`

Indexes ưu tiên:
- `by_aspect_ratio`
- `by_aspect_ratio_status`
- `by_source_type`
- `by_season_key`

### 3) Cleanup contract khi AR đổi
Nâng cấp server path cập nhật module setting:
- Khi `moduleKey === 'products'` và `settingKey === 'defaultImageAspectRatio'`:
  - patch AR mới
  - query toàn bộ frame mismatch
  - soft delete hoặc hard delete theo rule phase 1
  - nếu `activeProductFrameId` mismatch thì reset về `null`

**Khuyến nghị phase 1:** hard delete cho frame generated/custom mismatch đúng theo yêu cầu anh; system presets có thể seed lại theo AR mới nếu tồn tại.

### 4) Admin UX tại `/admin/settings`
Không sửa pattern tabs hiện tại quá sâu. Thay vào đó thêm 1 block/card riêng phía dưới nội dung settings hoặc trong tab `site`:
- trạng thái bật/tắt product frame
- active frame selector
- danh sách frames theo AR hiện hành
- preset section
- custom upload section
- line generator section
- logo generator section
- cảnh báo cleanup khi AR module đổi

Quyền:
- xem: `hasPermission('products', 'view')`
- sửa/tạo/xóa/active: `hasPermission('products', 'edit')`

### 5) Shared runtime resolver + wrapper
Thêm shared module kiểu:
- `lib/products/product-frame.ts`
- `components/shared/ProductImageFrameBox.tsx`

Responsibilities:
- resolve AR hiện hành
- resolve active frame hợp lệ
- render overlay image / line / logo config
- thống nhất className, `pointer-events-none`, z-index, radius behavior

### 6) Surface áp dụng phase 1
Ưu tiên đúng scope ảnh sản phẩm đang có evidence:
- `app/(site)/products/page.tsx`
- `app/(site)/products/[slug]/page.tsx`
- `components/site/ProductListSection.tsx`
- `components/site/ComponentRenderer.tsx`
- `components/experiences/previews/ProductDetailPreview.tsx`
- các preview product-list / category-products nếu đang render ảnh sản phẩm trực tiếp

### 7) Line-border generator
Spec refined cho mode này:
- input:
  - `strokeWidth`
  - `inset`
  - `radiusMode`
  - `color` hoặc `gradient`
  - `cornerStyle: sharp | rounded | ornamental-light`
  - `shadow`
- render:
  - ưu tiên SVG overlay để scale tốt cho vuông/chữ nhật
  - fallback CSS border nếu config đơn giản

Lý do chọn SVG: dễ làm 1 cấu hình line → 4 cạnh + góc, ít artifact hơn border CSS khi cần effect.

## Files Impacted
### Shared / data
- **Thêm:** `lib/products/product-frame.ts`  
  Vai trò hiện tại: chưa có domain cho khung overlay.  
  Thay đổi: type, validator, resolver helpers, source type, preset keys.

- **Thêm:** `convex/productImageFrames.ts`  
  Vai trò hiện tại: chưa có registry CRUD cho frame.  
  Thay đổi: list theo AR, create/update/delete, activate, clone preset, cleanup helpers.

- **Sửa:** `convex/schema.ts`  
  Vai trò hiện tại: chưa có table frame sản phẩm.  
  Thay đổi: thêm `productImageFrames` + indexes.

- **Sửa:** `convex/admin/modules.ts`  
  Vai trò hiện tại: set module setting dạng generic, chưa có lifecycle AR change.  
  Thay đổi: thêm nhánh cleanup khi đổi `products.defaultImageAspectRatio` và reset active frame nếu cần.

- **Sửa:** `lib/modules/configs/products.config.ts`  
  Vai trò hiện tại: source-of-truth AR và product module settings.  
  Thay đổi: thêm các module setting bật/tắt/active/mode cho product frames.

### Admin
- **Sửa:** `app/admin/settings/page.tsx`  
  Vai trò hiện tại: form settings key/value tổng quát.  
  Thay đổi: gắn `ProductFrameManager` như block độc lập trong `/admin/settings`, không trộn vào generic `handleSave`.

- **Thêm:** `app/admin/settings/_components/ProductFrameManager.tsx`  
  Vai trò hiện tại: chưa có UI quản trị khung.  
  Thay đổi: preset/custom CRUD, activate, upload, line/logo generator.

- **Có thể sửa:** `app/admin/components/SettingsImageUploader.tsx` hoặc tạo wrapper riêng  
  Vai trò hiện tại: uploader settings cơ bản.  
  Thay đổi: nếu cần, bổ sung preview theo AR hoặc multi-asset cho logo/frame.

### Runtime / preview
- **Thêm:** `components/shared/ProductImageFrameBox.tsx`  
  Vai trò hiện tại: chưa có wrapper overlay dùng chung.  
  Thay đổi: render image container + overlay thống nhất.

- **Sửa:** `app/(site)/products/page.tsx`  
  Vai trò hiện tại: render list/grid ảnh sản phẩm.  
  Thay đổi: dùng wrapper chung để phủ khung.

- **Sửa:** `app/(site)/products/[slug]/page.tsx`  
  Vai trò hiện tại: render ảnh chính/related.  
  Thay đổi: phủ khung đồng bộ.

- **Sửa:** `components/site/ProductListSection.tsx`  
  Vai trò hiện tại: nhiều biến thể list section đang tự xử lý box ảnh.  
  Thay đổi: gom qua wrapper chung.

- **Sửa:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: render nhiều block có ảnh sản phẩm.  
  Thay đổi: apply wrapper chung ở các surface products liên quan.

- **Sửa:** `components/experiences/previews/ProductDetailPreview.tsx`  
  Vai trò hiện tại: preview dùng frame config cho layout.  
  Thay đổi: bổ sung marketing frame overlay như lớp riêng, không thay semantics của layout frame cũ.

## Execution Preview
1. Đọc lại các surface render ảnh sản phẩm để xác định wrapper insertion points.
2. Định nghĩa domain `product frame` và schema Convex.
3. Tạo CRUD + cleanup helpers cho registry.
4. Mở rộng `setModuleSetting` để cleanup mismatch khi AR đổi.
5. Thêm module settings cho product frames trong products config.
6. Tạo `ProductFrameManager` và gắn vào `/admin/settings`.
7. Tạo shared wrapper `ProductImageFrameBox`.
8. Áp wrapper lên site pages + home-components + preview.
9. Static review typings/null-safety và chuẩn bị commit.

## Acceptance Criteria
- Admin quản lý khung trong `/admin/settings` đúng như yêu cầu.
- Quyền sửa kế thừa module `products`, không phát sinh role model mới.
- Frame active chỉ render khi cùng AR với `products.defaultImageAspectRatio`.
- Đổi AR ở `/system/modules/products` sẽ xóa frame mismatch và reset active frame nếu cần.
- Có preset mùa vụ cơ bản + tạo custom overlay + line generator + logo-based frame.
- Tất cả surface ảnh sản phẩm dùng cùng shared render contract, không lệch giữa site và preview.

## Verification Plan
- Static review: type, null-safety, fallback state, backward compatibility với data cũ.
- Typecheck sau khi code xong: `bunx tsc --noEmit`.
- Repro thủ công:
  1. Tạo frame overlay đúng AR, activate, kiểm tra site + preview.
  2. Tạo line-border, kiểm tra vuông và chữ nhật.
  3. Tạo logo-based frame, lưu lại và kích hoạt.
  4. Đổi AR ở system products, xác nhận cleanup + reset active.
  5. Kiểm tra user có `products.view` và `products.edit`.

## Out of Scope
- AI generate frame từ prompt.
- Per-product frame riêng cho từng sản phẩm.
- Tự động schedule theo ngày lễ.
- Render bake ảnh mới vào storage.

## Risk / Rollback
- **Risk chính:** phạm vi rộng vì có nhiều surface ảnh sản phẩm.
- **Mitigation:** dùng wrapper chung + manager độc lập + backend cleanup hook.
- **Rollback:** tắt `enableProductFrames`; nếu cần thì revert table/mutations mới.

## Open Questions
- Em đang nghiêng về **hard delete mismatch frames** cho custom/generated records đúng theo yêu cầu anh; còn system preset library sẽ được coi là seed source theo từng AR, không giữ record active mismatch. Nếu anh muốn, phase sau có thể thêm `archive` thay vì xóa cứng.

Nếu anh duyệt spec nâng cấp này, em sẽ implement theo hướng trên thay vì spec cũ trong `.factory/docs`.