# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn mở trang chỉnh sửa sản phẩm, dịch vụ hoặc bài viết lần đầu tiên (chưa hề thay đổi gì), hệ thống sẽ so sánh dữ liệu hiện tại trên form (`currentSnapshot`) với dữ liệu gốc ban đầu (`initialSnapshotRef.current`). 
Tuy nhiên, trình soạn thảo văn bản phong phú **LexicalEditor** ngay khi vừa được hiển thị (mount) sẽ tự động sinh thêm các class CSS định dạng hoặc các thẻ bọc phụ (ví dụ `<p class="editor-paragraph"><span class="editor-text-ltr">Nội dung</span></p>`). Việc này làm cho HTML của nội dung form bị khác đi một chút so với HTML thô lưu trong cơ sở dữ liệu (ví dụ `<p>Nội dung</p>`), khiến hệ thống tưởng rằng người dùng đã chỉnh sửa nội dung và kích hoạt trạng thái "Lưu thay đổi" (dirty state).

Chúng ta sẽ sửa lỗi này bằng cách nâng cấp bộ chuẩn hoá HTML `normalizeRichText` để loại bỏ sạch các thuộc tính class, style tự động và gỡ bỏ các thẻ `span` vô ích khi so sánh dữ liệu. Đồng thời, sửa thêm lỗi khởi tạo thiếu danh mục phụ do bất đồng bộ dữ liệu và lệch mili giây khi lên lịch bài viết.

## 2. Elaboration & Self-Explanation
Hệ thống quản lý trạng thái thay đổi (dirty state tracking) hoạt động dựa trên cơ chế so sánh chuỗi JSON của hai đối tượng snapshot:
1. `initialSnapshotRef.current`: Lưu trữ trạng thái dữ liệu nguyên bản từ cơ sở dữ liệu (Convex) khi vừa tải xong.
2. `currentSnapshot`: Trạng thái động phản ánh các giá trị hiện tại trên form.

Khi cả hai snapshot này khớp nhau hoàn toàn, nút lưu ở Sticky Footer sẽ hiển thị trạng thái "Đã lưu" và bị vô hiệu hóa (disabled). Nếu có bất kỳ sự khác biệt nào, nút sẽ chuyển sang "Lưu thay đổi".

Lỗi "Lưu thay đổi" hiển thị ngay lần đầu vào trang xuất phát từ ba nguồn bất đối xứng (asymmetry) chính:
- **Sự tự động chuẩn hoá của LexicalEditor**: Khi tải trang, LexicalEditor nhận HTML thô và dựng cây DOM của nó. Sau khi dựng xong, nó trigger sự kiện `onChange` và gửi lại HTML đã được bọc bởi các class mặc định (như `.editor-paragraph`, `.editor-text-ltr`). DOMParser thông thường khi chuẩn hoá HTML gốc không có các class này, dẫn đến sự khác biệt chuỗi HTML trong so sánh JSON.
- **Bất đồng bộ khi tải danh mục phụ (`additionalCategoryIdsData`)**: Ở trang sản phẩm và bài viết, danh mục phụ được tải từ Convex qua một API query độc lập. Vì Convex trả dữ liệu bất đồng bộ, khi dữ liệu chính (như `productData` hoặc `postData`) sẵn sàng trước, useEffect khởi tạo form sẽ chạy ngay lập tức và gán danh mục phụ thành mảng rỗng `[]` (do `additionalCategoryIdsData` lúc đó đang là `undefined`). Khi danh mục phụ thực sự được tải xong, cờ `isDataLoaded` đã được set thành `true` nên useEffect không chạy lại, làm mất dữ liệu danh mục phụ hiển thị trên form.
- **Lệch mili giây trong lên lịch bài viết (`publishedAt`)**: Khi bài viết được lên lịch xuất bản trong tương lai, `postData.publishedAt` (dạng timestamp chi tiết đến mili giây) được chuyển thành chuỗi ISO cục bộ cắt giây ở input datetime-local (`YYYY-MM-DDTHH:mm`). Khi so sánh snapshot, hệ thống parse ngược chuỗi này về timestamp (mất phần giây và mili giây), gây ra sự lệch số timestamp thô so với database.

Chúng ta sẽ giải quyết triệt để cả ba vấn đề bằng cách:
- Cải tiến hàm `normalizeRichText` để lọc sạch các thuộc tính CSS trang trí không ảnh hưởng đến nội dung (giữ lại các thuộc tính quan trọng như `href`, `src`, `alt`, `target`) và loại bỏ các thẻ `span` rỗng/vô nghĩa.
- Đảm bảo useEffect khởi tạo form chỉ chạy khi toàn bộ các Convex queries liên quan (bao gồm cả `additionalCategoryIdsData`) đã trả về kết quả cụ thể (không còn `undefined`).
- Sử dụng chung một cơ chế làm tròn thời gian cho thuộc tính `publishedAt` trong `initialSnapshotRef` bằng cách đi qua bộ chuyển đổi datetime-local của form.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể về HTML của LexicalEditor**:
  - HTML trong cơ sở dữ liệu: `<p>Hello <strong>World</strong></p>`
  - HTML do LexicalEditor tự động trigger sau khi mount: `<p class="editor-paragraph"><span class="editor-text-ltr">Hello </span><strong class="editor-text-bold">World</strong></p>`
  - Sau khi qua bộ chuẩn hoá `normalizeRichText` cải tiến:
    1. Lọc thuộc tính: `<p><span>Hello </span><strong>World</strong></p>`
    2. unwrap span vô nghĩa: `<p>Hello <strong>World</strong></p>`
  - Kết quả: Khớp hoàn toàn 100%!

- **Analogy (Ẩn dụ đời thường)**:
  Tưởng tượng bạn gửi một bức thư tay viết chữ thường cho người dịch. Người dịch gõ lại bức thư đó vào máy tính và tự động đổi font chữ sang Arial và căn lề thụt đầu dòng. Khi bạn so sánh bản gốc và bản gõ lại bằng mắt thường, bạn thấy nội dung chữ y hệt nhau, nhưng máy tính so sánh bằng cách quét quét pixel ảnh (JSON.stringify) thì kết luận hai bức thư khác nhau hoàn toàn vì khác font và khoảng cách lề.
  Giải pháp của chúng ta là đưa cả hai bức thư đi qua một máy lọc "chỉ giữ lại chữ và định dạng in đậm/nghiêng cốt lõi" trước khi so sánh, nhờ đó máy tính sẽ nhận diện chính xác là hai bức thư giống nhau.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã tiến hành kiểm tra mã nguồn tại các tệp chỉnh sửa cốt lõi trong phân hệ quản trị (`app/admin`):
1. [products/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/products/%5Bid%5D/edit/page.tsx): Phát hiện việc tính toán `currentSnapshot` và `initialSnapshotRef` có chứa các cấu trúc phức tạp (`variants`, `combos`, `attributeTermIds`, `rangeInputs`) và việc gán snapshot khởi tạo diễn ra ngay khi danh mục phụ `additionalCategoryIdsData` vẫn còn là `undefined`.
2. [services/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/services/%5Bid%5D/edit/page.tsx): Phát hiện thiếu cờ `isDataLoaded` dẫn đến việc khởi tạo chạy lại nhiều lần và bị dính hiệu ứng thay đổi HTML của LexicalEditor làm form bị dirty ngay khi tải.
3. [posts/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/posts/%5Bid%5D/edit/page.tsx): Phát hiện lệch múi giờ/mili giây tại trường `publishedAt` và lỗi load danh mục phụ bất đồng bộ tương tự như trang sản phẩm.
4. [app/admin/lib/normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts): Hàm `normalizeRichText` hiện tại chỉ sử dụng DOMParser để lấy `body.innerHTML.trim()` mà không xử lý các thuộc tính phụ, dẫn đến việc các thẻ HTML bị thêm class/span từ LexicalEditor không thể khớp với HTML thô ban đầu.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### 1. Nguyên nhân gốc (Root Cause)
- **Độ tin cậy (Confidence): High** (Đã xác minh qua logic mã nguồn và hành vi của LexicalEditor).
- **Lý do**:
  1. LexicalEditor tự động chuẩn hoá cấu trúc HTML của nó khi khởi tạo và gọi `onChange(html)` truyền ngược lại cho form của page.tsx. Do đó, state `content`/`description` bị thay đổi từ HTML thô sang HTML có class/span định dạng ngay lập tức.
  2. Hàm `normalizeRichText` hiện tại không bóc tách các thuộc tính class/style/dir tự sinh và không unwrap các thẻ `span` vô nghĩa, tạo ra sự lệch chuỗi HTML vĩnh viễn trong so sánh JSON.stringify.
  3. Bất đồng bộ trong Convex queries: `additionalCategoryIdsData` load chậm hơn dữ liệu thực thể chính làm cho form bị khởi tạo thiếu danh mục phụ, và cờ `isDataLoaded` ngăn chặn việc cập nhật lại khi dữ liệu load xong.
  4. Lệch mili giây của trường `publishedAt` do chuỗi datetime-local bị mất độ phân giải giây/mili giây so với timestamp gốc lưu trong DB.

### 2. Giả thuyết đối chứng (Counter-Hypothesis)
- *Giả thuyết*: Lỗi có thể do React state update bị trễ (race conditions) hoặc render trung gian trước khi `useEffect` khởi tạo chạy xong.
- *Đối chứng*: Nếu chỉ do render trung gian, sau khi tất cả các state được cập nhật xong ở render tiếp theo, `hasChanges` sẽ chuyển về `false`, và `useEffect` lắng nghe `hasChanges` sẽ khôi phục `saveStatus` về `'saved'`, làm nút Sticky Footer hiển thị lại thành "Đã lưu". Nhưng thực tế nút luôn hiển thị "Lưu thay đổi" vĩnh viễn, chứng tỏ dữ liệu của `currentSnapshot` và `initialSnapshotRef.current` thực sự lệch nhau vĩnh viễn sau khi form đã ổn định.

---

# IV. Proposal (Đề xuất)

1. **Nâng cấp `normalizeRichText`** tại [normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts):
   - Duyệt qua tất cả các phần tử trong cây DOM được phân tích bởi DOMParser.
   - Loại bỏ toàn bộ thuộc tính ngoại trừ các thuộc tính thiết yếu (`href`, `src`, `alt`, `target`).
   - Tìm và gỡ bỏ (unwrap) các thẻ `span` không chứa bất kỳ thuộc tính nào (chỉ bọc văn bản thông thường) để tránh các thẻ `span` phụ do LexicalEditor chèn vào làm sai lệch cấu trúc HTML.

2. **Khắc phục lỗi tải danh mục phụ bất đồng bộ** tại trang Chỉnh sửa Sản phẩm và Bài viết:
   - Thêm điều kiện `additionalCategoryIdsData !== undefined` vào khối kiểm tra dữ liệu trước khi chạy `useEffect` khởi tạo form để đảm bảo form chỉ được dựng khi danh mục phụ đã được tải hoàn chỉnh.

3. **Khắc phục lỗi lệch giây/mili giây khi lên lịch bài viết**:
   - Sử dụng chung cơ chế làm tròn thời gian cho thuộc tính `publishedAt` trong `initialSnapshotRef` bằng cách đi qua bộ chuyển đổi datetime-local của form.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### 1. Phân hệ Shared / Utility
- #### [MODIFY] [normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts)
  - *Vai trò hiện tại*: Chuẩn hoá chuỗi HTML bằng DOMParser cơ bản.
  - *Thay đổi*: Nâng cấp thêm thuật toán loại bỏ thuộc tính rác và gỡ bỏ thẻ `span` rỗng để HTML từ cơ sở dữ liệu và HTML từ LexicalEditor có thể khớp nhau hoàn toàn khi so sánh.

### 2. Phân hệ UI Pages
- #### [MODIFY] [page.tsx (Products Edit)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/products/%5Bid%5D/edit/page.tsx)
  - *Vai trò hiện tại*: Quản lý form chỉnh sửa sản phẩm.
  - *Thay đổi*: Sửa điều kiện khởi tạo form trong useEffect chính để chờ danh mục phụ tải xong (`additionalCategoryIdsData !== undefined`).
- #### [MODIFY] [page.tsx (Services Edit)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/services/%5Bid%5D/edit/page.tsx)
  - *Vai trò hiện tại*: Quản lý form chỉnh sửa dịch vụ.
  - *Thay đổi*: Thêm cờ `isDataLoaded` và sửa logic useEffect chính để đảm bảo form chỉ khởi tạo đúng một lần khi dữ liệu dịch vụ và danh mục phụ sẵn sàng, tránh vòng lặp re-render hoặc đè dữ liệu.
- #### [MODIFY] [page.tsx (Posts Edit)](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/posts/%5Bid%5D/edit/page.tsx)
  - *Vai trò hiện tại*: Quản lý form chỉnh sửa bài viết.
  - *Thay đổi*: Sửa điều kiện khởi tạo form chờ danh mục phụ và đồng bộ hoá cách tính toán `publishedAt` qua hàm làm tròn datetime-local để khớp hoàn toàn timestamp.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ mã nguồn của [normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts).
2. Thực hiện sửa đổi [normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts) thông qua công cụ thay thế nội dung file.
3. Thực hiện sửa đổi trang Chỉnh sửa Dịch vụ [services/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/services/%5Bid%5D/edit/page.tsx) để tích hợp cờ `isDataLoaded` và chặn khởi tạo trùng lặp.
4. Thực hiện sửa đổi trang Chỉnh sửa Sản phẩm [products/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/products/%5Bid%5D/edit/page.tsx) để chờ `additionalCategoryIdsData !== undefined`.
5. Thực hiện sửa đổi trang Chỉnh sửa Bài viết [posts/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/posts/%5Bid%5D/edit/page.tsx) để chờ danh mục phụ và sửa lỗi làm tròn timestamp `publishedAt`.
6. Thực hiện tự review tĩnh toàn bộ code trước khi bàn giao.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Automated Tests (Review tĩnh & Kiểm tra Type)
- Sử dụng Git Hook tự động của dự án thông qua Oxlint và TypeScript compiler:
  Chúng ta có thể chạy kiểm tra lỗi Type nhanh bằng lệnh:
  `bunx tsc --noEmit` và giới hạn kết quả bằng lệnh PowerShell thích hợp để không làm tràn context.

### 2. Manual Verification (Kiểm chứng hành vi thực tế)
- Vào trang chỉnh sửa sản phẩm: `http://localhost:3000/admin/products/<id>/edit`.
- Xác nhận nút ở Sticky Footer ban đầu hiển thị **"Đã lưu"** và bị **disabled**.
- Thay đổi một thuộc tính bất kỳ trên form -> Nút lập tức chuyển sang **"Lưu thay đổi"** và sáng lên (enabled).
- Khôi phục lại giá trị cũ -> Nút chuyển về **"Đã lưu"** và bị disabled.
- Áp dụng các bước kiểm chứng tương tự trên trang Chỉnh sửa Dịch vụ và Chỉnh sửa Bài viết.

---

# VIII. Todo

- [ ] Sửa đổi tệp shared utility [normalize-rich-text.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/lib/normalize-rich-text.ts) để chuẩn hoá sâu HTML.
- [ ] Sửa đổi trang [services/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/services/%5Bid%5D/edit/page.tsx) (Tích hợp `isDataLoaded` + fix dirty state).
- [ ] Sửa đổi trang [products/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/products/%5Bid%5D/edit/page.tsx) (Fix load danh mục phụ + fix dirty state).
- [ ] Sửa đổi trang [posts/[id]/edit/page.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/posts/%5Bid%5D/edit/page.tsx) (Fix load danh mục phụ + fix làm tròn `publishedAt` + fix dirty state).
- [ ] Xác minh compile TypeScript (`bunx tsc --noEmit`).
- [ ] Phát âm báo hoàn thành task `"Done, Sir."`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Khi lần đầu truy cập vào trang Edit của Sản phẩm, Dịch vụ hoặc Bài viết: Nút ở Sticky Footer **phải hiển thị là "Đã lưu"** và bị vô hiệu hóa (disabled).
2. Khi người dùng chỉnh sửa bất kỳ trường dữ liệu nào (như Tiêu đề, Giá, Nội dung Lexical, v.v.): Nút ở Sticky Footer **phải chuyển sang "Lưu thay đổi"** và có thể tương tác được (enabled).
3. Khi người dùng khôi phục lại dữ liệu cũ về ban đầu: Nút **phải tự động chuyển về "Đã lưu"** và bị disabled trở lại.
4. Mọi dữ liệu danh mục phụ (nhãn tag bổ sung) được hiển thị đầy đủ và chính xác trên form khi load trang, không bị mất mát hay bị xóa trống.
5. Không có bất kỳ lỗi biên dịch (TypeScript type errors) nào được sinh ra từ những thay đổi này.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Việc lọc thuộc tính của HTML trong `normalizeRichText` có thể vô tình xóa mất các thuộc tính CSS quan trọng được người dùng chèn chủ động trong LexicalEditor (ví dụ màu sắc chữ inline-style, căn lề inline-style).
- **Giải pháp giảm thiểu rủi ro**: Trong `normalizeRichText`, chúng ta **chỉ loại bỏ thuộc tính khi chạy so sánh snapshot**!
  Đúng vậy! Hàm `normalizeRichText` hiện tại chỉ được sử dụng cho mục đích **so sánh dữ liệu** (`hasChanges`) và **SEO description preview**! Nó hoàn toàn KHÔNG ĐƯỢC DÙNG để ghi đè dữ liệu thật gửi lên server.
  Dữ liệu thật gửi lên server được lấy trực tiếp từ state thô `content`/`description` (không đi qua `normalizeRichText`).
  Vì vậy, việc lọc sạch các class và inline-styles trang trí trong `normalizeRichText` là hoàn toàn AN TOÀN, vì nó chỉ phục vụ cho việc tính toán dirty state của form một cách chuẩn xác, không hề làm mất định dạng hay style của văn bản thực tế khi lưu vào database!
- **Rollback**: Có thể dễ dàng khôi phục lại các file qua git checkout nếu xảy ra vấn đề ngoài ý muốn.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp hay thay đổi cấu trúc lưu trữ dữ liệu trong cơ sở dữ liệu Convex.
- Không thay đổi hành vi/styling của giao diện Sticky Footer hay giao diện các form editor.
- Không tối ưu hóa hay viết lại trình soạn thảo LexicalEditor.
