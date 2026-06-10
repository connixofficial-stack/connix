## Phân tích chi tiết

### Hiện trạng `/admin/menus`
**Files:**
- `app/admin/menus/page.tsx` (~450 dòng) - CRUD menu items
- `app/admin/menus/MenuPreview.tsx` (~800 dòng) - Preview + Config

**Vấn đề:** MenuPreview đang làm việc của experience (preview responsive, config phức tạp, tích hợp modules)

---

## Kế hoạch chi tiết (theo chuẩn Experience Editor UI/UX)

### Bước 1: Tạo `/system/experiences/menu/page.tsx`

**Cấu trúc theo skill experience-editor-uiux:**

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🎨 Header Menu              [Desktop][Tablet][Mobile]    [Lưu thay đổi] │  ← 48px (h-12)
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│                         FULL-WIDTH PREVIEW                            │
│                    (height: flex-1, BrowserFrame)                     │
│                    Preview header với menu items thật                  │
│                                                                       │
├─ [Classic][Topbar][Transparent] ─────────────────────────────── [∨] ──┤  ← 40px (LayoutTabs)
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Khối hiển   │ │ Topbar/     │ │ Module      │ │ Hints +     │      │  ← 180px (ConfigPanel)
│  │ thị (cart,  │ │ Search      │ │ liên quan   │ │ ExampleLinks│      │
│  │ wishlist..) │ │ config      │ │             │ │             │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
└───────────────────────────────────────────────────────────────────────┘
```

**Experience key và config type:**
```typescript
// KHÔNG dùng experience group vì Header.tsx đã hardcode key
// Lưu trực tiếp vào 'header_style' + 'header_config'

type HeaderLayoutStyle = 'classic' | 'topbar' | 'transparent';

type HeaderMenuConfig = {
  layoutStyle: HeaderLayoutStyle;
  brandName: string;
  topbar: {
    show: boolean;
    hotline: string;
    email: string;
    showTrackOrder: boolean;
    trackOrderUrl: string;
    showStoreSystem: boolean;
    storeSystemUrl: string;
    useSettingsData: boolean;  // Lấy từ /admin/settings contact
  };
  search: {
    show: boolean;
    placeholder: string;
    searchProducts: boolean;
    searchPosts: boolean;
  };
  cart: { show: boolean; url: string };
  wishlist: { show: boolean; url: string };
  login: { show: boolean; url: string; text: string };
  cta: { show: boolean; text: string; url: string };
};
```

**Components sử dụng (đã có sẵn):**
| Component | Source | Mục đích |
|-----------|--------|----------|
| `BrowserFrame` | `components/experiences/editor` | Frame preview |
| `DeviceToggle` | `components/experiences/editor` | Desktop/Tablet/Mobile |
| `LayoutTabs` | `components/experiences/editor` | Classic/Topbar/Transparent |
| `ConfigPanel` | `components/experiences/editor` | Bottom panel collapsible |
| `ControlCard`, `ToggleRow`, `SelectRow` | `components/experiences/editor` | Config controls |
| `ExperienceModuleLink` | `components/experiences` | Link modules |
| `ExperienceHintCard` | `components/experiences` | Tips |
| `ExampleLinks` | `components/experiences` | Link xem trang mẫu |

**Queries cần dùng:**
```typescript
// Lấy config hiện tại
const headerStyleSetting = useQuery(api.settings.getByKey, { key: 'header_style' });
const headerConfigSetting = useQuery(api.settings.getByKey, { key: 'header_config' });
const brandColorSetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });

// Lấy menu items để preview
const menuData = useQuery(api.menus.getFullMenu, { location: 'header' });

// Check modules enabled
const cartModule = useQuery(api.admin.modules.getModuleByKey, { key: 'cart' });
const wishlistModule = useQuery(api.admin.modules.getModuleByKey, { key: 'wishlist' });
const productsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'products' });
const postsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'posts' });

// Contact settings cho topbar useSettingsData
const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
```

**Save logic (giữ nguyên keys để không break Header.tsx):**
```typescript
const handleSave = async () => {
  await Promise.all([
    setSetting({ group: 'site', key: 'header_style', value: config.layoutStyle }),
    setSetting({ group: 'site', key: 'header_config', value: config }),
  ]);
  toast.success('Đã lưu cấu hình Header Menu');
};
```

---

### Bước 2: Tạo `components/experiences/previews/HeaderMenuPreview.tsx`

**Tách preview component riêng (~300 dòng):**
- Di chuyển logic render 3 styles từ MenuPreview.tsx
- Props: `config`, `menuItems`, `brandColor`, `device`
- KHÔNG có logic state, config - chỉ render

---

### Bước 3: Tạo `app/admin/menus/SimpleMenuPreview.tsx`

**Preview đơn giản cho admin (~80 dòng):**
```typescript
// Chỉ hiển thị menu tree dạng visual (không config)
// Có banner link đến /system/experiences/menu

export function SimpleMenuPreview({ items }: { items: MenuItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Preview Menu</CardTitle>
          <Link href="/system/experiences/menu" className="text-sm text-blue-600 hover:underline">
            Cấu hình header style →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Render menu tree đơn giản */}
        <div className="space-y-1">
          {menuTree.map(item => (
            <MenuTreeItem key={item._id} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Bước 4: Cập nhật `/admin/menus/page.tsx`

```diff
- import { MenuPreview } from './MenuPreview';
+ import { SimpleMenuPreview } from './SimpleMenuPreview';

// Ở cuối page (dòng ~440)
- <MenuPreview items={items} />
+ <SimpleMenuPreview items={items} />
```

---

### Bước 5: Cập nhật navigation và constants

**`lib/experiences/constants.ts`:**
```diff
+ // Header Menu không dùng experience group
+ // Vì Header.tsx đã hardcode 'header_style' + 'header_config'
+ // Chỉ thêm vào EXPERIENCE_NAMES để hiển thị
+ export const EXPERIENCE_NAMES = {
+   ...existing,
+   header_menu_ui: 'Header Menu',
+ };
```

**`app/system/experiences/page.tsx`:**
```diff
+ import { Menu } from 'lucide-react';

const experiences = [
+  {
+    title: 'Header Menu',
+    description: 'Style header, topbar, search, cart, wishlist, login.',
+    href: '/system/experiences/menu',
+    icon: Menu,
+  },
  ...existing,
];
```

---

### Bước 6: Xóa file cũ

- Xóa `app/admin/menus/MenuPreview.tsx` (sau khi đã migrate)

---

## File changes summary

| Action | File | Est. Lines |
|--------|------|------------|
| CREATE | `app/system/experiences/menu/page.tsx` | ~350 |
| CREATE | `components/experiences/previews/HeaderMenuPreview.tsx` | ~300 |
| CREATE | `app/admin/menus/SimpleMenuPreview.tsx` | ~80 |
| UPDATE | `app/admin/menus/page.tsx` | ~5 |
| UPDATE | `lib/experiences/constants.ts` | ~3 |
| UPDATE | `app/system/experiences/page.tsx` | ~8 |
| DELETE | `app/admin/menus/MenuPreview.tsx` | -800 |

**Net change:** ~-50 dòng (code gọn hơn, tách biệt rõ)

---

## Checklist theo Experience Editor UI/UX Skill

- [x] Full-width preview với BrowserFrame
- [x] Compact header 48px (h-12)
- [x] DeviceToggle inline header (size="sm")
- [x] LayoutTabs cho 3 styles
- [x] ConfigPanel collapsible (220px expanded)
- [x] ControlCards grid 4 columns
- [x] ExperienceModuleLink cho cart, wishlist
- [x] ExperienceHintCard + ExampleLinks
- [x] Save logic giữ nguyên keys

---

## Lưu ý quan trọng

1. **Không thay đổi settings keys** - `header_style` + `header_config` đã được Header.tsx đọc
2. **Preview fetch menu thật** - Dùng `api.menus.getFullMenu({ location: 'header' })`
3. **Module disable** - Cart/wishlist toggles disabled nếu modules tắt
4. **Topbar useSettingsData** - Đọc từ contact settings khi enabled
5. **Brand color** - Lấy từ `site_brand_color` cho preview và accent