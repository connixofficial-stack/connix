# Spec: Sửa lỗi mất ảnh sau vài giờ do dọn dẹp nháp và sửa lỗi Schema Validation trong fileReferences

## I. Primer

### 1. TL;DR kiểu Feynman
- **Vấn đề 1**: Khi bạn tải ảnh lên cho Partners (Đối tác), Gallery (Thư viện) hay TrustBadges (Chứng nhận), ảnh hiển thị bình thường. Nhưng khoảng vài tiếng sau (hoặc ngay lập tức khi chuyển trang), ảnh tự dưng biến mất và báo lỗi `FileNotFound`.
  - **Nguyên nhân**: Khi lưu cài đặt, code ở frontend cũ lọc bỏ thuộc tính `storageId` của các ảnh này. Do không có `storageId` nên backend không tạo liên kết `fileReferences`, kích hoạt bộ dọn dẹp (cleanup) xóa nhầm file.
  - **Giải pháp**: Frontend lưu đầy đủ `storageId` và tự khôi phục `storageId` từ URL đối với dữ liệu cũ (lấy phần UUID/ID sau `/api/storage/`).
- **Vấn đề 2**: Khi tự động khôi phục `storageId` từ URL của dữ liệu cũ, nếu URL chứa một UUID giả lập (do dữ liệu seeder/mock cũ sinh ra) không thuộc Convex database hiện tại, Convex ném lỗi crash: `Failed to insert or update a document in table "fileReferences" because it does not match the schema: Value does not match validator.`
  - **Nguyên nhân**: `storageId` được định nghĩa là `v.id("_storage")` trong database Convex. Nếu nó không đúng format hoặc không phải Convex ID thật của bảng `_storage`, Convex engine sẽ chặn insert và ném lỗi.
  - **Giải pháp**: Ở backend Convex (`convex/lib/fileService.ts`), sử dụng phương thức `ctx.db.normalizeId("_storage", storageId)` để tự động xác thực và bỏ qua các storageId không hợp lệ trước khi thao tác cơ sở dữ liệu.

### 2. Elaboration & Self-Explanation
Mỗi lần người dùng tải một ảnh lên qua admin dashboard, frontend sẽ gửi file đó lên Convex Storage. File này lúc đầu được coi là "ảnh nháp" (draft upload) và được đăng ký vào bảng `fileDraftUploads` để hệ thống biết nó tồn tại nhưng chưa chắc chắn có dùng hay không.
Khi người dùng bấm "Lưu thay đổi", backend Convex sẽ đồng bộ hóa các liên kết file (`fileReferences`) bằng cách quét qua toàn bộ cấu hình (`config`) của component đó. Nó tìm các thuộc tính `storageId` có trong cấu hình và tạo liên kết tương ứng.
Sau 6 tiếng, một tác vụ nền tự động (`cleanupExpiredDraftUploads`) sẽ quét qua bảng `fileDraftUploads`. Nếu một file nháp đã hết hạn mà không tìm thấy bất kỳ liên kết (`fileReferences`) nào trỏ tới nó, hệ thống sẽ thực hiện xóa vĩnh viễn file đó ra khỏi Convex Storage để tránh rác dữ liệu.
Vì code frontend của Partners, Gallery và TrustBadges khi submit form đã cố tình viết dạng: `.map(item => ({ url: item.url, link: item.link, name: item.name }))` (thiếu `storageId`), database lưu config không có `storageId`. Do đó backend không thể tạo `fileReferences`, dẫn đến việc file ảnh bị xóa nhầm khi tác vụ dọn dẹp chạy qua.
Chúng ta sẽ giải quyết triệt để bằng cách giữ lại trường `storageId` trong toàn bộ quá trình: lúc load config cũ lên, lúc so sánh thay đổi, và lúc lưu config mới.

### 3. Concrete Examples & Analogies
**Ví dụ cụ thể**:
Trước khi sửa:
Config của Partners được lưu:
```json
{
  "items": [
    { "name": "Google", "link": "https://google.com", "url": "https://proud-wolverine-123.convex.site/api/storage/5803236e-4b13-42f0-90bd" }
  ]
}
```
Sau khi sửa (có cơ chế tự phục hồi `storageId` từ URL):
```json
{
  "items": [
    { "name": "Google", "link": "https://google.com", "url": "https://proud-wolverine-123.convex.site/api/storage/5803236e-4b13-42f0-90bd", "storageId": "5803236e-4b13-42f0-90bd" }
  ]
}
```
**Hình ảnh đời thường**:
Giống như bạn gửi một chiếc vali ở tủ gửi đồ tự động của siêu thị (upload ảnh). Siêu thị đưa cho bạn một chiếc vé điện tử ghi số tủ (storageId).
Khi bạn thanh toán tại quầy và quyết định mua hàng (bấm Lưu), bạn cần xuất trình chiếc vé đó để quầy thu ngân dán nhãn xác nhận vali này là của bạn (tạo fileReference).
Nếu bạn không xuất trình vé, siêu thị sẽ coi chiếc vali trong tủ kia là đồ vô chủ bị bỏ quên, và cứ sau mỗi ca làm việc (6 tiếng), bảo vệ sẽ dọn dẹp và vứt chiếc vali đó đi (hệ thống cleanup xóa file).

## II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra logic tải ảnh và lưu ảnh của trang `edit` của Partners và phát hiện code frontend đang lọc bỏ thuộc tính `storageId` trước khi gọi mutation `update` của Convex.
- Đã đối chiếu với hàm `collectConfigStorageIds` trong Convex backend (`convex/homeComponents.ts`) và thấy backend chỉ tìm `record.storageId` trong config để tạo reference. Do config của Partners, Gallery và TrustBadges thiếu `storageId` nên backend không tạo reference.
- Đã xác định cron job `cleanupExpiredDraftUploads` định kỳ 6 tiếng sẽ xóa toàn bộ các file ảnh không có reference này.
- Các route bị ảnh hưởng tương tự:
  - Create Partners: `app/admin/home-components/create/partners/page.tsx`
  - Edit Gallery: `app/admin/home-components/gallery/[id]/edit/page.tsx`
  - Create Gallery: `app/admin/home-components/create/gallery/page.tsx`
  - Edit TrustBadges: `app/admin/home-components/trust-badges/[id]/edit/page.tsx`
  - Create TrustBadges: `app/admin/home-components/create/trust-badges/page.tsx`

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause 1**: Code frontend khi submit config lên database cho 3 component `Partners`, `Gallery`, `TrustBadges` đã map và loại bỏ thuộc tính `storageId` của các item ảnh, đồng thời khi load config cũ lên cũng loại bỏ `storageId`. Thiếu `storageId` trong `config` dẫn đến backend không tạo `fileReferences`, kích hoạt cơ chế dọn dẹp tự động (cleanup) của Convex xóa mất file ảnh sau 6 tiếng.
- **Root Cause 2**: Khi tự động khôi phục `storageId` từ URL của ảnh cũ (ví dụ ảnh seeder/mock dạng UUID), do các ID này không phải là Convex `_storage` ID hợp lệ trong database hiện tại, backend Convex cố gắng insert vào bảng `fileReferences` và bị crash do lỗi Schema Validation.
  - Độ tin cậy nguyên nhân gốc: **High** (Có trace lỗi rõ ràng từ Convex Mutation: `Failed to insert or update a document in table "fileReferences" because it does not match the schema: Value does not match validator. Path: .storageId Value: "983d774f-8cbe-46be-8452-8947a81b4396" Validator: v.id("_storage")`).

## IV. Proposal (Đề xuất)
1. Cập nhật logic load dữ liệu (`useEffect` ban đầu) ở các trang Edit để map và giữ lại `storageId` từ config cũ.
2. Thêm hàm helper `extractStorageIdFromUrl` ở client để tự động khôi phục `storageId` từ URL Convex của các ảnh cũ được tải lên trước đây.
3. **Cập nhật backend Convex (`convex/lib/fileService.ts`)**: Trong các hàm `removeOwnerFileReferences`, `syncOwnerFileReferences`, `commitFileDraftUploads` và `cleanupStorageIdsIfUnreferenced`, sử dụng `ctx.db.normalizeId("_storage", id)` để lọc và loại bỏ bất kỳ `storageId` nào không phải là Convex ID hợp lệ của bảng `_storage`. Điều này giúp hệ thống hoạt động ổn định 100%, bỏ qua các ảnh mock/seeder cũ mà không bị crash.

## V. Files Impacted (Tệp bị ảnh hưởng)
1. **Sửa**: [convex/lib/fileService.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/lib/fileService.ts)
   - Sửa: Dòng xử lý các hàm `syncOwnerFileReferences`, `removeOwnerFileReferences`, `commitFileDraftUploads` và `cleanupStorageIdsIfUnreferenced` để validate `storageId` bằng `ctx.db.normalizeId`.
2. **Sửa (Đã thực hiện)**: [app/admin/home-components/partners/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/[id]/edit/page.tsx)
3. **Sửa (Đã thực hiện)**: [app/admin/home-components/create/partners/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/partners/page.tsx)
4. **Sửa (Đã thực hiện)**: [app/admin/home-components/gallery/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/gallery/[id]/edit/page.tsx)
5. **Sửa (Đã thực hiện)**: [app/admin/home-components/create/gallery/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/gallery/page.tsx)
6. **Sửa (Đã thực hiện)**: [app/admin/home-components/trust-badges/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/trust-badges/[id]/edit/page.tsx)
7. **Sửa (Đã thực hiện)**: [app/admin/home-components/create/trust-badges/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/create/trust-badges/page.tsx)

## VI. Execution Preview (Xem trước thực thi)
1. Sửa file `convex/lib/fileService.ts` để thêm logic validate ID.
2. Chạy tsc compiler check.

## VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra compile TypeScript: Chạy `bunx tsc --noEmit`.

## VIII. Todo
- [x] Cập nhật file spec `.factory/docs/2026-05-27-spec-fix-partners-and-gallery-orphaned-images-after-cleanup.md`.
- [ ] Sửa file `convex/lib/fileService.ts`.
- [ ] Chạy check TypeScript `bunx tsc --noEmit` để xác thực.

## IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi chỉnh sửa và lưu lại các component chứa ảnh seeder/mock (có storageId không hợp lệ), Convex mutation hoàn tất thành công mà không bị crash lỗi Schema Validation.
- Khi người dùng tải ảnh thật mới lên, reference vẫn được tạo bình thường.

## X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Không có rủi ro, do các storageId không hợp lệ thực tế không tồn tại trong database nên việc bỏ qua tạo references cho chúng là đúng đắn và không ảnh hưởng gì tới nghiệp vụ thực tế.
- **Hoàn tác**: Sử dụng `git checkout` để khôi phục trạng thái cũ của các file đã sửa đổi.
