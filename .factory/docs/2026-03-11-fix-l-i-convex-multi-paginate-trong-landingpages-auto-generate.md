## Audit Summary
- **Observation:** Lỗi runtime xảy ra tại `convex/landingPages.ts` trong `previewProgrammaticPlan` (và cùng pattern ở `upsertProgrammaticFromModules`) do gọi nhiều `paginate()` trong cùng 1 mutation.
- **Evidence:** Error log: `Convex only supports a single paginated query in each function` + code hiện tại đang gọi 4 `paginate()` (`products/services/posts/homeComponents`) trong cùng function.
- **Inference:** Đây là vi phạm giới hạn runtime của Convex, không phải lỗi dữ liệu hay UI.
- **Decision:** Theo yêu cầu của bạn, chọn hướng nhanh: thay toàn bộ `paginate()` bằng `collect()` rồi `slice(0,6)`, đồng thời refactor gọn để mở rộng sau này.

## Root Cause Confidence
- **High** — Root cause rõ ràng, có stack trace và vị trí code khớp chính xác; không có giả thuyết thay thế hợp lý hơn.

## Implementation Proposal
1. **Refactor nguồn dữ liệu trong `convex/landingPages.ts`**
   - Tạo helper nội bộ dùng chung cho 2 mutation:
     - lấy modules enabled bằng index + `collect()`
     - lấy products/services/posts/homeComponents bằng index + `collect()`
     - áp `slice(0,6)` ở lớp mapping output.
2. **Loại bỏ toàn bộ `paginate()` khỏi `previewProgrammaticPlan` và `upsertProgrammaticFromModules`**
   - Giữ nguyên schema trả về và hành vi business hiện tại (không đổi output contract với frontend).
3. **Refactor sạch để mở rộng**
   - Tránh lặp logic fetch giữa 2 mutation bằng 1 hàm `getProgrammaticSeedData(ctx)`.
   - Gom mapping dữ liệu thành object chuẩn cho `buildProgrammaticLandingPlan`.
4. **Không đổi scope ngoài yêu cầu**
   - Không thay UI, không đổi copy SEO, không thay rule publish/draft hiện tại.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`.
- Repro thủ công:
  1) Vào `/admin/landing-pages` bấm “Xem trước auto” -> không còn lỗi multi-paginate.
  2) Bấm “Tạo tự động” -> mutation chạy thành công.
  3) Đảm bảo số liệu trả về (`create/update/total/byType`) vẫn đúng format như cũ.