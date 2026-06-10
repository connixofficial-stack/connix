## Problem Graph
1. [Main] Tạo skill mới để chuẩn hoá rollout custom color cho toàn bộ home-components <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Tri thức đang phân tán trong 4 commit + 3 spec docs, chưa đóng gói thành workflow tái sử dụng
   1.2 [ROOT CAUSE] Dễ lặp lại bug cũ (preview ≠ site, single/dual sai rule, thiếu reset/system toggle)
   1.3 [Sub] Chưa có checklist đầy đủ để mở rộng từ Hero sang các type còn lại

## Insights rút ra từ 4 commit gần nhất (bắt buộc đưa vào skill)
- `f99ecc5`: nền tảng control center + storage settings + filter create + pilot Hero + reset seed/module.
- `7641f05`: refactor sang table 1 khối, per-row action + bulk action, chuẩn hành vi System/Custom.
- `bec3060`: fix root cause quan trọng: site render phải đọc override (không chỉ preview/edit), và compact UI.
- `dc764b4`: UX vận hành: toggle cần sonner feedback để thao tác mượt và rõ trạng thái.

## Execution (with reflection)
1. Tạo skill mới theo tên đã chốt
- **File tạo mới**: `.factory/skills/apply-home-component-custom-colors/SKILL.md`
- Frontmatter:
  - `name: apply-home-component-custom-colors`
  - description rõ trigger: áp dụng custom color cho các home-component, dùng khi mở rộng từ Hero sang các type còn lại, cần checklist end-to-end system/admin/site.
- Reflection: ✓ Đúng chuẩn skill-writer (name/description cụ thể, dễ auto-trigger).

2. Viết nội dung SKILL.md dạng “ngắn gọn nhưng actionable” (chỉ 1 file theo yêu cầu)
- Cấu trúc nội dung dự kiến:
  - **Mục tiêu skill**
  - **Khi nào dùng / không dùng**
  - **Nguồn chân lý** (dual-brand-color-system + 3 spec docs + 4 commit lessons)
  - **Quy trình bắt buộc per component (A→Z)**
  - **Checklist global trước commit**
  - **Anti-pattern phải tránh**
  - **Done criteria**
- Reflection: ✓ Đủ dùng ngay, không lan man.

3. Đóng gói workflow rollout “toàn bộ component” với checklist theo từng lớp
- **Checklist Lớp 1 — System config**
  - cập nhật `CUSTOM_SUPPORTED_TYPES`
  - đảm bảo row action + bulk action + toggle notification
  - settings key/shape không phá backward compatibility
- **Checklist Lớp 2 — Admin create/edit**
  - create page tôn trọng hidden types
  - edit page từng type có block custom đúng vị trí, ẩn khi system custom OFF
  - single→dual auto-secondary theo analogous + deltaE guard (nếu type có mode switch)
- **Checklist Lớp 3 — Preview + Site parity (critical)**
  - preview và site dùng cùng source tokens/helper
  - site render phải đọc override type (tránh bug từ commit bec3060)
  - single mode luôn monochromatic (secondary=primary)
- **Checklist Lớp 4 — Ops & reset**
  - seed/module enable không làm hệ thống rơi vào state ẩn sai
  - sonner success/error cho toggle actions
- Reflection: ✓ Học đủ từ pilot Hero, giảm rủi ro mở rộng hàng loạt.

4. Thêm “playbook thực thi theo type” trong skill
- Template step lặp cho mỗi component (Banner, CTA, Stats, ...):
  1) bật support type trong system
  2) thêm logic override trong edit page
  3) đồng bộ preview/site renderer
  4) verify typecheck + test tay
- Bao gồm format output khi skill được gọi: danh sách file cần sửa + diff plan + checklist tick.
- Reflection: ✓ Giúp chạy được cho toàn bộ type mà vẫn có gate chất lượng.

5. Verify trước khi chốt
- Kiểm tra frontmatter hợp lệ, tên skill trùng folder, description < 1024 ký tự.
- Đọc lại để đảm bảo “chỉ SKILL.md”, không tạo file phụ.
- Reflection: ✓ Đúng phạm vi bạn yêu cầu.

## File sẽ tạo
- `.factory/skills/apply-home-component-custom-colors/SKILL.md`

## Checklist chốt
- [ ] Có skill mới đúng tên `apply-home-component-custom-colors`
- [ ] SKILL.md chỉ 1 file, ngắn gọn nhưng đủ hành động
- [ ] Có lessons bắt buộc từ 4 commit gần nhất
- [ ] Có checklist rollout đầy đủ cho toàn bộ home-components (system/admin/preview/site/reset/notify)
- [ ] Có anti-pattern và done criteria rõ ràng để tránh lặp bug Hero→site mismatch