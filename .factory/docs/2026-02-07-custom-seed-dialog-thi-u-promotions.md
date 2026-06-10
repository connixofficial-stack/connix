## Phân tích Custom Seed Dialog

### Hiện trạng MODULE_GROUPS

```typescript
const MODULE_GROUPS = [
  {
    category: 'content',
    modules: ['postCategories', 'posts', 'serviceCategories', 'services'],
  },
  {
    category: 'commerce', 
    modules: ['productCategories', 'products', 'orders'],
  },
  {
    category: 'user',
    modules: ['customers'],
  },
];
```

### ❌ THIẾU PROMOTIONS

Custom Seed Dialog **KHÔNG** có module `promotions` trong danh sách!

Mặc dù đã:
- ✅ Tạo `PromotionsSeeder` class
- ✅ Đăng ký vào `seedManager.ts`
- ✅ Thêm vào `SEED_PRESETS` (minimal/standard/large/demo)

Nhưng `CustomSeedDialog.tsx` có hardcoded `MODULE_GROUPS` riêng, không sync với `SEED_PRESETS`.

---

## Đề xuất Fix

Thêm `promotions` vào group `marketing` (mới) hoặc `commerce`:

```typescript
const MODULE_GROUPS = [
  // ... existing groups
  {
    category: 'marketing',
    label: 'Marketing',
    modules: [
      { defaultQty: 10, key: 'promotions', name: 'Promotions' },
    ],
  },
];
```

Hoặc thêm vào `commerce`:
```typescript
{
  category: 'commerce',
  label: 'Commerce',
  modules: [
    { defaultQty: 5, key: 'productCategories', name: 'Product Categories' },
    { defaultQty: 50, key: 'products', name: 'Products' },
    { defaultQty: 30, key: 'orders', name: 'Orders' },
    { defaultQty: 10, key: 'promotions', name: 'Promotions' }, // ADD
  ],
},
```

---

**Bạn muốn tôi thêm promotions vào group nào?**