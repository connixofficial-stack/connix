## Audit Summary
- Observation: spec gần nhất yêu cầu xóa cơ chế phối màu phụ end-to-end cho toàn bộ home-components, bỏ khỏi create/update payload, preview và site runtime.
- Observation: diff hiện tại mới chạm 44 file, chủ yếu các nhóm `about/contact/service-list/speed-dial/team/video`.
- Observation: grep còn rất nhiều dấu vết cơ chế phối màu phụ trong `app/admin/home-components/**` và `components/site/**`, gồm ít nhất: `hero`, `pricing`, `services`, `gallery`, `testimonials`, `voucher-promotions`, `clients`, `case-study`, `career`, `benefits`, `features`, `countdown`, `product-list`, cùng các nhánh trong `components/site/ComponentRenderer.tsx`.
- Observation: có dấu hiệu partial refactor ở vài file như `team/_lib/colors.ts` và `speed-dial/_lib/colors.ts`: UI field màu phụ đã bị bỏ nhưng cảnh báo kiểm tra độ gần màu vẫn còn, nên codebase chưa thật sự sạch về concept này.

## Root Cause Confidence
- High — evidence trực tiếp từ grep/diff cho thấy implementation hiện tại mới hoàn thành một phần, chưa đạt spec “xóa cơ chế phối màu phụ toàn bộ”. Nếu dừng ở đây, admin/site runtime vẫn còn đọc trường màu phụ, type vẫn còn field màu phụ, và payload/runtime chưa đồng nhất.

## Proposal
Mình sẽ tiếp tục theo hướng đã chốt: **xóa hoàn toàn cơ chế phối màu phụ khỏi toàn bộ home-components còn lại**, đồng thời **bỏ luôn dữ liệu cũ** thay vì giữ backward-compatible behavior.

### Phạm vi sửa
1. **Admin model + form**
- Gỡ trường phối màu phụ khỏi `_types/index.ts`, `_lib/constants.ts`, `_lib/normalize.ts`, create/edit pages của tất cả component còn lại.
- Xóa mọi state/prop/defaults/normalize liên quan cơ chế phối màu phụ.

2. **Color helpers / validation**
- Refactor các file `_lib/colors.ts` để bỏ tham số phối màu phụ khỏi API công khai.
- Chuẩn hóa rule còn lại:
  - `mode='single'`: giữ như hiện tại.
  - `mode='dual'`: dùng `secondary` nếu có; nếu thiếu thì sinh secondary theo 1 rule fallback cố định của từng helper hiện có, không expose cơ chế phối màu phụ nữa.
- Đổi tên/giữ lại cảnh báo kiểm tra độ gần màu thành logic trung tính hơn; nếu không cần thì xóa luôn.

3. **Preview + site runtime**
- Xóa props phối màu phụ khỏi preview components.
- Sửa `components/site/*.tsx` và `components/site/ComponentRenderer.tsx` để không còn đọc trường phối màu phụ.
- Với dữ liệu cũ, runtime sẽ bỏ qua hoàn toàn field này.

### Thứ tự triển khai
1. Hoàn tất cleanup các nhóm đã sửa dở (`team`, `speed-dial`, `service-list`, `video`, `about`, `contact`) để bỏ nốt cảnh báo độ gần màu/dependency thừa nếu có.
2. Refactor toàn bộ nhóm còn lại trong `app/admin/home-components/**` còn grep ra keyword phối màu phụ.
3. Refactor `components/site/**`, đặc biệt `ComponentRenderer.tsx` và các section wrappers.
4. Chạy verify theo yêu cầu của bạn:
   - `bunx tsc --noEmit`
   - `npm run lint`
   - `npm run build`
5. Review diff để chắc không còn keyword phối màu phụ rơi rớt trong code/payload.
6. Commit local sau khi verify pass.

## Verification Plan
- Search pass: grep lại toàn repo để xác nhận không còn keyword phối màu phụ trong các home-component mục tiêu, trừ khi chỉ còn trong tên commit/spec cũ hoặc text không còn chạy runtime.
- Typecheck: `bunx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`
- Runtime spot check logic:
  - create/edit representative pages của vài nhóm lớn như Hero, Pricing, Gallery, Testimonials
- site rendering qua `ComponentRenderer` để xác nhận single/dual mode vẫn hoạt động khi không còn cơ chế phối màu phụ

Nếu bạn duyệt, mình sẽ bắt đầu implement theo đúng phạm vi này và hoàn tất luôn phần còn thiếu.