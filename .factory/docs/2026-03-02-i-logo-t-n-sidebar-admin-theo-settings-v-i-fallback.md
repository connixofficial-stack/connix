## Problem Graph
1. [Main] Đồng bộ branding ở `/admin` theo dữ liệu từ `/admin/settings` <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Sidebar đang hardcode `V` và `VietAdmin` trong `app/admin/components/Sidebar.tsx`
   1.2 [Data source] Cần đọc key settings tương ứng (`site_logo`, `site_name`) từ Convex
   1.3 [Fallback] Nếu thiếu dữ liệu phải fallback đúng yêu cầu: tên `YourLogo`, logo chữ `Y`

## Execution (with reflection)
1. Solving 1.1.1 (hardcode branding)
   - Thought: Branding đang render cứng tại header sidebar, chỉ cần thay đúng điểm này để giữ KISS/YAGNI.
   - Action: Sửa `app/admin/components/Sidebar.tsx` phần header logo/tên.
   - Reflection: ✓ Tác động nhỏ, đúng phạm vi user yêu cầu.

2. Lấy dữ liệu từ settings (1.2)
   - Thought: `Sidebar.tsx` đã dùng `useQuery` + `api`, nên dùng cùng pattern hiện có để tránh thêm abstraction dư thừa.
   - Action: Thêm query:
     - `const siteSettings = useQuery(api.settings.getMultiple, { keys: ['site_logo', 'site_name'] });`
     - Mapping:
       - `brandName = (siteSettings?.site_name as string)?.trim() || 'YourLogo'`
       - `brandLogo = (siteSettings?.site_logo as string)?.trim() || ''`
   - Reflection: ✓ Đồng nhất convention codebase, không tạo file mới không cần thiết.

3. Áp dụng fallback UI (1.3)
   - Thought: Yêu cầu nói rõ “nếu thiếu thì fallback YourLogo và logo là chữ Y”.
   - Action: Ở block logo header sidebar:
     - Nếu `brandLogo` hợp lệ (`isValidImageSrc(brandLogo)`), render `<Image ... />` trong khung 9x9.
     - Nếu không hợp lệ/rỗng, render chữ `Y` như avatar fallback.
     - Text bên cạnh hiển thị `brandName` (fallback `YourLogo`).
   - Reflection: ✓ Đáp ứng đủ cả logo + tên fallback độc lập.

4. Verify + commit theo rule repo
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Commit với message ngắn gọn kiểu: `fix(admin): use settings branding for sidebar with fallback`.
     - Nếu có thay đổi trong `.factory/docs` thì add kèm vào commit theo AGENTS.md.
   - Reflection: ✓ Tuân thủ guideline dự án (không lint/test thêm, không push).

Checklist kết quả mong đợi:
- `/admin` không còn hardcode `V` và `VietAdmin`.
- Sidebar dùng `site_logo` + `site_name` từ Settings.
- Thiếu logo => hiện chữ `Y`; thiếu tên => hiện `YourLogo`.
- Typecheck pass và có commit hoàn tất.