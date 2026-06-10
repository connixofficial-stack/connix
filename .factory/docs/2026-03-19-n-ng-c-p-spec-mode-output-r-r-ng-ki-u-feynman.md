## Audit Summary
- Observation: `AGENTS.md` hiện đã có khung tốt cho spec mode: bắt buộc Audit/Root Cause, 3 block output, và yêu cầu plan phải nêu file đổi gì. Tuy nhiên phần này vẫn còn thiên về "quy tắc cho agent" hơn là "định dạng output cho người đọc", nên spec có thể đúng nhưng chưa đủ dễ hiểu.
- Observation: Tài liệu Factory về Specification Mode nhấn mạnh các điểm: read-only analysis trước khi sửa, file-by-file breakdown, acceptance criteria, verification plan, chia phase cho feature lớn, và approval workflow rõ ràng.
- Observation: Tài liệu `How to Talk to a Droid` + `AGENTS.md` best practices đều nhấn mạnh: prompt/spec càng cụ thể, boundary càng rõ, verification càng rõ thì kết quả càng tốt.
- Inference: Vấn đề chính không phải thiếu rule, mà thiếu một "spec presentation contract" đủ cụ thể để mọi spec đều trình bày theo kiểu dễ đọc, dễ duyệt, dễ quyết định.
- Decision: Nên bổ sung một section riêng cho cách trình bày spec output theo kiểu Feynman + file-by-file + execution preview, thay vì chỉ tăng rule chung chung.

## Root Cause Confidence
High — vì evidence từ `AGENTS.md` cho thấy đã có rule về quy trình nhưng chưa có template output chi tiết cho người dùng; docs Factory cũng xác nhận spec mode mạnh nhất khi có acceptance criteria, file breakdown, verification, phase planning và boundary rõ.

## Đề xuất

### Option A - Chuẩn đầy đủ (khuyên dùng)
Mục tiêu: biến spec mode thành format "người không cần đọc code vẫn hiểu sắp làm gì".

#### File sẽ chỉnh
1. `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/AGENTS.md`
   - Thêm hoặc mở rộng section `# Spec Mode Rules`.
   - Nội dung sơ lược sẽ thêm:
     - mẫu output spec bắt buộc, dễ scan;
     - phần `TL;DR kiểu Feynman` 5-10 dòng;
     - phần `Files Impacted` chỉ rõ: sửa file nào / thêm file nào / vì sao / nội dung sơ lược;
     - phần `Execution Preview` mô tả agent sẽ làm theo thứ tự nào;
     - phần `Out of Scope` để chặn scope creep;
     - phần `Risk / Rollback` để người duyệt biết rủi ro;
     - phần `Open Questions` chỉ xuất hiện khi thật sự còn ambiguity.

2. `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/CLAUDE.md`
   - Mirror cùng nội dung cốt lõi từ `AGENTS.md` theo đúng `Sync Rule`.
   - Nội dung sơ lược tương tự để mọi agent đọc cùng một contract.

#### Cấu trúc spec output mới đề xuất
Mỗi spec sau này nên ra theo thứ tự này:

1. `TL;DR cho người bận`
   - 3-6 bullet, nói cực ngắn: bài toán là gì, sẽ sửa ở đâu, kết quả ra sao.

2. `Audit Summary`
   - Observation / Inference / Decision rõ ràng.

3. `Bài toán đang là gì?`
   - Expected vs actual.
   - Ai bị ảnh hưởng.
   - Điều kiện tái hiện hoặc phạm vi thay đổi.

4. `Root Cause + Counter-Hypothesis`
   - Nguyên nhân chính.
   - 1-2 giả thuyết thay thế đã loại trừ/chưa loại trừ.
   - Confidence High/Medium/Low.

5. `Giải pháp đề xuất kiểu Feynman`
   - Giải thích đơn giản như cho PM/junior dev.
   - Trả lời: "Ta sẽ đổi cái gì, vì sao cách này ít rủi ro nhất?"

6. `Files Impacted`
   - Bảng hoặc bullet theo format:
     - `Sửa: <path>` — file này đang làm gì, sẽ đổi gì.
     - `Thêm: <path>` — file mới dùng để làm gì, dữ liệu/chức năng gì nằm ở đây.
   - Nếu chưa chắc file cụ thể, ghi `Dự kiến`.

7. `Execution Preview`
   - Bước 1 agent sẽ đọc/chỉnh gì.
   - Bước 2 cập nhật logic nào.
   - Bước 3 nối wiring nào.
   - Bước 4 review tĩnh / typecheck nếu phù hợp rule repo.

8. `Acceptance Criteria`
   - Điều kiện pass/fail rõ ràng, observable.

9. `Verification Plan`
   - Typecheck/test/repro.
   - Riêng repo này phải tôn trọng guideline hiện có: không tự chạy lint/unit test; chỉ nêu verification plan phù hợp.

10. `Out of Scope`
   - Nói rõ cái gì sẽ không đụng.

11. `Risk / Rollback`
   - Nếu làm sai sẽ vỡ gì.
   - Rollback nhỏ nhất là gì.

#### Câu chữ nên ép agent dùng
- "Nói như cho người mới vào dự án".
- "Mỗi file phải có 1 câu giải thích vai trò hiện tại + 1 câu mô tả thay đổi".
- "Nếu spec dài, mở đầu bằng bản tóm tắt 30 giây".
- "Không chỉ nói 'update logic'; phải nói logic nào, nằm ở đâu, đổi theo hướng nào".
- "Nếu có hơn 5 file, gom theo nhóm: UI / server / schema / shared".

#### Best practices rút từ docs Factory + tài liệu liên quan
- Spec mode nên tập trung vào outcome, constraints, verification; không bắt user mô tả implementation quá sớm.
- Với feature lớn, spec nên chia phase độc lập, mỗi phase có boundary + verification riêng.
- Mọi plan tốt đều có file-by-file breakdown trước khi code.
- Prompt/spec càng rõ đường biên thư mục, file liên quan, success signal thì agent càng ít drift.
- Nên có recovery/rollback note cho thay đổi phức tạp.
- AGENTS.md nên giữ ngắn nhưng rule cho output phải đủ cụ thể để tái sử dụng nhất quán.

### Option B - Bản gọn tối thiểu
Mục tiêu: chỉ thêm template ngắn để spec dễ đọc hơn, ít chạm guideline cũ.

#### File sẽ chỉnh
1. `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/AGENTS.md`
   - Chỉ bổ sung 1 block nhỏ trong `# Spec Mode Rules` yêu cầu thêm:
     - `TL;DR`
     - `Files to Change`
     - `Out of Scope`

2. `E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/CLAUDE.md`
   - Mirror y hệt block trên.

#### Tradeoff
- Ưu: ít thay đổi, dễ merge, ít làm guideline phình ra.
- Nhược: chưa ép được spec phải thật "Feynman", chưa chuẩn hóa execution preview/risk/rollback đủ mạnh.

## Vì sao tôi recommend Option A
- Confidence 90%: phù hợp nhất với yêu cầu của bạn là "tóm tắt rõ ràng hơn, dễ hiểu hơn, có chỉ ra file nào sửa/thêm và mô tả sơ lược từng file".
- Nó bám đúng Factory docs về spec mode: acceptance criteria, file-by-file breakdown, verification, phase planning.
- Nó cũng khớp với `AGENTS.md` hiện tại: không phá guideline cũ, chỉ làm phần output contract cụ thể hơn cho người đọc.

## Verification Plan
- Đọc lại diff của `AGENTS.md` và `CLAUDE.md` để xác nhận rule mới không mâu thuẫn các rule cũ.
- Kiểm tra section `Spec Mode Rules` sau chỉnh có đủ: TL;DR, file-by-file, execution preview, acceptance, verification, out-of-scope, risk/rollback.
- Kiểm tra `CLAUDE.md` mirror đúng phần guideline cốt lõi đã thêm vào `AGENTS.md`.
- Không chạy lint/test/build theo đúng guideline repo hiện tại.

Nếu bạn duyệt, tôi sẽ triển khai theo Option A hoặc Option B.