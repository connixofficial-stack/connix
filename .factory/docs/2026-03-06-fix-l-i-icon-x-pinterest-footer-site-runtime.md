## Problem Graph
1. [Main] Icon social X/Pinterest đúng ở preview nhưng sai ở site thực  
   1.1 [ROOT CAUSE] `components/site/ComponentRenderer.tsx` (`FooterSection`) chưa có case render icon `x` và `pinterest`  
   1.2 [ROOT CAUSE] Mapping màu gốc social ở runtime chưa có `x` và `pinterest` nên fallback sai màu  
   1.3 [Sub] Cần parity cả hai đường render footer runtime (`FooterSection` + `DynamicFooter`) theo yêu cầu bạn

## Execution (with reflection)
1. Solving 1.1 (FooterSection icon switch)
   - Thought: Bổ sung đúng 2 icon còn thiếu để runtime map đúng platform.
   - Action: Sửa `components/site/ComponentRenderer.tsx` trong `renderSocialIcon()`:
     - Thêm case `x` dùng icon X (SVG hoặc `lucide-react` `X` theo style file).
     - Thêm case `pinterest` dùng SVG Pinterest (giống preview để đồng nhất visual).
   - Reflection: ✓ Loại bỏ fallback `Globe` sai icon.

2. Solving 1.2 (FooterSection original color map)
   - Thought: Khi bật `useOriginalSocialIconColors`, cần đúng token màu cho 2 platform mới.
   - Action: Trong `SOCIAL_ORIGINAL_COLORS` của `FooterSection`, thêm:
     - `x: { bg: '#000000', icon: '#ffffff' }`
     - `pinterest: { bg: '#E60023', icon: '#ffffff' }`
   - Reflection: ✓ Parity với preview theo lựa chọn của bạn.

3. Solving 1.3 (đồng bộ DynamicFooter)
   - Thought: Bạn chọn fix cả `DynamicFooter` để không lệch ở runtime path khác.
   - Action: Sửa `components/site/DynamicFooter.tsx`:
     - Bổ sung icon `X` và `PinterestIcon` vào `SocialIcon` switch.
     - Bổ sung `x` + `pinterest` vào `SOCIAL_ORIGINAL_COLORS` cùng giá trị như preview.
   - Reflection: ✓ Đồng bộ toàn bộ site runtime, tránh bug tái phát do khác code path.

4. Safety + parity checks
   - Action:
     - So khớp lại 3 nơi: `FooterPreview.tsx`, `ComponentRenderer.tsx`, `DynamicFooter.tsx` (icon + màu).
     - Chạy đúng rule repo: `bunx tsc --noEmit`.
   - Reflection: ✓ Đảm bảo không vỡ type và không lệch preview/site.

5. Commit theo rule dự án
   - Action:
     - `git status` + `git diff --cached` kiểm tra sạch secrets.
     - Commit 1 commit fix bug footer social icons runtime.
     - Add kèm `.factory/docs` nếu có thay đổi liên quan.
   - Reflection: ✓ Hoàn tất đúng convention repo (commit, không push).

## Checklist hoàn thành
- [ ] FooterSection render đúng icon `x` và `pinterest`.
- [ ] DynamicFooter render đúng icon `x` và `pinterest`.
- [ ] Màu gốc social cho `x`/`pinterest` giống preview.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit local, không push.