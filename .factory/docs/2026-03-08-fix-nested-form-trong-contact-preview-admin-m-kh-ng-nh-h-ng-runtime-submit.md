## Audit Summary

### Evidence
- `app/admin/home-components/create/shared.tsx:197` bọc create page bằng `<form onSubmit={handleFormSubmit}>`.
- `components/contact/ContactInquiryForm.tsx:91` luôn render `<form>` dù đang ở `isPreview=true`.
- `ContactPreview` -> `ContactSectionShared` -> `ContactInquiryForm` được render ngay trong create/edit preview admin, nên DOM thành `form > ... > form`.
- Lỗi console đã chỉ rõ ancestor stack: `ComponentFormWrapper` -> `ContactCreatePage` -> `ContactPreview` -> `ContactInquiryForm`.

### Audit Questions
1) Triệu chứng: hydration error do nested `<form>` trong admin create/edit preview.  
3) Repro: ổn định ở `/admin/home-components/create/contact`, và cùng risk ở edit preview nếu render trong outer form.  
6) Giả thuyết thay thế: không phải do Next 16 riêng lẻ hay Turbopack; lỗi là invalid HTML structure.  
8) Pass/fail: preview admin không còn render thẻ `<form>` lồng nhau; runtime `/contact` và experiences thật vẫn submit bình thường.

---

## Root Cause Confidence

**High**
- Root cause #1: `ContactInquiryForm` không phân biệt semantic wrapper giữa preview mode và runtime mode.  
- Root cause #2: Preview admin tái sử dụng runtime form component trực tiếp bên trong outer create/edit form.

---

## Problem Graph
1. [Main] Nested form gây hydration error trong admin preview <- depends on 1.1, 1.2
   1.1 [Preview dùng form thật] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `ContactInquiryForm` luôn render `<form>`
   1.2 [Admin page có outer form] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] `ComponentFormWrapper` cần form thật để submit create/edit

---

## Execution (with reflection)
1. Solving 1.1.1
- Thought: preview chỉ cần mô phỏng UI, không cần semantic submit form thật.
- Action: cho `ContactInquiryForm` render wrapper khác khi `isPreview=true`.
- Reflection: ✓ Loại trực tiếp nested form mà ít blast radius nhất.

2. Solving 1.2.1
- Thought: outer admin form đang đúng vai trò và không nên phá để né nested form.
- Action: giữ nguyên `ComponentFormWrapper`, chỉ đổi preview branch của form con.
- Reflection: ✓ KISS, ít regression hơn đổi submit architecture.

---

## Proposal (step-by-step actionable)

### Bước 1 — Tách semantic wrapper cho ContactInquiryForm
**File:** `components/contact/ContactInquiryForm.tsx`
- Tạo branch wrapper theo mode:
  - `isPreview === true` -> render `<div role="form" aria-disabled="true">` hoặc wrapper tương đương, KHÔNG dùng `<form>`.
  - runtime thật -> giữ `<form onSubmit={handleSubmit}>` như hiện tại.
- Toàn bộ children UI giữ nguyên để preview parity không đổi.
- Với preview mode:
  - button giữ `type="button"` hoặc disabled để tránh submit semantics.
  - không gọi `handleSubmit`.

### Bước 2 — Giữ API component ổn định
**File:** `components/contact/ContactInquiryForm.tsx`
- Không đổi props public đang dùng ở site/experience/admin.
- Chỉ thay internal wrapper logic để tránh phải sửa hàng loạt call sites.

### Bước 3 — Verify call sites không cần refactor lớn
**Files check:**
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `components/experiences/previews/ContactPreview.tsx`
- `app/(site)/contact/page.tsx`
- Xác nhận:
  - preview/admin đang truyền `isPreview` -> tự động safe.
  - runtime thật không truyền hoặc `false` -> vẫn là form thật.

### Bước 4 — Regression guard cho accessibility/HTML validity
**Files:** `ContactInquiryForm.tsx`
- Preview wrapper thêm semantics tối thiểu (`role="form"`, `aria-disabled`) để screen reader không hiểu nhầm là form submit thật.
- Đảm bảo không còn button submit thật bên trong admin outer form nếu đang preview.

---

## Verification Plan
1. `bunx tsc --noEmit`  
2. Repro manual:
   - mở `/admin/home-components/create/contact`
   - mở `/admin/home-components/contact/[id]/edit`
   - confirm console không còn lỗi nested form / hydration error
3. Runtime checks:
   - `/contact` vẫn gửi form bình thường
   - experiences/site runtime không đổi hành vi submit
4. Pass criteria:
   - admin preview render đẹp như cũ nhưng không có `<form>` lồng `<form>`
   - runtime submit thật không bị ảnh hưởng