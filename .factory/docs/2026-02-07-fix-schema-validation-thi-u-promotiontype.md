## Nguyên nhân lỗi

Document cũ trong table `promotions` (ID: `nh75qnmt8mj7yy6yta0brpp0xs7ytncz`) thiếu field `promotionType` bắt buộc. Đây là data được tạo trước khi schema được cập nhật thêm field mới.

## Giải pháp

Tạo migration script để cập nhật các document cũ, thêm `promotionType` mặc định:

### Bước 1: Tạo migration mutation trong `convex/promotions.ts`

```typescript
// Migration: Thêm promotionType cho documents cũ
export const migrateAddPromotionType = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("promotions").take(500);
    let updated = 0;
    for (const promo of all) {
      if (!promo.promotionType) {
        // Default: coupon nếu có code, ngược lại campaign
        const promotionType = promo.code ? "coupon" : "campaign";
        await ctx.db.patch(promo._id, { promotionType });
        updated++;
      }
    }
    return { updated };
  },
  returns: v.object({ updated: v.number() }),
});
```

### Bước 2: Chạy migration

1. Thêm migration code vào `convex/promotions.ts`
2. Chạy `bunx convex dev` (sẽ vẫn fail schema nhưng deploy được function)
3. Gọi mutation `migrateAddPromotionType` từ Convex Dashboard hoặc code
4. Schema validation sẽ pass sau khi tất cả documents có `promotionType`

### Alternative: Sửa schema (không khuyến khích)

Nếu muốn nhanh, có thể wrap `promotionType` bằng `v.optional(...)` trong schema, nhưng điều này làm mất tính bắt buộc của field quan trọng.