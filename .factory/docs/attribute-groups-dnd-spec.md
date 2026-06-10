# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi quản lý các giá trị thuộc tính (ví dụ: kích thước S, M, L hay màu sắc Đỏ, Xanh), người quản trị phải tự gõ tay số "Thứ tự" hiển thị (0, 1, 2...). Việc này rất mất thời gian, dễ nhầm lẫn và gây mệt mỏi.
* **Giải pháp:** 
  1. Loại bỏ ô nhập số "Thứ tự" ở form thêm mới giá trị thuộc tính và phần hiển thị số thứ tự ở danh sách.
  2. Tích hợp tính năng kéo thả **DnD (Drag and Drop)** trực quan bằng thư viện `@dnd-kit` (giống như trang quản lý Option Values đã làm).
  3. Tự động tính toán thứ tự ở backend Convex khi thêm mới (`lastTerm.order + 1`), và gọi mutation `reorder` để cập nhật lại toàn bộ thứ tự khi người dùng kéo thả xong.

## 2. Elaboration & Self-Explanation
Hiện tại, khi người dùng vào trang chỉnh sửa nhóm thuộc tính (`/admin/attribute-groups/[id]/edit`), họ có thể quản lý các giá trị thuộc tính (Terms) qua component `AttributeTermsManager`.
Tuy nhiên, UI hiện tại yêu cầu nhập trường `Thứ tự` (kiểu số) khi thêm mới, và chỉ hiển thị danh sách tĩnh. Để thay đổi thứ tự, người dùng không thể kéo thả mà bắt buộc phải xóa đi nhập lại hoặc sửa số (nếu có form sửa - hiện tại thậm chí chưa có form sửa term, chỉ có Thêm và Xóa!).
Bằng cách áp dụng `@dnd-kit`, chúng ta biến danh sách tĩnh thành sortable list. Khi người dùng thực hiện thao tác kéo thả, sự kiện `onDragEnd` sẽ kích hoạt, tính toán vị trí mới của các term trong mảng, tạo ra một danh sách các cặp `{ id, order }` mới và gửi lên mutation `api.attributeTerms.reorder` để lưu cập nhật đồng bộ xuống cơ sở dữ liệu Convex. Khi thêm mới một term, backend Convex sẽ tự động gán `order` bằng thứ tự lớn nhất hiện tại cộng thêm 1, giúp loại bỏ hoàn toàn ô nhập liệu "Thứ tự" thủ công.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** 
  * Hiện tại: Thêm giá trị "Đỏ" (Thứ tự: 0), "Vàng" (Thứ tự: 1), "Xanh" (Thứ tự: 2). Muốn chuyển "Xanh" lên trước "Vàng", người dùng không có cách nào nhanh chóng mà phải xóa đi tạo lại hoặc sửa đổi thủ công rất phức tạp.
  * Sau khi nâng cấp: Người dùng chỉ cần click vào biểu tượng tay cầm (Grip) của hàng "Xanh", kéo lên trên "Vàng" và thả chuột. Hệ thống sẽ tự động cập nhật "Xanh" thành thứ tự 1 và "Vàng" thành thứ tự 2 mượt mà trong chưa đầy 1 giây.

---

# II. Audit Summary (Tóm tắt kiểm tra)
Qua kiểm tra codebase, chúng tôi xác định được:
1. **Trang Edit nhóm thuộc tính:** `app/admin/attribute-groups/[id]/edit/page.tsx` chứa component `AttributeTermsManager` dùng để Crud các giá trị thuộc tính. Component này hiện có ô nhập liệu `order` (Thứ tự) và hiển thị cột `Thứ tự`.
2. **Trang Create nhóm thuộc tính:** `app/admin/attribute-groups/create/page.tsx` chỉ dùng để tạo Nhóm thuộc tính (Attribute Group), chưa hề có phần quản lý Giá trị thuộc tính (Attribute Terms) do chưa có `groupId` trên database tại thời điểm tạo mới. Vì vậy việc bỏ số thứ tự và thêm kéo thả chủ yếu áp dụng cho form thêm mới và danh sách giá trị thuộc tính thuộc trang `/edit` (khi đã có group tồn tại).
3. **Backend Convex:** `convex/attributeTerms.ts` hiện có các mutation `create`, `update`, `remove` nhưng **chưa có** mutation `reorder` hàng loạt để hỗ trợ tính năng kéo thả DnD.
4. **Pattern `@dnd-kit` sẵn có:** Trang `app/admin/product-options/[id]/values/page.tsx` đã triển khai thành công `@dnd-kit` với Pointer và Keyboard sensors, `arrayMove`, `useSortable` và `SortableContext`. Chúng ta sẽ bám sát 100% pattern này.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc:** Thiết kế giao diện ban đầu sử dụng cách tiếp cận nhập liệu số truyền thống đơn giản (số thứ tự thủ công) thay vì kéo thả tương tác cao, dẫn đến trải nghiệm quản trị (UX) kém tối ưu cho người sử dụng.
* **Độ tin cậy nguyên nhân gốc:** **High** (Đã xác minh qua việc đọc trực tiếp code giao diện `AttributeTermsManager` đang dùng thẻ `<Input type="number" value={order} ... />` để lưu trữ thứ tự).
* **Giả thuyết đối chứng:** Nếu chỉ sửa đổi thứ tự ở client-side mà không đồng bộ lên backend, trạng thái sắp xếp sẽ bị mất khi tải lại trang (F5). Do đó, bắt buộc phải có mutation `reorder` ở database Convex để lưu trữ thứ tự chính xác.

---

# IV. Proposal (Đề xuất)
1. **Backend (Convex):**
   * Bổ sung mutation `reorder` vào file `convex/attributeTerms.ts` để nhận danh sách các cặp `{ id, order }` và cập nhật hàng loạt trường `order` của các tài liệu tương ứng thông qua `ctx.db.patch`.
2. **Frontend (Next.js Admin):**
   * Cập nhật `app/admin/attribute-groups/[id]/edit/page.tsx`:
     * Loại bỏ state `order` và input nhập Thứ tự khỏi form thêm mới term.
     * Import `@dnd-kit/core`, `@dnd-kit/sortable` và `@dnd-kit/utilities`.
     * Tạo component hàng con `SortableTermRow` kế thừa các listener và attributes của `useSortable` để hiển thị biểu tượng tay cầm `GripVertical` ở đầu mỗi hàng term.
     * Bọc danh sách term bằng `<DndContext>` và `<SortableContext>`.
     * Triển khai hàm `handleDragEnd` để sắp xếp lại mảng terms bằng `arrayMove` sau đó gọi mutation `reorder` cập nhật thứ tự lên Convex.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa: [convex/attributeTerms.ts](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/attributeTerms.ts)
* **Vai trò hiện tại:** Cung cấp API Convex cho việc list, create, update, delete giá trị thuộc tính.
* **Thay đổi:** Thêm mutation `reorder` nhận đối số `items: v.array(v.object({ id: v.id("attributeTerms"), order: v.number() }))` và cập nhật hàng loạt `order` tương ứng xuống DB.

### Sửa: [app/admin/attribute-groups/[id]/edit/page.tsx](file:///E:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/attribute-groups/[id]/edit/page.tsx)
* **Vai trò hiện tại:** Trang chỉnh sửa Nhóm thuộc tính và quản lý các Giá trị thuộc tính con.
* **Thay đổi:**
  * Loại bỏ input số "Thứ tự" ở form thêm mới term.
  * Tích hợp `@dnd-kit` để hiển thị danh sách terms dạng kéo thả DnD.
  * Thêm biểu tượng tay cầm kéo thả `GripVertical`.
  * Đồng bộ thứ tự sắp xếp mới qua mutation `api.attributeTerms.reorder`.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc và chuẩn bị:** Xem xét kỹ lưỡng cấu trúc và các thư viện dnd-kit trong project.
2. **Cập nhật Backend:** Sửa đổi `convex/attributeTerms.ts` để thêm mutation `reorder`.
3. **Cập nhật Frontend:** Sửa đổi `app/admin/attribute-groups/[id]/edit/page.tsx` để tích hợp DnD.
4. **Kiểm tra biên dịch:** Chạy `bunx tsc --noEmit` để xác nhận TypeScript biên dịch thành công mà không có lỗi.
5. **Âm báo hoàn thành:** Phát giọng nói "Done, Sir." qua công cụ run_command để thông báo hoàn thành tác vụ.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tự động (TypeScript biên dịch):
* Chạy lệnh `bunx tsc --noEmit` trong terminal để chắc chắn không phát sinh lỗi kiểu dữ liệu (type error) khi import `@dnd-kit` và định nghĩa mutation.

### Kiểm tra thủ công (Mô tả hành vi mong muốn):
1. Truy cập trang chỉnh sửa Nhóm thuộc tính.
2. Form thêm mới "Các giá trị thuộc tính" không còn ô "Thứ tự". Khi bấm "Thêm", term mới sẽ tự động được thêm vào cuối danh sách.
3. Khi rê chuột vào biểu tượng GripVertical ở đầu mỗi hàng giá trị thuộc tính, con trỏ chuột chuyển sang dạng bàn tay kéo.
4. Kéo một hàng lên hoặc xuống vị trí khác và thả chuột: danh sách sẽ được sắp xếp lại, một thông báo Toast thành công hiện lên và thứ tự lưu trữ trên database được cập nhật.

---

# VIII. Todo
- [ ] Bổ sung mutation `reorder` trong `convex/attributeTerms.ts`.
- [ ] Loại bỏ ô nhập số thứ tự và hiển thị số thứ tự trong `app/admin/attribute-groups/[id]/edit/page.tsx`.
- [ ] Tích hợp `@dnd-kit` và component `SortableTermRow` vào `app/admin/attribute-groups/[id]/edit/page.tsx`.
- [ ] Triển khai hàm `handleDragEnd` gọi mutation `reorder` trong `app/admin/attribute-groups/[id]/edit/page.tsx`.
- [ ] Kiểm tra biên dịch TypeScript bằng `bunx tsc --noEmit`.
- [ ] Phát âm báo "Done, Sir." thông qua voice engine.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Giao diện form tạo mới term không có ô nhập Thứ tự.
* Danh sách giá trị thuộc tính có thể kéo thả để sắp xếp lại một cách mượt mà và trực quan.
* Thứ tự sắp xếp được lưu trữ ổn định trên database Convex, kiểm chứng bằng cách tải lại trang (F5) danh sách vẫn giữ nguyên thứ tự đã kéo thả.
* Không có lỗi TypeScript (`bunx tsc --noEmit` trả về mã 0).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Kéo thả trên các trình duyệt mobile hoặc màn hình cảm ứng có thể bị xung đột hoặc khó thao tác nếu activationConstraint không được cấu hình tốt.
* **Biện pháp:** Sử dụng PointerSensor với `activationConstraint: { distance: 8 }` như pattern chuẩn của dự án để đảm bảo click chuột bình thường và scroll trên mobile không bị giật lag hoặc kéo nhầm.
* **Hoàn tác:** Khôi phục file edit page và backend từ Git nếu có sự cố nghiêm trọng xảy ra.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi giao diện các phần khác của trang chỉnh sửa Nhóm thuộc tính (như trường Tên, Mã, Kiểu lọc, Icon picker...) ngoài phần quản lý Giá trị thuộc tính.
* Tạo thêm màn hình chỉnh sửa chi tiết (Edit modal) cho từng term riêng biệt vì yêu cầu chỉ tập trung vào việc bỏ số thứ tự hiển thị/thêm mới và tích hợp kéo thả sắp xếp lại.
