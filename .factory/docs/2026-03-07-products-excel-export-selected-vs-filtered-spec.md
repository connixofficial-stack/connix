## Audit Summary

### Pre-Audit
- Route theo URL bạn đưa: `http://localhost:3000/admin/products` → file chính `app/admin/products/page.tsx`.
- Evidence đã đọc:
  - `hasFilters = Boolean(resolvedSearch || filterCategory || filterStatus)`
  - Nút `Xuất theo lọc (Export Filtered)` đang `disabled={!hasFilters || excelActionState !== 'idle'}`
  - `handleExport('filter')` chỉ dùng bộ lọc (search/category/status), hoàn toàn không xét `selectedIds`.
  - Query backend export: `convex/products.ts:listAdminExport` chỉ nhận `{ search, categoryId, status, limit }`, chưa có nhánh export theo ids.
- Kết luận hiện trạng: tick chọn rời rạc không ảnh hưởng trạng thái nút “Xuất theo lọc”, đúng như bạn phản ánh.

### Root Cause (evidence-based)
1. **UI gating sai theo kỳ vọng nghiệp vụ mới**
   - Điều kiện enable của “Xuất theo lọc” chỉ dựa vào `hasFilters`, không dựa vào trạng thái chọn thủ công.
2. **Thiếu khái niệm “export scope” rõ ràng trong menu Excel**
   - Hiện có 2 scope: filter/all, chưa có scope selected.
   - Khi user đang chọn tay, UI không phân tách rõ hành động nào chạy theo filter, hành động nào chạy theo selected.
3. **Backend chưa hỗ trợ export theo selected ids**
   - `listAdminExport` chưa có args `ids`, nên chưa thể xuất đúng tập tick rời rạc.

### Counter-hypothesis check
- Giả thuyết đối chứng: bug do query backend đang lẫn selected ids.
- Loại trừ vì evidence cho thấy query export không nhận `selectedIds` nên không thể bị “lẫn”, mà là “không có mode selected”.

## Root Cause Confidence
- **High**
- Lý do: có evidence trực tiếp ở cả frontend condition và backend query args/handler.

## Problem Graph
1. [Export Excel ở products chưa đúng kỳ vọng khi tick rời rạc] <- depends on 1.1, 1.2, 1.3
   1.1 [UI không khóa Export Filtered khi có manual selection] <- ROOT
   1.2 [Thiếu action Export Selected trong Excel menu] <- ROOT
   1.3 [Backend export chưa có nhánh theo ids] <- ROOT

## Proposal (đã chốt theo yêu cầu của bạn)
Bạn đã chọn:
- Thêm riêng **“Xuất đã chọn”**
- **Disable “Xuất theo lọc”** khi đang tick thủ công
- Giữ limit export **5.000 mục**

### UX contract mới (rõ phạm vi, không nhập nhằng)
1. **Xuất theo lọc (Export Filtered)**
   - Chỉ bật khi:
     - Có filter (`hasFilters`)
     - Không có manual selection (`selectedIds.length === 0`)
     - `excelActionState === 'idle'`
   - Nếu đang chọn thủ công: disable + hint rõ lý do.
2. **Xuất đã chọn (Export Selected)**
   - Chỉ bật khi `selectedIds.length > 0` và `excelActionState === 'idle'`
   - Nếu `selectedIds.length > 5000`: disable + hint “Tối đa 5.000 mục, vui lòng giảm lựa chọn”.
3. **Xuất toàn bộ (Export All)**
   - Giữ nguyên (max 5.000) để không phá hành vi cũ.

### Microcopy recommend (ngắn, rõ)
- Disable filtered khi đang tick:
  - `Đang chọn thủ công, vui lòng Bỏ chọn tất cả để dùng Xuất theo lọc.`
- Export selected subtitle:
  - `Chỉ xuất các sản phẩm đang được tick trong danh sách.`
- Limit warning:
  - `Tối đa 5.000 mục mỗi lần export.`

## Step-by-step implementation plan

### 1) Frontend: mở rộng export mode và gating
**File:** `app/admin/products/page.tsx`

Thay đổi:
- Mở rộng state:
  - `exportMode: 'filter' | 'all' | 'selected' | null`
  - `excelActionState` thêm `'export-selected'`
- Thêm computed:
  - `hasManualSelection = selectedIds.length > 0`
  - `isFilteredExportDisabled = !hasFilters || hasManualSelection || excelActionState !== 'idle'`
  - `isSelectedExportDisabled = !hasManualSelection || selectedIds.length > 5000 || excelActionState !== 'idle'`
- Cập nhật `handleExport(mode)` để nhận `'selected'` và set state tương ứng.

### 2) Frontend: truyền selected ids vào query export khi mode=selected
**File:** `app/admin/products/page.tsx`

Thay đổi query `useQuery(api.products.listAdminExport, ...)`:
- Khi `exportMode === 'selected'` thì truyền:
  - `ids: selectedIds.slice(0, 5000)`
  - bỏ qua filter args.
- Khi `exportMode === 'filter'` giữ logic cũ.
- Khi `exportMode === 'all'` giữ logic cũ.

### 3) Frontend: cập nhật menu Excel actions
**File:** `app/admin/products/page.tsx`

Thay đổi UI section Export:
- Nút `Xuất theo lọc (Export Filtered)`:
  - dùng `isFilteredExportDisabled`
  - hiển thị hint disable khi có manual selection.
- Thêm nút mới `Xuất đã chọn (Export Selected)`:
  - gọi `handleExport('selected')`
  - loading state riêng theo `excelActionState === 'export-selected'`
  - subtitle nêu rõ scope selected.
- Giữ nút `Xuất toàn bộ (Export All)` như hiện tại.

### 4) Backend: hỗ trợ export theo ids
**File:** `convex/products.ts`

Thay đổi `listAdminExport`:
- Mở rộng args:
  - `ids: v.optional(v.array(v.id('products')))`
  - giữ `search/categoryId/status/limit` cho mode cũ.
- Handler:
  - Nếu có `ids` và `ids.length > 0`:
    - Lấy tối đa 5000 ids.
    - `Promise.all(ids.map(ctx.db.get))`, lọc null.
    - Sort theo `order desc` để nhất quán output.
    - Map về `productExportDoc` như hiện tại.
  - Nếu không có `ids` → chạy flow filter/all cũ.

### 5) Safety guard
**File:** `app/admin/products/page.tsx`
- Trước khi set `exportRequested` cho selected:
  - nếu `selectedIds.length > 5000` → toast.error + return.
- Khi `exportData.length === 0` giữ thông báo cũ.

## Verification Plan
1. Typecheck: `bunx tsc --noEmit`
2. Repro manual tại `/admin/products`:
   - Case A: có filter, chưa chọn gì → `Xuất theo lọc` bật, export đúng filtered.
   - Case B: tick rời rạc 2-3 dòng + có filter → `Xuất theo lọc` bị disable + hiện hint.
   - Case C: tick rời rạc → `Xuất đã chọn` bật, file chỉ chứa record đã tick.
   - Case D: chọn >5000 (select all large set) → `Xuất đã chọn` bị giới hạn đúng.
   - Case E: `Xuất toàn bộ` vẫn hoạt động như cũ.
3. Pass criteria:
   - Không còn ambiguity giữa filtered vs selected scope.
   - Không có regression cho import/template/export all.

## Post-Audit (blast radius / risk)
- Blast radius: thấp-trung bình (chủ yếu products page + 1 query convex).
- Regression risk: thấp nếu giữ mapping export row không đổi.
- KISS/YAGNI/DRY:
  - KISS: chỉ thêm đúng một scope mới cần thiết (`selected`).
  - YAGNI: không mở rộng cho module khác ở lần này.
  - DRY: tái dùng pipeline export hiện có, chỉ đổi nguồn dữ liệu.

## Chốt ngắn gọn
Spec này sẽ làm đúng ý bạn: khi tick rời rạc thì **không cho bấm “Xuất theo lọc”**, đồng thời có nút **“Xuất đã chọn”** riêng, giới hạn 5.000 mục để an toàn và nhất quán hệ thống.