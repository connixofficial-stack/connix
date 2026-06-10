# Thiết kế lại Layout Modern trang Chi tiết Tài nguyên theo phong cách macOS App

Tài liệu này mô tả chi tiết phương án thay thế giao diện layout "Hiện đại" (Modern) lòe loẹt của trang chi tiết tài nguyên bằng một giao diện phẳng, tối giản nhưng vô cùng sang trọng lấy cảm hứng từ các ứng dụng macOS và triết lý thiết kế "Calm Productivity UI".

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Giao diện Modern cũ có phần Banner màu Gradient sặc sỡ, lòe loẹt và các bóng đổ (shadow) lớn làm mất đi cảm giác chuyên nghiệp, không ăn nhập với phong cách của một ứng dụng làm việc tinh gọn.
* **Giải pháp**: Xây dựng lại layout Modern thành một "macOS App Window" thu nhỏ:
  - Loại bỏ hoàn toàn dải Gradient và Shadow lớn.
  - Thêm một thanh Toolbar ở trên cùng giả lập macOS với 3 nút chấm tròn đỏ-vàng-lục (Traffic Lights) đặc trưng.
  - Chia làm 2 cột: Sidebar bên trái màu xám nhạt (`bg-slate-50`) chứa thông tin chi tiết & nút Tải/Mua, cột chính bên phải nền trắng (`bg-white`) hiển thị Gallery ảnh lưới và nội dung chi tiết.
  - Spacing chặt chẽ hơn, bo góc nhỏ (`rounded-sm`/`rounded-md`), typography sắc sảo và thanh lịch.

## 2. Elaboration & Self-Explanation
Triết lý "Ultra-Minimal Dense" đề cao sự tĩnh lặng (Zero Noise), sự chặt chẽ của bố cục (Density over Whitespace) và cảm giác của một ứng dụng máy tính (Desktop App Feel).
Thay vì cố gắng trang trí trang web bằng những dải màu sắc sặc sỡ và hiệu ứng hoạt ảnh phức tạp, chúng ta tập trung vào cấu trúc lưới, các đường kẻ viền mảnh màu xám (`border-zinc-200`) và phân chia khu vực rõ ràng. 
Thanh điều hướng Toolbar phía trên giả lập cửa sổ macOS không chỉ tạo điểm nhấn thẩm mỹ đẳng cấp mà còn gom gọn các thông tin Breadcrumb và nút quay lại.
Sidebar bên trái đóng vai trò là bảng điều khiển (Inspector Panel), tập hợp tất cả thông số của tài nguyên từ danh mục, mô tả ngắn, các bộ lọc gán kèm và danh sách tài nguyên liên quan được xếp gọn gàng như danh sách tệp tin trong Finder. Nút hành động chính (Tải về/Mua) sẽ nằm phẳng trong Sidebar này với màu nền xám đậm (`bg-zinc-800`) hoặc màu thương hiệu phẳng, giúp người dùng tập trung hoàn toàn vào nội dung.

## 3. Concrete Examples & Analogies
* **Hình ảnh liên tưởng**: Hãy tưởng tượng bạn đang mở ứng dụng *Finder* hoặc ứng dụng *App Store* trên macOS. Ở đó, thanh bên trái có màu nền xám dịu nhẹ phân tách bằng một đường viền dọc mảnh, hiển thị các thư mục và thuộc tính. Khi bấm vào một file, thông tin hiển thị bên phải một cách ngăn nắp, chữ nhỏ sắc nét (`text-xs`), nút bấm có viền nhẹ và phẳng. Không hề có các màu Gradient tím-xanh hay bóng đổ mờ ảo tràn lan như các trang web marketing thông thường.
* **Ví dụ cụ thể**:
  - Banner cũ: `<section style={{ background: 'linear-gradient(135deg, purple, blue)' }}>`
  - macOS Container mới: `<div className="border border-zinc-200 bg-white rounded-md overflow-hidden">`
  - Các nút hành động: Không sử dụng `shadow-lg shadow-indigo-200` mà dùng `border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 transition-colors`.

# II. Audit Summary (Tóm tắt kiểm tra)

* Đã kiểm tra file [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx):
  - Layout Modern nằm từ dòng 397 đến 475.
  - Chứa cấu trúc `section` với background gradient tuyến tính và `section` 2 cột.
  - Gọi các component con `CtaCard` và `GalleryBlock` nội bộ.
* Đã kiểm tra file [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx):
  - Bản xem trước của layout Modern nằm từ dòng 888 đến 949.
  - Chứa cấu trúc tương tự với Mock data tĩnh để admin có thể xem trước chính xác những gì hiển thị ngoài site thực tế.
* Cần đảm bảo việc thiết kế lại layout Modern phải đồng bộ hoàn hảo ở cả hai file này.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Layout Modern trước đây được thiết kế theo phong cách Web Marketing đại trà (Gradient lớn, bo góc quá tròn, bóng đổ nhiều) gây loãng mắt và không đạt được tiêu chuẩn "đẹp, tiện gọn và đẳng cấp" của các ứng dụng macOS/iOS mà người dùng mong muốn.
* **Giải pháp khắc phục**: Tái cấu trúc cấu trúc HTML/CSS của layout `modern` trong cả preview và site thực tế, áp dụng triết lý thiết kế hệ thống macOS mỏng nhẹ, tối giản phẳng.

# IV. Proposal (Đề xuất)

Thay thế hoàn toàn cấu trúc hiển thị của `layoutStyle === 'modern'` bằng cấu trúc **macOS Window Layout**:

### 1. Window Wrapper:
```tsx
<div className="border border-zinc-200 bg-white rounded-md overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
```

### 2. Window Toolbar:
Nền xám nhạt (`bg-slate-50/90`), border dưới (`border-b border-zinc-200`), có 3 nút Traffic Lights:
```tsx
<div className="h-11 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-sm px-4 flex items-center justify-between select-none">
  <div className="flex items-center gap-6">
    {/* Traffic lights */}
    <div className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full bg-[#ff5f56] border border-[#e0443e] shrink-0" />
      <span className="h-3 w-3 rounded-full bg-[#ffbd2e] border border-[#dea123] shrink-0" />
      <span className="h-3 w-3 rounded-full bg-[#27c93f] border border-[#1aab29] shrink-0" />
    </div>
    {/* Breadcrumb */}
    <div className="h-3.5 w-[1px] bg-zinc-200" />
    <Link href="/resources" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition-colors font-medium">
      <ArrowLeft size={12} />
      <span>Tất cả tài nguyên</span>
    </Link>
  </div>
  {/* Right Info */}
  <div className="text-[11px] font-mono text-zinc-400">
    {category?.name ?? 'Tài nguyên'}
  </div>
</div>
```

### 3. Workspace Layout (2 columns):
* **Cột Trái (macOS Sidebar - bg-zinc-50/60, border-r border-zinc-200)**:
  - Rộng 300px - 320px ở desktop.
  - Chứa Tiêu đề tài nguyên (`text-lg font-bold`), Excerpt mô tả ngắn (`text-xs text-zinc-500`), tag Nổi bật/Danh mục.
  - CtaCard được phẳng hóa: viền mảnh `border-zinc-200`, không shadow lớn, nút CTA sử dụng màu thương hiệu phẳng hoặc `bg-zinc-800 hover:bg-zinc-700` cực kỳ sắc nét.
  - Các Resource Filters hiển thị gọn như danh sách thuộc tính.
  - Danh sách Tài nguyên liên quan hiển thị dạng tệp tin Finder (mỗi dòng có icon tài liệu nhỏ, hover đổi màu nền thành xám).
* **Cột Phải (Main View - bg-white)**:
  - Chứa `GalleryBlock` (ở vị trí trên cùng, bo góc `rounded-sm`, viền mỏng).
  - Chứa `RichContent` (ở vị trí dưới, khoảng cách dòng thoáng nhưng cỡ chữ nhỏ gọn `text-sm`, căn lề cân đối).

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx)
  - Thay đổi cấu trúc HTML/CSS của khối điều kiện `if (config.layoutStyle === 'modern')` để hiển thị theo giao diện macOS Window mới.
  - Cập nhật lại style của `CtaCard` khi hiển thị trong layout Modern để phẳng hóa và loại bỏ shadow lớn hay gradient.
* **Sửa**: [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx)
  - Đồng bộ cấu trúc HTML/CSS của khối điều kiện `if (layoutStyle === 'modern')` tương thích 1:1 với trang thực tế, đảm bảo trải nghiệm xem trước chính xác cho admin.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ hai file đích để định vị chính xác vị trí thay thế.
2. Cập nhật mã nguồn trong [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx) trước và kiểm tra tính nhất quán logic.
3. Cập nhật mã nguồn trong [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx) tương ứng.
4. Tự review tĩnh (static review) mã nguồn để phòng ngừa lỗi type hoặc import lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Dự án sẽ chạy pre-commit hook (Oxlint + TypeScript check) khi commit code.

### Manual Verification
- Người dùng chạy ứng dụng local để so sánh trực quan giao diện Modern mới ở cả Trang Xem trước (Admin Preview) và Trang thực tế (Public Resource Detail).
- Đảm bảo các chức năng Tải về, Mua tài nguyên, Chuyển đổi ảnh trong Gallery và Click xem tài nguyên liên quan vẫn hoạt động trơn tru.

# VIII. Todo
- [ ] Thay đổi layout 'modern' trong [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx).
- [ ] Đồng bộ hóa layout 'modern' trong [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout Modern không còn dải màu Gradient sặc sỡ và bóng đổ lớn.
- Layout Modern hiển thị dưới dạng một macOS Window có Traffic Lights điều khiển cửa sổ ở góc trái, toolbar xám nhạt mỏng.
- Có cấu trúc sidebar bên trái màu xám nhạt (`bg-slate-50` hoặc `bg-zinc-50`), cột nội dung chính bên phải màu trắng (`bg-white`).
- Spacing nhỏ gọn, bo góc nhỏ tinh tế (`rounded-sm`/`rounded-md`).
- Đồng bộ hoàn toàn 100% về mặt giao diện và bố cục giữa trang Xem trước trong Admin và trang thực tế của người dùng.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Thay đổi cấu trúc HTML có thể làm lệch vị trí hiển thị trên các thiết bị di động (Mobile).
- **Giải pháp giảm thiểu**: Thêm các lớp kiểm tra responsive (`lg:grid-cols-...`, `grid-cols-1`, ẩn traffic lights ở mobile nếu cần thiết hoặc thu nhỏ toolbar). Khi ở mobile, sidebar sẽ được đẩy xuống dưới hoặc hiển thị như một cột duy nhất một cách tự nhiên.
- **Rollback**: Sử dụng `git checkout -- <file>` để hoàn tác các file đã chỉnh sửa nếu có bất kỳ lỗi không mong muốn nào.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc cơ sở dữ liệu (schema) hoặc các API endpoint hiện có.
- Thay đổi 2 layout còn lại (`classic` và `minimal`).
