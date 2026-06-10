# I. Primer

## 1. TL;DR kiểu Feynman
Nút **Toggle All** (đóng/mở đồng bộ các phần cấu hình) dùng để thu gọn hoặc mở rộng nhanh các khu vực nhập liệu trong trang quản trị. Để nút này xuất hiện dưới thanh công cụ cố định ở chân trang (Sticky Footer), chúng ta dùng một chiếc "cổng dịch chuyển" (React Portal) để đưa nút từ form nhập liệu chính xuống dưới footer. 

Tuy nhiên, ở dưới footer, chúng ta lại đặt một quy tắc kiểm tra: "chỉ khi nào chân trang đã hiển thị hoàn chỉnh thì mới tính toán vị trí và sắp xếp nút". Nhưng oái oăm thay, quy tắc tính toán này (`useMemo`) lại nằm **bên trong** một câu điều kiện kiểm tra (`isMounted &&`). Trong lập trình React, việc đặt một quy tắc (Hook) bên trong câu điều kiện là cực kỳ cấm kỵ (vi phạm Rules of Hooks), khiến React bị bối rối và từ chối hiển thị nút ở một số trang tạo mới (Create) nơi luồng tải trang diễn ra rất nhanh.

Chúng ta chỉ cần đưa quy tắc tính toán (`useMemo`) ra ngoài câu điều kiện để React luôn chạy nó một cách nhất quán, sau đó mới quyết định có vẽ nút ra màn hình hay không.

## 2. Elaboration & Self-Explanation
Hệ thống quản lý Home Components sử dụng một cơ chế Portal tùy chỉnh tên là `HomeComponentFooterActionPortal` để đăng ký các nút hành động (như import AI, toggle sections) vào một store chung, và `HomeComponentStickyFooter` sẽ đọc các nút này từ store qua hook `useHomeComponentFooterActions` để render ra chân trang.

Tại file `HomeComponentStickyFooter.tsx`, để tránh lỗi bất đồng bộ giữa máy chủ và trình duyệt (SSR mismatch), code sử dụng một state `isMounted` để trì hoãn việc render các nút portal cho đến khi component đã mount hoàn toàn trên client. 

Tuy nhiên, đoạn code cũ lại viết:
```tsx
{isMounted && React.useMemo(() => { ... }, [footerActions]).map(...)}
```
Đây là lỗi vi phạm nghiêm trọng quy tắc **Rules of Hooks** của React: **Không bao giờ được gọi Hook (ở đây là `React.useMemo`) bên trong câu điều kiện hoặc vòng lặp**. Khi `isMounted` thay đổi từ `false` sang `true`, số lượng Hook được gọi trong component thay đổi, làm phá vỡ cấu trúc bộ nhớ Hook của React. Điều này dẫn đến hành vi bất định (undefined behavior), khiến React bỏ qua việc render danh sách nút portal trên các trang Create do luồng render ở đây đơn giản và nhanh hơn trang Edit.

Hướng xử lý:
1. Đưa `React.useMemo` ra ngoài phạm vi câu điều kiện, gán vào một biến hằng số `sortedFooterActions` ở đầu component.
2. Ở phần JSX, chỉ thực hiện map render khi `isMounted` bằng `true`: `{isMounted && sortedFooterActions.map(...)}`.
3. Đồng thời rà soát và đảm bảo các trang Create và Edit của `Product List`, `Service List`, và `Blog` đều bind đầy đủ state `openSections` để nút Toggle All hoạt động chuẩn xác.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang chuẩn bị một bữa tiệc. 
- **Cách làm sai (vi phạm Rules of Hooks)**: Bạn nói với đầu bếp: "Nếu khách đã đến đông đủ (`isMounted === true`), hãy đi chuẩn bị nguyên liệu làm món tráng miệng (`useMemo`). Nếu khách chưa đến, không được chuẩn bị gì cả". Trong bếp React, đầu bếp yêu cầu danh sách công việc phải cố định từ đầu đến cuối. Việc đột ngột thêm một việc nấu ăn vào giữa chừng làm đầu bếp rối loạn và quên luôn món ăn đó.
- **Cách làm đúng**: Bạn nói: "Hãy luôn chuẩn bị sẵn nguyên liệu làm món tráng miệng ở góc bếp (`sortedFooterActions` được tính toán bằng `useMemo` ở đầu). Khi nào khách đến đông đủ (`isMounted === true`), hãy mang món đó lên bàn tiệc". Đầu bếp luôn biết trước công việc của mình, bữa tiệc diễn ra hoàn hảo.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã thực hiện Audit hệ thống render của Sticky Footer và cách đăng ký nút của các trang Create/Edit Home Components:
1. **Sticky Footer (`HomeComponentStickyFooter.tsx`)**: Phát hiện lỗi vi phạm Rules of Hooks tại dòng 102. Hook `React.useMemo` được lồng bên trong biểu thức logic `{isMounted && ...}`. Điều này khiến React compiler hoạt động không ổn định trên môi trường client-side của một số route cụ thể.
2. **Trang Create Product List (`create/product-list/_shared.tsx`)**: Đã render `<FormSectionsToggleAllButton>` và bind đầy đủ 3 sections (`header`, `display`, `source`). Tuy nhiên nút không hiển thị do lỗi render tại Sticky Footer nêu trên.
3. **Trang Create Stats (`create/stats/page.tsx`)**: Đã render `<FormSectionsToggleAllButton>` và bind đầy đủ 3 sections (`header`, `display`, `stats`). Nút cũng bị lỗi ẩn tương tự do Sticky Footer.
4. **Các trang Blog (`blog/[id]/edit/page.tsx` và `create/blog/page.tsx`)**: Cần được rà soát để tích hợp đồng bộ nút Toggle All vào Sticky Footer tương tự như Stats và Product List.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Độ tin cậy của nguyên nhân gốc: **High (Rất cao)**

- **Triệu chứng quan sát được**: Nút Toggle All hoàn toàn biến mất ở Sticky Footer trên trang `create/product-list` và `create/stats`, mặc dù log cho thấy component `FormSectionsToggleAllButton` vẫn được mount và đăng ký thành công vào portal store.
- **Nguyên nhân gốc**: Lỗi vi phạm Rules of Hooks tại `HomeComponentStickyFooter.tsx` dòng 102. `React.useMemo` nằm trong điều kiện `{isMounted && ...}` làm sai lệch bộ nhớ Hook của React trong quá trình hydrate và mount ở Client-side.
- **Giả thuyết đối chứng**: Có phải do import sai đường dẫn dẫn đến việc tạo ra nhiều instance của Portal Store? 
  - *Kiểm chứng*: Đã kiểm tra toàn bộ file import, tất cả đều sử dụng relative path `./HomeComponentFooterActions` hoặc `../../_shared/components/HomeComponentFooterActions` chỉ tới cùng một tệp vật lý. Vì vậy giả thuyết này bị loại trừ.

---

# IV. Proposal (Đề xuất)

1. **Sửa lỗi Rules of Hooks tại `HomeComponentStickyFooter.tsx`**:
   - Khai báo biến `sortedFooterActions` bằng `React.useMemo` độc lập ở phần thân component (ngoài JSX).
   - Render trong JSX bằng cú pháp: `{isMounted && sortedFooterActions.map(...)}`.
2. **Cập nhật và hoàn thiện liên kết SubSection ở Edit ProductList Page**:
   - Liên kết state đóng mở cho `SubSection` "Cấu hình hiển thị" và truyền prop xuống `ProductListForm`.
3. **Tích hợp nút Toggle All vào Blog Components**:
   - Cập nhật [BlogForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/blog/_components/BlogForm.tsx) để hỗ trợ các prop đóng mở từ ngoài.
   - Refactor trang Create Blog và Edit Blog để quản lý state đóng mở đồng bộ và hiển thị nút Toggle All.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components

#### [MODIFY] [HomeComponentStickyFooter.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx)
- **Vai trò hiện tại**: Render thanh footer cố định ở chân trang cho tất cả các trang cấu hình Home Components.
- **Thay đổi**: Đưa `React.useMemo` sắp xếp nút portal ra ngoài biểu thức JSX điều kiện để sửa lỗi Rules of Hooks.

#### [MODIFY] [page.tsx (Edit ProductList)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-list/[id]/edit/page.tsx)
- **Vai trò hiện tại**: Trang chỉnh sửa component Product List.
- **Thay đổi**: Kết nối SubSection "Cấu hình hiển thị" với state `openSections.display` và truyền prop điều khiển đóng mở xuống `ProductListForm`.

#### [MODIFY] [BlogForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/blog/_components/BlogForm.tsx)
- **Vai trò hiện tại**: Form cấu hình tin tức / blog.
- **Thay đổi**: Thêm hỗ trợ prop `openSections`, `onToggleSection`, `showToggleAll` để cho phép trang cha điều khiển trạng thái đóng mở của các section.

#### [MODIFY] [page.tsx (Create Blog)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/create/blog/page.tsx)
- **Vai trò hiện tại**: Trang tạo mới component Blog.
- **Thay đổi**: Sử dụng hook `useFormSectionsState` để đồng bộ đóng mở và hiển thị nút Toggle All ở Sticky Footer.

#### [MODIFY] [page.tsx (Edit Blog)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/blog/[id]/edit/page.tsx)
- **Vai trò hiện tại**: Trang chỉnh sửa component Blog.
- **Thay đổi**: Sử dụng hook `useFormSectionsState` để đồng bộ đóng mở và hiển thị nút Toggle All ở Sticky Footer.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Chỉnh sửa file [HomeComponentStickyFooter.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx) để sửa lỗi Rules of Hooks.
2. **Bước 2**: Chỉnh sửa file [page.tsx (Edit ProductList)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-list/[id]/edit/page.tsx) để liên kết đầy đủ các section với hook đóng mở.
3. **Bước 3**: Cập nhật [BlogForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/blog/_components/BlogForm.tsx) hỗ trợ điều khiển đóng mở từ ngoài.
4. **Bước 4**: Cập nhật các trang Create Blog và Edit Blog để sử dụng hook `useFormSectionsState` và render nút Toggle All.
5. **Bước 5**: Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo code an toàn kiểu dữ liệu tĩnh.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy kiểm tra kiểu tĩnh: `bunx tsc --noEmit` để đảm bảo toàn bộ dự án không có lỗi TypeScript sau khi refactor.

### Manual Verification
- Người dùng kiểm tra trực tiếp giao diện trên trình duyệt tại:
  - `http://localhost:3000/admin/home-components/create/product-list`
  - `http://localhost:3000/admin/home-components/create/stats`
  - `http://localhost:3000/admin/home-components/create/blog`
- Đảm bảo:
  - Nút **Toggle All** xuất hiện ổn định ở phía bên trái nút "Tạo Component" ở Sticky Footer.
  - Khi nhấn nút, tất cả các section đồng loạt đóng/mở mượt mà.
  - Icon mũi tên trong nút Toggle xoay đúng hướng tương ứng với trạng thái đóng/mở.

---

# VIII. Todo

- [ ] Sửa lỗi Rules of Hooks tại `HomeComponentStickyFooter.tsx`.
- [ ] Liên kết đầy đủ các section tại trang Edit Product List.
- [ ] Refactor `BlogForm.tsx` để hỗ trợ prop đóng mở.
- [ ] Refactor trang Create Blog để tích hợp nút Toggle All.
- [ ] Refactor trang Edit Blog để tích hợp nút Toggle All.
- [ ] Chạy kiểm tra kiểu tĩnh `bunx tsc --noEmit`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Nút Toggle All hiển thị ổn định, không bị nhấp nháy hay biến mất sau khi load trang hoặc tương tác.
- Hoạt động đúng trên tất cả các trang: Create/Edit Product List, Create/Edit Stats, Create/Edit Blog.
- Icon mũi tên trong nút xoay đúng hướng (mở rộng -> xoay lên, thu gọn -> xoay xuống).
- Không có lỗi TypeScript (`bunx tsc --noEmit` sạch).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Việc thay đổi cấu trúc render của Sticky Footer có thể ảnh hưởng đến các trang admin khác có dùng footer này.
- **Giảm thiểu**: Việc đưa `React.useMemo` ra ngoài câu điều kiện là chuẩn hóa theo đúng tiêu chuẩn React, hoàn toàn an toàn và giúp code chạy ổn định hơn ở mọi trang. Nếu có sự cố, có thể rollback file `HomeComponentStickyFooter.tsx` về phiên bản cũ dễ dàng bằng git.

---

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi logic nghiệp vụ (business logic) lưu trữ dữ liệu của các component.
- Thay đổi thiết kế giao diện của các component preview ở bên ngoài các trang form admin.
