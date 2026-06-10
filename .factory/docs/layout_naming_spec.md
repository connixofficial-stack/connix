# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Các layout của 30 Home Component trong admin đang có tên gọi tiếng Anh kỹ thuật (jargon) khó hiểu với người dùng phổ thông (Bento, Kanban, Marquee...). Tuy nhiên, nếu dịch dài dòng (ví dụ: "Lưới thẻ nhỏ tinh giản bo viền mỏng") sẽ gây rối mắt cho admin khi chọn trên giao diện.
* **Giải pháp**: Rút gọn tối đa tên layout, chỉ dùng **1 đến 2 từ tiếng Việt súc tích** mô tả đúng cấu trúc giao diện, kết hợp số thứ tự dạng `(Số)` ở đầu (ví dụ: `(1) Cổ điển`, `(2) Ô ghép`, `(3) Trượt ngang`, `(7) Lưới thẻ`).
* **Hạn chế rủi ro**: Chỉ thay đổi nhãn hiển thị (`label`), giữ nguyên 100% thuộc tính `id` để không làm lỗi database (Convex) và logic render ngoài frontend.

## 2. Elaboration & Self-Explanation
Nguyên tắc đặt tên layout gọn gàng (1-2 từ tối đa):
* Không dùng từ tiếng Anh kỹ thuật (Bento -> Ô ghép; Marquee -> Chạy ngang; Carousel/Slider -> Trượt ngang; Parallax -> Cuộn nền; Kanban -> Lưới thẻ hoặc Ba cột tùy component).
* Giữ nhãn hiển thị cực kỳ ngắn gọn để admin dễ scan bằng mắt trên dropdown cấu hình, không bị tràn dòng hay gây rối.
* Các số thứ tự đầu nhãn như `(1)`, `(2)` giúp giao tiếp nhanh khi hỗ trợ kỹ thuật (ví dụ: "Đổi sang layout 3 của phần Dịch vụ").

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**:
  * Đối với Component **marquee**:
    * `ribbon` $\rightarrow$ `(1) Chạy ngang` (thay vì "Dải màu chạy chữ")
    * `gradient` $\rightarrow$ `(2) Chuyển màu`
  * Đối với Component **about**:
    * `kanban` $\rightarrow$ `(9) Lưới thẻ` (thay vì "Lưới thẻ tính năng viền mảnh kèm ảnh lớn")
  * Đối với Component **contact**:
    * `kanban` $\rightarrow$ `(7) Ba cột` (vì layout liên hệ kanban chia làm 3 cột Thông tin, Form và Bản đồ)
* **Ẩn dụ đời thường**: Giống như việc ghi tên các nút bấm trên điều khiển từ xa. Thay vì ghi "Tăng âm lượng loa tivi lớn lên" hoặc từ mượn "Volume Up", ta chỉ cần ghi nút: "(+) To", "(-) Nhỏ". Gọn gàng, rõ ràng, bấm phát ăn ngay.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã quét qua tất cả 30 home-components trong thư mục `app/admin/home-components` và phát hiện các tệp chứa danh sách style:
* Hầu hết nằm ở `_lib/constants.ts` dưới dạng biến `ABOUT_STYLES`, `HERO_STYLES`...
* Một số định nghĩa trực tiếp ở tệp `*Preview.tsx` dưới dạng biến `styles` hoặc `MARQUEE_STYLES`...
* Giá trị lưu trong DB chính là `id` (ví dụ: `classic`, `bento`, `elegantGrid`), còn giao diện hiển thị cho admin chọn dùng `label`. Do đó, ta chỉ cần thay đổi thuộc tính `label` trong các mảng style option này mà không cần động chạm tới Convex schema hay cơ sở dữ liệu thực tế.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc**: Quá trình phát triển các module Home Component diễn ra ở nhiều thời điểm khác nhau, do các lập trình viên khác nhau thực hiện hoặc import từ các nguồn core khác nhau, dẫn tới thiếu nhất quán và lạm dụng các từ khóa tiếng Anh kỹ thuật UI hoặc số thứ tự thô ráp.
* **Độ tin cậy nguyên nhân gốc**: High (100% chính xác vì cấu trúc code của từng folder do nhiều người build độc lập, thể hiện rõ ở cách dùng tiếng Anh trơn, tiếng Việt kết hợp số hoặc nhãn thô).
* **Giả thuyết đối chứng**: Nếu chúng ta thay đổi cả `id` của layout để cho đồng bộ với tiếng Việt/số thứ tự, hệ thống sẽ bị lỗi nghiêm trọng do dữ liệu cũ trong Convex DB đang lưu `id` cũ (như `elegantGrid`, `slider`) và component render ở frontend cũng đang `switch-case` theo các `id` này. Vì vậy, ta tuyệt đối KHÔNG sửa `id`, chỉ sửa `label`.

---

# IV. Proposal (Đề xuất)

Áp dụng bộ nguyên tắc đặt tên layout mới cho toàn bộ 30 Home Component:
1. Định dạng nhãn hiển thị: `(Số) Tên Tiếng Việt gọn gàng`.
2. Dịch các thuật ngữ kỹ thuật phổ biến sang Tiếng Việt trực quan (loại bỏ hoàn toàn các từ jargon như Kanban, Bento, Marquee, Parallax...).
3. Rút gọn tối đa nhãn hiển thị (chỉ dùng **1 đến 2 từ tiếng Việt súc tích**).
4. Giữ nguyên 100% thuộc tính `id` của từng layout.

Dưới đây là bảng chi tiết thay đổi nhãn cho tất cả 30 components:

| Tên Component | Style ID | Label Cũ | Label Mới Đề Xuất |
| :--- | :--- | :--- | :--- |
| **1. marquee** | `ribbon`<br>`gradient`<br>`minimal`<br>`dark`<br>`split`<br>`stripe` | Ribbon<br>Gradient<br>Minimal<br>Dark<br>Split<br>Stripe | (1) Chạy ngang<br>(2) Chuyển màu<br>(3) Tối giản<br>(4) Nền tối<br>(5) Chia đôi<br>(6) Sọc kẻ |
| **2. about** | `classic`<br>`bento`<br>`minimal`<br>`split`<br>`timeline`<br>`showcase`<br>`spaCollage`<br>`solarFeature`<br>`kanban` | Mẫu Spa (Layout 1)<br>Mẫu Xây dựng 1 (Layout 2)<br>Mẫu Xây dựng 2 (Layout 3)<br>Mẫu Kỹ thuật (Layout 4)<br>Mẫu Thời trang (Layout 5)<br>Mẫu Sản phẩm (Layout 6)<br>Mẫu Spa Premium (Layout 7)<br>Mẫu Năng lượng (Layout 8)<br>Mẫu tối giản Kanban (Layout 9) | (1) Cổ điển<br>(2) Ô ghép<br>(3) Tối giản<br>(4) Chia đôi<br>(5) Tiến trình<br>(6) Trưng bày<br>(7) Ghép ảnh<br>(8) Khối lớn<br>(9) Lưới thẻ |
| **3. benefits** | `1`<br>`2`<br>`3`<br>`4`<br>`5`<br>`6` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6 | (1) Số liệu<br>(2) Vạch đáy<br>(3) Đường cong<br>(4) Chia đôi<br>(5) Ô ghép<br>(6) Thẻ nổi |
| **4. blog** | `layout1`<br>`layout2`<br>`layout3`<br>`layout4`<br>`layout5`<br>`layout6`<br>`layout7` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6<br>Layout 7 | (1) Lưới thẻ<br>(2) Bài lớn<br>(3) Xếp dọc<br>(4) Trượt ngang<br>(5) Ô ghép<br>(6) Tin chính<br>(7) Tối giản |
| **5. career** | `cards`<br>`list`<br>`minimal`<br>`table`<br>`featured`<br>`timeline` | Cards<br>List<br>Minimal<br>Table<br>Featured<br>Timeline | (1) Dạng thẻ<br>(2) Xếp dọc<br>(3) Tối giản<br>(4) Dạng bảng<br>(5) Nổi bật<br>(6) Quy trình |
| **6. case-study**| `grid`<br>`featured`<br>`list`<br>`masonry`<br>`carousel`<br>`timeline` | Grid<br>Featured<br>List<br>Masonry<br>Carousel<br>Timeline | (1) Dạng lưới<br>(2) Nổi bật<br>(3) Xếp dọc<br>(4) So le<br>(5) Trượt ngang<br>(6) Tiến trình |
| **7. category-products**| `grid`<br>`carousel`<br>`cards`<br>`bento`<br>`magazine`<br>`showcase`<br>`wine-grid` | Grid<br>Carousel<br>Cards<br>Bento<br>Magazine<br>Showcase<br>Wine Grid | (1) Dạng lưới<br>(2) Trượt ngang<br>(3) Dạng thẻ<br>(4) Ô ghép<br>(5) Tạp chí<br>(6) Trưng bày<br>(7) Lưới dọc |
| **8. clients** | `layout01`<br>`layout02`<br>`layout03`<br>`layout04`<br>`layout05`<br>`layout06`<br>`layout07`<br>`layout08` | Layout 01 — 1 lớn + 3 phụ<br>Layout 02 — Banner full-width<br>Layout 03 — 1 trên + 2 dưới<br>Layout 04 — 2 banner ngang<br>Layout 05 — 3 banner landscape<br>Layout 06 — 4 banner dọc<br>Layout 07 — Grid 2×2 ngang<br>Layout 08 — Vuốt carousel | (1) Một lớn<br>(2) Tràn viền<br>(3) Xếp tầng<br>(4) Hai banner<br>(5) Ba banner<br>(6) Bốn banner<br>(7) Lưới ô<br>(8) Trượt ngang |
| **9. contact** | `modern`<br>`floating`<br>`grid`<br>`elegant`<br>`minimal`<br>`centered`<br>`kanban` | Modern Split<br>Executive Panel<br>Grid Cards<br>Elegant Clean<br>Minimal Form<br>Balanced Split<br>Kanban Board | (1) Chia đôi<br>(2) Khối nổi<br>(3) Lưới thẻ<br>(4) Thanh lịch<br>(5) Tối giản<br>(6) Cân bằng<br>(7) Ba cột |
| **10. countdown**| `banner`<br>`floating`<br>`minimal`<br>`split`<br>`sticky`<br>`popup` | Banner<br>Floating<br>Minimal<br>Split<br>Sticky<br>Popup | (1) Thanh ngang<br>(2) Khối nổi<br>(3) Tối giản<br>(4) Chia đôi<br>(5) Dính cạnh<br>(6) Bật lên |
| **11. cta** | `banner`<br>`centered`<br>`split`<br>`floating`<br>`gradient`<br>`minimal` | Banner<br>Centered<br>Split<br>Floating<br>Gradient<br>Minimal | (1) Thanh ngang<br>(2) Căn giữa<br>(3) Chia đôi<br>(4) Khối nổi<br>(5) Chuyển màu<br>(6) Tối giản |
| **12. faq** | `wine-list`<br>`accordion`<br>`minimal`<br>`timeline`<br>`cards`<br>`two-column`<br>`tabbed` | Wine List<br>Minimal<br>Floating<br>Split<br>Grid<br>Showcase<br>Brand | (1) Xếp dọc<br>(2) Đóng mở<br>(3) Khối nổi<br>(4) Chia đôi<br>(5) Lưới thẻ<br>(6) Hai cột<br>(7) Phân tab |
| **13. footer** | `classic`<br>`modern`<br>`corporate`<br>`minimal`<br>`centered`<br>`stacked` | 1. Classic Grid<br>2. Info-Rich<br>3. Split Zones<br>4. Compact Bar<br>5. Magazine<br>6. Wave | (1) Bốn cột<br>(2) Đầy đủ<br>(3) Phân vùng<br>(4) Thu gọn<br>(5) Tạp chí<br>(6) Dạng sóng |
| **14. gallery** | `spotlight`<br>`explore`<br>`stories`<br>`grid`<br>`marquee`<br>`masonry` | Tiêu điểm<br>Khám phá<br>Câu chuyện<br>Grid<br>Marquee<br>Masonry | (1) Tiêu điểm<br>(2) Nghiêng góc<br>(3) Dạng tin<br>(4) Dạng lưới<br>(5) Chạy ngang<br>(6) So le |
| **15. trust-badges**| `grid`<br>`cards`<br>`stack`<br>`wall`<br>`carousel`<br>`seal` | Grid<br>Cards<br>Stack<br>Wall<br>Carousel<br>Seal | (1) Dạng lưới<br>(2) Dạng thẻ<br>(3) Xếp chồng<br>(4) Mảng tường<br>(5) Trượt ngang<br>(6) Con dấu |
| **16. hero** | `slider`<br>`fade`<br>`builderCoffee`<br>`bento`<br>`triple`<br>`triple2`<br>`fullscreen`<br>`conquest`<br>`split`<br>`parallax` | Slider<br>Fade<br>Builder Coffee<br>Bento<br>Triple<br>Triple 2<br>Fullscreen<br>Conquest<br>Split<br>Parallax | (1) Trượt ảnh<br>(2) Mờ dần<br>(3) Khối trái<br>(4) Ô ghép<br>(5) Ba ảnh<br>(6) Ba ảnh 2<br>(7) Tràn màn<br>(8) Khối bo<br>(9) Chia đôi<br>(10) Cuộn nền |
| **17. homepage-category-hero**| `sidebar`<br>`classic`<br>`flush`<br>`minimal`<br>`soft`<br>`top-nav` | Sidebar<br>Classic<br>Flush<br>Minimal<br>Soft<br>Top Nav | (1) Thanh bên<br>(2) Cổ điển<br>(3) Tràn viền<br>(4) Tối giản<br>(5) Bo mềm<br>(6) Thanh trên |
| **18. partners** | `grid`<br>`marquee`<br>`badge`<br>`carousel`<br>`logoCloud`<br>`glassLogoCloud`<br>`clean`<br>`divider` | Grid<br>Marquee<br>Badge<br>Carousel<br>Logo Cloud<br>Glass Logo Cloud<br>Clean<br>Divider | (1) Dạng lưới<br>(2) Chạy ngang<br>(3) Huy hiệu<br>(4) Trượt ngang<br>(5) Cụm logo<br>(6) Hiệu ứng kính<br>(7) Tối giản<br>(8) Dòng kẻ |
| **19. popup** | `center-card`<br>`split-visual`<br>`bottom-sheet`<br>`side-panel`<br>`minimal-alert`<br>`full-screen`<br>`image-only`<br>`centered-advertisement` | Premium Modal<br>Visual Offer<br>Bottom Sheet<br>Side Panel<br>Smart Alert<br>Campaign Hero<br>Image Only<br>Premium Advertisement | (1) Căn giữa<br>(2) Chia đôi<br>(3) Trượt dưới<br>(4) Trượt góc<br>(5) Cảnh báo<br>(6) Tràn màn<br>(7) Chỉ ảnh<br>(8) Khung lớn |
| **20. pricing** | `cards`<br>`horizontal`<br>`minimal`<br>`comparison`<br>`featured`<br>`compact`<br>`tabbed`<br>`construction` | Cards<br>Ngang<br>Minimal<br>So sánh<br>Nổi bật<br>Gọn<br>Tabs chi tiết<br>Thi công | (1) Dạng thẻ<br>(2) Hàng ngang<br>(3) Tối giản<br>(4) So sánh<br>(5) Nổi bật<br>(6) Thu gọn<br>(7) Phân tab<br>(8) Góc cạnh |
| **21. product-categories**| `image-strip`<br>`carousel`<br>`cards`<br>`marquee`<br>`circular`<br>`icon-grid`<br>`mosaic`<br>`compact-grid`<br>`grid`<br>`grid-10`<br>`grid-11` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6<br>Layout 7<br>Layout 8<br>Layout 9<br>Layout 10<br>Layout 11 | (1) Dải ảnh<br>(2) Trượt ngang<br>(3) Dạng thẻ<br>(4) Chạy chữ<br>(5) Ảnh tròn<br>(6) Lưới icon<br>(7) Ô ghép<br>(8) Thu gọn<br>(9) Lưới chuẩn<br>(10) Thẻ nổi<br>(11) Bo viền |
| **22. product-grid**| `commerce`<br>`minimal`<br>`compact`<br>`magazine`<br>`catalog`<br>`mosaic`<br>`tabbed`<br>`storefront` | Commerce<br>E-commerce<br>Compact<br>Magazine<br>Catalog<br>Mosaic<br>Tabbed<br>Storefront | (1) Thương mại<br>(2) Tối giản<br>(3) Thu gọn<br>(4) Tạp chí<br>(5) Danh mục<br>(6) So le<br>(7) Phân tab<br>(8) Cửa hiệu |
| **23. product-list**| `commerce`<br>`minimal`<br>`bento`<br>`carousel`<br>`wine-carousel`<br>`compact`<br>`showcase`<br>`lookbook` | Commerce<br>E-commerce<br>Bento<br>Carousel<br>Wine Carousel<br>Compact<br>Showcase<br>Lookbook Banner | (1) Thương mại<br>(2) Tối giản<br>(3) Ô ghép<br>(4) Trượt ngang<br>(5) Trượt ngang 2<br>(6) Thu gọn<br>(7) Trưng bày<br>(8) Gắn điểm |
| **24. service-list**| `grid`<br>`bento`<br>`list`<br>`carousel`<br>`minimal`<br>`showcase`<br>`kanban` | Grid<br>Bento<br>List<br>Carousel<br>Minimal<br>Showcase<br>Kanban | (1) Dạng lưới<br>(2) Ô ghép<br>(3) Xếp dọc<br>(4) Trượt ngang<br>(5) Tối giản<br>(6) Trưng bày<br>(7) Lưới thẻ |
| **25. services** | `elegantGrid`<br>`modernList`<br>`bigNumber`<br>`cards`<br>`carousel`<br>`timeline`<br>`builderPolicy`<br>`builderFeatureCircle` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6<br>Layout 7<br>Layout 8 | (1) Lưới thẻ<br>(2) Xếp dọc<br>(3) Đính số<br>(4) Dạng thẻ<br>(5) Trượt ngang<br>(6) Tiến trình<br>(7) Góc cạnh<br>(8) Biểu tượng |
| **26. speed-dial**| `fab`<br>`sidebar`<br>`pills`<br>`stack`<br>`dock`<br>`minimal`<br>`builder-bar` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6<br>Layout 7 | (1) Nút tròn<br>(2) Thanh bên<br>(3) Dạng dẹt<br>(4) Xếp chồng<br>(5) Thanh dưới<br>(6) Tối giản<br>(7) Thanh khối |
| **27. stats** | `horizontal`<br>`cards`<br>`icons`<br>`gradient`<br>::`minimal`<br>`counter`<br>`solar-hero`<br>`builder-overlay` | Thanh ngang<br>Cards<br>Circle<br>Gradient<br>Minimal<br>Counter<br>Hero ảnh nền<br>Overlay Builder | (1) Hàng ngang<br>(2) Dạng thẻ<br>(3) Ảnh tròn<br>(4) Chuyển màu<br>(5) Tối giản<br>(6) Đếm số<br>(7) Ảnh nền<br>(8) Khối đè |
| **28. team** | `grid`<br>`cards`<br>`carousel`<br>`bento`<br>`timeline`<br>`spotlight`<br>`construction`<br>`layout8` | Layout 1<br>Layout 2<br>Layout 3<br>Layout 4<br>Layout 5<br>Layout 6<br>Layout 7<br>Layout 8 | (1) Dạng lưới<br>(2) Dạng thẻ<br>(3) Trượt ngang<br>(4) Ô ghép<br>(5) Tiến trình<br>(6) Tiêu điểm<br>(7) Góc cạnh<br>(8) Tối giản |
| **29. testimonials**| `cards`<br>`slider`<br>`marquee`<br>`showcase`<br>`quote`<br>`minimal`<br>`split-carousel`<br>`overlap-carousel`<br>`builder-cards`<br>`builder-carousel` | Cards<br>Slider<br>Marquee<br>Showcase<br>Quote<br>Minimal<br>Split<br>Overlap<br>Builder<br>Builder Slide | (1) Dạng thẻ<br>(2) Trượt ngang<br>(3) Chạy ngang<br>(4) Trưng bày<br>(5) Trích dẫn<br>(6) Tối giản<br>(7) Chia đôi<br>(8) Đè chồng<br>(9) Thẻ khối<br>(10) Trượt khối |
| **30. video** | `centered`<br>`split`<br>`fullwidth`<br>`cinema`<br>`minimal`<br>`parallax` | Centered<br>Split<br>Fullwidth<br>Cinema<br>Minimal<br>Parallax | (1) Căn giữa<br>(2) Chia đôi<br>(3) Tràn viền<br>(4) Khung rộng<br>(5) Tối giản<br>(6) Cuộn nền |
| **31. voucher-promotions**| `enterpriseCards`<br>`ticketHorizontal`<br>`imageTicket`<br>`couponGrid`<br>`stackedBanner`<br>`carousel`<br>`minimal` | Enterprise Cards<br>Ticket Ngang<br>Ticket Ảnh<br>Coupon Grid<br>Stacked Banner<br>Carousel<br>Minimal | (1) Dạng thẻ<br>(2) Vé ngang<br>(3) Vé ảnh<br>(4) Lưới thẻ<br>(5) Xếp chồng<br>(6) Trượt ngang<br>(7) Tối giản |

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
1. `app/admin/home-components/about/_lib/constants.ts` (Sửa nhãn hiển thị trong `ABOUT_STYLES`)
2. `app/admin/home-components/benefits/_lib/constants.ts` (Sửa nhãn hiển thị trong `BENEFITS_STYLES`)
3. `app/admin/home-components/blog/_lib/constants.ts` (Sửa nhãn hiển thị trong `BLOG_STYLES`)
4. `app/admin/home-components/career/_lib/constants.ts` (Sửa nhãn hiển thị trong `CAREER_STYLES`)
5. `app/admin/home-components/case-study/_lib/constants.ts` (Sửa nhãn hiển thị trong `CASE_STUDY_STYLES`)
6. `app/admin/home-components/category-products/_lib/constants.ts` (Sửa nhãn hiển thị trong `CATEGORY_PRODUCTS_STYLES`)
7. `app/admin/home-components/clients/_lib/constants.ts` (Sửa nhãn hiển thị trong `CLIENTS_STYLES`)
8. `app/admin/home-components/contact/_lib/constants.ts` (Sửa nhãn hiển thị trong `CONTACT_STYLES`)
9. `app/admin/home-components/countdown/_lib/constants.ts` (Sửa nhãn hiển thị trong `COUNTDOWN_STYLES`)
10. `app/admin/home-components/cta/_lib/constants.ts` (Sửa nhãn hiển thị trong `CTA_STYLES`)
11. `app/admin/home-components/cta/_components/CTAPreview.tsx` (Sửa nhãn hiển thị trong `CTA_STYLES` local)
12. `app/admin/home-components/faq/_lib/constants.ts` (Sửa nhãn hiển thị trong `FAQ_STYLES`)
13. `app/admin/home-components/footer/_components/FooterPreview.tsx` (Sửa nhãn hiển thị trong `styles` local)
14. `app/admin/home-components/gallery/_lib/constants.ts` (Sửa nhãn hiển thị trong `GALLERY_STYLES` và `TRUST_BADGES_STYLES`)
15. `app/admin/home-components/hero/_lib/constants.ts` (Sửa nhãn hiển thị trong `HERO_STYLES`)
16. `app/admin/home-components/homepage-category-hero/_lib/constants.ts` (Sửa nhãn hiển thị trong `HOMEPAGE_CATEGORY_HERO_STYLES`)
17. `app/admin/home-components/marquee/_components/MarqueePreview.tsx` (Sửa nhãn hiển thị trong `MARQUEE_STYLES` local)
18. `app/admin/home-components/partners/_lib/constants.ts` (Sửa nhãn hiển thị trong `PARTNERS_STYLES`)
19. `app/admin/home-components/popup/_lib/constants.ts` (Sửa nhãn hiển thị trong `POPUP_STYLES`)
20. `app/admin/home-components/pricing/_lib/constants.ts` (Sửa nhãn hiển thị trong `PRICING_STYLES`)
21. `app/admin/home-components/product-categories/_lib/constants.ts` (Sửa nhãn hiển thị trong `PRODUCT_CATEGORIES_STYLES`)
22. `app/admin/home-components/product-grid/_lib/constants.ts` (Sửa nhãn hiển thị trong `PRODUCT_GRID_STYLES`)
23. `app/admin/home-components/product-list/_lib/constants.ts` (Sửa nhãn hiển thị trong `PRODUCT_LIST_STYLES`)
24. `app/admin/home-components/service-list/_lib/constants.ts` (Sửa nhãn hiển thị trong `SERVICE_LIST_STYLES`)
25. `app/admin/home-components/services/_components/ServicesPreview.tsx` (Sửa nhãn hiển thị trong `SERVICES_STYLES` local)
26. `app/admin/home-components/speed-dial/_lib/constants.ts` (Sửa nhãn hiển thị trong `SPEED_DIAL_STYLES`)
27. `app/admin/home-components/stats/_lib/constants.ts` (Sửa nhãn hiển thị trong `STATS_STYLES`)
28. `app/admin/home-components/team/_lib/constants.ts` (Sửa nhãn hiển thị trong `TEAM_STYLES`)
29. `app/admin/home-components/testimonials/_components/TestimonialsPreview.tsx` (Sửa nhãn hiển thị trong `TESTIMONIAL_STYLES` local)
30. `app/admin/home-components/video/_lib/constants.ts` (Sửa nhãn hiển thị trong `VIDEO_STYLES`)
31. `app/admin/home-components/voucher-promotions/_lib/constants.ts` (Sửa nhãn hiển thị trong `VOUCHER_PROMOTIONS_STYLES`)

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại spec chi tiết này để làm kim chỉ nam.
2. Dùng công cụ code edit (`replace_file_content` hoặc `multi_replace_file_content`) thay thế lại nhãn các layout trong 31 file đã liệt kê ở phần V sang nhãn Việt hóa súc tích cập nhật theo spec.
3. Rà soát tĩnh trước khi lưu file, kiểm tra biên dịch TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static Check)
* Chạy biên dịch TypeScript toàn dự án để đảm bảo không có bất kỳ cú pháp nào bị hỏng:
  `bunx tsc --noEmit`
* Do chúng ta không sửa đổi bất cứ `id` hay cấu trúc kiểu dữ liệu (TypeScript type), việc sửa đổi label hiển thị chắc chắn 100% không thể gây ra lỗi biên dịch (typecheck).

---

# VIII. Todo

- [ ] Sửa đổi label hiển thị cho component `marquee` trong `app/admin/home-components/marquee/_components/MarqueePreview.tsx`
- [ ] Sửa đổi label hiển thị cho component `about` trong `app/admin/home-components/about/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `benefits` trong `app/admin/home-components/benefits/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `blog` trong `app/admin/home-components/blog/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `career` trong `app/admin/home-components/career/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `case-study` trong `app/admin/home-components/case-study/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `category-products` trong `app/admin/home-components/category-products/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `clients` trong `app/admin/home-components/clients/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `contact` trong `app/admin/home-components/contact/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `countdown` trong `app/admin/home-components/countdown/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `cta` trong `app/admin/home-components/cta/_lib/constants.ts` và `app/admin/home-components/cta/_components/CTAPreview.tsx`
- [ ] Sửa đổi label hiển thị cho component `faq` trong `app/admin/home-components/faq/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `footer` trong `app/admin/home-components/footer/_components/FooterPreview.tsx`
- [ ] Sửa đổi label hiển thị cho component `gallery` (bao gồm cả `trust-badges`) trong `app/admin/home-components/gallery/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `hero` trong `app/admin/home-components/hero/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `homepage-category-hero` trong `app/admin/home-components/homepage-category-hero/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `partners` trong `app/admin/home-components/partners/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `popup` trong `app/admin/home-components/popup/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `pricing` trong `app/admin/home-components/pricing/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `product-categories` trong `app/admin/home-components/product-categories/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `product-grid` trong `app/admin/home-components/product-grid/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `product-list` trong `app/admin/home-components/product-list/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `service-list` trong `app/admin/home-components/service-list/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `services` trong `app/admin/home-components/services/_components/ServicesPreview.tsx`
- [ ] Sửa đổi label hiển thị cho component `speed-dial` trong `app/admin/home-components/speed-dial/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `stats` trong `app/admin/home-components/stats/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `team` trong `app/admin/home-components/team/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `testimonials` trong `app/admin/home-components/testimonials/_components/TestimonialsPreview.tsx`
- [ ] Sửa đổi label hiển thị cho component `video` trong `app/admin/home-components/video/_lib/constants.ts`
- [ ] Sửa đổi label hiển thị cho component `voucher-promotions` trong `app/admin/home-components/voucher-promotions/_lib/constants.ts`

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Giao diện chọn layout của tất cả 30 home-component hiển thị nhãn Tiếng Việt súc tích (1-2 từ tối đa), có dạng `(Số) Tên Tiếng Việt`.
2. Không còn chứa bất kỳ từ tiếng Anh thô hay jargon kỹ thuật nào (Kanban, Bento, Marquee, Parallax, Carousel, v.v.).
3. Không bị lỗi biên dịch TypeScript.
4. Không làm lỗi tính năng hiển thị thực tế ngoài Frontend.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Bằng 0 vì ta chỉ thay đổi text hiển thị (`label`), hoàn toàn giữ nguyên logic code xử lý (`id`).
* **Rollback**: Chỉ cần `git checkout` các file constants/previews là phục hồi lại trạng thái cũ ngay lập tức.

---

# XI. Out of Scope (Ngoài phạm vi)

* Không sửa đổi schema lưu trữ dữ liệu của Convex.
* Không thiết kế lại giao diện admin hay code của Frontend.
* Không thay đổi giá trị `id` trong các mảng style.
