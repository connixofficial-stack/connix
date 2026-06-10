Đã rõ đúng vấn đề bạn nói: hiện tại ở `app/admin/products/create/page.tsx` và `app/admin/products/[id]/edit/page.tsx` đang hard-code `VD: 100,000` nên nhìn như bị “set cứng”.

Kế hoạch implement (không mở rộng scope):

1. **Tạo formatter đơn giản ngay trong từng file**
   - Ở mỗi file `create` và `edit`, thêm hàm local dạng:
     - nhận `value: string`
     - `trim()`
     - nếu rỗng hoặc parse không hợp lệ thì trả `''`
     - nếu hợp lệ thì trả `new Intl.NumberFormat('en-US').format(parsedNumber)`
   - Mục tiêu đúng theo yêu cầu của bạn: `100000 -> 100,000`.

2. **Tính helper realtime cho 2 input giá**
   - Khai báo biến memo/local:
     - `const priceHelper = formatNumberHelper(price)`
     - `const salePriceHelper = formatNumberHelper(salePrice)`
   - Không đổi logic submit/validation hiện có.

3. **Thay helper text hard-code bằng helper động**
   - Ở block “Giá bán (VNĐ)” và “Giá so sánh (trước giảm)” của cả 2 trang:
     - bỏ `<p>VD: 100,000</p>`
     - render có điều kiện:
       - nếu `priceHelper` có giá trị thì hiện helper realtime (ví dụ `100,000`)
       - nếu rỗng thì không hiện gì (tránh cảm giác ví dụ cứng)
   - Giữ nguyên UX hiện tại ngoài phần helper text.

4. **Đảm bảo đồng nhất giữa create/edit**
   - Áp cùng pattern cho 2 file để hành vi giống nhau 100%.

5. **Verify**
   - Chạy đúng rule project: `bunx tsc --noEmit`.
   - Test tay 2 route:
     - `/admin/products/create`
     - `/admin/products/[id]/edit`
   - Case kiểm tra nhanh:
     - gõ `100000` -> helper hiện `100,000`
     - xóa input -> helper biến mất
     - nhập ký tự không hợp lệ -> helper không hiển thị

6. **Commit theo rule repo**
   - Commit sau khi pass typecheck.
   - Add đầy đủ file thay đổi + `.factory/docs` (nếu có thay đổi trong đó), không push.

Nếu bạn xác nhận spec này, mình sẽ implement ngay đúng như trên.