## Refactor Experience Layout sang Vertical Scroll Pattern

### Mục tiêu
Thay đổi layout experiences từ **Header + Preview + Bottom Panel** sang **Scroll dọc** như home-components để dễ sử dụng hơn, không bị chật chội và tránh z-index issues.

### Layout mới (tham khảo home-components/edit)

```
┌─────────────────────────────────────────────────────────────┐
│  Chỉnh sửa Experience                                       │
│  ← Quay lại danh sách                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Card: Cấu hình chung                                │   │
│  │ - Title / tên experience                            │   │
│  │ - Các settings chung                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Card: Layout Settings (tuỳ theo từng experience)    │   │
│  │ - Toggles, selects, inputs...                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️ Preview   [Style tabs] [🖥️📱💻 Device Toggle]   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ ○ ○ ○  yoursite.com/posts                   │     │   │
│  │ ├─────────────────────────────────────────────┤     │   │
│  │ │                                             │     │   │
│  │ │        PREVIEW CONTENT                      │     │   │
│  │ │                                             │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  │                                                     │   │
│  │ Style: Full Width • Desktop (1280px)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [💾 Lưu thay đổi]  (fixed bottom hoặc sticky)             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Thay đổi cần làm

#### 1. Cập nhật `posts-list/page.tsx` (thí điểm)

**Từ:**
- `h-[calc(100vh-64px)] flex flex-col` với header + preview + bottom panel
- ConfigPanel với LayoutTabs, ControlCards bên trong

**Sang:**
- `max-w-4xl mx-auto space-y-6 pb-20` (scroll dọc như home-components)
- Cards riêng biệt cho settings
- Preview Card ở cuối với style/device toggle trong CardHeader

#### 2. Tái sử dụng PreviewWrapper pattern từ previews.tsx

Component `PreviewWrapper` đã có sẵn trong `app/admin/home-components/previews.tsx`:
- CardHeader với Eye icon + title
- Style tabs + Device toggle
- BrowserFrame bên trong
- Info text ở dưới

#### 3. Xóa ZoomSlider (không cần thiết nữa)

Với layout scroll dọc, preview có đủ không gian để hiển thị ở kích thước 100%, không cần zoom.

### Ưu điểm layout mới

- **Không chật chội**: Settings và preview không cạnh tranh không gian
- **Không z-index issues**: Không có overlapping panels
- **Familiar pattern**: Giống form edit thông thường
- **Mobile-friendly**: Scroll tự nhiên trên mobile
- **Dễ mở rộng**: Thêm settings card mới dễ dàng

### Files thay đổi

1. **Cập nhật:** `app/system/experiences/posts-list/page.tsx` - Refactor layout
2. **Giữ nguyên:** `components/experiences/editor/*` - Các components vẫn có thể dùng lại
3. **(Optional) Xóa:** `components/experiences/editor/ZoomSlider.tsx` - Không cần nữa

### Rollback commit trước

Vì commit `feat: add preview zoom slider` không còn cần thiết, tôi sẽ revert nó trước khi implement layout mới.