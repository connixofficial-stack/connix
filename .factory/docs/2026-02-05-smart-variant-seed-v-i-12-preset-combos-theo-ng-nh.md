## Spec: Smart Variant Seed với 12 Preset Combos theo Ngành

### Tổng quan
Hệ thống Custom Seed Configuration sẽ auto-detect `variantEnabled` setting và cung cấp UI Grid Cards để chọn preset combo phù hợp theo ngành hàng.

---

### 12 PRESET COMBO PHIÊN BẢN (dựa trên research thực tế)

| # | Tên Preset | Options | Ngành hàng áp dụng | Icon |
|---|------------|---------|-------------------|------|
| **1** | **Size + Màu** | `size`, `color` | Thời trang (áo, quần, váy, giày dép) | 👕 |
| **2** | **Chỉ Màu** | `color` | Phụ kiện, gia dụng, trang sức, quà tặng | 🎨 |
| **3** | **Chỉ Size** | `size` | Găng tay, mũ, nhẫn, vòng tay | 📏 |
| **4** | **Dung lượng + Màu** | `storage`, `color` | Điện thoại, laptop, USB, SSD | 📱 |
| **5** | **Kích thước + Chất liệu** | `dimension`, `material` | Nội thất, túi xách, da, vải | 🛋️ |
| **6** | **Dung tích + Hương/Tone** | `volume`, `shade` | Mỹ phẩm, nước hoa, skincare, son | 💄 |
| **7** | **Khối lượng + Hương vị** | `weight`, `flavor` | Thực phẩm, cà phê, trà, bánh kẹo | ☕ |
| **8** | **Liều lượng + Số lượng** | `dosage`, `quantity` | Sức khỏe, thuốc, vitamin, thực phẩm chức năng | 💊 |
| **9** | **Size + Độ tuổi** | `size`, `age_group` | Mẹ & Bé, đồ trẻ em, sữa bột | 👶 |
| **10** | **Chất liệu + Màu** | `material`, `color` | Trang sức (vàng/bạc), da, kim loại | 💎 |
| **11** | **Thời hạn + Gói** | `duration`, `package` | Subscription, phần mềm, dịch vụ, fitness | 📦 |
| **12** | **Combo/Bundle** | `bundle_size` | Combo deal, family pack, set quà tặng | 🎁 |

---

### Mapping Ngành hàng → Preset gợi ý

| Ngành hàng | Preset mặc định | Preset thay thế |
|------------|-----------------|-----------------|
| Thời trang | Size + Màu | Chất liệu + Màu |
| Mỹ phẩm - Làm đẹp | Dung tích + Hương/Tone | Chỉ Màu |
| Công nghệ - Điện tử | Dung lượng + Màu | Chỉ Màu |
| Nội thất - Gia dụng | Kích thước + Chất liệu | Chỉ Màu |
| Trang sức & Quà tặng | Chất liệu + Màu | Chỉ Size |
| Mẹ & Bé | Size + Độ tuổi | Size + Màu |
| Ẩm thực - Ăn uống | Khối lượng + Hương vị | Combo/Bundle |
| Sức khỏe - Nhà thuốc | Liều lượng + Số lượng | Khối lượng + Hương vị |
| Cafe - Trà sữa | Khối lượng + Hương vị | Dung tích + Hương/Tone |
| Fitness & Yoga | Thời hạn + Gói | Size + Màu |
| Beauty spa & Massage | Thời hạn + Gói | Dung tích + Hương/Tone |

---

### UI: Grid Cards trong Custom Seed Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏷️ Chọn kiểu phiên bản sản phẩm                                │
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 👕          │ │ 🎨          │ │ 📏          │ │ 📱          │ │
│ │ Size + Màu  │ │ Chỉ Màu     │ │ Chỉ Size    │ │ Dung lượng  │ │
│ │             │ │             │ │             │ │ + Màu       │ │
│ │ Thời trang  │ │ Phụ kiện    │ │ Trang sức   │ │ Điện tử     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 🛋️          │ │ 💄          │ │ ☕          │ │ 💊          │ │
│ │ Kích thước  │ │ Dung tích   │ │ Khối lượng  │ │ Liều lượng  │ │
│ │ + Chất liệu │ │ + Hương     │ │ + Vị        │ │ + SL        │ │
│ │ Nội thất    │ │ Mỹ phẩm     │ │ F&B         │ │ Sức khỏe    │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 👶          │ │ 💎          │ │ 📦          │ │ 🎁          │ │
│ │ Size +      │ │ Chất liệu   │ │ Thời hạn    │ │ Combo       │ │
│ │ Độ tuổi     │ │ + Màu       │ │ + Gói       │ │ Bundle      │ │
│ │ Mẹ & Bé     │ │ Jewelry     │ │ Subscription│ │ Set quà     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                 │
│ 💡 Gợi ý: Dựa trên danh mục sản phẩm đã chọn                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### Option Values mẫu cho mỗi Preset

| Option | Values mẫu |
|--------|------------|
| `size` | XS, S, M, L, XL, XXL / 35-45 (giày) / 6-12 (nhẫn) |
| `color` | Đen, Trắng, Đỏ, Xanh navy, Be, Hồng, Xám |
| `storage` | 64GB, 128GB, 256GB, 512GB, 1TB |
| `material` | Da, Vải, Gỗ, Kim loại, Nhựa, Cotton, Len |
| `dimension` | Nhỏ, Vừa, Lớn / 60x40, 80x60, 100x80 cm |
| `volume` | 30ml, 50ml, 100ml, 200ml, 500ml |
| `shade` | Tone sáng, Tone trung, Tone tối / Hồng đào, Đỏ cherry |
| `weight` | 100g, 250g, 500g, 1kg |
| `flavor` | Original, Vanilla, Caramel, Mocha, Trái cây |
| `dosage` | 250mg, 500mg, 1000mg |
| `quantity` | 30 viên, 60 viên, 90 viên, 120 viên |
| `age_group` | 0-6M, 6-12M, 1-2Y, 2-4Y, 4-6Y |
| `duration` | 1 tháng, 3 tháng, 6 tháng, 1 năm |
| `package` | Basic, Standard, Premium, VIP |
| `bundle_size` | Set 2, Set 3, Set 5, Family pack |

---

### Implementation Flow

1. **User bật `variantEnabled`** ở /system/modules/products
2. **Custom Seed Dialog** detect setting này
3. **Hiển thị Grid Cards** 12 presets để chọn
4. **Auto-gợi ý** preset dựa trên category của products đã chọn
5. **Seed Products** → **Auto seed Options + Values** → **Auto seed Variants**

---

### Files cần tạo/sửa

| File | Mô tả |
|------|-------|
| `lib/modules/variant-presets.ts` | **MỚI** - Định nghĩa 12 presets + mapping |
| `convex/seeders/variantPresets.seeder.ts` | **MỚI** - Seeder cho options + values theo preset |
| `convex/seeders/variants.seeder.ts` | **MỚI** - Seeder tạo variants (2-6/SP random) |
| `convex/seeders/products.seeder.ts` | Sửa - Check setting + gọi variant seeder |
| `components/modules/CustomSeedDialog.tsx` | Sửa - Thêm Grid Cards UI |
| `components/modules/VariantPresetPicker.tsx` | **MỚI** - Component Grid Cards |

---

### Convention over Configuration

- **Không cần config thêm** nếu đã bật `variantEnabled`
- **Preset mặc định**: "Size + Màu" (phổ biến nhất)
- **Auto-seed options** nếu chưa có
- **Random 2-6 variants/SP** cho realistic data
- **UI nhìn phát hiểu liền** với icons + ngành hàng gợi ý