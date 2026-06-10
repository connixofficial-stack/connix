# I. Primer
## 1. TL;DR kiểu Feynman
- Thêm công tắc `Bật đặt lịch` ở form tạo/sửa dịch vụ.
- Khi **bật**, hiện nhóm cấu hình đi kèm (đặc biệt: `Số người tối đa có thể trùng lịch` = `bookingCapacityPerSlot`).
- Khi **tắt**, ẩn toàn bộ cấu hình booking và dịch vụ không hiện ở `/book`.
- Ở `/admin/bookings`, ẩn toàn bộ booking thuộc dịch vụ đã tắt.

## 2. Elaboration & Self-Explanation
- Bạn muốn UX rõ ràng: công tắc ON/OFF điều khiển trực tiếp việc có hiển thị thông tin booking nâng cao hay không.
- Dữ liệu backend đã có sẵn các field booking (`bookingDurationMin`, `bookingSlotIntervalMin`, `bookingCapacityPerSlot`), nên chỉ cần mở UI đúng chỗ + lọc admin bookings theo `bookingEnabled`.
- Vì bạn chốt “mặc định bật như hiện tại”, trang create vẫn giữ default ON, chỉ bổ sung UI để có thể tắt khi cần.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể:
  - Service “Gội đầu” bật đặt lịch → hiện thêm:
    - Thời lượng lịch (phút)
    - Khoảng cách mỗi slot (phút)
    - Số người tối đa trùng lịch (ví dụ 3)
  - Chuyển OFF và lưu → service biến mất khỏi `/book`, booking của service này không còn hiện ở `/admin/bookings`.
- Analogy:
  - Toggle như “công tắc mở quầy”: mở quầy thì hiện đầy đủ thông số vận hành, đóng quầy thì ẩn khỏi màn điều phối.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Edit service đã có state booking nhưng chưa có UI hiển thị/cấu hình.
  - Create service đang mặc định `bookingEnabled=true` nhưng chưa có toggle UI.
  - `/book` đã lọc theo service bật booking qua `listBookableServices`.
  - `/admin/bookings` chưa lọc booking theo trạng thái bật/tắt service.
- Inference:
  - Thiếu surface UI + thiếu filter ở admin bookings là nguyên nhân chính.
- Decision:
  - Bổ sung UI toggle + hiển thị có điều kiện các field booking; bổ sung filter query admin bookings theo `bookingEnabled=true`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause (High):
  1. Không có toggle booking trong form service nên không điều khiển rõ ON/OFF.
  2. Admin bookings chưa lọc theo dịch vụ còn bật booking.
- Counter-Hypothesis:
  - “Public /book không lọc bookingEnabled” → sai (đã lọc đúng).
  - “Thiếu field backend” → sai (field đã có trong services model/schema).
- Root Cause Confidence: **High** (evidence trực tiếp từ code paths đã đọc).

# IV. Proposal (Đề xuất)
```mermaid
flowchart TD
  A[Service Form] --> B{bookingEnabled}
  B -- ON --> C[Hiện booking config]
  C --> C1[Duration phút]
  C --> C2[Slot interval phút]
  C --> C3[Capacity trùng lịch]
  B -- OFF --> D[Ẩn booking config]
  B --> E[/book danh sách service]
  B --> F[/admin/bookings lọc theo service ON]
```

- UI ở `create` và `edit`:
  - Thêm checkbox/toggle `Bật đặt lịch`.
  - Nếu ON: render card “Cấu hình đặt lịch” gồm 3 input số:
    - `bookingDurationMin` (mặc định 60)
    - `bookingSlotIntervalMin` (mặc định 30)
    - `bookingCapacityPerSlot` (mặc định 1) — label rõ: **Số người tối đa có thể trùng lịch**
  - Nếu OFF: ẩn card cấu hình.
- Backend/query admin bookings:
  - Thêm `enabledServiceOnly?: boolean` cho:
    - `bookings.listAdminWithOffset`
    - `bookings.countAdmin`
    - `bookings.listAdminIds`
  - Khi `enabledServiceOnly=true`: chỉ giữ booking có `service.bookingEnabled===true`.
- Admin bookings page:
  - Truyền `enabledServiceOnly: true` vào 3 query trên.
  - Source dropdown dịch vụ dùng `api.bookings.listBookableServices` để khớp logic hiển thị.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/services/create/page.tsx`
  - Vai trò hiện tại: tạo service.
  - Thay đổi: thêm toggle booking + card cấu hình conditional khi bật.
- Sửa: `app/admin/services/[id]/edit/page.tsx`
  - Vai trò hiện tại: chỉnh sửa service.
  - Thay đổi: thêm toggle booking + card cấu hình conditional khi bật.
- Sửa: `convex/bookings.ts`
  - Vai trò hiện tại: truy vấn/đếm bookings admin/public.
  - Thay đổi: thêm lọc `enabledServiceOnly` cho luồng admin.
- Sửa: `app/admin/bookings/page.tsx`
  - Vai trò hiện tại: hiển thị lịch và danh sách booking admin.
  - Thay đổi: dùng filter chỉ dịch vụ bật booking + chỉ hiển thị booking của dịch vụ bật.

# VI. Execution Preview (Xem trước thực thi)
1. Cấy UI toggle + conditional booking config vào create service.
2. Cấy UI toggle + conditional booking config vào edit service.
3. Mở rộng args và lọc ở Convex bookings admin queries.
4. Cập nhật call-site `/admin/bookings` truyền `enabledServiceOnly: true`.
5. Review tĩnh type/null-safe + tương thích call-sites cũ.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Manual flow:
  1. Tạo service mới: toggle ON → thấy đủ 3 field cấu hình (đặc biệt capacity trùng lịch).
  2. Tắt toggle và lưu → service ẩn khỏi `/book`.
  3. Mở `/admin/bookings` → không còn booking của service đã OFF.
  4. Bật lại toggle → service xuất hiện lại ở `/book` và booking quay lại ở admin bookings.
- Typecheck:
  - Chạy `bunx tsc --noEmit` sau khi sửa code TS.

# VIII. Todo
- [ ] Thêm toggle + booking config conditional ở create service.
- [ ] Thêm toggle + booking config conditional ở edit service.
- [ ] Bổ sung `enabledServiceOnly` trong Convex bookings admin queries.
- [ ] Cập nhật `/admin/bookings` dùng filter dịch vụ bật.
- [ ] Self-review + typecheck.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Pass:
  - Toggle booking xuất hiện ở create/edit service.
  - Bật toggle thì hiện nhóm thông tin booking kèm theo, gồm “Số người tối đa có thể trùng lịch”.
  - Tắt toggle thì nhóm booking config bị ẩn.
  - Service OFF không hiện ở `/book`.
  - Booking của service OFF không hiện ở `/admin/bookings`.
- Fail:
  - Toggle ON nhưng không hiện đủ field cấu hình.
  - Service OFF vẫn còn booking hiển thị ở admin bookings.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro:
  - Nếu lọc sai thứ tự (slice trước filter) sẽ lệch count/pagination.
- Rollback:
  - Tắt `enabledServiceOnly` ở call-site `/admin/bookings` và query logic liên quan.
  - Giữ UI toggle độc lập để không ảnh hưởng dữ liệu cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi schema.
- Không migrate dữ liệu hàng loạt.
- Không chỉnh flow booking public ngoài logic ẩn/hiện theo `bookingEnabled`.

# XII. Open Questions (Câu hỏi mở)
- Không còn câu hỏi mở; yêu cầu đã rõ theo cập nhật mới.