# Templates (safe-by-default)

## Module list pagination (default + max clamp)

```tsx
const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'posts' });
const itemsPerPage = useMemo(() => {
  const setting = settingsData?.find(s => s.settingKey === 'postsPerPage');
  const raw = (setting?.value as number) || 20;
  return Math.min(Math.max(raw, 10), 100);
}, [settingsData]);

const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
const paginatedItems = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return sortedItems.slice(start, start + itemsPerPage);
}, [sortedItems, currentPage, itemsPerPage]);
```

## Create/Edit page conditional fields

```tsx
const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'posts' });
const enabledFields = useMemo(() => new Set(fieldsData?.map(f => f.fieldKey)), [fieldsData]);

{enabledFields.has('excerpt') && (
  <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
)}
```

## Experience shell (save contract)

```tsx
return (
  <div className="max-w-7xl mx-auto space-y-6 pb-20">
    {/* Header + Save (hasChanges + useExperienceSave) */}
    {/* Settings cards */}
    {/* Preview card (LayoutTabs + DeviceToggle) */}
  </div>
);
```

## Home component style fallback order

```tsx
if (style === 'grid') return <Grid />;
if (style === 'minimal') return <Minimal />;
return <Default />;
```

## Preview action button safety

```tsx
<button type="button" onClick={onPreview}>Preview</button>
```

## Seed + Clear (idempotent + cleanup + relations)

> [!NOTE]
> **SEED/CLEAR EXCEPTION**: Đây là EXCEPTION duy nhất dành cho các tác vụ reset seed data cô lập. Tuyệt đối không sao chép direct delete `ctx.storage.delete` sang các business mutations thông thường. Các business mutations bắt buộc phải sử dụng FLS (File Lifecycle Service) safe references sync & cleanup gateway.

```ts
const existing = await ctx.db.query('posts').first();
if (existing) return null;

const images = await ctx.db.query('images')
  .withIndex('by_folder', q => q.eq('folder', 'posts'))
  .collect();

for (const img of images) {
  try { await ctx.storage.delete(img.storageId); } catch {}
  await ctx.db.delete(img._id);
}
```

## Anti-pattern → Fix nhanh

### 1) Fetch all rồi filter JS

**Before**
```ts
const items = await ctx.db.query('posts').collect();
return items.filter(i => i.status === 'published');
```

**After**
```ts
return await ctx.db.query('posts')
  .withIndex('by_status', q => q.eq('status', 'published'))
  .take(20);
```

### 2) Fallback return che mất style

**Before**
```tsx
return <Default />;
if (style === 'grid') return <Grid />;
```

**After**
```tsx
if (style === 'grid') return <Grid />;
return <Default />;
```

### 3) Clear thiếu storage cleanup

**Before**
```ts
await ctx.db.delete(img._id);
```

**After**
```ts
await ctx.storage.delete(img.storageId);
await ctx.db.delete(img._id);
```
