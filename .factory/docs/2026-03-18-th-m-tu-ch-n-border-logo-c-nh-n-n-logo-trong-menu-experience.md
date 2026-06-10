## Audit Summary
- Observation: route `app/system/experiences/menu/page.tsx` hiện chỉ có nhóm option `Nền logo` với 4 giá trị: `none | shadow | soft | solid`.
- Observation: preview dùng type `LogoBackgroundStyle = 'none' | 'shadow' | 'soft' | 'solid'` trong `components/experiences/previews/HeaderMenuPreview.tsx` và site thật dùng cùng pattern trong `components/site/Header.tsx`.
- Observation: editor, preview, site đang đồng bộ qua field `logoBackgroundStyle`, nên thêm border vào đúng field này là thay đổi nhỏ nhất và ít rủi ro nhất.
- Decision: thêm 1 lựa chọn mới `border` cạnh `Nền logo`, áp dụng đồng bộ editor + preview + site thật cho cả 3 layout.

## Root Cause Confidence
- High — nguyên nhân gốc là schema hiện tại chưa support giá trị `border`, nên UI editor không có option, còn preview/site cũng chưa map style này. Evidence nằm ở:
  - `app/system/experiences/menu/page.tsx` block `Nền logo`
  - `components/experiences/previews/HeaderMenuPreview.tsx` type `LogoBackgroundStyle` và `logoBackgroundStyles`
  - `components/site/Header.tsx` type `LogoBackgroundStyle` và `logoBackgroundStyles`
- Counter-hypothesis đã loại trừ: không phải do route localhost hay do config save lỗi; field đang hoạt động bình thường với 4 option hiện có, chỉ thiếu nhánh `border`.

## Proposal
1. `app/system/experiences/menu/page.tsx`
   - Mở rộng danh sách nút trong block `Nền logo` thêm `{ id: 'border', label: 'Border' }`.
   - Cập nhật type của `updateLogoBackgroundStyle` để nhận thêm giá trị mới thông qua type shared sau khi preview file được mở rộng.
   - Giữ nguyên layout nhóm control, chỉ thêm đúng 1 nút cạnh option hiện có.
   - Update microcopy mô tả ngắn để giải thích `Border` phù hợp khi cần viền rõ nhưng không muốn nền dày như `Soft/Solid`.

2. `components/experiences/previews/HeaderMenuPreview.tsx`
   - Đổi `LogoBackgroundStyle` thành: `'none' | 'border' | 'shadow' | 'soft' | 'solid'`.
   - Mở rộng normalize logic để chấp nhận `border`.
   - Thêm `logoBackgroundStyles.border` với style nhẹ, nhất quán với design hiện tại, dự kiến:
     - không thêm fill mạnh
     - có `border: 1px solid ...`
     - có thể kèm nền trắng/transparent rất nhẹ để viền dễ thấy trên nhiều header background.
   - Reuse logic sẵn có của `logoWrapStyle` để cả Classic, Topbar, Allbirds tự nhận style mới mà không cần nhân bản code.

3. `components/site/Header.tsx`
   - Mở rộng `LogoBackgroundStyle` giống preview.
   - Mở rộng normalize logic và `logoBackgroundStyles.border` để parity 100% giữa preview và site thật.
   - Không đổi hành vi các option cũ.

4. Phạm vi hành vi
   - Áp dụng cho cả 3 layout: `classic`, `topbar`, `allbirds`.
   - Backward compatible: config cũ tiếp tục chạy vì default vẫn là `none`.
   - Không đổi schema ngoài field hiện có, nên rollback dễ.

## Post-Audit Notes
- Pass criteria:
  1. Trong `/system/experiences/menu` có thêm option `Border` cạnh `Nền logo`.
  2. Chọn `Border` làm preview đổi ngay ở cả 3 layout.
  3. Lưu config xong, site thật render border logo giống preview.
  4. Các option cũ `none/shadow/soft/solid` không bị đổi hành vi.

## Verification Plan
- Static review sau khi code:
  - kiểm tra type union ở editor/preview/site đã đồng bộ
  - kiểm tra normalize fallback vẫn về `none` nếu dữ liệu lạ
  - kiểm tra không phát sinh null/undefined issue ở config cũ
- Theo rule repo, không chạy lint/test runtime/build.
- Nếu được duyệt để implement, bước verify tối thiểu tôi sẽ làm là self-review tĩnh và chỉ chạy `bunx tsc --noEmit` nếu thay đổi TypeScript cần xác nhận type consistency theo rule repo.