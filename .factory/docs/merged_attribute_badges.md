# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi một sản phẩm được gán nhiều thuộc tính thuộc cùng một nhóm (ví dụ: chọn cả 2 giống nho là `Merlot` và `Primitivo` cho một chai rượu), giao diện public chỉ hiển thị một giống nho duy nhất. Điều này xảy ra do hai nguyên nhân: một là người dùng có thể chưa nhấn nút "Lưu thay đổi" trong trang admin; hai là component hiển thị badge (`ProductAttributesBadges`) đang render phẳng từng thuộc tính riêng lẻ và giới hạn hiển thị tối đa 4 thuộc tính.
* **Giải pháp**: 
  1. Nhắc nhở người dùng nhấn nút **"Lưu thay đổi"** màu xanh dương ở góc dưới admin để ghi nhận dữ liệu mới vào cơ sở dữ liệu.
  2. Tái cấu trúc logic hiển thị của component `ProductAttributesBadges` để gộp các thuộc tính cùng nhóm lại với nhau và ngăn cách bằng dấu phẩy (ví dụ: `🍇 Merlot, Primitivo`).
* **Kết quả**: Giao diện hiển thị đầy đủ, chính xác, tự giải thích và vô cùng gọn gàng.

## 2. Elaboration & Self-Explanation
* **Giải thích chi tiết**: Hiện tại, dữ liệu thuộc tính của sản phẩm được truyền xuống client dưới dạng một danh sách phẳng. Component `ProductAttributesBadges` lặp qua danh sách này, sắp xếp theo thứ tự ưu tiên (Thương hiệu -> Quốc gia -> Giống nho -> Hương vị) và cắt lấy tối đa 4 thuộc tính đầu tiên để hiển thị thành các badge riêng biệt.
* Nếu sản phẩm được gán cả 2 giống nho, chúng sẽ được coi là 2 thuộc tính độc lập và chiếm 2 vị trí hiển thị badge. Khi đó, thuộc tính hương vị (đứng thứ 5) sẽ bị ẩn đi. Ngược lại, nếu người dùng chưa nhấn "Lưu thay đổi" trong admin thì database mới chỉ ghi nhận 1 giống nho từ trước.
* Bằng cách gộp nhóm thuộc tính (Group-based merging), chúng ta sẽ gộp tất cả các giá trị thuộc tính có cùng nhóm lại với nhau thành một badge duy nhất. Ví dụ, thay vì hiển thị hai badge trùng lặp icon `🍇 Merlot` và `🍇 Primitivo`, chúng ta sẽ hiển thị duy nhất một badge thông thái `🍇 Merlot, Primitivo`. Điều này giúp tiết kiệm không gian hiển thị, giữ nguyên được các badge quan trọng khác như xuất xứ hay hương vị, đồng thời phản ánh chính xác cấu trúc blend của chai rượu.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Hãy tưởng tượng bạn đang xem thông tin cấu hình của một chiếc máy tính xách tay. Thay vì hiển thị hai dòng thông số rời rạc:
  * 💾 Ổ cứng: SSD 256GB
  * 💾 Ổ cứng: HDD 1TB
* Nhà bán hàng thông minh sẽ gộp lại thành một dòng cực kỳ trực quan và gọn gàng:
  * 💾 Ổ cứng: SSD 256GB, HDD 1TB
* Việc này giúp người mua hiểu ngay cấu hình lưu trữ của máy trong một cái liếc mắt (Self-explanatory) mà không làm rối mắt hay chiếm chỗ hiển thị của thông số Card đồ họa hay RAM.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Trạng thái hiện tại**:
  * Component hiển thị badge nằm ở: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/products/ProductsPage.tsx) (dòng 1650 - 1699).
  * Component này đang sử dụng `.slice(0, 4)` trực tiếp trên danh sách `sortedTerms` phẳng để render các phần tử độc lập.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Độ tin cậy nguyên nhân gốc (Root Cause Confidence)**: **High (Cao)**
  * *Lý do*: 
    1. Người dùng chưa nhấn nút **"Lưu thay đổi"** trong admin sau khi tích chọn thêm giống nho `Merlot`. Vì vậy, dữ liệu Merlot chưa thực sự tồn tại trong database Convex cho sản phẩm này.
    2. Thiết kế ban đầu của component `ProductAttributesBadges` render phẳng từng term riêng lẻ mà không gộp nhóm. Nếu sau khi lưu, số lượng thuộc tính vượt quá 4, các thuộc tính phía sau (như hương vị `Gỗ sồi`) sẽ bị đẩy ra ngoài và biến mất.
* **Giả thuyết đối chứng (Counter-Hypothesis)**:
  * Nếu chỉ hiển thị phẳng từng thuộc tính mà không gộp, khi sản phẩm có nhiều thuộc tính thuộc cùng một nhóm (ví dụ: một chai rượu blend từ 3 giống nho), giao diện sẽ bị tràn ngập bởi các badge có cùng icon `🍇` và làm mất đi các badge hữu ích khác (Thương hiệu, Quốc gia). Do đó, phương án gộp nhóm theo dấu phẩy là tối ưu nhất cả về mặt thẩm mỹ lẫn thông tin truyền tải.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất cập nhật component `ProductAttributesBadges` trong file `ProductsPage.tsx` như sau:

## 1. Nhóm các thuộc tính theo groupId:
```typescript
  const groupMap = new Map<string, { group: any; termNames: string[]; termIds: string[] }>();
  for (const term of terms) {
    const groupId = term.group._id;
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        group: term.group,
        termNames: [],
        termIds: []
      });
    }
    const groupData = groupMap.get(groupId)!;
    groupData.termNames.push(term.name);
    groupData.termIds.push(term._id);
  }
```

## 2. Gộp tên các thuộc tính bằng dấu phẩy:
```typescript
  const mergedGroups = Array.from(groupMap.values()).map(g => ({
    _id: g.termIds.join('-'),
    group: g.group,
    name: g.termNames.join(', '),
  }));
```

## 3. Sắp xếp và hiển thị tối đa 4 nhóm thuộc tính:
* Sắp xếp theo `priorityCodes` (`['brand', 'country', 'grape', 'flavor']`).
* Sử dụng `.slice(0, 4)` trên danh sách nhóm đã gộp để render các badge.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Site Components
* **Sửa**: [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/products/ProductsPage.tsx)
  * *Vai trò*: File chứa component hiển thị danh sách sản phẩm và component hiển thị badge thuộc tính.
  * *Thay đổi*: Cập nhật logic của component `ProductAttributesBadges` để gộp các thuộc tính cùng nhóm lại trước khi hiển thị.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1: Cập nhật component `ProductAttributesBadges` trong `ProductsPage.tsx`**
   * Triển khai thuật toán gộp nhóm sử dụng `Map` và nối chuỗi bằng `.join(', ')`.
2. **Bước 2: Kiểm tra biên dịch TypeScript**
   * Chạy `bunx tsc --noEmit` để đảm bảo code không có bất kỳ lỗi biên dịch nào.
3. **Bước 3: Xác nhận hoàn thành**
   * Chạy âm báo PowerShell hoàn thành tác vụ.
4. **Bước 4: Hướng dẫn người dùng**
   * Nhắc nhở người dùng nhấn nút **"Lưu thay đổi"** trong admin và kiểm tra kết quả ngoài trang public.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tĩnh (Static Verification)
* **Lệnh chạy**: `bunx tsc --noEmit`
* **Tiêu chí**: Biên dịch thành công 100%.

### Kiểm chứng trực quan (Manual Verification)
* Người dùng mở trang sửa sản phẩm trong admin, chọn 2 giống nho (Merlot và Primitivo) rồi **bấm nút "Lưu thay đổi" ở góc dưới bên phải**.
* Mở trang public của sản phẩm đó:
  * Badge giống nho hiển thị gộp: `🍇 Merlot, Primitivo` cực kỳ gọn gàng.
  * Các badge Thương hiệu, Quốc gia, Hương vị vẫn hiển thị đầy đủ bên cạnh mà không bị ẩn đi.

---

# VIII. Todo

- [ ] Tạo file spec thiết kế tại `.factory/docs/merged_attribute_badges.md` (Đang thực hiện).
- [ ] Chỉnh sửa component `ProductAttributesBadges` trong `app/(site)/_components/products/ProductsPage.tsx`.
- [ ] Chạy kiểm tra kiểu tĩnh TypeScript: `bunx tsc --noEmit`.
- [ ] Kích hoạt âm báo hoàn thành bằng PowerShell.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Khi sản phẩm được gán nhiều thuộc tính cùng nhóm, các thuộc tính đó phải được hiển thị gộp chung trên 1 badge duy nhất, phân tách bằng dấu phẩy.
* Các badge thuộc nhóm khác (Thương hiệu, Quốc gia, Hương vị) vẫn hiển thị bình thường.
* Biên dịch TypeScript thành công 100%.

---

# X. Risk / Rollback (Rùi ro / Hoàn tác)

* **Rủi ro**: Nếu chuỗi tên gộp quá dài, badge có thể bị tràn khung hiển thị.
* **Giải pháp**: Component đã được tích hợp class `truncate` và `max-w-full` để tự động thu gọn phần chữ thừa bằng dấu ba chấm (`...`) một cách thanh lịch.
* **Hoàn tác**: Khôi phục file `ProductsPage.tsx` bằng Git nếu xảy ra lỗi ngoài ý muốn.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không chỉnh sửa logic lưu dữ liệu hay bất kỳ Convex query/mutation nào.
