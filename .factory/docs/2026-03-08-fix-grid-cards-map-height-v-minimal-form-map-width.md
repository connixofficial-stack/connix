## Audit Summary

### Evidence
- `renderGrid` trong `ContactSectionShared.tsx`
  - Cột phải đang dùng map wrapper `MAP_HEIGHT_COMPACT` ở desktop, nên thấp hơn đáng kể so với card form bên trái.
  - Hai cột grid chưa có contract `items-stretch`/`h-full`, nên card map không tự bằng chiều cao card form.
- `renderMinimal` trong `ContactSectionShared.tsx`
  - Map đang nằm cùng hàng footer với social và bị khóa `w-80` ở desktop.
  - Đây là root cause trực tiếp khiến map nhìn hẹp dù khung tổng còn rộng.

### Audit Questions
1) Triệu chứng: Grid Cards map thấp hơn form; Minimal Form map quá hẹp.  
3) Repro: tái hiện ổn định trong preview desktop.  
6) Giả thuyết thay thế: không phải do dữ liệu map/provider; là do width/height contract của layout.  
8) Pass/fail: Grid map cao bằng card form; Minimal map full-width hàng riêng bên dưới form.

---

## Root Cause Confidence

**High**
- Root cause #1: Grid layout đang ép map theo compact height thay vì stretch theo cột form.  
- Root cause #2: Minimal layout đang khóa width desktop ở `w-80` và đặt map trong footer ngang.

---

## Problem Graph
1. [Main] Grid/Minimal còn lệch kích thước map <- depends on 1.1, 1.2
   1.1 [Grid map thấp] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Wrapper map dùng compact height, card không stretch cùng chiều cao form
   1.2 [Minimal map hẹp] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Map bị khóa `w-80` trong footer ngang với social

---

## Execution (with reflection)
1. Solving 1.1.1
- Thought: nếu user muốn map cao bằng form card thì grid 2 cột phải stretch cùng chiều cao.
- Action: cho row grid `items-stretch`, card phải `h-full flex flex-col`, phần map `flex-1 min-h-[...] absolute inset-0`.
- Reflection: ✓ Đúng với yêu cầu “bằng chiều cao card form bên trái”.

2. Solving 1.2.1
- Thought: minimal map cần thoát khỏi footer ngang để chiếm trọn bề ngang.
- Action: tách social và map thành 2 block dọc; map chuyển thành full-width row riêng bên dưới.
- Reflection: ✓ Khắc phục trực tiếp vấn đề “chưa đủ rộng”.

---

## Proposal (step-by-step actionable)

### Bước 1 — Fix Grid Cards map height bằng form height
**File:** `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- Trong `renderGrid`:
  - đổi grid 2 cột chính sang trạng thái stretch ở desktop
  - card form và card map đều `h-full`
  - card map thành `flex flex-col`
  - block map dùng `flex-1` để chiếm hết phần còn lại sau phần địa chỉ
  - giữ mobile stack như hiện tại
- Kết quả: ở desktop, map card sẽ cao bằng card form bên trái thay vì bị giới hạn bởi `MAP_HEIGHT_COMPACT`.

### Bước 2 — Fix Minimal Form map width full row
**File:** `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- Trong `renderMinimal`:
  - tách footer hiện tại thành 2 phần:
    1. social row (nếu có)
    2. map row full-width bên dưới
  - bỏ `w-80` desktop
  - map wrapper dùng `w-full` + `MAP_HEIGHT_STANDARD` hoặc mức cao tương đương để map nhìn đủ lớn
- Kết quả: map nằm full-width dưới form, nhìn đúng với layout “Minimal Form”.

### Bước 3 — Review spacing/hierarchy
**File:** `ContactSectionShared.tsx`
- cân lại margin-top/border-top giữa form, social, map để tránh cảm giác dồn cục sau khi tách row
- không thay đổi logic submit/form/map provider

---

## Verification Plan
1. `bunx tsc --noEmit`
2. Manual check tại preview Contact:
   - Grid Cards desktop: map card cao bằng form card
   - Minimal Form desktop: map full-width hàng riêng
   - Mobile: không bị vỡ stack
3. Pass criteria:
   - Grid Cards không còn map thấp hụt
   - Minimal Form không còn map hẹp ở góc phải