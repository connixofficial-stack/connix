# Spec: Thêm Comments & Rating vào Product Detail Experience

## Tham khảo từ Posts-Detail (đã có sẵn)
Posts-detail đã implement pattern hoàn chỉnh với:
- `showComments`, `showCommentLikes`, `showCommentReplies` trong config
- `CommentsPreview` component (compact style, avatar nhỏ, 1-2 dòng)
- `ModuleFeatureStatus` hiển thị trạng thái module

---

## Kế hoạch Implementation (theo pattern posts-detail)

### 1. Cập nhật Config Types
```typescript
// Thêm vào mỗi layout config (classic/modern/minimal)
type ClassicLayoutConfig = {
  // ... existing
  showComments: boolean;        // Hiển thị section comments
  showCommentLikes: boolean;    // Nút thích comment
  showCommentReplies: boolean;  // Nút trả lời comment
};
```

### 2. Cập nhật Experience Editor (`/system/experiences/product-detail`)

**a) Thêm queries:**
```typescript
const commentsLikesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableLikes', moduleKey: 'comments' });
const commentsRepliesFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableReplies', moduleKey: 'comments' });
```

**b) Thêm ControlCard "Bình luận":** (copy từ posts-detail)
```tsx
<ControlCard title="Bình luận">
  <ToggleRow label="Hiển thị bình luận" checked={showComments} ... />
  <ToggleRow label="Nút thích" checked={showCommentLikes} ... />
  <ToggleRow label="Nút trả lời" checked={showCommentReplies} ... />
  <ModuleFeatureStatus label="Module bình luận" enabled={commentsModule?.enabled} ... />
  <ModuleFeatureStatus label="Tính năng thích" enabled={commentsLikesFeature?.enabled} ... />
  <ModuleFeatureStatus label="Tính năng trả lời" enabled={commentsRepliesFeature?.enabled} ... />
</ControlCard>
```

### 3. Cập nhật ProductDetailPreview

**a) Thêm props:**
```typescript
type ProductDetailPreviewProps = {
  // ... existing
  showComments?: boolean;
  showCommentLikes?: boolean;
  showCommentReplies?: boolean;
};
```

**b) Thêm section sau product info (trong cả 3 layouts):**
```tsx
// Sử dụng CommentsPreview component có sẵn từ DetailPreview.tsx
<CommentsPreview
  showComments={showComments}
  showLikes={showCommentLikes}
  showReplies={showCommentReplies}
  brandColor={brandColor}
/>
```

### 4. Tích hợp Site thật (`/products/[slug]`)

**a) Fetch experience config:**
```typescript
const experienceConfig = useQuery(api.settings.getByKey, { key: 'product_detail_ui' });
```

**b) Fetch comments cho product:**
```typescript
const comments = useQuery(api.comments.listByTarget, {
  targetType: 'product',
  targetId: product._id,
  status: 'Approved',
  paginationOpts: { numItems: 5, cursor: null }
});
```

**c) Render ProductCommentsSection:**
```tsx
{experienceConfig?.showComments && commentsModule?.enabled && (
  <ProductCommentsSection
    comments={comments}
    showLikes={experienceConfig.showCommentLikes && likesFeature?.enabled}
    showReplies={experienceConfig.showCommentReplies && repliesFeature?.enabled}
  />
)}
```

---

## Files cần sửa

| File | Action |
|------|--------|
| `app/system/experiences/product-detail/page.tsx` | Thêm config + ControlCard Bình luận |
| `components/experiences/previews/ProductDetailPreview.tsx` | Thêm CommentsPreview section |
| `app/(site)/products/[slug]/page.tsx` | Integrate comments section |

---

## Ưu điểm của approach này
1. **DRY** - Reuse `CommentsPreview` component từ DetailPreview.tsx
2. **Consistent** - Giống hệt pattern posts-detail đã hoạt động tốt
3. **1-way dependency** - Experience phụ thuộc Module (đúng skill pattern)
4. **Full integration** - Preview + Site thật với fetch API

---

## Estimated: ~2-3h (vì reuse nhiều code từ posts-detail)