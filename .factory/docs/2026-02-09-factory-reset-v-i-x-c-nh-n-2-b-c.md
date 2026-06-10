## Factory Reset - Xóa sạch toàn bộ dữ liệu

### 1. Backend: `convex/seedManager.ts`

Thêm mutation `factoryReset`:
```ts
export const factoryReset = mutation({
  args: {},
  handler: async (ctx) => {
    const ALL_TABLES = [...]; // 49 tables từ schema
    
    for (const table of ALL_TABLES) {
      let hasMore = true;
      while (hasMore) {
        const records = await ctx.db.query(table).take(500);
        await Promise.all(records.map(r => ctx.db.delete(r._id)));
        hasMore = records.length === 500;
      }
    }
    return { success: true };
  }
});
```

### 2. Frontend: Dialog xác nhận 2 bước

**Bước 1:** Confirm dialog thông thường
> "Bạn chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu? Hành động này KHÔNG THỂ hoàn tác!"

**Bước 2:** Form nhập text xác nhận
> Input: Gõ "CHAC CHAN" để xác nhận
> - Nút Submit chỉ enable khi nhập đúng "CHAC CHAN"
> - Case-insensitive (chấp nhận "chac chan", "Chac Chan"...)

### 3. UI trong QuickActionsCard

```
┌─────────────────────────────────────────┐
│ ⚠️ Factory Reset                        │
│ Xóa sạch TOÀN BỘ dữ liệu trong hệ thống │
│                                         │
│ [🔴 Factory Reset]                      │
└─────────────────────────────────────────┘
```

### 4. Files thay đổi

| Action | File |
|--------|------|
| UPDATE | `convex/seedManager.ts` - thêm `factoryReset` mutation |
| ADD | `components/data/FactoryResetDialog.tsx` - dialog 2 bước |
| UPDATE | `components/data/QuickActionsCard.tsx` - thêm nút |
| UPDATE | `components/data/DataCommandCenter.tsx` - handle + state |
| UPDATE | `components/data/index.ts` - export mới |

### 5. Flow UX

```
Click "Factory Reset" 
    → Dialog 1: "Chắc chắn xóa?" [Hủy] [Tiếp tục]
        → Dialog 2: Input "CHAC CHAN" + [Xóa sạch] (disabled until match)
            → Loading... → Toast success/error
```
