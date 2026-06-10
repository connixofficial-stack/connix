## Problem Graph
1. [Main] Sửa marquee Gallery để auto-scroll vô hạn, không dừng <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Keyframes/track chưa đảm bảo loop liên tục theo chiều rộng thực tế
   1.2 [Sub] Preview và runtime render có thể lệch behavior
   1.3 [Sub] Thiếu guard cho trường hợp item ít và reduced-motion

## Execution (with reflection)
1. Sửa engine marquee trong preview (`app/admin/home-components/gallery/_components/GalleryPreview.tsx`)
   - Dùng 1 track `width: max-content`, data duplicate (`items + items`) khi >=2 item.
   - Keyframes chuẩn: `0% translateX(0)` -> `100% translateX(-50%)`, `linear infinite`.
   - Auto chạy mặc định; pause chỉ khi hover/focus bằng CSS.
   - Reflection: đảm bảo không “dừng cuối vòng” và vẫn mượt.

2. Sửa tương tự runtime render (`components/site/ComponentRenderer.tsx` phần Gallery marquee)
   - Áp cùng pattern/định dạng animation như preview để parity 1:1.
   - Giữ scope chỉ layout `marquee` của Gallery, không động các layout khác.
   - Reflection: tránh mismatch preview vs site.

3. Hardening edge-cases
   - 0 item: empty state như cũ.
   - 1 item: không animate (hoặc animate none) để tránh cảm giác giật/lặp trống.
   - Respect `prefers-reduced-motion`.
   - Reflection: ổn định UX và accessibility.

4. Validation + commit
   - Chạy `bunx tsc --noEmit`.
   - Nếu pass: commit local theo convention, không push.

## Expected Outcome
- Marquee Gallery chạy auto liên tục, không dừng khi hết 1 vòng.
- Hover vẫn pause.
- Preview và render thực tế đồng nhất.