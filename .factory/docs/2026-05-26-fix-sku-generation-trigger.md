# I. Primer

## 1. TL;DR kiểu Feynman
- Hiện tại, khi bạn gõ tên sản phẩm, hệ thống tự động gọi hàm sinh mã SKU (mặc dù chưa chọn danh mục). Điều này làm SKU bị sinh sớm và sai quy tắc.
- Giải pháp: Chỉ kích hoạt tính năng tự động sinh SKU khi người dùng đã chọn danh mục sản phẩm (Category). Nếu chưa chọn danh mục, trường SKU sẽ để trống.
- Đặc biệt, khi thay đổi danh mục (chọn nhầm rồi chọn lại hoặc sửa danh mục ở trang Edit), mã SKU sẽ tự động thay đổi tương ứng theo danh mục mới chọn để tránh bị sai lệch do ô SKU bị khóa không cho sửa tay.

## 2. Elaboration & Self-Explanation
Mã SKU trong hệ thống được thiết kế để sinh tự động dựa trên tên danh mục sản phẩm (Category Name) làm tiền tố (prefix), kết hợp số thứ tự tăng dần. 
Tuy nhiên, trong code frontend hiện tại (cả ở trang Tạo mới và Sửa sản phẩm), câu truy vấn `generateSmartSku` được kích hoạt ngay khi người dùng điền tên sản phẩm (`name.trim() ? ... : 'skip'`). 
Điều này dẫn đến việc khi chưa chọn danh mục, hệ thống vẫn cố gắng sinh SKU bằng cách lấy tên sản phẩm làm tiền tố, tạo ra các SKU không chuẩn.
Bằng cách thay đổi điều kiện kích hoạt query từ "khi có tên sản phẩm" thành "khi có danh mục sản phẩm" (`categoryId ? ... : 'skip'`), chúng ta đảm bảo SKU chỉ được tính toán và tự động điền khi đã xác định được danh mục của sản phẩm.

Ngoài ra, do ô nhập SKU trên giao diện bị khóa (`disabled={true}`), người dùng không thể tự chỉnh sửa mã SKU bằng tay. Nếu người dùng chọn nhầm danh mục rồi chọn lại, hoặc thay đổi danh mục ở trang Chỉnh sửa (Edit), hệ thống cần tự động đồng bộ mã SKU mới theo danh mục mới để tránh lưu dữ liệu bị sai lệch. 
- Ở trang Create: Đồng bộ trực tiếp `sku` theo `generatedSku`.
- Ở trang Edit: 
  - Nếu `categoryId` trùng với danh mục gốc của sản phẩm (`productData.categoryId`), khôi phục SKU gốc của sản phẩm (`productData.sku`).
  - Nếu `categoryId` thay đổi sang danh mục khác, tự động cập nhật `sku` theo `generatedSku` mới sinh của danh mục đó.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - *Tạo mới*: Bạn chọn danh mục "Điện thoại di động", SKU sinh ra là `DTDD-0001`. Bạn phát hiện chọn nhầm và đổi sang danh mục "Laptop", SKU tự động đổi sang `LT-0001`.
  - *Chỉnh sửa*: Sản phẩm ban đầu có danh mục "Điện thoại di động" và SKU `DTDD-0001`. Bạn đổi danh mục sang "Laptop", SKU tự động đổi sang `LT-0002`. Bạn đổi lại danh mục cũ "Điện thoại di động", SKU khôi phục về `DTDD-0001`.
- **Phép so sánh đời thường**: Việc này giống như việc chuyển hộ khẩu. Khi bạn chuyển từ tỉnh A sang tỉnh B, mã vùng trên căn cước/giấy tờ hộ khẩu của bạn bắt buộc phải tự động thay đổi theo tỉnh mới để đảm bảo tính chính xác, không thể giữ nguyên mã vùng tỉnh cũ được.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng: Điền tên sản phẩm ở trang `/admin/products/create` và `/admin/products/[id]/edit` kích hoạt sinh tự động SKU khi chưa có danh mục. Khi đổi danh mục, SKU không tự động đổi theo ở trang Edit.
- File cấu phần liên quan:
  - [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  - [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**:
  1. Query `generateSmartSku` sử dụng điều kiện `name.trim() ? ... : 'skip'` nên chạy ngay khi gõ tên sản phẩm mà không cần danh mục.
  2. Ở trang Edit, logic đồng bộ `sku` từ `generatedSku` chỉ chạy khi `!sku.trim()`, do đó khi `sku` đã có giá trị ban đầu thì việc thay đổi danh mục không làm thay đổi `sku`.
- **Giả thuyết đối chứng**:
  1. Đổi điều kiện query thành `categoryId ? ... : 'skip'` sẽ chặn việc tự sinh SKU sớm khi chưa chọn danh mục.
  2. Sử dụng `useEffect` kiểm tra sự thay đổi của `categoryId` so với `productData.categoryId` để quyết định khôi phục SKU gốc hay cập nhật theo `generatedSku` mới.

# IV. Proposal (Đề xuất)
- Đổi cách gọi query `generatedSku` ở cả `create/page.tsx` và `[id]/edit/page.tsx`:
  ```typescript
  const generatedSku = useQuery(
    api.productsSmart.generateSmartSku,
    categoryId
      ? { name: name.trim() || 'Product', categoryId: categoryId as Id<"productCategories"> }
      : 'skip'
  );
  ```
- Cập nhật logic `useEffect` đồng bộ SKU:
  - Ở `create/page.tsx`:
    ```typescript
    useEffect(() => {
      setSku(generatedSku || '');
    }, [generatedSku]);
    ```
  - Ở `[id]/edit/page.tsx`:
    ```typescript
    useEffect(() => {
      if (!isDataLoaded || !productData) return;
      
      if (categoryId === productData.categoryId) {
        setSku(productData.sku);
      } else {
        setSku(generatedSku || '');
      }
    }, [categoryId, generatedSku, productData, isDataLoaded]);
    ```

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [app/admin/products/create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx): Thay đổi điều kiện gọi `generateSmartSku` và đơn giản hóa logic `useEffect` để luôn đồng bộ SKU theo `generatedSku`.
- **Sửa**: [app/admin/products/[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx): Thay đổi điều kiện gọi `generateSmartSku` và thêm logic `useEffect` tự động cập nhật SKU khi đổi danh mục hoặc khôi phục SKU gốc khi chọn lại danh mục cũ.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ hai file frontend để xác định chính xác dòng code cần thay đổi.
2. Áp dụng thay đổi sử dụng công cụ `replace_file_content`.
3. Kiểm tra tính đúng đắn của TypeScript bằng lệnh `bunx tsc --noEmit` trước khi commit.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Thực hiện kiểm tra TypeScript typecheck qua CLI.
- Xác nhận các hành vi trên môi trường thực tế (do Tester/User thực hiện):
  - Khi tạo sản phẩm mới: Gõ tên sản phẩm -> SKU không đổi. Chọn danh mục A -> SKU tự sinh theo A. Đổi sang danh mục B -> SKU tự sinh theo B. Xóa danh mục -> SKU trống.
  - Khi sửa sản phẩm: Thay đổi danh mục sang danh mục mới -> SKU tự đổi theo danh mục mới. Thay đổi danh mục về danh mục ban đầu -> SKU tự khôi phục về SKU gốc của sản phẩm.

# VIII. Todo
- [ ] Chỉnh sửa logic `generatedSku` và `useEffect` đồng bộ SKU trong `app/admin/products/create/page.tsx`.
- [ ] Chỉnh sửa logic `generatedSku` và `useEffect` đồng bộ SKU trong `app/admin/products/[id]/edit/page.tsx`.
- [ ] Chạy `bunx tsc --noEmit` để đảm bảo không lỗi biên dịch.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Điền tên sản phẩm khi danh mục trống -> không có SKU nào tự động sinh ra.
- Chọn danh mục -> SKU được tự động điền vào trường SKU.
- Đổi danh mục -> SKU tự động thay đổi theo danh mục mới ở cả trang tạo mới và trang sửa sản phẩm.
- Đổi danh mục về lại danh mục ban đầu (khi sửa) -> SKU khôi phục về SKU ban đầu của sản phẩm.
- Code không gây lỗi biên dịch TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: Chỉ thay đổi điều kiện kích hoạt query sinh SKU tự động ở phía client.
- Cách hoàn tác: Khôi phục lại điều kiện cũ bằng Git checkout.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi thuật toán sinh SKU ở phía Convex Backend (`convex/productsSmart.ts`).
