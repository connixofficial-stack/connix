## Audit Summary
- Observation: Route edit `app/admin/home-components/footer/[id]/edit/page.tsx` và route create `app/admin/home-components/create/footer/page.tsx` đều render chung `FooterPreview` và `FooterForm`.
- Observation: Kích thước icon social và logo Bộ Công Thương hiện đang hard-code trực tiếp trong `app/admin/home-components/footer/_components/FooterPreview.tsx` theo từng style preview.
- Observation: Social icon hiện dùng các cặp size chính như `h-6 w-6` + icon `14`, `h-5 w-5` + icon `12`, `h-7 w-7` + icon `14`; logo BCT dùng chủ yếu `h-7` hoặc `h-8`.
- Inference: Vì create/edit dùng chung preview component, sửa đúng trong `FooterPreview.tsx` sẽ áp dụng đồng thời cho cả 2 màn như yêu cầu, không cần đụng flow submit hay schema.
- Decision: Tăng đồng đều khoảng 20% cho các kích thước social và logo BCT ngay trong preview footer, giữ nguyên layout/pattern hiện có để rollback dễ.

## Root Cause Confidence
- High — nguyên nhân là size đang được set cố định khá nhỏ trong `FooterPreview.tsx`, không có scale riêng cho social/BCT. Evidence nằm ở các đoạn class `h-5/h-6/h-7/h-8` và prop icon `size={12|14}` trong cùng file.
- Counter-hypothesis đã loại trừ: không phải do route create/edit khác nhau, vì cả hai cùng import một `FooterPreview`; không phải do form config, vì `FooterForm` hiện chưa có control riêng cho social/BCT size.

## Proposal
1. Chỉ sửa file `app/admin/home-components/footer/_components/FooterPreview.tsx`.
2. Áp dụng scale ~20% cho social icon ở tất cả 6 style:
   - `h-5 w-5` -> khoảng `h-6 w-6`
   - `h-6 w-6` -> khoảng `h-7 w-7`
   - `h-7 w-7` -> khoảng `h-8 w-8`
   - icon `12` -> `14`
   - icon `14` -> `17`
3. Áp dụng scale ~20% cho logo Bộ Công Thương:
   - `h-7` -> `h-8`
   - `h-8` -> có thể dùng inline style/utility gần nhất để ra khoảng `~9.6` (ưu tiên cách nhỏ gọn, an toàn với Tailwind hiện có; nếu không có utility phù hợp sẽ dùng class gần nhất theo pattern repo).
4. Giữ nguyên spacing/gap trừ khi có chỗ bị chật; chỉ tinh chỉnh tối thiểu nếu một style bị vỡ hàng.
5. Không đổi schema/type/config vì user chỉ yêu cầu tăng mặc định 20%, không yêu cầu thêm setting mới.

## Post-Audit / Impact
- Phạm vi ảnh hưởng: chỉ preview/admin UI của home-component Footer trên create/edit.
- Không ảnh hưởng Convex, data cũ, API hay render logic ngoài footer preview.
- Rủi ro chính: một vài style compact (đặc biệt `minimal`, `corporate`, `stacked`) có thể hơi chật sau khi tăng size; sẽ xử lý bằng chỉnh rất nhỏ gap nếu cần, vẫn trong cùng file.

## Verification Plan
- Static verify:
  1. Soát lại tất cả occurrences social/BCT trong `FooterPreview.tsx` để chắc không sót style nào.
  2. Kiểm tra consistency create/edit vì cùng dùng chung component.
  3. Tự review layout ở các style compact để tránh overflow về mặt code.
- Repro/pass criteria:
  1. Tại `/admin/home-components/footer/[id]/edit` preview footer hiển thị social icons và logo BCT lớn hơn khoảng 20%.
  2. Tại `/admin/home-components/create/footer` preview hiển thị giống hệt mức tăng đó.
  3. Không đổi behavior form, không phát sinh type error logic từ phần sửa.
- Theo rule repo, tôi sẽ không chạy lint/unit test/build; nếu user duyệt spec, khi thực thi tôi sẽ sửa code tối thiểu rồi commit local theo guideline.