
## Root Cause

`categoriesConfig` (từ `config.categories`) có thể chứa cùng `categoryId` nhiều lần (user cấu hình trùng). Khi map ra `resolvedCategories`, mỗi item lấy `id: item.categoryId` => nhiều phần tử cùng `id` => React warning duplicate key.

## Fix

**File:** `components/site/ComponentRenderer.tsx` ~ dòng 5649

Thêm deduplicate `categoriesConfig` trước khi map, giữ item đầu tiên cho mỗi `categoryId`:

```ts
const resolvedCategories = categoriesConfig
  .filter((item, index, arr) => arr.findIndex(i => i.categoryId === item.categoryId) === index)
  .map(item => {
    // ... giữ nguyên logic hiện tại
  })
  .filter(Boolean) as ...;
```

**Giải thích:** Chỉ giữ lần xuất hiện đầu tiên của mỗi `categoryId`, loại bỏ duplicate trước khi resolve. Không ảnh hưởng logic render hay data.

**Phạm vi thay đổi:** 1 dòng thêm `.filter(...)` — không thay đổi gì khác.
