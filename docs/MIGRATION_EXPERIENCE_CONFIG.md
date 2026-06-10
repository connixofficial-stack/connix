# Experience Config Migration Guide

## Overview
Hệ thống đã chuyển từ settings rải rác sang experience-based configuration. Guide này giúp migrate legacy settings.

## Experience Configs

### 1. Product Detail UI (`product_detail_ui`)
**Legacy settings:**
- `products_detail_style` → `product_detail_ui.layoutStyle`
- `products_detail_classic_highlights_enabled` → `product_detail_ui.showClassicHighlights`

**New structure:**
\`\`\`json
{
  "group": "experience",
  "key": "product_detail_ui",
  "value": {
    "layoutStyle": "classic" | "modern" | "minimal",
    "showAddToCart": boolean,
    "showClassicHighlights": boolean,
    "showRating": boolean,
    "showWishlist": boolean
  }
}
\`\`\`

### 2. Wishlist UI (`wishlist_ui`)
**New structure:**
\`\`\`json
{
  "group": "experience",
  "key": "wishlist_ui",
  "value": {
    "layoutStyle": "grid" | "list",
    "showWishlistButton": boolean,
    "showNote": boolean,
    "showNotification": boolean
  }
}
\`\`\`

### 3. Cart UI (`cart_ui`)
**New structure:**
\`\`\`json
{
  "group": "experience",
  "key": "cart_ui",
  "value": {
    "layoutStyle": "drawer" | "page",
    "showGuestCart": boolean,
    "showExpiry": boolean,
    "showNote": boolean
  }
}
\`\`\`

### 4. Checkout UI (`checkout_ui`)
**New structure:**
\`\`\`json
{
  "group": "experience",
  "key": "checkout_ui",
  "value": {
    "flowStyle": "single-page" | "multi-step",
    "orderSummaryPosition": "right" | "bottom",
    "showPaymentMethods": boolean,
    "showShippingOptions": boolean
  }
}
\`\`\`

### 5. Comments & Rating UI (`comments_rating_ui`)
**New structure:**
\`\`\`json
{
  "group": "experience",
  "key": "comments_rating_ui",
  "value": {
    "ratingDisplayStyle": "stars" | "numbers" | "both",
    "commentsSortOrder": "newest" | "oldest" | "highest-rating" | "most-liked",
    "showLikes": boolean,
    "showReplies": boolean,
    "showModeration": boolean
  }
}
\`\`\`

## Migration Steps

### Automatic (via seed)
1. Chạy `seedSettingsModule` sẽ tự động thêm experience configs với defaults
2. Legacy settings vẫn giữ nguyên để backward compatibility

### Manual Migration
Nếu đã có data production:

\`\`\`typescript
// Example: Migrate product detail settings
const oldStyle = await ctx.db.query("settings")
  .withIndex("by_key", q => q.eq("key", "products_detail_style"))
  .first();
const oldHighlights = await ctx.db.query("settings")
  .withIndex("by_key", q => q.eq("key", "products_detail_classic_highlights_enabled"))
  .first();

await ctx.db.insert("settings", {
  group: "experience",
  key: "product_detail_ui",
  value: {
    layoutStyle: oldStyle?.value ?? "classic",
    showClassicHighlights: oldHighlights?.value ?? true,
    showAddToCart: true,
    showRating: true,
    showWishlist: true,
  }
});
\`\`\`

## Backward Compatibility

Experience hooks tự động fallback về legacy settings:

\`\`\`typescript
function useProductDetailExperienceConfig() {
  const experienceSetting = useQuery(api.settings.getByKey, { key: 'product_detail_ui' });
  const legacyStyleSetting = useQuery(api.settings.getByKey, { key: 'products_detail_style' });
  
  return useMemo(() => {
    const raw = experienceSetting?.value as Partial<ProductDetailExperienceConfig>;
    return {
      layoutStyle: raw?.layoutStyle ?? (legacyStyleSetting?.value as string) ?? 'classic',
      // ... fallback cho các fields khác
    };
  }, [experienceSetting, legacyStyleSetting]);
}
\`\`\`

## Cleanup Phase

Sau khi migrate xong và test kỹ:

1. Xóa legacy settings đã migrate
2. Xóa fallback logic trong hooks
3. Update documentation
4. Deploy

## Testing Checklist

- [ ] Product detail page render đúng với từng layout style
- [ ] Toggle rating/wishlist/cart hoạt động
- [ ] Legacy settings vẫn hoạt động nếu chưa có experience config
- [ ] Experience hub UI sync với site rendering
- [ ] Module pages không duplicate toggles với experience pages
