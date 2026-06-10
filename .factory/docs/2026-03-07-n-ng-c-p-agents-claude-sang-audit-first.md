## Problem Graph
1. Nâng cấp guideline để dùng “Audit” làm chuẩn trước khi fix/root-cause/spec  
   <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 Chuẩn hóa ngôn ngữ và thứ tự tư duy (Audit-first nhưng vẫn giữ fix/debug)  
   1.2 Bổ sung câu hỏi gợi mở thông minh để mở rộng đánh giá trước khi chốt Root Cause  
   1.3 Tăng sức nặng Spec Mode: audit trước/sau root cause + giả thuyết đối chứng  
   1.4 Đồng bộ AGENTS.md và CLAUDE.md để tránh context drift

## Execution (with reflection)
1. Solving 1.1 — Audit-first wording contract
- Thought: Giữ “fix/debug” để không phá thói quen, nhưng ép thứ tự: Audit -> Root Cause -> Fix/Proposal -> Verify.
- Action (sẽ sửa cùng nội dung ở 2 file):
  - Thêm mục mới **"Audit-First Operating Rule"** ngay sau phần Custom Rule.
  - Nội dung cốt lõi:
    - Không đề xuất fix ngay khi chưa audit đủ evidence.
    - Mọi kết luận phải có evidence (log, code path, repro, metric, history).
    - Nếu thiếu evidence: nêu gap + cách lấy evidence.
  - Thêm “trigger wording” để agent tự kích hoạt audit khi gặp từ: `fix`, `bug`, `lỗi`, `root cause`, `spec`, `optimize`, `refactor`.
- Reflection: ✓ Cân bằng giữa thực dụng và guardrail, không over-engineer.

2. Solving 1.2 — Smart Audit Questions (gợi mở)
- Thought: User muốn câu hỏi thông minh mở rộng đánh giá trước Root Cause, nên cần checklist ngắn, có thứ tự ưu tiên.
- Action (sẽ thêm mục **"Audit Questions (Ask Before Root Cause)"**):
  - 8 câu hỏi chuẩn để soi đủ bối cảnh trước chốt nguyên nhân:
    1) Triệu chứng quan sát được là gì (expected vs actual)?
    2) Phạm vi ảnh hưởng (user, module, môi trường)?
    3) Có tái hiện ổn định không? điều kiện tái hiện tối thiểu?
    4) Mốc thay đổi gần nhất (commit/config/dependency/data)?
    5) Dữ liệu nào đang thiếu để kết luận chắc chắn?
    6) Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
    7) Rủi ro nếu fix sai nguyên nhân là gì?
    8) Tiêu chí pass/fail sau khi sửa?
  - Quy tắc dùng: trước khi kết luận root cause phải trả lời tối thiểu 5/8 câu, trong đó bắt buộc có #1, #3, #6, #8.
- Reflection: ✓ “Thông minh gợi mở” nhưng vẫn ngắn, dùng được hằng ngày.

3. Solving 1.3 — Spec Mode hardening (mức VỪA theo bạn chọn)
- Thought: Cần tăng chặt chẽ trong spec mode nhưng không biến thành quy trình nặng.
- Action (sẽ cập nhật phần Spec Mode Rules ở 2 file):
  - Bắt buộc flow: **Pre-Audit -> Root Cause -> Counter-Hypothesis Check -> Proposal -> Post-Audit**.
  - **Pre-Audit**: liệt kê evidence đã có/chưa có + kế hoạch lấp gap.
  - **Counter-Hypothesis Check**: nêu ít nhất 1 giả thuyết đối chứng và vì sao bị loại.
  - **Post-Audit trước khi chốt spec**:
    - Kiểm tra blast radius (ảnh hưởng ngoài phạm vi),
    - kiểm tra regression risk,
    - kiểm tra chi phí/độ phức tạp theo KISS/YAGNI/DRY.
  - Output spec phải có thêm 3 block cố định:
    - `Audit Summary`
    - `Root Cause Confidence (High/Medium/Low + reason)`
    - `Verification Plan (typecheck/test/repro)`
- Reflection: ✓ Đúng mức “Vừa”: có guardrail, có đối chứng, không quá nặng như risk matrix full.

4. Solving 1.4 — Đồng bộ AGENTS.md và CLAUDE.md
- Thought: Tránh lệch chỉ dẫn do file kép.
- Action:
  - Áp cùng patch logic cho:
    - `E:/NextJS/persional_project/system-nhan/AGENTS.md`
    - `E:/NextJS/persional_project/system-nhan/CLAUDE.md`
  - Thêm mục nhỏ **"Sync Rule"**: khi sửa một file guideline cốt lõi thì phải mirror file còn lại trong cùng task.
- Reflection: ✓ Giảm drift, tăng tính ổn định khi agent đọc context.

## Nội dung cụ thể sẽ được thêm/sửa (tóm tắt theo section)
- **Custom Rule**: thêm Audit-first operating rule.
- **Problem-Solving Framework (DARE)**: nâng thành DARE+A (A = Audit), nhưng giữ tương thích tên DARE cũ bằng ghi chú “Audit là gate ở trước Analyze và trước Execute proposal”.
- **Spec Mode Rules**: thêm pre-audit, counter-hypothesis, post-audit bắt buộc.
- **Prompt Best Practices**: thêm 1 bullet “mọi đề xuất phải gắn evidence + confidence”.
- **Output Format**: thêm template ngắn cho Audit Summary + Confidence + Verification.

## Best-practice basis dùng để thiết kế spec này
- Agent orchestration/guardrails: ưu tiên evidence-based completion, explicit verification gates, tránh context drift.
- Prompt 2026 patterns: ngắn gọn, output contract rõ, có self-check trước kết luận.
- AGENTS.md ecosystem trend: chuẩn hóa instruction file, giảm stale rule bằng đồng bộ và checklist.

## Checklist triển khai (1 lần, không chia phase)
- [ ] Cập nhật AGENTS.md với 4 khối mới: Audit-First Rule, Audit Questions, Spec Mode hardening, Output contract.
- [ ] Mirror chính xác sang CLAUDE.md.
- [ ] Soát consistency ngôn ngữ (giữ fix/debug, nhưng Audit-first).
- [ ] Verify không mâu thuẫn với KISS/YAGNI/DRY và rule hiện có.
- [ ] (Khi được duyệt và thực thi) chạy `bunx tsc --noEmit` nếu có thay đổi code/TS; với task chỉ sửa guideline thì không cần.
- [ ] Commit local theo rule repo (không push), kèm `.factory/docs` nếu có file phát sinh ở đó.

Nếu bạn duyệt spec này, tôi sẽ implement đúng các bước trên và giữ patch tối giản, đồng bộ cả AGENTS.md + CLAUDE.md.