## Problem Graph
1. [Main] UX chọn link menu chậm vì chỉ có ô URL text tự nhập <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Chưa tận dụng trạng thái module đang bật để gợi ý route phù hợp
      1.1.1 [ROOT CAUSE] /admin/menus chưa query `listEnabledModules` và chưa có mapping module→route site
   1.2 [Sub] Chưa có UI chọn nhanh (combobox) cho từng menu item
      1.2.1 [ROOT CAUSE] Item row chỉ có Input URL, không có picker/search gợi ý
   1.3 [Sub] Thiếu guardrail UX để vẫn nhập tay khi cần
      1.3.1 [ROOT CAUSE] Chưa có cơ chế “gợi ý + editable input” song song

## Execution (with reflection)
1. Solving 1.1.1 – Tạo nguồn dữ liệu route gợi ý theo module bật
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Thêm query `useQuery(api.admin.modules.listEnabledModules)`.
  - Tạo hằng `MODULE_SITE_ROUTE_CATALOG` (ngay trong file) gồm các route site công khai theo module key, ví dụ:
    - products: `/products`
    - posts: `/posts`
    - services: `/services`
    - promotions: `/promotions`
    - cart: `/cart`
    - wishlist: `/wishlist`
    - customers: `/account/login`, `/account/register`, `/account/profile`, `/account/orders`
    - orders: `/account/orders`, `/checkout`
    - menus/homepage/settings (nếu enabled): chỉ route chung `/`, `/contact` (theo yêu cầu chỉ public site routes)
  - Tạo danh sách `quickRouteOptions` bằng `useMemo`:
    - Luôn có core public routes: `/`, `/contact`.
    - Union thêm route từ module bật.
    - Deduplicate theo `url` (Set/Map), sort theo nhóm + label để tìm nhanh.
- Reflection: ✓ Valid vì tận dụng đúng dữ liệu system/modules và không đụng backend schema.

2. Solving 1.2.1 – Bổ sung combobox chọn nhanh URL cho từng item
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Trong mỗi row menu item, phần URL đổi thành cụm:
    - Input URL hiện tại (giữ nguyên editable).
    - Nút mở danh sách gợi ý (ví dụ nút “Gợi ý”).
    - Panel dropdown nhẹ (absolute) chứa:
      - ô filter text (tìm theo label/url/module)
      - list kết quả route gợi ý (click để set URL cho item)
  - State mới tại `MenuItemsEditor`:
    - `activeQuickPickerId: string | null`
    - `quickRouteSearch: string`
  - Logic lọc option theo search term bằng `useMemo`.
  - Khi chọn option:
    - gọi `handleUpdateField(item.localId, 'url', option.url)`
    - đóng picker
  - Cho phép click ngoài để đóng picker (handler document mousedown + cleanup).
- Reflection: ✓ Valid vì đúng yêu cầu “Combobox gõ để lọc + click chọn”, không phá flow cũ.

3. Solving 1.3.1 – Giữ UX linh hoạt và an toàn
- File: `app/admin/menus/page.tsx`
- Thay đổi:
  - Không khóa input tay: user vẫn sửa URL thủ công bất kỳ lúc nào.
  - Trong list gợi ý, chỉ render route từ module đang bật theo quyết định của bạn.
  - Nếu không có module tương ứng bật, vẫn giữ các route cơ bản (`/`, `/contact`) để tránh empty state khó dùng.
  - Thêm nhãn phụ nhỏ cho option (module nguồn) để user hiểu route đến từ đâu.
- Reflection: ✓ Valid vì vừa quick access vừa không chặn use case đặc biệt.

4. QA + verify theo rule repo
- Chạy: `bunx tsc --noEmit` (theo CLAUDE.md).
- Nếu pass, chuẩn bị commit.

5. Commit theo convention repo (không push)
- `git status`
- `git diff --cached` (soát secrets)
- add file thay đổi + add `.factory/docs` (nếu có)
- commit message đề xuất:
  - `feat(menus): add module-aware quick relative link picker`

## Chi tiết UX sẽ có sau khi implement
- Ở `/admin/menus`, mỗi menu item có:
  - ô URL nhập tay như cũ
  - combobox “gõ để lọc + click chọn” route relative
- Option chỉ lấy từ module đang bật + public route cơ bản theo yêu cầu.
- Mục tiêu đạt được: tạo menu nhanh hơn, giảm sai URL, vẫn linh hoạt nhập custom.

## Checklist triển khai
- [ ] Query enabled modules trong `/admin/menus`
- [ ] Mapping module → public site routes
- [ ] Build deduped quick options
- [ ] Thêm combobox picker cho mỗi item row
- [ ] Giữ editable input tay
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Commit local (không push)