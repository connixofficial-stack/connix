# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn đi mua sắm trên một trang web, mỗi ô sản phẩm giống như một bức tranh lớn treo trên tường. Khi bạn click vào bất kỳ đâu trên bức tranh, bạn sẽ được dẫn vào phòng trưng bày chi tiết (trang chi tiết sản phẩm).
Trên bức tranh đó có đính kèm các nút nhỏ như "Thêm vào giỏ" và "Mua ngay". 
Khi bạn click vào các nút này, do lập trình viên quên chặn sự kiện click lại, trình duyệt sẽ hiểu là bạn đang click vào cả bức tranh lớn phía sau. Kết quả là trình duyệt tự động dẫn bạn sang phòng trưng bày chi tiết (chuyển hướng sang `/products/slug`), thay vì hiển thị bảng chọn kích cỡ (modal chọn size) ngay tại chỗ.
Giải pháp là chúng ta phải dán một lớp "chống tràn" (gọi là `event.stopPropagation()`) lên các nút bấm nhỏ đó, để khi click vào nút bấm, trình duyệt chỉ xử lý hành động của nút đó và dừng lại, không lan truyền lên bức tranh lớn phía sau nữa.

## 2. Elaboration & Self-Explanation
Trong React và HTML, sự kiện click chuột có tính chất lan truyền ngược từ dưới lên trên (gọi là Event Bubble Up).
Ở giao diện danh sách sản phẩm trên trang chủ:
- Các card sản phẩm được bọc bởi thẻ `Link` của Next.js để khi người dùng click vào card sản phẩm sẽ được chuyển hướng đến trang chi tiết sản phẩm (`/products/[category]/[slug]`).
- Các nút bấm "Thêm giỏ" và "Mua ngay" nằm bên trong cấu trúc thẻ `div` con của card sản phẩm. Khi người dùng click vào các nút bấm này, sự kiện click sẽ kích hoạt hàm handler `onAddToCart` hoặc `onBuyNow`.
- Tuy nhiên, do chúng ta chỉ gọi `event.preventDefault();` (ngăn hành vi mặc định của nút bấm) mà quên gọi `event.stopPropagation();` (chặn lan truyền sự kiện), sự kiện click tiếp tục bubble up lên thẻ `Link` cha ngoài cùng.
- Trình duyệt nhận được sự kiện click trên thẻ `Link` và lập tức chuyển hướng người dùng sang trang chi tiết sản phẩm. Do đó, người dùng thấy trang web bị nhảy trang thay vì mở modal chọn size ngay tại trang chủ.
Chúng ta cần cập nhật toàn bộ các hàm `onClick` của nút bấm trong `ProductCardActions.tsx` và `ProductCardComponents.tsx` để bổ sung thêm `event.stopPropagation();`.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Sản phẩm "Giày Nike Air Jordan 1 Low" ở trang chủ.
  - *Hiện tại*: Người dùng click nút "Thêm giỏ". Trình duyệt kích hoạt `onAddToCart` (chuẩn bị mở modal chọn size) nhưng đồng thời lan truyền click lên thẻ `Link` cha của card. Trình duyệt chuyển hướng ngay lập tức sang `/products/jordan/giay-nike-air-jordan-1-low`. Modal chưa kịp hiện thì trang đã bị tải lại sang trang mới.
  - *Đề xuất*: Người dùng click nút "Thêm giỏ". Hàm `onClick` gọi `event.stopPropagation();`. Sự kiện click bị chặn đứng tại nút bấm. Trình duyệt mở modal chọn size mượt mà ngay tại trang chủ, người dùng vẫn ở trang chủ.
- **Phép so sánh đời thường**: 
  Giống như bạn bấm chuông cửa của một căn hộ trong một tòa chung cư lớn. Nút chuông cửa của căn hộ đó (nút bấm) được đấu nối nhầm với chuông báo động tổng của cả tòa nhà (thẻ Link cha). Khi bạn bấm chuông căn hộ, cả tòa nhà đều báo động và bảo vệ chạy đến đuổi bạn đi (chuyển hướng trang). Việc thêm `event.stopPropagation()` giống như tách biệt hệ thống dây điện để khi bấm chuông căn hộ nào thì chỉ căn hộ đó phản hồi, không ảnh hưởng đến tòa nhà.

# II. Audit Summary (Tóm tắt kiểm tra)
- Trạng thái hiện tại: Sự kiện click nút bấm bị bubble up lên thẻ `Link` cha gây chuyển hướng trang.
- Các khu vực bị ảnh hưởng:
  1. `components/site/shared/ProductCardActions.tsx` (Nút bấm dùng chung trên trang chủ)
  2. `app/(site)/_components/products/ProductCardComponents.tsx` (Nút bấm trên trang danh sách sản phẩm và các view danh mục)

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Thiếu `event.stopPropagation();` trong sự kiện `onClick` của các thẻ `<button>` nằm trong cấu trúc DOM có thẻ `Link` cha.
- **Giả thuyết đối chứng**: Nếu ta không dùng thẻ `Link` bọc card sản phẩm nữa thì sao? -> Người dùng sẽ không thể click vào ảnh sản phẩm hoặc tên sản phẩm để xem chi tiết một cách tiện lợi. Do đó, việc giữ thẻ `Link` bọc ngoài và chặn lan truyền sự kiện tại nút bấm là giải pháp UX tối ưu và chuẩn mực nhất.

# IV. Proposal (Đề xuất)
Thêm `event.stopPropagation();` vào tất cả các `onClick` handler của nút bấm trong các file component frontend:
- Trong `ProductCardActions.tsx`:
  - Nút "Thêm giỏ":
    `onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product); }}`
  - Nút "Mua ngay":
    `onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBuyNow(product); }}`
- Trong `ProductCardComponents.tsx`:
  - Nút "Thêm giỏ" (dòng 79):
    `onClick={(event) => { event.preventDefault(); event.stopPropagation(); onAddToCart(product); }}`
  - Nút "Mua ngay" (dòng 93):
    `onClick={(event) => { event.preventDefault(); event.stopPropagation(); onBuyNow(product); }}`
  - Nút "Thêm giỏ" dạng list (dòng 583):
    `onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }}`
  - Nút "Mua ngay" dạng list (dòng 593):
    `onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuyNow(product); }}`

# V. Files Impacted (Tệp bị ảnh hưởng)

### Nhóm UI Components

#### [MODIFY] [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx)
- Vai trò hiện tại: Render các nút hành động "Thêm giỏ" và "Mua ngay" dùng chung trên trang chủ và các trang section.
- Sửa đổi: Thêm `event.stopPropagation();` vào các sự kiện `onClick` của các nút bấm.

#### [MODIFY] [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx)
- Vai trò hiện tại: Cung cấp các component hiển thị card sản phẩm và list sản phẩm.
- Sửa đổi: Thêm `event.stopPropagation();` / `e.stopPropagation();` vào các sự kiện `onClick` của các nút bấm.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh sửa `ProductCardActions.tsx`.
2. Chỉnh sửa `ProductCardComponents.tsx`.
3. Kiểm tra kiểu tĩnh với `bunx tsc --noEmit`.
4. Commit các thay đổi.
5. Phát âm báo và thông báo hoàn tất.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
- Chạy lệnh `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo code biên dịch sạch lỗi.

### Manual Verification
- Truy cập trang chủ `http://localhost:3000/`.
- Click trực tiếp vào chữ hoặc nút "Thêm giỏ" của sản phẩm có variants: Modal chọn size phải hiển thị ngay tại trang chủ, trang không bị chuyển hướng.
- Click vào ảnh hoặc tên sản phẩm: Trang phải chuyển hướng sang trang chi tiết sản phẩm bình thường.

# VIII. Todo
- [ ] Cập nhật `onClick` trong component `ProductCardActions` tại [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx) để thêm `event.stopPropagation()`.
- [ ] Cập nhật `onClick` trong component `ProductCardActions` tại [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx) để thêm `event.stopPropagation()`.
- [ ] Cập nhật `onClick` trong component `ProductList` tại [ProductCardComponents.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/products/ProductCardComponents.tsx) để thêm `e.stopPropagation()`.
- [ ] Chạy kiểm tra TypeScript compile tĩnh.
- [ ] Thực hiện commit các thay đổi và phát âm báo hoàn tất.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Code vượt qua kiểm tra compile tĩnh không có lỗi.
- Người dùng click vào nút "Thêm giỏ" / "Mua ngay" trên trang chủ và các trang khác không bị chuyển hướng trang sang trang chi tiết, modal chọn size hiển thị mượt mà tại chỗ.
- Click vào các vùng khác trên card sản phẩm vẫn chuyển hướng xem chi tiết bình thường.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- *Rủi ro*: Không có rủi ro nào đáng kể vì `stopPropagation` là một API chuẩn của DOM được hỗ trợ rộng rãi.
- *Rollback*: Sử dụng lệnh `git checkout -- <file_path>` để hoàn tác các chỉnh sửa.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi thiết kế giao diện card sản phẩm.
- Không sửa đổi logic Convex API.
