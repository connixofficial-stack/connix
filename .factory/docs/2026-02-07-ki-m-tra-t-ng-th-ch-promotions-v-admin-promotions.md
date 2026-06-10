## Kết quả kiểm tra tương thích

### ✅ TƯƠNG THÍCH TỐT

| Thành phần | Customer (`/promotions`) | Admin (`/admin/promotions`) | Tương thích |
|------------|--------------------------|----------------------------|-------------|
| **Data source** | `listPublicPromotions` | `listAdminWithOffset` | ✅ Cùng table `promotions` |
| **promotionType** | Có labels đầy đủ 5 loại | Có labels đầy đủ 5 loại | ✅ Khớp |
| **discountType** | 7 loại (percent, fixed, buy_x_get_y...) | 7 loại | ✅ Khớp |
| **Experience config** | Đọc từ `promotions_list_ui` | Không áp dụng | ✅ Độc lập |
| **Status filter** | Chỉ lấy `Active` + `displayOnPage=true` | Filter theo UI | ✅ Logic đúng |

### ✅ Labels đồng bộ

**Promotion Type Labels:**
- Customer: `bundle: 'Combo'`, `campaign: 'Campaign'`, `coupon: 'Coupon'`, `flash_sale: 'Flash sale'`, `loyalty: 'Loyalty'`
- Admin: `bundle: 'Combo'`, `campaign: 'Chương trình'`, `coupon: 'Coupon'`, `flash_sale: 'Flash sale'`, `loyalty: 'Loyalty'`
- **⚠️ Nhỏ:** `campaign` khác nhau (`Campaign` vs `Chương trình`) - không ảnh hưởng logic

**Discount Type Labels:**
- Customer: 7 loại đầy đủ
- Admin: 7 loại đầy đủ - **Khớp**

### ✅ Experience Editor (`/system/experiences/promotions-list`)

Config sync với Customer page:
- `layoutStyle`: grid | list | banner ✅
- `showCountdown` ✅
- `showProgress` ✅  
- `showConditions` ✅
- `groupByType` ✅

### ✅ Data Flow

```
Admin tạo promotion → DB → listPublicPromotions filter → Customer view
                                    ↓
                              - status = "Active"
                              - displayOnPage = true  
                              - Trong thời gian valid
                              - Còn lượt/ngân sách
```

---

## KẾT LUẬN: **TƯƠNG THÍCH TỐT**

Không có vấn đề nghiêm trọng. Chỉ có 1 điểm nhỏ có thể cải thiện:
- Label `campaign`: Customer dùng `'Campaign'`, Admin dùng `'Chương trình'` - nên đồng nhất.

**Bạn có muốn tôi đồng bộ label `campaign` không?**