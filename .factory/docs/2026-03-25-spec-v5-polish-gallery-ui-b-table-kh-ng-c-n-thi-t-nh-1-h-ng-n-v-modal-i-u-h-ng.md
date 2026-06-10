## TL;DR kiểu Feynman
- UI xấu vì bài đang render ảnh và block theo kiểu rời rạc; khi nhiều ảnh thì vỡ bố cục.
- Em sẽ giữ table **chỉ ở section so sánh dạng text**; các chỗ khác bỏ table hoàn toàn.
- Ảnh sẽ theo rule mới: 1 ảnh = 1 cột, 2 ảnh = 2 cột, 3 ảnh = 3 cột, từ 4 ảnh trở lên = hiển thị 3 ảnh + ô `+n`.
- Click ô `+n` sẽ mở modal gallery có nút `< >` để duyệt ảnh.
- Nguồn ảnh sẽ gộp **product + related** rồi dedupe để tránh lặp và tránh rớt UI.

## Audit Summary
### Observation
1. `lib/posts/generator/assembler.ts`
   - Vẫn có render table compare (`overflow-x-auto`, `<table>`) và các ảnh đang render tản mát theo section.
   - Chưa có gallery compact theo 1 hàng + `+n`.
2. `app/admin/posts/create/page.tsx`
   - Preview chỉ `dangerouslySetInnerHTML`, chưa có behavior modal/gallery cho ảnh trong preview.
3. Input user đã chốt:
   - Table chỉ giữ cho mục so sánh text.
   - Layout ảnh theo số lượng (1/2/3 cột, >=4 dùng `+n`).
   - Modal có điều hướng trái/phải.
   - Ảnh từ product + related, có dedupe.

### Inference
- Root cause chính là thiếu image presentation contract thống nhất cho bài generated HTML; ảnh nhiều làm UI vỡ.

### Decision
- Áp dụng gallery contract tại layer assembler + preview runtime handler cho modal.

## Root Cause Confidence
**High** — vì evidence trực tiếp trong `assembler.ts` (table/image render cứng) và preview không có cơ chế tương tác gallery.

## Counter-Hypothesis
- Chỉ cần chỉnh CSS nhẹ là đủ.  
  **Bác bỏ:** yêu cầu có `+n` và modal `< >` là behavior-level, cần đổi cả HTML contract + preview interaction, không chỉ CSS.

## Files Impacted
### Shared (generator)
- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: render section HTML + compare table + ảnh rời.  
  Thay đổi: thêm helper render image-strip theo rule 1/2/3/>=4; inject `data-gallery` payload; chỉ giữ table cho section compare text; section khác chuyển sang list/card text-friendly.

- **Sửa vừa:** `lib/posts/generator/media-plan.ts`  
  Vai trò hiện tại: inline image picks theo slot.  
  Thay đổi: ưu tiên ảnh gộp từ product + related (dedupe), phân bổ ảnh cho gallery strip ổn định hơn.

- **Sửa nhẹ:** `lib/posts/generator/types.ts`  
  Vai trò hiện tại: mediaPlan có inlineImages/roles.  
  Thay đổi: thêm metadata gallery (ví dụ `galleryImagesBySlot`) để preview biết đầy đủ ảnh khi mở modal.

### UI preview
- **Sửa lớn:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: render HTML tĩnh preview.  
  Thay đổi: thêm delegated click handler cho ô `+n`/thumb để mở modal gallery; modal có ảnh hiện tại + nút prev/next `< >` + close; không phá logic apply existing.

## Hành vi mới đề xuất
1. **Rule hiển thị ảnh theo số lượng**
   - 1 ảnh: grid 1.
   - 2 ảnh: grid-cols-2.
   - 3 ảnh: grid-cols-3.
   - >=4 ảnh: hiện 3 ảnh + ô thứ 4 dạng overlay `+n`.
2. **Modal gallery điều hướng**
   - Click ảnh hoặc `+n` mở modal.
   - Có prev/next (`<` `>`) và đóng modal.
   - Keyboard optional: Left/Right/Esc (nếu code hiện tại dễ thêm, không mở rộng quá scope).
3. **Nguồn ảnh**
   - Merge ảnh product + related, dedupe theo URL.
   - Fallback về ảnh slot hiện có nếu thiếu dữ liệu.
4. **Table policy**
   - Chỉ giữ table cho section compare text.
   - Các section khác bỏ table để tránh “giao diện xấu”.

## Execution Preview
1. Đọc lại assembler/media-plan/page preview để chốt điểm hook.
2. Refactor image block renderer trong assembler sang gallery strip contract.
3. Cập nhật media-plan để gom product+related và dedupe.
4. Bổ sung runtime modal gallery ở preview page (state + controls + event delegation).
5. Rà static typing + chạy `bunx tsc --noEmit`.
6. Commit kèm file spec v5.

## Acceptance Criteria
1. Section có >=4 ảnh hiển thị 3 ảnh + ô `+n`.
2. Click `+n` mở modal và điều hướng được bằng nút `< >`.
3. 1/2/3 ảnh hiển thị đúng grid 1/2/3 cột.
4. Ảnh lấy từ product + related, không lặp URL trong cùng gallery.
5. Table chỉ còn ở section compare text; các section khác không còn table.
6. Preview admin không bị vỡ layout khi bài có nhiều ảnh.

## Verification Plan
- Chạy `bunx tsc --noEmit`.
- Manual check trong preview với 4 case:
  - bài có 1 ảnh,
  - bài có 2 ảnh,
  - bài có 3 ảnh,
  - bài có >=4 ảnh (xác nhận `+n` và modal `< >`).
- Check compare section vẫn giữ table, section khác không có table.

## Out of Scope
- Không đổi schema backend lớn ngoài metadata ảnh cần thiết.
- Không thêm lightbox library mới (ưu tiên code native theo pattern hiện tại).

## Risk / Rollback
- Risk: event delegation với HTML inject có thể bắt sai target.
- Mitigation: dùng `data-*` contract rõ ràng (`data-gallery-slot`, `data-gallery-index`, `data-gallery-open`).
- Rollback: có thể fallback render strip không modal nếu interaction lỗi, vẫn giữ layout 1 hàng ổn định.