## Audit Summary
- Observation:
  - Câu “cut text in half, then half again” xuất hiện phổ biến trong UX writing community; nguồn đáng tin cậy nhất liên quan là NN/g về concise/scannable writing và UX copy sizing.
  - GOV.UK/18F content guides cũng đồng thuận nguyên tắc viết ngắn, rõ, bỏ từ thừa, ưu tiên hiểu nhanh.
  - `AGENTS.md` hiện đã có UI/UX guardrails nhưng chưa có nguyên tắc riêng cho tối ưu độ ngắn của UI text/microcopy.
- Inference:
  - Có thể thêm 1 bullet nhẹ, tránh cực đoan “bắt buộc 50% + 50% mọi lúc”, vì có thể làm mất ngữ cảnh.
- Decision (theo user chọn):
  - Mức **nhẹ**, phạm vi **chỉ UI text/microcopy**.

## Root Cause Confidence
**High** — vì đã có evidence từ NN/g + GOV.UK/18F rằng concise/scannable/plain language giúp user hiểu nhanh hơn; đồng thời user chỉ muốn bổ sung nhẹ để tránh bloat.

## Proposal
Thêm đúng **1 bullet** vào section `UI/UX Design Guardrails (2026, practical)` trong cả `AGENTS.md` và `CLAUDE.md`:

- `Text economy (UI text/microcopy only): nếu rút gọn ~50% số chữ mà người dùng vẫn hiểu đúng ý thì rút; nếu vẫn rút tiếp mà không mất nghĩa thì rút tiếp.`

Ghi chú thực thi ngầm trong wording:
- Không áp dụng cho spec nội bộ, chỉ UI text/microcopy.
- Ưu tiên “giữ nghĩa + rõ hành động” hơn việc ép ngắn máy móc.

## Step-by-step Implementation Plan
1. Đọc `AGENTS.md` và `CLAUDE.md`, xác định section `UI/UX Design Guardrails (2026, practical)`.
2. Chèn 1 bullet mới ngay dưới `Clarity > Decoration` để giữ logic readability-first.
3. Mirror cùng bullet sang file còn lại theo Sync Rule.
4. Review diff để đảm bảo chỉ thêm 1 bullet, không phát sinh thay đổi ngoài scope.
5. Vì chỉ sửa markdown guideline: không chạy typecheck.
6. Stage + kiểm tra staged diff + commit local (không push), kèm `.factory/docs` nếu có.

## Verification Plan
- Kiểm tra 2 file đều có bullet mới và wording giống nhau.
- Xác nhận phạm vi trong bullet ghi rõ `UI text/microcopy only`.
- Xác nhận không đổi các section khác ngoài vị trí dự kiến.