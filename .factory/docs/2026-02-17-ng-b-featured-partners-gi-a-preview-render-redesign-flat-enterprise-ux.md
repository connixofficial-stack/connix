## Problem Graph
1. [Main] Featured (Partners) chưa đồng bộ preview/render + UI/UX chưa đạt chất doanh nghiệp
   1.1 [Sub] Có khả năng lệch logic render giữa `PartnersPreview` và site render tương ứng
      1.1.1 [ROOT CAUSE] Hai luồng dùng style primitives khác nhau (spacing, card shell, image treatment, state)
   1.2 [Sub] Layout Featured hiện thiếu hierarchy doanh nghiệp (title, spacing, logo treatment, consistency)
   1.3 [Sub] Cần giữ backward compatibility 100% config hiện tại

## Execution (with reflection)
1. Chuẩn hoá nguồn render dùng chung cho Featured
   - File: `app/admin/home-components/partners/_components/PartnersPreview.tsx`
   - File: `components/site/PartnersSection.tsx` (hoặc file site render thực tế của Partners/Featured, sẽ xác định chính xác khi grep)
   - Action: Tách `Featured` thành shared presentational block (single source of truth) để preview và site cùng dùng 1 component/layout token.
   - Reflection: ✓ Giải trực tiếp root-cause mismatch, giảm drift về sau.

2. Giữ nguyên schema dữ liệu (compat 100%)
   - File: `app/admin/home-components/partners/_types/index.ts` (chỉ xác nhận, không đổi breaking)
   - Action: Không thêm field bắt buộc, không đổi shape `items/style/title`; nếu cần nâng UI chỉ dùng computed style nội bộ.
   - Reflection: ✓ Đúng yêu cầu “Giữ nguyên 100%”.

3. Redesign layout `Featured` theo hướng flat enterprise, tối giản nghiêm túc, full-color luôn
   - File: shared component mới (ví dụ): `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
   - Action chi tiết:
     - Grid phẳng, không gradient nặng, border/subtle shadow tối thiểu.
     - Logo `full-color luôn`, đồng đều chiều cao, object-fit contain, anti-jitter.
     - Tăng white-space, set nhịp dọc rõ (title → subtitle/note nếu có → logo wall).
     - Hover rất nhẹ (scale 1.01 hoặc border emphasis), tránh “marketing flashy”.
     - Empty/fallback states rõ ràng cho preview.
   - Reflection: ✓ Khớp lựa chọn C + tone “tối giản nghiêm túc”.

4. Đồng bộ style tokens giữa preview và site
   - File: `app/admin/home-components/partners/_lib/constants.ts` (nếu có mapping style)
   - Action: Đưa các token Featured (padding, gap, radius, logo height, container max-width) vào constants chung để cả 2 nơi import dùng giống hệt.
   - Reflection: ✓ Ngăn lệch UI khi sửa về sau.

5. Kiểm tra các style khác không bị ảnh hưởng
   - File: `PartnersMarqueeShared.tsx`, `PartnersCarouselShared.tsx`, `PartnersBadgeShared.tsx`
   - Action: Chỉ chạm khi có dependency chung; đảm bảo refactor Featured không làm regress style khác.
   - Reflection: ✓ Giữ phạm vi đúng yêu cầu.

6. Validation bắt buộc
   - Chạy `bunx tsc --noEmit` theo rule project sau khi sửa code.
   - Nếu lỗi: fix đến khi pass.
   - Reflection: ✓ Đúng AGENTS.md, tránh chạy lint/build dư thừa.

7. Commit theo rule repo (không push)
   - Review diff sạch, không dính file ngoài phạm vi.
   - Commit message đề xuất: `fix(partners): unify featured preview/render and redesign enterprise flat layout`
   - Reflection: ✓ Đúng quy tắc “hoàn thành đều phải commit, không push”.

## Nguồn định hướng UX (web research 2026)
- Flat/minimal enterprise: ưu tiên clarity, trust, whitespace, typography rõ ràng.
- Accessibility & consistency: hover state nhẹ, contrast tốt, layout ổn định.
- Partner logo section: logo wall cân bằng, khoảng cách đồng đều, tránh hiệu ứng rối.

Nếu bạn duyệt spec này, mình sẽ triển khai ngay end-to-end: refactor shared Featured, đồng bộ preview/site, validate TypeScript, rồi commit (không push).