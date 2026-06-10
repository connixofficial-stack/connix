# I. Primer

## 1. TL;DR kiểu Feynman

- Footer hiện **chưa cần thêm header** như Stats theo lựa chọn của bạn.
- Footer cũng **không cần desktop 3/4 grid** và **không đổi uploader logo**.
- Việc quan trọng nhất là sửa `spacing` để form → preview → site thật đều hiểu giống nhau.
- Cần giảm lệch giữa `FooterPreview` và `DynamicFooter`, vì hiện đang render 2 bộ layout riêng.
- Cần bổ sung cấu hình hiển thị phù hợp Footer: spacing + bo góc cho các phần có bo góc thật sự, không ép bo cả footer full-width.

## 2. Elaboration & Self-Explanation

Footer là component đặc thù: nó nằm cuối trang, thường full-width và không cần section header như Stats. Vì vậy hướng sửa không phải “copy nguyên Stats”, mà là lấy các rule phù hợp: cấu hình hiển thị gọn, spacing chạy thật, custom color/font ổn định, responsive text hợp lý, preview giống site thật.

Root issue lớn nhất là `spacing` đang có control nhưng không được normalize/lưu/render đầy đủ. Issue kế tiếp là preview và site thật có hai implementation riêng nên rất dễ lệch padding, grid, font size, border, màu. Hướng chuẩn hóa là gom các helper chung cho Footer, rồi cho preview và site cùng dùng contract đó.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể: khi chọn `Spacing trên dưới = Hẹp`, hiện form có thể set `config.spacing`, nhưng `normalizeFooterConfig()` không giữ field này và `DynamicFooter.tsx` không đọc field này, nên site thật vẫn giữ padding cứng như `py-10 md:py-14`.

Analogy: giống như remote TV có nút “giảm âm lượng”, nhưng TV không nối dây nhận tín hiệu đó; nút bấm có tồn tại nhưng không tạo thay đổi thật.

# II. Audit Summary (Tóm tắt kiểm tra)

- Scope đã đọc:
  - `app/admin/home-components/create/footer/page.tsx`
  - `app/admin/home-components/footer/_components/FooterForm.tsx`
  - `app/admin/home-components/footer/_components/FooterPreview.tsx`
  - `app/admin/home-components/footer/_lib/constants.ts`
  - `app/admin/home-components/footer/_lib/colors.ts`
  - `app/admin/home-components/footer/[id]/edit/page.tsx`
  - `components/site/DynamicFooter.tsx`
  - tham chiếu `stats` và `partners` để so pattern.
- Vấn đề nặng nhất:
  - `spacing` chưa end-to-end.
  - preview/site duplicate layout và có nhiều khác biệt.
  - cấu hình hiển thị chưa giống tinh thần `stats/partners`.
  - responsive font chưa có logic rõ như `stats`.
  - border/màu hard-code cần audit lại theo rule.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Evidence trực tiếp trong code cho thấy:

- `create/footer/page.tsx` có `DisplaySpacingCard`, nhưng `normalizeFooterConfig()` không return `spacing`.
- `FooterPreview.tsx` dùng padding cứng như `py-6`, `py-8`.
- `DynamicFooter.tsx` không có match `spacing`.
- Preview và runtime render riêng, không share section/layout helper.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- Có thể `HomeComponentRenderer` bọc spacing bên ngoài cho component thường, nhưng Footer hiện đi qua `DynamicFooter`, không đi qua registry renderer chuẩn; do đó giả thuyết này không giải thích được Footer.
- Có thể Footer cố ý full-width nên không cần mọi rule của Stats; đúng một phần, nhưng không loại trừ lỗi `spacing` và preview/site parity.

# IV. Proposal (Đề xuất)

## 1. Quyết định theo AskUser

- Không thêm `HeaderConfigSection` cho Footer.
- Không thêm desktop `3/4` grid cho Footer.
- Không đổi logo uploader sang bộ Upload/URL/Dán/Cắt 1:1.
- Chuẩn hóa full các phần còn lại phù hợp Footer.

## 2. Hướng sửa cụ thể

1. Chuẩn hóa config Footer:
   - Thêm/preserve `spacing` trong `DEFAULT_FOOTER_CONFIG` và `normalizeFooterConfig()`.
   - Thêm `cornerRadius` cho Footer config nếu cần áp dụng cho các phần có radius thật: logo background/social icon/surface nhỏ, không ép bo toàn footer full-width.
   - Thêm helper normalize/class cho `cornerRadius` theo pattern partners: `none`, `sm`, `lg`.

2. Chuẩn hóa form:
   - Gom “Cấu hình hiển thị” vào `FooterForm` hoặc shared sub-section để form create/edit nhất quán.
   - Giữ title mặc định/không thêm section header.
   - Tối ưu input ngắn/dropdown theo grid hợp lý: logo size + max width, logo background + corner radius, social toggles.
   - Không đổi uploader logo hiện tại.

3. Chuẩn hóa spacing render:
   - `FooterPreview` đọc `config.spacing` và map padding theo `normal/compact/none`.
   - `DynamicFooter` đọc cùng helper spacing.
   - Không rely vào `HomeComponentRenderer` vì Footer được render qua `DynamicFooter`.

4. Giảm lệch preview/site:
   - Tách helper chung cho class/layout cơ bản của Footer nếu scope file cho phép.
   - Ít nhất đồng bộ padding, breakpoint, text size, max width, border policy giữa `FooterPreview` và `DynamicFooter`.

5. Responsive typography:
   - Giảm font/padding ở tablet/mobile nơi đang quá đều hoặc quá nhỏ.
   - Không tạo typography phức tạp; chỉ map đơn giản desktop > tablet > mobile.

6. Color/token audit:
   - Giữ neutral hard-code hợp lý như trắng/đen/rgba khi là overlay/border neutral.
   - Hạn chế border dùng brand/secondary; đổi các border decorative sang neutral/token tương phản.
   - Giữ custom color/font hiện có, nhưng kiểm tra preview/site cùng nhận `primary`, `secondary`, `mode`, `font-active`.

# V. Files Impacted (Tệp bị ảnh hưởng)

## UI / Admin form

- Sửa: `app/admin/home-components/create/footer/page.tsx` — hiện đang đặt `DisplaySpacingCard` ngoài `FooterForm`; sẽ điều chỉnh để không duplicate và truyền config hiển thị đúng contract.
- Sửa: `app/admin/home-components/footer/[id]/edit/page.tsx` — hiện có spacing card riêng và layout preview/form chưa gọn; sẽ đồng bộ với create.
- Sửa: `app/admin/home-components/footer/_components/FooterForm.tsx` — hiện chứa form chính; sẽ thêm/điều chỉnh cấu hình hiển thị gọn, không thêm header, không đổi uploader.

## Preview / Runtime

- Sửa: `app/admin/home-components/footer/_components/FooterPreview.tsx` — hiện padding/font/grid khác site; sẽ đọc spacing/cornerRadius và đồng bộ responsive hơn.
- Sửa: `components/site/DynamicFooter.tsx` — site runtime hiện không đọc spacing; sẽ áp dụng cùng contract hiển thị với preview.

## Config / Shared helper

- Sửa: `app/admin/home-components/footer/_types/index.ts` — thêm type field cần thiết như `cornerRadius` nếu triển khai.
- Sửa: `app/admin/home-components/footer/_lib/constants.ts` — preserve `spacing`, normalize field mới, thêm helper class nếu cần.
- Sửa: `app/admin/home-components/footer/_lib/colors.ts` — audit border/hard-code màu nếu cần đổi sang neutral/token hợp lý.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại các file Footer và pattern Stats/Partners trước khi sửa.
2. Cập nhật type/default/normalize cho `spacing` và `cornerRadius` phù hợp Footer.
3. Chỉnh form create/edit để cấu hình hiển thị gọn, không thêm header/grid 3-4/uploader mới.
4. Chỉnh preview đọc config hiển thị và responsive font/padding.
5. Chỉnh `DynamicFooter` theo cùng contract preview.
6. Review tĩnh: field lưu/load, fallback legacy config, custom color/font, text overflow, border color.
7. Nếu được triển khai code: chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` theo rule repo, không chạy lint/unit/build.
8. Commit thay đổi sau khi kiểm tra tĩnh và typecheck đạt.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review:
  - `spacing` có trong default, normalize, create, edit, preview, runtime.
  - Legacy config thiếu field mới vẫn fallback đúng.
  - Preview và site có cùng logic padding/responsive chính.
  - Không thêm header cho Footer.
  - Không thêm desktop 3/4 grid cho Footer.
  - Không đổi uploader logo.
- Typecheck nếu có sửa code TypeScript:
  - `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
- Không chạy lint/unit/build vì project instruction cấm tự chạy lint/unit test và không yêu cầu build.

# VIII. Todo

- [ ] Preserve `spacing` trong Footer config.
- [ ] Thêm cấu hình bo góc phù hợp Footer nếu không làm méo footer full-width.
- [ ] Gọn hóa form create/edit theo grid hợp lý.
- [ ] Đồng bộ spacing/responsive giữa preview và site.
- [ ] Audit border/hard-code color.
- [ ] Review custom font/color parity.
- [ ] Typecheck theo command repo.
- [ ] Commit thay đổi nếu được duyệt triển khai.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Chọn spacing `none/compact/normal` trong Footer tạo thay đổi quan sát được ở preview và site thật.
- Edit lại Footer không làm mất spacing/cornerRadius đã lưu.
- Footer không có section header mới.
- Footer không có tùy chọn desktop 3/4 grid mới.
- Logo uploader Footer vẫn là uploader hiện tại.
- Preview và site không còn lệch rõ padding/font/grid chính.
- Border decorative không lạm dụng brand color.
- Custom color/font từ `/system/home-component` vẫn áp dụng cho Footer.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk: thay đổi `DynamicFooter` ảnh hưởng mọi site đang có Footer active.
- Risk: thêm field config mới cần fallback tốt cho dữ liệu cũ.
- Rollback: revert commit sau triển khai; config cũ vẫn không bị phá nếu normalize giữ fallback không destructive.

# XI. Out of Scope (Ngoài phạm vi)

- Không thêm HeaderConfigSection cho Footer.
- Không thêm desktop 3/4 grid cho Footer.
- Không đổi logo uploader sang Upload/URL/Dán/Cắt 1:1.
- Không refactor toàn bộ hệ thống home-components khác.
- Không chạy lint/unit/build.

# XII. Open Questions (Câu hỏi mở)

- Không còn câu hỏi mở bắt buộc sau AskUser; các quyết định chính đã được chốt.