## Phân tích vấn đề hiện tại (Compact Layout)

### Vấn đề không chuyên nghiệp:
1. **Gradient trên card "Tiếp tục mua sắm"** - `linear-gradient(135deg, ${brandColor}, #0f172a)` quá fancy, không phù hợp doanh nghiệp
2. **Layout thiếu cân đối** - Card highlight chiếm 2 cột, còn lại mỗi cái 1 cột → không đồng đều
3. **Không có section phân chia rõ** - Thiếu phân cách giữa info và actions
4. **Icon box quá nhỏ** (w-9 h-9) - Không đủ trọng lượng visual cho enterprise
5. **Thiếu hover states chuyên nghiệp** - Chỉ có shadow nhẹ, không có feedback rõ ràng

---

## Plan Redesign - Enterprise Compact Layout

### Nguyên tắc thiết kế:
- **No gradient** - Chỉ dùng solid colors
- **Consistent sizing** - Tất cả action cards cùng kích thước
- **Clear hierarchy** - Phân chia rõ ràng bằng spacing và border
- **Professional hover** - Border và subtle background shift

### Thay đổi cụ thể:

#### 1. Profile Section (Cột trái)
```
- Giữ nguyên brandColor solid background
- Thêm subtle border-right separator
- Tăng padding cho thoáng hơn
```

#### 2. Quick Actions Section (Cột phải)
```
BEFORE: 
- 1 card highlight (gradient, 2 cols) + cards nhỏ (1 col each)

AFTER:
- Grid đồng đều 2x2 (desktop) / 1 col (mobile)
- Tất cả cards cùng style: white bg, border-slate-200, hover:border-brandColor
- Icon box tăng lên w-10 h-10
- Bỏ hoàn toàn gradient
- Hover: border chuyển sang brandColor + light bg tint
```

#### 3. File cần sửa:
| File | Thay đổi |
|------|----------|
| `components/experiences/previews/AccountProfilePreview.tsx` | Sửa compact section |
| `app/(site)/account/profile/page.tsx` | Đồng bộ với preview |

#### 4. Code changes chi tiết:

**Bỏ logic `shopAction` highlight:**
```tsx
// BEFORE
const shopAction = visibleActions.find((action) => action.id === 'shop');
const otherActions = visibleActions.filter((action) => action.id !== 'shop');

// AFTER
// Xử lý tất cả actions như nhau
```

**Grid mới cho actions:**
```tsx
// BEFORE
grid-cols-2 lg:grid-cols-4

// AFTER  
grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4
```

**Card style thống nhất:**
```tsx
// Mỗi action card
<div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 
  bg-white hover:border-[brandColor] hover:bg-slate-50 transition-colors">
  <div className="w-10 h-10 rounded-lg flex items-center justify-center ...">
    <Icon size={20} />
  </div>
  <div>
    <p className="text-sm font-medium text-slate-900">Label</p>
    <p className="text-xs text-slate-500">Description</p>
  </div>
  <ArrowRight className="ml-auto text-slate-400" />
</div>
```

---

## Kết quả mong đợi:
- Layout đồng đều, chuyên nghiệp
- Không có gradient hay hiệu ứng fancy
- Hover states rõ ràng, subtle
- Phù hợp enterprise/doanh nghiệp
- Mobile responsive tốt