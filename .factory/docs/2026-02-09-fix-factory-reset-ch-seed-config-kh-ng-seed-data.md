## Root Cause

Các `seed*Module` mutations trong `convex/seed.ts` **seed cả DATA lẫn CONFIG**:
- `seedProductsModule` → seed `productCategories`, `products` + `moduleFeatures`, `moduleFields`
- `seedPostsModule` → seed `users`, `roles`, `postCategories`, `posts` + `moduleFeatures`, `moduleFields`
- Tương tự cho tất cả modules khác

Sau factory reset, gọi các hàm này → tạo lại toàn bộ data mẫu!

---

## Giải pháp: Tạo mutations riêng chỉ seed CONFIG

Thay vì gọi `seed*Module`, tạo mutations mới `seed*Config` chỉ seed `moduleFeatures` + `moduleFields` + `moduleSettings`, KHÔNG seed data thực tế.

### Backend: Thêm các mutations trong `convex/seed.ts`

```ts
// Chỉ seed CONFIG cho từng module (không seed data)
export const seedPostsConfig = mutation({...}); // chỉ moduleFeatures + moduleFields
export const seedProductsConfig = mutation({...});
export const seedServicesConfig = mutation({...});
// ... tất cả modules khác

// Hoặc 1 mutation tổng:
export const seedAllModulesConfig = mutation({
  args: {},
  handler: async (ctx) => {
    // Chỉ seed moduleFeatures, moduleFields, moduleSettings cho TẤT CẢ modules
    // KHÔNG seed products, posts, categories...
  }
});
```

### Frontend: Cập nhật `DataCommandCenter.tsx`

Sau factory reset, gọi `seedAllModulesConfig` thay vì các `seed*Module`.

---

## Files thay đổi

| Action | File |
|--------|------|
| UPDATE | `convex/seed.ts` - thêm `seedAllModulesConfig` mutation |
| UPDATE | `components/data/DataCommandCenter.tsx` - gọi `seedAllModulesConfig` thay vì các `seed*Module` |

---

## Flow mới

```
Factory Reset:
1. Xóa tất cả tables (progress bar)
2. Gọi seedAllModulesConfig → chỉ tạo:
   - adminModules (17 modules)
   - systemPresets (5 presets)
   - moduleFeatures (cho mỗi module)
   - moduleFields (cho mỗi module)
   - moduleSettings (cho mỗi module)
3. KHÔNG tạo: products, posts, categories, users, customers...
4. Toast success
```
