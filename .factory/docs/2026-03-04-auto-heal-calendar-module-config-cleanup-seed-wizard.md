
# Spec: Auto-heal Calendar Module Config + Cleanup Seed Wizard

**Vấn đề:** `moduleFields` / `moduleFeatures` / `moduleSettings` trong DB còn data cũ (priority, rrule, assignee, notes...). Auto-heal hiện tại chỉ chạy khi `fieldsData.length === 0` — nên không bao giờ heal data thừa.

**Giải pháp:** Hook detect field "orphan" (field trong DB nhưng không có trong `calendar.config.ts`) → auto-reset toàn bộ config module calendar → seed lại.

---

## Các file cần thay đổi

1. `convex/admin/modules.ts` — thêm mutation `resetModuleConfig`
2. `lib/modules/hooks/useModuleConfig.ts` — thêm logic auto-heal cho calendar orphan fields
3. `components/data/SeedWizardDialog.tsx` — ẩn bước `calendarConfig`
4. `components/data/seed-wizard/types.ts` — bỏ các key cũ trong `calendarFeatures`

---

## Bước 1 — `convex/admin/modules.ts`: Thêm mutation `resetModuleConfig`

Mutation xóa sạch toàn bộ `moduleFields`, `moduleFeatures`, `moduleSettings` của 1 module, sau đó gọi lại seedAllModulesConfig sẽ re-seed (hoặc để hook gọi sau).

```ts
export const resetModuleConfig = mutation({
  args: { moduleKey: v.string() },
  handler: async (ctx, args) => {
    // Xóa fields
    const fields = await ctx.db
      .query('moduleFields')
      .withIndex('by_module', q => q.eq('moduleKey', args.moduleKey))
      .collect();
    for (const f of fields) { await ctx.db.delete(f._id); }

    // Xóa features
    const features = await ctx.db
      .query('moduleFeatures')
      .withIndex('by_module', q => q.eq('moduleKey', args.moduleKey))
      .collect();
    for (const f of features) { await ctx.db.delete(f._id); }

    // Xóa settings
    const settings = await ctx.db
      .query('moduleSettings')
      .withIndex('by_module', q => q.eq('moduleKey', args.moduleKey))
      .collect();
    for (const s of settings) { await ctx.db.delete(s._id); }

    return null;
  },
  returns: v.null(),
});
```

---

## Bước 2 — `lib/modules/hooks/useModuleConfig.ts`: Auto-heal orphan fields cho calendar

**Logic:** Sau khi `fieldsData` load xong, nếu `moduleKey === 'calendar'`, kiểm tra xem DB có field nào **không** nằm trong danh sách field hợp lệ → nếu có thì reset + seed lại.

**Danh sách field hợp lệ của calendar** (derived từ `calendar.config.ts`):
```ts
const CALENDAR_VALID_FIELDS = new Set(['title', 'status', 'dueDate', 'customerId', 'productId']);
```

**Thêm vào hook:**

```ts
// Thêm mutation
const resetModuleConfig = useMutation(api.admin.modules.resetModuleConfig);

// Thêm ref
const hasMigratedOrphanRef = useRef(false);

// Thêm useEffect sau các useEffect hiện tại
useEffect(() => {
  if (moduleKey !== 'calendar') { return; }
  if (!fieldsData || hasMigratedOrphanRef.current) { return; }
  if (isModuleDisabled) { return; }

  const VALID_FIELDS = new Set(['title', 'status', 'dueDate', 'customerId', 'productId']);
  const hasOrphan = fieldsData.some(f => !VALID_FIELDS.has(f.fieldKey));
  if (!hasOrphan) { return; }

  hasMigratedOrphanRef.current = true;
  const run = async () => {
    try {
      await resetModuleConfig({ moduleKey: 'calendar' });
      // Sau khi xóa, fieldsData sẽ trở về 0 → auto-heal cũ sẽ tự seed lại
      hasMigratedOrphanRef.current = false; // reset để auto-heal cũ kích hoạt
    } catch (error) {
      hasMigratedOrphanRef.current = false;
      console.error('[ModuleConfig] Auto-heal calendar orphan thất bại', error);
    }
  };
  void run();
}, [moduleKey, fieldsData, isModuleDisabled, resetModuleConfig]);
```

> **Lưu ý quan trọng:** Sau khi `resetModuleConfig` chạy xong, `fieldsData` sẽ về `[]` (Convex reactive). Auto-heal hiện tại (`fieldsData.length === 0`) sẽ tự kick in gọi `seedAllModulesConfig`. Không cần gọi seed thủ công trong effect này.

**Xóa 2 useEffect migration cũ không còn cần thiết:**
- `hasMigratedPriorityRef` effect (migrate `priority` field required)  
- `hasMigratedPrioritySystemRef` effect (migrate `priority` field isSystem)

---

## Bước 3 — `components/data/SeedWizardDialog.tsx`: Ẩn bước `calendarConfig`

Bước `calendarConfig` trong wizard dùng `CalendarFeatureStep` với các feature đã bỏ. Chỉ cần **không push 'calendarConfig' vào `steps`** nữa — phần toggle feature tương ứng sau `seedBulk` cũng không còn cần thiết.

**Trong `steps` useMemo:**
```ts
// XÓA đoạn này:
if (hasCalendar) {
  list.push('calendarConfig');
}
```

**Trong handleSeed (sau seedBulk):**
```ts
// XÓA đoạn này:
if (hasCalendar) {
  await Promise.all(
    Object.entries(state.calendarFeatures).map(([featureKey, enabled]) =>
      toggleModuleFeature({ enabled, featureKey, moduleKey: 'calendar' })
    )
  );
}
```

> Import `CalendarFeatureStep` và `handleCalendarFeatureChange` giữ lại hay xóa tùy — nếu không có gì khác dùng thì xóa cả 2 để sạch code.

---

## Bước 4 — `components/data/seed-wizard/types.ts`: Bỏ `calendarFeatures` nếu không còn dùng

Kiểm tra `WizardState.calendarFeatures` — nếu sau khi xóa usage trong SeedWizardDialog không còn được tham chiếu ở đâu khác → xóa field này khỏi `WizardState`.

---

## Checklist

- [ ] `convex/admin/modules.ts`: thêm mutation `resetModuleConfig`
- [ ] `lib/modules/hooks/useModuleConfig.ts`: thêm auto-heal orphan + xóa 2 effect migrate priority cũ
- [ ] `components/data/SeedWizardDialog.tsx`: bỏ bước `calendarConfig` và code toggle calendar features
- [ ] `components/data/seed-wizard/types.ts`: bỏ `calendarFeatures` trong `WizardState`
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
