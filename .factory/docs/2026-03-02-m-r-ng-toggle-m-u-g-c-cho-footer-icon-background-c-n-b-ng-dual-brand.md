## Problem Graph
1. Toggle hiện tại mới xử lý màu icon, chưa xử lý nền icon social <- phụ thuộc 1.1, 1.2
   1.1 [ROOT CAUSE] Chưa có token/platform style cho background social theo mode màu gốc
   1.2 [ROOT CAUSE] Preview/runtime chưa có nhánh render style social đầy đủ (bg + fg)
2. Khi bật màu gốc social, secondary trong dual-mode bị giảm vai trò <- phụ thuộc 2.1
   2.1 [ROOT CAUSE] Chưa re-balance token secondary về link/menu + hover states theo rule dual-brand

## Execution (with reflection)
1. Chuẩn hóa contract config + default
- File: `app/admin/home-components/footer/_types/index.ts`
  - Giữ field `useOriginalSocialIconColors?: boolean` (đã có).
- File: `app/admin/home-components/footer/_lib/constants.ts`
  - Giữ normalize/default `true` (đã đúng yêu cầu).
- Reflection: không thêm flag mới để tránh phình config (KISS/YAGNI).

2. Mở rộng token màu trong `footer/_lib/colors.ts` theo dual-brand-color-system
- File: `app/admin/home-components/footer/_lib/colors.ts`
- Thêm token semantic mới cho social gốc:
  - `socialOriginalBg`
  - `socialOriginalIcon`
- Quy tắc:
  - Khi bật màu gốc: social dùng map platform (facebook/instagram/youtube/tiktok/zalo/...) cho **cả bg + icon** theo yêu cầu bạn.
  - Khi tắt: giữ social theo brand tokens hiện tại.
- Re-balance dual-brand khi bật màu gốc:
  - Secondary ưu tiên cho `link/menu + hover states` (theo chọn của bạn).
  - Không dồn secondary vào social container nữa khi bật.
- Reflection: vẫn giữ single mode monochromatic strict; dual mode mới đẩy secondary sang link/menu/hover theo 60-30-10.

3. Cập nhật FooterPreview (admin)
- File: `app/admin/home-components/footer/_components/FooterPreview.tsx`
- Thay logic resolve màu social:
  - `useOriginalSocialIconColors=true`: set style icon social bằng `{ backgroundColor: platformColor.bg, color: platformColor.fg }`.
  - `false`: dùng `colors.socialBg/colors.socialText` như cũ.
- Đồng thời áp dụng token secondary cho link/menu + hover states rõ hơn khi bật màu gốc.
- Reflection: preview phải phản ánh đúng runtime, không hardcode rời rạc ngoài tokens.

4. Cập nhật runtime site: DynamicFooter + ComponentRenderer/FooterSection
- Files:
  - `components/site/DynamicFooter.tsx`
  - `components/site/ComponentRenderer.tsx`
- Áp cùng logic render social như preview (bg + fg platform khi bật).
- Đảm bảo parity preview = site cho cả 6 style footer.
- Secondary vẫn xuất hiện chủ đạo ở link/menu + hover states khi bật màu gốc.
- Reflection: single source of truth, tránh lệch màu giữa admin và site.

5. Mapping social màu gốc (chuẩn hóa một chỗ)
- Dùng 1 map platform cho cả preview/runtime:
  - facebook: bg `#1877f2`, icon `#ffffff`
  - instagram: bg `#e1306c`, icon `#ffffff`
  - youtube: bg `#ff0000`, icon `#ffffff`
  - tiktok: bg `#000000`, icon `#ffffff`
  - zalo: bg `#0084ff`, icon `#ffffff`
  - fallback platform lạ: bg `#334155`, icon `#ffffff`
- Reflection: thống nhất trực quan, đúng ý “icon + background đều màu platform”, bảo toàn đọc được icon.

6. Validation checklist
- Bật toggle:
  - Icon social + nền social đúng màu từng platform ở create/edit preview và runtime.
  - Secondary chuyển vai trò qua link/menu + hover states (dual-mode).
- Tắt toggle:
  - Social quay về màu thương hiệu theo tokens.
- Kiểm tra đủ 6 style footer + cả route create/edit/site runtime.

7. Verify trước commit
- Chạy `bunx tsc --noEmit`.
- Commit theo convention hiện tại, kèm `.factory/docs`.

### Chốt nhanh
- Mình sẽ nâng toggle từ “chỉ icon” thành “icon + background social theo màu gốc platform”.
- Khi bật màu gốc, secondary không mất vai trò: sẽ ưu tiên cho link/menu + hover states đúng theo yêu cầu bạn.