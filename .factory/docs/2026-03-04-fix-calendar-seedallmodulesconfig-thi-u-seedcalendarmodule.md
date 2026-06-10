
# Spec: Fix Calendar Module Config — "Trường Calendar" trắng trơn

## Root Cause (DARE)

```
1. [Main] "Trường Calendar" trắng trơn
   1.1 [ROOT CAUSE] seedAllModulesConfig KHÔNG gọi seedCalendarModule
       → Dù auto-heal trigger seedAllModulesConfig, calendar vẫn không được seed fields/features/settings
   1.2 [Sub] Hai path đều bị ảnh hưởng:
       - DB trắng → auto-heal trigger → seedAllModulesConfig → calendar bị bỏ qua → trắng
       - DB có orphan fields → resetModuleConfig xóa → auto-heal lại → cùng vấn đề
```

---

## Fix — 1 thay đổi duy nhất

**File:** `convex/seed.ts`  
**Hàm:** `seedAllModulesConfig` (action, dòng ~3200)

Thêm `await ctx.runMutation(api.seed.seedCalendarModule, configArgs);` vào danh sách.

Trước:
```ts
await ctx.runMutation(api.seed.seedServicesModule, configArgs);
return null;
```

Sau:
```ts
await ctx.runMutation(api.seed.seedServicesModule, configArgs);
await ctx.runMutation(api.seed.seedCalendarModule, configArgs);
return null;
```

> **Lưu ý:** Cần xác nhận `seedCalendarModule` mutation tồn tại trong `seed.ts`. Nếu chưa có, cần tạo mutation đó gọi `CalendarSeeder.seedModuleConfig()` với `configOnly: true`.

---

## Kiểm tra thêm — `seedCalendarModule` mutation có tồn tại không?

Dựa trên pattern của các module khác (`seedPostsModule`, `seedProductsModule`...), cần tìm xem `seedCalendarModule` đã được định nghĩa trong `seed.ts` hay chưa.

Nếu **chưa có**, cần thêm mutation:

```ts
export const seedCalendarModule = mutation({
  args: { configOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const seeder = new CalendarSeeder(ctx);
    if (args.configOnly) {
      await seeder['seedModuleConfig']();
      return null;
    }
    // full seed nếu cần
    return null;
  },
  returns: v.null(),
});
```

Nhưng `seedModuleConfig` là `private` trong CalendarSeeder — cần đổi thành `protected` hoặc `public`, hoặc dùng cách khác.

**Cách đơn giản hơn (KISS):** Inline logic seed config trực tiếp vào mutation (giống pattern các module khác trong seed.ts).

---

## Checklist

- [ ] Kiểm tra `seedCalendarModule` có trong `seed.ts` chưa
- [ ] Nếu chưa: thêm `export const seedCalendarModule` mutation (inline seedModuleConfig logic)
- [ ] Thêm call `await ctx.runMutation(api.seed.seedCalendarModule, configArgs)` vào `seedAllModulesConfig`
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
