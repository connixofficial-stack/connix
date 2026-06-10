## Kết quả phân tích

### Nguyên nhân gốc
**Không phải bug code**, mà là **hệ quả của CSS Grid layout**:

1. Tab "Cài đặt chung" sử dụng `grid lg:grid-cols-3`
2. Cột 1 (Cài đặt chung): chỉ có **2 items** (Số đơn/trang + Trạng thái mặc định)
3. Cột 2 (Tính năng): có **3 items**
4. Cột 3 (Trường Đơn hàng): có **nhiều items** (10+ fields)

→ Grid tự động căn chiều cao các cột bằng nhau, nên cột 1 (ít content nhất) bị "kéo giãn" để khớp với cột 3.

### Tùy chọn fix

**Option A: Giữ nguyên (chấp nhận UX hiện tại)**
- Không thay đổi gì, đây là hành vi bình thường của CSS Grid
- Các cột luôn có chiều cao bằng nhau → nhìn đều đặn

**Option B: Thay grid bằng flex**
- Dùng `flex flex-wrap items-start` thay vì `grid lg:grid-cols-3`
- Mỗi card tự căn chiều cao theo content
- Trade-off: cards không đều chiều cao, có thể trông "lệch"

**Option C: Sắp xếp lại layout**
- Gộp Cài đặt chung + Tính năng vào 1 cột
- Trường Đơn hàng chiếm 2 cột
- Cân bằng content hơn