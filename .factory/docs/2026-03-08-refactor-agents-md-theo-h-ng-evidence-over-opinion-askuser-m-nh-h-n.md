## Audit Summary
- Evidence đã có:
  - `AGENTS.md` hiện tại bị trùng ý giữa `Audit-First Operating Rule`, `Prompt Best Practices`, `DARE`, `Audit Questions`, và `Spec Mode Rules`.
  - User muốn: tăng sức mạnh nhưng không dài dòng; thêm triết lý `Evidence over Opinion`; tối ưu `AskUser` để tránh option tệ/vô nghĩa; thêm `%` và lý do cho option recommend.
  - User đã chốt hướng: **refactor mạnh**, **Confidence % + Recommend reason**, phong cách **cân bằng giữa chặt chẽ và linh hoạt**.
- Nguồn tham chiếu uy tín đã dùng:
  - Anthropic prompt engineering docs: nhấn mạnh clarity, structured outputs, success criteria, verification.
  - Cursor agent/rules best practices: rule nên ngắn, scoped, tránh trùng, dễ scan.
  - AGENTS.md OSS examples/standard: nhấn mạnh conventions, verification, predictable agent behavior.
- Gap đã xác định:
  - Thiếu 1 contract rõ ràng để phân biệt fact vs inference.
  - Thiếu template AskUser chất lượng cao để buộc option có tradeoff thật.
  - Thiếu rule chống “false choice” kiểu option tệ vẫn đem ra hỏi.
  - Bố cục hiện tại dài và overlap, làm giảm signal-to-noise.

## Root Cause Confidence
**High** — vì evidence trong file hiện tại cho thấy nhiều section lặp nhau về audit/evidence/spec/ask user, trong khi yêu cầu mới của user lại cần 1 rule set ngắn, sắc, thực dụng hơn. Các best practices từ Anthropic/Cursor cũng cùng hướng: rõ ràng, có tiêu chí thành công, có verify, tránh prompt bloat.

## Problem Graph
1. AGENTS.md chưa tối ưu cho quyết định chất lượng cao <- depends on 1.1, 1.2, 1.3
   1.1 Trùng lặp giữa các section audit/spec/prompt <- depends on 1.1.1
      1.1.1 ROOT CAUSE: rule đang tăng theo kiểu cộng dồn, chưa được chuẩn hóa thành contract ngắn gọn
   1.2 AskUser chưa có rubric bắt buộc để loại option yếu
   1.3 Thiếu triết lý Evidence over Opinion ở mức section riêng, dễ làm rule bị chìm trong audit chung

## Counter-Hypothesis Check
- Giả thuyết đối chứng: “Không cần viết lại mạnh, chỉ thêm vài bullet là đủ.”
- Lý do loại: cách này tiếp tục làm file dài hơn và giữ nguyên overlap cũ; trái với mục tiêu DRY/KISS và mong muốn của user là viết lại bố cục gọn hơn từ đầu.

## Proposal
Mình sẽ **viết lại bố cục AGENTS.md ngắn gọn hơn từ đầu**, nhưng vẫn giữ các ý cốt lõi đang hữu ích. Đồng thời mirror sang `CLAUDE.md` theo sync rule.

### Cấu trúc AGENTS.md mới dự kiến
1. **Core Operating Principles**
   - Trả lời tiếng Việt có dấu.
   - KISS, YAGNI, DRY.
   - Convention over Configuration.
   - Không mở rộng scope ngoài yêu cầu.
   - Ưu tiên thay đổi nhỏ, dễ rollback.

2. **Evidence over Opinion**
   - Tách bạch `Observation` / `Inference` / `Decision`.
   - Mọi kết luận phải có evidence: log, file path, line, command output, repro, history.
   - Thiếu evidence thì nêu rõ gap + cách lấy evidence; không phỏng đoán như fact.
   - Khi có nhiều hướng hợp lý: nêu confidence High/Medium/Low + reason ngắn.

3. **Audit & Root Cause Protocol**
   - Khi gặp fix/bug/lỗi/root cause/spec/optimize/refactor: bắt buộc Audit → Root Cause → Fix/Proposal → Verify.
   - Rút gọn 8 câu hỏi audit hiện tại thành checklist ngắn, giữ các câu bắt buộc (#1 #3 #6 #8) và gom các câu khác theo cụm để đỡ dài.
   - Giữ DARE nhưng nén lại thành playbook rất ngắn:
     - Audit
     - Decompose
     - Analyze
     - Reflect
     - Execute
   - Chỉ giữ format output khi thật cần phân tích phức tạp; tránh bắt buộc mọi task phải dài.

4. **Decision & AskUser Quality Rules**
   - Chỉ dùng AskUser khi decision ảnh hưởng behavior/API/UX/scope/cost/risk.
   - Không hỏi các option vô nghĩa hoặc clearly dominated.
   - Cấm đưa “false choice”: nếu 1 option vừa kém hơn vừa đắt/rủi ro hơn option khác mà không có upside thật, không được đưa vào.
   - Mỗi option phải có format:
     - `Tên option`
     - `Confidence XX%`
     - `(lý do ngắn)`
   - Option `(Recommend)` phải kèm lý do rõ: vì sao tốt hơn trong ngữ cảnh hiện tại, tradeoff là gì, bằng chứng nào trong repo/yêu cầu hỗ trợ nhận định đó.
   - Nếu có option không recommend nhưng vẫn đáng giữ, phải nêu rõ nó phù hợp khi nào.
   - Ưu tiên 2–4 option thật sự khác nhau về tradeoff, không đổi tên bề mặt.
   - Nếu chỉ có 1 hướng hợp lý rõ ràng, không nên hỏi; tự tiến hành hoặc nêu quyết định luôn.

5. **Spec Mode Rules**
   - Ở spec mode: Pre-Audit → Root Cause → Counter-Hypothesis → Proposal → Post-Audit.
   - Spec phải actionable từng bước, file nào đổi gì, logic gì.
   - Lưu spec ở `.factory/docs`.
   - Output spec bắt buộc có 3 block:
     - `Audit Summary`
     - `Root Cause Confidence`
     - `Verification Plan`
   - Phần AskUser chi tiết sẽ không lặp lại ở đây, mà tham chiếu sang section `Decision & AskUser Quality Rules`.

6. **Execution & Verification Rules**
   - Với localhost URL: đọc route Next.js tương ứng, không hỏi lại.
   - Khi đổi code/TS: trước commit chỉ chạy `bunx tsc --noEmit` theo project rule.
   - Khi chỉ sửa docs/cấu hình không liên quan code/TS: không chạy typecheck.
   - Mọi thay đổi hoàn thành phải commit, không push.
   - Khi commit phải add cả `.factory/docs` nếu có.

7. **Sync Rule**
   - Nếu đổi guideline cốt lõi ở AGENTS.md thì mirror sang CLAUDE.md trong cùng task.

8. **DB Bandwidth Optimization**
   - Giữ nguyên tinh thần 7 nguyên tắc hiện có nhưng nén wording cho scan nhanh hơn, tránh lặp giải thích dài.

### Nội dung mới sẽ được thêm rõ ràng
- Một section riêng tên gần như: `Evidence over Opinion`.
- Một section riêng cho `AskUser Quality` với rule chống dominated options / false choices.
- Cú pháp option đề xuất sẽ theo style gần như:
  - `Option A (Recommend) — Confidence 85% (phù hợp scope hiện tại, ít blast radius nhất)`
  - `Option B — Confidence 55% (linh hoạt hơn nhưng complexity cao hơn, chưa có evidence cần thiết)`
- Mục tiêu là buộc reasoning của recommend option có chất lượng, định lượng vừa đủ nhưng không rườm rà.

## Step-by-step Implementation Plan
1. Đọc lại `AGENTS.md` và `CLAUDE.md` lần cuối để map các rule cũ nào cần giữ nguyên, rule nào sẽ gộp/xóa.
2. Viết lại `AGENTS.md` theo bố cục mới, ưu tiên section ngắn, scan nhanh, không lặp ý.
3. Tạo section mới `Evidence over Opinion` với contract fact/inference/decision + confidence.
4. Viết section `Decision & AskUser Quality Rules` với:
   - rule chỉ hỏi khi decision thật sự cần user chọn,
   - rule cấm false choice,
   - format option có `Confidence %` và `(lý do)`,
   - hướng dẫn `(Recommend)` phải giải thích vì sao tốt hơn.
5. Rút gọn và hợp nhất các phần `Audit-First`, `DARE`, `Audit Questions`, `Prompt Best Practices`, `Spec Mode Rules` để tránh overlap.
6. Rút gọn section DB optimization để giữ signal cao nhưng không mất ý chính.
7. Mirror toàn bộ guideline cốt lõi vừa viết sang `CLAUDE.md` để tránh context drift.
8. Review diff để đảm bảo wording ngắn, không tạo rule mâu thuẫn nhau, và không lặp ý giữa các section.
9. Vì đây là thay đổi markdown/guideline, không chạy typecheck nếu không đụng code TS; sau đó commit theo rule dự án.

## Post-Audit
- Blast radius: thấp, chỉ ảnh hưởng instruction quality của agent chứ không ảnh hưởng runtime app.
- Regression risk: thấp đến trung bình; rủi ro chính là wording quá cứng làm agent hỏi ít quá hoặc quá verbose. Cách giảm rủi ro: giữ wording cân bằng, thực dụng, không cực đoan.
- Cost/complexity: thấp; lợi ích cao vì giảm trùng lặp và tăng chất lượng quyết định.

## Verification Plan
- Soát lại 2 file `AGENTS.md` và `CLAUDE.md` để xác nhận mirror đúng các guideline cốt lõi.
- Kiểm tra thủ công 4 tiêu chí:
  1. Không còn overlap lớn giữa audit/spec/ask user.
  2. Có section riêng `Evidence over Opinion`.
  3. Có rule chống option dominated/false choice.
  4. Recommend option có `Confidence %` + lý do trong format guideline.
- Nếu chỉ sửa markdown/guideline: không chạy `bunx tsc --noEmit` theo rule hiện tại.
- Sau khi verify, commit local, không push.