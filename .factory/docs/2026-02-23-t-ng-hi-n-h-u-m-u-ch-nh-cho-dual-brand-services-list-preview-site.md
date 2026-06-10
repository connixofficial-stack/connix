## Problem Graph
1. [Main] Tăng sự hiện hữu màu chính khi `colorMode='dual'` cho 3 layout services-list (preview + site) <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Site `/services` còn nhiều chỗ dùng `brandColor` inline/hardcode, chưa dùng token system nhất quán theo dual-brand helper.
   1.2 Preview hiện đã có dual inputs nhưng phân phối accent chưa đủ đậm cho primary ở vài điểm nhỏ (pagination/loading/filter accents).
   1.3 Chưa đồng bộ hoàn toàn “Single Source of Truth” giữa experience preview và site cho tất cả layout components.

## Execution (with reflection)
1. Chuẩn hóa nguồn màu dùng chung cho services-list
   - File: tìm và dùng lại helper màu hiện có của services-list (`components/experiences` + `components/site/services`), nếu thiếu thì bổ sung trong file màu hiện hữu của feature services-list (không tạo logic rải rác).
   - Logic: đảm bảo helper trả semantic tokens rõ cho 3 layout, ưu tiên primary cho heading/CTA/active states; secondary cho label/badge phụ.
   - Reflection: phù hợp skill dual-brand-color-system (60-30-10, single source of truth).

2. Tăng hiện hữu primary ở preview `/system/experiences/services-list`
   - File: `app/system/experiences/services-list/page.tsx` (chỉ wiring nếu cần), và preview components services-list liên quan.
   - Logic: các điểm sau chuyển sang token/primary rõ hơn khi dual:
     - tiêu đề section/layout tab active/điểm nhấn chính,
     - pagination active + nav controls,
     - search focus/accent,
     - loading dots dùng token solid không opacity decor.
   - Reflection: giữ KISS, không thêm hiệu ứng thừa, không thay đổi behavior ngoài màu.

3. Chuẩn hóa site `/services` theo token-based dual-brand
   - File chính: `app/(site)/services/page.tsx`.
   - Logic:
     - Đổi từ chỉ đọc `{ primary, secondary }` sang `{ primary, secondary, mode }`.
     - Generate `tokens` qua helper màu services-list bằng `useMemo(primary, secondary, mode)`.
     - Pass `tokens` vào cả 3 layout: `FullWidthLayout`, `SidebarLayout`, `MagazineLayout`.
     - Thay các inline styles pagination/select/loading từ `brandColor`/opacity bằng semantic tokens tương ứng.
   - Reflection: đây là root fix để site phản ánh dual đúng như preview.

4. Cập nhật signature/layout components services
   - File: các component trong `components/site/services/*` (FullWidthLayout, SidebarLayout, MagazineLayout, ServicesFilter… nơi đang nhận `brandColor/secondaryColor`).
   - Logic:
     - Thêm prop `tokens` (typed từ helper return type).
     - Thay hardcode màu / inline `brandColor` bằng token semantic (heading, badge, controls, active/filter/search).
     - Giữ `brandColor` tạm cho backward compatibility nếu nơi khác còn dùng.
   - Reflection: đảm bảo 3 layout đều tăng primary presence, secondary chỉ làm accent phụ.

5. Kiểm chứng và commit
   - Chạy bắt buộc: `bunx tsc --noEmit` (theo rule repo).
   - Test tay nhanh:
     - `/system/experiences/services-list`: dual mode thấy primary nổi bật hơn trên cả 3 layout preview.
     - `/services`: 3 layout render màu khớp preview, đổi mode single/dual phản ánh đúng.
   - Commit 1 lần với message kiểu: `fix(services-list): increase primary prominence for dual-brand across preview and site`.

Nếu bạn duyệt plan này, mình sẽ implement ngay theo đúng các bước trên, không mở rộng phạm vi ngoài services-list.