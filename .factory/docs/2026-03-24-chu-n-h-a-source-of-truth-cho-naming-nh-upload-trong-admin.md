## TL;DR kiểu Feynman
- Hiện tại nhiều chỗ upload ảnh trong `/admin` đang tự đặt `filename` khác nhau, có chỗ còn dùng thẳng `file.name`.
- Vì vậy tên ảnh trong DB/Media bị lộn xộn, khó đọc, khó quản trị, không đồng bộ.
- Ta sẽ gom về **1 rule đặt tên duy nhất** ở shared util, rồi mọi uploader dùng chung.
- Rule bạn chốt: `{ten-thuc-the}-anh-{field}-{index}` (áp dụng cho **upload mới**).
- URL Convex gốc vẫn random; phase này chuẩn hóa **filename/metadata** làm source of truth (đúng hướng A bạn đã chọn).

## Audit Summary
### Observation
- Các uploader chuẩn đã dùng `prepareImageForUpload` (ví dụ: `app/admin/components/ImageUploader.tsx`, `ImageUpload.tsx`, `MultiImageUploader.tsx`, `SettingsImageUploader.tsx`, `ImageFieldWithUpload.tsx`, `LexicalEditor.tsx`, `media/page.tsx`).
- Có điểm lệch chuẩn còn tự upload/save với `filename: file.name` (điển hình: `app/admin/home-components/create/clients/page.tsx`, `app/admin/home-components/clients/[id]/edit/page.tsx`).
- `TeamForm` có uploader riêng tự nén + slugify cục bộ (`app/admin/home-components/team/_components/TeamForm.tsx`) -> dễ drift rule.
- Backend `convex/storage.ts` đang lưu `filename` nhận từ client, chưa có chuẩn hoá naming tập trung.

### Inference
- Gốc rễ là **thiếu một naming policy dùng chung** + một số flow bypass pipeline chuẩn.
- Nếu chỉ sửa từng nơi rời rạc thì sẽ tái diễn “tùm lum”.

### Decision
- Thiết kế **Source of Truth tại 1 chỗ** (shared naming util + metadata context), sau đó nối lại tất cả uploader ở `/admin` về chung rule.
- Chỉ áp dụng cho **upload mới** (đúng scope bạn chọn), không đụng ảnh cũ.

## Root Cause Confidence
**High** — evidence trực tiếp từ code cho thấy có cả flow chuẩn lẫn flow custom đặt tên khác nhau, và chưa có contract naming thống nhất ở tầng shared/backing mutation.

## Files Impacted
### Shared
- **Thêm:** `lib/image/uploadNaming.ts`  
  Vai trò: chứa chuẩn sinh tên ảnh theo rule duy nhất.  
  Thay đổi: triển khai API kiểu `buildImageFilename({ entityName, field, index, originalName, mimeType })` + chuẩn hoá slug tiếng Việt.

- **Sửa:** `lib/image/uploadPipeline.ts`  
  Vai trò: chuẩn bị file trước upload.  
  Thay đổi: nhận thêm naming context tùy chọn để gọi rule mới, fallback an toàn cho luồng cũ.

### UI (/admin uploader)
- **Sửa:** `app/admin/components/ImageUploader.tsx`  
  Vai trò: uploader dùng nhiều module.  
  Thay đổi: thêm optional props naming context (`entityName`, `field`, `index`) và truyền vào pipeline.

- **Sửa:** `app/admin/components/ImageUpload.tsx`  
  Vai trò: uploader ảnh đơn (product, variant...).  
  Thay đổi: dùng chung naming context thay vì tên mặc định ngẫu nhiên.

- **Sửa:** `app/admin/components/MultiImageUploader.tsx`  
  Vai trò: uploader nhiều ảnh.  
  Thay đổi: tự tính `index` theo item và đẩy naming context đồng bộ.

- **Sửa:** `app/admin/components/SettingsImageUploader.tsx`  
  Vai trò: upload ảnh trong settings/home component settings.  
  Thay đổi: thêm naming context (nếu có) và fallback chuẩn.

- **Sửa:** `app/admin/components/ImageFieldWithUpload.tsx`  
  Vai trò: field ảnh kèm upload/url mode.  
  Thay đổi: áp naming context cho upload mode.

- **Sửa:** `app/admin/components/LexicalEditor.tsx`  
  Vai trò: upload ảnh trong rich text.  
  Thay đổi: map naming context kiểu `entity=post|product`, `field=content`, `index=auto`.

- **Sửa:** `app/admin/media/page.tsx`  
  Vai trò: upload media trực tiếp từ thư viện.  
  Thay đổi: đặt naming context mặc định có ý nghĩa (`media-anh-upload-{index}` theo rule).

- **Sửa:** `app/admin/home-components/create/clients/page.tsx`  
  Vai trò: flow upload logo clients (đang bypass pipeline).  
  Thay đổi: chuyển sang `prepareImageForUpload` + naming context chuẩn.

- **Sửa:** `app/admin/home-components/clients/[id]/edit/page.tsx`  
  Vai trò: edit clients upload logo.  
  Thay đổi: đồng bộ như create.

- **Sửa:** `app/admin/home-components/team/_components/TeamForm.tsx`  
  Vai trò: avatar upload custom.  
  Thay đổi: bỏ slugify cục bộ, dùng pipeline + naming rule chung.

### Server (nhẹ)
- **Có thể không cần sửa:** `convex/storage.ts`  
  Vai trò: save image metadata.  
  Thay đổi dự kiến: giữ nguyên API; client gửi filename đã chuẩn hoá.

## Execution Preview
1. Tạo shared naming util và contract context.
2. Mở rộng `prepareImageForUpload` để nhận naming context.
3. Refactor các uploader core trong `app/admin/components/*` sang context mới.
4. Refactor các flow custom còn bypass (`clients create/edit`, `team form`).
5. Review tĩnh toàn bộ call-sites để đảm bảo không vỡ typing/null-safety/backward compatibility.
6. Chạy `bunx tsc --noEmit` trước commit (không chạy lint/unit theo guideline repo).

## Acceptance Criteria
- Mọi upload mới qua `/admin` lưu `filename` theo rule: `{ten-thuc-the}-anh-{field}-{index}`.
- Không còn nơi nào dùng trực tiếp `file.name` khi `saveImage` cho các flow upload ảnh trong scope.
- Không đổi hành vi URL hiện tại (Convex URL vẫn hoạt động như cũ).
- Các màn hình upload chính vẫn hoạt động với cùng UX (upload/preview/remove).

## Verification Plan
- **Static verify:** rà toàn bộ call-site `saveImage({ filename: ... })` trong `app/admin` để xác nhận đi qua rule mới.
- **Typecheck:** chạy `bunx tsc --noEmit` sau khi code xong.
- **Manual repro checklist (tester):** upload ảnh ở Products, Posts, Home Components (Clients/Team), Media Library; kiểm tra filename hiển thị trong Media list đã đúng format.

## Out of Scope
- Không migration/rename ảnh cũ đã lưu trước đây.
- Không xây URL alias public SEO-friendly trong phase này.
- Không can thiệp các ô nhập URL tay (vì bạn chọn “chỉ upload mới”).

## Risk / Rollback
- **Risk thấp:** đổi chủ yếu ở tầng naming/pipeline, không đổi schema.
- **Rollback nhanh:** revert commit là về behavior cũ ngay, vì không có migration dữ liệu.

Nếu bạn duyệt spec này, mình sẽ implement đúng phạm vi trên, rồi commit (không push).