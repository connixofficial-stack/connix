# Experience Hub Architecture

## Overview
Experience Hub tổ chức config theo user journey thay vì module kỹ thuật, giúp admin dễ quản lý UX.

## Structure

\`\`\`
/system/experiences/
├── page.tsx                    # Experience Hub landing
├── product-detail/page.tsx     # Product Detail Experience
├── wishlist/page.tsx           # Wishlist Experience
├── cart/page.tsx               # Cart Experience
├── checkout/page.tsx           # Checkout Experience
└── comments-rating/page.tsx    # Comments & Rating Experience
\`\`\`

## Design Principles

### 1. **Experience-First, Not Module-First**
- ❌ `/system/modules/products` → toggle layout + rating + wishlist + cart (rải rác)
- ✅ `/system/experiences/product-detail` → tất cả UX của product detail page tại 1 chỗ

### 2. **Separation of Concerns**
- **Module pages** (`/system/modules/*`):
  - Module on/off
  - Features (kỹ thuật)
  - Fields (database schema)
  - Settings (logic/behavior)
  
- **Experience pages** (`/system/experiences/*`):
  - Layout styles
  - UI toggles (show/hide blocks)
  - UX flows (single-page vs multi-step)
  - Display preferences (stars vs numbers)

### 3. **Cross-Module Coordination**
Experience page phối hợp nhiều modules:

\`\`\`typescript
// Product Detail Experience
- Layout: từ Products module
- Rating: từ Comments module
- Wishlist button: từ Wishlist module
- Add-to-cart: từ Cart + Orders modules
\`\`\`

### 4. **Unified Config Storage**
Tất cả experience configs lưu trong `settings` table với group `"experience"`:

\`\`\`typescript
{
  group: "experience",
  key: "product_detail_ui",
  value: { /* config object */ }
}
\`\`\`

## Benefits

### Cho Admin Users
- **Dễ tìm**: "Muốn đổi layout product detail? → vào Experiences → Product Detail"
- **Quan sát**: Thấy tất cả options liên quan đến 1 page tại 1 chỗ
- **Preview**: Mỗi experience page có live preview (future)

### Cho Developers
- **Maintainability**: Không còn settings rải rác khắp module
- **Scalability**: Thêm experience mới không ảnh hưởng modules cũ
- **Type Safety**: Mỗi experience config có type riêng
- **Testability**: Test từng experience độc lập

## Extension Pattern

Thêm experience mới:

1. Tạo `/system/experiences/your-experience/page.tsx`
2. Define type config
3. Tạo experience card trong hub listing
4. Seed default config
5. Tích hợp vào site rendering

## Future Enhancements

### Phase 6: Admin Preview Sync
- Split-screen preview trong experience pages
- Real-time sync khi toggle options
- Mobile/tablet/desktop preview modes

### Phase 7: A/B Testing Integration
- Enable A/B testing per experience
- Analytics tracking
- Variant performance comparison

### Phase 8: User Segmentation
- Different experiences cho user segments
- Personalization rules
- Conditional rendering logic
