## Audit Summary

### Evidence từ code
- `ContactSectionShared.tsx`
  - `renderMapOrPlaceholder` đang inject Google iframe nguyên bản (`dangerouslySetInnerHTML`) nên width/height inline từ Google không bị ép full trong mọi layout.
  - Nhiều layout dùng khung map có chiều cao cố định thấp (`h-40`, `h-52`, `h-56`) khiến map nhìn “trải không đều”.
  - Form đang đặt trong nhiều wrapper/cột khác nhau nên có layout bị bó (đặc biệt khi thông tin contact và form cạnh nhau).
- `ContactInquiryForm.tsx`
  - Có mode `withContainer` và grid field hiện hỗ trợ 2 cột ở md (`md:grid-cols-2`), khác tiêu chí mới “full-width 1 cột”.
- `ContactPreview.tsx` + preview frame
  - Preview chạy trong khung browser + width giả lập, nên khi map/form không dùng contract kích thước thống nhất sẽ lộ rõ lệch tỷ lệ.

### Audit Questions
1) Triệu chứng: map và form không full, chưa cân layout ở cả 6 style.  
3) Repro: ổn định khi đổi style + device trong Preview Contact.  
6) Giả thuyết thay thế: không phải do dữ liệu map sai; chủ yếu do render contract (iframe sizing + container sizing).  
8) Pass/fail: map luôn fill 100% khung, form full-width 1 cột, fallback rõ ràng khi thiếu data.

---

## Root Cause Confidence

**High**
- Root cause #1: Thiếu map sizing contract chuẩn hóa (Google iframe inline style không bị normalize).  
- Root cause #2: Form layout contract chưa thống nhất giữa 6 style (có nơi 2 cột, có nơi nested card gây bó).  
- Root cause #3: Chưa có quy ước chiều cao map theo tier layout (hero/inline/sidebar).

---

## Problem Graph
1. [Main] Form/map hiển thị chưa full, chưa đẹp ở 6 layout <- depends on 1.1, 1.2, 1.3
   1.1 [Map full-width failure] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Google iframe không normalize width/height/style
   1.2 [Form density inconsistency] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Form grid và wrapper không thống nhất contract 1 cột full-width
   1.3 [Layout scale mismatch] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Map block heights khác nhau, chưa phân tier rõ

---

## Execution (with reflection)
1. Solving 1.1.1
- Thought: map phải fill 100% khung bất kể provider.
- Action: thêm sanitizer/normalizer cho Google iframe để ép style `width:100%;height:100%;border:0;display:block`.
- Reflection: ✓ Đúng yêu cầu “Luôn ép map fill 100%”.

2. Solving 1.2.1
- Thought: form enterprise nên 1 cột full-width cho tính nhất quán.
- Action: đổi form fields layout về single-column ở mọi breakpoint, chuẩn spacing/padding đồng nhất.
- Reflection: ✓ Giảm cảm giác bó/chật.

3. Solving 1.3.1
- Thought: map cần height contract theo ngữ cảnh thay vì hardcode rời rạc.
- Action: định nghĩa 3 map height tiers (hero/standard/compact) và áp dụng đồng bộ 6 layouts.
- Reflection: ✓ Giao diện nhất quán hơn giữa style.

---

## Proposal (step-by-step actionable)

### Bước 1 — Chuẩn hóa map rendering contract
**Files:**
- `lib/contact/getContactMapData.ts`
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `app/(site)/contact/page.tsx`
- Bổ sung helper normalize Google iframe HTML:
  - remove width/height inline cũ
  - inject style chuẩn full fill
  - giữ `loading="lazy"`, `referrerpolicy` an toàn
- `renderMapOrPlaceholder` luôn render map trong wrapper `absolute inset-0` hoặc block 100% height.

### Bước 2 — Áp map height tiers đồng nhất cho 6 layout
**File:** `ContactSectionShared.tsx`
- Tạo constants:
  - `MAP_HEIGHT_HERO = 'min-h-[320px]'`
  - `MAP_HEIGHT_STANDARD = 'h-64'`
  - `MAP_HEIGHT_COMPACT = 'h-48'`
- Gán theo layout:
  - modern/elegant: hero/standard
  - floating/centered/grid/minimal: standard/compact theo vị trí
- Loại các `h-40/h-52/h-56` rời rạc.

### Bước 3 — Chuẩn hóa form full-width 1 cột cho mọi layout
**File:** `components/contact/ContactInquiryForm.tsx`
- Đổi grid input về 1 cột toàn bộ (`grid-cols-1`), không dùng `md:grid-cols-2`.
- Chuẩn hóa padding + field height + spacing để tạo mật độ enterprise ổn định.
- Giữ behavior validate/submit hiện tại.

### Bước 4 — Tái cân 6 layout để tránh “form bị bó”
**File:** `ContactSectionShared.tsx`
- Mọi layout có form:
  - form luôn trong block full-width của cột chứa nó
  - bỏ nested wrappers không cần thiết gây giảm chiều ngang hữu dụng
- Với layout có info + form cạnh nhau: ưu tiên tỷ lệ cột `1fr / 1fr` hoặc `1fr / 1.05fr`, không dùng cột quá hẹp.

### Bước 5 — Fallback UX rõ ràng (theo quyết định user)
**Files:**
- `ContactSectionShared.tsx`
- `app/admin/home-components/contact/_components/ContactPreview.tsx`
- Nếu map data thiếu:
  - hiện placeholder rõ + text actionable
  - thêm CTA/link “Cấu hình trong /admin/settings” ở preview/edit context
- Không ẩn block âm thầm.

### Bước 6 — QA matrix 6 layouts
**Files check:** create/edit preview + site contact + experience preview
- Với mỗi layout:
  - Desktop/Tablet/Mobile
  - Form ON/OFF
  - Map ON/OFF
  - map provider OSM/Google
- Expected:
  - map fill full khung
  - form 1 cột full-width
  - không vỡ spacing/hierarchy.

---

## Verification Plan
1. Typecheck: `bunx tsc --noEmit`.
2. Visual regression manual:
   - `/admin/home-components/create/contact`
   - `/admin/home-components/contact/[id]/edit`
   - `/system/experiences/contact`
   - `/contact`
3. Repro checks:
   - Google iframe với width/height cứng vẫn full khi render.
   - OSM render full chiều cao khung tương ứng.
4. Pass criteria:
   - 6/6 layout đạt “map full + form full 1 cột + fallback rõ ràng”.