# I. Primer

## 1. TL;DR kiểu Feynman
- Vấn đề không phải do số item render nữa, mà do CSS breakpoint (`md:`/`lg:`) trong preview vẫn tính theo viewport thật của admin page, không tính theo khung mobile 375px.
- Vì admin page đang rộng >768px, class `md:grid-cols-3` vẫn bật dù bên trong BrowserFrame là mobile.
- Site thật mobile đúng vì viewport thật là mobile nên `md:` không bật.
- Cách sửa đúng: khi `isPreview`, dùng prop `device` để ép class grid/width theo device thay vì phụ thuộc Tailwind breakpoint viewport.
- Không commit cho đến khi bạn xác nhận.

## 2. Elaboration & Self-Explanation
Observation (bằng chứng): screenshot mobile preview vẫn hiện 3 cột trong khung mobile. Code hiện tại ở `components/site/ServicesSectionCore.tsx` dùng `cardsGridClassName = 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 ...'`. Trong admin preview, phần tử nằm trong div mobile width 375px, nhưng CSS media query `md:` vẫn nhìn theo viewport trình duyệt/admin page, không nhìn theo width của BrowserFrame.

Inference (suy luận): vì viewport admin đang rộng, `md:grid-cols-3` active, nên trong preview mobile vẫn thành 3 cột. Đây là root cause chính. Việc trước đó cắt `visibleForPreview` xuống 1 item chỉ che triệu chứng sai và còn làm card hẹp/bậy, không phản ánh site thật.

Decision (hướng xử lý): giữ số item preview như site (`slice(0, 6)`) và sửa class layout theo `device` khi `isPreview=true`:
- mobile preview: luôn `grid-cols-1`
- tablet preview: nếu desktopColumns=3 thì `grid-cols-3`; nếu desktopColumns=4 thì `grid-cols-2`
- desktop preview/runtime: giữ rule hiện tại

## 3. Concrete Examples & Analogies
Ví dụ cụ thể: `Icon Cards` hiện đang render trong khung 375px, nhưng vì màn hình admin là desktop nên Tailwind `md:grid-cols-3` thắng `grid-cols-1`. Kết quả là 3 card chen trong 375px như ảnh bạn gửi.

Analogy: giống như đặt một tờ giấy nhỏ lên bàn lớn, nhưng thước đo lại đang đo cái bàn chứ không đo tờ giấy. Preview mobile cần đo theo “tờ giấy” (`device='mobile'`), không theo “cái bàn” (viewport admin).

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã đọc screenshot: mobile preview `Icon Cards` vẫn chia 3 cột.
- Đã đọc `ServicesSectionCore.tsx`: layout `cards` dùng class responsive Tailwind `md:`/`lg:`.
- Đã đọc `BrowserFrame.tsx` và `usePreviewDevice.tsx`: mobile preview chỉ đặt wrapper `w-[375px]`, không tạo viewport/media-query riêng.
- Root cause: Tailwind breakpoint vẫn phụ thuộc viewport admin, không phụ thuộc container preview.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: High.
- Lý do: ảnh cho thấy đúng pattern breakpoint sai; code dùng `md:grid-cols-3`; BrowserFrame không isolate media query.

Counter-hypothesis:
- “Do render quá nhiều item”: Low. Render nhiều item không làm 3 cột nếu grid thực sự là `grid-cols-1`; nó chỉ tạo nhiều hàng.
- “Do width BrowserFrame sai”: Medium/Low. BrowserFrame width đang đúng khoảng mobile, nhưng breakpoint CSS không theo container nên vẫn sai.

# IV. Proposal (Đề xuất)
Sửa trong `components/site/ServicesSectionCore.tsx`:
1. Giữ `visibleForPreview = items.slice(0, 6)` để không che lỗi bằng cách cắt item.
2. Tạo helper/device-aware class cho `cards`:
   - nếu `isPreview && device === 'mobile'` → `grid grid-cols-1 gap-4`
   - nếu `isPreview && device === 'tablet'`:
     - desktopColumns=4 → `grid grid-cols-2 gap-4`
     - desktopColumns=3 → `grid grid-cols-3 gap-4`
   - còn lại dùng runtime class hiện tại:
     - desktopColumns=4 → `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
     - desktopColumns=3 → `grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4`
3. Với `carousel`, nếu còn lệch tương tự thì cũng áp dụng device-aware width trong preview:
   - mobile preview: card `w-full` hoặc gần full theo site thực mobile
   - tablet preview: 2/3 card theo desktopColumns rule
   - desktop/runtime: giữ responsive class hiện tại

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `components/site/ServicesSectionCore.tsx` — hiện là shared renderer cho preview/site. Thay đổi sẽ chỉ điều chỉnh class preview theo `device`, giữ runtime site không đổi.

# VI. Execution Preview (Xem trước thực thi)
1. Chỉnh helper class trong `ServicesSectionCore.tsx`.
2. Không đổi data model/config.
3. Không đổi form/admin settings.
4. Review diff tĩnh để đảm bảo site runtime không bị đổi ngoài ý muốn.
5. Dừng để bạn xem lại, chỉ commit nếu bạn xác nhận.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Không tự chạy lint/test theo AGENTS.
- Kiểm chứng tĩnh:
  - mobile preview `Icon Cards`: class cuối cùng phải là `grid-cols-1`, không có `md:grid-cols-3` active trong preview mobile.
  - tablet preview: đúng 3 hoặc 2 cột theo desktopColumns.
  - runtime site: vẫn dùng responsive Tailwind hiện tại.

# VIII. Todo
- [ ] Sửa `cardsGridClassName` thành device-aware trong preview.
- [ ] Nếu cần, sửa `carouselCardClassName` thành device-aware trong preview.
- [ ] Review diff.
- [ ] Chờ bạn xác nhận trước khi commit.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Mobile preview `Icon Cards` hiển thị 1 card mỗi hàng, full width trong khung mobile.
- Không cắt xuống chỉ còn 1 item; danh sách vẫn có nhiều item nhưng xếp dọc.
- Tablet preview đúng rule: desktop 3 → tablet 3; desktop 4 → tablet 2.
- Site thực không bị thay đổi ngoài config responsive đã có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: chỉ đổi class preview-aware trong renderer shared.
- Rollback: revert thay đổi trong `ServicesSectionCore.tsx` hoặc restore từ git.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi UI form.
- Không đổi Convex/schema.
- Không commit khi chưa được xác nhận.