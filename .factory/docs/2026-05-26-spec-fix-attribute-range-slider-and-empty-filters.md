# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1 (Slider không kéo được):** Dải chọn lọc khoảng (như Dung tích, %abv) hiện tại sử dụng thẻ `<input type="range">` đè lên nhau. Để ngăn chặn sự kiện của input này đè lên input kia, lập trình viên trước đó đã đặt `pointer-events: none` cho input và `pointer-events: auto` cho nút trượt (thumb). Tuy nhiên, trên các trình duyệt hiện đại, CSS `pointer-events: none` trên phần tử cha sẽ chặn toàn bộ sự kiện chuột và chạm của cả các phần tử con/pseudo-elements trong shadow DOM, khiến người dùng hoàn toàn không thể kéo hay click dải chọn.
* **Vấn đề 2 (Ẩn thuộc tính chỉ có 1 giá trị):** Khi duyệt sản phẩm (ví dụ lọc Rượu vang đỏ), nếu tất cả sản phẩm thỏa mãn bộ lọc hiện tại đều có chung một giá trị thuộc tính (ví dụ đều có dung tích 500ml), việc hiển thị bộ lọc dung tích (dải chọn 500ml - 500ml) là hoàn toàn vô nghĩa và làm chật giao diện.
* **Cách giải quyết:**
  * **Giải pháp 1 (Sửa Slider):** Bỏ `pointer-events: none` trên input và pseudo-elements. Thay vào đó, cho phép cả hai input nhận sự kiện bình thường, và điều khiển `zIndex` động của hai input. Khi người dùng click hoặc di chuyển chuột gần nút nào hơn, input của nút đó sẽ được nâng lên trên cùng (zIndex cao hơn) để nhận toàn bộ sự kiện click và kéo thả mượt mà 100%.
  * **Giải pháp 2 (Ẩn bộ lọc 1 giá trị):** Thêm một query Convex backend `api.products.getActiveTermsForProducts` để lấy danh sách các giá trị thuộc tính (terms) thực tế đang tồn tại trên các sản phẩm hiển thị hiện tại. Tại Frontend, lọc các option bộ lọc theo danh sách terms thực tế này. Nếu một thuộc tính lọc chỉ có tối đa 1 giá trị thực tế khác nhau, ẩn hoàn toàn bộ lọc đó đi.

## 2. Elaboration & Self-Explanation
Đối với vấn đề thanh trượt khoảng (Double Range Slider) trong HTML/CSS, do chúng ta có hai thanh trượt (Min và Max) đè khít lên nhau, thanh trượt nào nằm trên (zIndex cao hơn) sẽ chặn toàn bộ sự kiện chuột của thanh trượt nằm dưới. Để giải quyết, phương án CSS cũ là gán `pointer-events: none` cho input và `pointer-events: auto` cho thumb. Tuy nhiên, kiến trúc Shadow DOM mới của các trình duyệt hiện đại coi thumb là một phần không thể tách rời của input, do đó khi input cha có `pointer-events: none`, thumb cũng bị vô hiệu hóa pointer events. 

Để khắc phục triệt để, chúng ta gỡ bỏ hoàn toàn CSS pointer-events gây lỗi này. Thay vào đó, chúng ta cho phép cả hai input hoạt động bình thường, và thêm sự kiện di chuột/click (`onMouseMove`, `onMouseDown`) lên container bao ngoài slider. Khi người dùng di chuyển chuột hoặc click, chúng ta tính xem con trỏ chuột đang ở gần giá trị `sliderMin` hay `sliderMax` hơn, và lưu vào một state `activeInput` (`'min' | 'max'`). Input tương ứng với `activeInput` sẽ được nâng `zIndex` lên `10` (so với `default` là `4` hoặc `3`). Điều này đảm bảo khi người dùng rê chuột gần nút nào, nút đó sẽ lập tức nổi lên trên cùng và nhận sự kiện kéo thả hoàn hảo trên cả desktop và mobile.

Đối với vấn đề ẩn bộ lọc vô nghĩa, khi người dùng đã lọc ra một danh sách sản phẩm hẹp (ví dụ: các chai rượu thuộc thương hiệu Chateau Margaux), các chai này có thể có chung một mức dung tích duy nhất hoặc một nồng độ cồn duy nhất. Nếu hiển thị thanh trượt dải chọn với min === max (ví dụ: 750ml - 750ml), người dùng không thể thực hiện thao tác lọc nào thêm. Bằng cách viết một query tối ưu trong Convex lấy các `termId` thực tế của danh sách `products` đang hiển thị, Frontend có thể dễ dàng đối chiếu. Nếu một attribute group sau khi đối chiếu chỉ còn chứa `<= 1` term hoạt động, chúng ta sẽ ẩn nó đi, giúp giao diện gọn gàng và nâng cao trải nghiệm người dùng.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:**
  * **Slider:** Người dùng chạm vào nút Min (360ml) và kéo sang phải -> nút di chuyển mượt mà tới 500ml. Người dùng chạm vào nút Max (750ml) và kéo sang trái -> nút di chuyển mượt mà tới 600ml.
  * **Ẩn bộ lọc:** Có 3 chai rượu trong kết quả lọc thương hiệu Chateau Margaux, cả 3 chai đều có dung tích 750ml, nồng độ cồn lần lượt là 12%, 13.5% và 14%. Bộ lọc "Dung tích" (chỉ có 1 giá trị 750ml) sẽ tự động ẩn đi. Bộ lọc "Nồng độ cồn" (có nhiều giá trị khác nhau) vẫn hiển thị bình thường dưới dạng dải chọn 12% - 14%.
* **Hình ảnh ẩn dụ:**
  * **Slider:** Giống như hai người đứng xếp hàng dọc sát sườn nhau để bán vé ở một khe nhỏ. Nếu người đứng trước (Max) luôn che mất người đứng sau (Min), khách hàng không cách nào đưa tiền cho người đứng sau. Thay vì dùng ma thuật vô lý (pointer-events none), chúng ta thuê một người bảo vệ thông minh (Javascript Mouse Listener): khi khách hàng đi gần về phía người đứng sau hơn, bảo vệ sẽ kéo người đó lên đứng trước để giao dịch mượt mà.
  * **Ẩn bộ lọc:** Giống như một siêu thị rượu vang đỏ chuyên biệt. Vì tất cả các chai rượu vang đỏ trong cửa hàng đều được đóng chai tiêu chuẩn 750ml, người quản lý siêu thị sẽ không treo một bảng phân loại "Chọn dung tích" khổng lồ ở cửa chỉ để ghi duy nhất một lựa chọn "750ml". Việc cất bảng hiệu thừa thãi đó đi giúp khách hàng tập trung vào các tiêu chí thực sự khác biệt như giống nho hay xuất xứ.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp `app/(site)/_components/products/ProductsPage.tsx`:**
  * Chứa component `AttributeFilterGroupWidget` chịu trách nhiệm render các bộ lọc thuộc tính, bao gồm logic Range Slider (dòng 1773).
  * Hiện tại range slider sử dụng `pointer-events: none` đè lên phần tử cha và tính toán `zIndex` tĩnh không linh hoạt.
  * `visibleCategories` và `filterableGroups` hiển thị toàn bộ thuộc tính mà không đối chiếu với sản phẩm thực tế hiển thị trên trang.
* **Tệp `convex/products.ts`:**
  * Chưa có API/query nào hỗ trợ lấy tập hợp `termIds` thực tế của danh sách sản phẩm. Cần bổ sung query tối ưu hóa batch query.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc 1 (Slider không kéo được):**
  * CSS `pointer-events: none` trên `input[type="range"]` triệt tiêu hoàn toàn sự kiện chuột của phần tử cha và shadow root của nó trong các trình duyệt WebKit/Blink hiện đại, bất chấp việc gán `pointer-events: auto` cho pseudo-elements.
  * **Giả thuyết đối chứng:** Nếu bỏ `pointer-events: none` trên input và điều khiển `zIndex` động của input dựa trên khoảng cách của con trỏ chuột đến các giá trị min/max, slider sẽ click và kéo mượt mà 100%.
* **Nguyên nhân gốc 2 (Hiển thị bộ lọc vô nghĩa):**
  * Frontend chỉ render các bộ lọc dựa trên cấu hình gán tĩnh (`assignedGroups`), không lọc động dựa trên sản phẩm thực tế trong kết quả tìm kiếm.
  * **Giả thuyết đối chứng:** Nếu có API trả về các `termId` thực tế của danh sách sản phẩm hiển thị và lọc danh sách option ở Frontend theo các `termId` này, các bộ lọc chỉ chứa 1 giá trị hoặc không chứa giá trị nào sẽ tự động ẩn đi.

---

# IV. Proposal (Đề xuất)

* **Giải pháp thực hiện:**
  1. **Tạo Query Convex mới `getActiveTermsForProducts`:**
     * Thêm query trong `convex/products.ts` nhận vào `productIds` và trả về mảng `termId` độc bản bằng `Promise.all` song song.
  2. **Cập nhật `ProductsPage.tsx` tải danh sách active terms:**
     * Gọi query `getActiveTermsForProducts` với `productIds = products.map(p => p._id)` mỗi khi danh sách sản phẩm thay đổi.
     * Cập nhật `filterableGroups` lọc các terms của từng group chỉ giữ lại các terms thực tế xuất hiện trên các sản phẩm hiện có.
     * Ẩn group nếu số lượng `terms` còn lại `<= 1`.
  3. **Tái thiết kế Range Slider (kéo mượt mà):**
     * Gỡ bỏ `pointer-events: none` khỏi `input[type="range"]` và `pointer-events: auto` khỏi thumb.
     * Thêm state `activeInput` (`'min' | 'max'`).
     * Đặt zIndex của Min Input và Max Input động dựa trên `activeInput`.
     * Thêm sự kiện di chuyển chuột/chạm trên container để liên tục cập nhật `activeInput` khi chuột ở gần nút nào hơn.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Server / Convex Backend
* `Sửa:` [products.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/products.ts)
  * Thêm query public `getActiveTermsForProducts` để lấy tập hợp các term IDs thực tế của danh sách sản phẩm.

### UI / Public Pages
* `Sửa:` [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Gọi query `getActiveTermsForProducts` dựa trên sản phẩm hiển thị.
  * Lọc động `filterableGroups` và ẩn các bộ lọc chỉ chứa tối đa 1 giá trị.
  * Cải tiến range slider với state `activeInput` và zIndex động, gỡ bỏ pointer-events cũ để slider kéo mượt mà.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 (Backend):** Thêm query `getActiveTermsForProducts` vào `convex/products.ts`.
2. **Bước 2 (Frontend - Tải active terms):** Gọi query từ `ProductsPage.tsx` và lọc các bộ lọc thuộc tính.
3. **Bước 3 (Frontend - Sửa slider kéo mượt):** Cập nhật `AttributeFilterGroupWidget` để thay đổi zIndex động dựa trên tọa độ chuột và gỡ bỏ pointer-events CSS cũ.
4. **Bước 4 (TypeScript Validation):** Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` kiểm tra kiểu dữ liệu TypeScript.

### Manual Verification
* **Test Slider:**
  * Truy cập trang `/products` hoặc phân mục bất kỳ có dải chọn (như Dung tích hoặc %abv).
  * Di chuột vào nút Min hoặc Max, click và kéo thử.
  * Kỳ vọng: Cả hai nút trượt đều click và kéo thả vô cùng nhạy, mượt mà, không bị kẹt hay đè nghẹt sự kiện.
* **Test Ẩn Bộ lọc:**
  * Tìm một thương hiệu hoặc danh mục mà tất cả sản phẩm chỉ có đúng một mức dung tích (ví dụ Chateau Margaux có các chai đều 750ml).
  * Kỳ vọng: Bộ lọc "Dung tích" tự động ẩn đi hoàn toàn khỏi Sidebar. Bộ lọc khác có nhiều giá trị vẫn hiển thị.

---

# VIII. Todo
- [ ] Bổ sung query `getActiveTermsForProducts` vào `convex/products.ts`.
- [ ] Tải `activeTermIds` trong `ProductsContent` của `ProductsPage.tsx` bằng `useQuery` dựa trên `products`.
- [ ] Cập nhật `displayFilterableGroups` lọc terms thực tế và ẩn các nhóm thuộc tính chỉ có `<= 1` term hoạt động.
- [ ] Nâng cấp `AttributeFilterGroupWidget` với state `activeInput` và các handlers `onMouseMove` / `onMouseDown` để đổi zIndex động và gỡ pointer-events.
- [ ] Chạy `bunx tsc --noEmit` typecheck.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Tiêu chí 1 (Slider kéo mượt):** Range slider hoạt động hoàn hảo trên mọi thiết bị và trình duyệt. Click, kéo thả min/max không bị kẹt hoặc mất nhạy.
* **Tiêu chí 2 (Ẩn bộ lọc 1 giá trị):** Khi tất cả sản phẩm đang hiển thị chỉ có chung 1 giá trị thuộc tính (ví dụ dung tích 750ml), bộ lọc đó tự động ẩn đi.
* **Tiêu chí 3 (Biên dịch):** `bunx tsc --noEmit` thành công 100% không có lỗi kiểu dữ liệu.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Khi số lượng sản phẩm lớn, việc query song song `productAttributeTerms` có thể tốn tài nguyên DB. Tuy nhiên, do chúng ta đã giới hạn pagination `postsPerPage` (tối đa 12-24 sản phẩm trên trang), query này chỉ batch tối đa 12-24 IDs nên cực kỳ an toàn và nhanh chóng.
* **Giải pháp hoàn tác:** Khôi phục file bằng `git checkout`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế hoặc kiểu dáng UI cơ bản của sidebar.

---

# XII. Open Questions (Câu hỏi mở)
* (Không có câu hỏi mở nào).
