## Audit Summary
- **Observation:** Hệ thống hiện đã có source-of-truth AR ở `products` module, upload settings dùng `SettingsImageUploader`, RBAC admin đang đi qua `hasPermission(moduleKey, action)` và page `/admin/settings` đang là nơi hợp lý để admin upload asset hệ thống.
- **Observation:** Các surface ảnh sản phẩm đã được kéo về dùng AR module ở phase trước (`/products`, product detail, related products, home-components, preview). Đây là nền tốt để gắn frame overlay đồng bộ.
- **Observation:** Convex `settings` đang lưu key/value linh hoạt, phù hợp cho metadata nhẹ; nhưng danh sách khung có vòng đời, preset, version, AR, asset URLs, generator input và cleanup theo AR thì **không nên** nhét hết vào một setting blob.
- **Inference:** Nếu làm “khung viền sản phẩm” mạnh như anh mô tả, cần tách thành 2 lớp: **global contract ở products module** + **registry dữ liệu khung** riêng có lifecycle gắn với AR.
- **Decision:** Đề xuất tạo một **frame registry** riêng, cấu hình chọn/ưu tiên khung ở `/admin/settings`, render overlay trên toàn bộ ảnh sản phẩm, và khi AR hệ thống đổi thì tự **xóa các frame lệch AR** như anh đã chốt.

## Root Cause Confidence
- **High** — vì có đủ evidence trong repo:
  - `lib/modules/configs/products.config.ts`: đã là source-of-truth của AR sản phẩm.
  - `app/admin/settings/page.tsx` + `app/admin/components/SettingsImageUploader.tsx`: có sẵn entry point upload asset trong admin settings.
  - `app/admin/auth/context.tsx`: đã có `hasPermission(moduleKey, action)` để kế thừa quyền `products`.
  - `convex/settings.ts` + `convex/schema.ts`: setting phù hợp cho config nhỏ, chưa phù hợp cho danh sách frame lifecycle phức tạp.
  - Các runtime surfaces đã đồng bộ AR nên có thể gắn overlay theo cùng contract.

## TL;DR kiểu Feynman
- Ta sẽ coi “khung viền sản phẩm” là một lớp phủ nằm trên ảnh sản phẩm, luôn bám theo AR hiện tại của module Products.
- Admin quản lý khung ở `/admin/settings`, nhưng quyền sẽ **kế thừa module products** như anh yêu cầu.
- Khung có thể đến từ preset hệ thống hoặc custom full ngay: upload PNG/WebP khung, logo, asset phụ, hoặc cấu hình line-border 1 line thành 4 cạnh.
- Nếu AR trong `/system/modules/products` đổi, mọi khung không cùng AR sẽ bị **xóa** để tránh sai khung.
- Toàn bộ product images trên site và preview sẽ dùng cùng resolver: ảnh trước, khung sau, cùng một frame box.

## Elaboration & Self-Explanation
Bài toán này không chỉ là “thêm 1 ảnh phủ lên trên ảnh sản phẩm”. Nó là một hệ thống mini gồm: dữ liệu khung, quyền ai được sửa, chỗ nào admin upload, chỗ nào site render, và cách dọn dữ liệu khi AR đổi. Nếu không tách rõ, sau này rất dễ rối: khung vuông bị dùng cho ảnh 3:2, home-component hiện khác product detail, hoặc preset lễ tết ghi đè lung tung.

Cách an toàn là xem khung như một “theme layer” của ảnh sản phẩm. Module Products vẫn giữ quyền quyết định **khung hình**. Registry khung chỉ chứa những khung hợp lệ cho đúng AR đó. Admin settings là chỗ thao tác vì nó gần concept “asset/cấu hình hệ thống”, còn quyền thì vẫn check `products.edit`/`products.create` để không tạo thêm role phức tạp ngoài yêu cầu.

Với “line border”, ta không chỉ cho upload PNG có sẵn mà còn hỗ trợ một mode vector/config-based: nhập 1 line asset hoặc style, hệ thống generate 4 cạnh + 4 góc theo khung vuông/chữ nhật. Cách này giống nhiều SaaS quốc tế: họ không lưu mọi khung như ảnh raster duy nhất, mà có lớp cấu hình để tái sử dụng, scale tốt, và giữ nét khi AR đổi trong cùng nhóm.

## Concrete Examples & Analogies
- **Ví dụ 1:** AR hiện tại của products module là `3:2`. Admin chọn preset Noel hoặc upload custom khung PNG đúng `3:2`. Toàn bộ `/products`, related products, product detail, home-components đều thấy cùng overlay Noel.
- **Ví dụ 2:** Admin tạo “line frame” màu đỏ vàng cho Tết. Chỉ cần 1 cấu hình line (độ dày, inset, corner style, màu, glow nhẹ), hệ thống render thành 4 cạnh trên đúng khung `4:5` hoặc `3:2` mà không cần 4 file ảnh riêng.
- **Ví dụ 3:** AR products module đổi từ `1:1` sang `4:5`. Các frame `1:1` bị cleanup khỏi registry active, vì nếu giữ sẽ lệch frame box và gây sai layout.
- **Analogy:** Ảnh sản phẩm là tấm hình trong khung tranh. Module Products quyết định kích cỡ khung tranh. Registry frame là kho các mẫu khung hợp đúng kích cỡ đó. Đổi kích cỡ tranh thì khung cũ không vừa nữa, nên phải bỏ đi.

```mermaid
flowchart TD
  A[/system/modules/products AR/] --> B[Frame Registry]
  B --> C[/admin/settings Frame Manager/]
  B --> D[Frame Resolver]
  D --> E[/products]
  D --> F[product detail]
  D --> G[related]
  D --> H[home-components]
  C --> I{Custom type}
  I -->|overlay| J[PNG/WebP frame]
  I -->|line| K[4-edge generator]
  I -->|logo| L[logo-based frame]
  A --> M{AR changed?}
  M -->|yes| N[Delete mismatched frames]
```

## Đối chiếu pattern SaaS lớn
### Observation
- Shopify/BigCommerce ecosystem phổ biến theo hướng **badge / label / overlay / watermark** với các điểm chung:
  1. Preset seasonal templates.
  2. Custom branded overlays.
  3. Rule-based apply trên nhiều surfaces.
  4. Không phá ảnh gốc, chỉ phủ layer render-time.
- Các app phổ biến thiên về **overlay không-destructive**, có preset sự kiện và branded assets.

### Inference
- Dự án này nên đi theo hướng **render-time overlay + registry config**, không bake trực tiếp vào ảnh gốc.
- “Full custom ngay” vẫn khả thi nếu chia object model đúng ngay từ đầu: preset, uploaded assets, line generator, logo-driven generator đều chỉ là các `frame variants` khác nhau.

### Decision
- Chọn kiến trúc “frame registry + resolver + render overlay runtime”, không sửa ảnh gốc, không lưu biến thể raster per-product.

## Đề xuất kiến trúc
### 1) Global contract tại Products module
Thêm vào `products` module settings:
- `enableProductFrame`: bật/tắt hệ thống khung viền.
- `productFrameMode`: `none | preset | custom | mixed`.
- `activeProductFrameId`: frame đang active toàn hệ thống.
- `productFrameCleanupOnArChange`: mặc định `true`.
- `productFrameOverlayFit`: `contain | cover` cho cách khung ôm box.

### 2) Frame registry riêng
Tạo bảng mới, ví dụ `productImageFrames` trong Convex:
- `name`, `slug`, `status`, `sourceType` (`system_preset | uploaded_overlay | line_generator | logo_generator`)
- `aspectRatio`
- `overlayImageUrl`, `overlayStorageId`
- `lineConfig` (thickness, inset, color, radius, shadow, corner treatment)
- `logoConfig` (logo url, anchor, scale, opacity, repeat/4-corner)
- `seasonKey` (`tet-duong-lich`, `tet-am-lich`, `noel`, `11-11`, `12-12`, ...)
- `isDefaultPreset`, `isSystemPreset`, `createdBy`, `updatedBy`
- `metadata` để chứa generator params mở rộng

Lý do: setting blob sẽ nhanh đụng trần quản lý vòng đời, lọc theo AR, preset/system/custom, cleanup và audit.

### 3) Admin UX tại /admin/settings
Thêm tab/card mới trong `/admin/settings`, ví dụ nhóm `product_frame`:
- Bật/tắt khung viền sản phẩm.
- Chọn frame đang active.
- Upload overlay frame file.
- Tạo frame kiểu line-border.
- Tạo frame từ logo/custom assets.
- Danh sách preset hệ thống để clone/sửa.
- Danh sách frame hiện có theo AR hiện hành.
- Khi AR đổi: show cảnh báo sẽ xóa frame lệch AR.

### 4) Quyền
- Không tạo role mới.
- Dùng `hasPermission('products', 'edit')` cho sửa/chọn/xóa frame.
- Dùng `hasPermission('products', 'view')` cho xem danh sách frame.
- Nếu user không có quyền thì card frame ở `/admin/settings` thành read-only hoặc ẩn.

### 5) Render contract
Tạo resolver shared, ví dụ:
- đọc `enableProductFrame`
- đọc `activeProductFrameId`
- nạp frame hợp lệ cùng `defaultImageAspectRatio`
- trả `frameOverlay` cho mọi UI ảnh sản phẩm

Mọi surface product image render theo cùng pattern:
- container có `position: relative`
- ảnh sản phẩm layer dưới
- frame overlay layer trên `pointer-events-none`
- line frame render bằng CSS/inset absolute hoặc SVG overlay

## Cơ chế line-border từ 1 line thành 4 cạnh
### Option kỹ thuật đề xuất
- `line_generator` không cần 4 file riêng.
- Cho admin cấu hình:
  - `strokeWidth`
  - `inset`
  - `radius`
  - `color` / gradient đơn giản
  - `cornerStyle`: `sharp | rounded | ornament-basic`
  - `shadow/glow`
- Render ra 4 cạnh bằng CSS absolute hoặc SVG `<rect>`/`path>` overlay.

### Vì sao nên làm vậy
- Scale tốt cho cả vuông và chữ nhật.
- Không phụ thuộc raster fixed-size.
- Dễ hỗ trợ “1 line là viền 4 khung” đúng như anh muốn.

## Vòng đời dữ liệu khi AR đổi
### Rule chốt theo yêu cầu anh
- Nếu `products.defaultImageAspectRatio` đổi:
  - cleanup tất cả frame có `aspectRatio !== currentAR`
  - clear `activeProductFrameId` nếu frame active bị xóa
  - giữ lại system presets cùng AR mới nếu có seed sẵn
  - hiển thị empty state để admin tạo/chọn khung mới

### Lưu ý
- Với preset hệ thống, “xóa” ở đây nên hiểu là xóa instance/custom/generated record lệch AR; system preset library có thể được seed lại theo AR mới nếu tồn tại bộ preset tương ứng.
- Nếu muốn cleanup cứng toàn bộ record mismatch, cần nói rõ là bao gồm cả preset đã clone.

## Files Impacted
### Shared / data model
- **Thêm:** `lib/products/product-frame.ts`  
  Vai trò hiện tại: chưa có contract frame chung.  
  Thay đổi: type/frame source/season preset keys/helper validate AR/resolver metadata.

- **Thêm:** `convex/productImageFrames.ts`  
  Vai trò hiện tại: chưa có query/mutation cho registry khung.  
  Thay đổi: CRUD frame, list theo AR, set active, clone preset, cleanup mismatch khi AR đổi.

- **Sửa:** `convex/schema.ts`  
  Vai trò hiện tại: chưa có bảng khung ảnh sản phẩm.  
  Thay đổi: thêm table `productImageFrames` + indexes theo `aspectRatio`, `status`, `seasonKey`, `isSystemPreset`.

- **Sửa:** `lib/modules/configs/products.config.ts`  
  Vai trò hiện tại: chứa source-of-truth AR và config ảnh sản phẩm.  
  Thay đổi: thêm settings bật/tắt frame, frame mode, active frame id, cleanup behavior.

### Admin settings / permissions
- **Sửa:** `app/admin/settings/page.tsx`  
  Vai trò hiện tại: quản trị settings chung và upload assets settings.  
  Thay đổi: thêm card/tab Product Frame Manager, chỉ editable khi có quyền `products.edit`.

- **Thêm:** `app/admin/settings/_components/ProductFrameManager.tsx`  
  Vai trò hiện tại: chưa có UI quản trị frame.  
  Thay đổi: list preset/custom, upload overlay, tạo line frame, tạo logo frame, activate/delete/clone.

- **Sửa:** `app/admin/auth/context.tsx` hoặc nơi dùng hiện tại  
  Vai trò hiện tại: có `hasPermission`.  
  Thay đổi: chỉ wiring dùng quyền `products` tại settings UI, không đổi core permission model.

- **Có thể thêm:** `app/admin/components/SettingsImageUploader.tsx` hoặc wrapper mới  
  Vai trò hiện tại: upload ảnh settings cơ bản.  
  Thay đổi: nếu cần, thêm preview theo AR + overlay-safe upload + logo asset upload nhiều loại.

### Runtime render
- **Sửa:** `app/(site)/products/page.tsx`  
  Vai trò hiện tại: render list/grid/catalog product images.  
  Thay đổi: phủ frame overlay trên mọi card ảnh sản phẩm.

- **Sửa:** `app/(site)/products/[slug]/page.tsx`  
  Vai trò hiện tại: render ảnh chính, related products.  
  Thay đổi: phủ frame cho main image, thumbnails nếu cần, related products.

- **Sửa:** `components/site/ProductListSection.tsx`  
  Vai trò hiện tại: runtime home-components product list/grid.  
  Thay đổi: dùng shared resolver để phủ frame đồng bộ.

- **Sửa:** `components/site/ComponentRenderer.tsx`  
  Vai trò hiện tại: render nhiều product/category home sections.  
  Thay đổi: apply frame overlay ở các section có ảnh sản phẩm.

### Preview / system experiences
- **Sửa:** `components/experiences/previews/ProductDetailPreview.tsx`  
  Vai trò hiện tại: preview product detail.  
  Thay đổi: render frame overlay để preview khớp site.

- **Sửa:** `app/system/experiences/product-detail/page.tsx`  
  Vai trò hiện tại: config product detail experience.  
  Thay đổi: hiển thị trạng thái frame global; có thể cho override on/off ở level experience nếu thật sự cần về sau.

- **Sửa:** `app/admin/home-components/product-list/_components/ProductListPreview.tsx`  
  Vai trò hiện tại: preview product list.  
  Thay đổi: phủ frame overlay.

- **Sửa:** `app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx`  
  Vai trò hiện tại: preview category products.  
  Thay đổi: phủ frame overlay.

## Execution Preview
1. Định nghĩa domain model `productImageFrames` + helper types.
2. Thêm settings control ở products module cho bật/tắt/active frame.
3. Tạo Convex table + queries/mutations cho registry frame.
4. Tạo UI manager trong `/admin/settings` với quyền kế thừa `products`.
5. Seed preset hệ thống theo mùa/sự kiện và cho phép clone/sửa/full custom.
6. Tạo renderer overlay chung (image frame wrapper / resolver).
7. Áp wrapper lên toàn bộ surface ảnh sản phẩm runtime + preview.
8. Thêm hook cleanup khi AR products module đổi để xóa frame mismatch.
9. Static review + typecheck + commit sau khi code hoàn tất.

## Verification Plan
- **Typecheck:** `bunx tsc --noEmit`.
- **Repro thủ công:**
  1. Tạo frame custom PNG đúng AR hiện hành và activate.
  2. Tạo frame line-border và logo-based frame, kiểm tra preview/admin/site.
  3. Kiểm tra toàn bộ ảnh sản phẩm trên `/products`, product detail, related, home-components và preview đều có frame.
  4. Đổi AR ở `/system/modules/products`, xác nhận frame mismatch bị xóa và active frame bị reset nếu không còn hợp lệ.
  5. Đăng nhập bằng user chỉ có `products.view` và user có `products.edit` để xác nhận quyền.
- **Pass/Fail:** pass khi frame overlay đồng bộ toàn hệ thống, admin quản lý được ở `/admin/settings`, cleanup mismatch hoạt động, và quyền kế thừa `products` chạy đúng.

## Acceptance Criteria
- Có hệ thống khung viền sản phẩm gắn chặt với AR source-of-truth của products module.
- Admin quản lý khung trong `/admin/settings`.
- Áp dụng trên toàn bộ ảnh sản phẩm theo yêu cầu anh.
- Hỗ trợ preset seasonal + full custom ngay + custom theo logo.
- Hỗ trợ line-border generator từ 1 cấu hình line thành 4 cạnh cho vuông/chữ nhật.
- Khi AR products đổi, mọi frame lệch AR bị xóa và không render sai.
- Quyền sửa kế thừa từ module `products`.

## Risk / Rollback
- **Risk cao nhất:** scope rộng vì đụng nhiều surface render ảnh sản phẩm và thêm data model mới.
- **Risk phụ:** nếu custom generator quá tham lam, UI manager ở `/admin/settings` có thể phình to.
- **Mitigation:** phase đầu chỉ làm 3 source type chuẩn (`overlay image`, `line generator`, `logo generator`) trên một registry chung; không làm AI generate thật ở backend lúc này.
- **Rollback:** tắt `enableProductFrame` ở products module để vô hiệu hóa runtime ngay; nếu cần thì revert migration/bảng mới sau.

## Out of Scope
- AI sinh frame từ prompt hoàn chỉnh ở server.
- Per-product frame riêng cho từng sản phẩm.
- Auto-schedule frame theo calendar/date rules.
- Generate frame raster hàng loạt vào storage cho từng surface.

## Open Questions
- Với “preset hệ thống”, em đang nghiêng về seed library nội bộ gồm các season/event keys phổ biến, rồi cho admin clone thành bản custom để sửa. Nếu anh muốn, phase sau có thể thêm scheduler auto-active theo ngày lễ.