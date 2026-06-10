## Problem Graph
1. [Main] Fix 2 cảnh báo oxlint đã nêu <- depends on 1.1, 1.2
   1.1 [no-unused-expressions ở Dialog onOpenChange] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Dùng ternary chỉ để side-effect trong callback
   1.2 [no-unused-vars ở Header map] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Tham số `index` không được sử dụng

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: `onOpenChange` nên dùng statement rõ ràng (if/else) thay vì ternary side-effect để đúng rule eslint/no-unused-expressions.
   - Action: Trong `app/admin/menus/page.tsx`, thay:
     - `(open) => { open ? setIsQuickPickerOpen(true) : handleCloseQuickPicker(); }`
     thành:
     - `(open) => { if (open) { setIsQuickPickerOpen(true); } else { handleCloseQuickPicker(); } }`
   - Reflection: ✓ Không đổi behavior, chỉ đổi syntax để hết warning.

2. Solving 1.2.1...
   - Thought: callback `map` chỉ cần tham số đang dùng.
   - Action: Trong `components/site/Header.tsx`, thay `visibleRootItems.map((item, index) => (` thành `visibleRootItems.map((item) => (`.
   - Reflection: ✓ Không ảnh hưởng render/key vì key đang dùng `item._id`.

3. Scope control theo xác nhận user
   - Thought: User chọn “Chỉ fix đúng 2 warning” + “Chỉ sửa code, chưa chạy verify”.
   - Action: Chỉ sửa đúng 2 điểm trên, không mở rộng refactor, không chạy lệnh verify sau sửa.
   - Reflection: ✓ Bám sát yêu cầu, KISS/YAGNI.

4. Sau khi user duyệt spec và cho chạy implement
   - Action sequence:
     1) Edit `app/admin/menus/page.tsx` đúng 1 đoạn callback `onOpenChange`.
     2) Edit `components/site/Header.tsx` đúng 1 đoạn map callback.
     3) Báo lại diff ngắn gọn.
     4) Do user chọn chưa verify nên bỏ qua bước chạy oxlint/tsc.
     5) Nếu user vẫn muốn tuân thủ rule repo về commit, em sẽ commit ngay sau khi sửa (không push), kèm `.factory/docs` nếu có thay đổi liên quan.

## Checklist ngắn
- [x] Chỉ 2 file đích
- [x] Không đổi logic nghiệp vụ
- [x] Không mở rộng ngoài scope
- [x] Không chạy verify theo lựa chọn hiện tại