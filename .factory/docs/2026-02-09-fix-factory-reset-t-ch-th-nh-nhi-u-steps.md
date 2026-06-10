## Vấn đề

Convex giới hạn **4096 reads/function**. Với 49 tables và mỗi table có thể có nhiều records, việc xóa trong 1 lần gọi vượt quá giới hạn.

## Giải pháp: Tách thành nhiều mutation calls

Thay vì xóa tất cả trong 1 mutation, tách thành:
1. `factoryResetStep` - xóa 1 table, trả về table tiếp theo cần xóa
2. Frontend loop gọi `factoryResetStep` cho đến khi hết

### Backend: `convex/seedManager.ts`

```ts
export const factoryResetStep = mutation({
  args: {
    tableIndex: v.optional(v.number()), // null = bắt đầu từ đầu
  },
  handler: async (ctx, args) => {
    const tables: TableNames[] = [...]; // 49 tables, đã reverse
    
    const index = args.tableIndex ?? 0;
    if (index >= tables.length) {
      return { completed: true, nextIndex: null, table: null };
    }

    const table = tables[index];
    const records = await ctx.db.query(table).take(100); // batch nhỏ
    await Promise.all(records.map(r => ctx.db.delete(r._id)));

    // Nếu còn records trong table này, giữ nguyên index
    if (records.length === 100) {
      return { completed: false, nextIndex: index, table };
    }
    
    // Chuyển sang table tiếp theo
    return { completed: false, nextIndex: index + 1, table };
  }
});
```

### Frontend: Loop trong `DataCommandCenter.tsx`

```ts
const handleFactoryReset = async () => {
  setIsFactoryResetting(true);
  try {
    let nextIndex: number | null = 0;
    while (nextIndex !== null) {
      const result = await factoryResetStep({ tableIndex: nextIndex });
      if (result.completed) break;
      nextIndex = result.nextIndex;
    }
    toast.success('Đã xóa sạch toàn bộ dữ liệu');
    return true;
  } catch (error) {
    toast.error(...);
    return false;
  } finally {
    setIsFactoryResetting(false);
  }
};
```

## Files thay đổi

| Action | File |
|--------|------|
| UPDATE | `convex/seedManager.ts` - đổi `factoryReset` → `factoryResetStep` |
| UPDATE | `components/data/DataCommandCenter.tsx` - loop gọi step |
