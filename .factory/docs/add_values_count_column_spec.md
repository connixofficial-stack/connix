# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng xem danh sách bộ lọc ở trang quản trị, họ muốn biết ngay lập tức mỗi bộ lọc (ví dụ: "Phần mềm", "Công cụ") đang chứa bao nhiêu lựa chọn con bên trong (ví dụ: bộ lọc "Phần mềm" có 5 phần mềm con). Để làm điều đó, ta sẽ nâng cấp API backend trả về thêm số lượng lựa chọn con và sửa giao diện hiển thị thêm một cột mới có tên là "Số lượng giá trị".

## 2. Elaboration & Self-Explanation
Yêu cầu cốt lõi là bổ sung thông tin số lượng giá trị con (valuesCount) vào danh sách bộ lọc Khóa học và Tài nguyên.
- **Backend (Convex):** Cập nhật query `listAll` trong cả `resourceFilters.ts` và `courseFilters.ts`. Query này sẽ lấy ra các bộ lọc, sau đó với mỗi bộ lọc, nó đếm số lượng bản ghi con tương ứng từ bảng giá trị (`resourceFilterValues`/`courseFilterValues`). Để tránh vấn đề hiệu năng N+1 (gọi tuần tự cho từng bộ lọc làm tăng độ trễ), ta dùng `Promise.all` để chạy song song các truy vấn đếm.
- **Frontend (Next.js):** Cập nhật trang danh sách bộ lọc `/admin/resources/filters` và `/admin/courses/filters`. Thêm cột "Số lượng giá trị" vào Table Header và hiển thị số lượng con dưới dạng Badge hoặc số đếm tinh gọn ở từng dòng.

## 3. Concrete Examples & Analogies
Tương tự như việc bạn đi mua sắm ở siêu thị: thay vì chỉ nhìn thấy tên các quầy hàng (ví dụ: "Quầy rau củ", "Quầy hoa quả"), siêu thị treo thêm một tấm biển nhỏ ghi "Quầy rau củ (15 loại sản phẩm)", "Quầy hoa quả (8 loại sản phẩm)". Điều này giúp bạn nắm bắt nhanh quy mô của từng quầy mà không cần đi vào tận bên trong để đếm.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp API backend:**
  - `convex/resourceFilters.ts`: Có query `listAll` đang trả về mảng các `filterDoc` không có thuộc tính đếm.
  - `convex/courseFilters.ts`: Có query `listAll` đang trả về mảng các `filterDoc` tương tự.
  - Các bảng giá trị tương ứng `resourceFilterValues` và `courseFilterValues` đều có chỉ mục `by_filter` trên trường `filterId` để truy vấn cực nhanh.
- **Tệp Giao diện frontend:**
  - `app/admin/resources/filters/page.tsx`: Component hiển thị bảng bộ lọc tài nguyên.
  - `app/admin/courses/filters/page.tsx`: Component hiển thị bảng bộ lọc khóa học.
  - Hiện tại bảng chỉ hiển thị 4 cột: Chọn, Tên bộ lọc, Slug, Trạng thái, và Hành động.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Đây là một yêu cầu tính năng mới (Feature Request) để cải thiện UX quản trị viên chứ không phải sửa lỗi, nên không có lỗi gốc (Root Cause).
- **Giả thuyết đối chứng:** Nếu thực hiện việc đếm ở phía Frontend (fetch tất cả các giá trị của toàn bộ bộ lọc về rồi gom nhóm ở client), điều này sẽ gây lãng phí băng thông DB nghiêm trọng vì số lượng giá trị lọc có thể rất lớn. Do đó, việc đếm ở phía Backend (DB query) bằng cách gom nhóm hoặc query song song `Promise.all` kết hợp giới hạn `limit` là giải pháp tối ưu nhất.

# IV. Proposal (Đề xuất)
1. **Định nghĩa kiểu dữ liệu mới:** Trong `convex/resourceFilters.ts` và `convex/courseFilters.ts`, khai báo thêm Schema `filterWithCountDoc` kế thừa các trường cũ và bổ sung `valuesCount: v.number()`.
2. **Cập nhật Query backend:** Sửa đổi query `listAll` sử dụng `Promise.all` để đếm số lượng giá trị con của từng bộ lọc song song và trả về đúng schema mới.
3. **Cập nhật Frontend:**
   - Thêm cột `<TableHead>` và `<TableCell>` cho "Số lượng giá trị".
   - Cho phép sắp xếp (Sortable) theo cột số lượng này bằng cách khai báo `sortKey="valuesCount"`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [resourceFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resourceFilters.ts)
  - Vai trò hiện tại: Cung cấp API quản lý bộ lọc tài nguyên.
  - Thay đổi: Cập nhật kiểu trả về của query `listAll` và logic handler để đếm số lượng giá trị lọc con.
- `Sửa:` [courseFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courseFilters.ts)
  - Vai trò hiện tại: Cung cấp API quản lý bộ lọc khóa học.
  - Thay đổi: Cập nhật kiểu trả về của query `listAll` tương tự bên tài nguyên.
- `Sửa:` [app/admin/resources/filters/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/filters/page.tsx)
  - Vai trò hiện tại: Trang quản trị danh sách bộ lọc tài nguyên.
  - Thay đổi: Thêm cột hiển thị số lượng giá trị bộ lọc trên bảng.
- `Sửa:` [app/admin/courses/filters/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/page.tsx)
  - Vai trò hiện tại: Trang quản trị danh sách bộ lọc khóa học.
  - Thay đổi: Thêm cột hiển thị số lượng giá trị bộ lọc trên bảng tương tự.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật `convex/resourceFilters.ts` để thêm `filterWithCountDoc` và tích hợp đếm vào `listAll`.
2. Cập nhật `convex/courseFilters.ts` tương tự.
3. Sửa `app/admin/resources/filters/page.tsx` để hiển thị cột "Số lượng giá trị" sau cột "Slug".
4. Sửa `app/admin/courses/filters/page.tsx` tương tự.
5. Chạy typecheck `bunx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch:** Chạy `bunx tsc --noEmit` để đảm bảo code Next.js biên dịch thành công mà không gặp lỗi TypeScript mismatch với Convex API.
- **Kiểm tra trực quan (Manual Verification):** Mở trang quản trị `/admin/courses/filters` và `/admin/resources/filters` để xác nhận cột mới hiển thị đúng số lượng thực tế của các giá trị con bên trong mỗi bộ lọc.

# VIII. Todo
- [ ] Cập nhật query `listAll` trong [resourceFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/resourceFilters.ts)
- [ ] Cập nhật query `listAll` trong [courseFilters.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/courseFilters.ts)
- [ ] Cập nhật bảng hiển thị trong [app/admin/resources/filters/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/resources/filters/page.tsx)
- [ ] Cập nhật bảng hiển thị trong [app/admin/courses/filters/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/courses/filters/page.tsx)
- [ ] Kiểm tra kiểu dữ liệu tĩnh (`bunx tsc --noEmit`)
- [ ] Phát âm báo hoàn thành "Done, Sir."

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cột "Số lượng giá trị" xuất hiện chính xác trên UI của cả hai trang danh sách bộ lọc.
- Số lượng đếm hiển thị đúng số bản ghi con trong bảng `FilterValues` liên quan đến `Filter`.
- Người dùng có thể click sắp xếp (sort) theo cột này bình thường.
- Không phát sinh thêm lỗi build/typecheck.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Hiệu năng giảm nhẹ do thêm truy vấn đếm.
- **Giảm thiểu:** Đã dùng `Promise.all` để truy vấn song song và sử dụng chỉ mục Index `by_filter` đã được tối ưu sẵn của Convex.
- **Rollback:** `git checkout -- <file>` để quay lại phiên bản trước đó.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các logic thêm/xóa/sửa bộ lọc hoặc giá trị bộ lọc.
- Không sửa đổi schema DB (không tạo bảng mới).
