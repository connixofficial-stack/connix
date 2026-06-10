
# I. Primer

## 1. TL;DR kiểu Feynman

- Khi xóa thumbnail, `ImageUploader.handleRemove` gọi `onChange(undefined, undefined)` → state `thumbnail = undefined`, `thumbnailStorageId = undefined`.
- **Vấn đề 1 (Root cause chính):** `handleSubmit` gửi `thumbnail: thumbnail || undefined` (dòng 243). Khi `thumbnail = undefined`, giá trị gửi lên là `thumbnail: undefined`. Convex validator `v.optional(v.string())` hiểu `undefined` = "không gửi field này" = **giữ nguyên giá trị cũ**. Tức là mutation **không xóa thumbnail** vì nó không thấy field `thumbnail` trong payload.
- **Vấn đề 2 (hasChanges check):** `currentSnapshot` dùng `thumbnail: thumbnail ?? ''` (dòng 114). Khi xóa ảnh: `thumbnail = undefined` → snapshot = `''`. Snapshot ban đầu từ DB: `thumbnail: postData.thumbnail ?? ''` = `'https://...'`. Hai giá trị khác nhau → `hasChanges = true` → **nút Lưu vẫn bật đúng**. Phần này KHÔNG bị lỗi.
- **Vấn đề 3 (Snapshot sau save):** Sau khi gọi mutation thành công, `persistedSnapshot.thumbnail = thumbnail ?? '' = ''`. Nhưng vì mutation thực tế KHÔNG xóa thumbnail trong DB, nên lần sau Convex reactive query trả về `postData.thumbnail = 'https://...'` (vẫn còn). Tuy nhiên `isDataLoaded = true` nên useEffect load data **không chạy lại** → snapshot và state không bị đè → nút footer hiện "Đã lưu" (vì `initialSnapshotRef.current` đã được cập nhật thành `persistedSnapshot` với `thumbnail: ''`). **Nhưng F5 lại thì ảnh quay về vì DB chưa bao giờ bị xóa.**
- **Tóm lại:** Mutation gửi `thumbnail: undefined` khi muốn xóa → Convex skip field đó → DB không đổi.

## 2. Elaboration & Self-Explanation

Luồng hiện tại khi user xóa thumbnail và ấn "Lưu thay đổi":

1. User click xóa ảnh → `ImageUploader.handleRemove()` gọi `onChange(undefined, undefined)`
2. State: `thumbnail = undefined`, `thumbnailStorageId = undefined`
3. User click "Lưu thay đổi" → `handleSubmit` chạy
4. Payload gửi mutation: `{ ..., thumbnail: undefined, thumbnailStorageId: null }`
5. Convex mutation nhận args → `thumbnail` là `undefined` → Convex coi như "không gửi" → `PostsModel.update` destructure `{ id, publishImmediately, ...updates }` → `updates` không có key `thumbnail` → `ctx.db.patch(id, updates)` không patch gì cho thumbnail
6. Toast "Cập nhật thành công" vẫn hiện vì mutation không throw lỗi
7. DB vẫn giữ thumbnail cũ

Cách sửa: Khi user xóa thumbnail (state `thumbnail = undefined`), cần gửi `thumbnail: ""` (empty string) thay vì `undefined` để Convex thực sự patch field đó thành empty string. Đồng thời ở Convex model cần xử lý empty string → `undefined` (xóa field).

## 3. Concrete Examples & Analogies

**Ví dụ cụ thể:**
- Post "Chính sách thanh toán" có `thumbnail: "https://cdn.convex.cloud/xxx.jpg"`
- User xóa ảnh → state `thumbnail = undefined`
- `handleSubmit` tạo payload: `{ thumbnail: thumbnail || undefined }` = `{ thumbnail: undefined || undefined }` = `{ thumbnail: undefined }`
- Tương đương gửi `updatePost({ id, content, slug, ... })` mà KHÔNG có field `thumbnail` → DB giữ nguyên

**Analogy:** Giống như bạn gửi form cập nhật hồ sơ nhân viên nhưng bỏ trống ô "Ảnh đại diện" — hệ thống hiểu là "không muốn đổi ảnh" chứ không phải "muốn xóa ảnh". Muốn xóa phải gửi tín hiệu rõ ràng (ví dụ: gửi ô trống với giá trị `""` hoặc `null`).

# II. Audit Summary (Tóm tắt kiểm tra)

| Mục | Vị trí | Kết quả |
|---|---|---|
| ImageUploader.handleRemove | `app/admin/components/ImageUploader.tsx:118-127` | Gọi `onChange(undefined, undefined)` — **OK** |
| State thumbnail sau xóa | `edit/page.tsx:508-509` | `thumbnail = undefined`, `thumbnailStorageId = undefined` — **OK** |
| currentSnapshot.thumbnail | `edit/page.tsx:114` | `thumbnail ?? '' = ''` — **OK** (khác snapshot ban đầu) |
| hasChanges | `edit/page.tsx:119-122` | Trả `true` khi xóa ảnh — **OK** |
| handleSubmit payload | `edit/page.tsx:243` | `thumbnail: thumbnail \|\| undefined` → gửi `undefined` — **BUG** |
| handleSubmit thumbnailStorageId | `edit/page.tsx:244` | `thumbnail ? (thumbnailStorageId ?? null) : null` → gửi `null` — **OK** |
| Convex update validator | `convex/posts.ts:705` | `thumbnail: v.optional(v.string())` — `undefined` = skip field — **ROOT CAUSE** |
| PostsModel.update | `convex/model/posts.ts:247-248` | Destructure `...updates` → chỉ patch fields có mặt — **Đúng thiết kế** |

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

**Root Cause — Confidence: High (95%)**

`edit/page.tsx:243`: `thumbnail: thumbnail || undefined` — khi `thumbnail` là `undefined` hoặc `""`, kết quả luôn là `undefined`. Convex skip field `undefined` trong args, nên `ctx.db.patch` không touch field `thumbnail` trong DB.

**Counter-Hypothesis đã loại:**

1. **"ImageUploader không gọi onChange khi xóa"** → Sai. Code rõ ràng gọi `onChange(undefined, undefined)` ở dòng 125.
2. **"hasChanges trả false khi xóa ảnh"** → Sai. `currentSnapshot.thumbnail = ''` vs `initialSnapshot.thumbnail = 'https://...'` → khác → `hasChanges = true`.
3. **"Mutation throw error nhưng bị nuốt"** → Sai. Mutation nhận payload hợp lệ (thiếu field `thumbnail` = OK theo `v.optional`), chạy thành công, chỉ là không xóa.
4. **"Reactive query đè state sau save"** → Sai. `isDataLoaded = true` chặn useEffect load lại.

# IV. Proposal (Đề xuất)

**Sửa 1 dòng tại `edit/page.tsx:243`:**

```typescript
// Trước (BUG):
thumbnail: thumbnail || undefined,

// Sau (FIX):
thumbnail: thumbnail ?? '',
```

Khi `thumbnail = undefined` (đã xóa), gửi `thumbnail: ''` (empty string) → Convex nhận `v.optional(v.string())` với string rỗng → `ctx.db.patch(id, { thumbnail: '' })` → DB cập nhật field, xóa ảnh.

**Kiểm tra Convex model:** `PostsModel.update` ở `convex/model/posts.ts:247` destructure `...updates` và patch trực tiếp. Nếu `thumbnail: ''` được gửi, nó sẽ patch `thumbnail: ''` vào DB. Khi query lại, `postData.thumbnail = ''` → `setThumbnail('')` → `preview = ''` trong ImageUploader → hiện empty state. **Đúng hành vi mong muốn.**

# V. Files Impacted (Tệp bị ảnh hưởng)

| File | Vai trò | Thay đổi |
|---|---|---|
| `app/admin/posts/[id]/edit/page.tsx` | Trang edit bài viết, quản lý state và gọi mutation | **Sửa:** dòng 243 đổi `thumbnail: thumbnail \|\| undefined` → `thumbnail: thumbnail ?? ''` |

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại `edit/page.tsx` dòng 243 để xác nhận vị trí chính xác
2. Sửa `thumbnail: thumbnail || undefined` → `thumbnail: thumbnail ?? ''`
3. Review tĩnh: kiểm tra `persistedSnapshot` (dòng 257) đã dùng `thumbnail ?? ''` → nhất quán
4. Kiểm tra `thumbnailStorageId` logic (dòng 244) — đã dùng `thumbnail ?` guard nên `thumbnail = undefined` → gửi `null` — **cần sửa thêm**: khi `thumbnail = ''` (sau fix), `'' ? ... : null` → falsy → gửi `null` → **OK**

# VII. Verification Plan (Kế hoạch kiểm chứng)

1. **Typecheck:** `bunx tsc --noEmit` — string rỗng `''` compatible với `v.optional(v.string())`
2. **Test thủ công:**
   - Mở post có thumbnail → xóa ảnh → Lưu → refresh: ảnh phải biến mất
   - Mở post có thumbnail → lưu không đổi gì: nút phải hiện "Đã lưu"
   - Mở post không có thumbnail → upload ảnh → Lưu → refresh: ảnh phải còn
   - Mở post có thumbnail → xóa → upload ảnh mới → Lưu → refresh: ảnh mới hiện

# VIII. Todo

1. Sửa dòng 243 trong `app/admin/posts/[id]/edit/page.tsx`
2. Chạy `bunx tsc --noEmit` verify typing
3. Commit

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Xóa thumbnail + Lưu → DB field `thumbnail` = `''` hoặc empty
- F5 lại: ảnh không quay về
- Toast "Cập nhật thành công" chỉ hiện khi data thực sự được persist
- Nút "Lưu thay đổi" chuyển sang "Đã lưu" sau khi save thành công
- Upload ảnh mới + Lưu vẫn hoạt động bình thường

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Rất thấp. Chỉ sửa 1 dòng, thay `||` bằng `??`, ảnh hưởng duy nhất là case xóa ảnh.
- **Rollback:** Revert commit duy nhất.
- **Side effect:** Các post hiện tại có `thumbnail: ''` sẽ render như không có ảnh — đây cũng là hành vi đúng (hiện tại code ImageUploader đã xử lý `value = ''` → hiện empty state vì `useEffect` set `preview = value`).

# XI. Out of Scope (Ngoài phạm vi)

- Services/Products edit pages cũng có pattern tương tự — chưa kiểm tra, nhưng có thể cùng bug. Chỉ fix posts theo yêu cầu.
- Không refactor `PostsModel.update` để normalize `''` → `undefined` ở DB level — hiện tại `''` đủ để hoạt động.
