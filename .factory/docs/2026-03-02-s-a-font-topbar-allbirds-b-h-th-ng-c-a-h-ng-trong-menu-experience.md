## Problem Graph
1. Đồng bộ UI topbar và loại bỏ "Hệ thống cửa hàng" <- depends on 1.1, 1.2
   1.1 Font topbar Allbirds đang khác 2 layout còn lại (uppercase + tracking lớn) ở cả preview/site
   1.2 "Hệ thống cửa hàng" còn tồn tại trong config type, default config, toggle editor, và render cả 3 layout (preview + site)

## Execution (with reflection)
1. Sửa model config để bỏ hẳn `showStoreSystem`
- File: `components/experiences/previews/HeaderMenuPreview.tsx`
  - Trong type `HeaderMenuConfig.topbar`: xoá field `showStoreSystem`.
  - Xoá toàn bộ điều kiện/render link store ở classic/topbar/allbirds.
- File: `components/site/Header.tsx`
  - Trong `TopbarConfig`: xoá `showStoreSystem`.
  - Trong `DEFAULT_CONFIG.topbar`: xoá default `showStoreSystem`.
  - Xoá toàn bộ render link store ở 3 layout.
- File: `app/system/experiences/menu/page.tsx`
  - Trong `DEFAULT_CONFIG.topbar`: xoá `showStoreSystem`.
  - Xoá ToggleRow "Hệ thống cửa hàng" khỏi panel cấu hình.
- Reflection: Cách này đảm bảo "bỏ hoàn toàn" cả toggle lẫn UI hiển thị, không còn nhánh logic rác.

2. Đồng bộ font topbar Allbirds giống 2 layout còn lại (preview + site)
- File: `components/experiences/previews/HeaderMenuPreview.tsx`
  - Ở `renderAllbirdsStyle`, đổi class topbar từ `text-[11px] uppercase tracking-[0.3em]` về cùng style topbar classic/topbar (`text-xs`, bỏ uppercase/tracking).
  - Nhóm link phụ đang `text-[10px] tracking-[0.2em]` đổi về kiểu chữ thường đồng bộ với 2 layout còn lại.
  - `announcementText` bỏ `font-medium` nếu cần để khớp độ đậm hiện tại của 2 layout.
- File: `components/site/Header.tsx`
  - Áp dụng đúng thay đổi tương tự ở nhánh Allbirds (site runtime).
- Reflection: Chỉ đụng class typography trong topbar allbirds, không ảnh hưởng nav/main header.

3. Dọn logic phân cách và điều kiện đi kèm
- Ở cả preview/site: thay các điều kiện kiểu `(showTrackOrder || showStoreSystem)` thành chỉ còn `showTrackOrder`.
- Xoá dấu `|` liên quan store để tránh divider thừa.
- Reflection: tránh bug UI do điều kiện cũ còn sót.

4. Kiểm tra kỹ thuật trước commit
- Chạy: `bunx tsc --noEmit` (đúng rule dự án).
- Soát nhanh route `/system/experiences/menu` với 3 tab layout để xác nhận:
  - Không còn toggle "Hệ thống cửa hàng".
  - Preview 3 layout không còn text/link store.
  - Allbirds topbar font đồng bộ với classic/topbar.
- Soát site header: nhánh allbirds/classic/topbar không còn store link.

5. Commit theo rule repo
- `git status` -> `git add` (bao gồm `.factory/docs` nếu có thay đổi phát sinh) -> `git diff --cached` kiểm tra secret -> commit message dạng:
  - `fix(menu-experience): unify allbirds topbar typography and remove store-system option`

Checklist kết quả mong đợi:
- [ ] Allbirds topbar font giống 2 layout còn lại ở preview.
- [ ] Allbirds topbar font giống 2 layout còn lại ở site.
- [ ] Không còn toggle "Hệ thống cửa hàng" trong `/system/experiences/menu`.
- [ ] Không còn render "Hệ thống cửa hàng/Cửa hàng" ở cả 3 layout preview + site.
- [ ] TypeScript pass và commit hoàn tất.