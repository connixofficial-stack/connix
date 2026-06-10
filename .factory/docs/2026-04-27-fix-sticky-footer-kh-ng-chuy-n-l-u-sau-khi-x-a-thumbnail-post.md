# I. Primer

## 1. TL;DR kiểu Feynman

- Lần fix trước đã làm DB xóa thumbnail thành công (`thumbnail: thumbnail ?? ''`).
- Bug còn lại nằm ở **dirty check (kiểm tra còn thay đổi hay không)**, không nằm ở DB nữa.
- Khi xóa thumbnail, state hiện tại có `thumbnailStorageId = undefined`.
- Sau khi lưu, code tự set snapshot đã lưu có `thumbnailStorageId = null`.
- `undefined !== null`, nên `hasChanges` vẫn `true` → nút vẫn hiện “Lưu thay đổi”.
- F5 lại thì data load từ DB có `thumbnailStorageId = null/empty`, snapshot và current state khớp lại → nút mới thành “Đã lưu”.

## 2. Elaboration & Self-Explanation

Luồng hiện tại sau khi đã sửa lưu thumbnail:

1. Ban đầu post có ảnh → footer “Đã lưu”.
2. Xóa ảnh → `ImageUploader` gọi `onChange(undefined, undefined)`.
3. `currentSnapshot.thumbnail = ''`, `currentSnapshot.thumbnailStorageId = undefined`.
4. Bấm lưu → mutation xóa ảnh OK.
5. Sau mutation, `persistedSnapshot.thumbnail = ''`, `persistedSnapshot.thumbnailStorageId = null`.
6. Code gán `initialSnapshotRef.current = persistedSnapshot`.
7. Nhưng `currentSnapshot.thumbnailStorageId` vẫn là `undefined`, vì state `thumbnailStorageId` chưa đổi sang `null` và `currentSnapshot` đang lấy raw `thumbnailStorageId`.
8. So sánh JSON: `null` khác `undefined`/missing key → `hasChanges = true`.
9. Button label dùng `saveStatus === 'saved' && !hasChanges ? 'Đã lưu' : 'Lưu thay đổi'`, nên vì `hasChanges` vẫn true → vẫn hiện “Lưu thay đổi”.

Cần normalize cùng một kiểu dữ liệu cho snapshot: nếu không có thumbnail thì `thumbnailStorageId` phải luôn là `null`, không lúc `undefined` lúc `null`.

## 3. Concrete Examples & Analogies

Ví dụ sau khi xóa ảnh:

```ts
currentSnapshot = {
  thumbnail: '',
  thumbnailStorageId: undefined,
}

persistedSnapshot = {
  thumbnail: '',
  thumbnailStorageId: null,
}
```

Hai object nhìn giống về mặt business (“không có ảnh”), nhưng JSON comparison vẫn coi là khác.

Analogy: Một form hỏi “có ảnh không?”, `undefined` giống “chưa trả lời”, `null` giống “không có ảnh”. Người dùng thấy cả hai đều là không có ảnh, nhưng máy so sánh strict thì khác nhau.

# II. Audit Summary (Tóm tắt kiểm tra)

- `app/admin/posts/[id]/edit/page.tsx:114-116`: `currentSnapshot` normalize `thumbnail` thành `''`, nhưng `thumbnailStorageId` đang lấy raw value.
- `app/admin/posts/[id]/edit/page.tsx:243-244`: payload save hiện đã đúng: `thumbnail: thumbnail ?? ''`, `thumbnailStorageId: thumbnail ? (...) : null`.
- `app/admin/posts/[id]/edit/page.tsx:257-258`: `persistedSnapshot` normalize `thumbnailStorageId` thành `null` khi không còn thumbnail.
- `app/admin/posts/[id]/edit/page.tsx:119-122`: `hasChanges` dùng `JSON.stringify(initialSnapshotRef.current) !== JSON.stringify(currentSnapshot)` nên `null`/`undefined` lệch là đủ làm nút vẫn dirty.
- `app/admin/posts/[id]/edit/page.tsx:539-543`: button label phụ thuộc `saveStatus === 'saved' && !hasChanges`; vì `hasChanges` vẫn true nên không hiện “Đã lưu”.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

**Root Cause Confidence: High (95%)**

Nguyên nhân gốc là mismatch `thumbnailStorageId` giữa `currentSnapshot` và `persistedSnapshot` sau save:

- Current: `undefined`
- Persisted: `null`

Vì so sánh bằng JSON toàn object, mismatch này làm `hasChanges` không về `false`.

**Giả thuyết đối chứng:**

- “Sticky footer component sai” → Không phải chính. File `HomeComponentStickyFooter` chỉ render children; button thật nằm trong page edit.
- “Mutation chưa save xong” → Không phải theo mô tả mới: xóa ảnh đã thành công, F5 ảnh mất.
- “saveStatus không set saved” → Code có `setSaveStatus('saved')`; nhưng label vẫn phụ thuộc thêm `!hasChanges`.
- “thumbnail vẫn khác” → Không phải chính sau fix trước, vì cả current/persisted đều dùng `thumbnail ?? ''`.

# IV. Proposal (Đề xuất)

Sửa tối thiểu trong `currentSnapshot` để normalize `thumbnailStorageId` giống persisted snapshot:

```ts
thumbnailStorageId: thumbnail ? (thumbnailStorageId ?? null) : null,
```

Thay cho:

```ts
thumbnailStorageId,
```

Có thể cân nhắc thêm normalize snapshot initial lúc load DB để thống nhất:

```ts
thumbnailStorageId: postData.thumbnail
  ? ((postData as { thumbnailStorageId?: Id<'_storage'> }).thumbnailStorageId ?? null)
  : null,
```

Nhưng để thay đổi nhỏ, trọng tâm là `currentSnapshot` vì `persistedSnapshot` đã normalize đúng.

# V. Files Impacted (Tệp bị ảnh hưởng)

- `app/admin/posts/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit post, quản lý form state, dirty check, submit mutation và button footer.
  - Sửa: normalize `currentSnapshot.thumbnailStorageId` theo cùng logic với payload/persisted snapshot.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại vùng `currentSnapshot` để đảm bảo file external change không làm lệch context.
2. Sửa `thumbnailStorageId` trong `currentSnapshot` từ raw value sang normalized value.
3. Review tĩnh các case:
   - Có thumbnail + storage id → giữ id.
   - Có thumbnail nhưng không có storage id legacy → `null`.
   - Không có thumbnail → `null`.
4. Commit theo rule repo nếu được duyệt.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Tự review tĩnh vì project instruction cấm tự chạy lint/unit test.
- Nếu có thay đổi TS và trước commit theo rule repo: chạy `bunx tsc --noEmit`.
- Manual QA đề xuất cho tester:
  1. Vào post có thumbnail → footer “Đã lưu”.
  2. Xóa thumbnail → footer “Lưu thay đổi”.
  3. Bấm lưu → toast success, ảnh mất, footer phải chuyển “Đã lưu” ngay, không cần F5.
  4. F5 lại → ảnh vẫn mất, footer vẫn “Đã lưu”.
  5. Upload ảnh mới → lưu → footer “Đã lưu”, F5 ảnh vẫn còn.

# VIII. Todo

1. Sửa normalize `currentSnapshot.thumbnailStorageId` trong `app/admin/posts/[id]/edit/page.tsx`.
2. Review tĩnh dirty-check sau save.
3. Commit thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Sau khi xóa thumbnail và bấm “Lưu thay đổi”, nút chuyển thành “Đã lưu” ngay.
- Không cần F5 để footer hết dirty state.
- Refresh trang vẫn giữ trạng thái không có thumbnail.
- Upload thumbnail mới vẫn lưu bình thường.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp: chỉ normalize giá trị snapshot cho field `thumbnailStorageId`.
- Không đổi API, không đổi schema, không đổi mutation behavior.
- Rollback: revert commit/chỉnh lại một dòng trong `currentSnapshot`.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor toàn bộ dirty-check sang deep equal custom.
- Không mở rộng sang services/products dù pattern có thể tương tự.
- Không chỉnh shared `HomeComponentStickyFooter` vì bug nằm ở dữ liệu `hasChanges` của page edit post.