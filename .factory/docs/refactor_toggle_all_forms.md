# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta cần làm cho 5 biểu mẫu (Form) quản lý giao diện của trang quản trị có tính năng "Toggle All" (Mở rộng/Thu gọn toàn bộ). Khi biểu mẫu có quá nhiều mục con (SubSection), việc nhấn từng mục rất mất thời gian. Chúng ta sẽ thêm một nút duy nhất giúp đóng/mở toàn bộ các mục cùng một lúc. Nút này sẽ được tích hợp vào thanh công cụ dưới chân trang (Sticky Footer) nhờ một hook dùng chung (`useFormSectionsState`) và một component nút dùng chung (`FormSectionsToggleAllButton`).

## 2. Elaboration & Self-Explanation
Hiện nay, trong trang quản trị, các component biểu mẫu (`FooterForm`, `HomepageCategoryHeroForm`, `PartnersForm`, `PopupForm`, `ProductCategoriesForm`) chứa nhiều `SubSection` dạng Collapsible (có thể đóng/mở). Mặc dù có thuộc tính `defaultExpanded` nhưng khi người dùng muốn đóng tất cả hoặc mở tất cả nhanh chóng để xem tổng quan, họ phải click thủ công từng mục một.

Giải pháp:
- Sử dụng hook `useFormSectionsState` đã có sẵn tại `app/admin/home-components/_shared/hooks/useFormSectionsState.ts`. Hook này nhận vào mảng các `activeKeys` (mã các phần hiển thị) và trạng thái mở mặc định. Nó trả về:
  - `openSections`: Đối tượng lưu trạng thái mở/đóng của từng phần.
  - `toggleSection`: Hàm để đảo trạng thái của một phần cụ thể.
  - `hasClosedSection`: Boolean cho biết có ít nhất một phần đang đóng.
  - `handleToggleAll`: Hàm đảo ngược trạng thái đóng/mở đồng loạt.
- Tích hợp component `FormSectionsToggleAllButton` nhận các thuộc tính này và tạo ra một nút đẩy vào thanh Sticky Footer (thông qua React Portal).
- Cập nhật các component `SubSection` của mỗi Form để sử dụng thuộc tính `open` và `onOpenChange` động từ hook, thay vì dùng `defaultOpen` tĩnh.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có 5 cuốn sách trên kệ và mỗi cuốn sách có nhiều chương cần mở ra để đọc. Thay vì phải đi đến từng cuốn sách và lật từng chương một cách thủ công, bạn có một chiếc "điều khiển từ xa" đặc biệt. Chỉ cần bấm một nút trên điều khiển, tất cả các trang sách của tất cả các chương sẽ tự động mở ra hoặc đóng lại đồng loạt.
Ví dụ cụ thể trong code:
Trước đây:
```tsx
<SubSection icon={Settings2} title="Cấu hình hiển thị" defaultOpen={defaultExpanded}>
```
Sau khi refactor:
```tsx
<SubSection
  icon={Settings2}
  title="Cấu hình hiển thị"
  open={openSections.settings}
  onOpenChange={(open) => toggleSection('settings', open)}
>
```

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra sự tồn tại của hook `useFormSectionsState.ts` tại thư mục `app/admin/home-components/_shared/hooks/`. Hook này hoạt động tốt và sẵn sàng sử dụng.
- Đã kiểm tra component `FormSectionsToggleAllButton.tsx` tại thư mục `app/admin/home-components/_shared/components/`. Component này dùng `HomeComponentFooterActionPortal` để render nút đóng/mở vào Sticky Footer, giúp giao diện đồng bộ với hệ thống.
- Cả 5 biểu mẫu đều sử dụng `CollapsibleSubSection` (được import dưới tên alias `SubSection`) nên hoàn toàn tương thích với cơ chế đóng mở động thông qua prop `open` và `onOpenChange`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề (Triệu chứng)**: Thiếu tính năng điều khiển đồng loạt các SubSection trong các form lớn, làm giảm trải nghiệm người dùng (UX) khi phải click nhiều lần.
- **Giải pháp**: Tích hợp hook quản lý trạng thái động `useFormSectionsState` và component nút điều khiển `FormSectionsToggleAllButton` đã được thiết kế chuẩn trong dự án.
- **Độ tin cậy giải pháp (Confidence)**: High. Vì các thành phần dùng chung (`_shared`) đã được kiểm nghiệm, thiết kế tốt và hoạt động đồng bộ với cơ chế Portal của Sticky Footer của VietAdmin.

# IV. Proposal (Đề xuất)
Tiến hành refactor lần lượt 5 file Form để tích hợp tính năng Toggle All:
1. Import `useFormSectionsState` từ `../../_shared/hooks/useFormSectionsState`.
2. Import `FormSectionsToggleAllButton` từ `../../_shared/components/FormSectionsToggleAllButton`.
3. Định nghĩa hằng số `activeSections` chứa danh sách các section keys tương ứng với từng Form.
4. Triển khai hook trong component chính với giá trị khởi tạo `defaultExpanded`.
5. Đặt thẻ `<FormSectionsToggleAllButton>` ở phần đầu của JSX trả về.
6. Thay thế thuộc tính `defaultOpen` ở các `<SubSection>` bằng `open` và `onOpenChange` trỏ tới trạng thái và hàm cập nhật của hook.

# V. Files Impacted (Tệp bị ảnh hưởng)
1. `app/admin/home-components/footer/_components/FooterForm.tsx`
   - Sửa: Tích hợp Toggle All cho 5 sections: `['settings', 'basicInfo', 'bct', 'columns', 'socials']`.
2. `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx`
   - Sửa: Tích hợp Toggle All cho 3 sections: `['source', 'settings', 'categories']`.
3. `app/admin/home-components/partners/_components/PartnersForm.tsx`
   - Sửa: Tích hợp Toggle All cho 2 sections: `['settings', 'partners']`.
4. `app/admin/home-components/popup/_components/PopupForm.tsx`
   - Sửa: Tích hợp Toggle All cho 5 sections: `['settings', 'content', 'cta', 'image', 'schedule']`.
5. `app/admin/home-components/product-categories/_components/ProductCategoriesForm.tsx`
   - Sửa: Tích hợp Toggle All cho 2 sections: `['settings', 'categories']`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ code của từng file form để định vị chính xác các `SubSection` và các thuộc tính liên quan.
2. Áp dụng sửa đổi đồng loạt hoặc tuần tự cho từng file bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Kiểm tra tĩnh lỗi TypeScript bằng lệnh `bunx tsc --noEmit` để đảm bảo không có lỗi cú pháp hay import sai đường dẫn.
4. Commit các thay đổi cùng với tài liệu spec này.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**: Chạy lệnh kiểm tra kiểu TypeScript:
  `bunx tsc --noEmit`
- **Động**: Quá trình kiểm nghiệm hoạt động thực tế trên giao diện sẽ do tester phụ trách (theo quy định của RULE[AGENTS.md]).

# VIII. Todo
- [ ] Refactor file 1: `FooterForm.tsx`
- [ ] Refactor file 2: `HomepageCategoryHeroForm.tsx`
- [ ] Refactor file 3: `PartnersForm.tsx`
- [ ] Refactor file 4: `PopupForm.tsx`
- [ ] Refactor file 5: `ProductCategoriesForm.tsx`
- [ ] Chạy kiểm tra TypeScript (`bunx tsc --noEmit`)
- [ ] Commit thay đổi và báo cáo hoàn thành cho Parent Agent.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cả 5 file Form đều được biên dịch thành công mà không có lỗi TypeScript hay lỗi cú pháp nào.
- Các `SubSection` trong các form sử dụng cơ chế đóng/mở đồng bộ từ hook `useFormSectionsState`.
- Nút bấm `FormSectionsToggleAllButton` được đưa vào phần JSX của mỗi form.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi sai đường dẫn tương đối import do cấu trúc thư mục của các Form khác nhau.
- **Biện pháp**: Xác định rõ khoảng cách cấp thư mục từ mỗi file đến thư mục `_shared`. Do các file form nằm ở `app/admin/home-components/[component-name]/_components/Form.tsx`, chúng đều cách thư mục `_shared` đúng 2 cấp thư mục cha (`../../_shared`). Do đó, đường dẫn import `../../_shared/...` là đồng nhất cho tất cả các file này.
- **Rollback**: Sử dụng git để khôi phục trạng thái ban đầu của các file nếu xảy ra lỗi không mong muốn.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa giao diện hiển thị của các trường dữ liệu bên trong các Form.
- Không cấu hình thêm bất kỳ cài đặt hay schema dữ liệu mới nào ở Convex.
