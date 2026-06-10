## Preview Zoom Feature cho Experience Editor

### Mục tiêu
Thêm khả năng zoom preview (scale 25%-100%) để user xem được toàn bộ preview và settings cùng lúc.

### Giải pháp: CSS Transform Scale

**Cách hoạt động:**
- Sử dụng `transform: scale(x)` trên BrowserFrame content
- Preview thu nhỏ nhưng giữ nguyên layout gốc (không thay đổi responsive breakpoints)
- Container sử dụng `transform-origin: top center` để scale từ trên xuống

### Thay đổi cần làm

#### 1. Tạo component `ZoomSlider` mới
**File:** `components/experiences/editor/ZoomSlider.tsx`
```tsx
// Slider với các mức 25% → 100%
// Hiển thị: icon ZoomOut | slider | percentage% | icon ZoomIn
// Style: compact, phù hợp cạnh DeviceToggle
```

#### 2. Cập nhật `BrowserFrame`
**File:** `components/experiences/editor/BrowserFrame.tsx`
- Thêm prop `scale?: number` (default: 1)
- Wrap children trong container với `transform: scale(scale)`
- Điều chỉnh container height để bù trừ cho scale

#### 3. Cập nhật `index.ts`
Export `ZoomSlider` component

#### 4. Cập nhật `posts-list/page.tsx` (thí điểm)
- Thêm state `previewScale` (default: 1)
- Thêm `ZoomSlider` cạnh `DeviceToggle` trong header
- Truyền `scale={previewScale}` vào `BrowserFrame`

### UI Preview

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Danh sách bài viết    [🖥️📱💻] [🔍─────○───── 75%] [Lưu] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────┐                     │
│     │ ○ ○ ○  yoursite.com/posts       │ ← Scaled preview    │
│     ├─────────────────────────────────┤                     │
│     │     (preview content at 75%)    │                     │
│     │                                 │                     │
│     └─────────────────────────────────┘                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Layout tabs] ────────────────────────────────────── [▼]    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Settings │ │ Settings │ │ Module   │ │ Links    │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Ưu điểm
- Không thay đổi logic preview hiện có
- Giữ nguyên responsive breakpoints
- User có thể zoom out để xem tổng quan, zoom in để xem chi tiết
- Có thể apply cho tất cả experience pages sau khi thử nghiệm OK