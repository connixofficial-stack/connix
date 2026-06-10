## Audit Summary
- **Observation:** Trong `components/site/Header.tsx`, nhánh `headerStyle === 'classic'` dùng container actions mobile là `className="flex items-center gap-1 lg:hidden"` (không có `ml-auto`). Trong preview (`components/experiences/previews/HeaderMenuPreview.tsx`) ở classic mobile dùng `className="ml-auto flex items-center gap-2"`.
- **Observation:** `classic` site đang dùng `gap-1`, còn preview dùng `gap-2`, nên khoảng cách icon không đồng nhất.
- **Observation:** `topbar` và `allbirds` trên site hiện đã có khối action mobile tách riêng ở phải, nhưng chưa chuẩn hóa hoàn toàn spacing/utility theo parity contract để tránh lệch tái diễn.
- **Inference (root cause chính):** Thiếu `ml-auto` + sai `gap` ở mobile actions của classic khiến cụm Search/Hamburger không bám phải như preview, dẫn tới cảm giác lệch.

## Root Cause Confidence
- **High (90%)** vì có evidence trực tiếp từ diff className giữa site và preview trong cùng pattern component.
- **Giả thuyết thay thế đã xét:** lệch do icon size hoặc padding (`p-2`) — nhưng topbar/allbirds dùng size/padding tương tự vẫn ổn; điểm khác biệt quyết định là alignment class.

## Kế hoạch triển khai (theo scope bạn chọn: cả 3 style)
1. **Classic mobile actions parity** (`components/site/Header.tsx`)
   - Đổi `className="flex items-center gap-1 lg:hidden"` thành `className="ml-auto flex items-center gap-2 lg:hidden"`.
   - Giữ nguyên hành vi `showSearch`, `showCart`, `renderMobileMenuButton(false)` để không đổi logic.

2. **Topbar mobile actions parity hardening** (`components/site/Header.tsx`)
   - Chuẩn hóa class block mobile actions về cùng contract spacing với preview (`flex lg:hidden items-center gap-2`).
   - Chỉ chỉnh utility/class nếu cần, không chạm business logic.

3. **Allbirds mobile actions parity hardening** (`components/site/Header.tsx`)
   - Chuẩn hóa block mobile actions về cùng chuẩn mobile parity (gap/icon spacing/justify giữ đồng nhất).
   - Không thay đổi desktop/allbirds dropdown behavior.

4. **Static self-review trước bàn giao**
   - Kiểm tra lại 3 nhánh style đều có:
     - mobile action cluster nằm bên phải (ml-auto hoặc equivalent layout đảm bảo push-right),
     - spacing icon đồng nhất `gap-2`,
     - không ảnh hưởng điều kiện hiển thị search/cart/menu.

5. **Commit**
   - Commit 1 lần với message theo convention repo, ví dụ: `fix: align mobile search and menu actions in site header across styles`
   - Không push.

## Verification Plan
- **Typecheck:** chạy `bunx tsc --noEmit` (theo rule repo khi có thay đổi TS/code).
- **Repro thủ công:**
  1. Mở site mobile viewport (classic/topbar/allbirds), kiểm tra search icon + hamburger nằm cùng cụm sát phải.
  2. So với `/system/experiences/menu` preview mobile để đảm bảo parity thị giác.
  3. Mở/tắt search + mobile menu để đảm bảo không regress tương tác.
- **Pass criteria:** cụm icon không còn lệch trái trong classic; cả 3 style có spacing/alignment mobile nhất quán với preview; không phát sinh lỗi typecheck.