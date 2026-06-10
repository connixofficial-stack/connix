## Problem Graph
1. [Main] Posts Detail Experience chưa tuân thủ tốt dual-brand-color-system <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chỉ dùng `useBrandColor()` (single color), không có `primary + secondary + mode`
   1.2 [Sub] Thiếu `ColorConfigCard` để override preview theo chuẩn Experiences
   1.3 [Sub] Nhiều accentColor hardcode `#3b82f6` thay vì bám theo brand/tokens
   1.4 [Sub] Chưa có pipeline token/helper màu riêng cho posts-detail preview (Single Source of Truth)

## Execution (with reflection)
1. Solving 1.1.1 (state màu theo CoC)
   - Thought: Skill yêu cầu Experiences phải load/sync đủ 3 giá trị từ settings.
   - Observation (từ `app/system/experiences/posts-detail/page.tsx`): đang dùng `useBrandColor()` + truyền `brandColor` đơn lẻ vào preview.
   - Reflection: ✓ Đây là vi phạm chính, khiến dual mode từ settings không thể phản ánh đúng.

2. Solving 1.2 (UI cấu hình màu)
   - Thought: Skill yêu cầu có ColorConfigCard để user test màu real-time tại experience.
   - Observation: file chưa có `ColorConfigCard`, chưa có state `secondaryColor`, `colorMode`.
   - Reflection: ✓ Thiếu UX bắt buộc theo skill.

3. Solving 1.3 (hardcode accent)
   - Thought: Các control nên nhận accent theo brand hiện tại.
   - Observation: nhiều nơi dùng cố định `#3b82f6` (ToggleRow, LayoutTabs, ExampleLinks).
   - Reflection: ✓ Không linh hoạt, không bám brand settings.

4. Solving 1.4 (helper/tokens)
   - Thought: Cần chuẩn hóa helper màu để preview/site đồng nhất logic.
   - Observation: page chưa dùng helper `get<Comp>Colors`, chưa có token map semantic.
   - Reflection: ✓ Chưa đạt Single Source of Truth ở layer experience này.

## Danh sách vấn đề cụ thể
- Không load/sync `secondary` và `mode` từ brand settings (vi phạm 6.1).
- Không có `ColorConfigCard` trong nhóm controls (vi phạm 6.1 UI components).
- Hardcode màu xanh hệ thống ở nhiều control (`#3b82f6`) thay vì brand-driven accent.
- Preview chỉ nhận `brandColor`, thiếu contract dual-brand (`brandColor`, `secondaryColor`, `colorMode` hoặc tokens tương đương).
- Chưa có helper màu riêng cho posts-detail experience để đảm bảo preview/site đồng bộ lâu dài.

## Plan fix (full implement, step-by-step)
1. **Chuẩn hóa source màu ở page experience** (`app/system/experiences/posts-detail/page.tsx`)
   - Đổi `useBrandColor()` -> `useBrandColors()`.
   - Thêm 3 state local:
     - `brandColor` từ `brandColors.primary`
     - `secondaryColor` từ `brandColors.secondary || ''`
     - `colorMode` từ `brandColors.mode || 'single'`
   - Thêm `useEffect` sync đủ 3 trường khi settings đổi.

2. **Thêm UI ColorConfigCard đúng chuẩn Experiences**
   - Import và render `ColorConfigCard` vào grid controls.
   - Bind handlers: đổi mode, primary, secondary để preview cập nhật realtime.
   - Rule hiển thị: mode=single thì ẩn info secondary/accent balance theo chuẩn skill.

3. **Loại bỏ hardcode `#3b82f6` ở controls**
   - Tạo `accentColor` lấy từ `brandColor` (hoặc token semantic phù hợp).
   - Áp dụng cho `ToggleRow`, `LayoutTabs`, `ExampleLinks`.
   - Giữ fallback an toàn khi màu invalid.

4. **Chuẩn hóa props màu cho preview contract**
   - Cập nhật call `PostDetailPreview` để truyền thêm `secondaryColor`, `colorMode`.
   - Nếu `PostDetailPreview` chưa hỗ trợ:
     - cập nhật interface props tại component tương ứng trong `components/experiences/...`
     - đảm bảo mode single resolve secondary = primary (monochromatic strict).

5. **(Khuyến nghị mạnh) Bổ sung helper màu riêng posts-detail**
   - Tạo file helper kiểu `_lib/colors.ts` cho posts-detail experience (hoặc vị trí convention hiện có của experiences) với `getPostDetailColors(primary, secondary, mode)`.
   - Trong helper: resolve secondary theo mode, sinh semantic tokens cho phần heading/badge/action/meta theo dual-brand contract.
   - Dùng helper ở preview để tránh inline/hardcode màu rải rác.

6. **Đồng bộ site page posts detail với cùng helper (Single Source of Truth)**
   - Tìm route site render thật của post detail (`app/(site)/.../posts/[slug]/...`).
   - Replace inline/hardcoded brand color bằng tokens từ cùng helper.
   - Đảm bảo dual/single hiển thị site giống preview.

7. **Validation bắt buộc**
   - Chạy `bunx tsc --noEmit`.
   - Smoke check logic:
     - settings dual + 2 màu -> vào `/system/experiences/posts-detail` thấy đúng mode/màu.
     - chuyển single -> secondary không còn ảnh hưởng render.
     - preview đổi màu realtime không cần save.

8. **Commit (theo rule repo)**
   - Commit sau khi pass typecheck, message dạng: `fix(posts-detail): align experience color system with dual-brand skill`.

## Kết quả mong đợi sau fix
- Posts-detail experience tuân thủ đầy đủ convention 6.1 (primary/secondary/mode + ColorConfigCard + sync settings).
- Loại bỏ hardcode accent màu.
- Đặt nền cho Single Source of Truth giữa preview và site theo dual-brand-color-system.