# I. Primer

## 1. TL;DR kiểu Feynman
- Khi người quản lý tắt thiết lập "Mô tả ngắn" (Short Description / Excerpt) của tài nguyên trong trang Cấu hình Module Hệ thống, hệ thống cần ẩn hoàn toàn mô tả ngắn khỏi cả trang danh sách tài nguyên và trang tạo/sửa tài nguyên.
- Hiện tại, trang Tạo mới và Chỉnh sửa đã ẩn/hiện đúng theo thiết lập này, nhưng trang Danh sách (`/admin/resources`) vẫn hiển thị dòng chữ "Chưa có mô tả ngắn" khi thiết lập này bị tắt.
- Giải pháp: Truy vấn danh sách các trường được bật (`listEnabledModuleFields`) trong trang danh sách tài nguyên và chỉ render mô tả ngắn khi trường `excerpt` nằm trong danh sách được bật.

## 2. Elaboration & Self-Explanation (Giải thích chi tiết & Tự giải thích)
Hệ thống quản trị (Admin Dashboard) của chúng ta hỗ trợ bật/tắt động các trường dữ liệu cho từng module thông qua Cấu hình Module (`system/modules`).
Đối với module Tài nguyên (`resources`), người dùng có thể tắt trường "Mô tả ngắn" (`excerpt`).
Trong code hiện tại:
- Tại [page.tsx (tạo tài nguyên)](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/create/page.tsx) và [page.tsx (sửa tài nguyên)](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/[id]/edit/page.tsx), hệ thống sử dụng query `api.admin.modules.listEnabledModuleFields` với `moduleKey: 'resources'` để kiểm tra các trường được bật. Nếu trường `excerpt` không được bật, input nhập mô tả ngắn sẽ bị ẩn.
- Tại [page.tsx (danh sách tài nguyên)](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx), hệ thống hiển thị trực tiếp đoạn code `{resource.excerpt || 'Chưa có mô tả ngắn'}` dưới tiêu đề của tài nguyên mà không kiểm tra xem trường `excerpt` có đang được bật hay không. Do đó, dòng chữ "Chưa có mô tả ngắn" vẫn xuất hiện một cách vô lý dù người quản trị đã tắt tính năng này.
Để khắc phục, chúng ta cần truy vấn danh sách trường được bật tại trang Danh sách tài nguyên, và ẩn dòng mô tả ngắn này đi khi trường `excerpt` bị vô hiệu hóa.

## 3. Concrete Examples & Analogies (Ví dụ cụ thể & Minh họa đời thường)
- **Ví dụ cụ thể:** Khi tắt trường "Mô tả ngắn" trong cài đặt module tài nguyên, danh sách tài nguyên tại trang `/admin/resources` chỉ nên hiển thị:
  `THƯ VIỆN AUTOCAD 2D`
  Thay vì hiển thị:
  `THƯ VIỆN AUTOCAD 2D`
  `Chưa có mô tả ngắn`
- **Minh họa đời thường:** Tương tự như việc bạn đi đăng ký dịch vụ và tích chọn bỏ qua phần "Số điện thoại bàn" vì gia đình không dùng. Khi xuất ra phiếu in tóm tắt thông tin của bạn, tờ phiếu không được phép in thêm dòng "Chưa có số điện thoại bàn" nữa, vì chính bạn đã yêu cầu hệ thống lược bỏ trường thông tin này.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng quan sát được: Trang danh sách `/admin/resources` luôn hiển thị dòng mô tả ngắn hoặc `'Chưa có mô tả ngắn'` bất kể cấu hình trường `excerpt` có bị tắt ở `/system/modules/resources` hay không.
- Phạm vi ảnh hưởng: Giao diện quản lý tài nguyên của Admin Dashboard.
- Khả năng tái hiện: 100% khi tắt "Mô tả ngắn" trong cấu hình module và xem danh sách tài nguyên trong admin.
- File liên quan: [page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc (Root Cause):** Trang danh sách tài nguyên `/admin/resources` chưa tích hợp query `api.admin.modules.listEnabledModuleFields` để kiểm tra trạng thái kích hoạt của trường `excerpt` trước khi render.
- **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu trang danh sách sử dụng query `api.admin.modules.listEnabledModuleFields` và lọc hiển thị dòng mô tả ngắn theo điều kiện `enabledFields.has('excerpt')`, dòng chữ "Chưa có mô tả ngắn" sẽ biến mất một cách chính xác khi trường này bị tắt.
- **Độ tin cậy nguyên nhân gốc (Root Cause Confidence):** High (Cao). Đoạn code hiển thị cứng dòng mô tả ngắn được tìm thấy tại dòng 235 của [page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx) mà hoàn toàn không có điều kiện check.

# IV. Proposal (Đề xuất)
- Bổ sung query `api.admin.modules.listEnabledModuleFields` vào [page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx).
- Định nghĩa tập hợp các trường được bật `enabledFields` bằng `useMemo` giống như các trang create/edit của resources.
- Sử dụng `enabledFields.has('excerpt')` để bao bọc phần hiển thị mô tả ngắn của tài nguyên trong danh sách table row.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [page.tsx (danh sách tài nguyên)](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx)
  - Thêm query lấy danh sách trường kích hoạt và kiểm tra hiển thị `excerpt`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm query Convex tại trang danh sách:
   ```typescript
   const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: 'resources' });
   ```
2. Tạo memoized set `enabledFields`:
   ```typescript
   const enabledFields = useMemo(() => new Set(fieldsData?.map((field) => field.fieldKey) ?? []), [fieldsData]);
   ```
3. Chỉnh sửa phần hiển thị trong TableBody:
   ```typescript
   {enabledFields.has('excerpt') && (
     <div className="text-xs text-slate-500">{resource.excerpt || 'Chưa có mô tả ngắn'}</div>
   )}
   ```

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra tính tương thích TypeScript tĩnh: Hệ thống Git hook / OXlint / TypeScript compile của dự án sẽ tự chạy để verify cú pháp.
- Người dùng kiểm tra trực quan trên trình duyệt (Manual Verification):
  - Bước 1: Vào trang cấu hình `/system/modules/resources`, tắt trường "Mô tả ngắn" và bấm lưu.
  - Bước 2: Vào trang danh sách `/admin/resources` kiểm tra xem dòng "Chưa có mô tả ngắn" dưới tiêu đề tài nguyên đã biến mất chưa.
  - Bước 3: Vào lại trang cấu hình, bật lại trường "Mô tả ngắn" và bấm lưu.
  - Bước 4: Quay lại trang danh sách tài nguyên để đảm bảo dòng mô tả ngắn hiển thị trở lại bình thường.

# VIII. Todo
- [ ] Bổ sung import/query lấy `fieldsData` trong [page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/page.tsx).
- [ ] Tính toán `enabledFields` bằng `useMemo`.
- [ ] Thêm điều kiện render cho thẻ div hiển thị `excerpt`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi trường `excerpt` bị tắt trong cài đặt module tài nguyên, trang danh sách tài nguyên `/admin/resources` không được hiển thị dòng mô tả ngắn hay dòng chữ "Chưa có mô tả ngắn".
- Khi trường `excerpt` được bật trong cài đặt module tài nguyên, trang danh sách tài nguyên `/admin/resources` hiển thị mô tả ngắn (hoặc "Chưa có mô tả ngắn" nếu tài nguyên chưa có mô tả).
- Không phát sinh bất kỳ lỗi runtime hay lỗi compile TypeScript nào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Không có rủi ro đáng kể vì đây chỉ là thay đổi UI hiển thị và sử dụng API Convex sẵn có.
- **Hoàn tác:** `git checkout app/admin/resources/page.tsx` để khôi phục trạng thái ban đầu.

# XI. Out of Scope (Ngoài phạm vi)
- Việc sửa đổi logic database lưu trữ tài nguyên hoặc thay đổi schema dữ liệu.
- Thay đổi UI ở các trang công cộng ngoài admin dashboard.
