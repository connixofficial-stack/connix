## Audit Summary
- Observation: Preview `/system/experiences/product-detail` đang luôn nhận `previewFrame` mẫu từ `app/system/experiences/product-detail/page.tsx`, nên vẫn hiện khung đỏ lớn.
- Observation: `ProductDetailPreview` lấy `previewFrame` làm nguồn frame để render overlay ở các block ảnh.
- User goal: **Ẩn hoàn toàn khung trong preview**.

## Root Cause Confidence
**High** — nguyên nhân trực tiếp là route preview đang tự tạo và truyền `previewFrame` mẫu vào preview.

## TL;DR kiểu Feynman
- Preview tự gắn khung mẫu nên lúc nào cũng hiện.
- Muốn bỏ thì đừng truyền khung vào preview nữa.
- Site thật không bị ảnh hưởng vì chỉ sửa preview.

## Elaboration & Self-Explanation
Lần trước để tránh “ăn theo” settings thật, preview được chuyển sang dùng frame local. Điều đó vẫn khiến preview có khung. Bây giờ yêu cầu mới là **ẩn hoàn toàn**, nên cần bỏ nguồn frame ở route preview để overlay không còn dữ liệu để render.

## Concrete Examples & Analogies
- `page.tsx` tạo `previewFrame` → `ProductDetailPreview` nhận `previewFrame` → `ProductImageFrameOverlay` render khung. Bỏ `previewFrame` thì khung biến mất.
- Analogy: mockup tự dán viền mẫu; muốn sạch thì tháo viền ra.

## Files Impacted
1. `app/system/experiences/product-detail/page.tsx`
   - Sửa: bỏ tạo và truyền `previewFrame`/`constrainFrameToPreview` trong `getPreviewProps()`.
2. `components/experiences/previews/ProductDetailPreview.tsx`
   - Sửa: dọn prop `previewFrame`/`constrainFrameToPreview` nếu không còn dùng (ưu tiên thay đổi nhỏ nhất).

## Execution Preview
1. Gỡ `previewFrame` khỏi `getPreviewProps()` ở route preview.
2. Dọn prop thừa trong `ProductDetailPreview` nếu cần.
3. Rà lại preview để chắc không còn render overlay.

## Đề xuất implement
### Option A (Recommend) — Bỏ hẳn frame khỏi product-detail preview
**Confidence 95%**
- Xóa `previewFrame` local trong `page.tsx`.
- Không truyền `previewFrame` vào `ProductDetailPreview`.
- (Tùy scope) dọn props `previewFrame`/`constrainFrameToPreview` trong preview component.

### Option B — Thêm toggle ẩn/hiện frame trong preview
**Confidence 40%**
- Không phù hợp với yêu cầu hiện tại, tăng complexity.

## Recommend
Chọn **Option A** để preview không còn khung đỏ lớn.

## Acceptance Criteria
- Preview `/system/experiences/product-detail` không còn khung/overlay.
- Settings `/admin/settings/product-frames` không ảnh hưởng preview.
- Site runtime `/products/[slug]` giữ nguyên behavior.

## Verification Plan
- Static verify: `getPreviewProps()` không còn `previewFrame`.
- Manual: mở preview, xác nhận không còn khung; kiểm tra site thật.
- Nếu có đổi TS/code: chạy `bunx tsc --noEmit`.

## Out of Scope
- Không đổi UX settings product-frames.
- Không đổi behavior frame ở site thật.

## Risk / Rollback
- Risk thấp: preview mất minh họa khung (đúng yêu cầu).
- Rollback: khôi phục `previewFrame` nếu cần.