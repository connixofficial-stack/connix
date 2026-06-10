# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Hiện tại, mỗi trang cấu hình (home-component form) như Hero, About, Benefits... đều chứa các phần collapsible độc lập (SubSection). Khi người dùng muốn đóng hoặc mở tất cả các phần này để dễ nhìn hoặc thao tác nhanh, họ cần một nút "Toggle All" trên Sticky Footer. Trước đây, logic này được code thủ công ở từng file, gây trùng lặp mã nguồn (duplicate code) và khó đồng bộ giao diện.
* **Giải pháp**: Chúng ta đã tạo ra hạ tầng dùng chung gồm Shared Hook `useFormSectionsState` (quản lý trạng thái) và Shared Component `FormSectionsToggleAllButton` (giao diện nút portal lên Sticky Footer). Bây giờ, ta sẽ áp dụng hạ tầng này cho **tất cả** các home-component còn lại có từ **2 collapsible section trở lên**.
* **Kết quả**: Giao diện đồng bộ 100%, code ngắn gọn, chỉ cần khai báo mảng các section và truyền props vào `SubSection`.

## 2. Elaboration & Self-Explanation
Hạ tầng dùng chung hoạt động dựa trên cơ chế:
a) **Quản lý trạng thái dạng Generic**: Hook `useFormSectionsState` nhận vào một danh sách các key định danh cho các section (ví dụ `['settings', 'content', 'items']`). Nó trả về trạng thái mở của từng key, hàm để toggle một key, và hàm `handleToggleAll` để tự động đóng tất cả nếu có bất kỳ section nào đang mở, hoặc mở tất cả nếu tất cả đang đóng.
b) **Portal đẩy giao diện lên Footer**: Component `FormSectionsToggleAllButton` sử dụng `HomeComponentFooterActionPortal` để tự động render một nút mũi tên (có hiệu ứng xoay 180 độ khi đóng/mở) vào đúng vị trí Sticky Footer dưới cùng màn hình mà không cần can thiệp vào layout cha.
c) **Tích hợp**: Trong từng form, ta chỉ cần thay thế các biến trạng thái mở đơn lẻ (như `defaultExpanded` hoặc `useState` tự chế) bằng hook dùng chung, sau đó truyền prop `open` và `onOpenChange` vào các thẻ `<SubSection>`.

## 3. Concrete Examples & Analogies
* **Hình ảnh ẩn dụ**: Hãy tưởng tượng một tòa nhà có nhiều căn phòng (các section). Trước đây, mỗi phòng có một công tắc đèn riêng, và nếu bạn muốn tắt toàn bộ đèn khi ra về, bạn phải đi đến từng phòng để tắt. Giải pháp này giống như việc lắp đặt một "cầu dao tổng" (Toggle All) ngay tại cửa ra vào (Sticky Footer). Thay vì đấu dây phức tạp cho từng căn nhà bằng tay, ta thiết kế một bộ kit lắp sẵn (Shared Hook & Component) để mọi căn nhà chỉ cần cắm giắc vào là dùng được ngay.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Qua rà soát toàn bộ thư mục `app/admin/home-components/`, ta phát hiện:
* Có 28 home-component forms.
* `HeroForm.tsx` và `AboutForm.tsx` đã được tích hợp thành công ở bước trước và đang hoạt động ổn định.
* Các components còn lại cần được phân tích xem có từ 2 `SubSection` trở lên hay không để tích hợp. Các component chỉ có 1 `SubSection` sẽ không cần tích hợp Toggle All vì không có nhu cầu đóng/mở đồng loạt.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Triệu chứng quan sát**: Các trang cấu hình home-components có trải nghiệm không đồng nhất. Một số trang có nút Toggle All (đã làm thủ công hoặc dùng chung mới), một số trang khác thì không, và một số trang thì chỉ có các nút đóng mở đơn lẻ.
* **Nguyên nhân**: Thiếu giải pháp dùng chung chuẩn hóa ban đầu, dẫn đến việc phát triển riêng lẻ từng component.
* **Giả thuyết đối chứng**: Nếu tích hợp nút Toggle All vào cả những component chỉ có 1 section, nút bấm sẽ hoạt động thừa thãi và chiếm diện tích không cần thiết trên Sticky Footer. Vì vậy, tiêu chí bắt buộc là **chỉ tích hợp cho các form có từ 2 section trở lên**.

---

# IV. Proposal (Đề xuất)
1. **Phân loại các Home Components**: Rà soát kỹ lưỡng các file Form còn lại để xác định danh sách các section.
2. **Triển khai song song bằng Sub-agents**: Chia danh sách các file cần chỉnh sửa thành 3-4 nhóm, giao cho các subagent xử lý song song để tối ưu hóa thời gian chạy (wall-clock time).
3. **Mẫu tích hợp**:
   - Import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khai báo danh sách keys (ví dụ `const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['settings', 'items'], defaultExpanded);`).
   - Đặt `<FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />` trong cây JSX.
   - Thêm `open={openSections.key}` và `onOpenChange={(open) => toggleSection('key', open)}` vào từng `<SubSection>`.
4. **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo không có bất kỳ lỗi TypeScript nào xảy ra sau khi refactor.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm 1: UI / Forms (Do Subagent 1 xử lý)
* `Sửa:` [BenefitsForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/benefits/_components/BenefitsForm.tsx) - Thêm Toggle All cho 2 section (`settings`, `items`).
* `Sửa:` [BlogForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/blog/_components/BlogForm.tsx) - Thêm Toggle All cho 2 section (`settings`, `source`).
* `Sửa:` [CareerForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/career/_components/CareerForm.tsx) - Thêm Toggle All cho 2 section.
* `Sửa:` [CaseStudyForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/case-study/_components/CaseStudyForm.tsx) - Thêm Toggle All cho 2 section.
* `Sửa:` [CategoryProductsForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/category-products/_components/CategoryProductsForm.tsx) - Thêm Toggle All cho 2 section.
* `Sửa:` [FaqForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/faq/_components/FaqForm.tsx) - Thêm Toggle All cho các section.

### Nhóm 2: UI / Forms (Do Subagent 2 xử lý)
* `Sửa:` [FooterForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/footer/_components/FooterForm.tsx) - Thêm Toggle All cho 5 section (`settings`, `basic`, `gov`, `menu`, `socials`).
* `Sửa:` [HomepageCategoryHeroForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx) - Thêm Toggle All cho 3 section (`source`, `settings`, `menu`).
* `Sửa:` [PartnersForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/partners/_components/PartnersForm.tsx) - Thêm Toggle All cho 2 section (`settings`, `items`).
* `Sửa:` [PopupForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/popup/_components/PopupForm.tsx) - Thêm Toggle All cho 5 section (`settings`, `content`, `cta`, `image`, `display`).
* `Sửa:` [ProductCategoriesForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-categories/_components/ProductCategoriesForm.tsx) - Thêm Toggle All cho 2 section (`settings`, `items`).

### Nhóm 3: UI / Forms (Do Subagent 3 xử lý)
* `Sửa:` [ProductGridForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-grid/_components/ProductGridForm.tsx) - Thêm Toggle All cho 4 section (`settings`, `columns`, `tabs`, `source`).
* `Sửa:` [SpeedDialForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx) - Thêm Toggle All cho 2 section (`settings`, `actions`).
* `Sửa:` Các form khác như `ProcessForm.tsx`, `ServicesForm.tsx`, `StatsForm.tsx`, `TeamForm.tsx`, `TestimonialsForm.tsx` nếu có từ 2 section trở lên.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Lập Spec & Duyệt**: Hoàn thành spec này và hiển thị để người dùng phê duyệt.
2. **Ủy quyền Sub-agents**: Khởi chạy 3 subagent song song để thực hiện code refactor cho 3 nhóm file tương ứng.
3. **Kiểm tra biên dịch tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo 100% type safety.
4. **Git Commit**: Commit tất cả các thay đổi cục bộ kèm theo Spec này.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Biên dịch**: `bunx tsc --noEmit 2>&1 | Select-Object -First 10` phải trả về 0 lỗi.
* **Giao diện**: Các Sticky Footer trên tất cả các home-components được sửa đổi sẽ hiển thị nút Toggle All hoạt động chuẩn xác, xoay icon mượt mà.

---

# VIII. Todo
* [ ] Kiểm tra chi tiết số lượng section của tất cả 26 file Form.tsx còn lại.
* [ ] Khởi chạy Subagents để sửa đổi hàng loạt.
* [ ] Chạy lệnh check TypeScript.
* [ ] Thực hiện Commit cục bộ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Tất cả các form có >= 2 section đều được tích hợp `useFormSectionsState` và `FormSectionsToggleAllButton`.
* Không có lỗi biên dịch TypeScript.
* Code sạch sẽ, gọn gàng, tuân thủ DRY và KISS.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lỗi cú pháp TypeScript hoặc import sai đường dẫn tương đối (ví dụ `../../_shared/...` ở các cấp thư mục khác nhau).
* **Khắc phục**: Subagent phải kiểm tra kỹ đường dẫn import tương ứng với vị trí của file Form. Nếu có lỗi, rollback dễ dàng bằng `git checkout`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi hành vi logic lưu trữ dữ liệu hoặc submit form.
* Không thay đổi CSS layout của các form.
