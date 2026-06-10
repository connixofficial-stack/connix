## DARE Analysis Summary

### ROOT CAUSES

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Không có PromotionsSeeder class** | Bulk seed không seed được promotions |
| 2 | **SEED_PRESETS thiếu promotions** | Preset không include module promotions |
| 3 | **seedPromotionsModule hardcoded** | Dates cũ, chỉ có coupon/percent/fixed |
| 4 | **Dependencies chưa tối ưu** | promotions deps có `orders` không cần thiết |

---

## Implementation Plan

### 1. Tạo `convex/seeders/promotions.seeder.ts`

**Đa dạng hóa dữ liệu:**
- **5 promotionType:** coupon (40%), campaign (25%), flash_sale (15%), bundle (10%), loyalty (10%)
- **7 discountType:** percent (35%), fixed (30%), buy_x_get_y (10%), buy_a_get_b (5%), tiered (5%), free_shipping (10%), gift (5%)
- **4 status:** Active (60%), Scheduled (20%), Inactive (10%), Expired (10%)
- **3 scheduleType:** always, dateRange, recurring
- **Dynamic dates:** Relative to seed time (future dates cho Scheduled, past dates cho Active/Expired)

**Template seeder:**
```typescript
export class PromotionsSeeder extends BaseSeeder<PromotionData> {
  moduleName = 'promotions';
  tableName = 'promotions';
  dependencies = [
    { module: 'productCategories', required: false }, // optional: để link applicableTo
  ];
  
  generateFake(): PromotionData {
    const promotionType = weightedRandom(['coupon', 'campaign', ...]);
    const discountType = weightedRandom(['percent', 'fixed', ...]);
    const status = weightedRandom(['Active', 'Scheduled', ...]);
    
    // Dynamic dates based on status
    const now = Date.now();
    let startDate, endDate;
    if (status === 'Scheduled') {
      startDate = now + randomDays(7, 30);
      endDate = startDate + randomDays(7, 60);
    } else if (status === 'Active') {
      startDate = now - randomDays(1, 30);
      endDate = now + randomDays(7, 90);
    }
    // ...
  }
}
```

### 2. Update `convex/seeders/index.ts`

```typescript
export { PromotionsSeeder } from './promotions.seeder';
```

### 3. Update `convex/seedManager.ts`

```typescript
import { PromotionsSeeder } from './seeders';

const SEEDERS = {
  // ... existing
  promotions: PromotionsSeeder,
};
```

### 4. Update `convex/seeders/dependencies.ts`

**Fix dependencies:**
```typescript
promotions: {
  deps: ['productCategories'], // Remove 'orders' (không cần)
  type: 'optional', // Có thể seed independent
},
```

**Add to SEED_PRESETS:**
```typescript
minimal: { ..., promotions: 5 },
standard: { ..., promotions: 10 },
large: { ..., promotions: 30 },
demo: { ..., promotions: 15 },
```

### 5. Sample Seed Data Distribution

| Status | Count (standard) | Notes |
|--------|-----------------|-------|
| Active | 6 | displayOnPage: 5 true, 1 false |
| Scheduled | 2 | Future start dates |
| Inactive | 1 | Manual pause |
| Expired | 1 | Past end date |

| PromotionType | Count |
|---------------|-------|
| coupon | 4 |
| campaign | 3 |
| flash_sale | 1 |
| bundle | 1 |
| loyalty | 1 |

| DiscountType | Count |
|--------------|-------|
| percent | 4 |
| fixed | 3 |
| free_shipping | 1 |
| buy_x_get_y | 1 |
| gift | 1 |

---

## Files to Create/Modify

1. **CREATE:** `convex/seeders/promotions.seeder.ts`
2. **UPDATE:** `convex/seeders/index.ts` - Export PromotionsSeeder
3. **UPDATE:** `convex/seedManager.ts` - Add to SEEDERS registry
4. **UPDATE:** `convex/seeders/dependencies.ts` - Fix deps + Add to presets

---

Bạn có muốn tôi thực hiện plan này không?