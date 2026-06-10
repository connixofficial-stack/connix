
## DARE Framework Analysis

### Problem Graph

```
1. [Main] Seed Wizard chưa care đủ /system/modules, /system/experiences, /admin/settings
   ├── 1.1 [ROOT CAUSE] Module bật/tắt chưa hợp lý
   │   ├── 1.1.1 Không tôn trọng dependency graph khi disable (VD: tắt products nhưng orders vẫn trong danh sách seed)
   │   ├── 1.1.2 Không dùng toggleModuleWithCascade → tắt module cha nhưng con vẫn bật
   │   └── 1.1.3 Core modules (settings, users, roles) luôn phải bật nhưng wizard cho phép bỏ chọn
   │
   ├── 1.2 [ROOT CAUSE] Experiences không được seed/cấu hình theo wizard
   │   ├── 1.2.1 Có 16 experience_ui settings nhưng wizard không hỏi experience nào
   │   ├── 1.2.2 VD: Chọn "Bán hàng online" nhưng cart_ui, checkout_ui, product_detail_ui vẫn dùng default → user phải vào /system/experiences chỉnh từng cái
   │   └── 1.2.3 Experiences liên kết chặt với modules (cart experience → cart module) nhưng wizard không map
   │
   ├── 1.3 [ROOT CAUSE] /admin/settings không được pre-fill từ wizard
   │   ├── 1.3.1 Wizard hỏi businessInfo nhưng chỉ set 7 settings → thiếu social, mail, SEO chi tiết
   │   ├── 1.3.2 Settings có feature flags (enableContact, enableSEO, enableSocial, enableMail) nhưng wizard không toggle
   │   └── 1.3.3 Màu thương hiệu (site_brand_color) ảnh hưởng toàn bộ giao diện nhưng wizard không hỏi
   │
   ├── 1.4 [ROOT CAUSE] Thiếu Convention-over-Configuration
   │   ├── 1.4.1 Wizard không có smart defaults dựa trên websiteType (blog → posts experience classic, ecommerce → product detail modern)
   │   ├── 1.4.2 Module config settings (postsPerPage, ordersPerPage, lowStockThreshold) dùng hardcode default thay vì gợi ý theo quy mô
   │   └── 1.4.3 Checkout flow (single-page/multi-step) nên auto-suggest dựa trên saleMode
   │
   └── 1.5 [ROOT CAUSE] Thiếu helper text / hướng dẫn rõ ràng
       ├── 1.5.1 Step chọn website type chỉ hiện modules list → user không hiểu impact
       ├── 1.5.2 Không có "Vì sao chọn cái này?" giải thích cho từng option
       └── 1.5.3 Review step thiếu preview tổng quan trước khi seed
```

---

## Giải Pháp: Nâng Cấp Seed Wizard v2

### Thay đổi chính so với v1

| Vấn đề | v1 (hiện tại) | v2 (nâng cấp) |
|---|---|---|
| Module toggle | Chỉ gọi `toggleModule` | Dùng `toggleModuleWithCascade` + tôn trọng dependency |
| Experiences | Không đụng đến | Thêm step **Experience Presets** với smart defaults |
| /admin/settings | Chỉ set 7 fields | Thêm step **Settings nâng cao** (brand color, SEO, social) |
| Helper text | Không có | Mỗi option có 1-2 dòng giải thích rõ ràng impact |
| CoC defaults | Không có | Auto-suggest experience layout, checkout flow, per-page dựa trên websiteType |

---

### Steps Mới (10 steps, dynamic skip)

#### Step 1: Website này làm gì? *(giữ nguyên, thêm helper text)*
Thêm helper text cho mỗi option, ví dụ:
- **Bán hàng online**: "Bật 7 modules: products, orders, cart, customers + 4 core. Phù hợp shop bán hàng trực tuyến với giỏ hàng + thanh toán."
- **Chỉ giới thiệu**: "Chỉ cần 6 core modules. Website tĩnh, không cần quản lý nội dung phức tạp."

#### Step 2: Bật thêm tính năng nào? *(giữ nguyên, thêm helper text)*
Mỗi feature thêm helper text:
- **Bình luận & Đánh giá**: "Khách hàng có thể comment trên bài viết và đánh giá sao cho sản phẩm. Cần ít nhất 1 trong 2: bài viết hoặc sản phẩm."

#### Step 3: Chế độ bán hàng *(giữ nguyên, fix module logic)*
**Fix:** Khi chọn `contact` → dùng `toggleModuleWithCascade` để tắt cart/orders/wishlist/promotions đúng cách. Hiện warning: "4 modules sẽ bị tắt: cart, orders, wishlist, promotions."

#### Step 4: Sản phẩm vật lý hay số? *(giữ nguyên)*

#### Step 5: Phiên bản sản phẩm *(giữ nguyên)*

#### Step 6: Thông tin website *(mở rộng)*
Thêm các field mới:
- **Màu thương hiệu** (color picker, default `#3b82f6`) → seed `site_brand_color`
  - Helper: "Màu này dùng cho nút bấm, link, accent color khắp website."
- **Loại hình doanh nghiệp** (select: LocalBusiness, Store, Restaurant...) → seed `seo_business_type`
  - Helper: "Giúp Google hiểu loại hình kinh doanh, hiển thị đúng trong kết quả tìm kiếm."
- **Facebook URL** (optional) → seed `social_facebook`
- **Giờ mở cửa** (optional, VD: Mo-Su 08:00-22:00) → seed `seo_opening_hours`

#### Step 7: Experience Presets *(MỚI)*
**Hỏi:** "Giao diện frontend chọn theo phong cách nào?"

Dựa trên websiteType, hiện 3 preset cards:

**Nếu ecommerce/catalog:**
| Preset | Mô tả | Experience configs |
|---|---|---|
| **Classic** | Truyền thống, quen thuộc. Sidebar bên trái, grid products, drawer cart. | `product_detail_ui: {layoutStyle: 'classic'}`, `cart_ui: {layoutStyle: 'drawer'}`, `checkout_ui: {flowStyle: 'multi-step'}`, `products_list_ui: {layoutStyle: 'grid-sidebar'}` |
| **Modern** | Minimalist, fullwidth. Ảnh lớn, sticky add-to-cart, page cart. | `product_detail_ui: {layoutStyle: 'modern'}`, `cart_ui: {layoutStyle: 'page'}`, `checkout_ui: {flowStyle: 'single-page'}`, `products_list_ui: {layoutStyle: 'grid-full'}` |
| **Minimal** | Tối giản, focus nội dung. Ít decoration, clean layout. | `product_detail_ui: {layoutStyle: 'minimal'}`, `cart_ui: {layoutStyle: 'drawer'}`, `checkout_ui: {flowStyle: 'wizard-accordion'}` |

**Nếu blog:**
| Preset | Mô tả |
|---|---|
| **Magazine** | Grid bài viết, sidebar categories |
| **Clean** | Fullwidth, focus nội dung, ít distraction |

**Nếu services:**
| Preset | Mô tả |
|---|---|
| **Professional** | Card grid, CTA nổi bật |
| **Simple** | Danh sách đơn giản, focus thông tin |

Helper text: "Bạn có thể chỉnh sửa chi tiết sau tại /system/experiences. Đây chỉ là preset khởi tạo."

#### Step 8: Cấu hình nhanh *(MỚI - CoC)*
**Hỏi:** "Muốn điều chỉnh gì thêm không?" (toggle options với smart defaults)

Hiện danh sách toggle/select đã được pre-fill CoC:

**Nếu có products:**
- Số sản phẩm / trang: `12` (CoC default) → có thể chỉnh
- Ngưỡng tồn kho thấp: `10` (CoC) → có thể chỉnh
- Bình luận tự duyệt hay chờ duyệt: `Chờ duyệt` (CoC cho ecommerce)
  - Helper: "Chờ duyệt = kiểm soát spam tốt hơn. Tự duyệt = comment hiện ngay."

**Nếu có orders:**
- Preset trạng thái đơn hàng: `standard` (5 trạng thái) → có thể chọn simple/advanced
  - Helper: "Simple: 3 trạng thái (Pending/Confirmed/Completed). Standard: thêm Shipping, Cancelled. Advanced: thêm Processing, Refunded, On hold."
- Phương thức vận chuyển: `COD + Chuyển khoản` (CoC cho VN)
- Phương thức thanh toán: `COD + Bank Transfer + VietQR` (CoC cho VN)
  - Helper: "3 phương thức phổ biến nhất tại Việt Nam. Thêm/sửa chi tiết tại /system/modules/orders."

**Nếu có posts:**
- Số bài / trang: `10` (CoC)
- Trạng thái mặc định: `Bản nháp` (CoC)

Nút "Bỏ qua, dùng mặc định" để skip step này → CoC defaults apply.

#### Step 9: Số lượng dữ liệu *(tách ra từ Review)*
Tách riêng vì đây là quyết định quan trọng:
- **Ít** / **Vừa** / **Nhiều** (giữ nguyên)
- Thêm bảng chi tiết: "Với quy mô 'Vừa' và modules đã chọn, sẽ seed: ~20 SP, ~5 danh mục SP, ~20 đơn, ~15 bài viết, ~20 khách..."

#### Step 10: Xác nhận *(nâng cấp Review)*
Bảng tóm tắt mở rộng:
```
Website:          Bán hàng online
Chế độ bán:       Giỏ hàng & thanh toán
Phiên bản:        Size + Màu (giá riêng, tồn riêng)
Thương hiệu:      Shop ABC (#3b82f6)
Experience:       Classic (drawer cart, multi-step checkout)
Modules (14):     [badge list]
Module configs:   Standard order statuses, COD+Bank+VietQR
Quy mô:           Vừa (~20 SP, ~15 bài, ~20 đơn)
[x] Clear dữ liệu cũ trước khi seed
```

---

### Luồng Conditional Skip

```
Step 1 (website type)
  → Step 2 (extras)
    → có products? → Step 3 (sale mode) → Step 4 (vật lý/số) → Step 5 (variants)
    → không products? → skip 3,4,5
  → Step 6 (thông tin + brand color + SEO)
  → Step 7 (experience preset) ← MỚI
  → Step 8 (quick config CoC) ← MỚI (có nút skip)
  → Step 9 (số lượng)
  → Step 10 (xác nhận + seed)
```

Landing Page: 1→2→6→7→9→10 (6 steps)
Blog: 1→2→6→7→8→9→10 (7 steps)
eCommerce: 1→2→3→4→5→6→7→8→9→10 (10 steps, full)

---

### Execution Plan (handleSeed nâng cấp)

```
1. clearAll (nếu checkbox bật)
2. syncModules (dùng toggleModuleWithCascade thay vì toggleModule)
3. seedBulk (theo scale + selected modules)
4. setModuleSettings (products: saleMode, variants, digital...)
5. setModuleSettings (orders: statusPreset, shipping, payment) ← MỚI
6. setModuleSettings (posts: perPage, defaultStatus) ← MỚI
7. setModuleSettings (comments: defaultStatus) ← MỚI
8. setSettings (site, contact, seo, social) ← MỞ RỘNG
9. seedExperienceSettings (product_detail_ui, cart_ui, checkout_ui, ...) ← MỚI
10. applyProductOverrides (affiliate links, digital products)
```

---

### File Changes

**Sửa files:**
- `components/data/SeedWizardDialog.tsx` — thêm steps mới, fix syncModules
- `components/data/seed-wizard/types.ts` — thêm fields mới cho state
- `components/data/seed-wizard/wizard-presets.ts` — thêm experience presets, CoC defaults

**Thêm files:**
- `components/data/seed-wizard/steps/ExperiencePresetStep.tsx` — Step 7
- `components/data/seed-wizard/steps/QuickConfigStep.tsx` — Step 8
- `components/data/seed-wizard/steps/DataScaleStep.tsx` — Step 9 (tách từ Review)
- `components/data/seed-wizard/experience-presets.ts` — Map websiteType → experience configs

**Sửa files hiện có:**
- `steps/ReviewStep.tsx` — bỏ data scale (tách ra), thêm experience/config summary
- `steps/BusinessInfoStep.tsx` — thêm brand color, business type, social
- `steps/WebsiteTypeStep.tsx` — thêm helper text chi tiết
- `steps/ExtraFeaturesStep.tsx` — thêm helper text
- `steps/SaleModeStep.tsx` — thêm warning khi modules bị tắt
