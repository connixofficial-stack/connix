## Audit Summary
- Observation: Preview `/system/experiences/product-detail` vẫn đang tự bơm một `previewFrame` local vào `ProductDetailPreview`, nên luôn xuất hiện khung đỏ lớn dù đã tách khỏi runtime settings. Evidence: `app/system/experiences/product-detail/page.tsx` đang tạo `previewFrame` từ `getDefaultProductFramePresets(resolvedImageAspectRatio)` và truyền vào `getPreviewProps()`.
- Observation: `ProductDetailPreview` hiện nhận `previewFrame` và render overlay ở nhiều image slots. Evidence: `components/experiences/previews/ProductDetailPreview.tsx` dùng `const frame = previewFrame;`.
- Observation: Vấn đề user muốn xử lý bây giờ không còn là leak từ admin settings, mà là chính preview contract hiện tại đang cố tình bật frame mẫu. User đã chốt yêu cầu: **ẩn hoàn toàn khung trong preview**.

## Root Cause Confidence
**High** — nguyên nhân trực tiếp là `page.tsx` đang luôn tạo và truyền `previewFrame` mẫu vào preview. Vì vậy dù đã không đọc frame thật từ `/admin/settings/product-frames`, preview vẫn luôn có khung đỏ.

## TL;DR kiểu Feynman
- Preview đang tự gắn một cái khung mẫu vào ảnh.
- Cái khung đó không phải từ site thật nữa, mà là do page preview tự thêm.
- Muốn bỏ “lằng bự đó” thì chỉ cần ngừng truyền khung vào preview.
- Site runtime không bị ảnh hưởng vì chỉ sửa route preview.

## Elaboration & Self-Explanation
Ở lần sửa trước, để tránh preview bị phụ thuộc vào settings thật, preview được chuyển sang dùng một frame local. Điều đó giải quyết được chuyện “ăn theo admin settings”, nhưng lại tạo ra một behavior khác: preview lúc nào cũng có một khung mẫu. Với mong muốn hiện tại của bạn, behavior này không đúng nữa.

Nói đơn giản: trước đây preview lấy khung từ nguồn thật, giờ preview lấy khung từ nguồn giả. Nhưng cả hai đều vẫn làm preview hiện khung. Nếu mục tiêu bây giờ là **preview không có khung luôn**, thì cách đúng là bỏ hẳn nguồn khung khỏi preview route.

## Concrete Examples & Analogies
### Ví dụ cụ thể theo repo
- `app/system/experiences/product-detail/page.tsx` đang làm:
  - tạo `previewFrame`
  - truyền `previewFrame` vào `ProductDetailPreview`
- `ProductDetailPreview` nhận prop đó và render `ProductImageFrameOverlay`.
- Chỉ cần route preview không truyền `previewFrame`, thì overlay sẽ không còn gì để render.

### Analogy đời thường
Giống như mockup đang có một cái viền mẫu được designer gắn sẵn. Dù viền đó không còn lấy từ hệ thống thật, nó vẫn hiện vì chính mockup đã tự dán vào. Muốn sạch hẳn thì bỏ miếng dán đó đi.

## Files Impacted
1. `app/system/experiences/product-detail/page.tsx`
   - Vai trò hiện tại: chuẩn bị props cho preview.
   - Sửa: bỏ tạo `previewFrame` và ngừng truyền `previewFrame`/`constrainFrameToPreview` vào `ProductDetailPreview`.

2. `components/experiences/previews/ProductDetailPreview.tsx`
   - Vai trò hiện tại: nhận contract preview frame.
   - Sửa: giữ tương thích tối thiểu hoặc dọn prop `previewFrame` khỏi contract nếu chỉ còn product-detail preview dùng; ưu tiên thay đổi nhỏ nhất.

## Execution Preview
1. Đọc lại contract props giữa page preview và `ProductDetailPreview`.
2. Gỡ `previewFrame` khỏi `getPreviewProps()` ở route preview.
3. Nếu không còn nơi nào cần contract này, cân nhắc dọn props thừa trong `ProductDetailPreview`.
4. Static review để chắc preview không còn render khung nào.

## Đề xuất implement
### Option A (Recommend) — Bỏ hẳn frame khỏi product-detail preview
**Confidence 95%** vì đúng 100% với yêu cầu hiện tại: “Ẩn hoàn toàn khung trong preview”.

Cách làm:
- Xóa `previewFrame` local trong `app/system/experiences/product-detail/page.tsx`.
- Không truyền `previewFrame` vào `ProductDetailPreview` nữa.
- Có thể giữ `constrainFrameToPreview`/`previewFrame` props tạm thời để tránh lan scope, hoặc dọn luôn nếu chắc không còn dùng.

Tradeoff:
- Preview product-detail không còn minh họa frame nữa.
- Nhưng đổi lại đúng yêu cầu và tránh nhiễu UI.

### Option B — Thêm toggle ẩn/hiện frame trong preview
**Confidence 40%** chỉ phù hợp nếu sau này muốn bật lại frame trong editor.

Tradeoff:
- Thêm complexity không cần thiết.
- Trái với yêu cầu hiện tại là bỏ hẳn.

## Recommend
Chọn **Option A**: bỏ hoàn toàn frame khỏi preview product-detail. Đây là thay đổi nhỏ nhất, rõ nhất, và không ảnh hưởng site runtime.

## Acceptance Criteria
- Preview tại `/system/experiences/product-detail` không còn hiển thị khung đỏ lớn hoặc bất kỳ frame overlay nào.
- Đổi settings ở `/admin/settings/product-frames` không ảnh hưởng preview này.
- Site runtime `/products/[slug]` vẫn giữ nguyên logic frame hiện tại.

## Verification Plan
- Static verify: `getPreviewProps()` không còn truyền `previewFrame` cho `ProductDetailPreview`.
- Repro manual:
  1. Mở `/system/experiences/product-detail`.
  2. Xác nhận không còn khung đỏ lớn quanh preview image/card.
  3. Mở `/products/[slug]` để xác nhận site thật không bị ảnh hưởng.
- Nếu có đổi TS/code: chạy `bunx tsc --noEmit`.
- Không chạy lint/build theo rule repo.

## Out of Scope
- Đổi UX trang `/admin/settings/product-frames`.
- Refactor toàn bộ shared `ProductImageFrameOverlay`.
- Thay đổi behavior frame trên site thật.

## Risk / Rollback
- Risk thấp: chủ yếu là preview mất minh họa khung, nhưng đó là chủ đích.
- Rollback đơn giản: khôi phục việc truyền `previewFrame` từ route preview nếu sau này muốn bật lại.