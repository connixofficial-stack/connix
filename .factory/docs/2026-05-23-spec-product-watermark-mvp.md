# I. Primer

## 1. TL;DR kiểu Feynman

- Watermark sản phẩm nên làm giống khung viền sản phẩm: **toggle ở Products module**, cấu hình gọn trong `/admin/settings/advanced`.
- MVP chỉ cần 2 lớp watermark: **watermark hình** và **watermark chữ**; admin có thể bật/tắt từng lớp.
- Không xử lý ảnh thật ở server trong MVP; chỉ overlay lên ảnh sản phẩm bằng CSS để đơn giản, nhanh, dễ rollback.
- Cấu hình mạnh nhưng KISS: kéo/thả trực tiếp trong preview, resize watermark hình bằng tay, chỉnh opacity, nội dung chữ, font size `1-30`, màu chữ và chế độ lặp chữ.
- Tab `Watermark` chỉ xuất hiện trong Advanced settings khi tính năng watermark sản phẩm được bật.
- Mục tiêu là chống copy ảnh nhẹ + tăng nhận diện thương hiệu, không biến hệ thống thành Photoshop mini.

## 2. Elaboration & Self-Explanation

Watermark thực chất cũng là một lớp phủ lên ảnh, giống khung viền sản phẩm. Khác nhau ở chỗ khung viền cần khớp viền/AR, còn watermark cần admin chỉnh vị trí/kích thước trực quan để đặt dấu mờ vừa mắt, có opacity thấp để không phá ảnh sản phẩm.

Các SaaS watermark phổ biến thường có cùng nhóm control: chọn watermark chữ hoặc logo, chỉnh vị trí, opacity, kích thước, đôi khi có tile/repeat để phủ mờ toàn ảnh. Với dự án này, nếu bắt admin chọn nhiều dropdown góc/trái/phải sẽ hơi cứng và nhiều trường. Cách tốt hơn cho UX là cho **kéo trực tiếp trên preview**: watermark hình kéo được vị trí và resize được; watermark chữ là một hàng ngang kéo được lên/xuống, chỉnh font size bằng dropdown `1-30`.

MVP này nên render runtime trên storefront/admin preview bằng component overlay. Không nên tạo ảnh mới, không ghi đè media gốc, không batch process ảnh, vì các việc đó tăng rủi ro file lifecycle, chi phí xử lý và rollback khó.

## 3. Concrete Examples & Analogies

- **Ví dụ cụ thể:** Shop muốn ảnh sản phẩm có logo nhỏ ở góc phải dưới và dòng chữ `THIÊN KIM WINE` mờ chạy ngang. Admin bật watermark trong Products module, vào Advanced settings → tab `Watermark`, upload logo rồi kéo logo xuống góc phải dưới, kéo resize cho vừa, opacity `40%`; bật watermark chữ, nhập text, chọn font size `8`, kéo hàng chữ xuống gần đáy ảnh và bật `Lặp ngang`. Storefront tự phủ watermark lên card/detail/lightbox ảnh sản phẩm.
- **Analogy:** Nếu khung viền là cái khung đặt quanh ảnh, watermark là con dấu mờ đặt lên ảnh. Ta chỉ cần đặt con dấu đúng chỗ, không cần chỉnh sửa ảnh gốc.

# II. Audit Summary (Tóm tắt kiểm tra)

## 1. Observation (Quan sát)

- `lib/modules/configs/products.config.ts` là nơi phù hợp để thêm toggle trong Products module.
- `/admin/settings/advanced` đang được render bởi `app/admin/settings/_components/SettingsPageShell.tsx`, đã có pattern tab, uploader ảnh, save settings và storage id.
- `convex/settings.ts` đã có pattern lưu image setting bằng key chính + key storage id suffix `__storageId`.
- Product frame hiện có shared overlay ở `components/shared/ProductImageFrameBox.tsx`; watermark có thể dùng cùng pattern `absolute inset-0 pointer-events-none`.
- Storefront có nhiều surface ảnh sản phẩm đang render frame overlay: `ProductGridSection`, `ProductListSection`, `ComponentRenderer`, product detail, category products, lightbox.
- Tìm kiếm watermark trong code không thấy implementation sản phẩm hiện hữu; có thể thiết kế mới sạch.

## 2. SaaS Pattern Research (Nghiên cứu pattern SaaS)

Các tool/SaaS watermark phổ biến thường xoay quanh:

- watermark hình/logo;
- watermark chữ;
- kéo/thả vị trí;
- opacity;
- resize trực quan;
- tile/repeat;
- rotation hoặc advanced controls.

Quyết định MVP: lấy phần có giá trị cao nhất và dễ dùng nhất: **image + text + drag preview + opacity + resize image + font size 1-30 + repeat text**. Không đưa rotation/diagonal/tile toàn ảnh vào MVP vì dễ làm UI rối và tăng edge case responsive.

## 3. Decision (Quyết định)

- Thêm tính năng **Product Watermark** độc lập với Product Frames.
- Toggle nằm trong Products module: `enableProductWatermark`.
- Khi bật, Advanced settings có tab `Watermark`.
- Watermark render runtime bằng overlay CSS, không mutate ảnh gốc.
- Cấu hình lưu trong `settings` table bằng các key cố định.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Vì watermark là bài toán overlay UI, không phải bài toán media processing. Codebase đã có pattern settings/upload/overlay sẵn, nên giải pháp gọn nhất là reuse pattern đó thay vì tạo module/table/CRUD mới.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- **Giả thuyết:** Nên bake watermark trực tiếp vào ảnh để chống copy tốt hơn.
- **Đánh giá:** Không khuyến nghị cho MVP. Bake ảnh cần queue/job, cleanup media, versioning ảnh, rollback ảnh gốc, chi phí xử lý và nhiều edge case. Runtime overlay đủ tốt cho branding và chống copy nhẹ.

## 3. Audit Protocol Questions (Câu hỏi audit bắt buộc)

1. **Triệu chứng expected vs actual:** Expected là admin cần watermark dễ chỉnh; actual hiện chưa có product watermark.
2. **Phạm vi ảnh hưởng:** Products module config, Advanced settings, shared image overlay, storefront product image surfaces.
3. **Tái hiện:** Hiện vào Advanced settings chưa có tab watermark; ảnh sản phẩm không có watermark global.
4. **Mốc thay đổi gần nhất:** Product frames vừa được đơn giản hóa sang overlay settings, là pattern gần nhất để reuse.
5. **Dữ liệu thiếu:** Chưa có yêu cầu bake watermark vào media gốc, chưa có yêu cầu per-product/per-category watermark.
6. **Giả thuyết thay thế:** Làm full watermark editor giống SaaS; không chọn vì quá scope MVP.
7. **Rủi ro fix sai:** Overlay che nội dung sản phẩm, xung đột z-index với badge/khung viền, hoặc làm admin khó hiểu nếu quá nhiều control.
8. **Tiêu chí pass/fail:** Bật toggle thì có tab Watermark; cấu hình image/text watermark; storefront render đúng, không phá layout, không chặn click.

# IV. Proposal (Đề xuất)

## 1. Mục tiêu triển khai

- Thêm watermark sản phẩm theo hướng **KISS MVP nhưng đủ dùng thật**.
- Admin quản lý trong một tab gọn ở `/admin/settings/advanced`.
- Hỗ trợ 2 lớp:
  - watermark hình/logo;
  - watermark chữ.
- Mỗi lớp có bật/tắt riêng.
- Không tạo bảng riêng, không CRUD nhiều watermark, không xử lý ảnh gốc.

## 2. Products Module Toggle

Thêm setting trong `lib/modules/configs/products.config.ts`:

- key: `enableProductWatermark`
- label: `Bật watermark sản phẩm`
- type: `toggle`
- default: `false`

Behavior:

- Nếu `enableProductWatermark = false`:
  - tab `Watermark` trong Advanced settings không hiển thị hoặc hiển thị disabled state tùy pattern hiện tại;
  - storefront không render watermark dù settings còn tồn tại.
- Nếu `enableProductWatermark = true`:
  - tab `Watermark` xuất hiện trong Advanced settings;
  - renderer đọc settings watermark và overlay lên ảnh sản phẩm.

## 3. Data Model (Mô hình dữ liệu)

Lưu trong `settings` table, group `advanced`.

### a) Watermark hình

- `product_watermark_image_enabled`
  - boolean
  - default: `false`
- `product_watermark_image_url`
  - string URL ảnh logo/watermark
- `product_watermark_image_url__storageId`
  - storage id theo pattern settings hiện có
- `product_watermark_image_x`
  - number percent `0-100`
  - default: `80`
  - vị trí tâm watermark hình theo trục ngang trong preview
- `product_watermark_image_y`
  - number percent `0-100`
  - default: `80`
  - vị trí tâm watermark hình theo trục dọc trong preview
- `product_watermark_image_width`
  - number percent `5-80`
  - default: `28`
  - độ rộng watermark hình theo phần trăm chiều rộng ảnh; chỉnh bằng kéo resize trong preview, **không dùng dropdown size**
- `product_watermark_image_opacity`
  - number percent `0-100`
  - default: `40`

### b) Watermark chữ

- `product_watermark_text_enabled`
  - boolean
  - default: `false`
- `product_watermark_text_content`
  - string
  - default: brand/site name nếu có, hoặc empty
- `product_watermark_text_y`
  - number percent `0-100`
  - default: `80`
  - vị trí hàng chữ theo trục dọc; chữ luôn căng ngang toàn ảnh
- `product_watermark_text_font_size`
  - number integer `1-30`
  - default: `8`
  - dropdown chọn cỡ chữ từ `1` đến `30`
- `product_watermark_text_font_family`
  - string
  - default: `Be Vietnam Pro`
  - MVP dùng cố định `Be Vietnam Pro`, chưa cần dropdown font
- `product_watermark_text_color`
  - string hex
  - default: `#64748B`
- `product_watermark_text_opacity`
  - number percent `0-100`
  - default: `35`
- `product_watermark_text_repeat`
  - boolean
  - default: `false`

### c) Không dùng table riêng

Không tạo `productWatermarks` table. Watermark là global settings, không phải resource có lifecycle CRUD phức tạp.

## 4. UI/UX (Giao diện)

### a) `/system/modules/products`

- Thêm toggle `Bật watermark sản phẩm`.
- Không thêm các setting con ở đây để giữ Products module gọn.

### b) `/admin/settings/advanced`

Thêm tab `Watermark` khi `enableProductWatermark` bật.

Tab gồm 4 block:

1. **Tổng quan**
   - mô tả: `Thiết lập watermark hiển thị trên ảnh sản phẩm.`
   - preview trạng thái bật/tắt watermark hình/chữ.

2. **Watermark hình**
   - checkbox `Bật watermark hình`;
   - uploader ảnh;
   - kéo watermark hình trực tiếp trong preview để đổi vị trí;
   - kéo góc/handle để resize watermark hình;
   - slider/input `Độ trong suốt`;
   - nút `Xóa ảnh watermark`.

3. **Watermark chữ**
   - checkbox `Bật watermark chữ`;
   - input `Nội dung chữ`;
   - dropdown `Kích thước chữ` từ `1` đến `30`;
   - font mặc định cố định `Be Vietnam Pro`;
   - color input `Màu chữ`;
   - slider/input `Độ trong suốt`;
   - checkbox `Lặp watermark chữ theo hàng ngang`;
   - hàng chữ luôn căng ngang toàn ảnh và kéo được lên/xuống trong preview.

4. **Preview**
   - preview trên ảnh placeholder sản phẩm hoặc sample card;
   - hiển thị đồng thời image watermark và text watermark nếu cả 2 bật;
   - dùng normalized coordinates theo `%` để kéo/resize responsive;
   - watermark hình có drag + resize handle;
   - watermark chữ có drag handle cho cả hàng chữ;
   - preview phải dùng cùng component overlay với storefront để tránh lệch.

Microcopy:

- `Nên dùng PNG/WebP nền trong suốt cho watermark hình.`
- `Opacity 25-45% thường đủ nhận diện mà không che sản phẩm.`
- `Kéo watermark trong preview để đặt vị trí phù hợp.`
- `Watermark chỉ là lớp hiển thị, không chỉnh sửa ảnh gốc.`

## 5. Render Logic (Logic hiển thị)

Tạo shared hook/component:

- `useProductWatermarkConfig()`
- `ProductImageWatermarkOverlay`

Hook đọc:

- `moduleSettings.products.enableProductWatermark`
- các settings `product_watermark_*`

Renderer:

1. Nếu toggle module tắt → return null.
2. Nếu image watermark enabled và có URL → render image watermark theo `x/y/width/opacity`.
3. Nếu text watermark enabled và có text → render text watermark thành hàng ngang full-width theo `y/fontSize/color/opacity/repeat`.
4. Overlay dùng `pointer-events-none`, `select-none`.
5. Watermark nên render **trên ảnh sản phẩm**, nhưng cần thống nhất z-index với frame/badge:
   - ảnh sản phẩm;
   - watermark;
   - product frame nếu có;
   - badges/CTA/gradient nếu layout cần badge nổi rõ.

Gợi ý layer mặc định:

```txt
image base
watermark image/text
product frame
sale badge / action overlay
```

Lý do: watermark là dấu mờ nằm trên ảnh, khung viền vẫn nên nằm trên cùng để không bị watermark đè vào viền.

## 6. Drag/Resize Mapping (Mapping kéo/thả và resize)

### a) Watermark hình

Lưu bằng `%` để responsive:

- `x`: tâm watermark theo chiều ngang, `0-100`.
- `y`: tâm watermark theo chiều dọc, `0-100`.
- `width`: độ rộng watermark theo phần trăm chiều rộng ảnh, clamp `5-80`.
- `opacity`: `0-100`.

Render:

```tsx
style={{
  left: `${x}%`,
  top: `${y}%`,
  width: `${width}%`,
  opacity: opacity / 100,
  transform: 'translate(-50%, -50%)',
}}
```

Preview editor:

- drag watermark để đổi `x/y`;
- resize handle ở góc phải dưới để đổi `width`;
- giữ trong bounds, không để watermark trôi quá xa khỏi ảnh;
- không có dropdown size cho watermark hình.

### b) Watermark chữ

Chữ luôn là hàng ngang full-width:

- `y`: vị trí hàng chữ theo chiều dọc, `0-100`.
- `fontSize`: dropdown integer `1-30`.
- `fontFamily`: cố định `Be Vietnam Pro`.
- `repeat`: nếu true thì lặp text theo hàng ngang; nếu false thì text nằm giữa hàng.
- `opacity`: `0-100`.

Render:

```tsx
style={{
  left: 0,
  right: 0,
  top: `${y}%`,
  opacity: opacity / 100,
  transform: 'translateY(-50%)',
  fontFamily: '"Be Vietnam Pro", sans-serif',
  fontSize: `${fontSize}px`,
}}
```

Preview editor:

- drag hàng chữ lên/xuống để đổi `y`;
- không kéo resize text bằng chuột; chỉnh cỡ chữ bằng dropdown `1-30` để dễ kiểm soát;
- nếu `repeat=true`, render nhiều span trong một hàng ngang;
- nếu `repeat=false`, căn giữa một text trong hàng ngang;
- không làm diagonal/tile toàn ảnh trong MVP.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / Admin

- **Sửa:** `lib/modules/configs/products.config.ts`  
  Vai trò hiện tại: định nghĩa settings Products module.  
  Thay đổi: thêm toggle `enableProductWatermark`.

- **Sửa:** `app/admin/settings/_components/SettingsPageShell.tsx`  
  Vai trò hiện tại: render Advanced settings tabs và save settings.  
  Thay đổi: thêm tab `watermark`, form image/text watermark, uploader, preview drag/resize, save/load các key `product_watermark_*`.

## 2. Shared Renderer / Storefront

- **Thêm hoặc sửa:** `components/shared/ProductImageWatermarkOverlay.tsx` hoặc gom gần `ProductImageFrameBox.tsx`  
  Vai trò hiện tại: chưa có watermark overlay.  
  Thay đổi: tạo hook/config/overlay watermark dùng lại cho storefront và preview.

- **Sửa các call site ảnh sản phẩm:**  
  Vai trò hiện tại: đang render image/frame ở card/list/detail/lightbox.  
  Thay đổi: thêm `ProductImageWatermarkOverlay` vào cùng container ảnh sản phẩm.

Các surface cần review:

- `components/site/ProductGridSection.tsx`
- `components/site/ProductListSection.tsx`
- `components/site/ComponentRenderer.tsx`
- `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx`
- `app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx`
- `app/(site)/products/[slug]/page.tsx`
- `app/(site)/[categorySlug]/_components/ProductsPage.tsx`
- `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx`
- `components/site/products/detail/_components/ProductImageLightbox.tsx`

## 3. Convex / Settings

- **Không cần schema mới:** `convex/schema.ts`  
  Vai trò hiện tại: đã có table `settings`/`moduleSettings`.  
  Thay đổi: không thêm table.

- **Dùng lại:** `convex/settings.ts`  
  Vai trò hiện tại: `setMultiple` hỗ trợ save settings và storage id.  
  Thay đổi: không cần function mới nếu UI dùng pattern hiện có.

# VI. Execution Preview (Xem trước thực thi)

1. Thêm toggle `enableProductWatermark` vào Products module config.
2. Thêm `watermark` tab vào Advanced settings, chỉ hiện khi toggle bật.
3. Thêm default form values cho các key `product_watermark_*`, gồm `x/y/width` cho image và `y/fontSize` cho text.
4. Thêm save/load settings, gồm storage id cho `product_watermark_image_url`.
5. Tạo shared watermark overlay component/hook.
6. Gắn watermark overlay vào các product image surfaces.
7. Thêm editor preview drag/resize lưu normalized percent.
8. Dùng chung overlay component trong preview để đảm bảo preview giống storefront.
9. Review z-index với product frame, sale badge, hover overlay.
10. Chạy typecheck theo rule dự án.

# VII. Verification Plan (Kế hoạch kiểm chứng)

## 1. Static Verification (Kiểm chứng tĩnh)

- Search `enableProductWatermark` xuất hiện trong Products module config và renderer hook.
- Search `product_watermark_*` xuất hiện trong SettingsPageShell/save settings và overlay hook.
- Không có table mới kiểu `productWatermarks`.
- Không có logic mutate ảnh gốc.
- Chạy:

```powershell
bunx tsc --noEmit 2>&1 | Select-Object -First 10
```

## 2. Manual Verification (Kiểm chứng thủ công)

- Toggle off:
  - tab Watermark không xuất hiện hoặc ở trạng thái disabled theo quyết định UI;
  - storefront không render watermark.
- Toggle on:
  - tab Watermark xuất hiện trong Advanced settings.
- Watermark hình:
  - upload ảnh PNG/WebP;
  - kéo đổi vị trí;
  - kéo resize đổi kích thước;
  - đổi opacity;
  - save, refresh vẫn còn cấu hình;
  - storefront render đúng.
- Watermark chữ:
  - nhập text;
  - kéo hàng chữ lên/xuống;
  - đổi font size bằng dropdown `1-30`;
  - font mặc định là `Be Vietnam Pro`;
  - đổi color/opacity;
  - bật repeat horizontal;
  - save, refresh vẫn còn cấu hình;
  - storefront render đúng.
- Cả image + text bật:
  - cả 2 lớp cùng hiển thị;
  - không che click, không phá hover, không đè xấu lên sale badge/frame.

# VIII. Todo

- [ ] Thêm toggle `enableProductWatermark` vào Products module config.
- [ ] Thêm tab `watermark` trong Advanced settings.
- [ ] Thêm form defaults cho image/text watermark.
- [ ] Thêm save/load các key `product_watermark_*`.
- [ ] Thêm uploader image watermark với storage id.
- [ ] Thêm preview drag/resize dùng chung overlay component.
- [ ] Lưu `x/y/width` cho watermark hình bằng normalized percent.
- [ ] Lưu `y/fontSize` cho watermark chữ, font mặc định `Be Vietnam Pro`.
- [ ] Tạo `useProductWatermarkConfig`.
- [ ] Tạo `ProductImageWatermarkOverlay`.
- [ ] Gắn overlay vào product grid/list/home/detail/lightbox surfaces.
- [ ] Review z-index với product frame và badge.
- [ ] Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- [ ] Commit thay đổi sau khi typecheck pass.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `/system/modules/products` có toggle `Bật watermark sản phẩm`.
- Khi toggle bật, `/admin/settings/advanced` có tab `Watermark`.
- Admin cấu hình được watermark hình và watermark chữ.
- Watermark hình có upload, kéo vị trí, kéo resize, opacity; không có dropdown size hình.
- Watermark chữ có nội dung, kéo hàng chữ, dropdown font size `1-30`, font mặc định `Be Vietnam Pro`, màu, opacity, repeat horizontal.
- Watermark chữ luôn là hàng ngang căng toàn ảnh; repeat off thì căn giữa, repeat on thì lặp ngang.
- Preview trong admin giống cách render ngoài storefront.
- Storefront chỉ render watermark khi toggle module bật.
- Watermark không mutate ảnh gốc.
- Watermark không chặn click/hover vì dùng `pointer-events-none`.
- TypeScript pass.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

## 1. Risk (Rủi ro)

- Watermark che sản phẩm nếu opacity/kích thước quá lớn.
- Z-index có thể xung đột với product frame, badge sale, hover CTA.
- Gắn thiếu surface ảnh sản phẩm có thể làm watermark không đồng nhất.
- Nếu tab luôn hiện dù toggle tắt, admin có thể hiểu nhầm là đã bật ngoài storefront.
- Drag/resize nếu không clamp có thể làm watermark trôi khỏi preview hoặc lệch giữa admin và storefront.

## 2. Mitigation (Giảm rủi ro)

- Default opacity thấp: image `40%`, text `35%`.
- Default image `x=80`, `y=80`, `width=28`.
- Default text `y=80`, font size `8`, font `Be Vietnam Pro`.
- Clamp image width `5-80`, clamp coordinates `0-100`.
- Dùng preview live trước khi save.
- Dùng shared component để admin preview và storefront không lệch.
- Checklist call sites bắt buộc trước nghiệm thu.

## 3. Rollback (Hoàn tác)

- Revert commit triển khai.
- Settings `product_watermark_*` có thể giữ lại, không ảnh hưởng nếu renderer không đọc.
- Vì không mutate ảnh gốc nên rollback an toàn.

# XI. Out of Scope (Ngoài phạm vi)

- Không bake watermark vào ảnh gốc.
- Không batch process ảnh.
- Không watermark theo từng sản phẩm/danh mục.
- Không nhiều profile watermark theo mùa.
- Không dropdown vị trí kiểu góc/trái/phải; dùng kéo trong preview.
- Không rotate/diagonal/tile toàn ảnh trong MVP.
