## Audit Summary
- Observation: border hiện tại đang dùng cùng recipe ở preview và site thật: `backgroundColor: rgba(255,255,255,0.6) + 1px border + shadow nhẹ`, nên tạo cảm giác lưng chừng giữa outline và card.
- Observation: editor tại `app/system/experiences/menu/page.tsx` đang render nhóm `Nền logo` bằng list cứng 5 option trong grid 2 cột.
- Observation: preview `components/experiences/previews/HeaderMenuPreview.tsx` và site `components/site/Header.tsx` cùng map qua `LogoBackgroundStyle`, nên có thể mở rộng thêm biến thể mà vẫn giữ parity preview = site.
- Web evidence: xu hướng enterprise/minimal 2026 thiên về flat, outline sạch, separation nhẹ, tránh glass/shadow nặng ở header; phù hợp với feedback của bạn là border hiện tại “cứ sao sao”.
- Decision: giữ `Border` hiện tại, đồng thời thêm 4 option flat hơn để đa dạng: `Outline sạch`, `Hairline nhẹ`, `Inset panel`, `Pill badge`, với mức hiện diện tổng thể “rất nhẹ”.

## Root Cause Confidence
- High — vấn đề không nằm ở implementation lỗi, mà ở visual recipe của style `border` hiện tại chưa đúng gu flat enterprise. Evidence nằm ở:
  - `app/system/experiences/menu/page.tsx` block option `Nền logo`
  - `components/experiences/previews/HeaderMenuPreview.tsx` và `components/site/Header.tsx` cùng dùng `background + border + shadow`
- Counter-hypothesis đã loại trừ: không phải mismatch preview/site, vì cả 2 đang dùng cùng style map; cũng không phải do layout classic riêng lẻ, vì style được share cho cả 3 layout.

## Proposal
1. Mở rộng taxonomy cho logo background style
   - File `components/experiences/previews/HeaderMenuPreview.tsx`
   - File `components/site/Header.tsx`
   - Đổi union type `LogoBackgroundStyle` từ:
     - `'none' | 'border' | 'shadow' | 'soft' | 'solid'`
     thành:
     - `'none' | 'border' | 'shadow' | 'soft' | 'solid' | 'outline' | 'hairline' | 'inset' | 'pill'`
   - Giữ backward compatibility cho config cũ.

2. Thiết kế 4 biến thể flat mới theo hướng doanh nghiệp
   - `outline`:
     - nền gần như trong suốt hoặc trắng rất nhẹ
     - viền 1px rõ, sạch, không shadow
     - phù hợp header sáng, cảm giác nghiêm túc nhất
   - `hairline`:
     - viền cực nhẹ, màu border mềm hơn `outline`
     - không shadow, không fill đáng kể
     - dành cho case muốn “có khung nhưng gần như biến mất”
   - `inset`:
     - nền surface rất nhẹ + viền mềm + inset highlight tinh tế
     - flat hơn soft card, ít cảm giác card nổi
   - `pill`:
     - cùng tinh thần flat, nhưng bo tròn hơn để logo trông thân thiện hơn
     - không dùng shadow nặng; chỉ separation nhẹ
   - Giữ `border` hiện tại như legacy option cho đa dạng đúng yêu cầu của bạn.

3. Cập nhật style map dùng chung cho preview/site
   - Trong cả 2 file preview/site:
     - thêm normalize logic cho 4 giá trị mới
     - thêm `logoBackgroundStyles.outline`
     - thêm `logoBackgroundStyles.hairline`
     - thêm `logoBackgroundStyles.inset`
     - thêm `logoBackgroundStyles.pill`
   - Reuse `logoWrapStyle` hiện có để các layout `classic`, `topbar`, `allbirds` tự áp dụng mà không fork logic.
   - Điều chỉnh `borderRadius` riêng cho `pill` để bo tròn hơn các style khác, nhưng vẫn trong cùng khối logic hiện tại.

4. Cập nhật editor `/system/experiences/menu`
   - File `app/system/experiences/menu/page.tsx`
   - Mở rộng list option trong block `Nền logo` thêm 4 nút mới:
     - `Outline sạch`
     - `Hairline nhẹ`
     - `Inset panel`
     - `Pill badge`
   - Đổi grid từ `grid-cols-2` sang layout phù hợp hơn khi số option tăng (dự kiến `grid-cols-2 lg:grid-cols-3`) để không bị quá dài.
   - Rút gọn microcopy để giải thích nhanh từng nhóm flat option, tránh chữ quá nhiều.

5. Giữ scope nhỏ, không mở rộng quá mức
   - Không đổi logic save/load config ngoài union type và style map.
   - Không đổi hành vi `none/shadow/soft/solid` hiện có.
   - Không thêm system setting mới, không đổi schema DB, chỉ mở rộng giá trị field đang có.

## Post-Audit Notes
- Pass criteria:
  1. Editor có thêm 4 option flat mới bên cạnh các option cũ.
  2. Preview đổi đúng style ngay khi chọn từng option.
  3. Site thật render giống preview cho cả 3 layout.
  4. Các option mới đều “rất nhẹ”, không tranh focus với menu/CTA.
  5. `border` cũ vẫn còn để người dùng tự chọn.

## Verification Plan
- Static review:
  - kiểm tra union type đồng bộ giữa editor/preview/site
  - kiểm tra fallback dữ liệu cũ vẫn về `none` khi gặp giá trị lạ
  - kiểm tra riêng `pill` không làm vỡ bo góc ở allbirds/classic
  - kiểm tra microcopy/editor grid không bị vỡ layout
- Theo rule repo, không chạy lint/test runtime/build.
- Nếu bạn duyệt implement, tôi sẽ chỉ self-review tĩnh và chạy `bunx tsc --noEmit` để xác nhận type consistency vì có thay đổi TypeScript.