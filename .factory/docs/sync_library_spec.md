# I. Primer

## 1. TL;DR kiểu Feynman
* Chúng ta cần chuyển toàn bộ dữ liệu "Thư viện" (bao gồm thông tin văn bản và tệp hình ảnh thực tế) từ website cũ sang dự án mới.
* Để làm việc này, ta sẽ gọi API của database cũ để lấy dữ liệu dạng text và liên kết tải ảnh.
* Tải toàn bộ ảnh đó về máy tính, sau đó upload ngược lên storage của database mới để lấy mã lưu trữ mới.
* Cuối cùng, tạo một danh mục mới ("Thư viện") ở dự án mới, lưu tất cả thông tin kèm theo ảnh mới vào database mới.
* Bổ sung: Lấy danh sách phần mềm cũ từ nguồn, tạo thành các giá trị bộ lọc phần mềm mới dưới nhóm bộ lọc có sẵn, sau đó liên kết từng tài nguyên với phần mềm tương ứng.

## 2. Elaboration & Self-Explanation
Chúng ta có hai dự án Convex: dự án nguồn chứa dữ liệu thư viện hiện tại, và dự án đích là dự án chúng ta đang phát triển. Do tài khoản Convex CLI hiện tại không có quyền truy cập trực tiếp vào backend cloud của dự án nguồn thông qua CLI, chúng ta sẽ vượt qua giới hạn này bằng cách sử dụng HTTP API của Convex để đọc dữ liệu công khai từ xa.
Quy trình đồng bộ phần mềm sẽ gồm:
1. Fetch danh sách phần mềm nguồn từ bảng `library_softwares` của dự án nguồn.
2. Với mỗi phần mềm, tạo giá trị bộ lọc tương ứng trong bảng `resourceFilterValues` của dự án đích dưới nhóm bộ lọc phần mềm có ID `xx730dq6ckwj36b8c8tc26075n880yy4` (nếu chưa tồn tại).
3. Lấy các liên kết mapping giữa resource nguồn và phần mềm nguồn từ bảng `library_resource_softwares`.
4. Tìm resource tương ứng ở dự án đích và giá trị bộ lọc phần mềm tương ứng ở dự án đích.
5. Gọi mutation `resources:update` của dự án đích để cập nhật trường `filterValueIds` cho từng tài nguyên đích, giúp tự động gán các liên kết phần mềm này.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn đang chuyển nhà từ căn hộ A sang căn hộ B:
* Các tài nguyên giống như các cuốn sách. Các phần mềm giống như các kệ sách (hoặc nhãn dán).
* Ở nhà mới, bạn đã dựng sẵn một tủ sách lớn (nhóm bộ lọc phần mềm ID: `xx730dq6ckwj36b8c8tc26075n880yy4`).
* Bây giờ, bạn cần làm các nhãn ngăn sách tương ứng (Blender, After Effects, 3ds Max...) và dán vào tủ sách này.
* Sau đó, với mỗi cuốn sách đã mang sang nhà mới, bạn sẽ dán nhãn ngăn sách thích hợp cho nó dựa theo cách sắp xếp cũ ở căn hộ A.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra Convex URL của dự án nguồn: `https://coordinated-quail-189.convex.cloud`.
* Đã kiểm tra Convex URL của dự án đích: `https://tidy-fox-725.convex.cloud`.
* Xác định nhóm bộ lọc phần mềm đích có ID: `xx730dq6ckwj36b8c8tc26075n880yy4`.
* Bảng nguồn chứa phần mềm: `library_softwares`. Bảng nguồn chứa liên kết: `library_resource_softwares`.
* Cả hai bảng này đều có thể truy xuất qua HTTP API tương tự như phần resource.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* Không áp dụng vì đây là tính năng migration dữ liệu chứ không phải sửa lỗi bug. Độ tin cậy phương án lấy dữ liệu qua HTTP API: High.

# IV. Proposal (Đề xuất)
Viết một script Node.js chạy một lần tại thư mục `scratch/sync_softwares.js` thực hiện:
* Bước 1: Fetch danh sách phần mềm nguồn từ `library:listSoftwares` ở dự án nguồn.
* Bước 2: Lấy các giá trị bộ lọc phần mềm hiện tại ở dự án đích qua query `resourceFilters:listValuesByFilter` với `filterId` là `xx730dq6ckwj36b8c8tc26075n880yy4`.
* Bước 3: So sánh và tạo mới các phần mềm còn thiếu vào bảng `resourceFilterValues` qua mutation `resourceFilters:createValue`. Tạo bảng map ID phần mềm nguồn -> ID bộ lọc đích.
* Bước 4: Lặp qua từng tài nguyên đích hiện tại để lấy slug. Với mỗi tài nguyên nguồn tương ứng, fetch các phần mềm được gán qua query `library:listResourceSoftwares`.
* Bước 5: Chuyển đổi ID phần mềm nguồn sang ID bộ lọc đích, sau đó gọi mutation `resources:update` của dự án đích để gán mảng `filterValueIds` cho tài nguyên đích đó.

# V. Files Impacted (Tệp bị ảnh hưởng)
* [NEW] [sync_softwares.js](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/scratch/sync_softwares.js): Script đồng bộ bộ lọc phần mềm và gán liên kết. Sẽ được xóa sau khi chạy xong.

# VI. Execution Preview (Xem trước thực thi)
1. Tạo file script `scratch/sync_softwares.js`.
2. Chạy lệnh `node scratch/sync_softwares.js`.
3. Kiểm tra log để xem quá trình đồng bộ phần mềm và gán liên kết phần mềm cho từng tài nguyên.
4. Xác minh dữ liệu bộ lọc tại trang edit của bộ lọc đích.
5. Dọn dẹp thư mục `scratch/`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* Thực thi query `resourceFilters:listValuesByFilter` cho filter `xx730dq6ckwj36b8c8tc26075n880yy4` để xem danh sách phần mềm đích.
* Truy cập `http://localhost:3000/admin/resources` và edit một số tài nguyên để kiểm tra phần mềm đã được check chọn đúng chưa.

# VIII. Todo
- [ ] Viết script `scratch/sync_softwares.js`.
- [ ] Chạy script `scratch/sync_softwares.js` để đồng bộ bộ lọc phần mềm và liên kết.
- [ ] Dọn dẹp các tệp tạm thời trong thư mục `scratch/`.
- [ ] Phát âm báo hoàn thành tác vụ.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Toàn bộ phần mềm liên quan từ dohystudio.com được đồng bộ sang dự án hiện tại dưới dạng các giá trị của nhóm bộ lọc phần mềm `xx730dq6ckwj36b8c8tc26075n880yy4`.
* Các tài nguyên đích đã được gán liên kết phần mềm chính xác như cấu hình ở dự án nguồn.
* Workspace sạch sẽ, không để lại file rác ở thư mục gốc.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Rủi ro: Trùng lặp dữ liệu filter values nếu chạy lại. Giải pháp: Script sẽ check slug của filter value trước khi tạo mới để đảm bảo tính idempotent.
