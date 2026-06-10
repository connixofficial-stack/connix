# I. Primer

## 1. TL;DR kiểu Feynman
- Trang `/system/modules/products` đang render setting theo metadata trong `products.config.ts`.
- Cơ chế ẩn/hiện field con đã có sẵn: field nào có `dependsOn` thì sẽ tự ẩn khi toggle cha = false.
- Nhóm “Phiên bản sản phẩm” hoạt động gọn vì các field con đều khai báo `dependsOn: 'variantEnabled'`.
- Nhóm “Bật khung viền sản phẩm” chưa gọn vì 2 field liên quan chưa khai báo `dependsOn`, nên tắt rồi vẫn hiện.
- Theo lựa chọn của bạn, mình sẽ làm hướng nhỏ nhất: chỉ ẩn các field con khi tắt, không tách preview/group mới.

## 2. Elaboration & Self-Explanation
Hiện tại trang cấu hình module sản phẩm dùng một renderer chung tên là `ModuleConfigPage`. Renderer này không hard-code riêng cho từng setting, mà nó đọc danh sách setting từ file config rồi vẽ ra form.

Điểm quan trọng là renderer đã biết cách ẩn setting phụ thuộc. Cụ thể, nếu một setting có `dependsOn: 'someToggle'` thì khi `someToggle = false`, setting đó sẽ không render.

Nhóm “Phiên bản sản phẩm” gọn là vì nó dùng đúng cơ chế này: `variantEnabled` là công tắc chính, còn các field như giá theo phiên bản, tồn kho theo phiên bản, ảnh phiên bản... đều có `dependsOn: 'variantEnabled'`.

Ngược lại, phần “Bật khung viền sản phẩm” có công tắc chính `enableProductFrames`, nhưng 2 field liên quan là `productFrameOverlayFit` và `productFrameCleanupOnArChange` chưa nối phụ thuộc vào công tắc đó. Vì vậy renderer không có lý do gì để ẩn chúng.

Nói ngắn gọn: vấn đề không nằm ở UI renderer, mà nằm ở metadata config chưa khai báo quan hệ cha-con cho setting khung viền.

## 3. Concrete Examples & Analogies
Ví dụ bám sát repo:
- Đang đúng: `variantPricing` có `dependsOn: 'variantEnabled'` nên khi tắt `variantEnabled`, field này biến mất.
- Đang thiếu: `productFrameOverlayFit` chưa có `dependsOn: 'enableProductFrames'` nên khi tắt `enableProductFrames`, field này vẫn hiện.

Analogy đời thường:
- Giống như công tắc “Bật máy lạnh”. Nếu tắt máy lạnh thì mấy nút “chỉnh nhiệt độ”, “đảo gió”, “hẹn giờ” nên ẩn hoặc vô nghĩa. Ở đây hệ thống đã có cơ chế làm chuyện đó, chỉ là phần “khung viền sản phẩm” chưa cắm dây vào cơ chế sẵn có.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Route `app/system/modules/products/page.tsx` chỉ mount `ModuleConfigPage` với `productsModule`.
  - `components/modules/ModuleConfigPage.tsx` render settings theo `config.settings` và có rule ẩn field khi `setting.dependsOn` false.
  - `lib/modules/configs/products.config.ts` có setting `enableProductFrames`, `productFrameOverlayFit`, `productFrameCleanupOnArChange`.
  - Hai setting con của product frame hiện chưa có `dependsOn`.
- Inference:
  - Khi toggle `enableProductFrames` = false, 2 field con vẫn hiện là hành vi đúng theo metadata hiện tại, không phải bug của renderer.
- Decision:
  - Chọn fix tối thiểu, đúng pattern sẵn có: thêm `dependsOn: 'enableProductFrames'` cho 2 field con.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: High
- Reason:
  - Evidence trực tiếp có ở `components/modules/ModuleConfigPage.tsx` nơi renderer check `if (setting.dependsOn && !localSettings[setting.dependsOn]) return null;`.
  - `products.config.ts` thiếu `dependsOn` cho 2 field product frame nên renderer không thể ẩn chúng.

- Trả lời 5/8 câu bắt buộc theo protocol:
  1. Triệu chứng quan sát được là gì?
     - Expected: tắt “Bật khung viền sản phẩm” thì các form liên quan phải ẩn.
     - Actual: các form `Cách khung ôm ảnh`, `Xóa khung lệch AR khi đổi tỉ lệ` vẫn hiện.
  2. Phạm vi ảnh hưởng?
     - Chỉ ảnh hưởng UI cấu hình module products ở `/system/modules/products`.
  3. Có tái hiện ổn định không?
     - Có, miễn là vào trang products module config và toggle `enableProductFrames`.
  4. Mốc thay đổi gần nhất?
     - Chưa có evidence commit cụ thể tạo bug; evidence hiện tại đủ cho thấy config thiếu wiring.
  5. Dữ liệu nào đang thiếu?
     - Không thiếu dữ liệu quan trọng để chốt fix nhỏ này.
  6. Có giả thuyết thay thế hợp lý nào chưa bị loại trừ?
     - Có thể renderer group riêng cho product frames bị lỗi, nhưng đã loại trừ vì renderer chung hoạt động đúng cho variants.
  7. Rủi ro nếu fix sai nguyên nhân?
     - Thấp; chủ yếu là UI vẫn không ẩn đúng hoặc ẩn nhầm field liên quan.
  8. Tiêu chí pass/fail sau khi sửa?
     - Pass khi OFF thì 2 field con biến mất; ON thì hiện lại bình thường.

- Counter-Hypothesis (Giả thuyết đối chứng)
  - Giả thuyết: lỗi do `ModuleConfigPage` không hỗ trợ conditional visibility.
  - Bác bỏ bằng evidence: phần variants đang dùng chính cơ chế này và hoạt động đúng.

# IV. Proposal (Đề xuất)
- Hướng đã chốt với bạn: `A - Ẩn field con`.
- Thay đổi cụ thể:
  1. Sửa `lib/modules/configs/products.config.ts`.
  2. Thêm `dependsOn: 'enableProductFrames'` cho:
     - `productFrameOverlayFit`
     - `productFrameCleanupOnArChange`
- Không tách component mới.
- Không thêm preview mới vì hiện tại phần này không có preview, và bạn cũng xác nhận như vậy.
- Không sửa `ModuleConfigPage.tsx` vì cơ chế chung đã đúng, sửa ở config là đủ và ít rủi ro nhất.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `lib/modules/configs/products.config.ts`
  - Vai trò hiện tại: khai báo metadata cho features/settings/groups của module sản phẩm.
  - Thay đổi: thêm quan hệ phụ thuộc để 2 field con của product frame tự ẩn/hiện theo `enableProductFrames`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại block settings product frame trong `products.config.ts`.
2. Thêm `dependsOn: 'enableProductFrames'` cho 2 setting con.
3. Static review để chắc naming khớp key toggle cha và không ảnh hưởng variants/digital settings.
4. Bàn giao kèm tóm tắt thay đổi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Vì repo instruction cấm tự chạy lint/unit test, mình sẽ verify tĩnh bằng code path:
  - Xác nhận key cha là `enableProductFrames` đúng với setting toggle hiện có.
  - Xác nhận renderer `ModuleConfigPage` đã hỗ trợ `dependsOn` chung cho mọi setting.
  - Xác nhận chỉ 2 field con product frame bị tác động.
- Repro mong đợi sau khi áp dụng:
  1. Vào `/system/modules/products`.
  2. Tắt `Bật khung viền sản phẩm`.
  3. Hai field liên quan biến mất.
  4. Bật lại thì hai field hiện lại.

# VIII. Todo
- [ ] Thêm `dependsOn` cho `productFrameOverlayFit`
- [ ] Thêm `dependsOn` cho `productFrameCleanupOnArChange`
- [ ] Static review để chắc không ảnh hưởng setting khác

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi `enableProductFrames = false`, không còn thấy:
  - `Cách khung ôm ảnh`
  - `Xóa khung lệch AR khi đổi tỉ lệ`
- Khi `enableProductFrames = true`, cả 2 field hiện lại bình thường.
- Không thay đổi behavior của nhóm `Phiên bản sản phẩm` và các group khác.
- Không phát sinh component/group/preview mới ngoài phạm vi yêu cầu.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro:
  - Thấp; đây là thay đổi metadata cục bộ ở module products.
  - Nếu key `enableProductFrames` gõ sai trong `dependsOn`, field sẽ bị ẩn/hiện sai.
- Rollback:
  - Xóa 2 dòng `dependsOn` vừa thêm là quay về trạng thái cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Tách riêng section “Khung viền sản phẩm” như variants.
- Thêm preview cho khung viền sản phẩm.
- Dọn các dữ liệu setting cũ trong DB khi toggle OFF.
- Thay đổi UI ở `/admin/settings/product-frames` hoặc runtime site.

# XII. Open Questions (Câu hỏi mở)
- Không còn câu hỏi mở quan trọng; scope đã đủ rõ để triển khai.

Nếu bạn duyệt spec này, mình sẽ áp dụng đúng bản tối giản: chỉ ẩn các form liên quan bằng `dependsOn`, không mở rộng thêm.