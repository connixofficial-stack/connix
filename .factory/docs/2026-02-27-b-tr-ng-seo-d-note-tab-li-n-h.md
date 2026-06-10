Đã rõ yêu cầu, mình sẽ làm theo đúng hướng: **ẩn khỏi UI và dọn luôn dữ liệu cũ**.

### Phạm vi chỉnh
1. **`app/admin/settings/page.tsx`**
   - Tạo hằng `REMOVED_SEO_KEYS` gồm:
     - `seo_robots`, `seo_business_type`, `seo_opening_hours`, `seo_price_range`, `seo_geo_lat`, `seo_geo_lng`, `seo_hreflang`.
   - Loại các key này khỏi luồng render (`fieldsByGroup`) để không còn xuất hiện ở `/admin/settings`.
   - Loại các key này khỏi luồng save (`settingsToSave`) để không bị ghi lại.
   - Thêm note UX ngắn ở tab **Liên hệ**: **“Dữ liệu này hiển thị ở trang /contact”**.

2. **`components/modules/ModuleConfigPage.tsx`**
   - Khi `config.key === 'settings'`, lọc `localFields` trước khi truyền vào `FieldsCard` để các key SEO dư ở trên **không còn hiện trong `/system/modules/settings`** (không toggle được nữa).

3. **`convex/settings.ts`**
   - Thêm mutation mới dạng `removeMultiple(keys: string[])` để xóa nhiều setting theo key (dùng 1 lần cho cleanup dữ liệu cũ).

4. **Dọn dữ liệu cũ ngay trong DB (theo yêu cầu)**
   - Gọi `removeMultiple` từ `app/admin/settings/page.tsx` (1 lần có kiểm soát khi vào trang hoặc trước save, idempotent) để xóa dữ liệu các key đã bỏ.

5. **Ngăn seed tạo lại các trường/giá trị đã bỏ**
   - Cập nhật `convex/seeders/settings.seeder.ts`: bỏ các default setting + `moduleFields` tương ứng 7 key trên.
   - Cập nhật `convex/seed.ts` tương ứng để đồng bộ với seeder hiện hành, tránh seed lại trường cũ.

### Xác minh sau khi làm
- `/admin/settings`: không còn các trường bạn liệt kê.
- `/system/modules/settings`: không còn các field SEO đó trong danh sách field.
- Tab Liên hệ có đúng câu: **“Dữ liệu này hiển thị ở trang /contact”**.
- Chạy `bunx tsc --noEmit`.
- Commit theo rule repo (không push).