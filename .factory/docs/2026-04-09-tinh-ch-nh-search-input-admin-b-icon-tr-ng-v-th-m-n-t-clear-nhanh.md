## TL;DR kiểu Feynman
- Ô search đang có 2 icon kính lúp: 1 bên trái và 1 nút submit bên phải, nhìn bị dư.
- Em sẽ bỏ icon/nút submit bên phải để input gọn hơn.
- Khi có text, em sẽ hiện nút `X` để xoá nhanh.
- Nhấn `X` sẽ clear text, đóng dropdown và đưa input về trạng thái sạch.

## Audit Summary
### Observation
1. `AdminHeaderSearchAutocomplete.tsx` đang render `Search` icon bên trái input.
2. Cùng lúc đó có thêm button bên phải cũng chứa `Search` icon.
3. Hiện chưa có nút clear theo trạng thái `query`.

### Inference
- Root cause chỉ là UI composition hiện tại giữ cả decorative icon lẫn action button search, gây trùng biểu tượng.

### Decision
- Giữ icon trái làm tín hiệu thị giác chính.
- Thay button phải bằng nút clear có điều kiện khi `query.trim().length > 0`.

## Root Cause Confidence
**High** — vì đã xác định trực tiếp trong component search hiện tại.

## Elaboration & Self-Explanation
Ô search thường chỉ cần 1 dấu hiệu nhận biết là đủ. Icon kính lúp bên trái đã làm tốt vai trò đó rồi. Phần bên phải hợp lý hơn nếu dùng cho hành động “xóa nhanh”, vì đó là thao tác người dùng cần khi đang nhập dở và muốn làm lại.

## Concrete Examples & Analogies
- Khi input rỗng: chỉ còn 1 icon kính lúp bên trái.
- Khi input có chữ `bài viết`: hiện nút `X` bên phải để xoá ngay.
- Analogy: giống ô search chuẩn trên mobile app — một icon nhận diện, một nút clear theo ngữ cảnh.

## Files Impacted
- **Sửa:** `app/admin/components/AdminHeaderSearchAutocomplete.tsx`
  - Vai trò hiện tại: render search input + dropdown autocomplete.
  - Thay đổi: bỏ icon submit bên phải, thêm nút clear conditionally.

## Execution Preview
1. Bỏ button `Search` ở cạnh phải input.
2. Thêm button clear dùng icon `X`.
3. Chỉ render clear button khi `query.trim()` có giá trị.
4. Khi clear: reset `query`, `debouncedQuery`, `activeIndex`, đóng dropdown.
5. Static self-review để chắc không ảnh hưởng Enter/Arrow navigation.

## Acceptance Criteria
- Ô search chỉ còn 1 icon kính lúp.
- Khi có text thì hiện nút `X` để clear nhanh.
- Khi clear xong, input rỗng và dropdown đóng lại.
- Không ảnh hưởng hành vi autocomplete hiện có.

## Verification Plan
- Không chạy lint/test/build ngoài typecheck nếu có sửa TS.
- Verify tĩnh:
  - Soát điều kiện render nút clear.
  - Soát handler reset state đầy đủ.
  - Soát padding input phải đủ chỗ cho nút `X`.

## Out of Scope
- Không đổi logic search backend.
- Không đổi grouping/menu/data search.

## Risk / Rollback
- Risk rất thấp.
- Rollback nhanh: revert riêng file `AdminHeaderSearchAutocomplete.tsx`.