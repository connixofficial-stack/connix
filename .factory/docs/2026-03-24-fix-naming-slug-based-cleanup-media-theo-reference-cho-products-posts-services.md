## TL;DR kiểu Feynman
- Hiện tại uploader đã nén/đổi tên ảnh, nhưng chưa gắn theo slug entity nên ra kiểu `products-anh-image-6.webp`.
- Khi xóa ảnh trong form edit, nhiều case chỉ xóa URL trong state, không có `storageId` để xóa thật trong Convex storage.
- Vì dữ liệu product/post/service đang lưu URL (không lưu `storageId` chuẩn), hệ thống không “observe cleanup” đáng tin cậy.
- Em sẽ chuẩn hóa: upload mới dùng tên `{slug}-{n}.ext`, đồng thời lưu `storageId` reference vào entity.
- Khi update entity, ảnh bị gỡ sẽ được cleanup server-side **nếu và chỉ nếu** không còn entity nào dùng.
- Không backfill ảnh cũ (theo yêu cầu), chỉ áp dụng cho ảnh upload mới.

## Audit Summary
### Observation (evidence)
1. `/admin/products/[id]/edit` dùng `ImageUpload` + `MultiImageUploader` nhưng không truyền naming theo slug (file: `app/admin/products/[id]/edit/page.tsx`, đoạn render image uploader).
2. `buildImageFilename` hiện format legacy `entity-anh-field-index.ext` (file: `lib/image/uploadNaming.ts`).
3. `ImageUpload.handleRemove()` chỉ `onChange(undefined)`; không gọi delete storage (file: `app/admin/components/ImageUpload.tsx`).
4. Product gallery khi load từ DB chỉ map `{id,url}` không có `storageId` (file: `app/admin/products/[id]/edit/page.tsx`, dòng map `productData.images`).
5. `storage.deleteImage` đang hard-delete theo `storageId`, không check đang được entity khác dùng (file: `convex/storage.ts`).
6. Schema `images` không có index by URL; products/posts/services chủ yếu lưu URL nên cleanup theo URL thiếu chắc chắn (file: `convex/schema.ts`, `convex/products.ts`, `convex/posts.ts`, `convex/services.ts`).

### Root-cause checklist (rút gọn 6/8, gồm #1 #3 #6 #8)
1) Triệu chứng: tên ảnh không theo slug entity; xóa ảnh trong edit nhưng `/admin/media` còn bản ghi/file.  
3) Tái hiện ổn định: Có, đặc biệt với ảnh cũ hoặc ảnh không giữ `storageId` trong state entity.  
4) Mốc thay đổi gần nhất: commit `dadf8640` chuẩn hóa naming chung nhưng chưa bind naming với slug page-level + chưa hoàn thiện cleanup reference.  
5) Thiếu dữ liệu: map chuẩn giữa URL và storageId cho dữ liệu cũ.  
6) Giả thuyết thay thế: `/admin/media` cache UI; loại trừ một phần vì DB vẫn giữ record `images` khi không delete storageId path.  
8) Pass/fail: upload mới phải ra `{slug}-{n}.ext`; remove + save phải xóa khỏi media nếu không còn reference ở product/post/service.

## Root Cause Confidence
**High** — vì có evidence trực tiếp ở cả 3 lớp: UI uploader (không mang đủ `storageId`), schema/domain model (chưa lưu reference storage cho entity), và storage mutation (delete không có guard/reference cleanup).

## Files Impacted
### Shared/UI
- **Sửa:** `lib/image/uploadNaming.ts` — hiện là legacy naming; thêm mode naming `slug-index` để tạo `{entitySlug}-{index}.{ext}`.
- **Sửa:** `app/admin/components/ImageUpload.tsx` — thêm hỗ trợ trả về/nhận `storageId` + `naming` đầy đủ để xóa/ghi reference đúng.
- **Sửa:** `app/admin/components/ImageUploader.tsx` — dùng naming slug-index cho post/service/product khi được truyền; giữ tương thích cũ.
- **Sửa:** `app/admin/components/MultiImageUploader.tsx` — đảm bảo item giữ `storageId` xuyên suốt edit/remove/reorder.

### Admin pages
- **Sửa:** `app/admin/products/[id]/edit/page.tsx` — truyền naming `{ entityName: slug, style: 'slug-index' }`; quản lý `imageStorageId` + `imageStorageIds` cho ảnh chính/gallery.
- **Sửa:** `app/admin/products/create/page.tsx` — áp dụng cùng contract slug-index + storage refs cho upload mới.
- **Sửa:** `app/admin/posts/[id]/edit/page.tsx` — thumbnail dùng naming slug-index theo post slug + lưu `thumbnailStorageId`.
- **Sửa:** `app/admin/posts/create/page.tsx` — tương tự edit.
- **Sửa:** `app/admin/services/[id]/edit/page.tsx` — thumbnail dùng naming slug-index theo service slug + lưu `thumbnailStorageId`.
- **Sửa:** `app/admin/services/create/page.tsx` — tương tự edit.

### Server / schema
- **Sửa:** `convex/schema.ts` — thêm field reference storage cho entity:
  - products: `imageStorageId`, `imageStorageIds`
  - posts: `thumbnailStorageId`
  - services: `thumbnailStorageId`
- **Sửa:** `convex/products.ts` — create/update nhận và lưu storage refs; update tính removed storageIds và gọi cleanup an toàn.
- **Sửa:** `convex/posts.ts` — create/update thumbnailStorageId + cleanup removed id.
- **Sửa:** `convex/services.ts` — create/update thumbnailStorageId + cleanup removed id.
- **Sửa:** `convex/storage.ts` — thêm mutation helper `cleanupStorageIfUnreferenced` (check refs product/post/service trước khi delete thật).

## Execution Preview
1. Chuẩn hóa naming layer (`uploadNaming`) để có mode `slug-index`.
2. Nâng contract uploader để giữ `storageId` xuyên suốt state UI.
3. Wire vào pages products/posts/services (create/edit) với naming theo slug + gửi storage refs khi submit.
4. Mở rộng schema + mutations create/update để lưu refs và cleanup removed refs server-side.
5. Bổ sung guard mutation cleanup “delete only if unreferenced”.
6. Static review: typing, null-safety, backward compatibility cho bản ghi cũ không có storage refs.

## Acceptance Criteria
1. Upload ảnh mới ở `/admin/products/[id]/edit` tạo filename dạng `product-slug-1.webp`, `product-slug-2.webp`…
2. Upload ảnh mới ở post/service tương tự: `post-slug-n`, `service-slug-n`.
3. Khi remove ảnh rồi Save, ảnh đó biến mất khỏi `/admin/media` **nếu** không còn được product/post/service nào dùng.
4. Nếu ảnh còn được entity khác dùng, cleanup không xóa nhầm.
5. Dữ liệu cũ chưa có storage refs vẫn edit/save bình thường (không crash, không breaking).

## Verification Plan
- Repro manual (không chạy lint/unit/build):
  1) Upload mới ở product/post/service, kiểm tra filename hiển thị trong media list.
  2) Gỡ ảnh ở edit + Save, reload `/admin/media` xác nhận bản ghi đã mất khi unreferenced.
  3) Dùng cùng 1 ảnh cho 2 entity, gỡ 1 bên + Save: ảnh vẫn còn.
- Static verify trước bàn giao: type safety, optional field compatibility, edge case khi thiếu storageId ở dữ liệu cũ.
- Trước commit (vì có đổi TS/code): chạy `bunx tsc --noEmit` theo rule repo.

## Out of Scope
- Backfill/migrate đổi tên ảnh cũ.
- Làm đẹp URL public Convex (URL signed của storage không đổi format).
- Cleanup cho module ngoài products/posts/services.

## Risk / Rollback
- Rủi ro: thêm field schema + logic cleanup có thể xóa nhầm nếu check reference sai.
- Giảm rủi ro: chỉ delete khi `unreferenced` qua guard mutation tập trung.
- Rollback nhanh: tắt gọi cleanup mutation trong update flows; dữ liệu refs mới là optional nên tương thích ngược.