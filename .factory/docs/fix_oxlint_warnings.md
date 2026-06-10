# I. Primer

## 1. TL;DR kiểu Feynman
* Công cụ `oxlint` quét mã nguồn dự án và phát hiện ra 6 cảnh báo (warnings) liên quan đến các biến hoặc tham số được khai báo nhưng không bao giờ sử dụng (`no-unused-vars`).
* Có 3 file chứa các cảnh báo này trong các component hiển thị lưới sản phẩm (`ProductGridSection`, `ProductGridForm`, `ProductGridPreview`).
* Hướng xử lý: Xóa bỏ các khai báo biến thừa và loại bỏ các tham số không sử dụng trong destructuring của React props.
* Sau khi xóa, chạy lại `oxlint` để đảm bảo hệ thống hoàn toàn sạch lỗi và cảnh báo.

## 2. Elaboration & Self-Explanation
Trong quá trình phát triển mã nguồn, đôi khi chúng ta khai báo biến hoặc tham số (props) để phục vụ cho một tính năng, nhưng sau đó cấu trúc code thay đổi (refactor) khiến các biến này không còn được dùng tới. Trình linter `oxlint` sẽ phát hiện ra các biến "mồ côi" này và cảnh báo.
Việc loại bỏ các biến và tham số thừa giúp:
* Làm sạch mã nguồn, dễ đọc, tránh gây hiểu lầm cho lập trình viên khác rằng biến đó vẫn còn tác dụng.
* Tránh rác bộ nhớ (mặc dù rất nhỏ) và tối ưu hóa quá trình biên dịch (bundle size).
* Vượt qua các bước kiểm tra tự động (CI/CD, Git Hooks) một cách trơn tru.

Chúng ta sẽ lần lượt mở từng file bị báo cảnh báo, xác định chính xác các dòng khai báo biến/tham số không dùng, xóa bỏ chúng và lưu lại.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như việc bạn dọn dẹp nhà bếp. Bạn chuẩn bị sẵn một cái thớt và một cái dao (khai báo biến) nhưng cuối cùng chỉ dùng dao để cắt bánh mà không đụng tới cái thớt. Cái thớt để không trên bàn bếp chỉ làm chật chỗ (biến thừa). Việc cất chiếc thớt thừa đi giúp bàn bếp sạch sẽ hơn.
* **Ví dụ trong code**:
  * Trước khi sửa:
    ```typescript
    const brandTabStyle = { backgroundColor: '#ffffff' }; // Khai báo nhưng không dùng ở dưới
    return <div className="tabs">Tab Content</div>;
    ```
  * Sau khi sửa:
    ```typescript
    // Xóa brandTabStyle
    return <div className="tabs">Tab Content</div>;
    ```

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã chạy lệnh kiểm tra tĩnh: `bunx oxlint --type-aware --type-check --fix`.
* Kết quả: Phát hiện 6 cảnh báo linter về biến và tham số chưa được sử dụng (`no-unused-vars`). Cụ thể:
  1. `components/site/ProductGridSection.tsx:L718` - Biến `brandTabStyle` không dùng.
  2. `components/site/ProductGridSection.tsx:L722` - Biến `brandTabActiveShadow` không dùng.
  3. `app/admin/home-components/product-grid/_components/ProductGridForm.tsx:L43` - Tham số prop `itemCount` trong destructuring không dùng.
  4. `app/admin/home-components/product-grid/_components/ProductGridPreview.tsx:L31` - Tham số prop `desktopRows` trong destructuring không dùng.
  5. `app/admin/home-components/product-grid/_components/ProductGridPreview.tsx:L159` - Biến `brandTabStyle` không dùng.
  6. `app/admin/home-components/product-grid/_components/ProductGridPreview.tsx:L163` - Biến `brandTabActiveShadow` không dùng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: Do quá trình refactor hoặc sao chép mã nguồn từ các component cũ sang component mới. Các biến (`brandTabStyle`, `brandTabActiveShadow`) và các props (`itemCount`, `desktopRows`) trước đó được dự định dùng cho việc tùy biến giao diện tab hoặc điều chỉnh lưới, nhưng thiết kế cuối cùng đã chuyển sang dùng các helper khác (như `CategoryTabSlider` hoặc dùng trực tiếp tính toán grid từ CSS/itemCount) khiến chúng bị bỏ quên.
* **Độ tin cậy của nguyên nhân (Root Cause Confidence)**: **High (Cao)**. Mã nguồn hiện tại thực sự không tham chiếu đến các biến này, việc xóa đi hoàn toàn không làm thay đổi logic hoạt động hay hiển thị của giao diện.

# IV. Proposal (Đề xuất)
* Thực hiện chỉnh sửa mã nguồn để xóa bỏ các khai báo biến thừa và tham số thừa đã liệt kê ở phần Audit.
* Không thêm bất kỳ logic nghiệp vụ (business logic) mới nào.
* Giữ nguyên các định nghĩa kiểu dữ liệu (TypeScript type/interface) nếu chúng còn cần thiết cho việc tương thích API bên ngoài, chỉ xóa biến thực tế trong code thực thi của component.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProductGridSection.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ProductGridSection.tsx)
  * Vai trò hiện tại: Component hiển thị danh sách sản phẩm theo dạng lưới ngoài trang chủ (Client-facing).
  * Thay đổi: Xóa bỏ 2 biến không sử dụng là `brandTabStyle` (dòng 718) và `brandTabActiveShadow` (dòng 722).
* **Sửa:** [ProductGridForm.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridForm.tsx)
  * Vai trò hiện tại: Form cấu hình component lưới sản phẩm trong trang quản trị admin.
  * Thay đổi: Loại bỏ `itemCount` khỏi phần destructuring các tham số đầu vào của component `ProductGridForm` (dòng 43).
* **Sửa:** [ProductGridPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-grid/_components/ProductGridPreview.tsx)
  * Vai trò hiện tại: Component xem trước (preview) lưới sản phẩm trong trang quản trị admin.
  * Thay đổi: Loại bỏ `desktopRows` khỏi phần destructuring tham số đầu vào (dòng 31) và xóa 2 biến không sử dụng `brandTabStyle` (dòng 159), `brandTabActiveShadow` (dòng 163).

# VI. Execution Preview (Xem trước thực thi)
1. Tiến hành sửa file `ProductGridSection.tsx`: định vị dòng 718-723 và xóa bỏ khai báo biến.
2. Tiến hành sửa file `ProductGridForm.tsx`: định vị dòng 43 và xóa `itemCount,`.
3. Tiến hành sửa file `ProductGridPreview.tsx`: định vị dòng 31 và xóa `desktopRows = 2,`, định vị dòng 159-163 và xóa khai báo.
4. Chạy lại `bunx oxlint --type-aware --type-check --fix` để xác nhận toàn bộ lỗi/cảnh báo linter đã được giải quyết sạch sẽ.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh (Static Check)**:
  * Chạy lệnh `bunx oxlint --type-aware --type-check` trên toàn bộ dự án.
  * Kết quả mong đợi: `Found 0 warnings and 0 errors.` hoặc không còn bất kỳ cảnh báo nào liên quan đến 3 file trên.
  * Chạy `bunx tsc --noEmit` để đảm bảo việc thay đổi destructuring props không làm gãy type-check của TypeScript.

# VIII. Todo
* [ ] Xóa khai báo biến unused `brandTabStyle` và `brandTabActiveShadow` trong `ProductGridSection.tsx`
* [ ] Xóa tham số unused `itemCount` trong destructuring của `ProductGridForm.tsx`
* [ ] Xóa tham số unused `desktopRows` trong destructuring của `ProductGridPreview.tsx`
* [ ] Xóa khai báo biến unused `brandTabStyle` và `brandTabActiveShadow` trong `ProductGridPreview.tsx`
* [ ] Chạy kiểm tra linter `oxlint` và type-check `tsc` để verify thành công

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Lệnh `bunx oxlint --type-aware --type-check` hoàn thành thành công và báo cáo `0 warnings and 0 errors` đối với các file được chỉnh sửa.
* Dự án biên dịch thành công, không gặp lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Hầu như bằng không vì đây chỉ là dọn dẹp các biến/tham số chết.
* **Hoàn tác**: Sử dụng `git checkout -- <file>` để phục hồi trạng thái cũ nếu cần.

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi logic hiển thị, giao diện hay các tính năng khác của các component trên.
* Không refactor hoặc tối ưu hóa hiệu năng sâu cho các component.
