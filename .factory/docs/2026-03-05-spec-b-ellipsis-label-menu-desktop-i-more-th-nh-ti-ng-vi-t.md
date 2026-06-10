## Problem Graph
1. [Main] Label menu bị `...` gây khó chịu + chữ `More` chưa phù hợp tiếng Việt
   1.1 [Sub] Item nav đang bị truncate cứng dù có cơ chế gom item
      1.1.1 [ROOT CAUSE] Class `truncate/max-w` đang áp vào label menu desktop
   1.2 [Sub] Nhãn gom item đang hardcode `More`
      1.2.1 [ROOT CAUSE] Chưa có label tiếng Việt thống nhất cho desktop

## Execution (with reflection)
1. Bỏ ellipsis cho label menu desktop, ưu tiên gom item vào menu “Thêm”
   - File: `components/site/Header.tsx`
   - File: `components/experiences/previews/HeaderMenuPreview.tsx`
   - Áp dụng cho desktop của Classic/Topbar/Allbirds (site + preview):
     - Bỏ `truncate`, `max-w-[160px]`, `max-w-[120px]` tại các label item desktop.
     - Giữ `whitespace-nowrap` để luôn 1 dòng như yêu cầu.
     - Giữ nguyên cơ chế overflow đã có để item không đủ chỗ sẽ vào menu gom.
   - Reflection: đúng yêu cầu “full label 1 dòng, không ...; thiếu chỗ thì gom item”.

2. Đổi toàn bộ label `More` trên desktop thành `Thêm`
   - File: `components/site/Header.tsx`
   - File: `components/experiences/previews/HeaderMenuPreview.tsx`
   - Thay text hiển thị dropdown trigger từ `More` -> `Thêm` cho mọi desktop layout.
   - Không đổi text ở mobile nếu không có `More` logic tương ứng.
   - Reflection: từ ngắn gọn, tiếng Việt, nhất quán với UI hiện tại.

3. Đảm bảo parity preview/site
   - Cùng chỉnh đúng các vị trí desktop ở cả preview và runtime để hành vi giống nhau.

4. Validation
   - Chạy `bunx tsc --noEmit`.
   - Kiểm tra thủ công:
     - Label dài không còn `...` trên desktop.
     - Khi thiếu chỗ, item chuyển vào menu `Thêm` đúng.
     - Classic/Topbar/Allbirds desktop đều hiển thị `Thêm`.

5. Commit
   - Commit local theo convention, kèm `.factory/docs`.

## Checklist
- [ ] Desktop labels không còn ellipsis (`...`)
- [ ] Item thiếu chỗ được gom vào menu `Thêm`
- [ ] `More` đã đổi thành `Thêm` trên desktop (Classic/Topbar/Allbirds)
- [ ] Parity site + preview
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs`)