---
name: file-lifecycle-service
description: Chuẩn hóa File Lifecycle Service (FLS) cho VietAdmin: quản lý vòng đời file từ draft upload, commit vào business record, sync fileReferences, cleanup khi bỏ/đổi/xóa, xử lý legacy URL-only và orphan media. Dùng khi user nhắc FLS, File Lifecycle Service, upload file, draft upload, cleanup media, xóa ảnh, đổi file, orphan storage, hoặc áp dụng lifecycle file cho module/home-component mới.
---

# File Lifecycle Service (FLS)

Skill này là playbook chuẩn để áp dụng **File Lifecycle Service (FLS)** trong VietAdmin. Mục tiêu là không để mỗi module tự viết observer/xóa file rời rạc, mà đưa file về một vòng đời thống nhất:

```text
draft upload → commit vào business record → sync source of truth → cleanup khi bỏ/đổi/xóa
```

## Khi nào sử dụng

- User nói `FLS`, `File Lifecycle Service`, `file lifecycle`, `draft upload`, `cleanup file`, `cleanup media`, `orphan storage`.
- Làm module/home-component có upload ảnh/video/file lên Convex Storage.
- Fix bug xóa record/đổi ảnh/xóa slide nhưng `/admin/media` vẫn còn file.
- Refactor logic file đang rải ở nhiều nơi như `storage.delete`, `deleteImage`, `cleanupStorageIfUnreferenced`.
- Cần xử lý dữ liệu legacy chỉ có URL, chưa có `storageId`.

## Core contract

Một file trong hệ thống phải thuộc đúng 1 trong 4 trạng thái:

1. `draft`: file đã upload lên Convex Storage nhưng chưa lưu vào business record.
2. `committed`: file đã được business record sử dụng và có source-of-truth reference.
3. `detached`: file vừa bị bỏ khỏi business record khi update/delete.
4. `cleaned`: storage object + `images` record đã được xóa an toàn.

## Source of truth bắt buộc

FLS phải có **1 source of truth ở server**. UI/admin page chỉ upload và truyền `storageId`; business mutation chỉ gọi service chuẩn; quyết định file nào được giữ/xóa nằm ở `fileReferences` + `fileDraftUploads` + helper FLS.

### Backend

- `convex/lib/fileService.ts`
  - `syncOwnerFileReferences`
  - `removeOwnerFileReferences`
  - `hasFileReferences`
  - `listFileUsagesByStorageId`
  - `removeFileReferencesForStorage`
- `convex/schema.ts`
  - `fileReferences`: source of truth cho file đã commit.
  - `fileDraftUploads`: source of truth cho file upload nháp.
- `convex/fileLifecycle.ts`
  - `registerDraftUpload`
  - `commitDraftUploads`
  - `cleanupDraftUploads`
  - `cleanupExpiredDraftUploads`
- `convex/storage.ts`
  - `cleanupStorageIfUnreferenced` là cổng xóa an toàn, không xóa nếu file còn reference.

### Frontend

- `app/admin/components/MultiImageUploader.tsx`
  - phải trả về `storageId` sau upload.
  - với business record đã lưu, ưu tiên `deleteMode="defer"` để server quyết định cleanup.
  - dùng `onUploadComplete` để register draft upload.
- Hook chuẩn:
  - `app/admin/home-components/_shared/hooks/useDraftFileCleanup.ts`
  - `app/admin/components/useFileDraftUploads.ts`

## Boundary bắt buộc để file gọn

### Admin UI

- Page/form trong `/admin/products`, `/admin/posts`, `/admin/services`, `/admin/settings` chỉ quản lý UI state và submit payload.
- Upload component phải trả đủ `{ url, storageId, folder }`; không chỉ trả URL nếu file do Convex Storage quản lý.
- UI không gọi `deleteImage`, `ctx.storage.delete`, cleanup bằng URL, hoặc tự scan `/admin/media` cho business record đã lưu.
- Với record đã lưu, dùng `deleteMode="defer"` để server observer/service quyết định cleanup sau khi save thành công.
- Draft upload chỉ đi qua hook dùng chung (`useFileDraftUploads` hoặc hook wrapper tương đương), tránh copy logic register/cleanup vào từng page.

### Convex business module

- Mutation `create/update/remove` chỉ làm 4 việc liên quan file:
  1. collect `previousStorageIds` từ record cũ;
  2. collect `nextStorageIds` từ payload/record mới;
  3. gọi `syncOwnerFileReferences` hoặc `removeOwnerFileReferences`;
  4. gọi `api.storage.cleanupStorageIfUnreferenced` cho `removedStorageIds`.
- Không viết observer cleanup riêng rải rác trong `products.ts`, `posts.ts`, `services.ts`, `settings.ts`, `productImageFrames.ts`.
- Nếu logic collect phức tạp, tách helper nhỏ trong server/lib, ví dụ `collectProductStorageIds`, `collectPostStorageIds`, `collectSettingImageStorageIds`.
- `fileReferences` là source of truth cho file đã commit; không dựa vào URL string để quyết định xóa.

## Contract cho Products / Posts / Services

Khi user nói áp dụng FLS cho module sản phẩm, bài viết, dịch vụ thì hiểu là toàn bộ route:

- `/admin/products`
- `/admin/posts`
- `/admin/services`

và các Convex mutation tương ứng:

- `convex/products.ts`
- `convex/posts.ts`
- `convex/services.ts`

Mapping mặc định:

| Module | ownerTable | ownerField | purpose | Source fields |
| --- | --- | --- | --- | --- |
| Products | `products` | `images` | `product-gallery` | `imageStorageId`, `imageStorageIds` |
| Posts | `posts` | `thumbnail` | `post-thumbnail` | `thumbnailStorageId` |
| Services | `services` | `thumbnail` | `service-thumbnail` | `thumbnailStorageId` |

Template mutation:

```ts
const previousStorageIds = collectPreviousStorageIds(previousRecord);
const nextStorageIds = collectNextStorageIds(nextPayloadOrRecord);

const { removedStorageIds } = await syncOwnerFileReferences(ctx, {
  ownerTable: "products",
  ownerId: id,
  ownerField: "images",
  purpose: "product-gallery",
}, nextStorageIds, {
  previousStorageIds,
});

await Promise.all(removedStorageIds.map(storageId =>
  ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
));
```

Delete template:

```ts
const { removedStorageIds } = await removeOwnerFileReferences(ctx, {
  ownerTable: "products",
  ownerId: id,
}, {
  previousStorageIds: collectPreviousStorageIds(record),
});

await ctx.db.delete(id);
await Promise.all(removedStorageIds.map(storageId =>
  ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
));
```

## Contract cho Admin Settings

Khi user nói áp dụng FLS cho setting/settings thì hiểu là toàn bộ route:

- `/admin/settings`
- `/admin/settings/general`
- `/admin/settings/seo`
- `/admin/settings/advanced`
- `/admin/settings/product-frames`

Các file/surface thường liên quan:

- `app/admin/settings/_components/SettingsPageShell.tsx`
- `app/admin/settings/_components/ProductFrameManager.tsx`
- `convex/settings.ts`
- `convex/productImageFrames.ts`
- `lib/modules/configs/settings.config.ts`

Mapping mặc định cho settings key-value:

| Setting surface | ownerTable | ownerId | ownerField | purpose | Source |
| --- | --- | --- | --- | --- | --- |
| General image settings | `settings` | setting key | `value` | `settings:<group>` | `site_logo`, `site_favicon` |
| SEO image settings | `settings` | setting key | `value` | `settings:seo` | `seo_og_image` |
| Advanced image settings | `settings` | setting key | `value` | `settings:advanced` | `product_image_placeholder` |
| Product frames | `productImageFrames` | frame id | `overlayImage` | `product-frame-overlay` | `overlayStorageId` |

Settings-specific rules:

- `SettingsImageUploader`/settings UI phải trả `storageId` lên mutation; nếu hiện chỉ trả URL thì phải nâng cấp trước khi claim FLS hoàn chỉnh.
- Không nhét cleanup logic vào `SettingsPageShell.tsx` hoặc `ProductFrameManager.tsx`; component chỉ gọi mutation settings/frame đã chuẩn hóa.
- Với `convex/settings.ts`, mutation save image setting phải resolve previous value + previous storage identity trước khi ghi value mới.
- Với `convex/productImageFrames.ts`, không để `overlayStorageId` luôn `null`; phải lưu storage identity thật cho overlay.
- Nếu settings hiện legacy URL-only, phải dùng legacy resolver để map URL → `storageId` best-effort trước khi cleanup.
- Nếu setting image bị clear hoặc đổi ảnh, server sync reference mới rồi cleanup `removedStorageIds`.

## Implementation workflow cho module mới

### 1. Audit current file surface

Trước khi code, xác định:

- Upload gọi mutation nào? Thường là:
  - `api.storage.generateUploadUrl`
  - `api.storage.saveImage`
- Business record lưu file ở đâu?
  - field `storageId`
  - array `storageIds`
  - config JSON có `{ image, storageId }`
  - legacy chỉ có URL
- Delete/update hiện đang xóa file ở đâu?
- `/admin/media` đọc từ `images` table nên cleanup phải xóa cả storage object và `images` record.

### 2. Persist storage identity

Khi save business record, config/record phải lưu `storageId` cạnh URL nếu file là Convex-managed:

```ts
slides: items.map(item => ({
  image: item.url,
  ...(item.storageId ? { storageId: item.storageId } : {}),
}))
```

Không chỉ lưu URL nếu muốn cleanup chính xác về sau.

### 3. Register draft upload

Khi upload xong nhưng chưa save record:

```ts
onUploadComplete={({ storageId, folder }) => trackUpload(storageId, folder)}
```

Hook phải:

- gọi `api.fileLifecycle.registerDraftUpload`
- cleanup best-effort khi unmount/route leave nếu chưa commit
- commit đúng list `storageId` còn nằm trong payload khi save thành công
- cleanup các draft đã upload nhưng bị user thay/xóa trước lúc save

### 4. Sync committed references trên server

Trong mutation `create/update/updateConfig`, sau khi record tồn tại:

```ts
await syncOwnerFileReferences(ctx, {
  ownerTable: "homeComponents",
  ownerId: id,
  ownerField: "config",
  purpose: "home-component-config",
}, nextStorageIds, {
  previousStorageIds,
});
```

Sau sync, mọi `removedStorageIds` phải đi qua:

```ts
ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
```

Không gọi `ctx.storage.delete` trực tiếp trong business module, trừ seed/reset có chủ đích rõ ràng.

Với products/posts/services/settings, không copy block lớn vào page admin. Nếu cần reuse, tạo helper server để module chỉ gọi 1 hàm kiểu:

```ts
await syncBusinessFileReferences(ctx, {
  ownerTable,
  ownerId,
  ownerField,
  purpose,
  previousStorageIds,
  nextStorageIds,
});
```

### 5. Remove owner references khi xóa record

Khi delete business record:

```ts
const { removedStorageIds } = await removeOwnerFileReferences(ctx, {
  ownerTable,
  ownerId,
}, { previousStorageIds });

await ctx.db.delete(ownerId);
await Promise.all(removedStorageIds.map(storageId =>
  ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId })
));
```

## Legacy URL-only handling

Legacy records thường chỉ có:

```ts
{ image: "https://.../api/storage/..." }
```

Khi update/delete, FLS phải resolve URL → `storageId` bằng cách:

1. Collect tất cả URL trong config cũ và mới.
2. Đọc `images` theo batch/limit.
3. So sánh `ctx.storage.getUrl(image.storageId)` với URL trong config.
4. Dùng storageId resolve được làm `previousStorageIds`/`nextStorageIds`.

Nếu không làm bước này, case xóa ảnh legacy sẽ fail: user xóa slide, save xong `/admin/media` vẫn còn ảnh.

Helper legacy nên nằm ở server/lib và dùng chung cho products/posts/services/settings, ví dụ:

```ts
const previousStorageIds = await resolveStorageIdsFromLegacyUrls(ctx, previousUrls, {
  folder,
  limit: 100,
});
```

Không để mỗi admin page tự resolve URL hoặc query `images`.

## Cleanup semantics

### Khi user upload nhưng thoát chưa save

- Client gọi `cleanupDraftUploads`.
- Cron `cleanupExpiredDraftUploads` dọn fallback nếu browser đóng/tab crash.

### Khi user đổi file

- File mới được register draft.
- Khi save:
  - file mới còn trong payload → commit.
  - file mới đã upload nhưng không còn trong payload → cleanup draft.
  - file cũ không còn trong business record → `cleanupStorageIfUnreferenced`.

### Khi user xóa record

- Remove all owner references.
- Cleanup từng `storageId` nếu không còn reference khác.

### Khi user xóa item trong form đã lưu

- Không xóa ngay ở client nếu file có thể đang referenced.
- Save config mới.
- Server so sánh previous vs next và cleanup an toàn.

## FLS Audit Matrix & Fail-Critical Rules

Để đảm bảo không bị rò rỉ hay làm rơi `storageId` trong toàn bộ vòng đời của file, Agent/Developer bắt buộc phải thực hiện kiểm tra chéo theo **FLS Audit Matrix** dưới đây:

### 1. FLS Audit Matrix

| Giai đoạn | Trách nhiệm | Checklist kiểm tra | Lỗi thường gặp |
| --- | --- | --- | --- |
| **1. Uploader** | Component Uploader | Trả về cả `url` và `storageId` khi upload xong. | Chỉ trả về URL: `onChange(result.url)` |
| **2. Callback Props** | Callback Handler trên UI | Nhận tham số `(url, storageId)` và lưu vào state item tương ứng. | Bỏ qua storageId: `onChange={(url) => ...}` |
| **3. Editor Type** | Type định nghĩa (TypeScript) | Khai báo thuộc tính `storageId?: string | null` trong interface của item. | Thiếu trường `storageId` trong type. |
| **4. Normalizer** | Hàm chuẩn hóa (constants/lib) | Đọc trường `storageId` từ database/config thô, xử lý fallback URL-only. | Bỏ qua không parse `storageId` khi map dữ liệu. |
| **5. Create/Edit Payload** | Hàm serialize / save payload | Truyền `storageId` vào payload gửi lên Convex mutation. | Strip bỏ `storageId` khi gửi payload lưu. |
| **6. Backend Sync** | Convex mutation handler | Gọi `syncOwnerFileReferences` và dọn dẹp các storageId bị xóa. | Quên không gọi cleanup khi update/delete config. |

### 2. Rule Fail-Critical

> [!CAUTION]
> **CRITICAL FAIL**: Bất kỳ hành động upload nào gọi `registerDraftUpload` hoặc hook `useFileDraftUploads` mà cấu trúc lưu trữ (config/payload) sau đó làm rơi hoặc không duy trì `storageId` đều được coi là một lỗi đặc biệt nghiêm trọng. Agent không được phép commit code nếu rơi vào trường hợp này.

### 3. Grep Checklist phát hiện nhanh "Mùi lỗi" (FLS Smells)

Trước khi bàn giao task có upload file, Agent bắt buộc phải chạy grep các pattern sau để phát hiện rủi ro:
- `onChange={(url)` -> Dấu hiệu callback uploader đang làm rơi storageId.
- `deleteImage` -> Dấu hiệu UI tự ý xóa file trực tiếp trước khi save config.
- `ctx.storage.delete` -> Dấu hiệu business mutation tự ý xóa file trực tiếp không qua safe cleanup gateway.
- `storageId: undefined` -> Dấu hiệu serializer đang cố tình strip bỏ định danh file.

## Verification checklist

Sau khi áp dụng FLS cho module/home-component, phải kiểm tra:

1. Upload file rồi thoát không save → file không còn trong `/admin/media` sau cleanup.
2. Upload nhiều file rồi chỉ save một phần → chỉ file được save còn lại.
3. Edit record, xóa 1 ảnh cũ rồi save → ảnh đó biến mất khỏi `/admin/media`.
4. Edit record, đổi ảnh cũ sang ảnh mới → ảnh cũ bị cleanup, ảnh mới còn.
5. Xóa record → file không còn nếu không được record khác dùng.
6. Legacy URL-only record → xóa ảnh rồi save vẫn cleanup được.
7. `bunx tsc --noEmit` pass.

Checklist riêng cho `/admin/products`, `/admin/posts`, `/admin/services`, `/admin/settings`:

1. Product: create/edit/delete với ảnh chính và gallery → `/admin/media` chỉ còn file đang được reference.
2. Post: create/edit/delete thumbnail → thumbnail cũ cleanup khi đổi/xóa.
3. Service: create/edit/delete thumbnail → thumbnail cũ cleanup khi đổi/xóa.
4. Settings general/seo/advanced: đổi hoặc clear image setting → file cũ cleanup nếu không còn reference.
5. Product frames: đổi/xóa overlay frame → `overlayStorageId` sync đúng và file cũ cleanup.
6. Legacy settings chỉ có URL → clear/replace không làm mất file đang được record khác dùng.

## Convex commands thường dùng

Đọc record:

```bash
bunx convex run homeComponents:getById '{"id":"<id>"}'
```

List media folder:

```bash
bunx convex run storage:listByFolder '{"folder":"hero-banners","limit":100}'
```

Cleanup orphan theo config home-components:

```bash
bunx convex run homeComponents:cleanupUnreferencedConfigMedia '{"folder":"hero-banners","batchSize":100}'
```

## Output khi bàn giao

Khi hoàn tất task liên quan FLS, báo ngắn gọn:

1. Module/component đã áp dụng FLS.
2. Flow đã cover: draft / commit / remove / replace / delete / legacy URL.
3. Functions đã dùng hoặc thêm.
4. Record/data thật đã chạm nếu có.
5. Verify đã chạy và kết quả.
6. Commit hash nếu có commit.
