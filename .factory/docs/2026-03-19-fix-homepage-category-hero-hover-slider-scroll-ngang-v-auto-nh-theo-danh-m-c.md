## Audit Summary

### TL;DR kiểu Feynman
- Danh mục đầu không “sổ ra” ổn vì desktop đang mở menu bằng state hover nhưng mặc định không auto-active item đầu; muốn thấy ngay phải hover chính xác vào item.
- Hero ảnh chưa vuốt mượt và còn dính scroll ngang vì slider dùng `overflow-x-auto` native, dễ lộ scroll/drag conflict trong preview và desktop container.
- CTA danh mục hiện quá yếu: item cha không click trực tiếp, chỉ có link nhỏ trong panel; nếu group rỗng thì desktop gần như không có đường đi rõ ràng.
- Auto-generate hiện đã có `representativeImage`, nhưng chỉ lấy ảnh đại diện đầu tiên; chưa có cơ chế “ảnh sản phẩm random theo danh mục” như yêu cầu.
- Có thể xử lý gọn trong component hiện tại: sửa runtime interaction + mở rộng auto-generator + tinh chỉnh form create/edit, không cần đổi kiến trúc lớn.

### Observation / Inference / Decision
- Observation:
  - `components/site/HomepageCategoryHeroSection.tsx` đang set `activeCategoryId` về `null` nếu chưa hover item nào; vì vậy danh mục đầu không tự mở khi vào desktop.
  - Desktop panel render theo `activeCategoryId`; item cha là `button`, không phải `Link`, nên danh mục cha không click được trực tiếp.
  - `BannerSlider` đang dựa trên `overflow-x-auto snap-x`, đây là nguồn hợp lý cho hiện tượng vuốt/scroll ngang khó chịu.
  - `autoGenerateHomepageCategoryHeroMenu` đang gán `imageOverride: representativeImage ?? rootCategory.image`, tức có sẵn pipeline ảnh nhưng chưa randomize.
  - `convex/productCategories.ts:listActiveWithStats` mới lấy `representativeImage` theo ảnh product đầu tiên quét được, chưa random / đa lựa chọn.
- Inference:
  - Nếu set default active category đầu tiên cho desktop và giữ hover/focus/leave lifecycle, lỗi “hover danh mục đầu không sổ” sẽ hết theo đúng mental model mega menu.
  - Nếu bỏ native horizontal scrolling cho slider, chuyển sang transform/index-based carousel có pointer swipe, sẽ hết dính scroll ngang và vuốt ổn định hơn.
  - Nếu biến item cha thành vùng có click action rõ ràng + thêm CTA kép trong panel (`Xem tất cả`, `Xem danh mục` hoặc label tương đương), UX sẽ đủ rõ.
  - Muốn “ảnh random theo danh mục” tốt và ổn định, nên random có seed hoặc rotate nhẹ từ một tập ảnh ứng viên, tránh mỗi render đổi lung tung.
- Decision:
  - Đề xuất triển khai 1 gói fix đầy đủ cho create + edit + preview + site runtime, ưu tiên UX đúng và dữ liệu auto-gen thực dụng.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là hover vào danh mục đầu mở ổn, hero vuốt được, không có scroll ngang, có CTA rõ cho danh mục; actual là item đầu không tự mở tốt, slider còn dính scroll ngang, CTA cha yếu.
2. Phạm vi: `HomepageCategoryHeroSection`, preview admin, form create/edit, auto-generate data từ `productCategories`.
3. Có tái hiện ổn định không: có, vì behavior nằm trực tiếp trong code runtime hiện tại.
4. Mốc thay đổi gần nhất: các commit 2026-03-19 refactor/fix homepage-category-hero gần đây; evidence mạnh nhất vẫn là code hiện tại.
5. Dữ liệu còn thiếu: chưa thấy query trả về nhiều ảnh ứng viên cho mỗi category; hiện chỉ có `representativeImage` đơn.
6. Giả thuyết thay thế: chỉ cần CSS hover là đủ; bị loại vì còn vấn đề CTA cha, slider interaction, và ảnh auto-gen.
7. Rủi ro nếu fix sai: desktop có thể bị flicker hover, slider có thể regress click vào banner, auto image có thể thiếu ổn định nếu random mỗi render.
8. Tiêu chí pass/fail: desktop mở item đầu hợp lý, hover mượt; slider vuốt được và không còn scroll ngang; mỗi category có CTA rõ; auto-gen lấy ảnh sản phẩm theo category usable.

## Root Cause Confidence
**High** — Có evidence trực tiếp từ các file runtime/form/query hiện tại.

### Root cause chính
1. `activeCategoryId` không mặc định chọn item đầu trên desktop, nên entry state ban đầu không “mở sẵn” danh mục đầu.
2. Slider đang phụ thuộc native horizontal scrolling thay vì controlled carousel, gây cảm giác dính scroll ngang và vuốt thiếu ổn định.
3. Category row là `button` toggle-only, không có affordance click-through tốt cho trang danh mục cha.
4. Auto-generate image chỉ dùng một `representativeImage`, chưa hỗ trợ random candidate theo danh mục.

### Counter-hypothesis đã loại trừ
- Chỉ sửa hover timeout là đủ.
  - Không đủ vì còn slider + CTA + image generation.
- Chỉ thêm link nhỏ “Xem tất cả” là đủ.
  - Không đủ vì item cha vẫn không click được tự nhiên và nhóm rỗng vẫn nghèo hành động.

## Files Impacted

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render sidebar danh mục + hero banner + mega panel.
  - Thay đổi: desktop auto-active item đầu, hover/focus/leave ổn định hơn, item cha có action click rõ, panel có CTA kép, slider bỏ native horizontal scroll để dùng carousel controlled.
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview runtime theo device.
  - Thay đổi: giữ parity với behavior mới của desktop/mobile slider và CTA.

### Admin / config
- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
  - Vai trò hiện tại: form chỉnh banner, menu và auto-generate config.
  - Thay đổi: thêm tùy chọn cho CTA danh mục hợp lý hơn nếu cần tối thiểu, và hiển thị summary auto-image source rõ hơn.
- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: state create.
  - Thay đổi: nối config/image meta mới vào create flow.
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: state edit/save.
  - Thay đổi: load/save đầy đủ config mới và parity với create.
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: types cho config/category/auto-generate.
  - Thay đổi: bổ sung field tối thiểu cho CTA hành vi và metadata ảnh auto-generated nếu cần.
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: default/normalize config.
  - Thay đổi: thêm default cho config mới, normalize an toàn dữ liệu cũ.

### Data / generator
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: sinh danh mục/menu + ảnh đại diện.
  - Thay đổi: ưu tiên lấy 1 ảnh sản phẩm ngẫu nhiên theo danh mục làm `imageOverride`, fallback về category image / representativeImage nếu thiếu.
- `Sửa: convex/productCategories.ts`
  - Vai trò hiện tại: trả categories + stats + representative image.
  - Thay đổi: mở rộng query để trả danh sách ảnh ứng viên giới hạn theo category hoặc một random image ổn định theo category.

## Proposal

### Option A (Recommend) — Confidence 93%
**Fix đầy đủ nhưng gọn scope**
- Desktop:
  - auto-open danh mục đầu tiên khi có data
  - hover item nào thì panel đổi theo item đó
  - rời toàn khối thì close như hiện tại hoặc giữ item đầu làm fallback tùy context desktop
- Slider:
  - bỏ `overflow-x-auto` native
  - dùng state index + translateX + pointer swipe threshold
  - chặn horizontal scrollbar hoàn toàn
- CTA danh mục:
  - item cha có link trực tiếp tới trang danh mục
  - trong panel có 2 CTA rõ: `Xem tất cả` và `Xem danh mục`
  - nếu category có group rỗng vẫn còn CTA usable
- Auto-generate image:
  - query trả 1 ảnh sản phẩm random/ổn định cho category
  - generator ưu tiên ảnh này cho `imageOverride`
  - fallback về `representativeImage`, rồi `category.image`

**Vì sao recommend:** giải quyết trọn 4 vấn đề user nêu mà vẫn bám kiến trúc hiện có, rollback dễ.

### Option B — Confidence 80%
**Giữ slider native, chỉ fix hover + CTA + auto-image**
- Nhanh hơn, ít đụng slider logic.
- Phù hợp nếu muốn rủi ro thấp nhất ở phần banner.
- Tradeoff: nguy cơ scroll ngang/drag conflict còn sót.

## Execution Preview
1. Đọc/sửa `HomepageCategoryHeroSection.tsx` để tách rõ desktop interaction và slider controlled.
2. Thêm fallback active category đầu cho desktop, xử lý close/open không flicker.
3. Thiết kế action model cho category cha + CTA trong mega panel.
4. Mở rộng query `listActiveWithStats` để có ảnh sản phẩm random/ứng viên theo category.
5. Cập nhật `auto-generate.ts` để map ảnh category theo dữ liệu mới.
6. Nối type/default/create/edit/preview để config mới chạy đồng nhất.
7. Review tĩnh: typing, dữ liệu cũ, null-safety, parity create/edit.

## Acceptance Criteria
- Desktop preview/site: vào component thấy danh mục đầu ở trạng thái usable; hover vào item mở panel ngay, không bị “không sổ”.
- Hero banner vuốt được trên touch/pointer, không xuất hiện scroll ngang khó chịu.
- Category row và panel đều có đường dẫn rõ ràng để vào trang danh mục/tất cả sản phẩm.
- Auto-generate sinh category với ảnh ưu tiên từ sản phẩm thuộc danh mục đó, không phải chỉ ảnh category tĩnh khi có dữ liệu sản phẩm.
- Create và Edit cùng hành vi, cùng config, không lệch preview/site.

## Verification Plan
- Static review:
  - kiểm tra `activeCategoryId` desktop fallback đầu tiên
  - kiểm tra swipe threshold không chặn click banner sai
  - kiểm tra không render horizontal scrollbar
  - kiểm tra category không có groups vẫn có CTA usable
  - kiểm tra dữ liệu cũ thiếu field mới vẫn normalize ổn
- Typecheck: `bunx tsc --noEmit`
- Repro cho tester:
  1. Mở cả route create và edit user đưa.
  2. Hover item đầu và các item khác trên desktop preview.
  3. Thử vuốt hero banner bằng chuột/touchpad ở preview mobile/tablet.
  4. Kiểm tra không còn scroll ngang trên khung preview.
  5. Bấm CTA từ item danh mục và trong panel.
  6. Bấm `Sinh ngay`, xác nhận ảnh category lấy từ ảnh sản phẩm/fallback hợp lý.

## Risk / Rollback
- Risk: random ảnh nếu không ổn định có thể làm preview đổi liên tục khó kiểm soát.
- Giảm rủi ro: dùng random ổn định theo seed category hoặc chọn từ candidate list ngay lúc generate rồi lưu vào config, không random mỗi render.
- Rollback: toàn bộ thay đổi nằm trong component/query/types hiện tại, có thể revert từng phần độc lập.

## Out of Scope
- Cá nhân hóa danh mục theo user.
- Thêm layout mới ngoài `sidebar`.
- Viết lại toàn bộ editor UX của home-components.

Nếu duyệt, tôi sẽ triển khai theo **Option A** vì đáp ứng đúng toàn bộ vấn đề user nêu với tradeoff tốt nhất.