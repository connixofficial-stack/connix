# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi click vào nhãn (badge) "16%" trên thẻ sản phẩm, hệ thống chuyển hướng sang trang lỗi 404.
* **Nguyên nhân**: Hệ thống URL quy định rằng các thuộc tính dạng "Khoảng" (Range - như % Cồn, Dung tích) không được dùng làm đường dẫn chính (URL Path) vì có vô số giá trị số, tránh làm rác SEO. Tuy nhiên, nút bấm trên thẻ sản phẩm lại "quên" quy tắc này và cố tình tạo đường dẫn dạng `/1abv/16-`.
* **Cách sửa**: Dạy lại nút bấm phân biệt: nếu là thuộc tính bình thường (như Xuất xứ) thì dùng đường dẫn đẹp (URL Path); nếu là thuộc tính dạng số/khoảng (Range) thì dùng tham số phụ (Query Params, vd: `?attr_1abv=16-`).

## 2. Elaboration & Self-Explanation
Trong hệ thống, các bộ lọc (filters) chia làm nhiều loại: `single`, `multiple`, và `range`. 
Đường dẫn SEO đẹp dạng `/${productTypeSlug}/${groupSlug}/${termSlug}` (ví dụ: `/ruou-manh/xuat-xu/scotland`) được xây dựng trên Backend (`convex/ia.ts`) để tối ưu hóa SEO. Tuy nhiên, Backend **chủ động từ chối** (trả về `null` gây ra lỗi 404) nếu URL đẹp này được dùng cho các thuộc tính `range` (như %abv, Dung tích). Lý do là `range` có thể sinh ra hàng triệu URL vô nghĩa (16%, 16.5%, 17%...) làm loãng hệ thống SEO.
Tại file hiển thị (`ProductsPage.tsx`), hàm xử lý bộ lọc chính `navigateWithFilters` đã biết quy định này và xử lý rất mượt bằng cách đẩy các thuộc tính `range` thành URL parameters (`?attr_1abv=16-`). Nhưng lập trình viên khi code phần "Nhấp vào Badge trên Card Sản Phẩm" lại code "cứng" (hard-code) luôn việc gọi URL đẹp cho tất cả mọi loại thuộc tính, dẫn tới việc Backend từ chối và trả về 404.

## 3. Concrete Examples & Analogies
**Analogy (Trực giác)**: Tưởng tượng nhà hàng có quy định: "Món ăn chính (Thịt, Cá) thì được ghi thẳng lên biển hiệu, còn các món gia vị (Thêm muối, Thêm tiêu) thì chỉ được ghi vào tờ giấy note nhỏ". Backend chính là ông chủ nhà hàng, rất nghiêm ngặt. Nhưng cậu phục vụ (Nút bấm Badge) lại mang nguyên cái biển hiệu to đùng ghi "THÊM MUỐI 16g" ra treo trước cửa. Ông chủ thấy sai quy tắc liền đóng cửa tiệm ngay lập tức (Lỗi 404). Việc cần làm là bảo cậu phục vụ viết "Thêm muối 16g" vào tờ giấy note (URL Query Params) như đúng quy trình.

**Ví dụ thực tế**: Khi click badge "16%", UI cố gắng gọi URL `/ruou-sakesojuumeshu/1abv/16-`. `convex/ia.ts` nhận được, thấy `1abv` có `filterType` là `range`, lập tức gọi lệnh `return null;` dẫn đến trang 404.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng**: Click vào badge "16%" (thuộc tính %abv) của sản phẩm sinh ra lỗi 404 với đường dẫn `/ruou-sakesojuumeshu/1abv/16-`.
* **Phạm vi ảnh hưởng**: Mọi badge sản phẩm hiển thị trên Card có loại thuộc tính là `range` (ví dụ: Dung tích, Độ cồn).
* **Mốc thay đổi**: Khi thêm tính năng Badge trên thẻ sản phẩm (component `ProductAttributesBadges`).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
**Root Cause Confidence: High**
* **Nguyên nhân chính**: Hàm xử lý sự kiện `onClick` trong `ProductAttributesBadges` (dòng 1752-1758) luôn gọi `router.push` với định dạng SEO Path `/${productTypeSlug}/${groupItem.group.slug}/${term.slug}` mà không kiểm tra `groupItem.group.filterType === 'range'`. Đồng thời, Resolver backend (`convex/ia.ts` dòng 400 và 458) cố tình chặn `range` type ở URL Path để bảo vệ SEO. Sự bất đồng bộ này gây ra 404.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Có thể Backend bị lỗi xử lý sai ID/Slug? Đã kiểm tra CLI, Slug `1abv` và `16-` tồn tại và chính xác. Có thể do `resolveProductLandingContext` chưa cover hết case 3 slugs? Không, logic đã cover nhưng gặp `if (group.filterType === "range") return null;` thì dừng.

# IV. Proposal (Đề xuất)
Sửa hàm `onClick` của `ProductAttributesBadges` trong file `ProductsPage.tsx`:
1. Kiểm tra `groupItem.group.filterType`.
2. Nếu là `range`, chuyển hướng bằng Query Params: `/${productTypeSlug}?attr_${groupItem.group.slug}=${term.slug}`.
3. Nếu không phải `range`, giữ nguyên logic cũ: `/${productTypeSlug}/${groupItem.group.slug}/${term.slug}`.

# V. Files Impacted (Tệp bị ảnh hưởng)
1. **`app/(site)/_components/products/ProductsPage.tsx`**
   * *Vai trò*: Render Component `ProductAttributesBadges`.
   * *Thay đổi*: Thêm điều kiện `if-else` trong sự kiện onClick của badge để xử lý riêng biệt cho loại `range`.

# VI. Execution Preview (Xem trước thực thi)
1. Tìm dòng ~1755 trong `ProductsPage.tsx` (Bên trong event handler `onClick` của Badge).
2. Viết lại khối logic `if (productTypeSlug)`:
   ```typescript
   if (groupItem.group.filterType === 'range') {
     router.push(`/${productTypeSlug}?attr_${groupItem.group.slug}=${term.slug}`, { scroll: false });
   } else {
     router.push(`/${productTypeSlug}/${groupItem.group.slug}/${term.slug}`, { scroll: false });
   }
   ```
3. Lưu và chạy test.

# VII. Verification Plan (Kế hoạch kiểm chứng)
1. Tải lại trang `http://localhost:3000/products`.
2. Bấm vào một badge là %abv ("16%") trên thẻ sản phẩm.
3. Trình duyệt phải tải trang thành công (không 404) với URL dạng `.../ruou-sakesojuumeshu?attr_1abv=16-` và sản phẩm được lọc theo tiêu chí đó.

# VIII. Todo
- [ ] Thêm điều kiện xử lý `range` filter trong sự kiện onClick của Badge.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Mọi thao tác click vào badge dạng `range` đều dẫn tới trang sản phẩm tương ứng với tham số tìm kiếm, không gây lỗi 404.
- Click vào các badge không phải `range` (như Xuất xứ) vẫn dùng đường dẫn SEO Path như cũ.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Rất thấp, chỉ thay đổi đường dẫn điều hướng phía Frontend.
- **Hoàn tác**: Đảo ngược lại đoạn mã cũ trong hàm onClick.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc dữ liệu Backend của Convex về SEO Resolver (để giữ nguyên chủ đích thiết kế ban đầu của team).
