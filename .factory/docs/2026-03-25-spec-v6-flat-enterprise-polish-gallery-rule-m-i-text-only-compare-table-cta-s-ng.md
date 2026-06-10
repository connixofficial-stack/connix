## TL;DR kiểu Feynman
- Vấn đề hiện tại không chỉ là gallery sai rule, mà còn là UI còn quá nhiều lớp bọc, border, shadow nên nhìn máy móc.
- Em sẽ sửa gallery đúng rule mới: `3 = 3`, `4-5 = 3 ô với ô cuối +n`, `6 = 6`, `7+ = 6 ô với ô cuối +n`.
- Compare table sẽ là **text-only tuyệt đối**, không ảnh trong table.
- Ảnh sẽ ưu tiên `object-contain`, nền sáng sạch để không bị crop khó chịu.
- CTA `Xem chi tiết` / `Mua ngay` sẽ đổi sang kiểu sáng, nổi, dễ thấy hơn nhưng vẫn flat-design doanh nghiệp.

## Audit Summary
### Observation
1. `lib/posts/generator/assembler.ts`
   - `buildGalleryStrip()` hiện chỉ có rule đơn giản `1/2/3 rồi +n`, chưa khớp yêu cầu mới cho mốc `4-5`, `6`, `7+`.
   - Tile ảnh đang dùng `object-cover`, dễ cắt ảnh sai ngữ cảnh.
   - Button đang khá tối và chìm (`secondary` xám nhạt, primary chưa đủ sáng trong một số layout).
   - Nhiều block còn `rounded-2xl border border-slate-200 shadow-sm`, tạo cảm giác boxed/card-heavy.
2. Compare table hiện không thấy ảnh trong cell, nhưng cần khóa contract rõ hơn để tránh tái thêm thumbnail vào table trong lần refactor sau.
3. Hero/top-list/section wrappers vẫn còn nhiều lớp bọc và visual treatment nặng hơn style “flat doanh nghiệp rất tối giản”.

### Inference
- Root cause là layer HTML generator đang dùng pattern card/listing nhiều hơn editorial-flat layout; gallery và CTA chỉ là biểu hiện rõ nhất.

### Decision
- Chuyển thêm một bước từ “editorial cards” sang “flat enterprise article”: ít lớp bọc, ít shadow, ảnh contain, CTA sáng, hierarchy bằng spacing/typography thay vì box.

## Root Cause Confidence
**High** — vì evidence nằm trực tiếp ở class strings trong `assembler.ts`: gallery rule cứng sai, ảnh `object-cover`, CTA chưa nổi, section/card bọc nhiều lớp.

## Counter-Hypothesis
- Chỉ cần sửa gallery rule là đủ.  
  **Bác bỏ:** user phản hồi rõ cả CTA tối, ảnh bị crop, UI nhiều lớp bọc và cảm giác máy móc; nếu chỉ sửa gallery thì vẫn lệch mục tiêu visual.

## Files Impacted
### Shared / Generator
- **Sửa lớn:** `lib/posts/generator/assembler.ts`  
  Vai trò hiện tại: quyết định phần lớn HTML/visual contract của article.  
  Thay đổi:
  - cập nhật `buildGalleryStrip()` theo rule mới đã chốt;
  - chuyển ảnh sang `object-contain` + nền sáng trung tính;
  - giảm bớt border/shadow/rounded nặng ở hero, product card, section wrappers, toc, footer blocks;
  - tinh chỉnh `buildButton()` để CTA sáng, rõ, tương phản tốt;
  - giữ compare table text-only và không render ảnh trong table dưới mọi nhánh.

### UI preview
- **Sửa nhẹ-vừa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: render modal preview cho HTML generated.  
  Thay đổi:
  - đồng bộ modal background/button với hướng flat sáng-sạch hơn;
  - giữ logic modal hiện tại, chỉ tinh chỉnh presentation nếu cần để khớp visual mới.

## Rule gallery mới sẽ áp dụng
1. **1 ảnh** → 1 ô.
2. **2 ảnh** → 2 ô.
3. **3 ảnh** → 3 ô.
4. **4-5 ảnh** → 3 ô trong 1 hàng, ô cuối là `+n`.
5. **6 ảnh** → hiện đủ 6 ô (2 hàng x 3 cột).
6. **7+ ảnh** → hiện 6 ô, ô cuối là `+n`.
7. Tất cả ảnh dùng `object-contain`, không crop chủ thể.

## Flat design direction
- Nền sáng, ít border, gần như không shadow.
- Hierarchy bằng khoảng trắng + font-weight + màu chữ.
- CTA primary xanh sáng rõ, secondary sáng hơn hiện tại, dễ nhìn trên nền trắng.
- Giảm `rounded-2xl/3xl` và các khối card lặp lại không cần thiết.
- Ưu tiên cảm giác “giao diện doanh nghiệp hiện đại” thay vì “widget dashboard xếp dọc”.

## Execution Preview
1. Đọc lại các helper render trong `assembler.ts` để gom các class visual đang nặng.
2. Sửa `buildGalleryStrip()` theo rule 3/4-5/6/7+ và chuyển ảnh sang contain.
3. Tinh chỉnh `buildButton()` + các wrapper hero/card/section sang flat tối giản.
4. Rà compare table để khóa text-only contract.
5. Nếu cần, đồng bộ nhẹ modal preview trong `page.tsx`.
6. Static review + `bunx tsc --noEmit`.
7. Commit kèm spec v6.

## Acceptance Criteria
1. 3 ảnh hiển thị đủ 3 ô.
2. 4-5 ảnh hiển thị 3 ô, ô cuối là `+n`.
3. 6 ảnh hiển thị đủ 6 ô.
4. 7+ ảnh hiển thị 6 ô, ô cuối là `+n`.
5. Ảnh trong article dùng contain, không bị crop mạnh.
6. Compare table chỉ có text, không có ảnh.
7. CTA `Mua ngay` / `Xem chi tiết` sáng hơn, nổi hơn, dễ thấy.
8. Section tổng thể ít lớp bọc hơn, hầu như không shadow, cảm giác flat enterprise rõ hơn.

## Verification Plan
- Chạy `bunx tsc --noEmit`.
- Manual check preview với 4 case gallery: 3 / 4-5 / 6 / 7+ ảnh.
- Check ảnh tỷ lệ khác nhau vẫn không bị crop chủ thể chính.
- Check compare table không xuất hiện ảnh.
- Check CTA đủ contrast trên nền sáng.

## Out of Scope
- Không đổi logic chọn sản phẩm hay thứ tự nội dung.
- Không thêm thư viện UI/lightbox mới.

## Risk / Rollback
- Risk: giảm quá nhiều wrapper có thể làm một số block thiếu phân tách.
- Mitigation: giữ phân tách bằng spacing, divider nhẹ và typography thay vì card/shadow.
- Rollback: có thể phục hồi từng wrapper cụ thể nếu một block bị mất hierarchy quá mức.