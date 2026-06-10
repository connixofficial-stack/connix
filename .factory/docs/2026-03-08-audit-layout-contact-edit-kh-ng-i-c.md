## Audit Summary

### Observation
1. Ở trang edit Contact, `ContactPreview` đang render bộ nút đổi layout qua `PreviewWrapper`, nhưng `page.tsx` không truyền `selectedStyle` và `onStyleChange` xuống preview như trang create đang làm.
   - Evidence: `app/admin/home-components/contact/[id]/edit/page.tsx` chỉ truyền `config`, `brandColor`, `secondary`, `mode`, `title`, `mapData` vào `ContactPreview`.
   - Evidence: `app/admin/home-components/create/contact/page.tsx` có truyền `selectedStyle={style}` và `onStyleChange={(nextStyle) => setConfig({ ...normalizedConfig, style: nextStyle as ContactStyle })}`.
2. `ContactPreview` chỉ đổi layout thật sự khi có `onStyleChange`; nếu không có callback thì nút layout chỉ gọi `onStyleChange?.(...)` và không cập nhật state edit form.
   - Evidence: `app/admin/home-components/contact/_components/ContactPreview.tsx` dùng `selectedStyle ?? normalizedConfig.style` và truyền `setPreviewStyle={(value) => onStyleChange?.(value as ContactStyle)}` vào `PreviewWrapper`.
3. `ConfigEditor` không có control nào để đổi `value.style`, nên toàn bộ edit page hiện không có nguồn state nào thay đổi layout.
   - Evidence: `app/admin/home-components/contact/_components/ConfigEditor.tsx` chỉ sửa map/contact/form/social/texts; không có UI nào đọc/ghi `value.style`.
4. Payload save thực ra đã hỗ trợ `style`, nên lỗi nằm ở UI state binding chứ không phải mutation/persistence.
   - Evidence: `app/admin/home-components/contact/[id]/edit/page.tsx` submit với `config: { ...toContactConfigPayload(nextConfig), style: nextConfig.style }`.
   - Evidence: `app/admin/home-components/contact/_lib/normalize.ts` vẫn normalize/snapshot `style` đầy đủ.

### Root-cause checklist
1. Triệu chứng: click đổi layout ở edit Contact nhưng layout không đổi; expected là preview đổi và save được style mới.
2. Phạm vi: trang `/admin/home-components/contact/[id]/edit`, ảnh hưởng admin khi sửa Contact component.
3. Tái hiện: ổn định, chỉ cần mở edit page rồi bấm các nút style trên preview.
4. Mốc thay đổi gần nhất: create page đã có wiring style, edit page chưa parity.
5. Dữ liệu còn thiếu: chưa có runtime browser log, nhưng static code evidence đã đủ mạnh vì callback bị bỏ trống.
6. Giả thuyết thay thế đã xét:
   - `normalize` làm rớt `style`: đã loại trừ vì normalize/snapshot/payload đều giữ `style`.
   - PreviewWrapper lỗi UI: đã loại trừ vì wrapper chỉ gọi callback; create page dùng cùng wrapper vẫn đúng.
7. Rủi ro nếu fix sai nguyên nhân: sửa mutation/normalize không giải quyết được hành vi click layout.
8. Tiêu chí pass/fail: click style đổi preview ngay, `hasChanges` bật, submit lưu được style mới, reload trang vẫn giữ style đã chọn.

## Root Cause Confidence
High — evidence trực tiếp cho thấy edit page thiếu state wiring `selectedStyle`/`onStyleChange`, trong khi create page và các module khác như Team edit đã có pattern đúng.

## Proposal

### Phương án đề xuất
Áp dụng parity với create page và các edit page khác:

1. Trong `app/admin/home-components/contact/[id]/edit/page.tsx`
   - derive `const style = normalizedConfig.style`.
   - truyền `selectedStyle={style}` vào `ContactPreview`.
   - truyền `onStyleChange={(nextStyle) => setConfig({ ...normalizedConfig, style: nextStyle as ContactStyle })}`.
2. Import `ContactStyle` vào edit page để typing nhất quán với create page.
3. Giữ nguyên `ConfigEditor` nếu mục tiêu chỉ là sửa bug “bấm layout không đổi được”; không mở rộng scope thêm dropdown/layout selector mới.

### Counter-hypothesis check sau fix
- Nếu preview vẫn không đổi sau khi wiring callback, cần kiểm tra tiếp `ContactSectionShared` có đang ignore `style` prop không. Hiện evidence cho thấy có switch theo `style`, nên khả năng thấp.

## Verification Plan
1. Repro manual:
   - Mở `http://localhost:3000/admin/home-components/contact/k974bkz6rk9k5qpz6wcv2zt7b182hzvw/edit`.
   - Click lần lượt 2–3 layout trong preview.
   - Xác nhận preview đổi ngay và nút lưu được enable.
2. Persistence:
   - Save, reload page, xác nhận layout vừa chọn vẫn được load lại.
3. Regression nhẹ:
   - So sánh với create Contact để đảm bảo hành vi chọn layout đồng nhất.
4. Verify code:
   - Chạy `bunx tsc --noEmit` vì có thay đổi TS/TSX.

Nếu bạn duyệt spec, tôi sẽ implement đúng phạm vi fix này rồi verify.