# I. Primer

## 1. TL;DR kiểu Feynman
- Khi đổi layout (Hero Style) sang kiểu không cần hiển thị Nội dung (ví dụ: `slider`), code hiện tại ở hàm `buildHeroConfig` đã xoá trắng phần `content` của Hero bằng cách gán `undefined`.
- Do đó khi lưu và chuyển lại layout có nội dung (như `fullscreen`), dữ liệu `content` đã bị mất trong DB và UI hiển thị trạng thái trống/mặc định.
- Cách giải quyết: Giữ nguyên `content` khi lưu (không gắn `undefined`), để dữ liệu luôn được lưu trong DB dù layout hiện tại không hiển thị.
- Sau khi kiểm tra các component khác (như Pricing, Video, About, ...), chúng không bị lỗi này vì luôn merge/spread toàn bộ config khi lưu, không xoá dữ liệu một cách điều kiện.

## 2. Elaboration & Self-Explanation
Hiện tượng mất dữ liệu Nội dung Hero xảy ra do logic lưu form ở `HeroEditor.tsx` và `HomeComponentLegacyEditor.tsx` có đoạn kiểm tra biến `needsContent`. Nếu layout hiện tại không phải là `fullscreen`, `conquest`, `split`, hay `parallax`, biến `needsContent` sẽ mang giá trị `false`. Khi đó, thay vì lưu dữ liệu của `heroContent` vào thuộc tính `content`, hàm builder lại trả về `undefined` (`content: needsContent ? heroContent : undefined`).

Hệ quả là Convex (database) sẽ lưu giá trị `undefined` này, đồng nghĩa với việc xoá mất hoàn toàn dữ liệu `content` cũ của component. Lần tiếp theo người dùng chuyển về lại các layout cần nội dung, hệ thống không còn dữ liệu nữa nên sẽ render và hiển thị lại bằng trạng thái mặc định (trống).

Chúng ta chỉ cần bỏ việc gán `undefined` và luôn luôn gán `content: heroContent` trong payload gửi lên backend. Các layout không cần dùng `content` sẽ chỉ đơn giản là bỏ qua khối dữ liệu này lúc render giao diện người dùng, nhưng dữ liệu gốc vẫn an toàn trong database. Khi audit các component tương tự, các component khác đều truyền thẳng các state config của chúng (ví dụ `...videoConfig`, `...pricingConfig`) vào payload một cách vô điều kiện, nên không gặp lỗi tương tự.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có một chiếc túi đựng máy ảnh. Túi có 1 ngăn phụ để thẻ nhớ (tương đương Hero layout = `fullscreen`). Bạn đang để thẻ nhớ của mình trong đó. Hôm sau, bạn quyết định dùng chiếc túi khác gọn nhẹ hơn, không có ngăn đựng thẻ nhớ (Hero layout = `slider`). 
Thay vì cất chiếc thẻ nhớ ở nhà để dành (lưu lại vào DB), bạn lại ném thẳng chiếc thẻ nhớ vào thùng rác (do code gán giá trị thành `undefined`). Đến lúc bạn quay lại dùng chiếc túi có ngăn đựng ban đầu, chiếc thẻ nhớ của bạn đã biến mất vĩnh viễn!

Cách xử lý đúng là dù đổi sang chiếc túi nào, thẻ nhớ của bạn vẫn nên được cất giữ an toàn trên kệ tủ (trong Database), để khi cần thiết có thể lấy ra dùng lại ngay lập tức.

# II. Audit Summary (Tóm tắt kiểm tra)

- **Tình trạng:** Việc chuyển layout Hero sang các định dạng không dùng content (như `slider`), sau đó tiến hành lưu, rồi chuyển ngược về `fullscreen` khiến khối dữ liệu phần Nội dung (content) bị biến mất hoàn toàn.
- **Phạm vi kiểm tra:**
  1. `app/admin/home-components/hero/_components/HeroEditor.tsx` (và hàm buildHeroConfig).
  2. `app/admin/home-components/_shared/legacy/HomeComponentLegacyEditor.tsx` (cho các component cũ).
  3. Các component có chức năng đổi layout tương tự (Pricing, Video, About, ...).
- **Kết quả Audit:**
  - Lỗi xảy ra chính xác ở hàm `buildHeroConfig` trong `HeroEditor.tsx` và trong switch case `Hero/Banner` trong `HomeComponentLegacyEditor.tsx`.
  - Các component khác (Pricing, Video, v.v.) không bị dính lỗi này do đã sử dụng cơ chế spread operator (`...config`) hoặc gán dữ liệu vô điều kiện khi lưu `buildConfig`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Root Cause Confidence (Độ tin cậy nguyên nhân gốc):** High
- **Reason:** Đọc kiểm tra mã nguồn hàm `buildHeroConfig` thấy rất rõ logic: `content: needsContent ? heroContent : undefined`. Lệnh này cố tình gán dữ liệu thành `undefined` nếu layout không cần hiển thị content.
- **Counter-Hypothesis (Giả thuyết đối chứng):**
  - Có thể dữ liệu mất do React state bị reset khi Component unmount? 
    *Bác bỏ:* Trạng thái `heroContent` được lưu ở cấp component cha (`HeroEditor`), việc thay đổi state `heroStyle` không làm unmount biến state `heroContent`. Vấn đề chỉ xảy ra khi người dùng bấm Lưu (gọi API update database).
  - Có thể Convex schema giới hạn field dựa trên giá trị của thuộc tính style? 
    *Bác bỏ:* Convex cho bảng này mặc định hỗ trợ schemaless / dynamic fields cho object `config` của `homeComponents`.

# IV. Proposal (Đề xuất)

- Cập nhật hàm `buildHeroConfig` trong tệp `app/admin/home-components/hero/_components/HeroEditor.tsx`: Xoá bỏ việc kiểm tra `needsContent` khi thiết lập giá trị cho `content`. Luôn luôn gán trực tiếp `content: heroContent`.
- Cập nhật hàm `buildConfig` trong tệp `app/admin/home-components/_shared/legacy/HomeComponentLegacyEditor.tsx` tại nhánh xử lý của `Banner` và `Hero` với cách làm tương tự.
- Lợi ích: Dung lượng của đoạn `content` không đáng kể, không gây ảnh hưởng đến hiệu suất đọc ghi. Đồng thời việc này giúp bảo vệ tối đa trải nghiệm người dùng (UX) khi họ cần thử nghiệm qua lại giữa các mẫu thiết kế (Layout) khác nhau.

# V. Files Impacted (Tệp bị ảnh hưởng)

#### [MODIFY] [HeroEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/ktec/app/admin/home-components/hero/_components/HeroEditor.tsx)
- Vai trò hiện tại: Quản lý Form và lưu dữ liệu cho cấu hình Hero.
- Thay đổi: Sửa hàm `buildHeroConfig` để ngưng việc gán `undefined` và xoá đi trường `content`.

#### [MODIFY] [HomeComponentLegacyEditor.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/ktec/app/admin/home-components/_shared/legacy/HomeComponentLegacyEditor.tsx)
- Vai trò hiện tại: Trình quản lý form cho các component legacy cũ, bao gồm cả Hero/Banner.
- Thay đổi: Cập nhật hàm `buildConfig` bên trong nhánh switch case của `Hero` và `Banner` để giữ nguyên field `content`.

# VI. Execution Preview (Xem trước thực thi)

1. Mở file `HeroEditor.tsx` và điều hướng đến hàm `buildHeroConfig`. Xoá bỏ biến `needsContent` (do không còn được sử dụng) và gán `content: heroContent`.
2. Mở file `HomeComponentLegacyEditor.tsx` và điều hướng đến hàm `buildConfig` > case `Banner` & `Hero`. Chỉnh sửa tương tự: xoá `needsContent` và gán thẳng thuộc tính `content`.
3. Kiểm tra tĩnh nội dung thay đổi bằng mắt.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Review tĩnh bằng mắt mã nguồn vừa sửa đổi.
- User có thể tự xác nhận thủ công trên giao diện Admin:
  1. Cập nhật dữ liệu cho các text field trong Nội dung Hero (VD: layout `fullscreen`).
  2. Bấm Lưu.
  3. Đổi layout sang `slider` (loại không cần content). Bấm Lưu.
  4. Đổi ngược layout về `fullscreen`.
  5. Đảm bảo dữ liệu cũ vẫn xuất hiện trở lại, không bị mất đi.

# VIII. Todo

- [ ] Sửa thuộc tính gán của `content` trong hàm `buildHeroConfig` ở file `HeroEditor.tsx`.
- [ ] Sửa thuộc tính gán của `content` trong hàm `buildConfig` nhánh `Hero`/`Banner` ở file `HomeComponentLegacyEditor.tsx`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Thao tác thay đổi qua lại giữa các thiết kế (layout) trong trang quản lý chỉnh sửa Hero không được làm xoá mất dữ liệu đang có của phân vùng "Nội dung Hero".
- Khi bấm nút lưu Hero đang ở trạng thái layout `slider`, dữ liệu trong field `content` vẫn phải được duy trì an toàn trong database (có thể quan sát được khi thao tác chuyển ngược về `fullscreen`).
- Logic khắc phục phải được đồng bộ hóa hoàn toàn trên cả 2 trình chỉnh sửa là `HeroEditor.tsx` (chuẩn mới) và `HomeComponentLegacyEditor.tsx` (chế độ duy trì cũ).

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Các phần frontend/website hiển thị Hero Component nếu vô tình được lập trình theo giả định bắt buộc `content` phải có giá trị là `undefined` đối với các layout dạng `slider` thì sẽ bị ảnh hưởng. Tuy nhiên, điều này cực kỳ hiếm gặp vì giao diện phía máy khách (Client UI) thường kiểm tra loại component hoặc style trước khi render phần text, thay vì chỉ kiểm tra sự tồn tại của object.
- **Hoàn tác:** Revert (phục hồi) phiên bản file dựa theo control version `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)

- Nhiệm vụ này không bao gồm quá trình đại tu / refactor lại toàn bộ logic quản lý trạng thái của các component editor.
- Không sửa mã nguồn cho các component khác ngoài Hero/Banner (đã audit kỹ càng và khẳng định các component khác như Pricing, Video không dính lỗi tương tự này).
