## Root Cause

Sau factory reset, `seedAllModulesConfig` chỉ seed **config** (moduleFeatures, moduleFields, moduleSettings, adminModules, systemPresets) mà **không seed data** (customers, products, etc.).

Khi user sau đó chạy `seedPreset` (e.g., "standard"), `OrderSeeder` cần customers và products nhưng chúng không tồn tại → throw error.

## Fix

Sửa `OrderSeeder` để **skip** thay vì **throw** khi thiếu dependencies:

```typescript
// convex/seeders/orders.seeder.ts
async seed(config: SeedConfig) {
  [this.products, this.customers] = await Promise.all([
    this.ctx.db.query('products').collect(),
    this.ctx.db.query('customers').collect(),
  ]);
  
  if (this.products.length < 5 || this.customers.length === 0) {
    console.log(`[OrderSeeder] Skipped: need 5+ products and 1+ customers`);
    return {
      created: 0,
      dependencies: ['products', 'customers'],
      duration: 0,
      module: this.moduleName,
      skipped: 0,
    };
  }
  
  return super.seed(config);
}
```

Áp dụng pattern tương tự cho các seeders khác có dependencies:
- `CommentsSeeder` (cần posts/products)
- `WishlistSeeder` (cần customers/products)
- `CartSeeder` (cần customers/products)

## Files cần sửa

1. `convex/seeders/orders.seeder.ts` - skip nếu thiếu customers/products
2. `convex/seeders/comments.seeder.ts` - skip nếu thiếu posts/products  
3. `convex/seeders/wishlist.seeder.ts` - skip nếu thiếu customers/products
4. `convex/seeders/cart.seeder.ts` - skip nếu thiếu customers/products