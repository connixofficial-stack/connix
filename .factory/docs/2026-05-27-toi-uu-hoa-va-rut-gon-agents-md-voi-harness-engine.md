# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** File `AGENTS.md` hiện tại quá dài (185 dòng), gây loãng chú ý cho Agent, tốn token đầu vào và làm chậm thời gian phản hồi. Đồng thời, nó thiếu các quy tắc tự động hóa an toàn (Harness) thực tế để kiểm soát Agent tự sửa lỗi hoặc chặn lệnh nguy hiểm.
- **Giải pháp:** 
  1. Tối ưu hóa từ ngữ (Text Economy), gộp các nhóm quy tắc tương đồng để đưa file về độ dài lý tưởng **~100-110 dòng** (giảm 40% dòng nhưng tăng 200% mật độ thông tin).
  2. Tích hợp thêm **4 Quy tắc Harness cốt lõi**: Phân cấp Spec (Spec Tiers) cho task nhỏ, Giới hạn tự sửa lỗi (Self-Repair Loop Limit), Chốt chặn an toàn CLI (Sandbox Guardrails), và Tự chạy kiểm chứng nhanh pre-commit.
- **Kết quả:** Agent chạy nhanh hơn, thông minh hơn, tuyệt đối an toàn và không bị sa đà vào các thủ tục hành chính khi làm task nhỏ.

## 2. Elaboration & Self-Explanation
Hiện tại, `AGENTS.md` là bộ quy tắc ứng xử duy nhất điều khiển hành vi của Agent. Tuy nhiên, việc ép Agent tuân thủ 100% quy trình Spec 12 mục La Mã cho mọi task (kể cả sửa 1 dòng CSS) là một điểm nghẽn lớn về mặt năng suất. 
Bằng cách phân cấp quy trình (Spec Tiering), Agent có thể bỏ qua Spec rườm rà đối với các task nhỏ (Tier 1/2) và chỉ tập trung cao độ vào Tier 3. 
Hơn nữa, việc bổ sung thêm các "chốt chặn cơ học" (Harness) như giới hạn số lần tự sửa lỗi biên dịch (Retry limit = 2) và chặn các lệnh CLI tải file độc hại sẽ bảo vệ an toàn tuyệt đối cho máy chủ local của nhà phát triển.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Nếu bạn yêu cầu sửa một lỗi chính tả giao diện (Trivial Task).
  - *Hiện tại:* Agent mất 2 phút để viết một Spec 12 mục La Mã đầy đủ ở `.factory/docs` rồi đợi bạn duyệt, dù chỉ sửa 1 ký tự.
  - *Sau khi nâng cấp:* Agent xác định đây là **Tier 1 Task**, chỉ cần tóm tắt 3 dòng trong chat, sửa luôn trong 5 giây. Tiết kiệm 95% thời gian.
- **Analogy (Ví dụ đời thường):** Giống như luật giao thông. Việc sửa chữa cầu đường lớn bắt buộc phải có giấy phép xây dựng 12 hạng mục (Tier 3 Spec). Nhưng nếu chỉ là vá một cái ổ gà nhỏ trên phố, đội thi công chỉ cần đặt biển báo và vá ngay lập tức (Tier 1 Spec) để tránh tắc nghẽn giao thông toàn thành phố.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **File hiện tại:** [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md) (185 dòng, 15,532 bytes).
- **Mức độ dư thừa từ ngữ:** Cao. Nhiều mục giải thích Mermaid và Convex Ops có thể viết khít lại bằng cách dùng từ ngữ mang tính hành động (Action-oriented language) mà AI vẫn hiểu hoàn hảo.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** `AGENTS.md` được bồi đắp dần qua nhiều phiên bản nâng cấp, dẫn đến trùng lặp quy tắc và chưa có sự phân cấp rõ ràng giữa các loại Task (Trivial vs Complex).
- **Độ tin cậy nguyên nhân gốc:** High 🔴 (Xác thực qua việc đọc và phân tích toàn bộ 185 dòng của file).

---

# IV. Proposal (Đề xuất)
- Tiến hành viết lại [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md) với cấu trúc tinh gọn (Condense) đạt **~105 dòng**, tích hợp chặt chẽ:
  1. **Spec Tiering:** 3 cấp độ Spec tùy theo quy mô thay đổi.
  2. **Self-Repair Loop Limit:** Tự sửa lỗi biên dịch tối đa 2 lần trước khi dừng lại hỏi User.
  3. **CLI Sandbox Guardrails:** Cấm chạy các lệnh tải file không rõ nguồn gốc hoặc cài package lạ khi chưa được duyệt.
  4. **Pre-Commit Verification Harness:** Chỉ kiểm tra cú pháp cục bộ trên file thay đổi bằng công cụ cực nhanh (`oxlint` hoặc `eslint` chạy trực tiếp), cấm quét toàn dự án.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md)
  - *Vai trò:* Cấu hình hành vi, quy tắc và quy trình làm việc của Agent.
  - *Thay đổi:* Tái cấu trúc, cô đọng nội dung xuống ~105 dòng và tích hợp 4 Harness Rules mới.

---

# VI. Execution Preview (Xem trước thực thi)
1. Tạo Spec này và xin ý kiến phê duyệt từ User.
2. Thực hiện ghi đè nội dung tối ưu mới vào [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md).
3. Đọc lại file để tự kiểm chứng cấu trúc.
4. Kích hoạt âm thanh thông báo `Done, Sir.` qua Windows SAPI.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Manual Verification:** 
  - Kiểm tra độ dài dòng của file [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md) mới đảm bảo nằm trong khoảng 100 - 115 dòng.
  - Đảm bảo các nguyên tắc cũ (KISS, YAGNI, DARE, 5/8 Root Cause, Convex Ops) không bị mất đi mà chỉ được viết cô đọng lại.

---

# VIII. Todo
- [ ] Thực hiện ghi đè nội dung tối ưu hóa mới vào [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md).
- [ ] Kiểm tra tổng số dòng của file sau khi ghi đè.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- File [AGENTS.md](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/AGENTS.md) mới có tổng số dòng $\le 115$ dòng.
- Đầy đủ 4 quy tắc Harness mới (Spec Tiering, Self-Repair Limit, CLI Sandbox, Pre-Commit Harness).
- Giọng nói Windows cất lên thông báo thành công.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Agent thế hệ tiếp theo có thể không hiểu nếu viết quá ngắn.
- **Giảm thiểu:** AI hiện đại (như Gemini 1.5 Pro / Claude 3.5 Sonnet) rất giỏi nắm bắt ý nghĩa từ ngữ cô đọng. Việc viết ngắn gọn dạng bullet lệnh thậm chí giúp AI tuân thủ tốt hơn.
- **Rollback:** Dùng Git để phục hồi lại file `AGENTS.md` cũ dễ dàng nếu cần.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không sửa đổi bất kỳ file code logic (`app`, `convex`, `components`) nào của dự án trong task này.
