# Đặc tả thiết kế: Nâng cấp bộ lọc thuộc tính và giao diện nhập liệu sản phẩm

# I. Primer

## 1. TL;DR kiểu Feynman
* **Chặn lỗi phân loại chéo**: Khi chọn các danh mục thuộc các kiểu sản phẩm khác nhau (ví dụ: vừa chọn rượu vang vừa chọn bia thủ công vốn có bộ lọc thuộc tính khác nhau), nút Lưu/Tạo sẽ bị tắt (disable) hoàn toàn và báo lỗi để tránh dữ liệu bị xung đột.
* **Gọn gàng hóa danh sách dài**: Với các thuộc tính có nhiều hơn 10 giá trị lựa chọn (ví dụ: có 50 giống nho khác nhau), thay vì hiện tràn lan làm hỏng giao diện, hệ thống sẽ gom lại trong một khung cuộn dọc (scroll) gọn gàng và có thêm ô tìm kiếm nhanh (fuzzy search tiếng Việt không dấu).
* **Nhập số liệu khoảng (Range)**: Các thuộc tính dạng khoảng (như Dung tích chai rượu hay Độ cồn %abv) sẽ được nhập bằng một ô điền số và một danh sách chọn đơn vị (ví dụ: `ml`, `%`) kế bên thay vì chọn checkbox cố định. Bạn có thể nhấn nút `+` để thêm nhanh đơn vị mới nếu chưa có.
* **Nhất quán đơn vị đo**: Nếu sản phẩm trước dùng `ml`, sản phẩm sau bạn chọn `lít` hệ thống sẽ cảnh báo đỏ trực tiếp trên form và bắt xác nhận khi lưu để đảm bảo toàn bộ web dùng chung một loại đơn vị, giúp người dùng lọc khoảng giá trị (ví dụ: từ 10ml đến 1000ml) chính xác.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại quản lý các thuộc tính lọc (Attributes) của sản phẩm thông qua việc liên kết sản phẩm với các giá trị thuộc tính (`attributeTerms`) trong cơ sở dữ liệu. 
Đối với các thuộc tính thông thường (như Màu sắc, Xuất xứ), việc hiển thị dạng checkbox hoặc radio là phù hợp. Tuy nhiên, khi một thuộc tính có quá nhiều giá trị (ví dụ: danh sách Thương hiệu gồm hàng trăm hãng), giao diện sẽ bị kéo dài vô hạn. Để giải quyết, chúng ta sẽ bọc danh sách này trong một container có thanh cuộn và tích hợp tìm kiếm fuzzy search tiếng Việt không dấu ở client-side.

Đối với thuộc tính dạng khoảng giá trị (Range - ví dụ: Dung tích, %abv), thay vì tạo sẵn hàng trăm term cố định như `750ml`, `1000ml` trong database rồi bắt admin chọn, ta cho phép admin nhập trực tiếp số (ví dụ: `750`) và chọn đơn vị (ml). Khi lưu sản phẩm, hệ thống tự động kiểm tra xem term `"750ml"` đã tồn tại trong database chưa:
* Nếu đã có, lấy ID của term đó gán vào sản phẩm.
* Nếu chưa có, gọi mutation tạo term `"750ml"` mới rồi gán ID cho sản phẩm.

Về mặt dữ liệu storefront, việc tìm kiếm theo khoảng giá trị (Range Filter) đòi hỏi sự nhất quán về đơn vị. Ví dụ, nếu sản phẩm A có dung tích là `750ml`, sản phẩm B có dung tích là `1l`, bộ lọc min-max ngoài storefront sẽ bị sai lệch nếu so sánh số học trực tiếp `1` và `750` mà không quy đổi đơn vị. Do đó, hệ thống sẽ xác định "đơn vị chủ đạo" (đơn vị xuất hiện nhiều nhất trong các term hiện tại của nhóm đó) và cảnh báo real-time khi admin chọn đơn vị lệch chuẩn, đồng thời yêu cầu xác nhận khi lưu để đảm bảo tính đồng nhất dữ liệu.

## 3. Concrete Examples & Analogies
* **Ví dụ fuzzy search**: Nhóm thuộc tính "Thương hiệu" có 20 hãng. Khi nhập chữ "phap" vào ô tìm kiếm, hệ thống sẽ hiển thị "Chateau Margaux (Pháp)" nhờ cơ chế fuzzy search tiếng Việt không dấu (loại bỏ dấu và viết hoa viết thường).
* **Ví dụ Range và nhất quán đơn vị**: 
  * Nhóm thuộc tính "Dung tích" hiện tại có các term: `375ml` (10 sản phẩm), `750ml` (50 sản phẩm), `1000ml` (5 sản phẩm). Đơn vị chủ đạo ở đây là `ml` (xuất hiện 65 lần).
  * Khi tạo sản phẩm mới, dropdown đơn vị sẽ tự động gợi ý chọn `ml`.
  * Nếu admin đổi sang `l` và nhập `1.5`, hệ thống sẽ hiện cảnh báo: `⚠️ Lưu ý: Đơn vị đang chọn (l) khác với đơn vị phổ biến hiện tại (ml).`
  * Khi nhấn "Tạo sản phẩm", hộp thoại xác nhận hiện lên: `Đơn vị cho thuộc tính 'Dung tích' bạn chọn là 'l' khác với đơn vị phổ biến hiện tại là 'ml'. Bạn có chắc chắn muốn lưu?`

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trang tạo sản phẩm**: `app/admin/products/create/page.tsx`
  * Đã có check cảnh báo taxonomy conflict (`hasTaxonomyConflict`), nhưng chưa disable nút submit/lưu và chưa khóa sticky footer.
  * Việc render các attribute group đang dùng grid col 2 đơn giản, chưa phân biệt group range và group thường, chưa có fuzzy search hay scrollbar khi số lượng term > 10.
* **Trang chỉnh sửa sản phẩm**: `app/admin/products/[id]/edit/page.tsx`
  * Tương tự trang create, chưa khóa nút lưu khi taxonomy conflict.
  * Chưa có logic phân tách và nạp các term dạng range vào ô input riêng khi load dữ liệu sản phẩm cũ.
* **API Convex**:
  * Bảng `attributeGroups` có trường `displayConfig` kiểu `any`, rất phù hợp để lưu danh sách đơn vị dưới dạng `{ units: string[] }`.
  * Đã có mutation `api.attributeGroups.update` dùng để patch `displayConfig` khi admin bấm nút `+` thêm nhanh đơn vị mới.
  * Đã có mutation `api.attributeTerms.create` để tạo term mới.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc**: High
  * **expected**: Hệ thống quản lý thuộc tính linh hoạt, trực quan, ngăn chặn cấu hình sai (taxonomy conflict), hỗ trợ nhập liệu dạng số kèm đơn vị đối với các thuộc tính khoảng lọc (range) và tự động tạo term nếu chưa có, kiểm soát đồng bộ đơn vị để lọc min/max chính xác ở storefront. Gọn gàng hóa UI khi số lượng giá trị quá lớn (>10).
  * **actual**: Các thuộc tính lọc được render dưới dạng danh sách checkbox/radio dàn ngang, không scroll, không search. Thuộc tính khoảng (Dung tích, %abv) không có ô nhập số mà hiển thị giống hệt checkbox, gây khó khăn cho việc nhập các giá trị mới. Hệ thống cảnh báo chéo kiểu sản phẩm nhưng không chặn cứng ở nút submit.

---

# IV. Proposal (Đề xuất)

1. **Khóa nút Tạo/Lưu sản phẩm**:
   * Tích hợp điều kiện `hasTaxonomyConflict` vào thuộc tính `disabled` của các nút submit và nút Lưu nháp trên form, đồng thời truyền `disableSave={isSubmitting || hasTaxonomyConflict}` vào component `<HomeComponentStickyFooter>`.

2. **Xử lý danh sách thuộc tính dài (>10 items)**:
   * Viết hàm chuẩn hóa tiếng Việt không dấu `removeTones(str)` để thực hiện fuzzy search client-side.
   * Thêm state `searchTerms` (`Record<string, string>`) để lưu từ khóa tìm kiếm cho từng group thuộc tính.
   * Nếu số lượng terms của group > 10:
     * Render 1 ô `<Input>` tìm kiếm nhỏ ở trên đầu.
     * Bọc danh sách checkbox/radio trong một div `max-h-48 overflow-y-auto pr-1` để tự động scroll dọc.
     * Lọc danh sách terms hiển thị dựa trên fuzzy search của `searchTerms[groupId]`.

3. **Xử lý thuộc tính dạng Range (Khoảng giá trị)**:
   * Nhận diện group range bằng cách check `group.filterType === 'range'`.
   * Thêm state `rangeInputs` (`Record<string, { value: string; unit: string }>`) trong form để quản lý riêng giá trị range của từng group.
   * Danh sách đơn vị mặc định cho mỗi group range là `['%', 'ml', 'kg', 'g']`. Nếu `group.displayConfig?.units` tồn tại, ưu tiên dùng danh sách này.
   * Render giao diện nhập range gồm:
     * Ô nhập số (type="number").
     * Dropdown chọn đơn vị.
     * Nút `+` bên cạnh dropdown để thêm đơn vị mới: Khi click, dùng `window.prompt` nhận đơn vị mới, gọi mutation `api.attributeGroups.update` để lưu lại đơn vị vào `displayConfig.units` của group đó.
   * **Đảm bảo nhất quán đơn vị**:
     * Viết hàm tìm đơn vị chủ đạo (`dominantUnit`) bằng cách đếm tần suất đơn vị xuất hiện nhiều nhất trong các term hiện tại của group.
     * Mặc định chọn `dominantUnit` cho sản phẩm mới.
     * Hiện dòng chữ cảnh báo nhỏ dưới input nếu đơn vị được chọn khác với `dominantUnit`.
     * Khi submit, kiểm tra nếu có sự sai lệch đơn vị, hiển thị `window.confirm` để cảnh báo và xác nhận từ người dùng.

4. **Đồng bộ hóa dữ liệu Range khi submit**:
   * Trước khi gọi mutation tạo/sửa sản phẩm, duyệt qua các group range:
     * Nếu ô nhập số có giá trị (ví dụ: `750` và đơn vị `ml` -> ghép thành `"750ml"`):
       * Tìm xem trong `group.terms` đã có term nào có tên `"750ml"` chưa.
       * Nếu có, đưa ID của term đó vào danh sách `termIdsToSave`.
       * Nếu chưa có, gọi mutation `api.attributeTerms.create` để tạo term mới, lấy ID trả về và đưa vào `termIdsToSave`.
     * Tiến hành lưu sản phẩm với mảng `attributeTermIds` là sự kết hợp của `termIdsToSave` và các term của các group thường.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)
  * Tích hợp logic disable nút submit khi `hasTaxonomyConflict`.
  * Bổ sung state `rangeInputs` and `searchTerms`.
  * Cập nhật phần render thuộc tính lọc để phân tách giao diện Range (số + đơn vị + nút `+`) và giao diện thường (checkbox/radio). Tích hợp scroll và fuzzy search cho danh sách thường > 10 items.
  * Cập nhật hàm `handleSubmit` để tự động tạo term range động trước khi gọi `createProduct`.
* **Sửa**: [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)
  * Thực hiện các thay đổi tương tự trang create (chặn lưu khi conflict, fuzzy search cuộn dọc cho >10 items, form nhập range).
  * Bổ sung logic parse dữ liệu term range cũ từ `assignedTermIdsData` để nạp vào state `rangeInputs` ban đầu khi render form edit.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Đọc và Chuẩn bị**: Kiểm tra các hàm hỗ trợ fuzzy search và parse đơn vị.
2. **Cập nhật [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx)**:
   * Thêm helper functions (`removeTones`, `parseTermValue`, `getDominantUnit`).
   * Bổ sung các state cần thiết (`rangeInputs`, `searchTerms`).
   * Sửa UI hiển thị trong block `enableProductTypes && formConfig.groups.map(...)`.
   * Cập nhật logic submit trong `handleSubmit`.
3. **Cập nhật [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx)**:
   * Bổ sung các helper và state tương tự trang create.
   * Thêm logic khởi tạo giá trị range từ term cũ trong `useEffect` tải dữ liệu.
   * Cập nhật logic submit trong `handleSubmit`.
4. **Kiểm tra biên dịch**: Chạy `bunx tsc --noEmit` để đảm bảo TypeScript không có lỗi.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm thử thủ công (Tester thực hiện ở runtime)
1. **Xác minh chặn taxonomy conflict**:
   * Chọn các danh mục thuộc các kiểu sản phẩm khác nhau. Kiểm tra xem nút "Tạo sản phẩm" / "Lưu thay đổi" có bị disable và sticky footer có bị khóa không.
2. **Xác minh Fuzzy search & scroll**:
   * Tìm một nhóm thuộc tính có > 10 terms.
   * Kiểm tra xem ô input search có xuất hiện không và danh sách có bị giới hạn chiều cao (scroll dọc) không.
   * Nhập tìm kiếm không dấu (ví dụ: "phap") xem có lọc đúng các term có dấu (Pháp) không.
3. **Xác minh thuộc tính Range & đơn vị**:
   * Chọn một thuộc tính dạng range. Nhập số và chọn đơn vị từ dropdown.
   * Nhấn nút `+` để thêm một đơn vị mới (ví dụ: `lit`). Kiểm tra xem đơn vị này có xuất hiện ngay lập tức trong dropdown không.
   * Thay đổi đơn vị sang đơn vị khác đơn vị chủ đạo. Kiểm tra xem cảnh báo màu vàng/đỏ có xuất hiện không.
   * Nhấn Lưu sản phẩm. Xác nhận confirm dialog có xuất hiện yêu cầu đồng ý thay đổi đơn vị lệch chuẩn hay không.
   * Sau khi lưu thành công, kiểm tra xem term mới (ví dụ `"1.5lit"`) có được tạo tự động và gán vào sản phẩm không.

---

# VIII. Todo

- [x] Tạo file spec đặc tả kỹ thuật và lưu tại `.factory/docs/product_filter_range_and_scroll_spec.md`. (Đã thực hiện)
- [x] Cập nhật logic trong [create/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/create/page.tsx).
- [x] Cập nhật logic trong [[id]/edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/[id]/edit/page.tsx).
- [x] Chạy kiểm tra tĩnh TypeScript bằng `bunx tsc --noEmit`.
- [ ] Commit thay đổi và phát âm báo hoàn thành `Done, Sir.`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. **Khóa nút Tạo/Lưu khi có xung đột taxonomy**: Nút "Tạo sản phẩm" / "Lưu thay đổi" và "Lưu nháp" ở footer phải bị disable khi `hasTaxonomyConflict === true`.
2. **Fuzzy search và scroll**: Chỉ hiển thị scrollbar và ô search cho các nhóm thuộc tính có số lượng terms > 10. Tìm kiếm phải hỗ trợ tiếng Việt không dấu.
3. **Giao diện Range**: Group range phải hiển thị input điền số, dropdown đơn vị và nút `+`. Không hiển thị checkbox/radio.
4. **Nhất quán đơn vị**: Có cảnh báo real-time khi chọn sai đơn vị chủ đạo và hiển thị confirm dialog khi submit sản phẩm có đơn vị khác biệt.
5. **Đồng bộ tự động**: Hệ thống phải tự động tạo term mới cho thuộc tính range nếu term đó chưa có trong DB trước khi lưu sản phẩm.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi TypeScript do kiểu dữ liệu của Convex ID hoặc các state mới.
* **Hoàn tác**: Sử dụng `git checkout` để rollback về commit gần nhất nếu phát hiện lỗi nghiêm trọng ảnh hưởng đến luồng lưu sản phẩm hiện có.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không refactor hệ thống lọc tại trang danh sách sản phẩm storefront. Chỉ tập trung tối ưu hóa giao diện quản trị Admin và đồng nhất cơ sở dữ liệu.
* Không thay đổi schema database của Convex.
