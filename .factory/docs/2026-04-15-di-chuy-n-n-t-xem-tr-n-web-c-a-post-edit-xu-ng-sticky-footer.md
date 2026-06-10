# I. Primer
## 1. TL;DR kiểu Feynman
- Trang Post Edit đang đặt nút `Xem trên web` ở header, còn sticky footer chỉ có nút lưu.
- Anh muốn đưa nút này xuống sticky footer theo cùng kiểu thao tác như trang chi tiết sản phẩm.
- Em sẽ chuyển action `Xem trên web` vào sticky footer, disable khi slug rỗng/chưa hợp lệ, label giữ `Xem trên web`.
- Mục tiêu là gom action chính về footer để thao tác nhất quán khi chỉnh sửa.

## 2. Elaboration & Self-Explanation
Hiện tại người dùng phải nhìn lên header để bấm `Xem trên web`, nhưng trạng thái lưu nằm ở footer. Điều này tách action theo 2 khu vực khác nhau.  
Sau thay đổi, khu vực sticky footer sẽ chứa luôn action preview (`Xem trên web`) cùng nhóm action lưu, giúp luồng thao tác liền mạch hơn khi đang chỉnh bài.  
Theo trả lời của anh: giữ label `Xem trên web`, và disable nút nếu slug chưa hợp lệ/rỗng.

## 3. Concrete Examples & Analogies
- Ví dụ trước/sau:
  - Trước: Header có `Xem trên web`; Footer chỉ `Lưu thay đổi`.
  - Sau: Footer có thêm `Xem trên web` (và `Lưu thay đổi`), nút preview disable khi slug rỗng.
- Analogy: giống toolbar chỉnh sửa ảnh — các nút preview/save nằm chung một thanh công cụ ở dưới để thao tác liên tục, không phải nhìn lên khu vực khác.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/posts/[id]/edit/page.tsx` đang render nút `Xem trên web` ở header.
  - Trang này đã dùng `HomeComponentStickyFooter` ở cuối form.
  - `app/admin/products/[id]/edit/page.tsx` là pattern tham chiếu anh yêu cầu “học y thằng kia”.
- Inference:
  - Chỉ cần refactor UI action placement tại Post Edit, không đụng business logic mutation/save.
- Decision:
  - Di chuyển nút preview vào sticky footer bằng `children` slot của `HomeComponentStickyFooter`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- 1) Triệu chứng: Action `Xem trên web` nằm trên header, không cùng cụm với action lưu ở footer.
- 2) Phạm vi: Chỉ route `admin/posts/[id]/edit`.
- 3) Tái hiện: Ổn định mỗi lần mở trang edit bài viết.
- 4) Mốc thay đổi gần nhất: Footer đã được chuẩn hóa component chung, nhưng riêng action preview của Post vẫn ở header.
- 5) Dữ liệu thiếu: Không thiếu dữ liệu để triển khai.
- 6) Giả thuyết thay thế:
  - Giữ nguyên ở header để “dễ thấy hơn”: không khớp yêu cầu user hiện tại.
  - Duplicate cả header + footer: tăng nhiễu UI, không cần thiết.
- 7) Rủi ro fix sai: đặt sai vị trí gây lệch consistency giữa các action trong footer.
- 8) Tiêu chí pass/fail:
  - Pass: `Xem trên web` xuất hiện ở sticky footer, hoạt động đúng và disable khi slug rỗng.
  - Fail: Nút vẫn nằm ở header hoặc vẫn bấm được khi slug rỗng.

**Root Cause Confidence:** High — evidence trực tiếp từ code hiện tại và yêu cầu user rõ ràng.

# IV. Proposal (Đề xuất)
- Tại Post Edit:
  - Bỏ nút `Xem trên web` khỏi header action block.
  - Dùng `HomeComponentStickyFooter` với `children` để render cụm action custom ở footer gồm:
    - Nút `Xem trên web` (type button, variant outline, icon `ExternalLink`), `disabled={!slug.trim()}`.
    - Nút `Lưu thay đổi` giữ nguyên logic `isSubmitting/saveStatus/hasChanges`.
- Giữ nguyên toàn bộ logic submit/update mutation hiện có.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/admin/posts/[id]/edit/page.tsx`
  - Vai trò hiện tại: form chỉnh sửa bài viết + header action + sticky save footer.
  - Thay đổi: chuyển action `Xem trên web` từ header xuống sticky footer, thêm điều kiện disable theo slug.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc block header action hiện tại ở Post Edit.
2. Xóa nút `Xem trên web` trong header.
3. Cấu hình `HomeComponentStickyFooter` dùng `children` để render cụm action ở footer.
4. Thêm disable condition cho nút `Xem trên web` khi slug rỗng/chưa hợp lệ tối thiểu (`trim().length === 0`).
5. Review tĩnh type/props và hành vi UI.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static review:
  - Soát import `ExternalLink`, `Button`, và JSX footer children không lỗi type.
  - Soát điều kiện disable nút preview theo slug.
- Manual QA (tester):
  1) Mở `/admin/posts/{id}/edit`: không còn nút `Xem trên web` ở header.
  2) Sticky footer có nút `Xem trên web` + `Lưu thay đổi`.
  3) Xóa slug -> nút `Xem trên web` disabled.
  4) Có slug hợp lệ -> bấm mở đúng `/posts/{slug}` tab mới.

# VIII. Todo
- [ ] Refactor Post Edit header/footer action placement.
- [ ] Thêm disable condition cho nút `Xem trên web` theo slug.
- [ ] Self-review tĩnh và đối chiếu acceptance criteria.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Nút `Xem trên web` không còn ở header Post Edit.
- Nút `Xem trên web` nằm trong sticky footer cùng cụm action lưu.
- Label nút là `Xem trên web`.
- Khi slug rỗng/chưa hợp lệ tối thiểu thì nút preview disabled.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: bố cục footer có thể chật ở viewport nhỏ nếu spacing chưa hợp lý.
- Rollback: revert file `app/admin/posts/[id]/edit/page.tsx` về commit trước thay đổi này.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi logic publish/schedule/update bài viết.
- Không thay đổi các trang create/edit khác ngoài Post Edit.
- Không thay đổi API/component shared ngoài cách sử dụng trong Post Edit.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity quan trọng; có thể implement ngay theo spec này.