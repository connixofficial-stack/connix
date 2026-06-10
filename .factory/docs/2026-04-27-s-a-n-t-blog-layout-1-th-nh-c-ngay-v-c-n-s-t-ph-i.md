# I. Primer

## 1. TL;DR kiểu Feynman

- Blog layout 1 đang dùng chung component runtime cho cả preview admin và site thật.
- Nút đang ghi `Xem chi tiết`, dài và dễ bị chật trong card nhỏ.
- Row chứa ngày + nút hiện chưa có `justify-between`, nên nút không được đẩy sát phải.
- Sửa đúng 1 file shared runtime là preview và site thật cùng đổi.
- Không chạy lint/build theo rule dự án; chỉ tự review tĩnh sau khi sửa.

## 2. Elaboration & Self-Explanation

Vấn đề nằm ở phần render `layout1` trong `BlogSectionRuntime`. Preview admin (`BlogPreview`) và site thật (`components/site/BlogSection.tsx`) đều gọi `BlogSectionRuntime`, nên không cần sửa hai nơi riêng biệt. Cách sửa nhỏ nhất là đổi text button từ `Xem chi tiết` thành `Đọc ngay`, đồng thời thêm phân bổ layout cho row chứa ngày và nút để nút nằm sát cạnh phải card trên desktop/tablet.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể: trong card có ngày `27/4/2026` bên trái và nút `Xem chi tiết` bên phải. Vì row chưa `justify-between`, hai phần tử đứng gần nhau thay vì tách ra hai mép. Sau sửa, ngày giữ trái, nút `Đọc ngay` nằm sát phải như user mong muốn.

Analogy: giống một thanh ngang có hai món đồ; nếu không bảo “một món đứng đầu, một món đứng cuối”, chúng sẽ đứng cạnh nhau. Thêm `justify-between` là đặt quy tắc “mỗi món về một mép”.

# II. Audit Summary (Tóm tắt kiểm tra)

- Observation: User báo layout 1 ở route `/admin/home-components/blog/[id]/edit` có vấn đề nút xem chi tiết, muốn đổi thành `Đọc ngay` và sửa cả preview lẫn site thật.
- Evidence: `app/admin/home-components/blog/_components/BlogPreview.tsx` gọi `BlogSectionRuntime` cho preview.
- Evidence: `components/site/BlogSection.tsx` gọi cùng `BlogSectionRuntime` cho site thật.
- Evidence: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` layout 1 hiện render button text `Xem chi tiết`.
- Evidence: `layoutButtonRowClassName` hiện là `flex-row items-center gap-0` trên desktop/tablet, chưa có `justify-between`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- Root Cause Confidence: High.
- Nguyên nhân gốc: row chứa date + button thiếu class căn hai mép (`justify-between`), nên button không được đẩy sát phải; text `Xem chi tiết` cũng dài hơn yêu cầu mới.
- Triệu chứng expected vs actual: expected nút ở sát góc phải và gọn; actual nút không sát phải, text dài.
- Phạm vi ảnh hưởng: chỉ Blog home component layout 1, preview admin và site thật.
- Tái hiện: chọn style/layout 1 trong editor blog, xem card có ngày + nút ở footer card.
- Giả thuyết thay thế: có thể chỉ cần đổi text ngắn hơn; nhưng ảnh chụp cho thấy vấn đề vị trí, nên chỉ đổi text chưa đủ chắc.
- Rủi ro nếu fix sai: ảnh hưởng layout khác nếu sửa class dùng chung cho nhiều layout; vì vậy chỉ kiểm tra nơi `layoutButtonRowClassName` đang được dùng trong layout 1/4 để tránh side-effect.
- Tiêu chí pass/fail: pass khi layout 1 hiển thị `Đọc ngay`, nút nằm bên phải row; fail nếu layout khác bị lệch hoặc preview/site không đồng bộ.

# IV. Proposal (Đề xuất)

Sửa tối thiểu trong `BlogSectionRuntime`:

- Đổi `layoutButtonRowClassName` desktop/tablet từ `flex-row items-center gap-0` thành `flex-row items-center justify-between gap-3`.
- Giữ mobile là `flex-col items-start gap-3` để tránh ép layout ngang trên màn nhỏ.
- Đổi text button trong layout 1 từ `Xem chi tiết` thành `Đọc ngay`.
- Review nhanh các layout đang dùng `layoutButtonRowClassName` để đảm bảo không gây lệch ngoài ý muốn.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Sửa: `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` hiện là runtime shared render các layout blog. Thay đổi class căn hàng nút và label button layout 1 tại đây để preview và site thật cùng cập nhật.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại quanh `layoutButtonRowClassName` và block `style === 'layout1'`.
2. Chỉnh class row desktop/tablet để có `justify-between`.
3. Đổi label button layout 1 thành `Đọc ngay`.
4. Tự review tĩnh: kiểm tra TypeScript JSX hợp lệ, class không sai cú pháp, không chạm layout ngoài scope.
5. Commit thay đổi theo rule dự án sau khi chỉnh code.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Không chạy `npm run lint`, `npm run build`, unit test theo instruction dự án: “Cấm tuyệt đối tự chạy lint/unit test”.
- Không chạy `bunx tsc --noEmit` trong spec mode; sau khi được duyệt và có code change, sẽ cân nhắc theo rule repo trước commit.
- Verify tĩnh bằng đọc diff: đảm bảo preview và site thật dùng chung runtime nên cùng nhận thay đổi.
- Verify logic: layout 1 có text `Đọc ngay`; row desktop/tablet có `justify-between`; mobile không bị ép ngang.

# VIII. Todo

- [ ] Sửa `layoutButtonRowClassName` cho desktop/tablet.
- [ ] Đổi label button layout 1 thành `Đọc ngay`.
- [ ] Review static diff.
- [ ] Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Blog layout 1 trong preview admin hiển thị nút `Đọc ngay`.
- Blog layout 1 trên site thật hiển thị nút `Đọc ngay`.
- Trên desktop/tablet, nút nằm sát phía phải của footer card, ngày nằm phía trái.
- Trên mobile, layout vẫn không vỡ và vẫn dễ bấm.
- Không thay đổi behavior/link của card hoặc nút.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp vì sửa 1 runtime shared và 1 class nhỏ.
- Rủi ro phụ: `layoutButtonRowClassName` có thể đang dùng lại ở layout khác trong cùng file; sẽ review vị trí dùng trước khi sửa để tránh làm lệch ngoài layout 1.
- Rollback: revert commit hoặc đổi lại class/text trong `BlogSectionRuntime.tsx`.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi thiết kế toàn bộ card blog.
- Không đổi routing/link bài viết.
- Không sửa các layout blog khác trừ khi phát hiện class shared gây side-effect trực tiếp.