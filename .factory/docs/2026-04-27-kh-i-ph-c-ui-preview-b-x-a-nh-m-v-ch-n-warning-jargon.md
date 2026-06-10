# I. Primer

## 1. TL;DR kiểu Feynman
- Đúng, lỗi nằm ở cách xử lý trước đó: thay vì chỉ xóa warning APCA/minLc/deltaE, một số block UI/preview bị cắt nhầm theo regex quá rộng.
- May là **chưa commit**, nên có thể sửa sạch bằng cách restore các file bị hỏng về trạng thái trước task, rồi apply lại thay đổi nhỏ hơn.
- Lần này sẽ làm theo hướng an toàn: **khôi phục UI trước**, sau đó **chỉ xóa đúng warning box / warning text jargon**.
- Không đụng các thay đổi có sẵn trước đó như `AboutForm.tsx`, `ProductListSectionShared.tsx` nếu không liên quan.

## 2. Elaboration & Self-Explanation
Vấn đề xảy ra vì thao tác bulk edit trước đó dùng pattern quá rộng để xóa `warningMessages`. Một vài file có warning nằm gần các block JSX lớn như preview, selection list, form settings; regex đã ăn quá tay nên làm mất hoặc làm vỡ cấu trúc JSX.

Cách sửa đúng không phải tiếp tục vá từng mảnh rời rạc. Cách an toàn hơn là:
1. Restore các file bị ảnh hưởng về bản `HEAD` nếu file đó sạch trước task.
2. Apply lại thay đổi bằng patch nhỏ, đọc từng file, chỉ xóa block warning.
3. Không xóa form, preview, selection UI, sticky footer, submit logic.
4. Chạy typecheck rồi commit.

## 3. Concrete Examples & Analogies
- Ví dụ `create/product-list/_shared.tsx`: block `serviceWarnings/blogWarnings` bị xóa đúng, nhưng regex cũng cắt mất phần đầu JSX của manual selection/product list. File này cần restore rồi chỉ xóa 2 warning useMemo + 2 warning render blocks.
- Ví dụ `create/services/page.tsx`: phần setting panel bị thay bằng UI khác. Cần trả lại panel cũ, chỉ xóa warning box màu vàng.
- Analogy: cần lau vết bẩn trên kính, nhưng lần trước lại cạo luôn lớp kính. Lần này thay kính về nguyên trạng rồi lau đúng vết bẩn.

# II. Audit Summary (Tóm tắt kiểm tra)

Observation:
- `bunx tsc --noEmit` đang fail do JSX bị cắt nhầm ở:
  - `app/admin/home-components/case-study/[id]/edit/page.tsx`
  - `app/admin/home-components/create/case-study/page.tsx`
  - `app/admin/home-components/create/product-list/_shared.tsx`
- Diff cho thấy `create/product-list/_shared.tsx` bị xóa quá rộng: mất cả `typedBlogPreviewPosts`, `onSubmit`, card nguồn dữ liệu và manual selection ProductList.
- Diff cho thấy `create/services/page.tsx` bị thay đổi UI settings panel quá nhiều, không chỉ ẩn warning.
- Một số file còn lại chỉ bị xóa đúng warning hoặc có thể sửa bằng restore + patch lại.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Root Cause Confidence: **High**
- Nguyên nhân chính là bulk regex edit quá rộng, match từ `warningMessages` qua các block JSX kế tiếp.
- Evidence: `git diff` cho thấy nhiều đoạn không liên quan warning bị xóa trong `create/product-list/_shared.tsx` và `create/services/page.tsx`.

Counter-Hypothesis:
- “Do component vốn đã hỏng trước đó” → Low. Trước task chỉ có 2 file dirty ban đầu (`AboutForm.tsx`, `ProductListSectionShared.tsx`), còn các file này bị lỗi sau khi edit.
- “Chỉ thiếu vài dấu ngoặc” → Medium/Low. Một số file đúng là thiếu ngoặc, nhưng `create/product-list/_shared.tsx` và `create/services/page.tsx` bị thay đổi UI lớn nên cần restore sạch.

# IV. Proposal (Đề xuất)

## 1. Restore an toàn các file bị tôi làm hỏng
Dùng restore theo file cho các file sạch trước task, ví dụ:
- `app/admin/home-components/create/product-list/_shared.tsx`
- `app/admin/home-components/create/services/page.tsx`
- `app/admin/home-components/create/case-study/page.tsx`
- `app/admin/home-components/case-study/[id]/edit/page.tsx`
- Các file edit/create/preview khác đã bị tôi chạm trong task warning

Không restore:
- `app/admin/home-components/about/_components/AboutForm.tsx` vì đã dirty từ trước task.
- `app/admin/home-components/product-list/_components/ProductListSectionShared.tsx` vì đã dirty từ trước task.
- `.factory/docs/*` có sẵn hoặc doc spec vừa tạo sẽ giữ theo rule repo.

## 2. Apply lại thay đổi thật nhỏ
Chỉ xóa đúng các phần sau:
- `warningMessages`/`warnings` state hoặc useMemo nếu chỉ phục vụ render warning.
- JSX warning amber box chứa `APCA`, `minLc`, `deltaE`.
- Prop `warningMessages` nếu Form/Preview chỉ dùng để render warning.

Giữ nguyên:
- Preview component.
- Form fields.
- Manual selection UI.
- `onSubmit` config.
- Sticky footer.
- `validation.tokens` hoặc validation logic nếu còn dùng cho màu preview.
- Toast chặn lưu CTA nếu là behavior thật; chỉ đổi message bỏ jargon nếu cần.

## 3. Verify kỹ trước commit
- Chạy `bunx tsc --noEmit`.
- Grep JSX/text UI để đảm bảo không còn `APCA|minLc|deltaE` hiển thị trong `.tsx`, trừ tên function như `getAPCATextColor` trong runtime/token logic.
- `git diff` thủ công trước commit để chắc chắn không còn mất UI/preview ngoài warning.
- Commit toàn bộ thay đổi code + `.factory/docs` theo rule repo, không push.

# V. Files Impacted (Tệp bị ảnh hưởng)

## UI / Create pages
- Sửa: `app/admin/home-components/create/product-list/_shared.tsx` — restore UI nguồn dữ liệu/manual selection/preview, chỉ xóa warning render Blog/ServiceList.
- Sửa: `app/admin/home-components/create/services/page.tsx` — restore setting panel cũ, chỉ bỏ warning APCA/deltaE.
- Sửa: `app/admin/home-components/create/case-study/page.tsx` — restore JSX hợp lệ, chỉ bỏ warning box.
- Sửa: các create page khác đã bị chạm — rà diff, giữ nguyên form/preview, chỉ bỏ warning jargon.

## UI / Edit pages
- Sửa: `app/admin/home-components/case-study/[id]/edit/page.tsx` — restore JSX hợp lệ, chỉ bỏ warning box.
- Sửa: `app/admin/home-components/service-list/[id]/edit/page.tsx` — giữ `filteredServices`, chỉ bỏ prop/render warning.
- Sửa: các edit page khác đã bị chạm — rà diff, giữ nguyên form/preview/footer, chỉ bỏ warning jargon.

## Preview/Form components
- Sửa: các `*Preview.tsx` / `*Form.tsx` đã bị chạm — chỉ bỏ warning block amber; không bỏ preview body.

## Spec/docs
- Thêm/Giữ: `.factory/docs/2026-04-27-n-warning-apca-deltae-jargon-kh-i-ui-end-user-tr-n-to-n-b-home-components.md` — spec đã tạo.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc `git diff --name-only` và phân nhóm file tôi đã chạm.
2. Restore các file sạch trước task về `HEAD` để khôi phục UI/preview.
3. Re-apply patch nhỏ từng file: chỉ xóa warning state/useMemo/JSX.
4. Rà diff thủ công, đặc biệt các file `create/product-list/_shared.tsx`, `create/services/page.tsx`, `case-study`.
5. Chạy `bunx tsc --noEmit`.
6. Grep `APCA|minLc|deltaE` trong `.tsx` để đảm bảo không còn UI jargon; chấp nhận helper/token code `.ts` vẫn có.
7. `git diff --cached`, `git status`, kiểm tra không có secret.
8. Commit, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- `bunx tsc --noEmit` pass.
- `git diff` không còn thay đổi xóa preview/form/manual selection ngoài warning block.
- `APCA|minLc|deltaE` không còn trong text UI `.tsx` warning box, trừ function/token logic cần giữ.
- Route trọng điểm `/admin/home-components/service-list/.../edit` vẫn có form nguồn dữ liệu + preview.
- Create/edit pages bị ảnh hưởng vẫn còn `ComponentFormWrapper`, `Preview`, `StickyFooter`/submit logic.

# VIII. Todo

1. Restore các file bị cắt nhầm UI/preview về bản sạch.
2. Re-apply xóa warning theo patch nhỏ, không dùng regex rộng.
3. Rà `git diff` từng file lớn.
4. Chạy `bunx tsc --noEmit`.
5. Grep UI jargon còn sót.
6. Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Không còn file TSX vỡ cú pháp.
- Preview/form/edit/create không bị mất UI.
- Chỉ warning jargon APCA/minLc/deltaE bị ẩn khỏi UI end-user.
- Typecheck pass.
- Có commit cuối cùng chứa fix.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk chính: restore file có thể làm mất thay đổi ngoài task nếu file đó đã dirty trước đó.
- Mitigation: chỉ restore các file không nằm trong dirty list ban đầu; file dirty ban đầu sẽ không restore.
- Rollback: vì chưa commit, có thể dùng `git diff` để kiểm tra toàn bộ trước commit; sau commit có thể `git revert`.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor color system.
- Không xóa validation helper trong `_lib/colors.ts`.
- Không thay đổi behavior save ngoài việc bỏ jargon khỏi text UI.
- Không push remote.
