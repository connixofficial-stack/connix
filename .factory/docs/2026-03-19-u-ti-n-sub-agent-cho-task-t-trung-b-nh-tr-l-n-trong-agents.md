## Audit Summary
- Observation: Tài liệu Factory xác nhận custom droids/subagents là cơ chế chính để delegate qua `Task`, có lợi ở 4 điểm: context isolation, tốc độ delegation, safety theo tool policy, và live progress (`custom-droids`, mục 2 và 6).
- Observation: `Task` nên dùng khi công việc non-trivial và có lợi từ parallel execution; ngược lại không nên dùng khi chỉ đọc 1 file, grep 1 pattern, hoặc sửa trong 1–10 file đã biết rõ.
- Observation: AGENTS.md hiện tại của repo rất mạnh về coding/risk/spec/verification nhưng chưa có guideline riêng để ép agent ưu tiên sub-agent nhằm tối đa hóa throughput.
- Observation: Factory docs nói AGENTS.md là briefing packet dùng trực tiếp để steer planning/tool selection của agent (`agents-md`, mục 8), nên thêm rule tại đây là đúng chỗ và có hiệu lực rộng.
- Decision: Chỉ sửa `AGENTS.md`, thêm một section ngắn nhưng mạnh về “Sub-agent Delegation” để agent chủ động spawn sub-agent cho task từ mức trung bình trở lên; không thêm guardrail tiết chế vì bạn ưu tiên tốc độ tối đa.

## Root Cause Confidence
**High** — Lý do chính không phải thiếu tính năng Factory mà là thiếu policy cấp repo buộc agent ưu tiên dùng sub-agent. Evidence: docs đã có đầy đủ custom droids + `Task`; repo hiện chưa encode chiến lược delegation trong `AGENTS.md`, nên agent mặc định vẫn dễ làm tuần tự.

## TL;DR kiểu Feynman
- Factory đã có sẵn “nhân bản trợ lý” bằng custom droid + `Task`.
- Repo này chưa nói rõ “khi nào phải gọi trợ lý phụ”, nên agent vẫn hay tự làm tuần tự.
- Ta sẽ thêm rule: task từ mức trung bình trở lên phải ưu tiên tách và giao việc cho sub-agent.
- Vì bạn ưu tiên tốc độ hơn chi phí, rule sẽ nghiêng mạnh về song song hóa sớm.
- Nhưng vẫn giữ một ngoại lệ nhỏ: việc cực nhỏ, rất rõ, 1 bước thì làm trực tiếp cho nhanh hơn.

## Proposal
Thêm một section mới trong `AGENTS.md`, ngay gần phần operating/execution rules, với nội dung theo tinh thần sau:

1. **Nguyên tắc ưu tiên delegation**
   - Với task từ mức trung bình trở lên, ưu tiên dùng sub-agent trước khi tự xử lý tuần tự.
   - Mục tiêu tối ưu là wall-clock time, không tối ưu chi phí token.
   - Chấp nhận chiến lược “tốn thêm ~80 để nhanh thêm ~20” nếu giúp giảm thời gian chờ của user.

2. **Khi nào bắt buộc cân nhắc Task/sub-agent**
   - Khi có thể chia research song song.
   - Khi cần audit nhiều hướng/ nhiều khu vực code.
   - Khi có thể tách discovery và implementation planning.
   - Khi có nhiều candidate files/modules cần rà soát.
   - Khi cần một worker chuyên review/verify độc lập cho kết quả của worker khác.

3. **Rule ưu tiên custom droid có sẵn**
   - Trước khi tự làm task non-trivial, phải kiểm tra custom droids sẵn có trong project/personal.
   - Nếu có droid phù hợp, ưu tiên gọi droid đó qua `Task` thay vì tự ôm toàn bộ context.
   - Nếu chưa có droid thật sự phù hợp thì mới tự xử lý hoặc đề xuất tạo droid ở task khác.

4. **Chiến lược orchestration thực dụng**
   - Spawn nhiều sub-agent song song cho exploration/research/review nếu các nhánh độc lập.
   - Giữ agent chính làm vai trò coordinator: tổng hợp evidence, resolve conflict, ra quyết định cuối.
   - Dùng sub-agent để giảm context bloat cho main thread.

5. **Ngoại lệ tối thiểu**
   - Không cần sub-agent cho việc cực nhỏ, một bước, hoặc khi chỉ cần thao tác trực tiếp trên vài file đã biết rõ và không có lợi từ song song.
   - Vì bạn chọn “không guardrail, ưu tiên tốc độ tối đa”, ngoại lệ sẽ được viết ngắn để không làm agent ngại delegate.

6. **Câu chữ guideline đề xuất**
   - Có thể thêm 1 block dạng rule ngắn, mệnh lệnh rõ ràng, ví dụ:
     - “Ưu tiên dùng sub-agent cho mọi task từ mức trung bình trở lên; tối ưu wall-clock time hơn token cost.”
     - “Nếu có thể chia song song discovery/research/review thì phải cân nhắc `Task` trước.”
     - “Luôn kiểm tra custom droids hiện có trước; nếu có droid phù hợp thì ưu tiên dùng ngay.”
     - “Main agent là coordinator, sub-agent là workers; không ôm toàn bộ non-trivial task theo kiểu tuần tự nếu có thể tách nhánh.”

## Files Impacted
- **Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\AGENTS.md`**  
  Vai trò hiện tại: file policy gốc điều khiển cách agent plan/execute/verify trong repo.  
  Thay đổi: thêm guideline ngắn, rõ, thiên mạnh về ưu tiên sub-agent cho task từ mức trung bình trở lên, không thêm guardrail kiềm chế.

## Execution Preview
1. Đọc lại `AGENTS.md` để chọn vị trí đặt section mới sao cho hợp logic với các rule hiện tại.
2. Chèn section mới về `Sub-agent Delegation` hoặc tương đương, dùng câu mệnh lệnh ngắn, ưu tiên tốc độ.
3. Soát wording để không mâu thuẫn với các rule hiện có về KISS, scope control, evidence, spec mode.
4. Review tĩnh lần cuối để bảo đảm guideline đủ mạnh để thay đổi hành vi agent nhưng vẫn ngắn gọn.

## Acceptance Criteria
- `AGENTS.md` có rule rõ ràng rằng task từ mức trung bình trở lên phải ưu tiên sub-agent/delegation.
- Rule nêu rõ ưu tiên wall-clock time hơn token cost.
- Rule yêu cầu kiểm tra custom droids hiện có trước khi tự ôm task non-trivial.
- Rule vẫn giữ ngoại lệ tối thiểu cho task cực nhỏ/đơn giản.
- Nội dung thêm vào ngắn, dễ quét, không làm loãng các guideline lõi hiện tại.

## Verification Plan
- Verification tĩnh bằng cách đọc lại diff của `AGENTS.md` để kiểm tra: có đủ 4 ý bắt buộc (ưu tiên sub-agent, speed > cost, check droids first, ngoại lệ tối thiểu) hay chưa.
- Không chạy lint/test/build vì yêu cầu repo cấm tự chạy và thay đổi chỉ là guideline markdown.
- Repro/behavioral expectation sau khi áp dụng: ở các task tương lai có scope từ trung bình trở lên, agent sẽ ưu tiên tìm droid phù hợp và dùng `Task` sớm hơn thay vì làm tuần tự.

## Out of Scope
- Không sửa `CLAUDE.md` trong spec này vì user chỉ yêu cầu chỉnh `AGENTS.md`.
- Không tạo mới custom droids.
- Không thêm hooks/settings/missions config.

## Risk / Rollback
- Risk: guideline quá mạnh có thể làm agent delegate nhiều hơn mức cần thiết ở một số task.
- Lý do vẫn chấp nhận: đây đúng với ưu tiên của bạn là tối đa tốc độ, chấp nhận tăng cost.
- Rollback: chỉ cần revert block guideline mới trong `AGENTS.md`, impact nhỏ và dễ đảo ngược.