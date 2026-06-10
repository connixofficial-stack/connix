## TL;DR kiểu Feynman
- Bài auto sẽ dùng **dữ liệu thật tối đa**: tên/mô tả/ảnh sản phẩm, thumbnail danh mục, sản phẩm liên quan.
- Pipeline chuyển sang **HTML-first**: Apply sẽ set `renderType=html`, đổ vào `htmlRender`, không nhét `content` Lexical.
- Khi bật Auto Generator ở `/system/modules/posts` sẽ **tự bật luôn HTML render**.
- Sửa thuật toán để tránh rác: không hiện `0₫`, ảnh không trùng, cụm dài hơn, format chuẩn SEO + hashtag + CTA.
- Bổ sung quality gates + warnings để nội dung sâu, sạch, có ý nghĩa hơn.

## Audit Summary
### Observation
1. `assembler.ts` hiện render khối ngắn, thiên câu mẫu; `handleApplyGenerated` đang set `content` thay vì `htmlRender`.
2. `media-plan.ts` chọn ảnh random theo slot, chưa dedupe toàn bài -> dễ trùng ảnh.
3. `formatPrice` chưa chặn `0`/invalid nên có thể hiện giá vô nghĩa.
4. `posts.config.ts` có cả `enableAutoPostGenerator` và `enableHtmlRender` nhưng chưa có ràng buộc tự bật kèm.
5. `productCategories.ts` đã có `representativeImage/sampleImages` hữu ích để đa dạng ảnh theo danh mục.

### Inference
- Nguyên nhân chất lượng thấp đến từ thiếu orchestration layer: data normalization + media dedupe + HTML formatter + SEO structure.

### Decision
- Refactor generator theo hướng **Data-first + HTML-first + Quality-gated SEO composition**.

## Root Cause Confidence
**High** — vì các file hiện tại cho thấy rõ thiếu guard cho dữ liệu bẩn, thiếu bố cục HTML SEO, thiếu chiến lược media phân tầng.

## Counter-Hypothesis
- Chỉ tăng phrase-bank là đủ.  
  **Bác bỏ:** không giải quyết giá 0đ, ảnh trùng, thiếu cấu trúc SEO, và không đáp ứng yêu cầu HTML-first.

## Files Impacted
### UI / Admin
- **Sửa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: apply generator đổ vào Lexical `content`.  
  Thay đổi: apply sẽ `setRenderType('html')`, set `htmlRender = contentHtml`, clear/không dùng `content`; cập nhật preview/warnings nếu dữ liệu thiếu.

### System module config
- **Sửa:** `lib/modules/configs/posts.config.ts`  
  Vai trò hiện tại: cấu hình feature toggle độc lập.  
  Thay đổi: thêm dependency rule runtime: bật `enableAutoPostGenerator` => tự bật `enableHtmlRender`.

- **Sửa (nhẹ):** `app/system/modules/posts/page.tsx` (nếu cần wiring callback)  
  Vai trò hiện tại: render ModuleConfigPage.  
  Thay đổi: đảm bảo flow save phản ánh auto-enable `HTML render` khi bật generator.

### Generator core
- **Sửa:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: lắp section cơ bản.  
  Thay đổi: HTML formatter đầy đủ (intro, TOC, section sâu, FAQ, conclusion, CTA cluster, hashtag block), guard giá/link/mô tả.

- **Sửa:** `lib/posts/generator/variant-synthesizer.ts`  
  Vai trò hiện tại: body ngắn 1 câu/slot.  
  Thay đổi: multi-paragraph slot composer (insight + practical note + recommendation), anti-duplicate cho FAQ/câu mở.

- **Sửa:** `lib/posts/generator/phrase-banks.ts`  
  Vai trò hiện tại: phrase bank chung.  
  Thay đổi: mở rộng bank theo intent “SEO bán hàng nhưng hữu ích”, thêm cụm technical utility, objection-handling, hashtag sets.

- **Sửa:** `lib/posts/generator/media-plan.ts`  
  Vai trò hiện tại: random picks.  
  Thay đổi: media allocator theo size/layout + dedupe pool + mix nguồn ảnh (sản phẩm, category thumbnail, related products).

- **Sửa:** `lib/posts/generator/link-plan.ts`  
  Vai trò hiện tại: list link đơn giản.  
  Thay đổi: internal links theo cụm + related products + CTA phù hợp saleMode.

- **Sửa nhẹ:** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: payload cơ bản.  
  Thay đổi: thêm `qualityWarnings`, `imageUsageStats`, `seoMeta` tách rõ.

### Server
- **Sửa:** `convex/posts.ts`  
  Vai trò hiện tại: fetch product và generate payload.  
  Thay đổi: enrich data thật trước khi assembler (category representative images, related products), không loại sản phẩm lỗi nhưng đánh dấu field invalid để renderer ẩn đúng.

## Hành vi chi tiết theo yêu cầu mới
1. **Dùng dữ liệu thật tối đa**
   - Tên SP, mô tả SP, ảnh SP, ảnh đại diện danh mục, sản phẩm liên quan (ưu tiên cùng category / sales gần).
2. **Giá/field lỗi**
   - `price <= 0` hoặc thiếu => không render giá số; thay text trung tính hữu ích.
   - Thiếu link thì bỏ CTA mua trực tiếp, vẫn có CTA xem chi tiết hoặc tư vấn.
3. **Ảnh đẹp + đa dạng**
   - Phân phối block ảnh lớn/vừa/nhỏ theo section.
   - Dedupe toàn bài; chỉ lặp khi thiếu nguồn ảnh.
4. **HTML-first apply flow**
   - Khi bấm “Áp dụng vào form”: `renderType = 'html'`, `htmlRender = generatorPreview.contentHtml`, `content` không dùng.
5. **SEO title/description riêng**
   - Generator trả meta title/meta description tách riêng, ưu tiên theo quy tắc độ dài và intent.
6. **Auto Generator phụ thuộc HTML render**
   - Bật Auto Generator ở `/system/modules/posts` => auto bật `HTML render` luôn.
7. **Format bài dài chuẩn chỉnh**
   - Mở bài, mục lục, section chuyên sâu, FAQ thực dụng, kết luận hành động, hashtag cuối bài.

## Execution Preview
1. Bổ sung dependency toggle Auto Generator -> HTML render ở module config.
2. Refactor apply flow admin post create sang HTML-first.
3. Thêm data enrichment server-side (category image + related products).
4. Nâng assembler thành SEO HTML formatter + quality warnings.
5. Nâng synthesizer/phrase banks để cụm dài và có chiều sâu.
6. Thay media allocator chống trùng + phối kích thước hợp lý.
7. Static review + `bunx tsc --noEmit`.

## Acceptance Criteria
1. Bật Auto Generator tự động bật HTML render trong cấu hình module posts.
2. Apply generated content sẽ set `renderType=html` và ghi vào `htmlRender` (không phụ thuộc Lexical content).
3. Không còn hiển thị giá `0₫` hoặc dữ liệu vô nghĩa.
4. Ảnh trong bài không trùng lặp vô lý, có đa dạng layout/kích thước.
5. Bài có cấu trúc SEO đầy đủ + hashtag + CTA chuẩn, đọc có chiều sâu.
6. Dữ liệu sản phẩm thật được tận dụng rõ ràng (name/desc/image/category/related).

## Verification Plan
- Theo guideline repo: không chạy lint/unit/build.
- Chạy `bunx tsc --noEmit` khi xong code TS.
- Tester checklist:
  - bật Auto Generator xem HTML render auto bật;
  - apply bài: renderType/htmlRender đúng;
  - case giá 0, thiếu link, thiếu mô tả;
  - case nguồn ảnh ít và nhiều;
  - kiểm tra section SEO + hashtag + CTA.

## Out of Scope
- Không tích hợp external LLM.
- Không đổi schema DB lớn hoặc migration phá vỡ dữ liệu cũ.

## Risk / Rollback
- Risk: HTML output dài có thể làm editor preview nặng.
- Mitigation: giới hạn chiều dài từng slot + lazy preview block.
- Rollback: fallback về formatter cũ bằng switch nội bộ trong assembler.