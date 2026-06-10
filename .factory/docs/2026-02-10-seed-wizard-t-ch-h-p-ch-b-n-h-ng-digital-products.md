
## Seed Wizard - Hỏi Thẳng, Nói Rõ, Không Ngầm Định

### UI: Nút "Seed Wizard" (icon Wand) thêm vào `QuickActionsCard`

---

### Step 1: Website có bán hàng không?

**Hỏi:** "Website này làm gì?"

| Chọn | Mô tả ngắn | Modules tự bật |
|---|---|---|
| **Chỉ giới thiệu** | Landing page, brochure | settings, menus, homepage, media, users, roles |
| **Viết blog/tin tức** | Bài viết, danh mục bài | + posts, comments |
| **Trưng bày sản phẩm** | Có SP nhưng KHÔNG có giỏ hàng | + products |
| **Bán hàng online** | Giỏ hàng + đặt hàng + thanh toán | + products, orders, cart, customers |
| **Cung cấp dịch vụ** | Salon, tư vấn, sửa chữa | + services |

---

### Step 2: Bật thêm tính năng nào? (multi-select checkboxes)

**Hỏi:** "Ngoài ra muốn bật thêm gì?"

Hiện danh sách checkboxes tùy Step 1. VD nếu chọn "Bán hàng online":
- [ ] Bài viết & Blog *(posts)*
- [ ] Bình luận & Đánh giá *(comments)*
- [ ] Yêu thích *(wishlist)*
- [ ] Mã giảm giá *(promotions)*
- [ ] Thông báo *(notifications)*
- [ ] Dịch vụ *(services)*

---

### Step 3: Chế độ bán hàng
*Chỉ hiện khi có products*

**Hỏi:** "Khi khách muốn mua sản phẩm, họ làm gì?"

| Chọn | Mô tả | Seed setting |
|---|---|---|
| **Thêm vào giỏ hàng & thanh toán** | Mua online bình thường, có giỏ hàng | `saleMode: "cart"` |
| **Bấm nút Liên hệ** | Không mua online, chỉ liên hệ qua form /contact | `saleMode: "contact"` |
| **Bấm nút Mua ngay (Affiliate)** | Chuyển sang link ngoài (Shopee, Tiki, Lazada...) | `saleMode: "affiliate"` + seed `affiliateLink` |

Nếu chọn **contact** → tự tắt modules: cart, orders, wishlist, promotions (vì không cần).
Nếu chọn **affiliate** → tự tắt modules: cart, orders (vì mua ở nơi khác). Seed sẵn `affiliateLink` cho mỗi SP.

---

### Step 4: Sản phẩm vật lý hay sản phẩm số?
*Chỉ hiện khi có products*

**Hỏi:** "Bạn bán hàng vật lý (giao tận nơi) hay hàng số (gửi qua mạng)?"

| Chọn | Ví dụ |
|---|---|
| **Chỉ hàng vật lý** | Áo quần, điện thoại, nồi cơm... giao shipper |
| **Chỉ hàng số** | Tài khoản Netflix, key Windows, file PDF... gửi email |
| **Cả hai** | Vừa có hàng ship vừa có hàng số |

Nếu có hàng số, hỏi tiếp: **"Hàng số giao cho khách bằng cách nào?"**
- **Tài khoản** (username + password) → `digitalDeliveryType: "account"`
- **Key bản quyền** (license key) → `digitalDeliveryType: "license"`
- **Link tải về** (download URL) → `digitalDeliveryType: "download"`
- **Tùy chỉnh** (nội dung tự do) → `digitalDeliveryType: "custom"`

→ Seed setting: `enableDigitalProducts: true`, `defaultDigitalDeliveryType: "..."` + seed vài SP mẫu dạng digital.

---

### Step 5: Sản phẩm có phiên bản (biến thể) không?
*Chỉ hiện khi có products*

**Hỏi:** "Sản phẩm có nhiều phiên bản không? Ví dụ: cùng 1 áo mà có Size S/M/L và Màu Đỏ/Xanh"

| Chọn | Ví dụ seed ra | Variant preset key |
|---|---|---|
| **Không có phiên bản** | Mỗi SP 1 loại duy nhất | `variantEnabled: false` |
| **Size + Màu** | Áo Size S Đỏ, Áo Size M Xanh | `size_color` |
| **Chỉ Màu** | Ốp lưng Đen, Ốp lưng Trắng | `color_only` |
| **Chỉ Size** | Găng tay S, Găng tay M | `size_only` |
| **Dung lượng + Màu** | iPhone 128GB Đen, 256GB Trắng | `storage_color` |
| **Kích thước + Chất liệu** | Bàn 80x60 Gỗ, 100x80 Kim loại | `dimension_material` |
| **Dung tích + Tone** | Kem 30ml Tone sáng, 50ml Tone tối | `volume_shade` |
| **Khối lượng + Hương vị** | Cà phê 250g Vanilla, 500g Mocha | `weight_flavor` |
| **Thời hạn + Gói** | 1 tháng Basic, 1 năm Premium | `duration_package` |
| **Chất liệu + Màu** | Nhẫn Vàng Đen, Bạc Trắng | `material_color` |
| **Liều lượng + Số lượng** | Vitamin 500mg 60 viên | `dosage_quantity` |
| **Size + Độ tuổi** | Tã Size S 0-6M, Size M 6-12M | `size_age` |

Nếu có phiên bản, hỏi thêm 3 câu phụ (nói thẳng):
- **"Giá mỗi phiên bản khác nhau hay chung?"** → `variantPricing: "variant"` hoặc `"product"`
- **"Tồn kho tính riêng từng phiên bản hay chung?"** → `variantStock: "variant"` hoặc `"product"`
- **"Ảnh mỗi phiên bản riêng hay dùng chung ảnh SP?"** → `variantImages: "inherit"/"override"/"both"`

→ Seed settings: `variantEnabled: true` + preset options + sample variants cho 2 SP đầu.

---

### Step 6: Thông tin website

**Hỏi:** "Điền thông tin website (để seed settings, SEO, trang liên hệ)"

- Tên website (default "VietAdmin")
- Slogan (optional)
- Email liên hệ (default "contact@example.com")
- Số điện thoại (optional)
- Địa chỉ (optional)

Có nút "Bỏ qua, dùng mặc định" để skip.

---

### Step 7: Số lượng & Xác nhận

**Hỏi:** "Muốn seed bao nhiêu dữ liệu mẫu?"

3 cards:
- **Ít** (~5 SP, ~5 bài, ~5 đơn) - Test nhanh
- **Vừa** (~20 SP, ~15 bài, ~20 đơn) - Development
- **Nhiều** (~50 SP, ~30 bài, ~50 đơn) - Demo

**Bảng tóm tắt mọi quyết định:**
```
Website:          Bán hàng online
Chế độ bán:       Giỏ hàng & thanh toán
Loại SP:          Vật lý + Số (giao bằng Tài khoản)
Phiên bản SP:     Size + Màu (giá riêng, tồn riêng, ảnh chung)
Tên website:      Shop ABC
Modules seed:     14 modules [danh sách]
Quy mô:           Vừa (~20 SP, ~15 bài, ~20 đơn)
[x] Clear dữ liệu cũ trước khi seed
```

Nút **"Bắt đầu Seed"** → gọi `seedBulk` với config build từ wizard.

---

### Luồng Conditional Skip

```
Step 1 (loại website)
  → Step 2 (tính năng thêm)
    → có products? → Step 3 (chế độ bán) → Step 4 (vật lý/số) → Step 5 (phiên bản)
    → không products? → skip 3,4,5
  → Step 6 (thông tin)
  → Step 7 (số lượng + xác nhận)
```

Progress bar dynamic: hiện "Step X / Y" với Y thay đổi theo branching.

---

### File Structure

```
components/data/
  SeedWizardDialog.tsx              # Dialog wrapper + state
  seed-wizard/
    WizardProgress.tsx              # Progress bar
    steps/
      WebsiteTypeStep.tsx           # Step 1
      ExtraFeaturesStep.tsx         # Step 2
      SaleModeStep.tsx              # Step 3 (MỚI - chế độ bán hàng)
      ProductTypeStep.tsx           # Step 4
      ProductVariantsStep.tsx       # Step 5
      BusinessInfoStep.tsx          # Step 6
      ReviewStep.tsx                # Step 7
    types.ts                        # WizardState
    useWizardFlow.ts                # Navigation + skip logic
    wizard-presets.ts               # Map choices → seedBulk config
```

### Backend: Không cần thêm API mới
- Reuse `seedBulk` + `seedModule` hiện có
- Wizard output = config array cho `seedBulk`
- Settings (saleMode, variantEnabled, enableDigitalProducts, ...) gọi update moduleSettings mutation có sẵn
