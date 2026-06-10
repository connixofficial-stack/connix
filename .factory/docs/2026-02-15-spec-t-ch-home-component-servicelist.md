## Problem Graph
1. [Main] Tách ServiceList khỏi monolithic edit/previews theo pattern Hero <- depends on 1.1, 1.2
   1.1 [Sub] Tạo module `service-list` đầy đủ types/constants/form/preview/edit-route <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Trích đúng logic ServiceList hiện tại (state, config, preview) từ `app/admin/home-components/[id]/edit/page.tsx` và `previews.tsx`
   1.2 [Sub] Cleanup & redirect khỏi route cũ + cập nhật import liên quan <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Loại bỏ ServiceList khỏi `previews.tsx` và cập nhật nơi dùng (create/edit)

## Execution (with reflection)
1. Solving 1.1.1 — Thu gom logic ServiceList hiện có
   - Thought: Cần giữ nguyên UI/behavior, chỉ tách cấu trúc module.
   - Action: Dựa trên phần `ServiceList` trong `app/admin/home-components/[id]/edit/page.tsx` (state, useMemo filter, render form, buildConfig) và preview tại `app/admin/home-components/previews.tsx`.
   - Reflection: ✓ Đủ dữ liệu để tái tạo module mới.

2. Solving 1.1 — Tạo module `app/admin/home-components/service-list/`
   - Thought: Theo pattern Hero/Stats: `_types`, `_lib`, `_components`, route edit riêng.
   - Action:
     1) Tạo `app/admin/home-components/service-list/_types/index.ts`
        - Định nghĩa `ServiceListStyle = 'grid' | 'bento' | 'list' | 'carousel' | 'minimal' | 'showcase'`.
        - Định nghĩa `ServiceListPreviewItem` (id, name, image?, price?, description?, tag?).
        - (Tuỳ chọn) `ServiceSelectionMode = 'auto' | 'manual'` và type config nếu cần.
     2) Tạo `app/admin/home-components/service-list/_lib/constants.ts`
        - `DEFAULT_SERVICE_LIST_CONFIG = { itemCount: 8, sortBy: 'newest', selectionMode: 'auto' }`.
        - `SERVICE_LIST_STYLES = [{ id:'grid', label:'Grid' }, ...]` để dùng cho preview (không đổi hành vi).
     3) Tạo `app/admin/home-components/service-list/_components/ServiceListPreview.tsx`
        - Di chuyển toàn bộ preview từ `previews.tsx`.
        - Dùng shared: `PreviewWrapper`, `BrowserFrame`, `PreviewImage`, `usePreviewDevice`.
        - Import types từ `_types` và styles list từ `_lib/constants`.
        - Giữ nguyên UI/logic render (grid/bento/list/carousel/minimal/showcase) và helper (ServiceBadge, formatServicePrice).
     4) Tạo `app/admin/home-components/service-list/_components/ServiceListForm.tsx`
        - Cắt đúng phần form ServiceList (selection mode, auto settings, manual list + search) từ edit cũ.
        - Props gợi ý:
          - `selectionMode`, `onSelectionModeChange`
          - `itemCount`, `sortBy`, `onItemCountChange`, `onSortByChange`
          - `filteredServices`, `selectedServices`, `selectedServiceIds`, `onToggleService`
          - `serviceSearchTerm`, `onServiceSearchTermChange`
        - UI giữ nguyên className/logic.
     5) Tạo route `app/admin/home-components/service-list/[id]/edit/page.tsx`
        - Pattern giống `hero/[id]/edit/page.tsx` + `stats/[id]/edit/page.tsx`.
        - `useQuery` load component; nếu type != 'ServiceList' thì `router.replace(`/admin/home-components/${id}/edit?type=${component.type.toLowerCase()}`)`.
        - Query services: `api.services.listAll` limit 100; `useMemo` filtered/selected.
        - State: `title`, `active`, `serviceListStyle`, `serviceSelectionMode`, `selectedServiceIds`, `serviceSearchTerm`, `serviceListConfig { itemCount, sortBy }`.
        - Submit: `updateMutation({ id, title, active, config: { itemCount, sortBy, style: serviceListStyle, selectionMode, selectedServiceIds: selectionMode === 'manual' ? selectedServiceIds : [] } })`.
        - Layout 2 cột (form trái, preview phải sticky) và toast message giống cũ.
   - Reflection: ✓ Module mới đầy đủ theo pattern Hero, giữ nguyên behavior ServiceList.

3. Solving 1.2.1 — Cleanup preview cũ & cập nhật nơi dùng
   - Thought: Sau khi tách preview, cần tránh duplicate export và cập nhật import.
   - Action:
     1) `app/admin/home-components/previews.tsx`
        - Xoá `ServiceListStyle`, `ServiceListPreviewItem`, `ServiceListPreview` và helpers (ServiceBadge, formatServicePrice).
     2) `app/admin/home-components/create/product-list/page.tsx`
        - Đổi import `ServiceListPreview`, `ServiceListStyle`, `ServiceListPreviewItem` sang module mới (`../../service-list/_components/ServiceListPreview` và `../../service-list/_types`).
     3) `app/admin/home-components/[id]/edit/page.tsx`
        - Xoá import `ServiceListPreview` và `ServiceListStyle` từ `../../previews`.
   - Reflection: ✓ Không còn phụ thuộc ServiceList trong `previews.tsx`.

4. Solving 1.2 — Redirect & cleanup trong edit cũ
   - Thought: Route cũ chỉ làm redirect cho ServiceList giống Hero/Stats.
   - Action:
     1) `app/admin/home-components/[id]/edit/page.tsx`
        - Bỏ: `servicesData` query, `filteredServices/selectedServices` memo, states `serviceListStyle`, `serviceSelectionMode`, `selectedServiceIds`, `serviceSearchTerm`, case `ServiceList` trong `buildConfig`, và block render form/preview ServiceList.
        - Thêm redirect:
          - Trong effect `typeParam`: nếu `typeParam?.toLowerCase() === 'servicelist'` thì `router.replace('/admin/home-components/service-list/${id}/edit')`.
          - Trong effect theo `component?.type`: nếu `component.type === 'ServiceList'` thì redirect tương tự.
        - Điều kiện hiển thị "Đang chuyển hướng..." bổ sung `servicelist`.
   - Reflection: ✓ Route cũ trở thành điểm chuyển hướng, không còn logic ServiceList.

## Notes / Constraints
- Làm đúng phạm vi tách ServiceList, không đổi UI/behavior.
- Không chạy `bunx oxlint`, `bun run lint`, `bunx tsc --noEmit` và **không commit** theo yêu cầu.

Nếu OK, mình sẽ bắt đầu implement theo spec này.