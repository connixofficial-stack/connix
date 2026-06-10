## Problem Graph
1. [Main] Tách Blog home-component theo pattern Hero <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Xác định logic Blog hiện tại (types/config/form/preview)
   1.2 [Sub] Tạo module Blog mới theo feature-based pattern
   1.3 [Sub] Cleanup route cũ + previews + cập nhật imports

## Execution (with reflection)
1. Solving 1.1 — Khảo sát logic Blog hiện tại
   - Thought: Cần liệt kê đầy đủ state/config, logic chọn bài viết, preview đang dùng để tách không sót.
   - Action: Đọc `app/admin/home-components/[id]/edit/page.tsx` phần `component.type === 'Blog'` và state liên quan; đọc `app/admin/home-components/previews.tsx` phần `BlogPreview`.
   - Reflection: ✓ Đã xác định state `blogStyle`, `blogSelectionMode`, `selectedPostIds`, `postSearchTerm`, `productListConfig` (itemCount/sortBy), buildConfig & init config, query `api.posts.listAll` và lọc `Published`.

2. Solving 1.2 — Tạo module Blog mới
   - Thought: Cần tách types/constants/form/preview và route edit riêng, bám đúng pattern Hero/Stats.
   - Action (tạo cấu trúc):
     - `app/admin/home-components/blog/[id]/edit/page.tsx`
     - `app/admin/home-components/blog/_types/index.ts`
     - `app/admin/home-components/blog/_lib/constants.ts`
     - `app/admin/home-components/blog/_components/BlogPreview.tsx`
     - `app/admin/home-components/blog/_components/BlogForm.tsx`
   - Action (types – `_types/index.ts`):
     - Khai báo:
       ```ts
       export type BlogStyle = 'grid' | 'list' | 'featured' | 'magazine' | 'carousel' | 'minimal';
       export type BlogSelectionMode = 'auto' | 'manual';
       export interface BlogConfig {
         itemCount: number;
         sortBy: 'newest' | 'popular' | 'random';
         style: BlogStyle;
         selectionMode: BlogSelectionMode;
         selectedPostIds: string[];
       }
       export interface BlogPreviewItem {
         id: string | number;
         title: string;
         excerpt?: string;
         thumbnail?: string;
         date?: string;
         category?: string;
         readTime?: string;
         views?: number;
       }
       ```
   - Action (constants – `_lib/constants.ts`):
     - `BLOG_STYLES` cho PreviewWrapper (label y như hiện tại: Grid/List/Featured/Magazine/Carousel/Minimal).
     - `DEFAULT_BLOG_CONFIG` = `{ itemCount: 8, sortBy: 'newest', selectionMode: 'auto', selectedPostIds: [], style: 'grid' }`.
   - Action (Preview – `_components/BlogPreview.tsx`):
     - Di chuyển logic `BlogPreview` từ `previews.tsx` sang file mới.
     - Thay `PreviewWrapper`, `BrowserFrame`, `PreviewImage` sang dùng shared:
       - `app/admin/home-components/_shared/components/PreviewWrapper`
       - `app/admin/home-components/_shared/components/BrowserFrame`
       - `app/admin/home-components/_shared/components/PreviewImage`
       - `app/admin/home-components/_shared/hooks/usePreviewDevice` (+ `deviceWidths` nếu cần)
     - Giữ nguyên UI/logic render (grid/list/featured/magazine/carousel/minimal), mock data, `postCount`, `title`, `posts`.
   - Action (Form – `_components/BlogForm.tsx`):
     - Tách UI “Nguồn dữ liệu” y hệt route cũ: toggle auto/manual, itemCount + sortBy, danh sách selected, search + chọn bài viết.
     - Props đề xuất (đủ để không đổi behavior):
       ```ts
       { 
         selectionMode, onSelectionModeChange,
         itemCount, sortBy, onConfigChange,
         selectedPosts, selectedPostIds, onTogglePost,
         searchTerm, onSearchTermChange,
         filteredPosts, isLoading
       }
       ```
   - Action (Edit route – `blog/[id]/edit/page.tsx`):
     - Mô phỏng Hero/Stats pattern: load `homeComponents.getById`, validate `component.type === 'Blog'` (khác thì `router.replace(/admin/home-components/${id}/edit?type=...)`).
     - State: `title`, `active`, `isSubmitting`, `blogStyle`, `blogSelectionMode`, `selectedPostIds`, `postSearchTerm`, `blogConfig` (itemCount/sortBy).
     - Query posts: `api.posts.listAll` limit 100; filter `Published` + search term; map selected list như hiện tại (Map + filter undefined).
     - `handleSubmit` build config giống cũ:
       ```ts
       { itemCount, sortBy, style: blogStyle, selectionMode, selectedPostIds: selectionMode==='manual' ? selectedPostIds : [] }
       ```
     - Layout 2 cột: form trái (BlogForm + nút Lưu), preview phải sticky (BlogPreview).
   - Reflection: ✓ Module mới tách đúng pattern Hero/Stats, giữ behavior cũ.

3. Solving 1.3 — Cleanup route cũ + previews + cập nhật imports
   - Thought: Route cũ chỉ redirect, previews.tsx bỏ BlogPreview; cập nhật nơi dùng BlogPreview/BlogStyle.
   - Action (route cũ `app/admin/home-components/[id]/edit/page.tsx`):
     - Xóa toàn bộ blog states, memo/filter posts, `Blog` case trong `buildConfig` + init config + JSX Blog section.
     - Xóa import `BlogPreview` và `BlogStyle` từ `previews`.
     - Thêm redirect cho Blog:
       - Trong `useEffect` theo `type` query: nếu `type === 'blog'` → `router.replace('/admin/home-components/blog/${id}/edit')`.
       - Trong `useEffect` theo `component.type`: nếu `component.type === 'Blog'` → redirect tương tự.
       - Trong điều kiện render “Đang chuyển hướng...” thêm Blog.
   - Action (previews.tsx):
     - Xóa block `BlogPreview`, `BlogStyle`, `BlogPreviewItem`.
     - Dọn các import không còn dùng do bỏ BlogPreview.
   - Action (create/product-list page):
     - Đổi import `BlogPreview` + `BlogStyle` sang module mới (`app/admin/home-components/blog/_components/BlogPreview` và `_types`).
   - Reflection: ✓ Không còn phụ thuộc BlogPreview trong `previews.tsx`, route cũ gọn, imports sạch.

### Notes ràng buộc triển khai
- Khi implement: **KHÔNG** chạy `bunx oxlint`, `bun run lint`, `bunx tsc --noEmit`, **KHÔNG** commit.
- Không thay đổi hành vi ngoài phạm vi tách module Blog.
