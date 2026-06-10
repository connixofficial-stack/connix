## Audit Summary
- Bạn muốn bỏ quy tắc: “trước khi hoàn tất task luôn verify lint/typecheck/unit tests…”.
- Bạn muốn mình tập trung đọc code kỹ để tránh lỗi từ gốc, còn test/verify giao cho tester, không tự chạy.
- Bạn cũng muốn một triết lý ngắn gọn để thêm vào `AGENTS.md`.

## Root Cause Confidence
High — yêu cầu đã rõ: ưu tiên chất lượng qua code review tĩnh, bỏ bước chạy test/lint tự động của agent.

## Proposal

### 1) Cập nhật nguyên tắc vận hành của agent (theo yêu cầu)
Thêm vào `AGENTS.md` một block kiểu:

- **Static-first quality**: ưu tiên đọc code kỹ, bám pattern hiện có, thiết kế đơn giản, hạn chế bug từ lúc viết.
- **No auto test execution by agent**: agent không tự chạy lint/typecheck/unit test trừ khi user yêu cầu rõ ràng.
- **Tester-owned verification**: kiểm thử runtime/integration do tester đảm nhiệm.
- **Self-review bắt buộc trước khi trả kết quả**: agent tự soát diff theo checklist (typing, null-safety, edge cases, backward compatibility, data migration).

### 2) Mẫu triết lý để thêm vào AGENTS.md
Bạn có thể thêm nguyên văn (ngắn gọn):

> **Clean-by-construction**: Chất lượng đến từ thiết kế và code sạch ngay từ đầu. Agent ưu tiên phân tích tĩnh, bám convention, tự review kỹ trước khi bàn giao. Không tự chạy lint/typecheck/test trừ khi user yêu cầu; verification runtime do tester phụ trách.

### 3) Trade-off cần chấp nhận
- Lợi: nhanh hơn, ít tốn thời gian CI cục bộ, tập trung vào chất lượng thiết kế/code.
- Rủi ro: có thể bỏ sót lỗi chỉ lộ khi chạy thực tế (regression/runtime/env-specific).
- Giảm rủi ro bằng checklist self-review chặt trước commit.

## Khuyến nghị
- **Chọn Option A**: vẫn giữ self-review tĩnh nghiêm ngặt + không chạy test tự động (đúng ý bạn), nhưng không cực đoan như Option B.
- Option B chỉ hợp khi team chấp nhận rủi ro runtime cao hơn và có quy trình tester rất mạnh.

## Verification Plan
- Không sửa code ở bước này.
- Khi bạn chọn option, mình sẽ chuẩn bị patch cập nhật `AGENTS.md` đúng wording bạn muốn (và mirror sang `CLAUDE.md` theo Sync Rule).