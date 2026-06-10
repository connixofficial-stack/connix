## Yêu cầu bổ sung từ user
1. **Không hard code layout** - phải đọc từ `config.layoutStyle`
2. **Tất cả nút phải có action** - không hiển thị trơ
3. **Dùng brandColor** với tint/shade - không set cứng màu

---

## Kế hoạch triển khai

### 1. Cards Layout (enterprise-order-dashboard)
**UI nâng cấp:**
- StatCard có **icon** + **highlight** (card đầu dùng brandColor bg)
- Order card với product **images** (placeholder nếu chưa có)
- Animation expand: `animate-in fade-in slide-in-from-top-2`

**Actions hoạt động:**
- "Mua lại" → navigate `/products/[slug]` hoặc add to cart
- "Hủy đơn" → gọi `cancelOrder` mutation (đã có)
- "Xem chi tiết" → toggle expand (đã có)

### 2. Timeline Layout (corporate-order-dashboard)
**UI nâng cấp:**
- **Stepper horizontal** thay timeline vertical đơn giản
- Card structure: Header | Body (Stepper + products) | Footer
- Footer: tracking code (mono font) + total + actions

**Actions hoạt động:**
- "Hủy đơn hàng" → gọi `cancelOrder` (chỉ khi Pending)
- "Xem chi tiết" → có thể expand hoặc navigate detail page

### 3. Compact Layout (corporate-order-management)
**UI nâng cấp:**
- Table với `shadow ring-1 ring-black/5 sm:rounded-lg`
- Header: uppercase tracking-wide slate-50
- Row: `hover:bg-slate-50/50 transition-colors`
- **Pagination footer** với info + prev/next

**Actions hoạt động:**
- "Chi tiết" link → navigate `/account/orders/[id]` hoặc modal

---

## Brand Color Usage (không hard code)
```tsx
// Dùng inline style với brandColor
style={{ backgroundColor: brandColor }}
style={{ color: brandColor }}
style={{ borderColor: brandColor }}

// Tint/shade với opacity
style={{ backgroundColor: `${brandColor}10` }} // 10% opacity
style={{ backgroundColor: `${brandColor}20` }} // 20% opacity
```

---

## Files cần sửa
1. `app/(site)/account/orders/page.tsx` - Main implementation
2. `components/experiences/previews/AccountOrdersPreview.tsx` - Sync preview

## Ước tính
- LOC: ~400 dòng
- Risk: Thấp (chỉ UI, logic đã có sẵn)