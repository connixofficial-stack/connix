# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn đi vào một cửa hàng Apple Store, mọi bàn trưng bày, mọi nhãn giá, và mọi cách sắp xếp sản phẩm đều giống hệt nhau về phong cách (bo góc, khoảng cách, viền, hiệu ứng).
Hiện tại, trang Sản phẩm (Products) của chúng ta có thiết kế card rất sang trọng (nằm gọn trong thẻ có padding, bo góc đẹp, chia 2 cột thông tin rõ ràng ở chế độ List, có hiệu ứng đổi viền khi di chuột). Tuy nhiên, các trang khác như Bài viết (Posts), Khóa học (Courses), Tài nguyên (Resources), Dịch vụ (Services), và Dự án (Projects) lại có kiểu card "mỗi người một ngả" (ảnh tràn viền bên trái, xếp thẳng đứng, không có nút CTA hoặc nút CTA không đồng bộ).
Kế hoạch này giúp biến các card của toàn bộ 5 trang kia thành "anh em sinh đôi" với card Sản phẩm, tạo nên sự nhất quán tuyệt đối 100%.

## 2. Elaboration & Self-Explanation
Để đạt được sự nhất quán cao cấp (Premium Consistency):
- **Ở chế độ Grid**: Card phải có viền mỏng mịn, bo góc `radiusClass`, tự động đổi màu viền sang màu chủ đạo (`brandColor`) và đổ bóng nhẹ kèm dịch chuyển lên trên một chút (`hover:-translate-y-1 hover:shadow-lg`) khi di chuột vào.
- **Ở chế độ List**: Thay vì để ảnh tràn ra tận mép trái của card, chúng ta áp dụng padding `p-4` cho toàn bộ card ngoài. Hình ảnh lúc này sẽ nằm lùi vào trong và tự bo góc riêng. Phần nội dung chữ bên phải sẽ chia thành 2 cột trên Desktop (cột trái chứa danh mục, tiêu đề, mô tả, tags; cột phải chứa thông số phụ như ngày tháng, lượt xem, giá cả và nút hành động CTA như "Xem chi tiết", "Tải xuống").

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - *Trước đây (Bài viết ở dạng List)*: Card rộng ngang, ảnh tràn mép trái. Chữ tiêu đề và ngày tháng xếp chồng lên nhau. Không có nút kêu gọi hành động (CTA).
  - *Sau khi sửa*: Card có khoảng đệm bao quanh ảnh. Bên phải ảnh là tiêu đề, mô tả ngắn ở bên trái, còn bên phải là một khu vực căn lề phải chứa ngày đăng/lượt xem và nút hành động `Xem chi tiết →` màu thương hiệu dạng bo tròn (`rounded-full`), tự đổi màu nền nhẹ khi hover.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra cấu trúc của card trong các trang danh sách storefront:
1. [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductsPage.tsx) và [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/products/ProductCardComponents.tsx): Card list có padding `p-4`, hover hiệu ứng viền/bóng màu primary, chia cột thông tin ở trái và nút CTA/giá ở phải.
2. [ProjectsPage](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx): `ListCard` đã chia 2 cột nội dung và CTA bên phải, nhưng card ngoài không có padding `p-4` làm ảnh bị tràn viền trái, thiếu hover border/shadow màu primary.
3. [PostsPage](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx): `PostListCard` có ảnh tràn viền trái, xếp dọc thẳng tuột, không có cột phải chứa CTA.
5. [ServicesPage](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx): `ServiceListCard` tương tự PostsPage, xếp thẳng tuột, không có CTA và bị tràn viền trái.
6. [ResourcesPage](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx): `ResourceListWrapper` cũng bị tràn viền trái, thiếu cột CTA ở phải.
7. [CoursesPage](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx): `CourseListCard` tương tự, thiếu cấu trúc cột phải.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc**: Khi thực hiện refactor bằng `SharedListLayout`, chúng ta mới chỉ đồng bộ thanh Toolbar, Sidebar, Mobile Bottom Sheet và Grid Columns của các trang, nhưng chưa đồng bộ cấu trúc HTML/CSS của các component Card (GridCard và ListCard) nằm trong hàm `renderItem`. Do đó, thiết kế card của các trang vẫn giữ nguyên code legacy kiểu cũ.
- **Giả thuyết đối chứng**: Nếu chúng ta sửa đổi trực tiếp các component Card trong 5 trang storefront này để bám sát chính xác cấu trúc HTML, padding, class Tailwind và hành vi hover của card Sản phẩm, giao diện storefront sẽ đạt được sự nhất quán tuyệt đối.

---

# IV. Proposal (Đề xuất)

Chúng ta sẽ cập nhật các component Card (Grid và List) trong 5 file trang storefront để đồng bộ 100% style của trang Sản phẩm.

### 1. Đồng bộ Card dạng Grid (Grid Card)
Mọi Grid Card của 5 module phải có:
- Thẻ Link ngoài cùng:
  ```typescript
  className={`group ${radiusClass} overflow-hidden border transition-all duration-300 flex flex-col h-full hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-1`}
  style={{
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
    '--card-hover-border': brandColor,
    '--card-hover-shadow': `${brandColor}15`,
  } as React.CSSProperties}
  ```
- Hiệu ứng zoom ảnh: `group-hover:scale-110 transition-transform duration-500` hoặc `duration-300`.
- Padding content đồng bộ `p-4` (hoặc `p-3 sm:p-4`).
- Category badge và Title có hover color dạng: `group-hover:text-[var(--title-hover-color)]` với `--title-hover-color` là `brandColor`.

### 2. Đồng bộ Card dạng List (List Card)
Mọi List Card của 5 module phải có:
- Thẻ Link ngoài cùng:
  ```typescript
  className={`group flex flex-col sm:flex-row gap-4 ${radiusClass} overflow-hidden border transition-all duration-300 p-4 hover:border-[var(--card-hover-border)] hover:shadow-lg hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-0.5`}
  style={{
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
    '--card-hover-border': brandColor,
    '--card-hover-shadow': `${brandColor}10`,
  } as React.CSSProperties}
  ```
- Hình ảnh nằm trong div:
  ```typescript
  className="w-full sm:w-32 md:w-40 shrink-0 overflow-hidden rounded-lg relative aspect-video"
  ```
- Content area chia thành 2 cột trên Desktop (flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6):
  - **Cột trái (flex-1 min-w-0 flex flex-col justify-center)**:
    - Badge danh mục.
    - Tiêu đề (font-semibold text-lg, hover màu brandColor).
    - Mô tả/excerpt (text-sm, line-clamp-2).
    - Metadata nhỏ (ngày tháng, tác giả, views).
  - **Cột phải (flex flex-col items-start md:items-end justify-center shrink-0 min-w-[200px] md:text-right gap-2 border-t md:border-t-0 pt-3 md:pt-0)**:
    - Giá cả, dung lượng hoặc thông số đặc thù của module (ví dụ: ngày tháng/lượt xem lớn đối với Posts/Projects, kích thước file đối với Resources, số bài học đối với Courses).
    - Nút CTA tròn đầy đủ:
      ```typescript
      <span
        className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 group-hover:bg-[var(--btn-hover-bg)] group-hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow whitespace-nowrap"
        style={{
          borderColor: brandColor,
          color: brandColor,
          '--btn-hover-bg': `${brandColor}08`,
        } as React.CSSProperties}
      >
        {ctaLabel} →
      </span>
      ```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. `app/(site)/projects/page.tsx`
- **Sửa**: Refactor `GridCard` và `ListCard` để thêm padding `p-4` ở ngoài cùng cho `ListCard`, bo góc ảnh lùi vào trong, thêm hiệu ứng hover border/shadow màu `brandColor`, đồng bộ nút CTA.

### 2. `app/(site)/_components/posts/PostsPage.tsx` & `[categorySlug]/_components/PostsPage.tsx`
- **Sửa**: Refactor `PostGridCard` và `PostListCard` tương tự, chia cột layout `list` thành trái/phải, thêm nút CTA `Xem chi tiết →` ở cột phải.

### 3. `app/(site)/_components/services/ServicesPage.tsx` & `[categorySlug]/_components/ServicesPage.tsx`
- **Sửa**: Refactor `ServiceGridCard` và `ServiceListCard` tương tự, chia cột layout `list`, thêm giá tiền nổi bật và nút CTA `Chi tiết →` ở cột phải.

### 4. `app/(site)/_components/resources/ResourcesPage.tsx`
- **Sửa**: Refactor `ResourceGridCard` và `ResourceListWrapper` tương tự, chia cột layout `list`, cột phải chứa dung lượng file, nút CTA `Tải xuống →` hoặc `Xem thử →`/`Mua ngay →`.

### 5. `app/(site)/_components/courses/CoursesPage.tsx`
- **Sửa**: Refactor `CourseGridCard` và `CourseListCard` tương tự, chia cột layout `list`, cột phải chứa số bài học / thời lượng / giá tiền (nếu có) và nút CTA `Xem khóa học →`.

---

# VI. Execution Preview (Xem trước thực thi)

1. Sửa đổi trang Dự án [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx).
2. Sửa đổi trang Bài viết (Posts) cả 2 file.
3. Sửa đổi trang Dịch vụ (Services) cả 2 file.
4. Sửa đổi trang Tài nguyên (Resources).
5. Sửa đổi trang Khóa học (Courses).
6. Biên dịch và kiểm tra chất lượng bằng `bunx tsc --noEmit`.
7. Git commit tất cả và phát âm báo hoàn thành.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

### Manual Verification
- Kiểm tra trực quan trên trình duyệt ở localhost (layout grid và list của cả 5 trang) để đảm bảo hình ảnh bo góc thụt lề, chia cột trái/phải trên Desktop, hover màu sắc primary đồng bộ với Sản phẩm.

---

# VIII. Todo

- [ ] Refactor trang Dự án [projects/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
- [ ] Refactor trang Bài viết [PostsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/posts/PostsPage.tsx)
- [ ] Refactor trang danh mục Bài viết [PostsPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/PostsPage.tsx)
- [ ] Refactor trang Dịch vụ [ServicesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/services/ServicesPage.tsx)
- [ ] Refactor trang danh mục Dịch vụ [ServicesPage.tsx (danh mục)](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/[categorySlug]/_components/ServicesPage.tsx)
- [ ] Refactor trang Tài nguyên [ResourcesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourcesPage.tsx)
- [ ] Refactor trang Khóa học [CoursesPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/courses/CoursesPage.tsx)
- [ ] Xác nhận không lỗi biên dịch bằng `bunx tsc --noEmit`
- [ ] Thực hiện Git commit và phát âm báo hoàn thành

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Tất cả card dạng Grid của 5 module khi hover sẽ có bóng nhẹ, viền đổi màu sang `brandColor`, dịch chuyển lên `-translate-y-1`.
- Tất cả card dạng List của 5 module khi ở màn hình rộng sẽ có padding `p-4` bao quanh toàn bộ, ảnh bo tròn thụt lề so với mép card, phần nội dung chia thành cột trái (chi tiết) và cột phải (thông số + nút CTA).
- Nút CTA dạng tròn (`rounded-full`) màu primary nổi bật ở cột phải card List.
- Giao diện mượt mà, responsive tốt trên các kích thước màn hình.
- 0 lỗi compile TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Lỗi CSS Tailwind khi responsive trên mobile.
- **Biện pháp**: Trên mobile (dưới `sm`), các cột trong card list tự động chuyển sang layout đứng dọc (`flex-col`), ảnh rộng 100%, giống hệt cách trang Sản phẩm ứng phó.
- **Rollback**: `git checkout -- <file>` để quay lại trạng thái trước khi refactor.

---

# XI. Out of Scope (Ngoài phạm vi)

- Không thay đổi logic truy vấn dữ liệu Convex, chỉ thay đổi giao diện JSX/CSS hiển thị card.
- Không thay đổi trang chi tiết của các module.
