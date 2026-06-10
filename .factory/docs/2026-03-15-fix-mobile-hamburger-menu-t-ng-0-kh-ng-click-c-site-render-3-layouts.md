## Audit Summary
- **Observation**
  - Ở site thật, component header dùng file: `components/site/Header.tsx` (được render qua `app/(site)/layout.tsx` → `SiteShell`).
  - Trong mobile menu của cả **classic/topbar/allbirds**, item tầng 0 đang render bằng `<button>` và `onClick={() => item.children.length > 0 && toggleMobileItem(item._id)}`.
  - Vì vậy với item có con (vd: “Trang chủ”), click chỉ toggle submenu, **không điều hướng** đến `item.url`.
- **Evidence**
  - `components/site/Header.tsx` tại 3 block mobile menu (khoảng các đoạn ~872, ~1135, ~1429) đều dùng cùng pattern `<button>` cho item tầng 0.
  - Chỉ item tầng 1 mới là `<Link href={child.url}>` nên hiện tại user “chỉ click được menu con”.
- **Inference**
  - Root cause là **event handling + semantic element sai cho mục có URL**: tầng 0 dùng button độc quyền expand/collapse thay vì tách rõ vùng điều hướng và vùng mở submenu.

## Root Cause Confidence
- **High** — Vì code ở cả 3 layout đang dùng cùng logic chặn điều hướng tầng 0 khi có children; triệu chứng khớp 1-1 với hành vi người dùng báo.

## Implementation Proposal
Theo lựa chọn của anh: **"Bấm label để điều hướng, bấm icon để mở/đóng menu con"**.

### Files sẽ sửa
1. `components/site/Header.tsx` (duy nhất)

### Cách sửa cụ thể (áp dụng đồng nhất cho 3 block mobile menu)
- Với mỗi `item` tầng 0 trong mobile menu:
  - Thay cấu trúc hiện tại `button` bọc cả label + chevron bằng wrapper `div` gồm 2 vùng:
    1. **Label area**: `<Link href={item.url}>` (chiếm full phần text bên trái), click sẽ navigate và đóng mobile menu (`setMobileMenuOpen(false)`).
    2. **Toggle area**: `<button aria-label="Mở menu con ...">` chỉ hiển thị khi `item.children.length > 0`, click gọi `toggleMobileItem(item._id)`; `stopPropagation/preventDefault` để không trigger navigate.
- Giữ nguyên rendering submenu tầng 1/2 và style tokens hiện tại để không phá parity màu + layout.
- Bổ sung a11y nhẹ:
  - `aria-expanded` cho nút chevron.
  - `aria-controls` (id của submenu theo item id) để semantic rõ.

### Tác động mong đợi
- Mobile hamburger ở cả 3 layout:
  - Click **label tầng 0** (vd Trang chủ) điều hướng được như desktop.
  - Click **icon chevron** vẫn mở/đóng submenu như cũ.

## Counter-hypothesis đã loại trừ
- Không phải do data menu thiếu URL: tầng 1 đang điều hướng bình thường bằng chính `child.url`.
- Không phải do router/link global: desktop + child links đều hoạt động.

## Verification Plan
- **Static review (không chạy lint/test theo guideline repo):**
  1. Soát 3 block mobile menu trong `Header.tsx` để chắc chắn cùng behavior mới.
  2. Soát TypeScript props/event handlers không sinh lỗi kiểu.
  3. Soát edge case:
     - Item không có children: chỉ có link, không có toggle icon.
     - Item có children + openInNewTab: giữ `target`/`rel`.
- **Repro/pass-fail (manual by tester):**
  - Route: mobile viewport ở site thật.
  - Pass khi:
    - Tầng 0 (Trang chủ) click label điều hướng thành công.
    - Chevron chỉ toggle submenu, không điều hướng.
    - Hành vi nhất quán trên classic/topbar/allbirds.
  - Fail nếu còn hiện tượng click tầng 0 không điều hướng hoặc click chevron làm redirect.

Nếu anh duyệt spec này, em sẽ triển khai patch đúng 1 file `components/site/Header.tsx` và commit theo rule của repo.