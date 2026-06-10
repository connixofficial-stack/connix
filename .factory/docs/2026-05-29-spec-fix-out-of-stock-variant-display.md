# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng xem trang chi tiết sản phẩm, họ muốn biết ngay phiên bản nào (ví dụ: kích thước 38, màu vàng) đã hết hàng mà không cần phải nhấp vào mới biết. Hiện tại, hệ thống luôn cho phép nhấp vào tất cả các phiên bản vì hàm kiểm tra chỉ kiểm tra phiên bản đó "có tồn tại trong hệ thống hay không", chứ không kiểm tra xem "còn hàng trong kho hay không". 
Giải pháp là cập nhật hàm kiểm tra để kiểm tra cả số lượng tồn kho (nếu tính năng quản lý kho được bật). Đồng thời, chúng ta sẽ đọc cấu hình "Hiển thị hết hàng" (`outOfStockDisplay`) từ cài đặt hệ thống và áp dụng: ẩn hẳn đi, vô hiệu hóa và gạch ngang, hoặc làm mờ kèm nhãn "Hết".

## 2. Elaboration & Self-Explanation
Hiện tại, trên trang chi tiết sản phẩm và modal thêm nhanh sản phẩm (QuickAddVariantModal), hàm `isOptionValueAvailable` được dùng để xác định một lựa chọn thuộc tính (như Size 38) có khả dụng để chọn hay không.
Tuy nhiên, hàm này đang được viết như sau:
```typescript
variants.some((variant) =>
  variant.optionValues.every((optionValue) => {
    if (optionValue.optionId === optionId) {
      return optionValue.valueId === valueId;
    }
    const selected = selectedOptions[optionValue.optionId];
    return !selected || selected === optionValue.valueId;
  })
);
```
Hàm này chỉ kiểm tra xem có tồn tại tổ hợp phiên bản nào khớp với giá trị đang xét hay không. Nó hoàn toàn bỏ qua thuộc tính tồn kho `variant.stock`. Vì thế, ngay cả khi phiên bản đó có số lượng tồn kho bằng 0 (hết hàng), hàm vẫn trả về `true`. Kết quả là các nút lựa chọn phiên bản hết hàng trông vẫn bình thường và click được, chỉ khi người dùng click vào thì hệ thống mới hiện chữ "Hết hàng" ở nút mua chính.

Để xử lý triệt để:
a) Cập nhật hàm `isOptionValueAvailable` ở cả trang chi tiết sản phẩm (cả 3 style layout: Classic, Modern, Minimal) và trong modal `QuickAddVariantModal` để kiểm tra thêm điều kiện: `!showStock || (variant.stock ?? product.stock ?? 0) > 0`.
b) Trong component `VariantSelector`, đọc cấu hình cài đặt module `products` cho key `outOfStockDisplay` thông qua Convex `useQuery(api.admin.modules.getModuleSetting, { moduleKey: "products", settingKey: "outOfStockDisplay" })`.
c) Tại `VariantSelector`, render các tùy chọn dựa trên giá trị của `outOfStockDisplay`:
- `hide`: Ẩn hoàn toàn nếu không khả dụng (hết hàng).
- `disable`: Vô hiệu hóa nút bấm, làm mờ (`opacity-50`) và gạch ngang chữ (`line-through`).
- `blur` (mặc định): Làm mờ nút bấm (`opacity-40`), vô hiệu hóa click và đính kèm một Badge nhỏ ghi chữ "Hết" ở góc trên bên phải của nút.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn vào một quán ăn để gọi món. Menu hiển thị đầy đủ các món: Cơm tấm sườn bì chả, Cơm tấm sườn, Cơm tấm bì.
- **Trạng thái lỗi hiện tại:** Bạn nhìn menu thấy mọi món đều bình thường. Bạn gọi món "Cơm tấm bì", người phục vụ đi vào bếp và một lát sau quay lại báo: "Món này hết rồi ạ". Điều này gây mất thời gian và trải nghiệm không tốt.
- **Trạng thái sau khi sửa:**
  - Nếu cấu hình là **Ẩn hoàn toàn (hide)**: Món "Cơm tấm bì" được gạch bỏ hẳn khỏi menu giấy. Bạn không nhìn thấy nó nữa.
  - Nếu cấu hình là **Vô hiệu hóa + gạch ngang (disable)**: Món "Cơm tấm bì" trên menu bị gạch một đường ngang qua tên món, bạn biết ngay món này hết và không gọi được.
  - Nếu cấu hình là **Mờ đi + Badge 'Hết hàng' (blur)**: Món "Cơm tấm bì" trên menu bị tô mờ đi và có dán một nhãn đỏ ghi chữ "HẾT" bên cạnh.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file cấu hình module sản phẩm `products.config.ts`, xác định cấu hình hiển thị hết hàng là `outOfStockDisplay` thuộc module `products` với các tùy chọn `hide`, `disable`, và `blur`.
- Đã kiểm tra component hiển thị lựa chọn phiên bản `VariantSelector.tsx` và thấy rằng nó nhận hàm `isOptionValueAvailable` để xác định trạng thái khả dụng, nhưng hiện tại hàm này ở các trang gọi không kiểm tra tồn kho.
- Đã xác định có 3 file cần được điều chỉnh logic kiểm tra tồn kho và logic hiển thị:
  1. `app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx` (Chứa logic chi tiết sản phẩm cho route động nhóm category/record slug).
  2. `app/(site)/_components/details/ProductDetailPage.tsx` (Chứa logic chi tiết sản phẩm cho route legacy hoặc các nhóm khác).
  3. `components/products/QuickAddVariantModal.tsx` (Modal thêm nhanh sản phẩm ở danh sách sản phẩm).
  4. `components/products/VariantSelector.tsx` (Component hiển thị các nút chọn phiên bản).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc):** Hàm `isOptionValueAvailable` trong các component chi tiết sản phẩm chỉ thực hiện khớp tổ hợp thuộc tính của phiên bản mà không kiểm tra lượng tồn kho của phiên bản đó (`variant.stock`). Đồng thời, component `VariantSelector` chưa tích hợp đọc cấu hình `outOfStockDisplay` từ cài đặt module sản phẩm để tùy biến style hiển thị (chỉ mặc định làm mờ `opacity-40` và disable chung).
- **Counter-Hypothesis (Giả thuyết đối chứng):** Nếu chỉ sửa ở `VariantSelector` mà không sửa logic `isOptionValueAvailable` ở phía cha thì các nút vẫn sẽ hiển thị bình thường vì cha luôn báo `isAvailable = true` cho các phiên bản tồn kho bằng 0. Do đó bắt buộc phải sửa cả 2 nơi: cập nhật logic kiểm tra tồn kho ở cha và cập nhật cách hiển thị ở con (`VariantSelector`).

# IV. Proposal (Đề xuất)
1. Cập nhật hàm `isOptionValueAvailable` trong 3 file gọi để kiểm tra tồn kho:
   - Thêm điều kiện `!showStock || (variant.stock ?? product.stock ?? 0) > 0`.
2. Cập nhật `components/products/VariantSelector.tsx`:
   - Truy vấn cấu hình `outOfStockDisplay` qua Convex query `api.admin.modules.getModuleSetting`.
   - Cập nhật hàm render tùy chọn:
     - Nếu `outOfStockDisplay === 'hide'` và `!isAvailable`, ẩn phần tử (trả về `null`).
     - Nếu `outOfStockDisplay === 'disable'` và `!isAvailable`, thêm class `opacity-50 line-through cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50`.
     - Nếu `outOfStockDisplay === 'blur'` và `!isAvailable`, thêm class `opacity-40 cursor-not-allowed` và hiển thị một Badge Badge tuyệt đối ở góc trên bên phải ghi chữ "Hết".
   - Đảm bảo các nút bấm có class `relative` để hiển thị Badge chuẩn vị trí.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [VariantSelector.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/VariantSelector.tsx)
  - Vai trò hiện tại: Hiển thị các thuộc tính phiên bản dưới dạng nút bấm/màu sắc.
  - Thay đổi: Lấy cấu hình `outOfStockDisplay` và áp dụng style mờ/badge/ẩn/vô hiệu hóa dựa trên cấu hình.
- `Sửa:` [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
  - Vai trò hiện tại: Trang chi tiết sản phẩm (layout chính mới).
  - Thay đổi: Cập nhật hàm `isOptionValueAvailable` ở cả 3 style layout (Classic, Modern, Minimal) để check tồn kho thực tế của phiên bản.
- `Sửa:` [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/details/ProductDetailPage.tsx)
  - Vai trò hiện tại: Trang chi tiết sản phẩm (layout chia sẻ / legacy).
  - Thay đổi: Cập nhật hàm `isOptionValueAvailable` ở cả 3 style layout để check tồn kho thực tế của phiên bản.
- `Sửa:` [QuickAddVariantModal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/QuickAddVariantModal.tsx)
  - Vai trò hiện tại: Modal chọn phiên bản khi thêm nhanh từ danh sách.
  - Thay đổi: Cập nhật hàm `isOptionValueAvailable` để check tồn kho thực tế của phiên bản.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa file [VariantSelector.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/VariantSelector.tsx) để tích hợp Convex query cài đặt và cập nhật hàm render.
2. Đọc và chỉnh sửa file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx) cập nhật 3 hàm `isOptionValueAvailable` tương ứng với 3 style.
3. Đọc và chỉnh sửa file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/details/ProductDetailPage.tsx) cập nhật các hàm `isOptionValueAvailable`.
4. Đọc và chỉnh sửa file [QuickAddVariantModal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/QuickAddVariantModal.tsx) để cập nhật hàm `isOptionValueAvailable`.
5. Tự kiểm tra static types bằng cách chạy `bunx tsc --noEmit` giới hạn hiển thị.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy `bunx tsc --noEmit` để đảm bảo code biên dịch thành công không có lỗi type.
- Nhờ tester/user kiểm tra trực quan trên trình duyệt tại URL `http://localhost:3000/air-force-1/naf107lbeigeyellow` xem phiên bản hết hàng đã hiển thị đúng theo cấu hình (ẩn/gạch ngang/mờ kèm badge) chưa.

# VIII. Todo
- [ ] Thay đổi file [VariantSelector.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/VariantSelector.tsx)
- [ ] Thay đổi file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/[categorySlug]/[recordSlug]/_components/ProductDetailPage.tsx)
- [ ] Thay đổi file [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/(site)/_components/details/ProductDetailPage.tsx)
- [ ] Thay đổi file [QuickAddVariantModal.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/products/QuickAddVariantModal.tsx)
- [ ] Thực hiện kiểm tra lỗi type và biên dịch dự án.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Các tùy chọn phiên bản hết hàng phải tự động hiển thị mờ đi + badge "Hết" (nếu cấu hình là `blur`), hoặc gạch ngang chữ (nếu cấu hình là `disable`), hoặc biến mất hoàn toàn (nếu cấu hình là `hide`).
- Tránh việc click vào mới biết hết hàng, cải thiện UX trực quan.
- Hệ thống biên dịch tốt và không phát sinh lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro rất thấp vì đây là thay đổi cục bộ ở giao diện lựa chọn thuộc tính. 
- Nếu cần rollback, chỉ cần hoàn tác các thay đổi trên 4 file đã sửa về trạng thái commit gần nhất.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi cấu trúc bảng cơ sở dữ liệu hoặc schema của Convex.
- Không sửa các logic thanh toán hoặc giỏ hàng liên quan, chỉ tập trung vào hiển thị các nút chọn phiên bản trên UI.
