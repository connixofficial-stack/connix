## Tổng quan

Refactor `/system/experiences/posts-detail` để:
1. **Tags** có tính năng thực (toggle ẩn/hiện + hiển thị trên frontend)
2. **Comments** chuyển từ 2-way sync sang 1-way dependency (như Variants)
3. **Config panel** UX/UI redesign 4 cột logic hơn

---

## Phần 1: Tags - Thêm tính năng thực

### 1.1 Experience Editor
- Thêm toggle `showTags` vào config (mỗi layout)
- Preview hiển thị mock tags khi bật

### 1.2 Frontend `/posts/[slug]`
- Query tags của bài viết (nếu module feature bật + experience showTags bật)
- Hiển thị tags dạng badge dưới title/category

### 1.3 Preview Component
- Thêm prop `showTags` + mock tags UI

---

## Phần 2: Comments - Chuyển sang 1-way

### Hiện tại (2-way - SẼ BỎ)
```
Toggle showComments → sync toggleModule('comments')
Toggle showLikes → sync toggleFeature('enableLikes')
→ Hiện "Bấm Lưu để đồng bộ modules"
```

### Sau refactor (1-way)
```
Toggle showComments (experience only) - ẩn/hiện UI
Status read-only từ Module Comments - link đến /system/modules/comments
```

**Thay đổi:**
- Bỏ `toggleModule`, `toggleFeature` trong handleSave
- Bỏ các biến `isCommentsSyncPending`, `isCommentLikesSyncPending`...
- Bỏ thông báo "Bấm Lưu để đồng bộ modules"
- Thêm `ModuleFeatureStatus` cho Comments (like Variants pattern)

---

## Phần 3: Config Panel UX Redesign (4 cột)

### Cột 1: "Hiển thị nội dung"
- Thông tin tác giả (toggle)
- Tags (toggle) - **NEW**
- Nút chia sẻ (toggle)
- Bài viết liên quan (toggle)

### Cột 2: "Bình luận" 
- Hiển thị bình luận (toggle) - **chỉ ẩn/hiện, không sync**
- Nút thích (toggle) - **chỉ ẩn/hiện**
- Nút trả lời (toggle) - **chỉ ẩn/hiện**
- Status: Module Comments (read-only, link) - **NEW**
- Status: Feature Likes (read-only, link) - **NEW**
- Status: Feature Replies (read-only, link) - **NEW**

### Cột 3: "Trạng thái Module"
- Tags (từ posts module) - read-only
- Nổi bật (từ posts module) - read-only
- Hẹn giờ (từ posts module) - read-only

### Cột 4: "Liên kết & Gợi ý"
- Link xem bài viết mẫu
- Hints

---

## Files thay đổi

| File | Thay đổi |
|------|----------|
| `app/system/experiences/posts-detail/page.tsx` | Refactor comments 1-way, thêm showTags, redesign 4 cột |
| `components/experiences/previews/DetailPreview.tsx` | Thêm prop showTags + mock tags UI |
| `app/(site)/posts/[slug]/page.tsx` | Hiển thị tags khi config bật |
| `lib/experiences/useSiteConfig.ts` | Thêm showTags vào PostsDetailConfig |

---

## Ước tính
- **~150-200 dòng code thay đổi**
- Không ảnh hưởng data/backend
- Giữ backward compatibility với config cũ