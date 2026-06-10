## Audit Summary

### TL;DR kiểu Feynman
- `homepage-category-hero` hiện chỉ có 1 layout vì contract `style/layout` chưa từng được tạo cho component này.
- Thiếu này xảy ra xuyên suốt cả chuỗi: type → constants → create/edit state → preview selector → runtime renderer.
- Kết quả là trang create/edit không có bộ chọn 6 layout như các component khác.
- Preview chỉ có `Default`, nên editor không thể so sánh hay chọn variant.
- Runtime `HomepageCategoryHeroSection` cũng chỉ render 1 cấu trúc cố định, nên dù có thêm selector ở editor thì hiện tại site vẫn chưa hỗ trợ đa layout.
- Đây là thiếu hụt kiến trúc, không phải bug UI đơn lẻ.

### Observation / Inference / Decision
- Observation:
  - `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx` chỉ có `PREVIEW_STYLES = [{ id: 'default', label: 'Default' }]`.
  - `app/admin/home-components/homepage-category-hero/_types/index.ts` không có `HomepageCategoryHeroStyle` và `HomepageCategoryHeroConfig` không có field `style`.
  - `app/admin/home-components/homepage-category-hero/_lib/constants.ts` không có danh sách 6 layout như `STATS_STYLES`.
  - `app/admin/home-components/create/homepage-category-hero/page.tsx` và `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx` không có `useState` cho style, không load/save style trong config.
  - `components/site/ComponentRenderer.tsx` render thẳng `HomepageCategoryHeroSection` mà không có branch theo style.
  - `components/site/HomepageCategoryHeroSection.tsx` chỉ có một cấu trúc layout cố định: sidebar danh mục + hero banner.
- Inference:
  - `homepage-category-hero` chưa được đi qua cùng pattern "6 layouts" như Hero/Stats/Gallery; không phải do selector bị ẩn mà là chưa có style pipeline.
- Decision:
  - Nếu triển khai sau này, cần bổ sung đủ pipeline style end-to-end, không chỉ thêm selector ở preview.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là create/edit có 6 layout như các home-component khác; actual là chỉ có 1 `Default` ở preview, không có selector style đầy đủ.
2. Phạm vi: ảnh hưởng admin create/edit của `HomepageCategoryHero`, preview editor, và runtime site của chính component này.
3. Tái hiện: có, ổn định; chỉ cần vào route create/edit của component là thấy.
4. Mốc thay đổi gần nhất: từ lịch sử phiên hiện có commit `67f10232 refactor(homepage-category-hero): drop experience wiring`, nhưng evidence mạnh nhất là code hiện tại thiếu hoàn toàn pipeline style.
5. Dữ liệu còn thiếu: chưa cần thêm dữ liệu để kết luận nguyên nhân chính.
6. Giả thuyết thay thế: selector bị ẩn do UI bug; đã bị loại trừ vì type/constants/create/edit/runtime đều thiếu `style`.
7. Rủi ro nếu fix sai nguyên nhân: chỉ thêm UI selector nhưng runtime/config không hỗ trợ sẽ tạo state giả, preview/site lệch nhau.
8. Pass/fail sau khi sửa (nếu triển khai): editor chọn được 6 layout, config lưu `style`, preview đổi theo style, runtime site render đúng style đã chọn.

## Root Cause Confidence
**High** — Evidence cho thấy thiếu hụt nằm ở toàn bộ contract và wiring, không phải một điểm lỗi đơn lẻ.

### Root cause chính
`HomepageCategoryHero` chưa có hệ style/layout chuẩn như các home-component mature khác. Cụ thể:
1. Không có union type cho style.
2. Không có constants định nghĩa 6 layout.
3. Create/Edit không giữ và persist style.
4. PreviewWrapper không nhận 6 styles.
5. Runtime section không render theo style.

### Counter-hypothesis đã kiểm
- Hypothesis: Có style nhưng PreviewWrapper cấu hình sai.
  - Bị loại trừ vì `config.style` không tồn tại trong type và create/edit không submit style.
- Hypothesis: Runtime có nhiều layout nhưng preview chưa expose.
  - Bị loại trừ vì `HomepageCategoryHeroSection.tsx` chỉ có một layout cố định.

## Files Impacted

### Nhóm homepage-category-hero
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview editor cho component.
  - Thiếu hụt: chỉ khai báo 1 `Default`, chưa có 6 layout selector và chưa branch preview theo style.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: định nghĩa config/type contract.
  - Thiếu hụt: chưa có `HomepageCategoryHeroStyle`, config không có `style`.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: chứa default config.
  - Thiếu hụt: chưa có danh sách styles/layouts, chưa có normalize/fallback style.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: trang create.
  - Thiếu hụt: không có state style, không submit style vào config, preview không điều khiển được layout.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit.
  - Thiếu hụt: không load/save/dirty-check style.
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render runtime/site và preview base.
  - Thiếu hụt: chỉ có 1 layout, chưa có switch theo style.
- `Sửa: components/site/ComponentRenderer.tsx`
  - Vai trò hiện tại: route render theo component type.
  - Thiếu hụt: mới chỉ pass config vào section, runtime chỉ meaningful khi section có style-aware rendering.

### Nhóm đối chứng / pattern tham chiếu
- `Tham chiếu: app/admin/home-components/stats/_lib/constants.ts`
  - Vai trò hiện tại: định nghĩa `STATS_STYLES` đủ 6 biến thể.
  - Dùng làm pattern cho constants style list.
- `Tham chiếu: app/admin/home-components/stats/_types/index.ts`
  - Vai trò hiện tại: có `StatsStyle` + config chứa `style`.
  - Dùng làm pattern cho contract typing.
- `Tham chiếu: app/admin/home-components/stats/_components/StatsPreview.tsx`
  - Vai trò hiện tại: PreviewWrapper + style switching hoàn chỉnh.
  - Dùng làm pattern cho preview selector và render theo style.

## Những thứ `homepage-category-hero` đang thua thiệt so với home-component khác
1. **Không có style contract ở type-level**
   - Nhiều component mature có `Style` union và config `style`; component này không có.
2. **Không có style options ở constants-level**
   - Không có `*_STYLES` array để preview/editor dùng chung.
3. **Không có UX chọn layout ở create/edit**
   - Người dùng không thể thử/đổi layout trong admin.
4. **Không có preview parity nhiều layout**
   - PreviewWrapper chỉ hiện `Default`, nên không parity với chuẩn 6 layout của hệ.
5. **Không có runtime style rendering**
   - Site chỉ render một biến thể cứng.
6. **Không có normalization/fallback cho dữ liệu style**
   - Khó backward-compatible nếu thêm style sau này mà không có normalize.
7. **Không có dirty-check/load/save cho style ở edit**
   - Nếu thêm style nửa chừng mà thiếu bước này sẽ dễ gây bug lưu không đúng hoặc nút Save không bật.
8. **Khả năng mở rộng thấp hơn các component khác**
   - Hero/Stats/Gallery có pattern tách biệt rõ giữa constants/types/preview/runtime; component này đang monolithic hơn ở runtime section.

## Execution Preview
1. Đọc và chốt pattern chuẩn từ 1–2 component đã có 6 layout.
2. Bổ sung `HomepageCategoryHeroStyle` + `style` vào config và default constants.
3. Thêm style list 6 layout + normalize helper.
4. Nối state style vào create/edit + submit/load/save/dirty-check.
5. Nâng cấp preview để hiển thị selector 6 layout và render đúng variant.
6. Refactor `HomepageCategoryHeroSection` để support runtime style-aware layouts.
7. Review tĩnh backward compatibility cho dữ liệu cũ không có `style`.

## Proposal
### Option A (Recommend) — Confidence 90%
Triển khai đầy đủ pipeline 6 layouts cho `homepage-category-hero` theo pattern Stats/Hero.
- Vì sao recommend: giải quyết đúng root cause, đảm bảo admin preview và runtime parity, ít technical debt hơn.
- Tradeoff: phải sửa nhiều file hơn.

### Option B — Confidence 55%
Chỉ thêm selector 6 layout ở editor/preview, runtime vẫn dùng 1 layout.
- Phù hợp khi cần mock UI nhanh để demo admin.
- Tradeoff: preview ≠ site, sai với parity contract, rủi ro UX cao.

## Acceptance Criteria
- Route create/edit của `HomepageCategoryHero` có 6 layout options thay vì 1 `Default`.
- Chọn layout làm preview đổi tương ứng ngay trong editor.
- Save/Edit persist được `config.style` và reload lại vẫn giữ đúng layout đã chọn.
- Dữ liệu cũ chưa có `style` vẫn render ổn với fallback mặc định.
- Runtime site render đúng layout theo `config.style`, không lệch preview theo contract mong muốn.

## Verification Plan
- Typecheck: nếu được user duyệt triển khai code, chỉ chạy `bunx tsc --noEmit` theo rule repo.
- Static review:
  - Kiểm tra `HomepageCategoryHeroConfig` có `style` và fallback normalize.
  - Kiểm tra create/edit đều load/save/dirty-check `style`.
  - Kiểm tra preview selector dùng cùng constants với runtime.
  - Kiểm tra runtime không crash với dữ liệu cũ không có style.
- Repro thủ công cho tester:
  1. Mở create route của `HomepageCategoryHero`.
  2. Xác nhận có 6 layout.
  3. Chọn từng layout và quan sát preview.
  4. Lưu component, mở lại edit route, xác nhận layout giữ nguyên.
  5. Mở site và đối chiếu preview/site.

## Risk / Rollback
- Risk chính: thêm selector nhưng preview/site không parity, hoặc dữ liệu cũ thiếu `style` gây fallback sai.
- Rollback: revert các file trong nhóm `homepage-category-hero` về 1 layout cũ; vì thay đổi tập trung nên rollback tương đối an toàn.

## Out of Scope
- Thiết kế chi tiết 6 layout cụ thể cho `HomepageCategoryHero`.
- Tối ưu animation, performance, hoặc seed data nếu user chưa yêu cầu.
- Chuẩn hóa lại toàn bộ home-components khác.

## Kết luận audit
Hiện trạng không phải chỉ “thiếu 5 layout trong preview”, mà là `homepage-category-hero` đang thiếu toàn bộ kiến trúc đa-layout mà các home-component trưởng thành khác đã có. Nếu muốn đạt parity thật sự, cần làm theo Option A: bổ sung pipeline style end-to-end thay vì vá riêng create/edit.