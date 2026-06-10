## Audit Summary
- **Observation:** Ở `components/site/Header.tsx`, nhánh `classic` đã có cụm mobile actions `className="ml-auto flex items-center gap-2 lg:hidden"`.
- **Observation:** Tuy nhiên cụm này đang nằm bên trong wrapper cha `className="flex items-center gap-3 flex-shrink-0"` tại khối actions desktop/mobile chung.
- **Observation:** Trong layout classic, logo nằm trước, nav desktop bị `hidden`, nhưng wrapper actions vẫn giữ cấu trúc desktop-first nên phần mobile cluster không thực sự chiếm hết phần còn lại của hàng theo cách preview đang làm.
- **Inference:** Root cause không chỉ là thiếu `ml-auto` ở chính cụm icon nữa; vấn đề là classic site vẫn bọc mobile actions trong container desktop actions, nên alignment contract khác với preview mobile. Preview classic mobile render cụm actions như một block độc lập ở cuối row, còn site dùng nested flex làm việc đẩy phải chưa triệt để trong mọi trạng thái thực tế.

## Root Cause Confidence
- **High (88%)** vì evidence trực tiếp nằm ở cấu trúc DOM/class của classic site khác parity với preview, trong khi topbar/allbirds ổn và bạn đã xác nhận chỉ classic bị lỗi.
- **Giả thuyết thay thế đã xét:** do `CartIcon` width hoặc icon padding gây lệch; nhưng nếu chỉ do icon width thì topbar/allbirds cũng dễ bị tương tự. Khác biệt nổi bật nhất vẫn là cấu trúc wrapper classic.

## Kế hoạch triển khai
1. **Refactor riêng mobile actions của classic** trong `components/site/Header.tsx`
   - Tách cụm mobile `search/cart/hamburger` ra khỏi wrapper desktop actions chung.
   - Đưa về cấu trúc parity với preview: logo ở trái, mobile actions là block sibling cuối row, dùng `ml-auto flex items-center gap-2 lg:hidden`.

2. **Giữ nguyên desktop classic behavior**
   - Wrapper desktop actions chỉ còn search desktop/cart desktop/cta desktop với `hidden lg:*` như hiện tại.
   - Không đổi logic `showSearch`, `showCart`, `config.cta?.show`.

3. **Không chạm topbar/allbirds**
   - Vì user đã xác nhận hai style này đang ổn.
   - Tránh mở rộng scope ngoài yêu cầu.

4. **Static self-review**
   - Kiểm tra classic mobile row có đúng contract:
     - logo trái,
     - cụm search/hamburger sát phải,
     - spacing icon `gap-2`,
     - không ảnh hưởng menu/search toggle.

5. **Commit**
   - Commit local sau khi sửa, không push.

## Verification Plan
- **Typecheck:** chạy `bunx tsc --noEmit` vì có thay đổi TS/TSX.
- **Repro thủ công:**
  1. Mở `/` ở mobile viewport.
  2. Kiểm tra header classic: search + hamburger nằm sát mép phải như preview `/system/experiences/menu` mobile.
  3. Bấm mở search và mobile menu để đảm bảo không regress.
- **Pass criteria:** chỉ classic được chỉnh; cụm actions mobile nằm sát phải ổn định; topbar/allbirds không bị ảnh hưởng; typecheck pass.