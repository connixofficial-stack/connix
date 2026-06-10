## Audit Summary
- Observation: Trong `.factory/docs` vẫn còn rất nhiều spec chứa từ khóa `harmony`.
- Observation: 3 file spec ngày `2026-03-08` (bao gồm file “xóa toàn bộ harmony…”) đều còn nội dung `harmony` dày đặc.
- Inference: Việc “bỏ harmony trong spec” **chưa xong** nếu mục tiêu là làm sạch nội dung spec hiện tại.

## Root Cause Confidence
- High — bằng chứng trực tiếp từ grep trong `E:\NextJS\persional_project\system-nhan\.factory\docs` và đọc chi tiết 3 file spec mới nhất.

## Trả lời ngắn gọn câu hỏi của bạn
**Chưa xong.** Spec trong `.factory/docs` vẫn còn `harmony`, đặc biệt:
- `2026-03-08-ho-n-t-t-x-a-harmony-cho-to-n-b-home-components.md`
- `2026-03-08-x-a-to-n-b-harmony-kh-i-admin-home-components.md`
- `2026-03-08-fix-build-career-default-harmony-export.md`

## Proposal (nếu bạn muốn mình làm tiếp ngay)
1. Xác định phạm vi: chỉ xóa trong 3 file ngày 2026-03-08 hay toàn bộ `.factory/docs`.
2. Rewrite nội dung spec theo thuật ngữ mới (không dùng `harmony`) nhưng giữ nguyên ý kỹ thuật.
3. Verify lại bằng grep để đảm bảo không còn `harmony` trong phạm vi đã chọn.

## Verification Plan
- Chạy grep lại trong phạm vi bạn chọn để xác nhận số match = 0 (trừ file lịch sử bạn muốn giữ nguyên).