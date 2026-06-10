# Spec: Refactor Stats Component

## 📋 Tổng quan
Tách component Stats từ file monolithic (`create/stats/page.tsx` và `previews.tsx`) thành module feature-based theo pattern Hero component.

## 🎯 Mục tiêu
- Tạo module `app/admin/home-components/stats/` với cấu trúc riêng biệt
- Tách types, constants, components ra files độc lập
- Tạo route edit mới `/admin/home-components/stats/[id]/edit`
- Cleanup code cũ và thiết lập redirect

## 📁 Cấu trúc module mới

```
app/admin/home-components/stats/
├── [id]/edit/page.tsx          # Route edit mới
├── _types/index.ts             # Types cho Stats
├── _lib/constants.ts           # Constants (styles, default items)
└── _components/
    ├── StatsPreview.tsx        # Preview component với 6 styles
    └── StatsForm.tsx           # Form component
```

## 🔨 Chi tiết từng bước

### Bước 1: Tạo Types (_types/index.ts)
- Export `StatsStyle` union type: `'horizontal' | 'cards' | 'icons' | 'gradient' | 'minimal' | 'counter'`
- Export `StatsItem` interface: `{ value: string; label: string }`
- Export `StatsContent` interface: `{ items: StatsItem[]; style: StatsStyle }`

### Bước 2: Tạo Constants (_lib/constants.ts)
- Export `STATS_STYLES` array với 6 styles:
  ```ts
  [
    { id: 'horizontal', label: 'Thanh ngang' },
    { id: 'cards', label: 'Cards' },
    { id: 'icons', label: 'Circle' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'counter', label: 'Counter' }
  ]
  ```
- Export `DEFAULT_STATS_ITEMS`:
  ```ts
  [
    { value: '1000+', label: 'Khách hàng' },
    { value: '50+', label: 'Đối tác' },
    { value: '99%', label: 'Hài lòng' },
    { value: '24/7', label: 'Hỗ trợ' }
  ]
  ```

### Bước 3: Tạo StatsPreview Component (_components/StatsPreview.tsx)
- Copy logic render từ `previews.tsx` (dòng 135-434)
- Sử dụng shared components: `PreviewWrapper`, `BrowserFrame` từ `../_shared/components`
- Sử dụng hook `usePreviewDevice` từ `../_shared/hooks`
- Props: `{ items, primary, secondary, selectedStyle, onStyleChange }`
- Render 6 styles: horizontal, cards, icons, gradient, minimal, counter
- Áp dụng dual brand colors (primary + secondary) đúng theo code hiện tại

### Bước 4: Tạo StatsForm Component (_components/StatsForm.tsx)
- Copy logic form từ `create/stats/page.tsx`
- State: `statsItems` (array với id, value, label)
- UI: Card header với button "Thêm", danh sách items với input value/label và button xóa
- Props: `{ items, onChange }`
- Sử dụng components từ shadcn/ui: Card, Input, Button
- Icons: Plus, Trash2 từ lucide-react

### Bước 5: Tạo Route Edit Mới ([id]/edit/page.tsx)
- Load data từ Convex: `useQuery(api.homeComponents.getById, { id })`
- Save mutation: `useMutation(api.homeComponents.update)`
- State management:
  - `title`, `active` từ component data
  - `statsItems` parse từ `config.items`
  - `style` từ `config.style`
- Layout 2 cột:
  - **Trái**: Form metadata (title, active) + StatsForm
  - **Phải**: StatsPreview (sticky)
- Submit handler: validate và gọi mutation với `{ items, style }`
- Redirect về `/admin/home-components` sau khi save thành công

### Bước 6: Redirect từ Route Cũ
- Trong `app/admin/home-components/[id]/edit/page.tsx`:
  - Thêm check: `if (component?.type === 'stats') router.replace(\`/admin/home-components/stats/\${id}/edit\`)`
  - Đặt check này sau khi load data và trước render form

### Bước 7: Cleanup Code Cũ
- **File `previews.tsx`**:
  - Xóa dòng 135-434 (StatsPreview component)
  - Xóa `export type StatsStyle`
  - Xóa `interface StatsItem`
  
- **File `create/stats/page.tsx`**:
  - Giữ nguyên file này (vì đây là route create, không phải edit)
  - Chỉ update import: thay `import { StatsPreview } from '../../previews'` thành `import { StatsPreview } from '../../stats/_components/StatsPreview'`

### Bước 8: Testing
- [ ] Route `/admin/home-components/stats/[id]/edit` load đúng data
- [ ] Form save thành công vào Convex
- [ ] Preview hiển thị đủ 6 styles
- [ ] Device toggle (desktop/tablet/mobile) hoạt động
- [ ] Thêm/xóa stats items hoạt động
- [ ] Dual brand colors hiển thị đúng
- [ ] Redirect từ route cũ hoạt động
- [ ] Không có lỗi TypeScript
- [ ] Không có lỗi console

### Bước 9: Commit
- Chạy: `bunx oxlint --type-aware --type-check --fix`
- Commit message: `refactor(home-components): split stats into feature-based module`

## ⚠️ Lưu ý
- **KHÔNG** thay đổi behavior của component
- **KHÔNG** sửa UI/UX hiện tại
- **KHÔNG** thay đổi logic dual brand colors
- **CHỈ** refactor cấu trúc code theo pattern Hero
- Giữ nguyên tất cả styles và rendering logic
- Đảm bảo tương thích với Convex schema hiện tại