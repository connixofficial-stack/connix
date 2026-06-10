## Problem Graph
1. [Marquee Gallery bị cảm giác duplicate khó chịu] <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] AutoScrollSlider đang render `children` lặp 3 lần cố định
   1.2 Key hiện tại theo `photo.id` nên 3 bản sao có cùng key trong cùng level map
   1.3 Chưa có cơ chế "minimum loop set" theo số lượng ảnh (ít ảnh sẽ lặp quá lộ)

## Execution (with reflection)
1. Solving 1.1.1 (render strategy)
   - Thought: Đổi từ hardcode 3 dải children sang render động theo `loopCount`.
   - Action: Sửa `app/admin/home-components/_shared/components/AutoScrollSlider.tsx` để nhận thêm prop `loopCount?: number` (default 2), và render bằng `Array.from({length: loopCount})`.
   - Reflection: ✓ Giữ DRY/KISS, tái sử dụng cho cả Gallery/Partners/TrustBadges.

2. Solving 1.2 (duplicate key)
   - Thought: Khi clone nhiều dải, key phải khác nhau giữa các bản sao.
   - Action: Ở `app/admin/home-components/gallery/_components/GalleryPreview.tsx`, trong style marquee bọc map theo từng loop index, key dạng `gallery-marquee-${loopIdx}-${photo.id}`.
   - Reflection: ✓ Loại warning key trùng và ổn định reconciliation.

3. Solving 1.3 (giảm cảm giác lặp)
   - Thought: Ảnh ít thì nên giảm tốc + tăng khoảng cách + loop vừa đủ.
   - Action: Trong `renderGalleryMarqueeStyle` tính:
     - `itemCount = items.length`
     - `marqueeSpeed = itemCount <= 4 ? 0.35 : 0.6`
     - `loopCount = itemCount <= 6 ? 2 : 3`
     truyền vào `AutoScrollSlider`.
   - Reflection: ✓ UX mượt hơn, bớt thấy pattern lặp với data nhỏ.

4. Parity & safety
   - Thought: Chỉ đổi logic marquee preview, không đụng schema/config.
   - Action: Giữ nguyên shape `items`, không sửa submit payload ở `...[id]/edit/page.tsx`.
   - Reflection: ✓ Không rủi ro runtime/save button.

5. Validation (theo rule dự án)
   - Action: Chạy `bunx tsc --noEmit` sau khi sửa code TS/TSX.
   - Reflection: Nếu lỗi thì fix ngay rồi chạy lại đến khi pass.

6. Commit (theo AGENTS.md)
   - Action:
     - `git status`
     - `git diff --cached` (sau khi stage)
     - kiểm tra secrets
     - commit message đề xuất: `fix(gallery): reduce marquee duplication and stabilize loop keys`
   - Reflection: ✓ Commit local, không push.

## Kết quả mong đợi
- Marquee vẫn infinite scroll nhưng không còn cảm giác “dup lộ”.
- Không còn nguy cơ duplicate keys ở các clone lane.
- Tương thích các component đang dùng `AutoScrollSlider` nhờ default an toàn.