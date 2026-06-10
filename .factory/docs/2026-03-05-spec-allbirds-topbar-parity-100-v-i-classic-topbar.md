## Problem Graph
1. [Main] Làm layout `allbirds` có topbar y hệt 2 layout còn lại <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `allbirds` đang render `announcement bar` riêng, không dùng cùng contract topbar (hotline/email/slogan/track/login)
   1.2 [Sub] Vị trí render khác (announcement nằm trên nav nhưng cấu trúc khác)
   1.3 [Sub] Rule responsive mobile chưa đồng bộ tuyệt đối với classic/topbar

## Execution (with reflection)
1. Chuẩn hóa dữ liệu hiển thị topbar cho allbirds
- File: `components/site/Header.tsx`
- Giữ source dữ liệu topbar hiện có (`topbarConfig`, `showTrackOrder`, `showLogin`, `showTopbarSlogan`, `topbarContact`) để allbirds dùng chung logic với classic/topbar.
- Loại bỏ dependency hiển thị `allbirdsAnnouncement` trong allbirds path.
- Reflection: ✓ Giải root cause lệch contract hiển thị.

2. Thay announcement bar của allbirds bằng topbar block giống classic/topbar
- File: `components/site/Header.tsx`
- Trong nhánh render `headerStyle === 'allbirds'`:
  - Xóa khối announcement hiện tại (`tokens.allbirdsAnnouncementBg/allbirdsAnnouncementText`, text `allbirdsAnnouncement`).
  - Thêm block topbar trước nav với cùng cấu trúc 3 cột như classic/topbar:
    - Trái: hotline (icon Phone).
    - Giữa: slogan (center + truncate).
    - Phải: track order + divider + login/register.
    - Email: hiện trên desktop, ẩn mobile giống `hidden sm:flex`.
- Dùng token topbar chung (`tokens.topbarBg`, `tokens.topbarText`, `tokens.topbarDivider`) để đồng nhất UI.
- Reflection: ✓ Đúng yêu cầu full parity 100% + vị trí trước nav.

3. Đồng bộ responsive rule cho allbirds
- File: `components/site/Header.tsx`
- Mobile rule cho allbirds topbar giống 2 layout kia:
  - Ẩn email trên mobile.
  - Slogan dùng `truncate` + text size mobile tương đương (`text-[11px]`/`text-xs` theo pattern đang có).
  - Giữ hành vi nút track/login tương tự (ẩn/hiện theo điều kiện và breakpoints đang dùng ở classic/topbar).
- Reflection: ✓ Đáp ứng đúng lựa chọn mobile parity.

4. Đồng bộ preview để editor thấy đúng như runtime
- File: `components/experiences/previews/HeaderMenuPreview.tsx`
- Nhánh `renderAllbirdsStyle()`:
  - Bỏ announcement bar riêng của allbirds.
  - Render topbar block giống nhánh classic/topbar preview (hotline/email/slogan/track/login), đặt trước nav.
  - Giữ cùng condition show/hide (`displayTopbar.show`, `showSlogan`, `showTrackOrder`, `showLoginLink`).
  - Giữ truncate slogan mobile và ẩn email mobile như runtime.
- Reflection: ✓ Tránh lệch preview ≠ site.

5. Dọn biến dư thừa liên quan announcement cũ
- Files:
  - `components/site/Header.tsx`
  - `components/experiences/previews/HeaderMenuPreview.tsx`
- Xóa biến chỉ phục vụ announcement allbirds nếu không còn dùng (`allbirdsAnnouncement` và các class/style phụ thuộc).
- Giữ token allbirds khác (accent/nav) không liên quan.
- Reflection: ✓ KISS, tránh dead code.

6. Verification
- Chạy `bunx tsc --noEmit`.
- Smoke checklist:
  - Chuyển layout allbirds: có topbar ở trên cùng trước nav.
  - Hotline hiện; email ẩn mobile/hiện desktop.
  - Slogan center + truncate mobile.
  - Track order/login hoạt động đúng điều kiện module/auth.
  - Preview allbirds và site allbirds nhìn/logic đồng nhất.

7. Commit
- Commit local, include `.factory/docs` theo rule repo.

## Checklist acceptance
- [ ] Allbirds không còn announcement bar riêng.
- [ ] Allbirds có topbar y hệt classic/topbar về cấu trúc và logic.
- [ ] Topbar nằm trên cùng, trước nav.
- [ ] Mobile rule parity: ẩn email, slogan truncate.
- [ ] Preview allbirds parity với runtime.
- [ ] `bunx tsc --noEmit` pass.