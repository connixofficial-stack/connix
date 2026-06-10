## DARE Framework: Cải thiện Orders Config UX v3

### Problem Graph
```
1. [Main] Orders Config Layout không tối ưu
   ├─ 1.1 [Tab Cài đặt chung] Cột 2 có "Tóm tắt" vô nghĩa, Tính năng ẩn ở cột 3
   │   └─ 1.1.1 [ROOT CAUSE] Cần: Cột 1 = Settings, Cột 2 = Features, Cột 3 = Fields (chỉ tab này)
   │
   ├─ 1.2 [Tab Vận chuyển] Preview không cần, CRUD bị chật
   │   └─ 1.2.1 [ROOT CAUSE] Cần: CRUD chiếm full 3 cột (col-span-3)
   │
   ├─ 1.3 [Tab Thanh toán] Tương tự vận chuyển
   │   └─ 1.3.1 [ROOT CAUSE] Cần: CRUD chiếm full 3 cột, Bank info giữ nguyên
   │
   └─ 1.4 [Tab Địa chỉ] Preview sai dữ liệu, layout không đúng
       ├─ 1.4.1 [ROOT CAUSE] Cần: Tùy chọn 1/3, Preview 2/3
       └─ 1.4.2 [ROOT CAUSE] Cần: Dữ liệu thực Việt Nam (63 tỉnh, quận/huyện, phường/xã)
```

### Execution Plan

#### Phase 1: Lấy dữ liệu địa chỉ Việt Nam thực
- Sử dụng API: `https://raw.githubusercontent.com/qtv100291/Vietnam-administrative-division-json-server/master/db.json`
- Cấu trúc dữ liệu:
  - `province`: 63 tỉnh/thành (idProvince, name)
  - `commune`: ~11,000 phường/xã (idProvince, idCommune, name)
- Transform thành 3 file JSON static:
  - `public/data/vietnam-provinces.json` - 63 tỉnh
  - `public/data/vietnam-districts.json` - map idProvince -> districts (tạm dùng commune làm ward)
  - **Hoặc** dùng API trực tiếp với lazy loading

#### Phase 2: Refactor OrdersConfigTab layout theo tab

| Tab | Cột 1 | Cột 2 | Cột 3 |
|-----|-------|-------|-------|
| **Cài đặt chung** | Settings Card | Features Card | Fields Card |
| **Vận chuyển** | colspan-3: ShippingMethodsEditor (full width) | - | - |
| **Thanh toán** | colspan-2: PaymentMethodsEditor | Bank Info (1 cột) | - |
| **Địa chỉ** | Tùy chọn (1 cột) | colspan-2: Preview với data thực | - |

#### Phase 3: Cập nhật AddressPreview với data thực
- Fetch data từ static JSON hoặc API
- Hiển thị đầy đủ 63 tỉnh/thành
- Cascade selection: Tỉnh → Quận/Huyện → Phường/Xã
- Searchable combobox giữ nguyên

### Files cần sửa

| File | Thay đổi |
|------|----------|
| `OrdersConfigTab.tsx` | Điều chỉnh grid layout theo tab (conditional col-span) |
| `AddressPreview.tsx` | Fetch data thực từ static JSON, hiển thị đủ provinces |
| `public/data/vietnam-provinces.json` | Tạo mới - 63 tỉnh/thành |
| `public/data/vietnam-communes.json` | Tạo mới - phường/xã grouped by province |

### Giải pháp data địa chỉ

**Option A: Static JSON** (đơn giản, offline)
- Download và transform data từ GitHub API
- Ưu: Nhanh, không phụ thuộc network
- Nhược: File lớn (~500KB)

**Option B: Lazy loading** (tối ưu)
- Chỉ load provinces ban đầu
- Load communes khi chọn province
- Ưu: File nhỏ, load nhanh
- Nhược: Cần xử lý async

Đề xuất: **Option A** cho preview demo (đơn giản, đủ dùng cho config page)