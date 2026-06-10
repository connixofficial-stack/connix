# I. Primer (Khái niệm cơ bản)

## 1. TL;DR kiểu Feynman (Tóm tắt kiểu Feynman)
*   **Vấn đề:** Khi thiết lập "Dính sát" (spacing: 'none') cho highlights (tính năng nổi bật) dưới ảnh sản phẩm, giao diện hiện tại trông rời rạc, thô ("lỏ") ở cả 4 layout (Classic, Modern, Minimal, Premium) do icon quá to, bố cục dọc thô sơ, các hộp background chia cắt vụn vặt và ảnh chính vẫn giữ khoảng cách (margin/padding/border-radius). Đặc biệt rõ ràng hơn khi sản phẩm chỉ có 1 ảnh chính và không có ảnh phụ.
*   **Giải pháp:** 
    1. Thiết kế lại phần Highlights theo phong cách Premium Apple-style: Chuyển từ bố cục dọc (stacked) sang bố cục ngang (inline) tinh tế, icon nhỏ gọn bọc viền tròn mờ, chữ đi kèm nằm bên phải. Flexwrap tự động co giãn thay vì chia cột grid cứng nhắc.
    2. Khi "Dính sát" (spacing: 'none') và không có ảnh phụ: Khớp Highlights trực tiếp vào mép dưới của ảnh chính bằng cách triệt tiêu margin-bottom và góc bo dưới của ảnh (`rounded-b-none`), đồng thời gỡ bo góc trên của block Highlights (`rounded-t-none`). Highlights và ảnh chính sẽ ghép liền mạch thành một khối Card thống nhất, sang trọng.
    3. Đồng bộ hóa cả 4 layout chính trên Site render thực tế và Preview trong trang cấu hình admin.

## 2. Elaboration & Self-Explanation (Giải thích chi tiết & Tự giải thích)
Hiện tại, Highlights đang hiển thị theo dạng: Icon to (24px) xếp chồng lên trên Text. Khi dính sát (`spacing === 'none'`), các layout vẫn giữ nguyên cấu trúc container ảnh có khoảng cách ở dưới (`mb-3` hoặc `mb-4`). Block Highlights phía dưới vẫn bo tròn cả 4 góc, tạo cảm giác hai khối riêng biệt bị ép sát vào nhau một cách cưỡng ép chứ không hòa quyện. Riêng Premium style còn chia Highlights thành 3 chiếc hộp nhỏ có màu nền rời rạc, trông rất vụn vặt và thiếu tính liên kết.

Khi nâng cấp lên chuẩn Apple:
*   Mỗi item là một cụm nằm ngang: `[Icon nhỏ 15px] [Text bên phải]`.
*   Cả block Highlights được bọc trong một container duy nhất với background xám rất nhẹ (`#f5f5f7` hoặc tương đương màu nền dịu mắt).
*   Khi dính sát và sản phẩm chỉ có duy nhất 1 ảnh chính: Ảnh chính sẽ mở góc ở đáy (`rounded-b-none` thay vì `rounded-2xl` hay `rounded-xl`), container ảnh triệt tiêu margin-bottom. Highlights container sẽ mở góc ở đỉnh (`rounded-t-none`) và ghép khít khao vào đáy ảnh. Toàn bộ cụm ảnh và highlights trở thành một chiếc Card hoàn chỉnh, sang xịn mịn.

## 3. Concrete Examples & Analogies (Ví dụ cụ thể & Minh họa tương đồng)
*   **Minh họa tương đồng:** Tưởng tượng bạn có 2 tấm ghép lego. Nếu cả hai đều bo tròn các góc và xếp chồng sát nhau, giữa chúng sẽ có khe hở hình chữ V trông rất lệch lạc. Để ghép sát hoàn hảo, ta phải cắt phẳng cạnh tiếp xúc của cả hai miếng lego (ảnh chính phẳng cạnh đáy, Highlights phẳng cạnh đỉnh). Khi ghép lại, chúng sẽ khớp khít như một miếng lego liền khối duy nhất.
*   **Ví dụ thực tế:** Trên trang bán iPhone của Apple Store, phần vận chuyển miễn phí và hoàn trả dễ dàng được hiển thị thành một dải ngang tinh tế ngay sát mép dưới cụm gallery ảnh, dùng icon nét mảnh, chữ nhỏ màu xám nhạt, tạo cảm giác vô cùng sạch sẽ và cao cấp.

---

# II. Audit Summary (Tóm tắt kiểm tra)
*   **ClassicStyle:** Container ảnh chính có class `mb-3 md:mb-4`, ảnh chính có bo góc `rounded-2xl`. Khi `highlightsSpacing === 'none'` và không có ảnh phụ, khoảng cách vẫn tồn tại và góc bo không ăn khớp.
*   **PremiumStyle:** Container ảnh chính nằm trong flex gap, cột trái dùng `space-y-4` khiến highlights bị đẩy ra xa. Từng item highlights có background rời rạc và dùng layout stacked (icon trên chữ dưới).
*   **ModernStyle:** Ảnh chính dùng `rounded-xl`, container có margin-bottom.
*   **MinimalStyle:** Cột trái có thumbnail bên trái và ảnh chính bên phải. Ảnh chính dùng `rounded-sm`.
*   **HighlightsGrid (dùng chung cho Modern/Minimal):** Render dạng stacked grid-cols-3 thô sơ, không hỗ trợ ghép sát hay bo góc tùy biến theo layout/ảnh phụ.
*   **ProductDetailPreview (renderHighlights):** Code preview bị duplicate với `HighlightsGrid` và cũng render dạng stacked thô sơ, chưa đồng bộ hóa thiết kế mới.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc:** 
    1. Spacing none hiện tại mới chỉ tác động lên `margin-top: 0` của highlights, chưa gỡ bỏ `margin-bottom` của container ảnh chính phía trên.
    2. Bo góc của ảnh chính (`rounded-2xl`/`rounded-xl`) và block highlights (`rounded-xl`/`rounded-2xl`) vẫn bo tròn cả 4 góc, gây ra khe hở thị giác khó chịu khi ép sát.
    3. Thiết kế bên trong của highlights (stacked, icon to, grid cứng nhắc) đã lỗi thời, không phản ánh đúng chuẩn UI/UX hiện đại của Apple Store (vốn dùng inline flex-wrap và text/icon nhỏ gọn tinh tế).
*   **Giả thuyết đối chứng:** Nếu ta chỉ sửa CSS spacing mà không gỡ bo góc và margin-bottom của ảnh chính, giao diện khi dính sát vẫn sẽ bị rời rạc do khe hở bo góc và khoảng trống mặc định từ thẻ ảnh. Chỉ khi gỡ đồng bộ (`rounded-b-none` ở ảnh và `rounded-t-none` ở highlights) thì mới đạt được hiệu ứng "Card liền khối" hoàn hảo.

---

# IV. Proposal (Đề xuất)
1.  **Thiết kế lại HighlightsGrid trong [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx):**
    *   Hỗ trợ inline layout: `flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5`.
    *   Item: Icon 15px bọc trong vòng tròn mờ, text nhỏ 11-12px nằm bên phải, font medium/semibold.
    *   Khi `spacing === 'none'` và `isSingleImage === true`: Container highlights sẽ có `rounded-t-none` và `rounded-b-2xl` (hoặc `rounded-b-sm` cho Minimal), không border trên, background xám nhạt mịn màng.
2.  **Đồng bộ thiết kế trong [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx):**
    *   Cập nhật hàm `renderHighlights` để render giao diện inline, flex-wrap, bo góc khít khao tương tự như `HighlightsGrid` trên site thật.
3.  **Cập nhật cấu trúc ảnh chính ở cả 4 Layout Style (trong cả Site thật và Preview):**
    *   Kiểm tra điều kiện `isSingleImage = images.length <= 1`.
    *   Nếu `spacing === 'none'` và `position === 'image_column'` (hoặc khác 'info_column' ở Premium) và `isSingleImage`:
        *   Container ảnh chính: Đổi `mb-3 md:mb-4` thành `mb-0` (hoặc loại bỏ margin bottom).
        *   Khung ảnh chính (div chứa ảnh/slide): Đổi bo góc dưới thành vuông (`rounded-b-none`).
        *   Block highlights ở ngay dưới: Đổi bo góc trên thành vuông (`rounded-t-none`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)
*   **Sửa:** [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/details/ProductDetailPage.tsx)
    *   *Vai trò hiện tại:* Chứa logic render chi tiết sản phẩm trên site thật cho cả 4 layout.
    *   *Thay đổi:* Cải tiến `HighlightsGrid`, cập nhật class bo góc và margin cho ảnh chính & highlights trong 4 style: `ClassicStyle`, `PremiumStyle`, `ModernStyle`, `MinimalStyle`.
*   **Sửa:** [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
    *   *Vai trò hiện tại:* Render giao diện preview của trang chi tiết sản phẩm trong admin.
    *   *Thay đổi:* Đồng bộ hàm `renderHighlights`, cập nhật class bo góc và margin cho ảnh chính & highlights trong preview của cả 4 layout tương tự như site thật.

---

# VI. Execution Preview (Xem trước thực thi)
1.  **Chỉnh sửa `HighlightsGrid`:** Thay đổi cách render sang phong cách inline flex-wrap, icon nhỏ bên trái chữ, xử lý bo góc ghép sát.
2.  **Chỉnh sửa `ClassicStyle` (Site thật + Preview):** Thêm biến `isSingleImage`, điều chỉnh class margin của container ảnh và class bo góc của ảnh chính + Highlights.
3.  **Chỉnh sửa `PremiumStyle` (Site thật + Preview):** Áp dụng Highlights mới cho cả 2 vị trí (`image_column` và `info_column`), gỡ bỏ layout 3 box vụn vặt, cập nhật class bo góc của ảnh chính khi dính sát.
4.  **Chỉnh sửa `ModernStyle` & `MinimalStyle` (Site thật + Preview):** Cập nhật bo góc của ảnh chính và truyền đầy đủ props `spacing`, `layoutStyle`, `isSingleImage` vào `HighlightsGrid` / `renderHighlights`.
5.  **Review tĩnh và chạy verification.**

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
*   Chạy typecheck toàn dự án để đảm bảo không lỗi cú pháp hoặc thiếu prop:
    `bunx tsc --noEmit`

### Manual Verification
1.  **Trang cấu hình admin (`/system/experiences/product-detail`):**
    *   Kiểm tra cả 4 layout (Classic, Modern, Minimal, Premium) ở chế độ "Dính sát" (none spacing) và chế độ bình thường.
    *   Xác nhận Highlights hiển thị đúng phong cách Apple (dải ngang tinh tế, icon bên trái chữ).
    *   Khi không có ảnh phụ (chỉ có 1 ảnh chính): Xác nhận ảnh chính và dải Highlights ghép sát liền mạch thành một khối Card hoàn hảo (không bị khoảng cách và bo góc trùng khít).
2.  **Site thực tế (`/products/[slug]`):**
    *   F5 kiểm tra xem thay đổi có phản ánh chính xác 100% so với preview trong admin hay không.
    *   Kiểm tra responsive trên thiết bị di động (highlights tự động quấn dòng mượt mà nhờ flex-wrap).

---

# VIII. Todo
- [ ] Cập nhật định nghĩa và UI render của `HighlightsGrid` trong `ProductDetailPage.tsx` sang Apple-style (inline, flex-wrap, custom bo góc khi dính sát).
- [ ] Cập nhật `ClassicStyle` trong `ProductDetailPage.tsx`: Xử lý `isSingleImage`, class margin của container ảnh, bo góc ảnh chính và component `HighlightsGrid`.
- [ ] Cập nhật `PremiumStyle` trong `ProductDetailPage.tsx`: Xử lý `isSingleImage`, bo góc ảnh chính và thay thế code render highlights bằng `HighlightsGrid` mới (cho cả `image_column` và `info_column`).
- [ ] Cập nhật `ModernStyle` trong `ProductDetailPage.tsx`: Xử lý `isSingleImage`, bo góc ảnh chính và truyền prop vào `HighlightsGrid`.
- [ ] Cập nhật `MinimalStyle` trong `ProductDetailPage.tsx`: Xử lý `isSingleImage`, bo góc ảnh chính và truyền prop vào `HighlightsGrid`.
- [ ] Đồng bộ hóa toàn bộ logic trên vào `ProductDetailPreview.tsx` (cập nhật `renderHighlights`, các layout preview tương ứng).
- [ ] Kiểm tra lỗi typecheck `bunx tsc --noEmit`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Giao diện Highlights mới:** Không còn dạng cột dọc icon to (lỏ). Thay thế hoàn toàn bằng dải ngang flex-wrap, icon 15-16px tinh tế nằm bên trái text, khoảng cách cân đối, chữ rõ ràng dễ đọc.
*   **Trạng thái "Dính sát" (spacing: 'none'):** 
    *   Nếu có ảnh phụ: Highlights nằm sát dưới ảnh/thumbnail, khoảng cách nhỏ sạch sẽ.
    *   If KHÔNG có ảnh phụ (chỉ 1 ảnh chính): Cạnh dưới ảnh chính và cạnh trên Highlights ghép khít khao 100% (cạnh đáy ảnh vuông góc, cạnh đỉnh highlights vuông góc, margin = 0). Chúng tạo thành một chiếc Card hoàn chỉnh.
*   **Tính đồng bộ:** Hoạt động nhất quán trên cả 4 layout (Classic, Modern, Minimal, Premium) trên cả môi trường Preview Admin và trang chi tiết sản phẩm thực tế trên Site.
*   **TypeScript & Lint:** Code build thành công, không phát sinh lỗi type.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   *Rủi ro:* Một số sản phẩm có text highlight quá dài có thể bị quấn dòng gây lệch layout.
*   *Giải pháp:* Dùng flex-wrap và `max-w-[200px]` cùng `line-clamp-2` cho text highlight để đảm bảo chữ không bị tràn hoặc đẩy các item khác xuống quá sâu.
*   *Rollback:* Nếu có lỗi, khôi phục lại file `ProductDetailPage.tsx` và `ProductDetailPreview.tsx` bằng git checkout.

---

# XI. Out of Scope (Ngoài phạm vi)
*   Chỉnh sửa các tính năng khác của trang chi tiết sản phẩm như nút mua hàng, comment, FAQ, hoặc các phần cấu hình không liên quan đến Highlights.

---

# XII. Open Questions (Câu hỏi mở)
*(Không có)*
