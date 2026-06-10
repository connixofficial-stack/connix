# Deep Scan Issues: /system/experiences/menu

Sau khi quét kỹ code từ gốc đến ngọn theo DFS, tìm được các vấn đề sau:

---

## 🔴 CRITICAL ISSUES

### 1. **Transparent style thiếu config UI cho Topbar/Login/etc**
- **File**: `app/system/experiences/menu/page.tsx`
- **Vấn đề**: Khi chọn layout `transparent`, KHÔNG có ControlCard riêng để cấu hình (như Classic có "Giao diện Classic")
- **Hậu quả**: Các config như Topbar, Search, Cart, Login, CTA vẫn lưu nhưng **không render trong preview** của Transparent style
- **Root cause**: `renderTransparentStyle()` trong `HeaderMenuPreview.tsx` bỏ qua hoàn toàn `config.topbar.show`, `config.login.show`, `config.search.show`...

### 2. **Login button không kiểm tra Module Customers**
- **File**: `HeaderMenuPreview.tsx` + `Header.tsx`
- **Vấn đề**: `config.login.show` chỉ check toggle experience, KHÔNG check `customersModule.enabled`
- **Hậu quả**: Nếu module Customers tắt, nút "Đăng nhập" vẫn hiển thị → user click vào trang login không tồn tại
- **Pattern đúng**: Cần check `login.show && customersModule?.enabled`

### 3. **Thiếu Module Status UI trong Experience Editor**
- **File**: `app/system/experiences/menu/page.tsx`
- **Vấn đề**: Không có ModuleFeatureStatus cho:
  - **Module Customers** → ảnh hưởng Login button
  - **Feature enableLogin** (customers module) → xác định có hệ thống đăng nhập không
- **Pattern chuẩn**: Theo skill `experience-module-status`, cần query `getModuleFeature` và hiển thị status read-only với link đến module

---

## 🟡 MEDIUM ISSUES

### 4. **Transparent style hard-code colors/effects**
- **Vấn đề**: Background gradient, blur effects trong `renderTransparentStyle()` đang hard-code
- **Suggestion**: Thêm config như `transparentOverlay: 'dark' | 'light'`, `blurIntensity`, `showTopbar`

### 5. **Track Order & Store System không check module liên quan**
- **Vấn đề**: `showTrackOrder` và `showStoreSystem` trong Topbar không kiểm tra:
  - `showTrackOrder` → cần module `orders` enabled
  - `showStoreSystem` → cần có data "stores" (chưa có module này)
- **Hậu quả**: Link đến `/orders/tracking` hoặc `/stores` mà không có route tương ứng

### 6. **Preview và Frontend không đồng bộ hoàn toàn**
- **File**: `HeaderMenuPreview.tsx` vs `Header.tsx`
- **Vấn đề**: Logic render khác nhau ở một số chỗ (đặc biệt transparent style)

---

## 🟢 MINOR ISSUES

### 7. **ExperienceModuleLink cho Login/Customers thiếu**
- **Vấn đề**: Trong section "Module & Experience liên quan" có Cart, Wishlist, Products, Posts nhưng THIẾU:
  - Link đến `/system/modules/customers`
  - Không hiển thị rõ feature `enableLogin` của customers

### 8. **Hint card thiếu thông tin về Login dependency**
- **Vấn đề**: HINTS array không mention về mối liên hệ Login ↔ Module Customers
- **Suggestion**: Thêm hint "Login button cần bật Module Khách hàng + feature Đăng nhập KH"

### 9. **Wishlist toggle thiếu thông báo customers dependency**
- **Vấn đề**: Khi `wishlistModule` disabled vì thiếu `customersModule`, UI chỉ disable toggle mà không giải thích lý do

---

## 📋 RECOMMENDED FIXES (theo thứ tự ưu tiên)

1. **Add Module Status cho Customers** trong Experience Editor
   - Query `api.admin.modules.getModuleByKey({ key: 'customers' })`
   - Query `api.admin.modules.getModuleFeature({ moduleKey: 'customers', featureKey: 'enableLogin' })`
   - Hiển thị `ModuleFeatureStatus` component

2. **Gate Login button** theo `customersModule?.enabled && enableLogin?.enabled`
   - Cả trong Preview và Frontend Header

3. **Add Transparent style config UI**
   - Thêm ControlCard khi `previewStyle === 'transparent'`
   - Cho phép toggle: Topbar, Search, Login, CTA

4. **Gate Track Order** theo `ordersModule?.enabled`

5. **Add missing ExperienceModuleLink** cho Customers

---

## Câu hỏi xác nhận

Bạn muốn tôi fix theo thứ tự trên không, hay có ưu tiên khác?