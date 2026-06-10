# Spec: Siết chặt Husky Hook và Khắc phục Cảnh báo Linter toàn dự án

# I. Primer

## 1. TL;DR kiểu Feynman
* **Husky** giống như một bảo vệ cổng trước khi bạn đẩy thư lên bưu điện (Git). Hiện tại bảo vệ chỉ cản những thư bị rách nát (Errors), còn thư hơi nhàu (Warnings) vẫn cho qua.
* Chúng ta sẽ nâng cấp bảo vệ này để **chặn cả những thư bị nhàu** bằng cách thêm luật từ chối cảnh báo (`--deny-warnings`).
* Đồng thời, chúng ta sẽ đi qua từng bức thư cũ bị nhàu (46 cảnh báo linter) và là phẳng chúng (xoá import thừa, gắn dấu gạch dưới `_` cho biến chưa dùng, sửa cách ép kiểu Object thành chuỗi trong Convex) để mọi thứ trơn tru vượt qua cổng bảo vệ mới.

## 2. Elaboration & Self-Explanation
Hiện tại, Husky pre-commit hook chạy lệnh `bunx oxlint --type-aware --type-check --fix` để đảm bảo code đẩy lên sạch sẽ. Tuy nhiên, Oxlint phân biệt lỗi nghiêm trọng (Errors) và cảnh báo (Warnings). Mặc định, cảnh báo không làm lệnh trả về mã lỗi (`exit 1`), nên Husky vẫn cho phép commit.

Để giải quyết:
a) Cập nhật cấu hình Husky: Thêm cờ `--deny-warnings` vào lệnh gọi Oxlint để khi có bất kỳ cảnh báo nào xuất hiện, lệnh sẽ thất bại và Husky sẽ chặn commit.
b) Sửa toàn bộ 46 cảnh báo linter hiện có trong hệ thống bao gồm các lỗi:
* `no-unused-vars`: Các biến, tham số hoặc import khai báo nhưng không dùng. Ta sẽ xoá các import/khai báo thừa hoặc tiền tố hoá bằng dấu gạch dưới `_`.
* `no-base-to-string`: Việc gọi `String(settings.site_name)` trong Convex gây cảnh báo vì `settings.site_name` có thể có kiểu dữ liệu là Object. Ta sẽ sửa cách kiểm tra kiểu dữ liệu hoặc dùng chú thích vô hiệu hoá cục bộ an toàn (`// oxlint-disable-next-line typescript/no-base-to-string`).

## 3. Concrete Examples & Analogies
* **Ví dụ Unused Import/Variable:**
  * *Trước:* `import { BookOpen, ExternalLink, Loader2, Plus, Filter } from 'lucide-react';` (trong đó `Filter` không được dùng).
  * *Sau:* `import { BookOpen, ExternalLink, Loader2, Plus } from 'lucide-react';` (loại bỏ `Filter`).
* **Ví dụ Unused Catch Parameter:**
  * *Trước:* `try { ... } catch (e) { ... }`
  * *Sau:* `try { ... } catch (_e) { ... }` (thêm gạch dưới để báo hiệu cố tình không dùng tham số này).
* **Ví dụ no-base-to-string (Convex):**
  * *Trước:* `const brandName = settings.site_name ? String(settings.site_name).trim() : "YourBrand";`
  * *Sau:* Sử dụng chú thích tắt cảnh báo cục bộ vì đây là logic cũ:
    ```typescript
    // oxlint-disable-next-line typescript/no-base-to-string
    const brandName = settings.site_name ? String(settings.site_name).trim() : "YourBrand";
    ```

# II. Audit Summary (Tóm tắt kiểm tra)
* **Số lượng cảnh báo hiện tại:** 46 cảnh báo.
* **Các nhóm chính:**
  * `no-unused-vars` (eslint): Chiếm ~90% tổng số cảnh báo, phân bố tại các file admin components, previews, và scripts.
  * `no-base-to-string` (typescript): 4 cảnh báo tại [orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/orders.ts).
* **Trạng thái Husky:** Cấu hình tại [.husky/pre-commit](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/.husky/pre-commit) chưa dùng `--deny-warnings`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc:** Husky pre-commit hook hiện tại thiếu cờ `--deny-warnings` cho lệnh `oxlint`. Do đó, mặc dù code cũ có nhiều warning, commit vẫn chạy qua được. Đồng thời các file cũ có nhiều code thừa chưa dọn dẹp.
* **Giả thuyết đối chứng:** Nếu ta chỉ thêm `--deny-warnings` mà không sửa 46 warnings hiện tại, không ai có thể commit bất kỳ file nào vì pre-commit sẽ luôn thất bại ngay lập tức trên dự án. Do đó bắt buộc phải sửa sạch warnings trước hoặc song song với đổi cấu hình Husky.

# IV. Proposal (Đề xuất)
* **Đề xuất 1:** Chỉnh sửa file hook [.husky/pre-commit](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/.husky/pre-commit) để thêm `--deny-warnings`.
* **Đề xuất 2:** Đi qua từng file có cảnh báo và sửa đổi:
  * Xóa các unused import.
  * Tiền tố hoá các unused parameters/variables bằng dấu gạch dưới `_`.
  * Tắt cảnh báo `no-base-to-string` cục bộ tại các vị trí an toàn trong file Convex.

# V. Files Impacted (Tệp bị ảnh hưởng)
1. **Cấu hình Hook:**
   * Sửa: [.husky/pre-commit](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/.husky/pre-commit) — Thêm `--deny-warnings` vào dòng lệnh Oxlint.
2. **Mã nguồn ứng dụng (Sửa cảnh báo):**
   * Sửa: [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx) (unused variables).
   * Sửa: [AdminImage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/AdminImage.tsx) (unused variables & parameters).
   * Sửa: [PartnersForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersForm.tsx) (unused parameters).
   * Sửa: [PartnersBadgeShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/partners/_components/PartnersBadgeShared.tsx) (unused variables).
   * Sửa: [shared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/shared.tsx) (unused imports).
   * Sửa: [scan.js](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/.factory/skills/madge-circular-scanner/scripts/scan.js) (unused catch variables).
   * Sửa: [CourseCurriculumEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/components/CourseCurriculumEditor.tsx) (unused variables & imports).
   * Sửa: [CoursePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/CoursePreview.tsx) (unused variable).
   * Sửa: [CertificateCard.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CertificateCard.tsx) (unused function).
   * Sửa: [orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/orders.ts) (no-base-to-string warnings).
   * Sửa các file chứa unused import khác:
     * `app/admin/resources/filters/page.tsx`
     * `app/admin/courses/[id]/edit/page.tsx`
     * `app/admin/courses/create/page.tsx`
     * `app/admin/courses/filters/page.tsx`
     * `app/admin/resources/create/page.tsx`
     * `app/(site)/_components/resources/ResourceDetailPage.tsx`
     * `app/(site)/_components/courses/CourseDetailPage.tsx`
     * `lib/image/removeBgWorker.ts`

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa Husky Hook trước.
2. Quét chi tiết các cảnh báo và tiến hành sửa thủ công hoặc sửa hàng loạt bằng script/sửa từng file.
3. Chạy `bunx oxlint --type-aware --type-check` cục bộ để đảm bảo số lượng warning về 0.
4. Chạy `git add` và tiến hành commit để kiểm chứng pre-commit hook hoạt động hoàn hảo.

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
* Chạy `bunx oxlint --type-aware --type-check --deny-warnings` trên toàn bộ dự án. Lệnh này PHẢI kết thúc với mã lỗi `0` (không có warning/error nào).
* Chạy `bun tsc --noEmit` để đảm bảo không làm gãy kiểu TypeScript.

# VIII. Todo
- [ ] Chỉnh sửa [.husky/pre-commit](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/.husky/pre-commit)
- [ ] Khắc phục cảnh báo trong [orders.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/orders.ts)
- [ ] Khắc phục cảnh báo trong các components thuộc `app/admin`
- [ ] Khắc phục cảnh báo trong các components thuộc `app/(site)`
- [ ] Khắc phục cảnh báo trong `components/experiences`
- [ ] Khắc phục cảnh báo trong các file helpers, scripts (`scan.js`, `removeBgWorker.ts`)
- [ ] Xác minh bằng cách chạy Oxlint toàn dự án
- [ ] Tiến hành commit thay đổi

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Dự án chạy `bunx oxlint --type-aware --type-check --deny-warnings` không gặp bất kỳ lỗi hay cảnh báo nào.
* Husky chặn commit thành công nếu cố tình đưa thêm code chứa warning vào hệ thống.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Một số file như `orders.ts` hoặc các logic cốt lõi có thể bị thay đổi hành vi ngoài ý muốn nếu xoá nhầm biến hoặc chỉnh sửa sai ép kiểu.
* **Hoàn tác:** Sử dụng `git checkout -- <file>` để phục hồi file bị lỗi về trạng thái ban đầu.

# XI. Out of Scope (Ngoài phạm vi)
* Định dạng lại toàn bộ code theo các công cụ khác ngoài Oxlint.
* Thay đổi cấu trúc logic của dự án.
