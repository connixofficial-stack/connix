# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Menu 3 cấp (ví dụ: Sản phẩm -> Thiết bị -> Vòng bi) đang hiển thị dạng dọc. Khi hover vào mục cấp 2, menu cấp 3 bay ngang ra thì bị khung cha "cắt cụt" (không nhìn thấy gì) vì khung cha đang bật tính năng tự cuộn và giới hạn chiều cao tối đa (`overflow-y-auto`).
* **Giải pháp**: 
  1. Chuyển các menu từ 3 cấp trở lên sang hiển thị dạng Mega Menu chia cột (to, rộng, thoáng) thay vì dropdown dọc chật hẹp.
  2. Đối với các dropdown dọc thông thường, nếu phát hiện có chứa menu con bay ngang (đa cấp), ta sẽ tắt thuộc tính tự cuộn và giới hạn chiều cao (`overflow` thành mặc định và bỏ giới hạn chiều cao) để menu con bay ra thoải mái. Nếu là menu phẳng (không có con bay ngang), ta giữ nguyên thuộc tính tự cuộn để tránh menu quá dài làm xấu giao diện.

## 2. Elaboration & Self-Explanation
Hệ thống hiện tại phân loại menu thành hai dạng hiển thị trên Desktop:
* **Mega Menu (Deep Menu)**: Dành cho các cấu trúc menu phức tạp, nhiều cấp. Hiện tại đang cấu hình cho các menu có từ 4 cấp trở lên (`>= 4`). Giao diện Mega Menu sẽ trải rộng ra toàn màn hình và chia các nhóm danh mục thành các cột rõ ràng.
* **Dropdown Menu dọc**: Dành cho các menu ít cấp hơn (dưới 4 cấp). Giao diện là một hộp dọc đổ xuống.

**Vấn đề phát sinh**: 
* Menu 3 cấp (level 3) đang được xếp vào nhóm Dropdown Menu dọc. Khi người dùng hover vào một mục cấp 2, hệ thống sẽ render một flyout (khung bay ngang) chứa các mục cấp 3 nằm bên cạnh.
* Tuy nhiên, để tránh trường hợp danh sách dropdown quá dài đè lên chân trang, các dropdown dọc đều được gán class `overflow-y-auto` và `max-height: 290px` vô điều kiện.
* Theo quy tắc hiển thị của CSS, khi một container cha có `overflow-y-auto` (hoặc `overflow: hidden`), mọi phần tử con định vị tuyệt đối (`position: absolute`) nằm ngoài biên giới hạn của container cha đó sẽ bị cắt bỏ (clipping). Điều này khiến menu cấp 3 hoàn toàn bị biến mất hoặc gây ra các thanh cuộn ngang cực kỳ xấu xí trong dropdown cha, khiến người dùng không thể thao tác được.

**Cách xử lý học hỏi từ ktec**:
* Thay đổi điều kiện nhận diện Mega Menu thành `>= 3`. Cấu trúc 3 cấp là đủ phức tạp để biểu diễn dạng Mega Menu chia cột, giúp người dùng nhìn tổng quan toàn bộ danh mục sản phẩm thay vì phải hover nhiều lần.
* Thay đổi CSS của Dropdown dọc: Trước khi render, ta chạy một hàm kiểm tra xem dropdown đó có chứa bất kỳ mục con nào có menu con tiếp theo hay không (`some((child) => child.children && child.children.length > 0)`).
  * Nếu **có**: Đặt `overflow` thành mặc định (visible) và bỏ thuộc tính `maxHeight` để các flyout con hiển thị tràn ra ngoài bình thường.
  * Nếu **không**: Giữ nguyên `overflow-y-auto` và `max-height` để tối ưu hóa cuộn cho menu phẳng danh sách dài.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  Cấu trúc danh mục sản phẩm của ktec:
  ```
  Danh sách sản phẩm (cấp 1)
   ├── Thiết bị truyền động (cấp 2)
   │    └── Vòng bi, Cáp xích, Motor - hộp số (cấp 3)
   └── Thiết bị thủy lực (cấp 2)
        └── Bơm thủy lực, Van thủy lực (cấp 3)
  ```
  * *Trước khi sửa*: Hover vào "Danh sách sản phẩm" ra dropdown dọc. Hover tiếp vào "Thiết bị truyền động" thì không thấy "Vòng bi, Cáp xích..." đâu cả, hoặc dropdown cha xuất hiện thanh cuộn ngang/dọc rất khó dùng.
  * *Sau khi sửa*: Hover vào "Danh sách sản phẩm" lập tức mở ra Mega Menu chia thành các cột "Thiết bị truyền động", "Thiết bị thủy lực" trực quan, bên dưới mỗi cột ghi rõ các mục cấp 3 tương ứng.
* **Minh họa ẩn dụ**: 
  Dropdown cha giống như một hành lang hẹp có tường kính bao quanh (`overflow-y-auto`). Khi bạn mở một cánh cửa phòng con ở hai bên hành lang (menu cấp 3 bay ngang), cánh cửa đó đập sầm vào tường kính và không thể mở ra được. Giải pháp là ta dỡ bỏ bức tường kính đó đi (bỏ `overflow-y-auto`), hoặc chuyển hẳn sang một sảnh hội nghị lớn (Mega Menu) nơi mọi danh mục được bày biện trên các bàn trưng bày riêng biệt (chia cột).

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Vị trí code cần sửa**: Trong file [Header.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/Header.tsx):
  * Dòng 564: Hàm `isDeepMenuForItem` hiện tại đang check level `>= 4`.
  * Các khối dropdown dọc trong cả 3 giao diện Layout (`classic`, `topbar`, `allbirds`) đang cấu hình cứng class `overflow-y-auto scrollbar-menu-thin` và style `maxHeight: 'min(70vh, 290px)'`.
* **Tình trạng dữ liệu**: Dữ liệu menu từ Convex hoạt động ổn định và chính xác cấu trúc cha - con. Vấn đề nằm hoàn toàn ở giao diện CSS hiển thị trên trình duyệt.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: CSS `overflow-y-auto` kết hợp với `max-height` giới hạn trên phần tử cha (`relative` hoặc `absolute`) kích hoạt cơ chế clipping (cắt xén nội dung) đối với các phần tử con có thuộc tính `position: absolute` bay ra ngoài biên của cha.
* **Độ tin cậy nguyên nhân gốc**: **High (Cao)** - Đây là hành vi dựng hình chuẩn của trình duyệt theo đặc tả W3C CSS Box Model. Việc gỡ bỏ `overflow` trong DevTools ngay lập tức sửa được lỗi hiển thị flyout menu cấp 3.
* **Giả thuyết đối chứng**: z-index của menu cấp 3 thấp hơn các phần tử khác trên trang web dẫn đến bị che khuất?
  * *Bác bỏ*: Kiểm tra DOM cho thấy menu con cấp 3 đã được render vào HTML và z-index của nó rất cao, nhưng do container dropdown cha bị giới hạn kích thước vật lý bởi `maxHeight` và `overflow-y-auto` nên trình duyệt không vẽ phần nhô ra ngoài của menu cấp 3.

---

# IV. Proposal (Đề xuất)

1. Cập nhật hàm `isDeepMenuForItem` trong [Header.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/Header.tsx) để nâng cấp các menu từ 3 cấp lên Mega Menu:
   ```typescript
   const isDeepMenuForItem = useCallback((itemId: Id<'menuItems'>) => (maxLevelByRootId.get(itemId) ?? 1) >= 3, [maxLevelByRootId]);
   ```
2. Thêm logic kiểm tra xem danh sách menu con có chứa menu đa cấp hay không:
   ```typescript
   const hasSubChildren = item.children.some((child) => child.children && child.children.length > 0);
   ```
3. Điều kiện hóa việc gán class `overflow-y-auto scrollbar-menu-thin` và thuộc tính style `maxHeight` cho tất cả các container dropdown dọc trong file `Header.tsx` (áp dụng cho các layouts: `classic`, `topbar`, `allbirds` và hàm render flyout chung):
   * ClassName:
     ```typescript
     !item.children.some((child) => child.children && child.children.length > 0) && "overflow-y-auto scrollbar-menu-thin"
     ```
   * Style:
     ```typescript
     maxHeight: !item.children.some((child) => child.children && child.children.length > 0) ? 'min(70vh, 290px)' : undefined
     ```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**: [components/site/Header.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/Header.tsx)
  * Vai trò hiện tại: Quản lý toàn bộ thanh Header điều hướng và hiển thị menu trên Desktop/Mobile của website.
  * Thay đổi: Sửa logic nhận diện Mega Menu và gán CSS dropdown động dựa trên sự tồn tại của danh mục con đa cấp.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Tìm hàm `isDeepMenuForItem` trong `Header.tsx` và cập nhật điều kiện `>= 4` thành `>= 3`.
2. **Bước 2**: Xác định tất cả các khối JSX render dropdown menu dọc thường (bao gồm cả hàm helper `renderDesktopFlyoutNodes` và các khối dropdown chính của từng layout).
3. **Bước 3**: Cập nhật class và style của dropdown để loại bỏ `overflow-y-auto` và `maxHeight` khi phát hiện danh mục con có chứa phần tử cháu.
4. **Bước 4**: Biên dịch tĩnh và chạy type-check để đảm bảo không lỗi cú pháp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy kiểm tra lỗi TypeScript toàn dự án:
  `bunx tsc --noEmit`

### Manual Verification
* Deploy lên môi trường local hoặc staging và kiểm tra:
  * Di chuột vào menu 3 cấp: Đảm bảo giao diện Mega Menu chia cột hiển thị đúng, rộng rãi và cân đối.
  * Di chuột vào menu dọc thông thường chứa flyout: Đảm bảo khi di chuột vào mục cấp 2, flyout cấp 3 hiện ra mượt mà bên cạnh mà không bị cắt xén hay bị cuộn ẩn.
  * Di chuột vào menu dọc phẳng (chỉ có 1 cấp con): Đảm bảo dropdown vẫn hiển thị thanh cuộn (`overflow-y-auto`) và có chiều cao tối đa giới hạn như cũ để tránh tràn giao diện nếu danh sách quá dài.

---

# VIII. Todo

- [ ] Thay đổi điều kiện `isDeepMenuForItem` thành `>= 3` trong [Header.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/Header.tsx).
- [ ] Cập nhật class/style cho dropdown trong `renderDesktopFlyoutNodes` (phần render đệ quy các flyout cấp sâu).
- [ ] Cập nhật class/style cho dropdown cấp 1 của Layout `classic` (khi không phải Mega Menu).
- [ ] Cập nhật class/style cho dropdown cấp 1 của Layout `topbar`.
- [ ] Cập nhật class/style cho dropdown cấp 1 của Layout `allbirds`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Các cấu trúc menu có độ sâu 3 cấp tự động chuyển đổi sang Mega Menu chia cột thay vì dropdown dọc thông thường.
* Tất cả menu dọc có chứa mục con (flyout) hiển thị hoàn chỉnh menu con bay ngang khi hover, không bị che khuất bởi thuộc tính overflow.
* Giao diện dropdown của menu phẳng (không chứa flyout) vẫn giữ nguyên tính năng cuộn mượt và giới hạn chiều cao tối đa.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Một số menu 3 cấp trước đó đang hiển thị dạng dọc nay sẽ chuyển sang dạng Mega Menu rộng. Đây là hành vi tối ưu hơn cho trải nghiệm người dùng nhưng cần đảm bảo admin đã cấu hình đúng cấu trúc danh mục trong Convex.
* **Hoàn tác**: Khôi phục lại file `Header.tsx` từ git:
  `git checkout components/site/Header.tsx`

---

# XI. Out of Scope (Ngoài phạm vi)

* Thay đổi cấu trúc dữ liệu lưu trữ menu trong cơ sở dữ liệu Convex.
* Sửa đổi menu trên thiết bị di động (Mobile Menu) vì Mobile Menu hiển thị dạng accordion dọc dạng cuộn lồng nhau, không bị ảnh hưởng bởi lỗi hover flyout.
