# I. Primer

## 1. TL;DR kiểu Feynman
* Trang web hiện tại bị lỗi khoảng trống lớn đẩy phần "2 dự án" (thanh phân trang) xuống sát footer vì trang con dùng thẻ `<main className="min-h-screen">` lồng vào thẻ `<main>` của Layout cha. Ta sẽ đổi nó thành `div flex-grow` để tự động ôm khít nội dung.
* Có một số chữ tiếng Anh và mô tả bị viết cứng (hardcoded) như "Projects", "Các case study...". Ta sẽ xóa bỏ các chữ hardcoded này theo yêu cầu của người dùng.
* Trang xem thử (Preview) ở trang quản trị Admin đang hiển thị một kiểu giao diện thô sơ, không khớp với giao diện thực tế của người dùng ngoài trang chủ. Ta sẽ thiết kế lại component Preview ở Admin để nó sao chép chính xác cấu trúc HTML/CSS và giao diện của trang chủ, đảm bảo Admin chỉnh gì thì ngoài trang chủ hiện đúng như thế.

## 2. Elaboration & Self-Explanation
Vấn đề cốt lõi gồm ba phần:
a) **Lỗi chiều cao Layout**: Trang `/projects` đang sử dụng thẻ `<main className="min-h-screen">`. Trong khi đó, layout tổng thể của trang (`SiteShell.tsx`) đã có một thẻ `<main className="flex-1 flex flex-col">`. Việc lồng thẻ `<main>` vào trong thẻ `<main>` khác và set `min-h-screen` (100vh) làm cho trang web luôn cao tối thiểu bằng màn hình, cộng thêm chiều cao của Header và Footer khiến nó luôn bị cuộn. Hơn nữa, vì không có flexbox căn chỉnh bên trong, khi danh sách dự án quá ngắn (chỉ có 2 dự án), phần nội dung chính kết thúc sớm nhưng container vẫn kéo dài 100vh, dẫn đến thanh phân trang (chữ "2 dự án") bị đẩy xuống tận đáy trang tạo ra một khoảng trống đen khổng lồ mất thẩm mỹ.
b) **Thông tin Hardcoded**: Các chuỗi tiêu đề phụ như "Projects" và mô tả "Các case study..." đang bị viết cứng trong code. Cần loại bỏ chúng để giao diện sạch sẽ, tập trung vào tiêu đề chính "Dự án đã thực hiện".
c) **Lệch pha giữa Trang Thực và Preview**: Trang xem trước giao diện ở Admin (`/system/experiences/projects-list`) sử dụng component `ProjectsListPreview` nhưng component này được code độc lập với giao diện thực tế. Nó dùng các thẻ giả lập (ví dụ hiển thị danh mục dạng badge thay vì dropdown select giống trang thực; không hiển thị mô tả dự án; không hỗ trợ hiển thị Sidebar ở layout 'list' giống trang thực). Việc này khiến người quản trị không hình dung được chính xác giao diện sẽ trông như thế nào.

Hướng xử lý:
* Thay thế thẻ `<main className="min-h-screen">` ở trang thực tế bằng thẻ `<div className="flex-grow flex flex-col">` hoặc `div` thường để chiều cao trang tự co giãn theo nội dung.
* Xóa các text hardcoded ở cả 2 nơi.
* Đồng bộ hóa code của component `ProjectsListPreview` để nó sử dụng chung cấu trúc, class Tailwind, và kiểu render (GridCard/ListCard/Filter/Sidebar) hệt như trang thực tế, chỉ khác ở chỗ sử dụng dữ liệu mẫu (mock data) đầy đủ hơn.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi bạn có một cái tủ cao 2 mét (Layout cha), bạn đặt một cái hộp cao đúng 2 mét vào trong (trang con `min-h-screen`). Nhưng trong cái hộp đó bạn chỉ để 2 cuốn sách nhỏ ở trên cùng, còn phần dưới thì trống rỗng. Cuốn sách ghi chú số lượng ("2 cuốn sách") lại bị dán ở đáy hộp. Kết quả là có một khoảng trống vô nghĩa giữa sách và nhãn ghi chú. Giải pháp là bỏ cái hộp cao 2 mét đi, chỉ dùng một cái khay nhỏ tự ôm khít 2 cuốn sách. Nhãn ghi chú sẽ nằm ngay sát dưới cuốn sách một cách tự nhiên.
* **Đồng bộ Preview**: Giống như việc bạn có một gương trang điểm (Preview) phản chiếu một hình ảnh hoạt hình đơn giản, trong khi người khác nhìn bạn ngoài đời (Site thực) lại là hình ảnh thực tế chi tiết. Chúng ta cần thay cái gương đó bằng một cái gương phẳng chất lượng cao phản chiếu chính xác dung nhan của bạn ngoài đời.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp cấu hình trang danh sách dự án thực tế**: `app/(site)/projects/page.tsx`
  - Đang dùng thẻ `<main className="... min-h-screen ...">` bao bọc ngoài cùng.
  - Chứa pageHeader hardcoded:
    ```tsx
    <p className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: brandColor }}>Projects</p>
    <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-[#f5f5f7] md:text-5xl">Dự án đã thực hiện</h1>
    <p className="mt-4 text-base text-slate-600 dark:text-[#86868b]">Các case study, hình ảnh và video giới thiệu nổi bật.</p>
    ```
  - `paginationBar` nằm ở cuối container chính, nếu nội dung ngắn sẽ bị rơi xuống dưới cùng do `min-h-screen`.
* **Tệp preview trải nghiệm Admin**: `components/experiences/previews/ProjectPreview.tsx`
  - Component `ProjectsListPreview` đang giả lập UI khác xa trang thực (dùng pill badges cho categories thay vì `<select>`, không hiển thị client name hay excerpt đúng chuẩn, thiếu sidebar lọc ở layout 'list', header hardcoded khác kiểu).
  - Component `ProjectCard` trong preview render cấu trúc hoàn toàn khác so với `GridCard` và `ListCard` ở trang thực.
* **Tệp cấu hình trải nghiệm trong Admin**: `app/system/experiences/projects-list/page.tsx`
  - Render `ProjectsListPreview` để hiển thị trực quan các cấu hình được chọn.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc của lỗi khoảng cách (spacing)**:
  Thẻ `<main className="min-h-screen">` của trang con làm tăng chiều cao tối thiểu của trang lên 100vh. Kết hợp với việc footer được xếp sau thẻ main cha (`SiteShell`), dẫn đến tổng chiều cao trang luôn vượt quá viewport và tạo khoảng trống lớn ở dưới khi danh sách dự án ngắn. Chữ "2 dự án" nằm ở cuối dòng chảy tự nhiên của container `div.space-y-8` bên trong `main` con, nên nó bị đẩy xuống mốc 100vh thay vì nằm ngay dưới card dự án.
* **Nguyên nhân gốc của sự không đồng bộ**:
  Component `ProjectsListPreview` được viết riêng với các class Tailwind và thẻ HTML giả lập thủ công (mockup) chứ không sử dụng các class và cấu trúc thực tế của `app/(site)/projects/page.tsx`.
* **Giả thuyết đối chứng**:
  Nếu chỉ xóa `min-h-screen` nhưng giữ nguyên thẻ `main` con, layout sẽ co giãn đúng theo nội dung thực tế và đẩy footer lên sát dưới danh sách dự án. Tuy nhiên, việc lồng 2 thẻ `<main>` là sai chuẩn SEO và HTML5, nên việc đổi sang thẻ `div` là bắt buộc để vừa sửa giao diện vừa tối ưu SEO.

---

# IV. Proposal (Đề xuất)

1. **Sửa đổi trang `/projects` thực tế** (`app/(site)/projects/page.tsx`):
   - Thay thế toàn bộ `<main className="... min-h-screen ...">` bằng `<div className="flex-1 bg-slate-50 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">`.
   - Cập nhật `pageHeader` để loại bỏ chữ "Projects" và mô tả phụ "Các case study...". Chỉ giữ lại tiêu đề `Dự án đã thực hiện` dạng sạch (clean).
2. **Sửa đổi preview** (`components/experiences/previews/ProjectPreview.tsx`):
   - Loại bỏ các text hardcoded ở phần header của preview để đồng nhất.
   - Cập nhật `sampleProjects` có đầy đủ các trường dữ liệu giả lập (`clientName`, `excerpt`, `thumbnail`) tương ứng với dữ liệu Convex DB thật.
   - Thiết kế lại `ProjectCard` của preview để hỗ trợ cả 2 dạng hiển thị: `GridCard` (dạng lưới) và `ListCard` (dạng ngang) sao chép y hệt code CSS/HTML từ trang chủ thực tế.
   - Tái cấu trúc bộ lọc ngang (`topFilterBar` giả lập) và bộ lọc dọc (`sidebarFilter` giả lập) để chúng sử dụng các thẻ `<select>` và `<input>` cùng style với trang chủ.
   - Đảm bảo hiển thị Sidebar khi layout là `sidebar` hoặc `list`.
3. **Áp dụng phong cách MacBook Design (MacBook Flat UI)**:
   - Các đường viền mảnh `zinc-200` (hoặc `dark:border-zinc-800`).
   - Khoảng cách `gap-6` và padding hợp lý, không quá thưa thớt.
   - Màu nền xám nhạt `bg-slate-50` kết hợp đen sâu `dark:bg-black` cho tổng thể trang.
   - Bo góc mềm mại `rounded-2xl` cho card dự án và `rounded-xl` cho các thành phần điều khiển (input, select, button).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx)
* **Vai trò hiện tại**: Trang hiển thị danh sách dự án phía Client.
* **Thay đổi**: Đổi thẻ ngoài cùng từ `main min-h-screen` thành `div flex-grow`, xóa bỏ các text hardcoded ở `pageHeader`.

### Sửa: [ProjectPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ProjectPreview.tsx)
* **Vai trò hiện tại**: Chứa component preview danh sách dự án cho trang Admin quản lý trải nghiệm.
* **Thay đổi**: Đồng bộ hóa toàn bộ cấu trúc giao diện, thẻ card dự án, bộ lọc và sidebar giống hệt như trang client thực tế; cập nhật mock data và xóa text hardcoded ở header.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ lại logic layout của cả 2 file.
2. Cập nhật `app/(site)/projects/page.tsx` (xóa hardcode text, đổi wrapper `main min-h-screen` sang `div flex-grow` hoặc `div flex-1`).
3. Cập nhật `components/experiences/previews/ProjectPreview.tsx` (đồng bộ layout, cấu trúc card Grid/List, bộ lọc select, và cập nhật mock data).
4. Review tĩnh mã nguồn để đảm bảo không bị lỗi cú pháp TypeScript hoặc import.
5. Chạy thử và bàn giao.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Thủ công:
* **Kiểm tra site thực tế (`/projects`)**:
  - Giao diện không còn hiển thị chữ "Projects" hay mô tả hardcoded ở header.
  - Footer nằm sát ngay dưới danh sách dự án và thanh phân trang khi số lượng dự án ít. Không còn khoảng trống màu đen khổng lồ ở giữa.
  - Phân trang "2 dự án" hiển thị ngay dưới các card, không bị rơi tự do xuống chân trang.
  - Cả 3 layout (Grid, Sidebar, List) đều hiển thị mượt mà, đúng cấu trúc.
* **Kiểm tra trang trải nghiệm Admin (`/system/experiences/projects-list`)**:
  - Trang preview hiển thị cấu trúc bộ lọc và card giống hệt site thực (Grid hiển thị 3 cột, Sidebar hiển thị 2 cột kèm bộ lọc bên trái, List hiển thị card dạng ngang kèm bộ lọc bên trái).
  - Chọn đổi qua lại giữa 3 layout trong Admin để đảm bảo Preview thay đổi tương ứng và giống hệt như thiết kế thực tế.

---

# VIII. Todo

- [ ] Sửa file [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/projects/page.tsx) để đổi wrapper thành `div` và xóa hardcode.
- [ ] Sửa file [ProjectPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ProjectPreview.tsx) để đồng bộ hóa giao diện preview với site thực.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Trang `/projects` không còn chứa text hardcode: "Projects" và "Các case study, hình ảnh và video giới thiệu nổi bật.".
2. Thanh phân trang và chữ "2 dự án" hiển thị gọn gàng, thẳng hàng ngay dưới các card dự án ở cả 3 loại layout của `/projects`.
3. Trang preview ở Admin (`/system/experiences/projects-list`) phản ánh chính xác 3 layout (Grid, Sidebar, List) tương ứng với giao diện của site thực, hiển thị đầy đủ filter select và cấu trúc card thật.
4. Không có lỗi biên dịch TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Lệch style CSS do đổi thẻ `main` thành `div`.
* **Hoàn tác**: Có thể dễ dàng khôi phục bằng `git checkout` các file đã chỉnh sửa.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic truy vấn dữ liệu Convex trong backend.
* Thay đổi chi tiết trang detail dự án (`/projects/[slug]`).
