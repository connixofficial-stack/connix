## Audit Summary
- Observation: label `Chế độ phối màu phụ` hiện thấy rõ ở Contact config editor tại `app/admin/home-components/contact/_components/ConfigEditor.tsx:330`.
- Observation: cơ chế phối màu phụ không chỉ là một label riêng lẻ; nó đang được truyền/lưu rộng khắp create/edit/preview/types/constants/colors của nhiều home-component trong `app/admin/home-components/**`.
- Observation: grep cho thấy phạm vi ảnh hưởng gồm nhiều component có cơ chế phối màu phụ trong create/edit như: about, benefits, career, case-study, clients, contact, countdown, cta, faq, features, gallery, hero, pricing, service-list, services, speed-dial, team, testimonials, video, voucher-promotions, cùng một số preview/site renderer liên quan.
- Inference: root cause không phải chỉ là microcopy khó hiểu; cơ chế phối màu phụ đã được đưa vào kiến trúc config/admin nên chỉ xóa UI ở Contact sẽ không đạt yêu cầu “mọi home-component khác có nữa”.
- Inference: theo yêu cầu đã chốt, cần xóa toàn bộ logic phối màu phụ, áp dụng cho toàn bộ home-components có field này, và bỏ hẳn field này khỏi payload create/update.

## Root Cause Confidence
- High — có evidence trực tiếp từ `ConfigEditor.tsx` của Contact và grep toàn repo cho thấy cơ chế phối màu phụ đang tồn tại ở nhiều lớp: `_types`, `_lib/constants`, `_lib/colors`, `_components/*Preview`, `create/*`, `[id]/edit/*`, và cả `components/site/*`. Nếu chỉ sửa label/UI sẽ còn logic + payload + preview phụ thuộc vào cơ chế này.

## Proposal
1. Chuẩn hóa mục tiêu kỹ thuật
- Xóa field phối màu phụ khỏi mọi form create/edit của home-components trong admin.
- Bỏ field phối màu phụ khỏi payload create/update và snapshot/normalize liên quan.
- Xóa type/constant/helper normalize chỉ phục vụ cơ chế phối màu phụ nếu không còn nơi dùng.
- Chuyển toàn bộ tính màu sang cơ chế không cần phối màu phụ:
  - `mode=single`: giữ như hiện tại.
  - `mode=dual`: dùng `secondary` nếu có; nếu thiếu thì tự sinh một secondary mặc định theo 1 rule cố định duy nhất của hệ thống.
- Không migrate data cũ; dữ liệu phối màu phụ đã lưu sẽ bị bỏ qua ở runtime/admin sau refactor.

2. Thực hiện theo 3 lớp để giảm rủi ro
### Lớp A — Admin form/config
- Sửa tất cả create/edit pages và config editors để không còn state/prop/payload phối màu phụ.
- File tiêu biểu cần sửa:
  - `app/admin/home-components/contact/_components/ConfigEditor.tsx`
  - `app/admin/home-components/create/*/page.tsx`
  - `app/admin/home-components/**/[id]/edit/page.tsx`
  - các shared form như `countdown/_components/CountdownForm.tsx`, `features/_components/FeaturesSectionShared.tsx`, `speed-dial/_components/SpeedDialSectionShared.tsx`, v.v.
- Với các page đang giữ state phối màu phụ riêng, xóa state này và phần warning phụ thuộc cảnh báo độ gần màu nếu warning đó chỉ có ý nghĩa khi cho chọn phối màu phụ.

### Lớp B — Domain model/types/normalize
- Gỡ type phối màu phụ khỏi từng component `_types/index.ts`.
- Xóa defaults/constants như `DEFAULT_*_HARMONY`, `*_HARMONY_OPTIONS`, `normalize*Harmony` nếu không còn ai dùng.
- Cập nhật normalize/payload helpers để không đọc/ghi trường phối màu phụ nữa.
- Những file tiêu biểu:
  - `app/admin/home-components/*/_types/index.ts`
  - `app/admin/home-components/*/_lib/constants.ts`
  - `app/admin/home-components/*/_lib/normalize.ts`
  - `app/admin/home-components/*/_lib/colors.ts`

### Lớp C — Preview + site rendering
- Refactor mọi preview/site renderer đang nhận prop phối màu phụ để dùng thuật toán cố định không cần tham số này.
- Các hàm tính màu phụ và resolve secondary sẽ đổi signature để bỏ tham số phối màu phụ.
- File phạm vi cao cần cập nhật:
  - `app/admin/home-components/**/_components/*Preview.tsx`
  - `components/site/*.tsx`
  - `components/site/ComponentRenderer.tsx`
- Rule đề xuất: giữ 1 fallback secondary cố định (nhiều khả năng analogous-like hoặc rule hiện có trong helper chung), nhằm giữ UI ổn định và giảm diff thị giác.

3. Thứ tự triển khai cụ thể
- Bước 1: Lập danh sách tất cả component có type phối màu phụ / `DEFAULT_*_HARMONY` / `normalize*Harmony`.
- Bước 2: Refactor từng component admin để bỏ phối màu phụ khỏi state + payload.
- Bước 3: Refactor từng preview/colors helper để bỏ tham số phối màu phụ.
- Bước 4: Refactor site components/renderer tương ứng.
- Bước 5: Chạy typecheck, lint, test; sửa hết compile/runtime issues.
- Bước 6: Kiểm tra lại các route create/edit đại diện (ít nhất Contact + 2-3 component khác dùng cơ chế phối màu phụ nặng như team/pricing/video).
- Bước 7: Commit local, không push.

## Counter-Hypothesis
- Giả thuyết thay thế: chỉ có Contact hiển thị label khó hiểu, còn các component khác chỉ dùng phối màu phụ ngầm nên không cần xóa sâu.
- Loại trừ: user đã chốt rõ “Xóa toàn bộ logic phối màu phụ”, “Toàn bộ home-components có trường phối màu phụ”, “Bỏ hẳn trường này khỏi payload update/create”. Vì vậy partial fix sẽ không đạt spec.

## File Impact (nhóm chính)
- Admin create/edit:
  - `app/admin/home-components/create/**`
  - `app/admin/home-components/**/[id]/edit/page.tsx`
- Shared/config editors/previews:
  - `app/admin/home-components/**/_components/**`
- Domain:
  - `app/admin/home-components/**/_types/index.ts`
  - `app/admin/home-components/**/_lib/constants.ts`
  - `app/admin/home-components/**/_lib/colors.ts`
  - `app/admin/home-components/**/_lib/normalize.ts`
- Site render:
  - `components/site/**`

## Verification Plan
- Repro: kiểm tra route `http://localhost:3000/admin/home-components/create/contact` và các route edit/create representative để xác nhận không còn UI phối màu phụ.
- Typecheck: chạy `bunx tsc --noEmit` vì có thay đổi TS/code.
- Lint/test: đọc `package.json` để dùng đúng script lint/test hiện có, rồi chạy đầy đủ.
- Pass criteria:
  1. Không còn label/control `Chế độ phối màu phụ` hay selector phối màu phụ trong mọi create/edit home-components.
  2. Không còn field phối màu phụ trong payload create/update admin.
  3. Build/typecheck pass.
  4. Preview/site vẫn render ổn với single/dual mode.
  5. Dữ liệu cũ có trường phối màu phụ không làm vỡ edit page/runtime.

Nếu bạn duyệt spec này, tôi sẽ triển khai xóa toàn bộ cơ chế phối màu phụ end-to-end rồi chạy verify và commit local.