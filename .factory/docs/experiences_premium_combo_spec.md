# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1 (Admin Edit Combo)**: Khi sửa đổi các combo trong trang chỉnh sửa sản phẩm của Admin, footer "Lưu thay đổi" không nhận biết được sự thay đổi để hiển thị. Nguyên nhân là do state `combos` và snapshot ban đầu `initialSnapshotRef.current.combos` cùng trỏ đến các đối tượng giống nhau trong bộ nhớ; khi ta chỉnh sửa trực tiếp (mutate) thuộc tính của combo, ta đã vô tình cập nhật cả snapshot ban đầu, khiến việc so sánh `JSON.stringify` luôn cho kết quả giống nhau.
* **Vấn đề 2 (Aesthetics & Combo Layout)**: Trang chi tiết sản phẩm ở site thực chỉ hiển thị tối đa 2 combo, gán cứng combo thứ 2 là bán chạy, và khi không điền tên combo thì hiển thị dấu gạch `-` thô thiển. Combo mix cũng chưa được hiển thị đầy đủ và mượt mà trên layout Premium.
* **Giải pháp**:
  * **Sửa Admin Form**: Sử dụng deep clone (`JSON.parse(JSON.stringify(...))`) khi lưu snapshot ban đầu và khi cập nhật state để tránh lỗi mutate trực tiếp. Thêm kéo thả DnD bằng HTML5 để Admin dễ dàng sắp xếp thứ tự combo.
  * **Nâng cấp UI/UX Combo**: Hiển thị toàn bộ combo thường & mix bằng Embla Carousel trượt ngang mượt mà có nút trượt trái/phải. Cài đặt combo đầu tiên làm Best Seller. Tạo Modal Glassmorphism sang trọng để hiển thị chi tiết các sản phẩm kèm theo của Combo Mix khi người dùng click vào.
  * **Cấu hình Premium CTA & Icons**: Biến "MUA QUA ZALO" và "GỌI TƯ VẤN" cùng các icon nền Ribbon (Award)/Hộp quà (Gift) thành cấu hình linh hoạt trong Layout Premium (đổi text, đổi icon qua Popover Grid Picker, đổi link hoặc tự động load từ Settings hệ thống, chỉnh kích thước chữ trên mobile gọn gàng).

## 2. Elaboration & Self-Explanation
Trong lập trình React, việc biến đổi trực tiếp thuộc tính của một đối tượng trong mảng state (được gọi là Object Mutation) là một lỗi rất phổ biến nhưng lại cực kỳ nguy hiểm. Khi Admin sửa tên hoặc giá của một combo, đoạn code hiện tại tạo một bản sao nông của mảng (`const next = [...combos]`) nhưng lại sửa đổi trực tiếp phần tử bên trong (`next[index].name = e.target.value`). Vì các phần tử này chia sẻ cùng tham chiếu bộ nhớ với snapshot ban đầu (`initialSnapshotRef.current.combos`), việc chỉnh sửa này đã gián tiếp thay đổi dữ liệu của snapshot ban đầu. Do đó, hàm so sánh `hasChanges` dùng `JSON.stringify` luôn thấy hai trạng thái giống hệt nhau và Footer không bao giờ được kích hoạt. Chúng ta sẽ giải quyết triệt để lỗi này bằng cách clone sâu dữ liệu.

Đồng thời, Layout Premium cần phải toát lên vẻ sang trọng và state-of-the-art. Việc giới hạn cứng 2 combo, gán cứng Best Seller cho combo thứ 2, hiển thị dấu gạch ngang `-` khi thiếu tên combo là những điểm trừ lớn về mặt thẩm mỹ. Chúng tôi đề xuất hiển thị toàn bộ các combo thường và mix qua một băng chuyền ngang (Carousel) sử dụng Embla API. Đối với Combo Mix (gồm nhiều sản phẩm đi kèm), thay vì hiển thị danh sách dài dòng làm vỡ bố cục trang, một Modal Glassmorphism mờ ảo hiện đại sẽ xuất hiện khi người dùng click vào, hiển thị trực quan hình ảnh và số lượng từng sản phẩm trong bộ combo đó, mang lại trải nghiệm mua sắm vô cùng đẳng cấp.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế về lỗi Mutation**: Tưởng tượng bạn có một bản gốc của một hợp đồng đặt trong tủ kính (`initialSnapshotRef`). Bạn muốn soạn thảo một bản nháp mới để chỉnh sửa (`combos` state). Tuy nhiên, thay vì photo ra một bản sao hoàn toàn mới, bạn lại dùng một chiếc bút mực ma thuật viết trực tiếp lên bản gốc trong tủ kính. Khi bảo vệ đến kiểm tra xem bản gốc và bản nháp có gì khác nhau không, họ thấy hai bản hoàn toàn giống nhau vì bạn đã vô tình sửa đổi trực tiếp bản gốc rồi! Việc sử dụng `JSON.parse(JSON.stringify(combos))` giống như việc ta đi photo một bản sao hoàn toàn độc lập, giữ nguyên vẹn bản gốc trong tủ kính để đối chứng.
* **Ví dụ về Popover Grid Picker**: Khi Admin cấu hình nút "MUA QUA ZALO", thay vì phải gõ tay tên icon hoặc bị giới hạn trong vài icon cố định, một popover nhỏ gọn sẽ hiện ra chứa một lưới các icon đẹp mắt (Send, Phone, Award, Gift, Star, Heart...). Admin chỉ cần click chọn icon mình thích, giao diện site thực sẽ lập tức thay đổi tương ứng.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã kiểm tra kỹ lưỡng các file liên quan đến cấu hình trải nghiệm, trang admin chỉnh sửa sản phẩm và trang chi tiết sản phẩm trên site thực:
1. **Lỗi Form State Mutation**: Nằm tại `app/admin/products/[id]/edit/page.tsx` ở phần `currentSnapshot` và khởi tạo `initialSnapshotRef.current`. State `combos` được cập nhật thông qua việc thay đổi trực tiếp thuộc tính của đối tượng trong mảng khiến snapshot ban đầu bị đồng bộ thay đổi theo.
2. **Thiếu cấu hình Premium CTA & Background Icons**: Dải nút CTA "MUA QUA ZALO" & "GỌI TƯ VẤN" đang được hiển thị cứng trong `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`. Icon Award và Gift nền của khung giá cũng được code cứng, chưa được đưa vào schema của `layouts.premium`.
3. **Hiển thị Combo Site Thực**:
   - `ProductDetailPage.tsx` giới hạn `slice(0, 2)` combo và gán cứng combo 2 làm Best Seller.
   - Combo Mix chưa được hiển thị trọn vẹn và thiếu Modal chi tiết.
   - Khi tên combo trống, nó đang render dấu gạch ngang (`-`).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Triệu chứng**: Khi thay đổi bất kỳ trường nào của Combo (Tên, Giá, Số lượng tối thiểu) trong trang edit sản phẩm, Sticky Footer "Lưu thay đổi" không xuất hiện.
* **Nguyên nhân gốc (Root Cause)**: Do chia sẻ tham chiếu bộ nhớ (Shallow Reference Sharing) giữa `initialSnapshotRef.current.combos` và state `combos`. Khi cập nhật combo thông qua `next[index].name = e.target.value`, đối tượng combo gốc trong bộ nhớ bị mutate trực tiếp. Vì `initialSnapshotRef.current.combos` giữ tham chiếu đến chính các đối tượng này, dữ liệu so sánh ban đầu bị thay đổi theo, làm cho `JSON.stringify(initialSnapshotRef.current) === JSON.stringify(currentSnapshot)` luôn trả về `true`.
* **Giả thuyết đối chứng (Counter-Hypothesis)**: Nếu ta deep clone mảng combos khi gán vào `initialSnapshotRef.current` và thực hiện clone sâu đối tượng combo khi cập nhật state trong `setCombos`, thì sự thay đổi trên state `combos` sẽ không ảnh hưởng đến `initialSnapshotRef.current`. Kết quả so sánh `JSON.stringify` sẽ trả về `false` và kích hoạt Sticky Footer chính xác.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất triển khai các nâng cấp toàn diện sau:

## 1. Khắc phục lỗi Form & Thêm DnD Combo (Admin)
* Sử dụng `JSON.parse(JSON.stringify(...))` cho `combos` trong `initialSnapshotRef.current` và `currentSnapshot` để đảm bảo so sánh trạng thái bất biến (Immutable State Comparison).
* Viết hàm cập nhật combo an toàn không mutate state trực tiếp:
  ```typescript
  const updateCombo = (index: number, value: Partial<any>) => {
    setCombos(prev => prev.map((c, i) => i === index ? { ...c, ...value } : c));
  };
  ```
* Tích hợp cơ chế Drag and Drop (DnD) sử dụng HTML5 Drag/Drop API mượt mà cho danh sách combo trong trang admin để dễ dàng sắp xếp thứ tự hiển thị của các combo.

## 2. Nâng cấp cấu hình Premium Layout (Experiences Admin)
* Mở rộng kiểu dữ liệu `PremiumLayoutConfig` để bao gồm các trường cấu hình linh hoạt:
  * `zaloText` (Text nút Zalo), `zaloIcon` (Icon nút Zalo), `zaloUrl` (Link Zalo, để trống để tự động lấy từ Settings hệ thống).
  * `phoneText` (Text nút Phone), `phoneIcon` (Icon nút Phone), `phoneUrl` (Link SĐT, để trống để lấy từ Settings hệ thống).
  * `mobileFontSize` (Kích thước chữ trên Mobile cho nhỏ gọn: `'xs' | 'sm' | 'base'`).
  * `priceLeftIcon`, `priceRightIcon` (Cấu hình các icon nền Award/Gift ở khung giá).
  * `showPriceLeftIcon`, `showPriceRightIcon` (Bật/tắt các icon nền này).
* Tích hợp `IconPopoverPicker` (sử dụng list icon Lucide thiết thực) vào Panel cấu hình Layout Premium của trang Experiences Admin.

## 3. Hoàn thiện UI/UX hiển thị Combo trên Site Thực
* Thay thế hiển thị cứng 2 combo bằng việc hiển thị toàn bộ danh sách combo.
* Đặt combo đầu tiên (`index === 0`) làm Best Seller (`★ BÁN CHẠY`).
* Sửa lỗi hiển thị tên combo trống: Nếu `combo.name` rỗng hoặc chỉ chứa dấu gạch thô, tự động tạo tên mặc định tinh tế như `"COMBO STANDARD"` hoặc `"COMBO ĐẶC BIỆT"`.
* Áp dụng Embla Carousel trượt ngang mượt mà cho danh sách combo khi số lượng combo lớn hơn hoặc bằng 1, kèm theo 2 nút Prev/Next tròn nhỏ tinh tế ở 2 bên.
* Xây dựng Modal Glassmorphism sang trọng để hiển thị chi tiết các sản phẩm kèm theo của Combo Mix khi người dùng click vào Combo Mix trên site thực. Modal này sẽ hiển thị:
  - Tên và mô tả Combo Mix.
  - Danh sách hình ảnh, tên và số lượng các sản phẩm đi kèm.
  - Giá ưu đãi trọn bộ và nút chọn nhanh combo đó (set số lượng tương ứng và đóng modal).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Admin Component Layer
1. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/products/%5Bid%5D/edit/page.tsx)**
   * *Vai trò*: Trang quản trị chỉnh sửa sản phẩm của admin.
   * *Thay đổi*: Sửa lỗi mutation của state `combos` bằng deep clone; Tích hợp tính năng Drag & Drop (DnD) HTML5 sắp xếp vị trí combo trực quan.

2. **[MODIFY] [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/product-detail/page.tsx)**
   * *Vai trò*: Trang cấu hình trải nghiệm chi tiết sản phẩm của hệ thống.
   * *Thay đổi*: Mở rộng schema `PremiumLayoutConfig` với các trường cấu hình CTA Zalo/Sđt và background icons; Thêm các panel điều khiển cấu hình trực quan có sử dụng `IconPopoverPicker`.

3. **[MODIFY] [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)**
   * *Vai trò*: Component render giao diện preview trực quan của trải nghiệm chi tiết sản phẩm.
   * *Thay đổi*: Cập nhật giao diện preview để phản ánh động các cấu hình CTA Buttons (Zalo, Gọi tư vấn), kích thước chữ mobile và các icon nền theo cấu hình Premium Layout thực tế; Cập nhật block hiển thị combo động.

4. **[MODIFY] [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)**
   * *Vai trò*: Giao diện chi tiết sản phẩm hiển thị thực tế cho khách mua hàng.
   * *Thay đổi*: Hiển thị động các nút CTA và icon nền theo cấu hình Premium Layout mới; Load link Zalo/Sđt từ settings hệ thống qua `getValue` nếu cấu hình trống; Sử dụng Embla Carousel trượt mượt mà cho toàn bộ combo thường/mix; Đổi Best Seller sang combo đầu tiên; Xây dựng Modal Glassmorphism sang trọng hiển thị chi tiết sản phẩm kèm của Combo Mix.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Giai đoạn 1**: Chỉnh sửa file admin `app/admin/products/[id]/edit/page.tsx` để sửa lỗi Mutation state và tích hợp kéo thả DnD cho danh sách Combo.
2. **Giai đoạn 2**: Cập nhật file cấu hình hệ thống `app/system/experiences/product-detail/page.tsx` để thêm schema mới và xây dựng UI Popover Grid Picker cấu hình nút/icon cho Premium Layout.
3. **Giai đoạn 3**: Đồng bộ giao diện Preview trong `components/experiences/previews/ProductDetailPreview.tsx` để render chuẩn theo cấu hình động.
4. **Giai đoạn 4**: Triển khai logic trượt ngang Embla Carousel, tự động sinh tên mặc định thông minh, đổi Best Seller, load link cấu hình Zalo/SĐT từ Settings hệ thống và thiết kế Modal Glassmorphism cho Combo Mix trong file site thực tế `ProductDetailPage.tsx`.
5. **Giai đoạn 5**: Tiến hành tự kiểm tra tĩnh (static check) và review chất lượng.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated / Static Tests
* Chạy kiểm tra TypeScript (`bunx tsc --noEmit`) cục bộ để đảm bảo không xảy ra lỗi kiểu dữ liệu (type errors) sau khi mở rộng schema cấu hình Layout Premium.

### Manual Verification
1. **Kiểm tra Admin Chỉnh sửa sản phẩm**:
   - Truy cập trang chỉnh sửa sản phẩm, thay đổi bất kỳ trường nào của Combo (Tên, Giá, Số lượng).
   - Kiểm chứng xem Sticky Footer "Lưu thay đổi" có xuất hiện lập tức không.
   - Thử kéo thả (DnD) các thẻ combo để sắp xếp lại thứ tự, sau đó lưu lại và kiểm tra xem thứ tự có được lưu chính xác trong cơ sở dữ liệu.
2. **Kiểm tra Cấu hình Layout Premium**:
   - Truy cập trang Experiences `/system/experiences/product-detail`.
   - Chỉnh sửa Text, thay đổi Icon qua Popover Grid Picker, bật/tắt icon nền Ribbon/Hộp quà và đổi font size mobile.
   - Kiểm tra xem giao diện Preview bên phải có thay đổi tương ứng tức thì không. Bấm lưu cài đặt.
3. **Kiểm tra Site Thực**:
   - Truy cập trang chi tiết sản phẩm thực tế có chứa combo (ví dụ Yamazaki 12).
   - Xác nhận nút Zalo & Gọi tư vấn hiển thị đúng text, icon, kích thước chữ nhỏ gọn trên mobile. Click thử xem có mở đúng link Zalo/SĐT (lấy từ cài đặt hệ thống) hay không.
   - Xác nhận các combo hiển thị trọn vẹn dưới dạng Carousel trượt ngang mượt mà, có nút trượt trái/phải rõ ràng.
   - Xác nhận combo đầu tiên hiển thị nhãn `★ BÁN CHẠY`.
   - Xác nhận các combo không điền tên hiển thị tên mặc định thay vì dấu gạch `-` thô thiển.
   - Click vào một Combo Mix, xác nhận Modal Glassmorphism mở ra hiển thị cực kỳ đẹp mắt danh sách sản phẩm đi kèm.

---

# VIII. Todo

- [ ] Sửa lỗi State Mutation trong `app/admin/products/[id]/edit/page.tsx` (Deep clone combos).
- [ ] Tích hợp kéo thả HTML5 DnD sắp xếp vị trí combo trong trang admin edit sản phẩm.
- [ ] Thêm các trường cấu hình layout Premium mới vào `PremiumLayoutConfig` và `DEFAULT_CONFIG` trong `app/system/experiences/product-detail/page.tsx`.
- [ ] Xây dựng panel điều khiển dải nút CTA & Icons bằng `IconPopoverPicker` trong trang experiences admin.
- [ ] Đồng bộ hóa logic hiển thị CTA, kích thước chữ mobile và icon nền động trong `components/experiences/previews/ProductDetailPreview.tsx`.
- [ ] Triển khai hiển thị dải nút CTA, background icons động trên site thực `app/(site)/_components/details/ProductDetailPage.tsx`.
- [ ] Load link Zalo/Sđt từ settings hệ thống thông qua `api.settings.getValue` nếu cấu hình link trống.
- [ ] Sửa lỗi hiển thị tên combo rỗng/gạch ngang và đổi nhãn "Bán chạy" cho combo đầu tiên trên site thực.
- [ ] Triển khai Embla Carousel trượt ngang mượt mà cho các combo trên site thực kèm nút điều hướng Prev/Next.
- [ ] Thiết kế và xây dựng Modal Glassmorphism sang trọng hiển thị thông tin sản phẩm kèm của Combo Mix khi click trên site thực.
- [ ] Tự review tĩnh và verify chất lượng tổng thể.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Sticky Footer**: Xuất hiện ngay lập tức khi thêm, xóa hoặc sửa đổi bất kỳ chi tiết nào của Combo trong trang edit sản phẩm.
* **DnD Combo**: Kéo thả sắp xếp thứ tự combo hoạt động trơn tru trong trang admin, thay đổi được lưu trữ chính xác.
* **CTA Buttons & Icons**: Text, Icon và link của "Mua qua Zalo" & "Gọi tư vấn" hiển thị chuẩn theo cấu hình Layout Premium. Nếu link trống, tự động sử dụng Zalo & SĐT từ Settings hệ thống.
* **Mobile View**: Kích thước chữ của 2 nút CTA trên mobile hiển thị nhỏ gọn, tinh tế theo đúng tùy chọn font size đã cấu hình (ví dụ `text-xs`, `text-sm`).
* **Combo Carousel**: Toàn bộ combo thường và mix hiển thị dạng slide trượt ngang Embla mượt mà có nút Prev/Next điều hướng. Combo đầu tiên hiển thị nhãn "Bán chạy". Không còn dấu gạch `-` thô thiển khi tên combo trống.
* **Combo Mix Modal**: Click vào Combo Mix mở ra Modal Glassmorphism mờ ảo hiện đại hiển thị chi tiết các sản phẩm đi kèm một cách trực quan, rõ nét.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Lỗi kiểu dữ liệu TypeScript khi mở rộng các thuộc tính của `layouts.premium` do hệ thống check kiểu chặt chẽ trong quá trình build dự án.
* **Hoàn tác**: Sử dụng lệnh Git rollback các file đã sửa đổi nếu xảy ra bất kỳ lỗi runtime nghiêm trọng nào không thể khắc phục nhanh.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không thay đổi schema database của Convex; mọi thay đổi cấu hình layout đều được lưu trữ trực tiếp trong trường `value` dạng JSON của bảng `settings` thông qua key `product_detail_ui` đã có sẵn.

---

# XII. Open Questions (Câu hỏi mở)

* *Không có câu hỏi mở nào.* Dự án đã có sẵn các component nền tảng chất lượng cao như `IconPopoverPicker` và `useEmblaCarousel` giúp việc triển khai vô cùng thuận lợi và đạt độ thẩm mỹ tối đa.
