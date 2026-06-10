## Problem

Trang `/account/profile` hiện tại chỉ có **1 layout cố định** (grid 2 cột), trong khi Preview đã có **3 layouts enterprise** riêng biệt. Cần đồng bộ.

## So sánh hiện tại

| Component | Preview | Trang thực |
|-----------|---------|------------|
| Card layout | ✅ Header card + action grid 3 cột | ❌ Grid 2 cột cố định |
| Sidebar layout | ✅ Split brand color + white | ❌ Không có |
| Compact layout | ✅ Split responsive, grid 2x2/4-col | ❌ Không có |
| showAddress | ✅ | ❌ |
| showMemberId | ✅ | ❌ |
| showJoinDate | ✅ | ❌ |
| actionItems config | ✅ | ❌ |

## Implementation Plan

### 1. Update `useAccountProfileConfig` hook
```typescript
// Thêm fields mới
type AccountProfileConfig = {
  layoutStyle: 'card' | 'sidebar' | 'compact';
  showQuickActions: boolean;
  showContactInfo: boolean;
  showLoyaltyBadge: boolean;
  showAddress: boolean;      // NEW
  showMemberId: boolean;     // NEW
  showJoinDate: boolean;     // NEW
  actionItems: string[];     // NEW
};
```

### 2. Refactor `/account/profile/page.tsx`

Render 3 layouts riêng biệt dựa trên `config.layoutStyle`:

**Card Layout** (default):
- Header card trắng với avatar + thông tin
- Action grid 3 cột với icon màu + description

**Sidebar Layout**:
- Split layout: Left sidebar (brand color) + Right content (white)
- Avatar lớn centered, contact info
- Actions list dạng card với arrow

**Compact Layout**:
- Split responsive: Left panel (brand color) + Right panel (white)
- Action grid 2x2 trên mobile, 4-col trên desktop
- CTA nổi bật với gradient

### 3. Files cần sửa
1. `lib/experiences/useSiteConfig.ts` - thêm fields mới vào hook
2. `app/(site)/account/profile/page.tsx` - refactor với 3 layouts

### 4. Pattern học từ `/account/orders`
```tsx
// Render theo layoutStyle
{config.layoutStyle === 'cards' && <CardsLayout />}
{config.layoutStyle === 'compact' && <CompactLayout />}
{config.layoutStyle === 'timeline' && <TimelineLayout />}
```
