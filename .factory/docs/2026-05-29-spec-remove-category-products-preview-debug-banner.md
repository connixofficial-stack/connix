# Spec: Loại bỏ Banner DEBUG config trong Preview Category Products

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Trong trang chỉnh sửa thành phần "Sản phẩm theo danh mục" (Category Products) ở trang quản trị Admin, có một thanh màu đỏ nổi bật hiển thị văn bản `DEBUG config: {...}` gây mất thẩm mỹ và không cần thiết cho người dùng cuối.
* **Nguyên nhân**: Một đoạn mã HTML debug tạm thời (`<div className="bg-red-500 ...">DEBUG config: ...</div>`) đã được thêm vào file `CategoryProductsPreview.tsx` trong một đợt phát triển trước đó để kiểm tra các cấu hình nút và chưa được gỡ bỏ.
* **Cách giải quyết**: Xóa bỏ hoàn toàn thẻ `div` debug này khỏi mã nguồn của component preview.
* **Mục tiêu**: Khôi phục giao diện preview sạch sẽ, trực quan cho quản trị viên mà không ảnh hưởng đến bất kỳ logic hoạt động thực tế nào của component.

## 2. Elaboration & Self-Explanation
Thành phần `CategoryProductsPreview` đóng vai trò hiển thị trước (preview) cách mà các sản phẩm theo từng danh mục sẽ xuất hiện trên trang chủ của khách hàng dựa trên các cấu hình như: có hiển thị nút "Thêm vào giỏ" không (`showAddToCartButton`), có hiển thị nút "Mua ngay" không (`showBuyNowButton`), và cách bố trí các nút này như thế nào (`cartButtonsLayout`).
Trong quá trình phát triển các tính năng cấu hình nút này, lập trình viên đã chèn một banner màu đỏ hiển thị trực tiếp giá trị của các thuộc tính cấu hình này lên đầu khung preview để dễ dàng quan sát xem state thay đổi thế nào khi điều chỉnh cấu hình bên cột trái. Tuy nhiên, banner này là phần dư thừa của quá trình phát triển (development artifact) và cần phải được xóa bỏ trước khi đưa lên production để đảm bảo giao diện quản trị Admin chuyên nghiệp và phản ánh đúng 100% giao diện thực tế sẽ hiển thị trên trang chủ của khách hàng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi bạn đi mua một bộ quần áo được may đo sẵn, người thợ may thường dùng phấn may để đánh dấu các đường cắt hoặc đường may tạm thời. Trước khi giao bộ quần áo cho khách hàng, người thợ may phải giặt sạch các vết phấn đó. Banner debug màu đỏ ở đây giống như vết phấn may còn sót lại trên bộ quần áo hoàn chỉnh.
* **Ví dụ trong code**:
  * *Trước khi sửa*:
    ```tsx
    <BrowserFrame>
      <div className="bg-red-500 text-white p-2 text-xs font-mono select-all">
        DEBUG config: {JSON.stringify({...})}
      </div>
      {previewStyle === 'grid' && renderGridStyle()}
      ...
    </BrowserFrame>
    ```
  * *Sau khi sửa*:
    ```tsx
    <BrowserFrame>
      {previewStyle === 'grid' && renderGridStyle()}
      ...
    </BrowserFrame>
    ```

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng quan sát**: Trang quản trị tại endpoint `/admin/home-components/category-products/[id]/edit` hiển thị thanh đỏ debug config `{"showAddToCartButton":true,"showBuyNowButton":true,"cartButtonsLayout":"grid-2"}` ngay phía trên tiêu đề danh mục sản phẩm trong khung Preview.
* **Phạm vi ảnh hưởng**: Trang chỉnh sửa Category Products Component trong Admin. Không ảnh hưởng đến trang public của khách hàng (vì đây là file preview của admin panel).
* **Tần suất tái hiện**: 100% khi truy cập trang chỉnh sửa.
* **Thay đổi gần nhất**: Một spec gần đây liên quan đến việc cấu hình các nút trong Preview của Category Products đã thêm đoạn code debug này vào file [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Nguyên nhân gốc**: File [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx) tại dòng 1133 - 1139 chứa đoạn code hiển thị debug UI:
  ```tsx
  <div className="bg-red-500 text-white p-2 text-xs font-mono select-all">
    DEBUG config: {JSON.stringify({ 
      showAddToCartButton: config.showAddToCartButton, 
      showBuyNowButton: config.showBuyNowButton,
      cartButtonsLayout: config.cartButtonsLayout
    })}
  </div>
  ```
* **Độ tin cậy nguyên nhân gốc**: High (100% chắc chắn vì thẻ div này in chính xác chuỗi text và cấu trúc CSS màu đỏ được chỉ ra trong ảnh chụp lỗi).
* **Giả thuyết đối chứng**: Có thể đây là tính năng hữu ích cho admin? Không, text bắt đầu bằng chữ `DEBUG config` và định dạng thô dạng JSON thô không bao giờ là một phần của trải nghiệm người dùng cuối chuyên nghiệp (UX Design Guardrails).

# IV. Proposal (Đề xuất)
* Loại bỏ thẻ `div` debug config chứa class `bg-red-500 text-white p-2 text-xs font-mono select-all` nằm trong thành phần `BrowserFrame` của file [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)
  * Vai trò hiện tại: Render giao diện xem trước (preview) của component Category Products Home Component với nhiều layout khác nhau (grid, carousel, cards, bento, magazine, showcase, wine-grid) và các cấu hình thiết bị khác nhau.
  * Thay đổi: Xóa bỏ thẻ `div` debug ở dòng 1133 - 1139.

# VI. Execution Preview (Xem trước thực thi)
1. Xác định vị trí code debug trong [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).
2. Dùng công cụ code edit để thay thế đoạn code từ dòng 1133 đến dòng 1139 bằng khoảng trắng hoặc xóa hẳn để cấu trúc con trực tiếp của `BrowserFrame` bắt đầu bằng các logic layout preview.
3. Rà soát tĩnh để đảm bảo không lỗi cú pháp (Syntax Error) hay thẻ JSX bị mở/đóng sai.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Thực hiện kiểm tra tĩnh xem file [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx) sau khi sửa đổi có build lỗi hay không. Do quy tắc `AGENTS.md` tuyệt đối cấm tự chạy `npm run lint` hoặc `npm run build`, chúng ta sẽ tự review tĩnh kỹ lưỡng cấu trúc thẻ đóng/mở JSX và TypeScript types.
* **Xác nhận thủ công**: Người dùng kiểm tra trang preview trên trình duyệt tại `http://localhost:3000/admin/home-components/category-products/js7761c0thxnxjze1x0zhssnjx87j1jq/edit`, xác nhận thanh màu đỏ debug đã biến mất hoàn toàn và các layout preview hiển thị chuẩn xác.

# VIII. Todo
* [ ] Sửa [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx) loại bỏ debug banner.
* [ ] Kiểm tra tĩnh cấu trúc code.
* [ ] Phát âm thông báo hoàn thành task `Done, Sir.` qua SAPI.SpVoice.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Thẻ `div` chứa nội dung `DEBUG config: ...` không còn tồn tại trong file [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx).
* Khung preview hiển thị trực tiếp giao diện sản phẩm tương ứng với layout đang chọn mà không có banner đỏ ngăn cách ở đầu trang web giả lập.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Hầu như bằng 0 vì đây chỉ là việc xóa bỏ một thẻ HTML tĩnh phục vụ mục đích hiển thị debug thô, không đụng chạm đến state, event handler, hay backend hooks.
* **Hoàn tác**: Sử dụng `git checkout app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx` hoặc khôi phục thủ công đoạn JSX đã xóa nếu cần.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic tính toán cấu hình nút giỏ hàng.
* Sửa đổi giao diện trang site của khách hàng.
