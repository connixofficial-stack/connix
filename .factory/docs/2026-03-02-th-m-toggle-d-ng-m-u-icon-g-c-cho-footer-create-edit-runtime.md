## Problem Graph
1. Thêm khả năng chọn màu icon social cho Footer (gốc vs thương hiệu) <- phụ thuộc 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Footer config chưa có cờ điều khiển màu icon social
   1.2 Preview/admin form chưa có UI toggle để user bật/tắt
   1.3 Runtime site Footer luôn render theo màu theme, chưa hỗ trợ màu gốc theo platform

## Execution (with reflection)
1. Mở rộng data model FooterConfig (giải 1.1)
- File: `app/admin/home-components/footer/_types/index.ts`
  - Thêm field: `useOriginalSocialIconColors?: boolean` vào `FooterConfig`.
- File: `app/admin/home-components/footer/_lib/constants.ts`
  - `DEFAULT_FOOTER_CONFIG`: set `useOriginalSocialIconColors: true` (theo quyết định default bật).
  - `normalizeFooterConfig`: normalize về boolean, fallback `true` nếu thiếu.
- Reflection: giữ backward-compatible cho dữ liệu cũ chưa có field.

2. Thêm toggle ở form create/edit Footer (giải 1.2)
- File: `app/admin/home-components/footer/_components/FooterForm.tsx`
  - Trong card “Thông tin cơ bản”, thêm 1 checkbox/toggle label: “Dùng màu icon gốc”.
  - `checked={value.useOriginalSocialIconColors !== false}`.
  - `onChange` cập nhật config qua `updateConfig({ useOriginalSocialIconColors: e.target.checked })`.
  - Vị trí đặt gần “Hiển thị social links” để UX liền mạch.
- File: `app/admin/home-components/create/footer/page.tsx`
  - Không cần logic riêng vì đã dùng `normalizeFooterConfig`; chỉ đảm bảo initial state đi qua normalize (đã có).
- File: `app/admin/home-components/footer/[id]/edit/page.tsx`
  - Không cần logic riêng ngoài normalize hiện có; field mới sẽ tự load/save qua `config`.
- Reflection: tránh thêm state cục bộ mới (KISS), tận dụng flow config hiện tại.

3. Áp dụng toggle vào Footer Preview (admin) + site runtime (giải 1.3)
- File: `app/admin/home-components/footer/_components/FooterPreview.tsx`
  - Tạo map màu gốc social theo platform (facebook, instagram, youtube, tiktok, zalo, twitter, linkedin, github).
  - Truyền logic vào render icon:
    - Nếu `config.useOriginalSocialIconColors !== false` => icon dùng màu gốc platform.
    - Nếu false => giữ màu thương hiệu hiện tại (`colors.socialText`).
  - Giữ nguyên nền badge/icon container theo style hiện tại, chỉ đổi màu icon.
- File: `components/site/DynamicFooter.tsx`
  - Áp dụng cùng logic màu như preview để parity preview = site.
- File: `components/site/ComponentRenderer.tsx` (FooterSection runtime từ home-components)
  - Áp dụng cùng logic màu để runtime render qua ComponentRenderer cũng đồng nhất.
- Reflection: học theo Contact experience (dùng màu brand gốc từng social), nhưng triển khai dạng toggle để bật/tắt được.

4. Validation + parity checklist
- Cases kiểm tra:
  - Create Footer mới: mặc định toggle bật, icon social hiển thị màu gốc.
  - Edit Footer cũ chưa có field: normalize => bật mặc định.
  - Tắt toggle: toàn bộ icon social ở preview + site runtime về màu thương hiệu.
  - Bật lại toggle: trả về đúng màu gốc từng nền tảng.
- Kiểm tra 6 style Footer (classic/modern/corporate/minimal/centered/stacked) để đảm bảo không lệch màu.

5. Verify kỹ thuật trước commit
- Chạy: `bunx tsc --noEmit` (đúng rule dự án).
- Sau đó commit toàn bộ thay đổi code liên quan (không push).

### Chốt cho bạn
- Scope đúng theo yêu cầu: thêm 1 toggle ở cả create/edit Footer.
- Toggle áp dụng cả admin preview và website thật.
- Mặc định bật “dùng màu icon gốc”, tắt thì về màu thương hiệu.