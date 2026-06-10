## Problem Graph (DARE Framework)

```
1. [Main] Account Profile Preview không tương ứng 3 layout enterprise
   ├── 1.1 [ROOT CAUSE] Preview hiện tại quá đơn giản, không reflect 3 layouts riêng biệt
   │   ├── 1.1.1 Card layout: chỉ là card cơ bản, thiếu header gradient, avatar nổi bật
   │   ├── 1.1.2 Sidebar layout: chỉ là grid 2 cột, không có sidebar brand color
   │   └── 1.1.3 Compact layout: giống card, không có style enterprise riêng
   ├── 1.2 [Sub] Thiếu tính năng so với experiences khác
   │   ├── 1.2.1 Không có phân trang/pagination settings
   │   ├── 1.2.2 Không có SelectRow cho config chi tiết
   │   └── 1.2.3 Thiếu ModuleFeatureStatus redundant (đã có nhưng duplicate)
   └── 1.3 [Sub] Preview không phản ánh thiết kế enterprise chuyên nghiệp
```

## So sánh với Experiences khác

| Feature | Posts-list | Products-list | Account-orders | Account-profile |
|---------|------------|---------------|----------------|-----------------|
| LayoutTabs | ✅ 3 layouts | ✅ 3 layouts | ✅ 3 layouts | ✅ 3 layouts |
| DeviceToggle | ✅ | ✅ | ✅ | ✅ |
| SelectRow | ✅ pagination | ✅ pagination, perPage | ✅ pagination, perPage | ❌ Không có |
| ModuleFeatureStatus | ❌ | ✅ variants, wishlist... | ✅ payment, shipping... | ✅ (1 chỗ) |
| Preview chất lượng | ✅ distinct layouts | ✅ distinct layouts | ✅ distinct layouts | ❌ Giống nhau |

## Phân tích 3 Layout Mẫu Enterprise

### 1. **Card Layout** (`enterprise-profile-dashboard (1)`)
- Header card trắng với avatar + thông tin ngang
- Action grid dạng button với icon màu, chevron phải
- Clean, minimal, professional

### 2. **Sidebar Layout** (`pro-corporate-profile`)  
- Split layout: Left sidebar (brand blue `bg-brand-700`) + Right content (white)
- Avatar lớn ở sidebar với contact info glassmorphism
- Actions list dạng card với icon + subLabel + arrow
- **Đây là style enterprise corporate chuẩn**

### 3. **Compact Layout** (`enterprise-profile-dashboard`)
- Split layout nhưng gọn hơn: Left panel (blue-800) + Right panel (white)
- Mobile: stacked, Desktop: horizontal
- Action grid 2x2 trên mobile, 4-col trên desktop
- Button "Mua sắm" nổi bật với gradient

## QA Tickets cần fix

### Ticket 1: **Redesign AccountProfilePreview với 3 layouts riêng biệt**
- **Card**: Profile header card + action grid 3 cột (học từ mẫu 1)
- **Sidebar**: Split layout brand color + white, avatar centered, actions list (học từ mẫu 2)
- **Compact**: Split responsive, action grid 2x2/4-col, CTA nổi bật (học từ mẫu 3)

### Ticket 2: **Thêm settings tương đương experiences khác**
- Thêm `showAddress` (địa chỉ mặc định)
- Thêm `showMemberId` (mã khách hàng)
- Thêm `showJoinDate` (ngày tham gia)
- Thêm `actionItems` config (chọn actions nào hiển thị)

### Ticket 3: **Cải thiện ControlCard settings**
- Nhóm toggle rõ ràng hơn: "Thông tin cá nhân" vs "Tác vụ nhanh"
- Thêm mô tả cho từng toggle

### Ticket 4: **Thống nhất UX với experiences khác**
- Brand color từ settings phải apply vào sidebar/header của preview
- Device preview phải thay đổi layout thực sự (mobile khác desktop)

## Execution Plan

1. **Phase 1**: Viết lại `AccountProfilePreview.tsx` với 3 layouts riêng biệt
   - CardLayoutPreview, SidebarLayoutPreview, CompactLayoutPreview

2. **Phase 2**: Update `page.tsx` thêm settings mới
   - Thêm config fields, ToggleRows, SelectRows

3. **Phase 3**: Test responsive trên 3 devices

---

**Bạn muốn tôi thực hiện theo plan này không?**
