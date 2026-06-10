## Audit Summary

**Triệu chứng:** `/admin/categories` hiển thị flat list, không có visual nào cho biết danh mục nào là cha/con khi feature `enableCategoryHierarchy` được bật tại `/system/modules/products`.

**Gap cụ thể:**
- `listAdminWithOffset` chỉ trả về raw docs, không resolve `parentId` → tên cha
- Page không query trạng thái feature `enableCategoryHierarchy`
- Table column "Tên danh mục" render đồng nhất tất cả, không phân biệt cha/con

---

## Root Cause Confidence: High

Feature hierarchy **đã hoàn chỉnh ở backend** (schema có `parentId`, index `by_parent`, mutation check `hierarchyEnabled`), nhưng **frontend admin list hoàn toàn bỏ qua thông tin này**.

---

## Proposal

### Cách tiếp cận

**Cần thêm 2 điều vào `/admin/categories/page.tsx`:**

1. **Query trạng thái feature** `enableCategoryHierarchy` từ `api.admin.modules.getFeatureStatus` (hoặc pattern tương tự đã dùng trong các page khác)
2. **Khi hierarchy enabled:** hiển thị thêm thông tin cha-con trong bảng

---

## Options

### Option A — Thêm column "Danh mục cha" (Recommend) — Confidence 85%

Thêm 1 column mới `parentName` vào bảng. Khi một row có `parentId`, hiển thị tên danh mục cha bằng cách:
- Dùng `listAll` (đã query) để build `categoryNameMap: Record<id, name>`
- Danh mục cha → không có badge, icon `FolderTree` màu đậm
- Danh mục con → có badge nhỏ hoặc text mờ hiển thị "↳ [Tên cha]" trong cùng cell "Tên danh mục" (sub-text), hoặc column riêng

**Visual cụ thể trong cell "Tên danh mục":**
```
┌──────────────────────────────┐
│ 📁 Điện tử                   │  ← cha (không có sub-text)
│ ↳ Điện thoại  [con]          │  ← con, indent nhẹ + badge "con"
│   ↳ iPhone    [con]          │  ← cháu, indent sâu hơn
└──────────────────────────────┘
```

Khi `hierarchyEnabled = false` → column/badge ẩn, UI giữ nguyên như cũ.

**Thay đổi:**
- `page.tsx`: query `api.admin.modules.listModuleFeatures` (hoặc `getFeatureEnabled`) để lấy `hierarchyEnabled`
- Build `categoryNameMap` từ `categoriesData` (đã có `listAll`)
- Thêm sub-text trong cell `name`: nếu `cat.parentId`, render `↳ {parentName}` với `text-xs text-slate-400 mt-0.5`
- Thêm badge `Danh mục con` nhỏ (variant `outline`, size nhỏ) cạnh tên nếu có cha

**Trade-off:** Đơn giản, không cần query thêm DB, dùng lại `listAll` đã có. Chỉ hiệu quả với ít categories (≤100); với dữ liệu lớn thì `listAll` đã bị limit 100.

---

### Option B — Tree view grouping (collapsible) — Confidence 55%

Tổ chức lại data thành cây cha-con, render theo nhóm có thể collapse.

**Trade-off:** Phức tạp hơn nhiều, conflict với sort/filter/pagination hiện tại, không phù hợp với codebase KISS. Chỉ nên dùng nếu có >3 tầng category và admin cần quản lý cấu trúc cây thường xuyên.

---

## Chi tiết thực thi Option A

### Files thay đổi: 1 file duy nhất

**`app/admin/categories/page.tsx`**

1. **Query feature status** (dùng pattern giống `post-categories/page.tsx` với `listEnabledModuleFields`, hoặc query trực tiếp `moduleFeatures`):
   ```ts
   const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'products' });
   const hierarchyEnabled = featuresData?.find(f => f.featureKey === 'enableCategoryHierarchy')?.enabled ?? false;
   ```

2. **Build parentNameMap** từ `listAll` (đã có query, rename sang `allCategoriesData`):
   ```ts
   const parentNameMap = useMemo(() => {
     const map: Record<string, string> = {};
     allCategoriesData?.forEach(cat => { map[cat._id] = cat.name; });
     return map;
   }, [allCategoriesData]);
   ```

3. **Cập nhật cell "Tên danh mục":**
   ```tsx
   <div className="flex flex-col gap-0.5">
     <div className="flex items-center gap-2">
       <FolderTree size={16} className={cat.parentId ? "text-slate-400" : "text-orange-500"} />
       <span>{cat.name}</span>
       {hierarchyEnabled && cat.parentId && (
         <Badge variant="outline" className="text-xs py-0 px-1.5 font-normal">Con</Badge>
       )}
     </div>
     {hierarchyEnabled && cat.parentId && (
       <span className="text-xs text-slate-400 pl-6">
         ↳ {parentNameMap[cat.parentId] ?? 'Không rõ cha'}
       </span>
     )}
   </div>
   ```

4. **Kiểm tra API tồn tại** `api.admin.modules.listModuleFeatures` — nếu không có, dùng query khác phù hợp pattern hiện có.

---

## Verification Plan

- **Typecheck:** `bunx tsc --noEmit` sau khi sửa
- **Repro khi hierarchy OFF:** UI giống hệt hiện tại, không có badge/sub-text
- **Repro khi hierarchy ON:** Danh mục có cha hiển thị "↳ [tên cha]" và badge "Con"; danh mục gốc giữ icon orange
- **Edge case:** `parentId` trỏ về ID không tồn tại trong `listAll` (do limit 100) → hiển thị fallback text "Không rõ cha"
