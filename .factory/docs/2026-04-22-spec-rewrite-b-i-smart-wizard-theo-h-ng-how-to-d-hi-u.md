# I. Primer
## 1. TL;DR kiểu Feynman
- Mục tiêu: viết lại bài `/system/huong-dan/admin-home-components-smart-wizard-toggle` theo kiểu **hướng dẫn sử dụng** (how-to), dễ hiểu cho user vận hành.
- Bỏ phrasing kỹ thuật/code-centric (ví dụ condition code), thay bằng từng bước thao tác rõ ràng.
- Giữ 2 nút nhanh đã có: mở `Home Components` và mở `Module Homepage`.
- Nội dung tập trung: khi nào dùng, bật/tắt sao, nếu không thấy nút thì làm gì.

## 2. Elaboration & Self-Explanation
Hiện bài đã có ích nhưng còn mùi “giải thích cơ chế code”. User đang cần “làm thế nào” hơn là “hệ thống render ra sao”.

Do đó ta đổi giọng văn sang checklist thao tác:
1) Vào đâu,
2) bấm gì,
3) kiểm tra kết quả thế nào,
4) nếu chưa đúng thì xử lý nhanh ra sao.

Nguyên tắc viết:
- Câu ngắn, từ dễ hiểu.
- Mỗi block trả lời đúng 1 câu hỏi của user vận hành.
- Hạn chế thuật ngữ kỹ thuật; chỉ giữ từ bắt buộc như `enableSmartWizard` nhưng giải thích bằng ngôn ngữ đời thường.

## 3. Concrete Examples & Analogies
- Ví dụ trực tiếp trong bài:
  - “Muốn mở Smart Wizard cho team dùng → vào Module Homepage → bật setting Smart Wizard → quay lại Home Components kiểm tra nút.”
- Analogy:
  - Giống bật/tắt đèn: có công tắc tổng ở module, còn trang Home Components là nơi nhìn thấy bóng đèn sáng/tắt.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Bài hiện có câu như “logic hiện tại: wizardSetting?.value !== false” gây thiên kỹ thuật.
  - User yêu cầu rõ: muốn nội dung kiểu “how to use”, không giải thích code/cơ chế tech.
- Inference:
  - Cần rewrite phần thân bài smart wizard; không cần đổi cấu trúc route hay dữ liệu.
- Decision:
  - Giữ layout hiện tại, thay nội dung block Smart Wizard sang hướng thao tác người dùng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause (nguyên nhân gốc):
  - Nội dung được viết từ góc nhìn dev/debug nên vượt quá nhu cầu của người dùng vận hành.
- Root Cause Confidence: **High**
  - Lý do: yêu cầu user rất cụ thể về phong cách mong muốn và phần chưa phù hợp đã chỉ ra rõ.

Trả lời 8 câu audit bắt buộc:
1. Triệu chứng: bài đọc vẫn khó vì nặng kỹ thuật.
2. Phạm vi: riêng trang bài Smart Wizard slug hiện tại.
3. Tái hiện: có, đọc bài hiện tại thấy dòng giải thích logic code.
4. Mốc thay đổi: sau các lần bổ sung nội dung chi tiết trước đó.
5. Dữ liệu thiếu: không thiếu; yêu cầu rewrite đã rõ.
6. Giả thuyết thay thế: layout rối; có thể đúng một phần nhưng gốc là wording.
7. Rủi ro fix sai: viết quá ngắn làm thiếu bước thao tác.
8. Tiêu chí pass/fail: user đọc và thao tác được mà không cần hiểu code.

# IV. Proposal (Đề xuất)
- Rewrite riêng nhánh `isSmartWizardGuide` trong `app/system/huong-dan/[slug]/page.tsx`.
- Cấu trúc nội dung mới (how-to):
  1) **Khi nào cần dùng**
  2) **Bật Smart Wizard (3-4 bước)**
  3) **Tắt Smart Wizard (2-3 bước)**
  4) **Không thấy nút? làm theo checklist ngắn**
  5) **Kết quả đúng mong đợi**
- Giữ 2 nút CTA:
  - `Mở Home Components`
  - `Mở Module Homepage`
- Loại bỏ câu/đoạn giải thích biểu thức code trực tiếp.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/system/huong-dan/[slug]/page.tsx`
  - Vai trò hiện tại: render nội dung riêng cho Smart Wizard + template chung.
  - Thay đổi: rewrite copy của khối Smart Wizard sang ngôn ngữ hướng dẫn sử dụng, bỏ giải thích code-level.

# VI. Execution Preview (Xem trước thực thi)
1. Giữ nguyên nhánh `isSmartWizardGuide` và 2 nút CTA.
2. Thay toàn bộ đoạn mô tả hiện tại bằng các bước how-to ngắn.
3. Rà lại từ ngữ để đảm bảo không lộ phrasing quá kỹ thuật.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Theo guideline repo: không chạy lint/unit test.
- Có thay đổi TSX: chạy `bunx tsc --noEmit`.
- Repro:
  1) Mở `/system/huong-dan/admin-home-components-smart-wizard-toggle`.
  2) Nội dung đọc như SOP thao tác, không có giải thích code expression.
  3) Hai nút điều hướng vẫn hoạt động như trước.

# VIII. Todo
- [ ] Rewrite copy bài Smart Wizard theo hướng how-to dễ hiểu.
- [ ] Giữ CTA nút điều hướng và rút gọn checklist.
- [ ] Chạy typecheck và review wording cuối.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Bài viết dùng ngôn ngữ hướng dẫn sử dụng, không đào sâu cơ chế code.
- User đọc bài có thể tự bật/tắt và tự check khi không thấy nút.
- Không thay đổi route hay behavior chức năng hiện có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: rút quá mạnh làm thiếu ngữ cảnh.
- Giảm thiểu: giữ đủ 5 phần thao tác + checklist tối thiểu.
- Rollback: revert file page slug về commit trước.

# XI. Out of Scope (Ngoài phạm vi)
- Refactor kiến trúc guide hub.
- Thay đổi logic Smart Wizard trong admin.
- Viết lại các bài guide khác.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity; yêu cầu phong cách viết đã rõ.