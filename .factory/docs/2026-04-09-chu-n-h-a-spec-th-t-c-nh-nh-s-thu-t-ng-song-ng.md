# I. Primer
## 1. TL;DR kiểu Feynman
- Em sẽ bổ sung rule để spec luôn ra đúng **khung cố định**, không nhảy thứ tự.
- 3 mục mở đầu luôn cố định: **Feynman → Tự diễn giải → Ví dụ/So sánh**.
- Em thêm rule **song ngữ thuật ngữ**: từ tiếng Anh nào hơi chuyên môn thì phải có **(tiếng Việt)** ngay bên cạnh.
- Ví dụ không viết trơn `Acceptance Criteria`, mà viết `Acceptance Criteria (Tiêu chí chấp nhận)`.
- Mục `Todo` sẽ luôn có và đặt gần cuối, ngay trước `Acceptance Criteria (Tiêu chí chấp nhận)`.

## 2. Elaboration & Self-Explanation
1. Vấn đề chính có 2 phần:
   a) Spec đang thiếu “khung thứ tự bắt buộc”, nên lúc in ra bị đảo vị trí.
   b) Thuật ngữ tiếng Anh đứng một mình làm khó đọc nhanh.
2. Cách xử lý:
   a) Đặt **Spec Output Contract (Hợp đồng đầu ra spec)** với thứ tự section cố định.
   b) Đặt **Glossary Rule (Quy tắc thuật ngữ)**: jargon/phức tạp nhẹ trở lên phải có nghĩa tiếng Việt trong ngoặc ngay sau cụm gốc.
3. Hiệu quả mong muốn:
   a) Spec đọc từ trên xuống luôn giống nhau.
   b) Người mới vẫn hiểu được nhờ cụm song ngữ tại chỗ, không cần đoán.

## 3. Concrete Examples & Analogies
1. Ví dụ đúng:
   - `# IX. Acceptance Criteria (Tiêu chí chấp nhận)`
   - `# V. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)`
   - `Counter-Hypothesis (Giả thuyết đối chứng)`
2. Ví dụ rule jargon:
   - Nếu xuất hiện `tradeoff` thì ghi `tradeoff (đánh đổi)`.
   - Nếu xuất hiện `rollback` thì ghi `rollback (hoàn tác)`.
3. Analogy: giống biển chỉ đường song ngữ — giữ từ gốc để chuẩn kỹ thuật, thêm tiếng Việt để ai cũng hiểu ngay.

# II. Audit Summary (Tóm tắt kiểm tra)
1. Observation (Quan sát)
   a) AGENTS.md có yêu cầu block bắt buộc nhưng chưa khóa chặt thứ tự toàn bộ.
   b) Chưa có rule bắt buộc “English term + (Tiếng Việt)”.
2. Inference (Suy luận)
   a) Thiếu 2 rule trên là lý do gây lệch format và khó đọc.
3. Decision (Quyết định)
   a) Bổ sung 1 subsection mới trong `# Spec Mode Rules` để khóa thứ tự + song ngữ thuật ngữ.

# III. Root Cause & Counter-Hypothesis
## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)
- **High (92%)**: triệu chứng khớp trực tiếp với thiếu ràng buộc format và thiếu rule thuật ngữ.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)
1. Có thể do model ngẫu nhiên trình bày? Có.
2. Nhưng nếu có output contract chặt + glossary rule thì ngẫu nhiên vẫn bị chặn bởi template.

# IV. Proposal (Đề xuất)
1. **Sửa:** `AGENTS.md` trong `# Spec Mode Rules`.
2. Thêm subsection: `Spec Output Contract (Hợp đồng đầu ra spec)` gồm:
   a) Thứ tự top-level cố định:
      - I. Primer
      - II. Audit Summary (Tóm tắt kiểm tra)
      - III. Root Cause & Counter-Hypothesis
      - IV. Proposal (Đề xuất)
      - V. Files Impacted (Tệp bị ảnh hưởng)
      - VI. Execution Preview (Xem trước thực thi)
      - VII. Verification Plan (Kế hoạch kiểm chứng)
      - VIII. Todo
      - IX. Acceptance Criteria (Tiêu chí chấp nhận)
      - X. Risk / Rollback (Rủi ro / Hoàn tác)
      - XI. Out of Scope (Ngoài phạm vi)
      - XII. Open Questions (Câu hỏi mở, tùy chọn)
   b) I. Primer bắt buộc 3 mục theo đúng thứ tự 1-2-3 như trên.
   c) Numbering bắt buộc:
      - Cấp 1: `I, II, III...`
      - Cấp 2: `1, 2, 3...`
      - Cấp 3: `a), b), c)...`
   d) Cho phép ẩn section không áp dụng, **không được đổi vị trí** các section còn lại.
3. Thêm subsection: `Terminology & Jargon Rule (Quy tắc thuật ngữ và biệt ngữ)`:
   a) Nếu từ tiếng Việt dùng được thì ưu tiên tiếng Việt.
   b) Nếu cần dùng tiếng Anh kỹ thuật thì ghi ngay dạng `English Term (Tiếng Việt)`.
   c) Với jargon phức tạp nhẹ trở lên: luôn có tiếng Việt ngay sau lần xuất hiện đầu tiên trong section.
   d) Không dùng tiêu đề tiếng Anh trơn (ví dụ: cấm `Acceptance Criteria` đơn lẻ).

# V. Files Impacted (Tệp bị ảnh hưởng)
1. **Sửa:** `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\AGENTS.md`
   a) Vai trò hiện tại: bộ quy tắc vận hành agent.
   b) Thay đổi: thêm contract cố định thứ tự + quy tắc song ngữ cho thuật ngữ/jargon.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc section `# Spec Mode Rules` hiện tại.
2. Chèn 2 subsection mới (Output Contract + Terminology/Jargon Rule).
3. Rà tính nhất quán với rule cũ, không mở rộng scope khác.

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. Checklist đầu ra spec:
   a) Có khung section đúng thứ tự (hoặc ẩn hợp lệ).
   b) 3 mục mở đầu luôn là 1/2/3 đúng thứ tự.
   c) `Todo` ngay trước `Acceptance Criteria (Tiêu chí chấp nhận)`.
   d) Thuật ngữ/jargon tiếng Anh có `(tiếng Việt)` đi kèm theo rule.
2. Không chạy lint/test/build theo quy định repo.

# VIII. Todo
1. [pending] Thêm `Spec Output Contract (Hợp đồng đầu ra spec)` vào AGENTS.md.
2. [pending] Thêm `Terminology & Jargon Rule (Quy tắc thuật ngữ và biệt ngữ)`.
3. [pending] Chuẩn hóa ví dụ heading song ngữ cho các mục thường gặp.
4. [pending] Rà xung đột với rule cũ trong Spec Mode Rules.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
1. Spec luôn có thứ tự section ổn định, không đảo vị trí.
2. 3 mục mở đầu luôn đứng đầu và đánh số cố định.
3. Có `Todo` đúng vị trí trước mục tiêu chí chấp nhận.
4. Thuật ngữ/jargon tiếng Anh không còn đứng trơn; có tiếng Việt đi kèm theo rule.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
1. Risk: spec dài hơn một chút do song ngữ.
2. Rollback: gỡ 2 subsection mới nếu cần quay về format cũ.

# XI. Out of Scope (Ngoài phạm vi)
1. Không đổi quy trình commit/test hiện tại.
2. Không chỉnh các rule ngoài phạm vi format spec + thuật ngữ.

# XII. Open Questions (Câu hỏi mở)
1. Không còn điểm mơ hồ lớn; có thể triển khai theo 1 hướng duy nhất.