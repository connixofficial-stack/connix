# I. Primer
## 1. TL;DR kiểu Feynman
- Bạn muốn link đã gắn phải nhìn ra ngay, nên mình sẽ đổi sang **màu xanh dương**.
- Áp dụng ở **cả editor admin** và **site render** để đồng nhất.
- Không đổi hành vi link, chỉ đổi hiển thị màu (scope nhỏ, dễ rollback).

## 2. Elaboration & Self-Explanation
Hiện tại link trong site đang `color: inherit`, nên link dễ lẫn với chữ thường. Ở editor admin cũng chưa có rule màu rõ cho thẻ `a`, nên người dùng khó nhận ra đoạn nào đã được gắn link.

Giải pháp: thêm CSS cho `a` ở 2 bề mặt:
a) trong editor (`.editor-input a`) để nhìn thấy ngay khi soạn,
b) trên site (`.editor-content a`) để hiển thị nhất quán sau khi render.

## 3. Concrete Examples & Analogies
- Ví dụ: đoạn “Xem chi tiết” sau khi gắn link sẽ thành màu xanh dương trong editor; lưu xong lên site vẫn xanh dương.
- Analogy: như tô dạ quang vào từ khóa quan trọng để nhìn lướt là nhận ra ngay.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/components/LexicalEditor.tsx` có global style cho nhiều token editor nhưng chưa có rule `a`.
  - `app/globals.css` đang có `.editor-content a { color: inherit; text-decoration: underline; }`.
- Inference:
  - Chỉ cần chỉnh CSS là đủ đạt yêu cầu “dễ nhận biết link”, không cần đụng logic/plugin.
- Decision:
  - Đổi màu link sang xanh dương ở cả editor và site render.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root cause:
  1. Link đang kế thừa màu chữ thường nên không nổi bật.
- Counter-hypothesis:
  - “Do plugin link lỗi” → không đúng, vì link đã hoạt động; vấn đề là visual state.
- Root Cause Confidence (Độ tin cậy nguyên nhân gốc): **High**.

# IV. Proposal (Đề xuất)
1. Sửa `LexicalEditor.tsx` global style:
   - Thêm `.editor-input a { color: #2563eb; }`.
2. Sửa `app/globals.css`:
   - Đổi `.editor-content a` từ `color: inherit` sang `color: #2563eb`.
3. Giữ nguyên các rule khác (underline, layout, youtube, typography).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/admin/components/LexicalEditor.tsx`
  - Vai trò hiện tại: style nội dung trong editor admin.
  - Thay đổi: thêm màu xanh dương cho link trong editor.
- **Sửa:** `app/globals.css`
  - Vai trò hiện tại: style output rich content ngoài site.
  - Thay đổi: link trong `.editor-content` hiển thị xanh dương.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh 1 rule CSS ở `LexicalEditor.tsx`.
2. Chỉnh 1 rule CSS ở `app/globals.css`.
3. Self-review tĩnh để tránh ảnh hưởng style khác.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở editor admin: gắn link và kiểm tra link hiển thị xanh dương.
- Mở trang site render cùng nội dung: link hiển thị xanh dương.
- Kiểm tra nhanh dark mode: link vẫn nhận diện rõ.

# VIII. Todo
1. Thêm màu xanh dương cho `.editor-input a`.
2. Đổi màu `.editor-content a` sang xanh dương.
3. Rà nhanh các rule rich content liên quan.
4. Commit thay đổi (không push).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Link trong editor admin nhìn thấy rõ bằng màu xanh dương.
- Link trên site render cũng xanh dương.
- Không đổi hành vi link/toolbars hiện có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: màu xanh có thể lệch nhẹ với theme ở vài section custom.
- Rollback: revert 2 rule CSS vừa chỉnh.

# XI. Out of Scope (Ngoài phạm vi)
- Không thêm hover/visited/focus state mới.
- Không thay đổi plugin/link logic.
- Không chỉnh UI toolbar.

# XII. Open Questions (Câu hỏi mở)
- Không còn: bạn đã chốt phạm vi và style là “chỉ màu xanh dương”.