## TL;DR kiểu Feynman
- Mục tiêu là làm sạch toàn repo cho lệnh `bunx oxlint --type-aware --type-check --fix`, không chỉ dọn lỗi auto-fix.
- Gốc vấn đề nhiều khả năng không nằm ở 1 file, mà ở chênh lệch giữa rule oxlint và rule ESLint đang được nới lỏng.
- Nhóm lỗi rủi ro cao nhất hiện thấy là `any` / `as any`, unsafe typing trong Convex và vài trang admin/system.
- Có khả năng oxlint còn quét cả generated/type files do tsconfig include `.next/types`, nên cần chốt ignore/config trước khi sửa tay hàng loạt.
- Khi anh duyệt, em sẽ audit output thật của oxlint, gom lỗi theo nhóm, sửa theo pattern nhỏ-dễ rollback, rồi commit luôn.

## Audit Summary
### Observation
- `package.json` có `oxlint-tsgolint`, nhưng script `lint` hiện chỉ chạy ESLint.
- `eslint.config.mjs` đang tắt các rule: `@typescript-eslint/no-explicit-any`, `react-hooks/rules-of-hooks`, `react-hooks/set-state-in-effect`, `@typescript-eslint/no-require-imports`.
- `tsconfig.json` include cả `.next/types/**/*.ts` và `.next/dev/types/**/*.ts`.
- Repo docs nhiều lần yêu cầu chạy `bunx oxlint --type-aware --type-check --fix`.
- Audit read-only cho thấy nhiều điểm nóng dùng `any` / `as any` ở:
  - `convex/settings.ts`
  - `convex/schema.ts`
  - `convex/landingPages.ts`
  - `components/maps/OpenStreetMapPicker.tsx`
  - `app/system/seo/[id]/edit/page.tsx`
  - `app/system/seo/create/page.tsx`
  - `app/admin/home-components/footer/[id]/edit/page.tsx`
- Một số file đang dựa vào `eslint-disable` cho hook rules, ví dụ:
  - `app/admin/product-options/components/OptionForm.tsx`
  - `app/admin/products/[id]/variants/components/VariantForm.tsx`
  - `app/(site)/products/[slug]/page.tsx`

### Inference
- Lệnh oxlint type-aware có thể báo nhiều lỗi mới vì không “kế thừa” các rule relax từ ESLint config hiện tại.
- Nếu oxlint đọc theo `tsconfig.json`, generated types trong `.next` có thể làm noise hoặc tăng scope lint.
- Auto-fix chỉ xử lý được một phần; phần còn lại sẽ cần sửa tay theo cụm pattern.

### Decision
- Sau khi rời spec mode, em sẽ chạy đúng lệnh anh yêu cầu để lấy evidence thật, rồi fix theo 3 pha: config/ignore cần thiết → auto-fix → sửa tay theo pattern.

## Root Cause Confidence
**Medium-High**
- Lý do: evidence hiện có đủ mạnh để kết luận gốc lỗi chủ yếu đến từ chênh lệch rule giữa ESLint và oxlint + nhiều `any` tồn tại sẵn trong code.
- Chưa thể đạt High tuyệt đối vì spec mode đang cấm chạy lệnh nên chưa có output lỗi thực tế từ oxlint để xác nhận từng rule cụ thể.

## Pre-Audit / Root Cause / Counter-Hypothesis
1. **Triệu chứng quan sát được là gì?**
   - Expected: `bunx oxlint --type-aware --type-check --fix` chạy sạch.
   - Actual: user báo hiện đang còn lỗi và muốn fix đến khi hết.
2. **Phạm vi ảnh hưởng?**
   - Toàn repo, trọng tâm ở Convex backend, admin/system pages, vài shared UI files.
3. **Có tái hiện ổn định không? điều kiện tối thiểu?**
   - Khả năng cao có, chỉ cần chạy đúng lệnh trên root repo.
4. **Mốc thay đổi gần nhất?**
   - Chưa có evidence trực tiếp gắn với commit cụ thể; recent commits đang liên quan speed-dial, chưa đủ chứng minh liên hệ.
5. **Dữ liệu còn thiếu?**
   - Output lỗi oxlint thật sau khi chạy lệnh.
6. **Giả thuyết thay thế chưa loại trừ?**
   - Oxlint có thể đang quét generated files hoặc rule set khác kỳ vọng, không chỉ do `any`.
7. **Rủi ro nếu fix sai nguyên nhân?**
   - Sửa tay nhiều file không cần thiết, hoặc thêm ignore quá rộng làm che lỗi thật.
8. **Tiêu chí pass/fail sau khi sửa?**
   - Pass: `bunx oxlint --type-aware --type-check --fix` không còn diagnostics.
   - Fail: còn bất kỳ lỗi nào hoặc phải thêm ignore/suppress quá rộng không có lý do rõ ràng.

## Files Impacted
### Shared config
- **Sửa:** `package.json` — hiện chỉ có script lint cho ESLint; có thể không cần sửa nếu giữ nguyên command user yêu cầu, nhưng sẽ review xem có cần script phụ trợ không.
- **Sửa:** `tsconfig.json` — hiện là source chính cho type-aware lint; có thể cần tách scope hoặc giữ nguyên và xử lý bằng ignore nếu `.next` gây noise.
- **Sửa/Thêm:** `.oxlintignore` hoặc file config oxlint tương ứng — hiện ignore rất hẹp; có thể cần đồng bộ ignore generated files để tránh false-positive/noise.
- **Sửa:** `eslint.config.mjs` — chỉ chạm nếu cần đồng bộ expectation giữa ESLint và oxlint; không mặc định sửa nếu không cần.

### Server / Convex
- **Sửa:** `convex/settings.ts` — hiện chứa kiểu `any`/schema lỏng; sẽ siết type tối thiểu theo pattern sẵn có.
- **Sửa:** `convex/schema.ts` — hiện có nhiều `v.any()`; sẽ review xem cái nào bắt buộc linh hoạt, cái nào thay được bằng validator cụ thể.
- **Sửa:** `convex/landingPages.ts` — hiện có `ctx/db/q/item as any`; sẽ thay bằng typed helpers hoặc narrowing.

### UI / admin / system
- **Sửa:** `app/system/seo/[id]/edit/page.tsx` — hiện dùng `useRef<any>`/casts; sẽ thay bằng type cụ thể.
- **Sửa:** `app/system/seo/create/page.tsx` — tương tự, ưu tiên narrowing và enum/union đúng type.
- **Sửa:** `app/admin/home-components/footer/[id]/edit/page.tsx` — dọn unsafe cast nếu oxlint report.
- **Sửa:** `components/maps/OpenStreetMapPicker.tsx` — thay `any` state/cast bằng type hẹp hơn.
- **Sửa có điều kiện:** các file hook-heavy như `app/admin/product-options/components/OptionForm.tsx`, `app/admin/products/[id]/variants/components/VariantForm.tsx`, `app/(site)/products/[slug]/page.tsx` nếu output oxlint xác nhận lỗi thật.

## Execution Preview
1. Chạy audit command thật: `bunx oxlint --type-aware --type-check --fix` để lấy danh sách lỗi hiện tại.
2. Phân nhóm lỗi theo loại: config/ignore, auto-fixable, unsafe-any/cast, hook/effect, misc.
3. Chốt hướng tối thiểu cho generated files: ignore/config scope nếu evidence cho thấy `.next` bị quét.
4. Sửa các lỗi auto-fix + pattern lặp đơn giản trước.
5. Sửa tay các lỗi type-aware còn lại theo từng cụm file, ưu tiên Convex rồi admin/system.
6. Chạy lại lệnh oxlint đến khi sạch hoàn toàn.
7. Tự review tĩnh các thay đổi, rồi chạy `bunx tsc --noEmit` theo guideline repo vì có thay đổi code/TS.
8. Review `git status`, `git diff --cached`, commit toàn bộ thay đổi với message phù hợp, không push.

## Acceptance Criteria
- `bunx oxlint --type-aware --type-check --fix` chạy xong và không còn lỗi.
- Không mở rộng scope ngoài lint errors thực tế.
- Không thêm ignore/suppress nếu chưa có evidence cần thiết.
- Typing mới không phá contract dữ liệu cũ ở các luồng Convex/admin/site.
- Có commit local sau khi hoàn tất.

## Verification Plan
- Repro: chạy đúng lệnh user yêu cầu trên root repo.
- Verify fix: chạy lại cùng lệnh đến khi sạch.
- Static verify bổ sung: `bunx tsc --noEmit` vì có thay đổi code/TS.
- Review: kiểm tra `git status`, `git diff --cached` trước commit để tránh commit nhầm generated/noise/sensitive data.

## Risk / Rollback
- Rủi ro chính: sửa type quá chặt ở Convex làm lệch dữ liệu cũ hoặc flow admin.
- Rollback: fix theo cụm nhỏ, commit một lần cuối nhưng nội dung thay đổi vẫn bám pattern nhỏ/dễ đảo ngược; nếu một hướng typing gây cascade lỗi thì quay lại dùng narrowing/helper type thay vì refactor rộng.

## Out of Scope
- Không refactor kiến trúc lớn.
- Không dọn ESLint warnings không liên quan nếu oxlint không report.
- Không chạy lint/build/test khác ngoài các bước verify được repo cho phép trong task này.

Nếu anh duyệt spec này, em sẽ vào pha implement: chạy oxlint thật, fix đến sạch, rồi commit luôn.