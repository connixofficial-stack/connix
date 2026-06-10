## Fix Allbirds Header Issues

### Vấn đề cần sửa

1. **Font chữ kinh** - Đang dùng `text-[11px] uppercase tracking-[0.3em]` quá nhỏ và cách xa
2. **Mega menu trống** - Dropdown cố định 720px, menu con ít thì trống, nhiều thì chật
3. **Search button không hoạt động** - Chỉ là button không có action

---

### Giải pháp

#### 1. Chuẩn hoá font chữ (giống Classic/Topbar)
- Nav items: `text-sm font-medium` (bỏ uppercase, tracking)
- Brand name: `font-semibold text-slate-900` (bỏ uppercase, tracking)
- CTA: `text-sm font-medium`
- Topbar giữ nguyên vì là announcement bar

#### 2. Dropdown thông minh theo số lượng menu con
```
- 1 child không có sub    → dropdown nhỏ min-w-[180px]
- 1-2 children có sub     → dropdown vừa min-w-[320px]  
- 3+ children             → mega menu w-[720px] grid
```

#### 3. Search expandable (giống Classic)
- Click icon → mở input field với animation slide
- Hoặc dùng input inline như Classic style

---

### Files cần sửa

| File | Thay đổi |
|------|----------|
| `components/site/Header.tsx` | Fix font, dropdown logic, search state |
| `components/experiences/previews/HeaderMenuPreview.tsx` | Sync preview với frontend |

---

### Chi tiết Implementation

**Font (Header.tsx + Preview)**
- Brand: `text-sm font-semibold uppercase tracking-[0.3em]` → `font-semibold text-lg`
- Nav: `text-[11px] font-semibold uppercase tracking-[0.3em]` → `text-sm font-medium`
- Dropdown heading: `text-[11px] uppercase tracking-[0.25em]` → `text-sm font-semibold`

**Dropdown adaptive**
```tsx
const totalSubItems = item.children.reduce((acc, c) => acc + c.children.length, 0);
const dropdownSize = totalSubItems > 6 ? 'mega' : item.children.length > 1 ? 'medium' : 'small';
```

**Search**
- Thêm state `searchOpen`
- Click icon → toggle input với `w-0 → w-48` transition
- Hoặc dùng input inline như Classic