## Problem Graph
1. [Main] Ctrl+K ở /system đang là UI tĩnh, chưa tìm kiếm/điều hướng thật <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Header trong `app/system/layout.tsx` chỉ render input placeholder + badge Ctrl+K, không có state/global action/keyboard listener
   1.2 [Sub] Dữ liệu search chưa được hợp nhất: Modules đang từ Convex runtime (`api.admin.modules.listModules`), Experiences đang hardcode trong `app/system/experiences/page.tsx`
   1.3 [Sub] Chưa có component command palette dùng chung cho toàn `/system`

## Execution (with reflection)
1. Solving 1.1.1 (tạo command palette dùng chung cho System)
   - Thought: Tách logic search ra component riêng để layout chỉ giữ vai trò host.
   - Action:
     - Tạo mới `app/system/components/SystemGlobalSearch.tsx` (client component), gồm:
       - State mở/đóng palette (`open`), query (`query`), selected index cho keyboard nav.
       - Keyboard listener global: `Ctrl+K`/`Cmd+K` để toggle, `Esc` đóng, `Enter` điều hướng item đang focus.
       - Guard: không trigger khi đang focus `input/textarea/contentEditable` (tránh phá UX nhập liệu).
       - Router navigation qua `useRouter().push(result.href)` khi chọn kết quả.
     - UI dùng class Tailwind hiện có (không thêm thư viện mới), render popup overlay + danh sách kết quả nhóm theo loại.
   - Reflection: ✓ Phù hợp KISS/YAGNI, không hardcode hành vi trong layout.

2. Solving 1.2 (chuẩn hóa nguồn dữ liệu search runtime + static)
   - Thought: Modules phải runtime từ Convex như anh chọn; Experiences có thể giữ static nhưng đưa về shared constant để tái sử dụng.
   - Action:
     - Tạo mới `app/system/experiences/_constants.ts` chứa mảng experiences (title/description/href/iconKey).
     - Cập nhật `app/system/experiences/page.tsx` dùng constant này thay vì khai báo inline.
     - Trong `SystemGlobalSearch.tsx`:
       - Dùng `useQuery(api.admin.modules.listModules)` lấy modules runtime.
       - Map module result: `{ type: 'module', title: module.name, subtitle: module.description, href: /system/modules/${module.key}, keywords: [module.key, module.category] }`.
       - Map experience result từ constant: `{ type: 'experience', title, subtitle, href }`.
       - Gộp 2 nguồn rồi filter client-side theo query (lowercase + includes title/subtitle/keywords).
       - Giới hạn hiển thị top N (ví dụ 20) để nhẹ UI.
   - Reflection: ✓ Đúng yêu cầu “global modules + experiences”, modules luôn theo DB runtime.

3. Solving 1.3 (gắn vào layout và thay phần set cứng)
   - Thought: Thay input tĩnh ở header bằng trigger thật nhưng vẫn giữ visual cũ.
   - Action:
     - Sửa `app/system/layout.tsx`:
       - Import `SystemGlobalSearch`.
       - Thay block search tĩnh hiện tại bằng `<SystemGlobalSearch />` (trigger giống style cũ + badge Ctrl+K).
       - Đảm bảo chạy trên mọi route `/system/*` trừ login (đã có wrapper check pathname).
   - Reflection: ✓ Scope đúng phần user yêu cầu, không lan sang admin/site.

4. i18n tối thiểu cho text mới
   - Thought: Tránh hardcode text trong component mới, giữ convention hiện tại.
   - Action:
     - Cập nhật `app/system/i18n/translations.ts` cho vi/en ở `header` (thêm key: `globalSearchPlaceholder`, `globalSearchNoResult`, `globalSearchModules`, `globalSearchExperiences`, `globalSearchHint`).
   - Reflection: ✓ Giữ consistency song ngữ.

5. Keyboard/UX acceptance criteria
   - Thought: Định nghĩa rõ để test nhanh và tránh regression.
   - Action (tiêu chí pass):
     - Ở bất kỳ `/system/*` (không phải login), nhấn `Ctrl+K` hoặc `Cmd+K` mở palette.
     - Gõ từ khóa khớp module (theo tên/description/key/category) và experience (title/description).
     - Enter item đầu hoặc click item => điều hướng đúng route.
     - Esc đóng palette; mở lại vẫn hoạt động.
     - Không chặn thao tác nhập khi con trỏ đang trong input/textarea.
   - Reflection: ✓ Bao phủ đúng “hoạt động cơ” + “search nhanh”.

6. Validation khi implement (theo rule repo)
   - Thought: Repo yêu cầu chỉ chạy typecheck trước commit khi thay đổi TS/code.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Nếu pass, commit thay đổi (không push) với message kiểu: `feat(system): enable Ctrl+K global search for modules and experiences`.
     - Khi commit sẽ add cả `.factory/docs` nếu có thay đổi theo rule AGENTS.
   - Reflection: ✓ Tuân thủ đúng guideline dự án.

Nếu anh duyệt spec này, em sẽ bắt đầu implement đúng các bước trên, không mở rộng thêm scope.