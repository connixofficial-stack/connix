# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi click nút Toggle All ở sticky footer trên trang Create Hero, các section không có phản ứng đóng/mở.
*   **Nguyên nhân:** Lỗi logic ngược (`nextState = !hasClosedSection` thay vì `hasClosedSection`). Khi tất cả các mục đang mở (`hasClosedSection = false`), click nút sẽ gán giá trị tiếp theo là `!false = true` (giữ nguyên mở), khiến nút bấm có vẻ bị đơ và không đóng các mục lại được.
*   **Giải pháp:** Sửa logic gán trạng thái tiếp theo trong hàm `handleToggleAll` thành `const nextState = hasClosedSection;`.

## 2. Elaboration & Self-Explanation
Trong quá trình phát triển tính năng Toggle All, chúng tôi đã gặp phải một lỗi logic đảo ngược trong hàm xử lý `handleToggleAll`:
```tsx
const nextState = !hasClosedSection;
```
Hãy phân tích trạng thái hoạt động:
*   Trạng thái Mở rộng toàn bộ được biểu diễn bằng giá trị `true` của từng section.
*   `hasClosedSection` là biến boolean kiểm tra xem có bất kỳ section đang hiển thị nào bị đóng hay không (`openSections[key] === false`).
*   Khi mới vào trang Create Hero, tất cả các section đều mở (`hasClosedSection = false`).
*   Người dùng mong muốn bấm nút sẽ đóng toàn bộ các phần (`nextState = false`).
*   Tuy nhiên, do dùng phủ định `!hasClosedSection` nên hệ thống tính toán ra `nextState = !false = true`. Trạng thái của các phần tiếp tục được set là `true` (mở), dẫn đến việc không có thay đổi nào xảy ra trên giao diện và nút bấm bị đơ hoàn toàn.

Để sửa lỗi này, trạng thái tiếp theo cần được đồng bộ trực tiếp với `hasClosedSection`:
*   Nếu có mục đóng (`hasClosedSection = true`) -> Ta muốn MỞ hết -> `nextState = true`.
*   Nếu không có mục nào đóng (tất cả đều mở, `hasClosedSection = false`) -> Ta muốn ĐÓNG hết -> `nextState = false`.
Như vậy, công thức chuẩn xác tuyệt đối phải là:
```tsx
const nextState = hasClosedSection;
```

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:**
    *   *Trước khi sửa:* Tại trang Create Hero, `settings` và `slides` đều đang mở. Người dùng click nút Toggle All (mũi tên hướng lên). Hệ thống tính ra `nextState = !false = true` và set lại `{ settings: true, slides: true }`. Giao diện giữ nguyên trạng thái mở.
    *   *Sau khi sửa:* Click nút Toggle All, hệ thống tính ra `nextState = hasClosedSection = false` và set `{ settings: false, slides: false }`. Toàn bộ các phần đóng sập xuống thành công!
*   **Analogy (Hình ảnh ẩn dụ):** Giống như công tắc đèn thông minh. Lẽ ra nó phải kiểm tra: "Nếu có đèn nào đang TẮT -> Bật tất cả lên" và "Nếu toàn bộ đèn đang BẬT -> Tắt tất cả đi". Nhưng cảm biến bị lắp ngược dây, dẫn đến việc: "Nếu toàn bộ đèn đang BẬT -> Tiếp tục Bật thêm lần nữa". Kết quả là đèn vẫn sáng trưng và người dùng bấm nút hoài không tắt được điện.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã thực hiện Audit mã nguồn và xác định chính xác dòng code gây lỗi:
*   **File:** `app/admin/home-components/hero/_components/HeroForm.tsx`
*   **Vị trí:** Dòng 72 (trong hàm `handleToggleAll`).
*   **Đoạn code lỗi:** `const nextState = !hasClosedSection;`

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Audit & Root Cause Protocol
1.  **Triệu chứng quan sát được:** Click nút Toggle All ở sticky footer không đóng/mở được các section.
2.  **Môi trường ảnh hưởng:** Toàn bộ trang Create và Edit Hero Banner.
3.  **Có tái hiện ổn định không:** Có, tái hiện 100% khi tất cả các mục ở trạng thái mở hoặc đóng đồng loạt.
4.  **Giả thuyết đối chứng:** 
    *   *Giả thuyết A (Sai):* `HomeComponentFooterActionPortal` không nhận diện được click. (Bị loại trừ vì event click vẫn kích hoạt bình thường, chỉ có state không đổi giá trị thực tế do tính toán sai).
    *   *Giả thuyết B (Đúng):* Logic gán `nextState` bị ngược dấu phủ định (`!`).
5.  **Tiêu chí pass/fail sau khi sửa:**
    *   *Pass:* Click nút Toggle All ở sticky footer đóng/mở toàn bộ các section một cách mượt mà và chính xác.

---

# IV. Proposal (Đề xuất)

Sửa đổi dòng code trong hàm `handleToggleAll` tại `HeroForm.tsx`:
```diff
-    const nextState = !hasClosedSection;
+    const nextState = hasClosedSection;
```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Components

#### [MODIFY] [HeroForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/hero/_components/HeroForm.tsx)
*   **Vai trò hiện tại:** Quản lý form cấu hình Hero và chứa hàm `handleToggleAll` xử lý đóng/mở hàng loạt.
*   **Thay đổi:** Sửa lại công thức tính toán `nextState` để sửa dứt điểm lỗi logic ngược.

---

# VI. Execution Preview (Xem trước thực thi)

1.  **Sửa mã nguồn:** Sửa dòng 72 của file `HeroForm.tsx`.
2.  **Kiểm tra tĩnh:** Chạy biên dịch TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
*   Biên dịch TypeScript:
    ```powershell
    bunx tsc --noEmit
    ```

### Manual Verification
*   Vào trang Create Hero, bấm nút mũi tên ở sticky footer để xác nhận toàn bộ các phần đóng lại lập tức, và bấm lại để mở ra.

---

# VIII. Todo

- [ ] Thay thế `const nextState = !hasClosedSection;` thành `const nextState = hasClosedSection;` trong `HeroForm.tsx`.
- [ ] Chạy lệnh `bunx tsc --noEmit` để xác nhận không lỗi kiểu.
- [ ] Tiến hành git commit các thay đổi.
