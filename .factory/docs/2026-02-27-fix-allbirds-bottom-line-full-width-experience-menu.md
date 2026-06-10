## Mục tiêu
Sửa preview layout **Allbirds** tại `/system/experiences/menu` để đường line xám phía dưới header kéo **full ngang viewport preview trên desktop**, không còn cảm giác bị giới hạn theo container; mobile/tablet giữ nguyên hiện trạng.

## Problem Graph
1. [Main] Bottom line Allbirds không full-width trên desktop
   1.1 [Sub] Xác định line xám đang render ở đâu trong preview Allbirds
      1.1.1 [ROOT CAUSE] Line đang kế thừa bố cục nằm trong wrapper bị giới hạn theo khung container của header row
   1.2 [Sub] Đảm bảo thay đổi chỉ áp dụng desktop
   1.3 [Sub] Tránh ảnh hưởng classic/topbar và mobile/tablet

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: `HeaderMenuPreview.tsx` đang render Allbirds bằng `renderAllbirdsStyle()`, line xám là separator render cuối block (`classicSeparatorElement`) hoặc `border-b` của header row.
   - Action: Tách cấu trúc phần separator trong Allbirds để line desktop được render bằng 1 block riêng full-width (không bọc trong vùng chứa nội dung hàng header).
   - Reflection: Nếu line còn bị contain, chuyển line thành element độc lập ngay dưới header shell với `w-full` và border/background token.

2. Solving 1.2...
   - Thought: User muốn desktop full-bleed, mobile/tablet giữ nguyên.
   - Action: Thêm điều kiện theo `device` trong `renderAllbirdsStyle()`:
     - `device === 'desktop'`: render line full-width riêng.
     - `device !== 'desktop'`: giữ logic cũ (line theo hiện trạng).
   - Reflection: Cách này an toàn, không đổi hành vi mobile/tablet.

3. Solving 1.3...
   - Thought: Không được chạm classic/topbar.
   - Action: Chỉ sửa nhánh `layoutStyle === 'allbirds'` trong `components/experiences/previews/HeaderMenuPreview.tsx`, không thay shared token/function dùng chung cho layout khác.
   - Reflection: Giảm rủi ro regression.

4. Validation
   - Chạy `bunx tsc --noEmit` theo rule repo sau khi sửa TS/TSX.
   - Verify nhanh bằng đọc lại diff: chỉ có thay đổi ở `HeaderMenuPreview.tsx`, line desktop full-width, mobile/tablet giữ nguyên.

5. Commit
   - Commit 1 commit theo convention hiện tại, ví dụ:
     - `fix(experience-menu): make allbirds bottom separator full-width on desktop preview`

## File dự kiến chỉnh
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\components\experiences\previews\HeaderMenuPreview.tsx`
  - Chỉnh nhánh render Allbirds để separator desktop full-width, mobile/tablet giữ nguyên.