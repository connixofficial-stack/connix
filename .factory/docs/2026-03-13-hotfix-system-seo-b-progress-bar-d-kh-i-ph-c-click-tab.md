## Audit Summary

### Observation
1. **Có 2 progress bar** vì đang render ở 2 nơi:
   - `app/system/seo/_components/SeoOverviewSummary.tsx` (sticky summary) có progress.
   - `components/seo/SeoHealthPanel.tsx` cũng có progress.
2. **Tab Tổng quan / Việc cần làm / Landing Pages không ấn được** do sticky summary đang phủ lớp click:
   - `SeoOverviewSummary.tsx` dùng `className="sticky top-4 z-10 ..."`.
   - Tab bar ở `app/system/seo/page.tsx` không có z-index cao hơn, nên có thể bị block tương tác khi overlap.

### Root Cause Confidence
**High** — Có evidence trực tiếp từ class `z-10 sticky` + 2 block progress riêng biệt.

## Proposal (thay đổi tối thiểu)
1. **Bỏ 1 progress bar**: giữ progress trong `SeoOverviewSummary`, xóa block progress trong `SeoHealthPanel` (chỉ giữ title + tabs category + list item).
2. **Khôi phục click tab cấp trang**:
   - Giảm/loại z-index của sticky summary (`z-10` -> `z-0` hoặc bỏ z-index).
   - Hoặc tăng z-index tab bar trang (`relative z-20`) để đảm bảo tab luôn nhận click.
   - Em đề xuất làm cả 2 nhẹ nhàng: summary không chiếm ưu tiên click + tab có z-index rõ ràng.
3. Không đổi logic data/checklist, chỉ fix UI layering và duplicate progress.

## Verification Plan
- Mở `http://localhost:3000/system/seo`:
  1. Xác nhận chỉ còn **1** progress bar.
  2. Click được 3 tab: Tổng quan / Việc cần làm / Landing Pages.
  3. Trong SEO Checklist Center vẫn chuyển tab category nội bộ bình thường.

Nếu anh duyệt, em sẽ sửa đúng 3 file liên quan UI và không đụng logic khác.