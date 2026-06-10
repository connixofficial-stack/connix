# I. Primer

## 1. TL;DR kiểu Feynman

- Tính năng **Khung viền sản phẩm** hiện đang làm quá nhiều: nhiều loại frame, CRUD riêng, active frame, table riêng, route riêng.
- Nhu cầu thật là: bật/tắt tính năng và upload **5 ảnh khung PNG/WebP nền trong suốt theo 5 tỷ lệ ảnh sản phẩm** để đè lên ảnh sản phẩm.
- `/system/modules/products` chỉ nên giữ toggle **Bật khung viền sản phẩm**.
- UI upload ảnh khung nên nằm trong `/admin/settings/advanced`, tab **Khung viền sản phẩm**, không cần `/admin/settings/product-frames`.
- Làm thì làm sạch: **bỏ hẳn legacy Product Frames cũ** để hệ thống không bị dơ và không kéo nợ kỹ thuật về sau.
- Khi ảnh sản phẩm và ảnh khung cùng Aspect Ratio (Tỷ lệ khung hình - AR), ví dụ đều `1:1` hoặc đều `16:9`, chỉ cần overlay `absolute inset-0 object-contain` là đủ.

## 2. Elaboration & Self-Explanation

Hiện tại hệ thống đang cố biến admin thành một công cụ thiết kế khung: có khung vẽ bằng line, logo generator, upload overlay, danh sách nhiều frame, chọn active frame và cleanup theo AR. Cách này linh hoạt nhưng quá nặng so với mục tiêu thực tế của shop: designer/admin chỉ cần tạo sẵn một ảnh khung trong Canva/Photoshop, bỏ nền giữa, rồi upload lên website.

Giải pháp tốt hơn là chuyển phần "thiết kế khung" ra ngoài hệ thống, còn hệ thống chỉ làm đúng việc nó cần làm: lưu các URL ảnh khung theo AR, kiểm tra toggle, xác định AR ảnh sản phẩm đang render, rồi render đúng ảnh khung nằm trên ảnh sản phẩm. Đây là hướng KISS/YAGNI, ít code hơn, dễ vận hành hơn, ít điểm lỗi hơn.

Điểm quan trọng: **không cần hệ thống tự sửa AR**. Admin upload sẵn 5 khung tương ứng 5 AR đã có trong sản phẩm: `1:1`, `16:9`, `9:16`, `3:4`, `4:3`. Mỗi nơi render ảnh sản phẩm đang biết AR nào thì lấy đúng khung AR đó. Nếu thiếu ảnh khung cho AR đang dùng thì không overlay hoặc fallback về khung mặc định theo quyết định triển khai.

## 3. Concrete Examples & Analogies

- **Ví dụ bám sát dự án:** Shop muốn chạy campaign Tết. Designer tạo 5 file khung: `frame-tet-1x1.png`, `frame-tet-16x9.png`, `frame-tet-9x16.png`, `frame-tet-3x4.png`, `frame-tet-4x3.png`, giữa trong suốt. Admin vào `/admin/settings/advanced` → tab **Khung viền sản phẩm** → upload từng file đúng tỷ lệ. Nếu ảnh sản phẩm đang dùng `1:1`, card sản phẩm sẽ lấy khung `1:1`; nếu khu vực nào dùng `16:9`, khu vực đó lấy khung `16:9`.
- **Analogy:** Cách cũ giống như bắt website tự đóng khung tranh từ gỗ, sơn, đinh, logo. Cách mới giống như mua sẵn cái khung đẹp, website chỉ việc đặt khung lên ảnh.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Observation (Quan sát)

- `lib/modules/configs/products.config.ts` hiện có 3 setting liên quan frame:
  - `enableProductFrames`
  - `productFrameOverlayFit`
  - `productFrameCleanupOnArChange`
- `app/admin/settings/product-frames/page.tsx` là route riêng cho quản lý khung, có guard theo `enableProductFrames`, rồi render `ProductFrameManager`.
- `app/admin/settings/_components/ProductFrameManager.tsx` là UI lớn để quản lý nhiều frame, active frame, upload overlay, line/logo generator.
- `convex/schema.ts` có table `productImageFrames`.
- `convex/productImageFrames.ts` có CRUD/query riêng cho frame.
- `components/shared/ProductImageFrameBox.tsx` hiện đọc:
  - `moduleSettings.products.enableProductFrames`
  - `moduleSettings.products.activeProductFrameId`
  - `api.productImageFrames.getById`
- `/admin/settings/advanced` đã có pattern upload ảnh qua `SettingsPageShell`, cụ thể field `product_image_placeholder`, lưu vào `settings` table kèm storage id suffix `__storageId`.

## 2. Inference (Suy luận)

- Hệ thống hiện tại phức tạp vì đang model hóa "nhiều khung + nhiều kiểu tạo khung", trong khi nhu cầu hiện tại là "5 ảnh overlay theo 5 AR cố định".
- `settings` table phù hợp hơn `productImageFrames` cho flow mới vì đây là cấu hình global theo key cố định, giống `product_image_placeholder`, không cần CRUD frame.
- Nếu chỉ ẩn legacy mà không xóa, codebase vẫn còn 2 hệ thống frame song song. Điều này dễ gây nhầm lẫn, khó maintain, và trái mục tiêu làm sạch hệ thống.

## 3. Decision (Quyết định)

- Triển khai theo hướng **Simple Overlay**:
  - Products module chỉ bật/tắt.
  - Advanced settings quản lý 5 ảnh overlay theo AR: `1:1`, `16:9`, `9:16`, `3:4`, `4:3`.
  - Renderer dùng ảnh overlay đúng AR từ `settings`.
  - Route manager cũ bị xóa/redirect dứt điểm.
  - Legacy table/function/type/UI bị gỡ khỏi codebase sau khi thay bằng flow mới.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Evidence chính:

- `ProductFrameManager` xử lý nhiều nhánh UX và nhiều loại source (`uploaded_overlay`, `line_generator`, `logo_generator`) trong khi yêu cầu thực tế chỉ cần upload 5 ảnh khung theo 5 AR cố định.
- `productImageFrames` là table riêng cho nhiều record, nhưng bài toán mới chỉ cần các setting global cố định theo AR.
- `SettingsPageShell` đã có cơ chế upload/lưu ảnh settings nên không cần tạo thêm domain quản lý riêng.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- **Giả thuyết:** Nên giữ manager cũ vì admin có thể cần nhiều frame theo mùa.
- **Đánh giá:** Chưa đủ evidence từ nhu cầu hiện tại. Nếu làm tiếp manager nhiều frame sẽ tiếp tục tăng độ phức tạp. 5 key overlay theo AR đã đủ cho bài toán khung khớp ảnh; seasonal frame nếu cần sau này chỉ thay ảnh trong 5 key này.

## 3. Audit Protocol Questions (Câu hỏi audit bắt buộc)

1. **Triệu chứng expected vs actual:** Expected là cấu hình khung đơn giản; actual là UI nhiều mode/table/route riêng.
2. **Phạm vi ảnh hưởng:** Products module config, admin settings, sidebar, Convex settings/moduleSettings, storefront/admin preview render ảnh sản phẩm.
3. **Tái hiện:** Vào `/system/modules/products` thấy nhiều setting frame; bật frame sẽ lộ route `/admin/settings/product-frames` với manager phức tạp.
4. **Dữ liệu thiếu:** Chưa kiểm tra dữ liệu production đang có bao nhiêu `productImageFrames`; trước khi xóa cần migrate tối thiểu active uploaded overlay cũ sang key overlay đúng AR nếu có.
5. **Giả thuyết thay thế:** Giữ manager cũ nhưng ẩn bớt UI. Không khuyến nghị vì vẫn giữ nợ kỹ thuật trong data flow.
6. **Rủi ro fix sai:** Nếu xóa thiếu import/call site sẽ lỗi typecheck; nếu không migrate active overlay cũ có thể mất cấu hình khung đang dùng.
7. **Tiêu chí pass/fail:** Pass khi admin chỉ thấy toggle ở module, upload overlay ở advanced, storefront vẫn overlay đúng ảnh khi bật.

# IV. Proposal (Đề xuất)

## 1. Mục tiêu triển khai

- Đơn giản hóa Product Frames thành **5 global overlay images theo AR**.
- Giữ UI dễ hiểu:
  - `/system/modules/products`: chỉ bật/tắt.
  - `/admin/settings/advanced`: upload/xóa/preview 5 ảnh khung theo AR.
- Làm sạch hệ thống:
  - Xóa route/UI/manager/table/function/type legacy liên quan `productImageFrames`.
  - Không còn `activeProductFrameId` trong data flow mới.
  - Không còn 2 hệ thống khung cùng tồn tại.

## 2. Data Model (Mô hình dữ liệu)

Lưu trong `settings` table bằng flow hiện có, mỗi AR là 1 key cố định:

- `product_frame_overlay_square_url`
  - label: `Vuông (1:1)`
  - group: `advanced`
  - value: URL ảnh overlay `1:1`
- `product_frame_overlay_wide169_url`
  - label: `Rộng (16:9)`
  - group: `advanced`
  - value: URL ảnh overlay `16:9`
- `product_frame_overlay_portrait916_url`
  - label: `Dọc (9:16)`
  - group: `advanced`
  - value: URL ảnh overlay `9:16`
- `product_frame_overlay_portrait34_url`
  - label: `Dọc (3:4)`
  - group: `advanced`
  - value: URL ảnh overlay `3:4`
- `product_frame_overlay_landscape43_url`
  - label: `Ngang (4:3)`
  - group: `advanced`
  - value: URL ảnh overlay `4:3`

Mỗi key ảnh có storage id theo pattern hiện có:

- `${key}__storageId`
- dùng cùng `SETTING_STORAGE_ID_SUFFIX = "__storageId"` trong `convex/settings.ts`

Đọc thêm `moduleSettings.products.defaultImageAspectRatio` để biết tỷ lệ ảnh sản phẩm mặc định hiện tại. UI chỉ hiển thị nội dung dạng `Tỷ lệ ảnh mặc định: Vuông (1:1)` hoặc badge `Đang dùng mặc định`, **không ghi chữ "system" trong microcopy**.

Giữ trong `moduleSettings`:

- `products.enableProductFrames`
  - boolean toggle bật/tắt render overlay
- `products.defaultImageAspectRatio`
  - dùng để highlight khung mặc định trong 5 khung trên UI admin

Không dùng trong flow mới:

- `products.activeProductFrameId`
- `products.productFrameOverlayFit`
- `products.productFrameCleanupOnArChange`
- table `productImageFrames`

Các key/table legacy trên cần được gỡ khỏi config/code/schema. Nếu production đang có `activeProductFrameId` trỏ tới frame loại `uploaded_overlay`, migrate URL đó sang key AR tương ứng nếu xác định được `aspectRatio`; nếu không xác định được thì migrate vào `product_frame_overlay_square_url` vì default hiện tại là `square`. Các frame loại `line_generator`/`logo_generator` không migrate vì không còn thuộc scope mới.

## 3. UI/UX (Giao diện)

### a) `/system/modules/products`

- Chỉ giữ setting:
  - `enableProductFrames` — label: `Bật khung viền sản phẩm`
- Bỏ khỏi config:
  - `productFrameOverlayFit`
  - `productFrameCleanupOnArChange`

### b) `/admin/settings/advanced`

- Thêm tab `Khung viền sản phẩm` cạnh tab `Ảnh sản phẩm` và `Header`.
- Trong tab này có:
  - thông tin tỷ lệ mặc định dạng: `Tỷ lệ ảnh mặc định: Vuông (1:1)`; không mention nguồn cấu hình;
  - 5 card/uploader khung:
    - `Vuông (1:1)`
    - `Rộng (16:9)`
    - `Dọc (9:16)`
    - `Dọc (3:4)`
    - `Ngang (4:3)`
  - card nào trùng `defaultImageAspectRatio` thì có badge `Đang dùng mặc định`;
  - mỗi card có `SettingsImageUploader`, preview đúng aspect ratio, nút `Xóa khung`;
  - mô tả ngắn: `Upload ảnh PNG/WebP nền trong suốt. Nên dùng đúng tỷ lệ ghi trên từng khung.`
- Nếu `enableProductFrames` đang tắt, vẫn cho upload ảnh nhưng hiển thị callout nhẹ: `Tính năng đang tắt. Bật lên để hiển thị khung trên ảnh sản phẩm.`

### c) `/admin/settings/product-frames`

- Không còn là màn hình quản lý riêng.
- Xóa `ProductFrameManager`.
- Route cũ nên redirect về `/admin/settings/advanced` để tránh 404 nếu user/bookmark cũ còn mở link.
- Sidebar không hiển thị item `Khung sản phẩm` nữa.

## 4. Render Logic (Logic hiển thị)

Renderer mới chỉ cần:

1. Query `enableProductFrames`.
2. Query `settings` các key overlay theo AR.
3. Nhận hoặc resolve AR ảnh sản phẩm tại nơi render:
   - ưu tiên AR cụ thể của component/card/detail nếu đã có;
   - fallback về `moduleSettings.products.defaultImageAspectRatio`;
   - fallback cuối là `square`.
4. Map AR sang đúng key overlay:
   - `square` → `product_frame_overlay_square_url`
   - `wide169` → `product_frame_overlay_wide169_url`
   - `portrait916` → `product_frame_overlay_portrait916_url`
   - `portrait34` → `product_frame_overlay_portrait34_url`
   - `landscape43` → `product_frame_overlay_landscape43_url`
5. Nếu `enabled === true` và URL của AR đó có giá trị:
   - render overlay image.
6. Nếu thiếu 1 trong 2:
   - không render frame.

CSS đề xuất:

```tsx
<img
  src={overlayUrlForAspectRatio}
  alt=""
  aria-hidden="true"
  className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
/>
```

Lý do dùng `object-contain` thay vì `object-cover`:

- `contain` an toàn hơn, không crop frame.
- Nếu AR khớp thì `contain` và khung sản phẩm sẽ khít.
- Nếu AR lệch thì frame không bị cắt, admin nhìn ra và đổi ảnh đúng AR.

Không fallback chéo AR mặc định trong storefront nếu key AR đang render bị thiếu. Ví dụ card đang render `16:9` mà chưa upload khung `16:9` thì không nên lấy khung `1:1`, vì sẽ dễ lệch/không khít.

## 5. Migration & Cleanup Strategy (Chiến lược migrate và dọn sạch)

Làm trong một đợt triển khai hoàn chỉnh:

1. Thêm 5 setting mới:
   - `product_frame_overlay_square_url`
   - `product_frame_overlay_wide169_url`
   - `product_frame_overlay_portrait916_url`
   - `product_frame_overlay_portrait34_url`
   - `product_frame_overlay_landscape43_url`
2. Nếu cần giữ cấu hình đang dùng, đọc `activeProductFrameId`:
   - nếu frame active là `uploaded_overlay` và có `overlayImageUrl`, copy sang key overlay tương ứng với `aspectRatio`;
   - copy `overlayStorageId` sang `${key}__storageId` nếu có;
   - bỏ qua `line_generator`/`logo_generator` vì flow mới chỉ nhận ảnh overlay.
3. Renderer chuyển sang đọc các setting overlay theo AR.
4. Xóa UI/route/sidebar legacy.
5. Xóa Convex function/table/type legacy sau khi không còn import.
6. Xóa logic cleanup AR/active frame trong `convex/admin/modules.ts`.
7. Xóa export/import migration bundle cho `modules/products/frames.json` nếu không còn bảng frame.

Tiêu chí cleanup: search toàn repo không còn reference runtime tới `productImageFrames`, `ProductFrameManager`, `activeProductFrameId`, `productFrameOverlayFit`, `productFrameCleanupOnArChange`.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / Admin

- **Sửa:** `lib/modules/configs/products.config.ts`  
  Vai trò hiện tại: định nghĩa các setting của Products module.  
  Thay đổi: chỉ giữ `enableProductFrames`, bỏ `productFrameOverlayFit` và `productFrameCleanupOnArChange` khỏi UI config.

- **Sửa:** `app/admin/settings/_components/SettingsPageShell.tsx`  
  Vai trò hiện tại: render các tab settings, đã có upload ảnh `product_image_placeholder`.  
  Thay đổi: thêm `AdvancedTab = 'product-placeholder' | 'product-frame' | 'header'`, thêm 5 uploader/preview cho 5 key overlay theo AR, hiển thị tỷ lệ ảnh mặc định và badge `Đang dùng mặc định`, đảm bảo save kèm storage id.

- **Sửa hoặc xóa route:** `app/admin/settings/product-frames/page.tsx`  
  Vai trò hiện tại: route riêng render `ProductFrameManager`.  
  Thay đổi: nếu cần giữ backward compatibility URL thì chỉ redirect về `/admin/settings/advanced`; không import/render manager cũ.

- **Xóa:** `app/admin/settings/_components/ProductFrameManager.tsx`  
  Vai trò hiện tại: UI quản lý frame phức tạp.  
  Thay đổi: xóa khỏi codebase, vì flow mới chỉ upload 5 ảnh theo AR trong Advanced settings.

- **Sửa:** `app/admin/components/Sidebar.tsx`  
  Vai trò hiện tại: hiển thị menu `/admin/settings/product-frames` khi `enableProductFrames=true`.  
  Thay đổi: bỏ item/menu khung sản phẩm vì cấu hình đã nằm trong Advanced settings.

## 2. Shared Renderer / Storefront

- **Sửa:** `components/shared/ProductImageFrameBox.tsx`  
  Vai trò hiện tại: query `activeProductFrameId`, query `productImageFrames.getById`, render nhiều loại frame.  
  Thay đổi: query `enableProductFrames`, `defaultImageAspectRatio` và `settings.getMultiple` cho 5 key overlay; nhận `aspectRatio` optional từ call site; trả về overlay URL đúng AR, render `<img>` overlay duy nhất.

- **Review giữ tương thích:** các call site đang import `ProductImageFrameOverlay`/`useProductFrameConfig`:
  - `components/site/ProductListSection.tsx`
  - `components/site/ProductGridSection.tsx`
  - `components/site/ComponentRenderer.tsx`
  - `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx`
  - `app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx`
  - `app/(site)/products/[slug]/page.tsx`
  - `app/(site)/[categorySlug]/_components/ProductsPage.tsx`
  - `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`
  
  Thay đổi: bổ sung prop optional `aspectRatio` cho `ProductImageFrameOverlay`/`ProductImageFrameBox`; call site nào đã có `imageAspectRatio` thì truyền vào để chọn đúng khung, call site thiếu thì fallback về tỷ lệ ảnh mặc định.

## 3. Convex / Backend

- **Sửa:** `convex/admin/modules.ts`  
  Vai trò hiện tại: khi đổi AR/tắt frame có cleanup `activeProductFrameId`.  
  Thay đổi: xóa logic cleanup liên quan `productFrameOverlayFit`, `productFrameCleanupOnArChange`, `activeProductFrameId`.

- **Sửa:** `convex/schema.ts` table `productImageFrames`  
  Vai trò hiện tại: lưu nhiều frame legacy.  
  Thay đổi: xóa table `productImageFrames` sau khi renderer/UI/function không còn reference.

- **Xóa:** `convex/productImageFrames.ts`  
  Vai trò hiện tại: CRUD frame legacy.  
  Thay đổi: xóa function legacy, không còn API `api.productImageFrames.*`.

- **Xóa:** `lib/products/product-frame.ts`  
  Vai trò hiện tại: type/preset cho nhiều loại frame legacy.  
  Thay đổi: xóa nếu không còn import; nếu còn type nhỏ cần thiết thì thay bằng type inline/simple overlay URL.

## 4. Media / Migration

- **Review:** `convex/media.ts`  
  Vai trò hiện tại: scan usage file trong `productImageFrames`.  
  Thay đổi: xóa scan usage của `productImageFrames`; đảm bảo các key `settings.product_frame_overlay_*_url__storageId` vẫn được File Lifecycle Service theo pattern settings hiện có.

- **Sửa:** `lib/migration-bundle/client.ts`  
  Vai trò hiện tại: export/import `modules/products/frames.json`.  
  Thay đổi: xóa export/import `modules/products/frames.json`, vì frame legacy không còn trong schema mới.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại các file liên quan và xác nhận import/call site của `ProductImageFrameBox`.
2. Sửa Products module config để chỉ còn toggle `enableProductFrames`.
3. Thêm `product-frame` tab vào `SettingsPageShell`.
4. Thêm save/load 5 key overlay theo AR, dùng pattern `product_image_placeholder`.
5. Nếu có nhu cầu migrate dữ liệu cũ, copy active uploaded overlay sang setting mới bằng mutation/script an toàn trước khi bỏ schema.
6. Redirect `/admin/settings/product-frames` về `/admin/settings/advanced`.
7. Bỏ menu sidebar `/admin/settings/product-frames`.
8. Refactor `ProductImageFrameBox` để dùng overlay URL theo AR thay vì `activeProductFrameId + productImageFrames`.
9. Xóa `ProductFrameManager`, `convex/productImageFrames.ts`, `lib/products/product-frame.ts` và table `productImageFrames`.
10. Xóa cleanup logic/migration/media scanner legacy.
11. Review tĩnh toàn bộ import/type liên quan.
12. Chạy typecheck theo rule dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Static Verification (Kiểm chứng tĩnh)

- Search không còn UI active cho:
  - `productFrameOverlayFit`
  - `productFrameCleanupOnArChange`
  - `/admin/settings/product-frames` trong sidebar
- Search toàn repo không còn runtime reference tới:
  - `ProductFrameManager`
  - `productImageFrames`
  - `activeProductFrameId`
  - `productFrameOverlayFit`
  - `productFrameCleanupOnArChange`
- Chạy:

```powershell
bunx tsc --noEmit 2>&1 | Select-Object -First 10
```

## 2. Manual Verification (Kiểm chứng thủ công)

- Vào `/system/modules/products`:
  - thấy chỉ còn toggle `Bật khung viền sản phẩm`.
  - không còn dropdown cách fit/cleanup AR.
- Vào `/admin/settings/advanced`:
  - thấy tab `Khung viền sản phẩm`.
  - thấy 5 uploader cho `1:1`, `16:9`, `9:16`, `3:4`, `4:3`.
  - thấy dòng `Tỷ lệ ảnh mặc định: ...` và badge `Đang dùng mặc định` đúng với `defaultImageAspectRatio`.
  - upload được ảnh PNG/WebP cho từng tỷ lệ.
  - save xong refresh vẫn còn các ảnh.
- Khi toggle off:
  - storefront/admin preview không render overlay.
- Khi toggle on + có ảnh overlay:
  - product card/list/detail render khung.
- Với ảnh sản phẩm `1:1`, `16:9`, `9:16`, `3:4`, `4:3`:
  - nếu đã upload frame cùng AR thì overlay khít, không crop, không che interaction vì `pointer-events-none`.
  - nếu chưa upload frame cho AR đó thì không overlay sai AR.

# VIII. Todo

- [ ] Sửa `lib/modules/configs/products.config.ts` chỉ còn toggle frame.
- [ ] Thêm tab `Khung viền sản phẩm` trong `SettingsPageShell`.
- [ ] Thêm 5 uploader cho `1:1`, `16:9`, `9:16`, `3:4`, `4:3`.
- [ ] Hiển thị tỷ lệ ảnh mặc định và badge `Đang dùng mặc định` mà không mention nguồn cấu hình.
- [ ] Lưu 5 key overlay theo AR và storage id trong `settings`.
- [ ] Redirect route cũ `/admin/settings/product-frames`.
- [ ] Bỏ menu sidebar khung sản phẩm.
- [ ] Refactor `ProductImageFrameBox` sang simple overlay theo AR.
- [ ] Review call sites giữ tương thích.
- [ ] Migrate active uploaded overlay cũ sang key overlay đúng AR nếu dữ liệu cũ đang có.
- [ ] Xóa `ProductFrameManager.tsx`.
- [ ] Xóa `convex/productImageFrames.ts`.
- [ ] Xóa table `productImageFrames` trong `convex/schema.ts`.
- [ ] Xóa `lib/products/product-frame.ts` nếu hết import.
- [ ] Xóa cleanup logic `activeProductFrameId`/AR trong `convex/admin/modules.ts`.
- [ ] Xóa media scanner/migration bundle legacy cho product frames.
- [ ] Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- [ ] Commit thay đổi sau khi typecheck pass.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `/system/modules/products` chỉ còn toggle bật/tắt khung viền sản phẩm.
- `/admin/settings/product-frames` không còn là màn hình quản lý chính; user được đưa về `/admin/settings/advanced`.
- `/admin/settings/advanced` có tab **Khung viền sản phẩm** để upload/xóa/preview 5 ảnh overlay theo AR.
- UI hiển thị tỷ lệ ảnh mặc định hiện tại và đánh dấu card AR tương ứng bằng badge `Đang dùng mặc định`, không dùng chữ "system" trong microcopy.
- Overlay images lưu bằng 5 key `settings.product_frame_overlay_*_url`.
- Storefront/admin preview chỉ render frame khi:
  - `enableProductFrames === true`
  - key overlay đúng AR đang render có URL hợp lệ
- Không dùng khung `1:1` để overlay nhầm lên ảnh `16:9`, `9:16`, `3:4`, `4:3`.
- Không còn dependency runtime mới vào `activeProductFrameId` hoặc `productImageFrames.getById`.
- Không còn file/table/function legacy của Product Frames cũ trong codebase, trừ route redirect cũ nếu cần giữ URL tương thích.
- TypeScript pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## 1. Risk (Rủi ro)

- Xóa legacy thiếu triệt để có thể để lại import chết hoặc generated API mismatch.
- Nếu không migrate active uploaded overlay cũ theo đúng AR, cấu hình khung đang dùng có thể mất.
- Nếu ảnh khung upload lệch AR với ảnh sản phẩm, overlay sẽ không khít tuyệt đối.
- Nếu đổi API `ProductImageFrameOverlay` quá mạnh, nhiều call site có thể lỗi type.

## 2. Mitigation (Giảm rủi ro)

- Trước khi xóa table, search và gỡ hết import/call site liên quan.
- Nếu cần giữ cấu hình cũ, chỉ migrate active `uploaded_overlay`; không migrate line/logo generator.
- Dùng `object-contain`, không crop frame.
- Không fallback chéo AR ở storefront để tránh khung lệch tỷ lệ.
- Giữ tên hook/component gần giống hiện tại để giảm phạm vi sửa.
- Thêm hướng dẫn microcopy: ảnh khung nên đúng AR ghi trên từng card.

## 3. Rollback (Hoàn tác)

- Revert commit triển khai.
- Nếu đã deploy schema cleanup, rollback cần restore commit có schema/function cũ và redeploy Convex theo quy trình dự án.
- Các setting mới `product_frame_overlay_*_url` vẫn an toàn, có thể giữ lại ngay cả khi rollback UI.

# XI. Out of Scope (Ngoài phạm vi)

- Không làm crop editor trong browser.
- Không tự remove background ảnh upload.
- Không hỗ trợ nhiều bộ khung theo mùa trong đợt triển khai này; mỗi AR chỉ có 1 ảnh khung active.
- Không tự sinh/crop ảnh khung từ 1 file sang nhiều AR; admin upload đúng từng AR.
