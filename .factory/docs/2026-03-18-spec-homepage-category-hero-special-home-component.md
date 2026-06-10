## Audit Summary

### Observation
- UI trong screenshot là pattern `Category + Hero Banner Layout`: header/top nav ở trên, rail danh mục bên trái, hero/banner hoặc panel gợi ý bên phải.
- Pattern này về mặt UX không phải header thuần, mà là `homepage entry discovery block` cho ecommerce/marketplace.
- Codebase hiện tại:
  - `/system/experiences/menu` đang quản global header (`classic | topbar | allbirds`) với source chính là menu items.
  - Hệ thống đã có domain data tốt cho pattern này là `productCategories`.
  - Hệ thống cũng có kiến trúc `home-components` phù hợp để admin chỉnh nội dung hiển thị ở trang chủ.
- User đã refine yêu cầu rất rõ:
  - Không muốn nhét toàn bộ vào `Header Menu`.
  - Muốn khi bật experience thì kích hoạt một `home-component đặc biệt` cho trang chủ.
  - Home-component đặc biệt này chỉ cần **1 layout duy nhất**, nhưng vẫn có preview đầy đủ.
  - Quyền chỉnh nội dung phải nằm chủ yếu ở `/admin/home-components` để admin tự quản ảnh, mapping category, rule hiển thị.
  - `/system` giữ vai trò bật/tắt, governance, và high-level behavior.
  - Component chỉ xuất hiện khi dev/admin bật experience tương ứng.

### Inference
- Hướng user đề xuất thực ra CoC hơn phương án “experience độc lập 100%” em nêu trước đó, vì:
  1. `hero/banner/category mapping` là homepage content nên hợp với home-components.
  2. `enable/disable feature` là cross-cutting system concern nên hợp với experiences.
  3. Tránh biến `/system/experiences/menu` thành God-page.
  4. Giữ mental model rất rõ: `/system` quyết định có dùng pattern này hay không; `/admin` quyết định nó hiển thị nội dung gì.

### Decision
**Recommend:** Dùng mô hình 2 lớp:
- `/system/experiences/homepage-category-hero`: experience bật/tắt feature + preview/guidance cấp hệ thống
- `/admin/home-components`: xuất hiện một **special home-component** dành riêng cho pattern này, chỉ có 1 layout, admin cấu hình nội dung chi tiết ở đây

Nói ngắn gọn: **experience là công tắc + contract**, còn **special home-component là nội dung thật**.

---

## Root Cause Confidence

**High** — vì hướng này khớp cả 3 yếu tố cùng lúc:
- khớp bản chất UI (homepage block, không phải global header thuần),
- khớp kiến trúc hiện có (home-components dành cho homepage content),
- khớp nhu cầu vận hành (admin muốn tự chỉnh ảnh, category rules, preview).

### Root cause cụ thể nếu nhét sai chỗ
1. Nếu đưa vào `menu experience`, responsibility sẽ lẫn giữa global header và homepage merchandising block.
2. Nếu làm home-component thường hoàn toàn độc lập, sẽ thiếu một nơi cấp hệ thống để govern việc feature này có được phép xuất hiện hay không.
3. Nếu để toàn bộ config trong `/system`, admin sẽ khó vận hành vì đây là khối content nặng tính merchandising hơn là system behavior.

### Counter-hypothesis
- **Nhét thành layout thứ 4 của Header Menu**
  - Reject vì sai concern và sai data domain.
- **Làm home-component thường, không có experience riêng**
  - Reject vì thiếu lớp enable/governance, thiếu cảm giác “feature hệ thống”.
- **Làm experience mới bật một special home-component (Recommend)**
  - Best fit vì tách rõ system concern và content concern.

---

## Proposal

### 1) Mô hình tổng thể
Tạo một feature mới với 2 phần liên kết chặt:

#### A. System Experience
Tên gợi ý nên rõ business hơn, ví dụ:
- `Homepage Category Hero` (an toàn, rõ nghĩa)
- `Browse Hero`
- `Catalog Hero`
- `Discovery Hero`

Em recommend tên: **Homepage Category Hero**

Trách nhiệm:
- bật/tắt feature toàn hệ thống
- preview behavior ở mức system
- mô tả contract với special home-component
- rule responsive tổng quát
- trạng thái nguồn dữ liệu liên quan (`productCategories`)
- link sang admin home-components để chỉnh nội dung

#### B. Special Home Component
Đây là một loại home-component đặc biệt, ví dụ tên internal:
- `catalogHero`
- `categoryHero`
- `homepageCategoryHero`

Tên UI label gợi ý đẹp hơn:
- `Hero Danh mục`
- `Hero Khám phá danh mục`
- `Hero điều hướng sản phẩm`

Em recommend:
- internal key: `homepageCategoryHero`
- label admin: **Hero khám phá danh mục**

Trách nhiệm:
- ảnh/banner hero
- danh mục thủ công hay tự động
- ẩn danh mục không có sản phẩm
- hiển thị ảnh preview cạnh tên danh mục hay không
- mapping category → banner/panel/quick links
- các tinh chỉnh hiển thị nhỏ phục vụ nhiều dự án
- preview thật trong admin

### 2) Cơ chế xuất hiện
Theo yêu cầu user:
- chỉ khi experience `Homepage Category Hero` được bật thì special home-component này mới xuất hiện/render

CoC nhất là dùng contract sau:
- Experience lưu setting: `enabled: boolean`
- Site renderer chỉ render `homepageCategoryHero` nếu `enabled === true`
- Trong `/admin/home-components`, component loại này vẫn được quản trị như component trang chủ, nhưng có guard/hint nếu experience đang tắt

### 3) Hành vi admin/system đúng CoC
#### Trong `/system/experiences/homepage-category-hero`
Nên có:
- Toggle bật/tắt feature
- Preview read-only hoặc semi-read-only theo 3 device
- Trạng thái nguồn dữ liệu:
  - module sản phẩm
  - product categories
  - số category hợp lệ
- Hints về cách chỉnh nội dung ở `/admin/home-components`
- Link nhanh sang special home-component
- Có thể có vài setting cấp hệ thống thật sự global như:
  - `attachToHeader`
  - `showOnHomepageOnly`
  - `mobileBehavior = drawer`

#### Trong `/admin/home-components`
Special home-component này nên có form riêng nhưng đơn giản hơn component khác:
- chỉ 1 layout
- preview chuẩn
- các field business phục vụ nhiều dự án

### 4) Contract field đề xuất

#### Experience config (`/system`)
Giữ gọn, chỉ chứa governance:
- `enabled`
- `showOnHomepageOnly`
- `attachToHeader`
- `mobileBehavior: drawer`
- `tabletBehavior: drawer | compact-rail`
- `categorySource: productCategories` (fixed)
- `linkedHomeComponentId` hoặc resolver theo type special component

#### Special home-component config (`/admin`)
Chứa nội dung và display behavior:
- `title` / `eyebrow` nếu cần
- `heroSlides[]`
- `fallbackBanner`
- `selectionMode: manual | auto`
- `selectedCategoryIds[]`
- `hideEmptyCategories`
- `showCategoryProductPreview`
- `showSubcategoryPreview`
- `quickLinksByCategory`
- `categoryImageMode: none | firstProduct | customImage`
- `maxCategoriesDesktop`
- `maxCategoriesTablet`
- `panelMode: banner | suggestion-grid | mixed`
- `cta` nếu cần
- `spacing` / `heightMode` mức tối thiểu

### 5) Responsive UX contract
Theo research + yêu cầu user:

#### Desktop
- rail category bên trái
- hero/banner/panel bên phải
- hover/focus category đổi panel
- header nằm trên, có thể visually attached nhưng không merge concern

#### Tablet
- ưu tiên `drawer`
- hero full-width
- nút mở category rõ ràng

#### Mobile
- category rail không hiển thị cố định
- chuyển thành drawer/sheet + accordion
- hero rút gọn, không cố giữ mega-panel

### 6) Preview strategy
User muốn “vẫn có preview đàng hoàng”.

Đề xuất:
- Experience page có preview tổng thể ở mức feature/system
- Admin home-component có preview thật của chính component

Tức là preview 2 tầng nhưng không duplicate responsibility:
- `/system`: preview để hiểu feature đang on/off và responsive contract
- `/admin`: preview để chỉnh content thật

### 7) Tên gọi nên dùng
Để tránh “hero of home-component hero” bị rối, em đề xuất naming như sau:

#### Public/system label
- **Homepage Category Hero** (recommend)

#### Admin home-component label
- **Hero khám phá danh mục** (recommend)

#### Internal key
- `homepageCategoryHero`

Lý do:
- đủ rõ là hero dành cho homepage
- nhấn đúng điểm khác biệt là discovery theo category
- không quá generic như `Hero`
- không quá technical như `CategorySidebarHeroLayout`

---

## Implementation Plan

### Bước 1 — Tạo experience mới ở system
File dự kiến:
- `app/system/experiences/homepage-category-hero/page.tsx`
- `app/system/experiences/_constants.ts`

Mục tiêu:
- thêm card experience mới
- system editor riêng cho feature này
- preview desktop/tablet/mobile
- status liên quan tới products/productCategories
- link rõ sang admin home-components

### Bước 2 — Định nghĩa type/config cho feature governance
File dự kiến:
- `lib/experiences/...` hoặc khu vực type/helper đang dùng cho experiences

Nội dung:
- default config cho experience mới
- normalize helpers
- type cho system-level settings

### Bước 3 — Tạo special home-component type
Tích hợp vào hệ thống home-components hiện có theo pattern repo.

Mục tiêu:
- có 1 component type mới `homepageCategoryHero`
- chỉ 1 layout duy nhất
- có preview riêng
- có form config riêng, gọn hơn các component 6 layout

### Bước 4 — Guard giữa system và admin
- Nếu experience tắt: component không render ở site
- Trong admin có hint/trạng thái “feature đang tắt ở system”
- Nếu experience bật nhưng chưa có special component config: hiển thị empty state có hướng dẫn tạo

### Bước 5 — Runtime integration cho homepage
- Renderer trang chủ kiểm tra experience setting trước
- Khi bật thì render `homepageCategoryHero`
- Data category lấy từ `productCategories`
- Không ảnh hưởng các route khác

### Bước 6 — Preview integration
- System preview: mô phỏng contract + responsive
- Admin preview: hiển thị component thật với dữ liệu config hiện tại

---

## Verification Plan
- Verify tĩnh rằng feature mới không mở rộng scope của `Header Menu`.
- Verify tĩnh rằng special component chỉ có 1 layout nhưng vẫn có preview đầy đủ.
- Verify contract `experience bật -> component mới được render`.
- Verify source category luôn là `productCategories`, không trộn `menu sidebar`.
- Verify responsive:
  - desktop = sidebar + hero
  - tablet = drawer
  - mobile = drawer + compact hero
- Verify admin IA:
  - `/system` để bật/tắt + governance
  - `/admin/home-components` để chỉnh nội dung chi tiết

---

## Recommendation
**Recommend:** Chốt theo hướng anh vừa đề xuất, vì đây là hướng CoC nhất trong dự án hiện tại.

Tóm gọn quyết định kiến trúc:
- Không thêm layout thứ 4 vào `Header Menu`
- Tạo experience mới `Homepage Category Hero`
- Experience này kích hoạt một special home-component `homepageCategoryHero`
- Admin quản nội dung chi tiết của component đó trong `/admin/home-components`
- Component chỉ có 1 layout, nhưng vẫn có preview đầy đủ

Nếu anh duyệt spec này, bước tiếp theo em sẽ implement đúng theo mô hình 2 lớp đó.