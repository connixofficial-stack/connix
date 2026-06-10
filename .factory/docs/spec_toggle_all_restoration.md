# I. Primer

## 1. TL;DR kiểu Feynman
* Chúng ta cần khôi phục nút **Toggle All** (đóng/mở đồng loạt các section) trên Sticky Footer cho **tất cả** các Home Component Forms còn thiếu.
* Lúc trước, một số form "đơn-section" (chỉ có 1 section collapsible) bị lầm tưởng là không cần nút đóng/mở nhanh nên đã bị xóa nút Toggle All. Nhưng thực tế, người dùng yêu cầu tất cả các form (kể cả form đơn-section hay đa-section) đều phải có nút Toggle All nhất quán ở Sticky Footer và đứng trước nút Import AI.
* Giải pháp:
  * Import `FormSectionsToggleAllButton` và hook `useFormSectionsState` vào các file còn thiếu.
  * Destructure đầy đủ `{ openSections, toggleSection, hasClosedSection, handleToggleAll }` từ hook.
  * Thêm thẻ `<FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />` vào đầu JSX của các form.

## 2. Elaboration & Self-Explanation
Hiện tại, hệ thống Sticky Footer của Admin UI quản lý các hành động thông qua cơ chế React Portal (`HomeComponentFooterActions`). Khi một form được render, nó sẽ tự đẩy nút Toggle All của nó lên Sticky Footer. Nút này giúp đóng/mở tất cả các section của form chỉ với 1 click.
Một số form chỉ có 1 section (ví dụ: CTA, Marquee, Clients, v.v.) hoặc chưa được rà soát đầy đủ (Team, Testimonials) hiện đang không có nút Toggle All. Chúng ta sẽ tích hợp nút Toggle All cho toàn bộ 10 form còn thiếu này nhằm đảm bảo tính đồng bộ hoàn hảo cho toàn bộ 33 Home Component Forms.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**: Với form CTA (`CTAForm.tsx`), hiện tại form này chỉ có 1 section là "Nội dung CTA" (`cta`). Form đang dùng `useFormSectionsState` nhưng chỉ lấy ra `openSections, toggleSection` và không render nút Toggle All. Chúng ta sẽ sửa thành:
  ```typescript
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['cta'], defaultExpanded);
  ```
  Và chèn nút bấm:
  ```tsx
  <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
  ```
* **Analogy (Ví dụ đời thường)**: Giống như một tòa nhà có các phòng họp. Phòng họp lớn (đa-section) có công tắc tắt/bật toàn bộ đèn, phòng họp nhỏ (đơn-section) cũng nên có công tắc tổng ở cửa ra vào để người dùng không phải đi đến từng cái đèn để tắt/bật. Việc này giúp trải nghiệm nhất quán và nhanh chóng.

# II. Audit Summary (Tóm tắt kiểm tra)

Sau khi rà soát toàn bộ thư mục `app/admin/home-components/`, chúng tôi phát hiện:
* Có **22** form đã được tích hợp thành công nút Toggle All.
* Có **7** form đã gọi hook `useFormSectionsState` nhưng bị thiếu nút `FormSectionsToggleAllButton` (CTAForm, GalleryForm, MarqueeForm, FeaturesForm, ServiceListForm, ServicesForm, ProcessForm).
* Có **1** form (`pricing/TextsForm.tsx`) chưa được kiểm tra nút Toggle All.
* Có **2** form (`team/TeamForm.tsx`, `testimonials/TestimonialsForm.tsx`) chưa tích hợp cả hook lẫn button.
* Có **1** form (`product-list/ProductListForm.tsx`) đã được sửa trong editor nhưng chưa được commit.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause**: Bước dọn dẹp (cleanup) trước đó áp dụng quy tắc YAGNI sai lầm khi loại bỏ nút Toggle All khỏi các form đơn-section vì nghĩ rằng form 1 section thì không cần nút Toggle All. Tuy nhiên, người dùng yêu cầu giao diện nhất quán 100% trên toàn bộ các form.
* **Độ tin cậy nguyên nhân gốc**: **High** (Đã xác minh qua phản hồi trực tiếp từ người dùng và phân tích mã nguồn thực tế).

# IV. Proposal (Đề xuất)

1. Cập nhật **7 form đã có hook nhưng thiếu button**:
   * CTAForm, GalleryForm, MarqueeForm, FeaturesForm, ServiceListForm, ServicesForm, ProcessForm.
   * Thêm import `FormSectionsToggleAllButton`.
   * Lấy thêm `hasClosedSection, handleToggleAll` từ destructuring.
   * Thêm component `<FormSectionsToggleAllButton ... />` vào return JSX.
2. Tích hợp cho **TeamForm** và **TestimonialsForm**:
   * Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   * Khởi tạo hook với danh sách section tương ứng (`['members']` cho Team và `['items']` cho Testimonials).
   * Thay thế trạng thái `defaultOpen` tĩnh của `SubSection` bằng state từ hook.
   * Thêm component `<FormSectionsToggleAllButton ... />` vào return JSX.
3. Rà soát và cập nhật **TextsForm.tsx (Pricing)**:
   * Nếu có `SubSection` thì tích hợp đầy đủ hook + button.
4. Xác minh và hoàn tất **ProductListForm.tsx**.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm UI Forms:
1. `app/admin/home-components/cta/_components/CTAForm.tsx`
   * *Vai trò hiện tại*: Quản lý cấu hình CTA.
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
2. `app/admin/home-components/gallery/_components/GalleryForm.tsx`
   * *Vai trò hiện tại*: Quản lý ảnh gallery.
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
3. `app/admin/home-components/marquee/_components/MarqueeForm.tsx`
   * *Vai trò hiện tại*: Quản lý chữ chạy Marquee.
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
4. `app/admin/home-components/features/_components/FeaturesForm.tsx`
   * *Vai trò hiện tại*: Quản lý các tính năng (Features).
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
5. `app/admin/home-components/service-list/_components/ServiceListForm.tsx`
   * *Vai trò hiện tại*: Quản lý danh sách dịch vụ.
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
6. `app/admin/home-components/services/_components/ServicesForm.tsx`
   * *Vai trò hiện tại*: Quản lý dịch vụ chi tiết.
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
7. `app/admin/home-components/process/_components/ProcessForm.tsx`
   * *Vai trò hiện tại*: Quản lý các bước quy trình (Process).
   * *Thay đổi*: Thêm nút `FormSectionsToggleAllButton` và cập nhật destructure hook.
8. `app/admin/home-components/team/_components/TeamForm.tsx`
   * *Vai trò hiện tại*: Quản lý thành viên đội ngũ (Team).
   * *Thay đổi*: Tích hợp hook `useFormSectionsState` + component `FormSectionsToggleAllButton`.
9. `app/admin/home-components/testimonials/_components/TestimonialsForm.tsx`
   * *Vai trò hiện tại*: Quản lý đánh giá khách hàng (Testimonials).
   * *Thay đổi*: Tích hợp hook `useFormSectionsState` + component `FormSectionsToggleAllButton`.
10. `app/admin/home-components/pricing/_components/TextsForm.tsx`
    * *Vai trò hiện tại*: Quản lý văn bản cấu hình Pricing.
    * *Thay đổi*: Rà soát, tích hợp hook `useFormSectionsState` + component `FormSectionsToggleAllButton`.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc và phân tích `pricing/TextsForm.tsx`.
2. Thực hiện sửa đổi lần lượt 7 file form đã có hook (CTAForm, GalleryForm, MarqueeForm, FeaturesForm, ServiceListForm, ServicesForm, ProcessForm).
3. Thực hiện sửa đổi 2 file chưa có hook (TeamForm, TestimonialsForm).
4. Sửa đổi `pricing/TextsForm.tsx` theo phân tích.
5. Kiểm tra `product-list/ProductListForm.tsx` để đảm bảo đã được lưu đúng trạng thái.
6. Chạy biên dịch TypeScript tĩnh: `bunx tsc --noEmit` để xác minh không có lỗi cú pháp hoặc kiểu dữ liệu.
7. Commit tất cả các thay đổi vào git local.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Type Check
* Sử dụng lệnh `bunx tsc --noEmit` để đảm bảo tính an toàn của kiểu dữ liệu sau khi sửa đổi.

### Manual Verification (Do Tester thực hiện sau khi bàn giao)
* Mở các trang tạo/sửa Home Components tương ứng trên trình duyệt (ví dụ: `/admin/home-components/create/stats`, `/admin/home-components/create/cta`, v.v.).
* Xác nhận có nút Toggle All (mũi tên đóng/mở) ở Sticky Footer, đứng trước nút "Import AI".
* Click nút Toggle All và xác nhận toàn bộ các section đóng/mở đồng loạt chính xác.

# VIII. Todo
* [ ] Phân tích và sửa `pricing/_components/TextsForm.tsx`
* [ ] Cập nhật 7 form thiếu nút Toggle All
* [ ] Cập nhật TeamForm và TestimonialsForm
* [ ] Xác minh ProductListForm
* [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`)
* [ ] Thực hiện commit cục bộ

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* 100% các file form Home Component trong dự án đều có nút Toggle All hoạt động chuẩn xác.
* Không có lỗi TypeScript (`tsc` compile thành công).
* Thứ tự các nút trên Sticky Footer chuẩn: Nút Toggle All đứng trước nút Import AI.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro thấp**: Chỉ sửa đổi các component UI cục bộ và hook quản lý giao diện đóng/mở. Không ảnh hưởng đến dữ liệu hoặc backend Convex.
* **Hoàn tác**: Sử dụng `git checkout` trước đó nếu phát sinh lỗi.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc dữ liệu hoặc schema Convex.
* Tối ưu hiệu năng của việc tải dữ liệu từ Convex.
