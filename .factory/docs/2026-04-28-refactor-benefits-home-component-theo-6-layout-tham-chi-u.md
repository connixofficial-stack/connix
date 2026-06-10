# I. Primer

## 1. TL;DR kiểu Feynman
- Benefits hiện có 6 style cũ: `cards/list/bento/row/carousel/timeline`, nhưng 6 ảnh user đưa là một hệ layout khác, thiên về card premium, số thứ tự, icon lớn, minh họa và flow curve.
- Sẽ đổi style key/label sang `1, 2, 3, 4, 5, 6` và render preview/site cùng một `BenefitsSectionShared` để tránh lệch.
- Sẽ khóa tối đa 5 benefit items như user đề xuất; mỗi item vẫn có `icon`, `title`, `description`.
- Đề xuất thêm field ở cấp section: `visualImage`, `buttonText`, `buttonLink`, `highlightIndex`, `showItemNumbers`, `showDecorativeVisuals`; không thêm field per-item phức tạp để giữ form gọn.
- Giữ nguyên shared component `Tiêu đề & Mô tả` (`HeaderConfigSection` + `SectionHeader`) vì đang là contract chung của home-components.

## 2. Elaboration & Self-Explanation
Hiện Benefits form và runtime đã tách module khá sạch: create/edit quản lý state, preview/site cùng gọi `BenefitsSectionShared`. Điểm cần làm là thay bộ layout cũ bằng 6 layout mới theo ảnh tham chiếu, đồng thời không phá contract header chung.

6 ảnh cần dữ liệu khác nhau một chút:
- Layout 1/2/6 cần 5 item nằm ngang, số thứ tự hoặc trạng thái highlight.
- Layout 3/4 cần vùng intro/visual bên trái và grid benefit bên phải.
- Layout 5 cần ảnh/visual lớn bên phải, card benefit bên trái, CTA bên dưới.

Vì vậy phần item chỉ cần `icon/title/description`, còn phần phụ trợ nên đặt ở cấp section để dùng chung cho nhiều layout: ảnh minh họa, CTA, item nổi bật, bật/tắt trang trí/số thứ tự.

## 3. Concrete Examples & Analogies
Ví dụ cụ thể: layout 6 trong ảnh có item số 03 được highlight màu xanh. Thay vì thêm `highlighted` vào từng item, form chỉ cần `highlightIndex = 2`, giúp đổi item nổi bật nhanh và không làm dữ liệu item phình ra.

Analogy: coi Benefits như một bộ bài 5 lá. Mỗi lá chỉ có icon, tiêu đề, mô tả. 6 layout chỉ là 6 cách xếp bộ bài; vài layout cần thêm poster minh họa hoặc chọn một lá làm điểm nhấn, nên các tùy chọn đó thuộc “bàn xếp bài”, không thuộc từng lá bài.

# II. Audit Summary (Tóm tắt kiểm tra)

Observation:
- `app/admin/home-components/benefits/_types/index.ts` hiện có item fields: `icon`, `title`, `description`; style union đang là `cards/list/bento/row/carousel/timeline`.
- `app/admin/home-components/benefits/_components/BenefitsForm.tsx` hiện cho tối đa `MAX_ITEMS = 8`, có icon picker dùng `CONTACT_ICON_OPTIONS` và mô tả max 150 ký tự.
- `app/admin/home-components/benefits/_components/BenefitsPreview.tsx` và `components/site/home/sections/BenefitsRuntimeSection.tsx` đều dùng `BenefitsSectionShared`, đây là source-of-truth tốt để giữ preview/site parity.
- `app/admin/home-components/create/benefits/page.tsx` và `app/admin/home-components/benefits/[id]/edit/page.tsx` đều serialize/deserialize config thủ công nên phải cập nhật đủ field mới ở cả create/edit.
- Ảnh `01857cc8...` user gửi bị typo path ban đầu (`...38d5974f` vs đúng là `...38d5974f.png` với đoạn `4b85-b994`); đã đọc được ảnh đúng qua glob.

Inference:
- Root cause của việc Benefits chưa đạt 6 ảnh không phải thiếu dữ liệu item, mà là layout system hiện tại không khớp visual direction mới.
- Nếu chỉ đổi CSS trong style cũ sẽ khó maintain vì tên `cards/list/...` không còn phản ánh 6 layout mới.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High.
Reason: code hiện có style keys/renderer cũ rõ ràng trong `BenefitsSectionShared.tsx`, còn ảnh tham chiếu yêu cầu cấu trúc mới: 5-card row, split intro + visual, eco image panel, curved carousel-like highlight.

Counter-hypothesis:
- Có thể giữ style key cũ và chỉ đổi label thành 1-6. Không recommend vì dữ liệu cũ `cards/list` sẽ khó hiểu, fallback/migration mập mờ và dễ lệch preview/site.
- Có thể thêm rất nhiều field per-item như `accentColor`, `badge`, `image`, `metric`. Không recommend vì user muốn form gọn và 6 ảnh chủ yếu dùng icon/title/description + số thứ tự.

Audit protocol tối thiểu:
1. Triệu chứng: expected form/UI giống 6 ảnh; actual renderer là 6 style cũ.
3. Tái hiện ổn định: mở create/edit Benefits hoặc preview Benefits sẽ thấy style switch và layout cũ.
6. Giả thuyết thay thế: thiếu field item hoặc thiếu ảnh; bị loại một phần vì 5/6 layout vẫn render được bằng item hiện có, chỉ layout 3/4/5 cần visual section-level.
8. Pass/fail: preview và site render đúng 6 layout mới, create/edit lưu/load đủ config, tối đa 5 item.
5. Gap: chưa inspect trực tiếp browser localhost vì spec mode chỉ nghiên cứu readonly; verify runtime do bước sau thực hiện bằng typecheck tĩnh theo rule repo, không tự chạy lint/build.

# IV. Proposal (Đề xuất)

Scope & impacted paths:
- Refactor Benefits only; không chạm các home-component khác.
- Giữ shared header `HeaderConfigSection`/`SectionHeader` nguyên behavior.
- Đổi layout selector Benefits thành 6 option label `1` → `6`.

Source of truth:
- `BenefitsSectionShared.tsx` là source-of-truth render cho cả preview và site.
- Create/edit chỉ normalize/save config, không tự render layout riêng.
- `BenefitsRuntimeSection.tsx` chỉ map config runtime vào shared section.

Preview ↔ Site parity map:
| Surface | File | Contract cần giữ |
|---|---|---|
| Create | `app/admin/home-components/create/benefits/page.tsx` | default state + save đủ field mới |
| Edit | `app/admin/home-components/benefits/[id]/edit/page.tsx` | load config cũ/mới + hasChanges + save đủ field |
| Preview | `app/admin/home-components/benefits/_components/BenefitsPreview.tsx` | style switch 1-6 + device preview + shared header |
| Shared UI | `app/admin/home-components/benefits/_components/BenefitsSectionShared.tsx` | render 6 layout, responsive, fallback safe |
| Site | `components/site/home/sections/BenefitsRuntimeSection.tsx` | runtime dùng cùng `SectionShared` |

Layout mapping:
- Layout `1`: 5 tall cards ngang, icon tròn, divider ngắn, mô tả, số thứ tự mờ, optional arrow background.
- Layout `2`: 5 tall cards ngang, icon lớn, alternating primary/secondary accent bottom bar, centered text.
- Layout `3`: split left intro/visual/chart arrow + right 3 cards trên, 2 cards dưới.
- Layout `4`: split left headline/visual + right clean 3+2 icon grid với divider lines.
- Layout `5`: centered header, left 2x3 mini cards nhưng chỉ render tối đa 5 item nếu khóa 5; right large visual image panel, CTA dưới.
- Layout `6`: 5-step horizontal flow, số lớn phía sau, icon circle, one highlighted item card, curved line accent.

Field đề xuất thêm:
- `visualImage?: string` — ảnh minh họa cho layout 3/4/5; nếu trống dùng decorative placeholder bằng CSS/icon để không vỡ layout.
- `buttonText?: string`, `buttonLink?: string` — giữ field cũ nhưng mở cho layout 5 và các layout có CTA, không chỉ timeline.
- `highlightIndex?: number` — dùng cho layout 6, default `2` nếu có đủ 3 item, clamp theo item length.
- `showItemNumbers?: boolean` — bật/tắt số 01-05 cho layout 1/3/6, default true.
- `showDecorativeVisuals?: boolean` — bật/tắt arrow/curve/dot/placeholder visual, default true.

Không thêm per-item fields ngoài `icon/title/description` ở phase này.

# V. Files Impacted (Tệp bị ảnh hưởng)

UI / Form:
- Sửa: `app/admin/home-components/benefits/_components/BenefitsForm.tsx` — giảm `MAX_ITEMS` từ 8 xuống 5, thêm form controls section-level cho visual image, CTA, highlight item, decorative toggles.
- Sửa: `app/admin/home-components/benefits/_components/BenefitsPreview.tsx` — truyền đủ config mới vào shared section và giữ style switch 1-6.

Shared render / runtime:
- Sửa: `app/admin/home-components/benefits/_components/BenefitsSectionShared.tsx` — thay renderer 6 style cũ bằng 6 layout mới, dùng chung cho preview/site.
- Sửa: `components/site/home/sections/BenefitsRuntimeSection.tsx` — normalize style mới + map config mới vào shared section.

Types / constants / colors:
- Sửa: `app/admin/home-components/benefits/_types/index.ts` — đổi `BenefitsStyle` sang `'1' | '2' | '3' | '4' | '5' | '6'`, thêm field config/editor state mới.
- Sửa: `app/admin/home-components/benefits/_lib/constants.ts` — đổi style options label 1-6, defaults 5 item-friendly, default field mới.
- Sửa: `app/admin/home-components/benefits/_lib/colors.ts` — cập nhật `styleAccentByStyle` và validation style union theo 1-6.

Create/Edit persistence:
- Sửa: `app/admin/home-components/create/benefits/page.tsx` — serialize config mới, default create state mới.
- Sửa: `app/admin/home-components/benefits/[id]/edit/page.tsx` — normalize legacy style cũ sang layout `1`, load/save field mới, snapshot hasChanges đủ field.

# VI. Execution Preview (Xem trước thực thi)

1. Cập nhật types/constants:
   - `BenefitsStyle = '1' | '2' | '3' | '4' | '5' | '6'`.
   - `BENEFITS_STYLES = [{id:'1', label:'1'}, ...]`.
   - Add config fields: `visualImage`, `highlightIndex`, `showItemNumbers`, `showDecorativeVisuals`.

2. Cập nhật form:
   - `MAX_ITEMS = 5`.
   - Nếu config cũ có >5 items, UI chỉ cho giữ/serialize 5 item đầu hoặc clamp khi load; không tự xóa dữ liệu ngoài phần save mới.
   - Thêm controls: ảnh minh họa URL, CTA text/link, item nổi bật, show numbers, decorative visuals.

3. Cập nhật create/edit:
   - `toPersistConfig`, `toEditorState`, `createSnapshot`, `buildPreviewConfig` chứa đủ field mới.
   - `normalizeStyle` map style cũ về `1` để backward compatible.

4. Cập nhật shared renderer:
   - Viết helper `getDisplayItems(items).slice(0,5)`.
   - Viết helper icon/number/description hiện có reuse.
   - Implement 6 `if (style === 'x')` theo ảnh; fallback cuối là layout `1`.

5. Cập nhật runtime:
   - Normalize style `1-6`, legacy fallback `1`.
   - Truyền `visualImage`, `highlightIndex`, `showItemNumbers`, `showDecorativeVisuals` vào `BenefitsSectionShared`.

6. Static self-review:
   - Kiểm tra type references, unused imports, null safety, sanitize link, long text clamps, mobile classes.
   - Theo AGENTS.md: không tự chạy lint/unit test/build; chỉ chạy `bunx tsc --noEmit` trước commit nếu user approve execution và có thay đổi code.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review: đọc lại các file touched, kiểm tra imports/types/config save-load.
- Typecheck: sau khi user duyệt và code xong, chạy `bunx tsc --noEmit` theo rule repo cho thay đổi TS.
- Visual verification thủ công đề xuất: mở create và edit URL Benefits, lần lượt chọn layout 1-6, kiểm tra desktop/tablet/mobile preview.
- Runtime parity: kiểm tra site/home render Benefits cùng layout đã lưu, không lệch so với preview.
- Regression checks: shared header vẫn đổi title/subtitle/badge/hide/align như trước; custom color/font vẫn áp dụng.

# VIII. Todo

- [ ] Update Benefits types/constants/colors sang style 1-6 và config mới.
- [ ] Refactor Benefits form, lock max 5 items, thêm section controls.
- [ ] Update create/edit persistence + legacy style normalization.
- [ ] Rebuild `BenefitsSectionShared` 6 layouts mới.
- [ ] Update runtime section mapping.
- [ ] Static review + `bunx tsc --noEmit` + commit.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Benefits create/edit có style selector `1, 2, 3, 4, 5, 6`.
- Không thêm quá 5 benefit items; form hiển thị count `/5`.
- Mỗi item có icon lucide, title benefit, description benefit.
- Layout 1-6 nhìn cùng hướng với 6 ảnh tham chiếu ở desktop; mobile không vỡ, chuyển thành stack/grid hợp lý.
- Shared header `Tiêu đề & Mô tả` giữ nguyên và vẫn đồng bộ giữa preview/site.
- Lưu ở create, load ở edit, đổi style/item/config và save lại không mất dữ liệu mới.
- Preview và site dùng cùng renderer shared, không có style tồn tại ở preview mà site không biết đọc.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk: config cũ dùng style `cards/list/...`; sẽ map fallback về layout `1`, nên visual của component cũ thay đổi sau refactor.
- Risk: layout 5 ảnh tham chiếu có 6 mini cards nhưng user muốn lock 5 item; quyết định sẽ ưu tiên lock 5, grid layout 5 render 5 card cân đối.
- Risk: `visualImage` nếu nhập URL sai sẽ fallback bằng CSS/placeholder, không crash.
- Rollback: revert commit refactor Benefits; vì scope nằm trong module Benefits, ít ảnh hưởng component khác.

# XI. Out of Scope (Ngoài phạm vi)

- Không thêm upload media mới nếu repo chưa có picker chung phù hợp; trước mắt dùng URL ảnh/placeholder.
- Không chỉnh shared header component.
- Không refactor icon picker dùng chung toàn repo.
- Không seed/sửa dữ liệu thật Convex cho record hiện tại trừ khi user yêu cầu riêng.

# XII. Open Questions (Câu hỏi mở)

- Không còn câu hỏi blocker. Quyết định recommend: dùng field section-level tối thiểu (`visualImage`, CTA, `highlightIndex`, toggles) và khóa 5 item như user đề xuất.