## Audit Summary

**Triệu chứng:** Tại `/admin/categories`, khi feature `enableCategoryHierarchy` bật, danh mục hiển thị theo order/sort thủ công, không tự động sắp xếp theo cấu trúc cây (cha → con → cháu).

**Gap cụ thể:**
- `useSortableData` sort theo field đơn (name, slug, count, active) không biết về `parentId`
- Danh mục con có thể nằm xa danh mục cha trong list, gây khó đọc
- Không có logic "tree-aware sorting" để nhóm cha-con lại gần nhau

**Evidence:**
- Line 148: `const sortedData = useSortableData(categories, sortConfig);` — sort flat, không biết hierarchy
- `useSortableData` trong `TableUtilities.tsx` chỉ so sánh `aVal < bVal` theo 1 field

---

## Root Cause Confidence: High

Frontend có đủ data (`parentId`, `parentNameMap`) nhưng **logic sort không tree-aware**. Khi user click sort "Tên danh mục", kết quả là alphabetical flat, không group cha-con.

---

## Proposal

### Cách tiếp cận

**Khi `hierarchyEnabled = true` và user KHÔNG sort thủ công (sortConfig.key === null):**
- Tự động áp dụng "tree sort": cha → con (theo order) → cháu (theo order)
- Khi user click sort column → tắt tree sort, dùng flat sort như cũ
- Khi user reset filters → quay về tree sort mặc định

---

## Options

### Option A — Tree sort mặc định khi hierarchy ON (Recommend) — Confidence 90%

**Logic:**
1. Khi `hierarchyEnabled = true` và `sortConfig.key === null`:
   - Build tree structure từ `categories` (dùng `parentId`)
   - Flatten tree theo thứ tự DFS: root[0] → children[0] → grandchildren → children[1] → ... → root[1]
   - Mỗi level sort theo `order` field (hoặc `name` nếu không có order)
2. Khi user click sort column → `sortConfig.key !== null` → dùng flat sort như cũ
3. Khi user reset filters → set `sortConfig.key = null` → quay về tree sort

**Visual:**
```
Khi hierarchy OFF hoặc user đã sort:
- Áo khoác
- Điện thoại
- Điện tử
- iPhone
- Laptop

Khi hierarchy ON + chưa sort (tree sort):
- Điện tử (cha)
  ↳ Điện thoại (con)
    ↳ iPhone (cháu)
  ↳ Laptop (con)
- Áo khoác (cha)
```

**Thay đổi:**
- Thêm helper function `buildTreeSortedList(categories, parentNameMap)` trước `useSortableData`
- Logic:
  ```ts
  const treeSortedCategories = useMemo(() => {
    if (!hierarchyEnabled || sortConfig.key !== null) {
      return categories; // flat sort sẽ xử lý
    }
    // Build tree + flatten DFS
    const roots = categories.filter(c => !c.parentId);
    const childrenMap = new Map<string, typeof categories>();
    categories.forEach(c => {
      if (c.parentId) {
        const list = childrenMap.get(c.parentId) || [];
        list.push(c);
        childrenMap.set(c.parentId, list);
      }
    });
    const result: typeof categories = [];
    const dfs = (node: typeof categories[0]) => {
      result.push(node);
      const children = childrenMap.get(node._id) || [];
      children.sort((a, b) => a.order - b.order); // sort con theo order
      children.forEach(dfs);
    };
    roots.sort((a, b) => a.order - b.order); // sort cha theo order
    roots.forEach(dfs);
    return result;
  }, [categories, hierarchyEnabled, sortConfig.key]);

  const sortedData = useSortableData(treeSortedCategories, sortConfig);
  ```

**Trade-off:**
- ✅ UX tốt: mặc định tree, user vẫn sort được khi cần
- ✅ Không conflict với pagination/filter (tree sort chỉ áp dụng trên data đã filter)
- ⚠️ Phức tạp hơn một chút (thêm ~30 lines logic)
- ⚠️ Nếu có >1000 categories, tree build có thể chậm (nhưng đã có limit 1000 ở query)

---

### Option B — Thêm toggle "Tree view" / "Flat view" — Confidence 60%

Thêm button toggle để user chọn giữa tree sort và flat sort.

**Trade-off:**
- ✅ Rõ ràng, user control hoàn toàn
- ❌ Thêm UI clutter, thêm state management
- ❌ Không phù hợp với KISS: user phải click thêm 1 bước để thấy tree

---

### Option C — Không làm gì, giữ nguyên flat sort — Confidence 30%

Giữ nguyên, user tự sort theo `order` field nếu muốn group cha-con.

**Trade-off:**
- ✅ Đơn giản nhất
- ❌ UX kém: user phải manually set order cho từng category để group cha-con
- ❌ Không tận dụng được hierarchy data đã có

---

## Chi tiết thực thi Option A

### Files thay đổi: 1 file

**`app/admin/categories/page.tsx`**

1. **Thêm tree sort logic** sau line 136 (sau `hierarchyEnabled`):
   ```ts
   const treeSortedCategories = useMemo(() => {
     if (!hierarchyEnabled || sortConfig.key !== null) {
       return categories;
     }
     const roots = categories.filter(c => !c.parentId);
     const childrenMap = new Map<string, typeof categories>();
     categories.forEach(c => {
       if (c.parentId) {
         const list = childrenMap.get(c.parentId) || [];
         list.push(c);
         childrenMap.set(c.parentId, list);
       }
     });
     const result: typeof categories = [];
     const dfs = (node: typeof categories[0]) => {
       result.push(node);
       const children = childrenMap.get(node._id) || [];
       children.sort((a, b) => a.order - b.order);
       children.forEach(dfs);
     };
     roots.sort((a, b) => a.order - b.order);
     roots.forEach(dfs);
     return result;
   }, [categories, hierarchyEnabled, sortConfig.key]);
   ```

2. **Thay đổi input của `useSortableData`** (line 148):
   ```ts
   const sortedData = useSortableData(treeSortedCategories, sortConfig);
   ```

3. **Cập nhật `handleResetFilters`** để reset về tree sort:
   ```ts
   const handleResetFilters = () => {
     setSearchTerm('');
     setDebouncedSearchTerm('');
     setCurrentPage(1);
     setPageSizeOverride(null);
     setSortConfig({ key: null, direction: 'asc' }); // reset sort
     applyManualSelection([]);
   };
   ```

---

## Verification Plan

- **Typecheck:** `npx tsc --noEmit` pass
- **Repro khi hierarchy OFF:** List sort theo column click, không có tree behavior
- **Repro khi hierarchy ON + chưa sort:** Danh mục tự động group cha → con → cháu theo order
- **Repro khi hierarchy ON + user click sort "Tên":** Flat alphabetical sort, không group
- **Repro khi user reset filters:** Quay về tree sort mặc định
- **Edge case:** Category có `parentId` nhưng parent không tồn tại → hiển thị ở root level (orphan)