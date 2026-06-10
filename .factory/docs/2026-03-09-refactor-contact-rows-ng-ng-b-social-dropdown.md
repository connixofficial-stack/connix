## Audit Summary

### Observation
- `contact/_types/index.ts` đang hard-code dữ liệu liên hệ thành 4 field cố định: `address`, `phone`, `email`, `workingHours`; social cũng chỉ có `{ platform, url }`.
- `contact/_components/ConfigEditor.tsx` đang render form cố định cho 4 field đó, nên create/edit không cơ động.
- `contact/_components/ContactSectionShared.tsx` render toàn bộ 6 style dựa trên 4 field hard-code + icon cố định, nên site/preview cũng không linh hoạt.
- `footer/_components/FooterForm.tsx` đã có pattern social dropdown 7 nền tảng + load từ Settings + toggle `useOriginalSocialIconColors`; đây là pattern tốt để tái dùng cho Contact.
- Create Contact hiện đang seed dữ liệu mẫu hard-code trực tiếp trong `create/contact/page.tsx`, chưa lấy từ Settings để CoC.

### Root cause
1. Data model Contact cũ được thiết kế theo schema cố định, không có `contactItems[]` để biểu diễn từng dòng linh hoạt.
2. UI editor Contact chưa có row manager dạng add/remove/reorder + icon picker.
3. Contact social chưa dùng chung platform contract với Footer nên UX và prefill lệch nhau.
4. Preview/site render đang map thẳng vào 4 field cố định nên đổi editor thôi là chưa đủ, cần đổi luôn render layer.

### Counter-hypothesis
- Không phải chỉ do form edit hard-code; kể cả sửa form, preview/site vẫn sẽ bị khóa bởi `ContactSectionShared.tsx`.
- Không nên chỉ “ẩn” 4 field cũ; cần normalize/migrate để dữ liệu cũ vẫn render đúng sau refactor.

## Root Cause Confidence
High — evidence rõ ở `app/admin/home-components/contact/_types/index.ts`, `.../ConfigEditor.tsx`, `.../ContactSectionShared.tsx`, và pattern chuẩn đã có ở `footer/_components/FooterForm.tsx`. Yêu cầu user cũng đã chốt: row cấu trúc `icon + nhãn + nội dung + link`, áp dụng cho tất cả style, social dùng 7 platform như Footer, create seed đủ dòng mẫu kể cả trống.

## Proposal

### 1) Đổi data model Contact sang rows động, có backward compatibility
Files:
- `app/admin/home-components/contact/_types/index.ts`
- `app/admin/home-components/contact/_lib/constants.ts`
- `app/admin/home-components/contact/_lib/normalize.ts`
- `app/admin/home-components/contact/_lib/validation.ts`

Thay đổi:
- Thêm `ContactInfoItem`:
  - `id: number`
  - `icon: string`
  - `fieldKey?: string` (để biết item nào seed từ settings nào: `contact_address`, `contact_phone`, `contact_email`, `working_hours`)
  - `label: string`
  - `value: string`
  - `href?: string`
- Mở rộng `ContactSocialLink` thành contract gần Footer hơn:
  - `id: number`
  - `platform: string`
  - `icon: string`
  - `url: string`
- `ContactConfig` / `ContactConfigState` thêm `contactItems: ContactInfoItem[]`.
- Giữ đọc được dữ liệu legacy (`address/phone/email/workingHours`) trong `normalizeContactConfig`; nếu config cũ chưa có `contactItems`, tự migrate sang 4 dòng mặc định.
- `toContactConfigPayload` vẫn xuất schema mới, nhưng tạm có thể giữ thêm legacy fields trong payload một vòng để tránh ảnh hưởng chỗ khác nếu đang đọc trực tiếp.
- Validation mới:
  - validate `href` nếu có
  - validate social `url`
  - không validate theo kiểu phone/email riêng cho row động nữa, vì user muốn cơ động.

### 2) Tạo nguồn option icon Lucide khoảng 100 item cho dropdown có preview icon
Files:
- mới: `app/admin/home-components/contact/_lib/iconOptions.ts`
- có thể tái dùng cho nơi khác sau này nếu hợp lý

Thay đổi:
- Export danh sách khoảng 100 icon Lucide phổ biến cho contact/info use cases.
- Mỗi option gồm: `value`, `label`, `Icon`.
- Có helper resolve icon theo string, fallback `CircleHelp`/`Globe`.
- Không dùng dynamic import phức tạp; import tĩnh danh sách icon để predictable, dễ typecheck.

### 3) Thay ConfigEditor của Contact bằng 2 manager động
Files:
- mới: `app/admin/home-components/contact/_components/ContactInfoItemsManager.tsx`
- cập nhật: `app/admin/home-components/contact/_components/SocialLinksManager.tsx`
- cập nhật: `app/admin/home-components/contact/_components/ConfigEditor.tsx`

Thay đổi Contact rows:
- Bỏ UI nhập cố định: Địa chỉ / SĐT / Email / Giờ làm việc.
- Thêm block “Dòng thông tin liên hệ” giống style row manager:
  - add row
  - delete row
  - reorder drag handle nếu scope cho phép nhanh; nếu muốn an toàn có thể làm up/down trước, nhưng em nghiêng về drag handle vì repo đã có pattern ở Footer.
  - mỗi row có:
    - dropdown icon có preview icon
    - input `Tên trường`/`field key` nếu cần hiển thị nội bộ thì readonly hoặc ẩn; tránh lộ tech detail ra UX
    - input `Nhãn hiển thị`
    - input `Nội dung`
    - input `Link tuỳ chọn` (`tel:`, `mailto:`, `https://...`)
- Có nút `Load từ Settings` để reset/prefill contact rows từ settings contact.
- Create mặc định sẽ seed sẵn 4 row mẫu từ settings: địa chỉ, điện thoại, email, giờ làm việc; nếu settings trống thì vẫn tạo đủ 4 row với label/icon chuẩn và value rỗng.

Thay đổi Social:
- Contact `SocialLinksManager` đổi theo pattern Footer:
  - dropdown 7 nền tảng: Facebook, Instagram, Youtube, TikTok, Zalo, X, Pinterest
  - mỗi row có platform dropdown + URL
  - tự set `icon` theo platform
  - chặn duplicate platform như Footer
  - add/remove/reorder
- Thêm toggle `useOriginalSocialIconColors?: boolean` vào Contact để user chọn dùng màu icon gốc hoặc dùng palette component, giống Footer.
- Thêm `Load từ Settings` cho social Contact, dùng cùng source keys hiện có (`social_facebook`, `social_instagram`, `social_youtube`, `social_tiktok`, `contact_zalo`; nếu repo đã có `social_twitter` thì map vào X, nếu có `social_pinterest` thì map thêm sau, còn chưa có thì để trống option).

### 4) Prefill create/edit theo Settings thay vì hard-code cứng
Files:
- `app/admin/home-components/create/contact/page.tsx`
- `app/admin/home-components/contact/[id]/edit/page.tsx`
- có thể thêm helper mới trong `contact/_lib/constants.ts` hoặc `normalize.ts`

Thay đổi:
- Tạo helper `buildDefaultContactItemsFromSettings(settings)`.
- Tạo helper `buildDefaultContactSocialsFromSettings(settings)`.
- `create/contact/page.tsx` khởi tạo state từ helper thay vì hard-code `123 Nguyễn Huệ...`, `1900 1234`...
- Edit page giữ dữ liệu đã lưu; chỉ dùng migration helper khi mở bản ghi cũ chưa có schema mới.

### 5) Refactor toàn bộ preview/site của Contact để render từ `contactItems[]`
Files:
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx`
- `app/admin/home-components/contact/_components/ContactPreview.tsx`
- `components/site/ContactSection.tsx`

Thay đổi:
- Thêm helper render `contactItems` dùng chung:
  - resolve icon từ `item.icon`
  - nếu `href` có giá trị thì render clickable
  - nếu thiếu `href` thì render text thường
- Áp dụng cho tất cả 6 style theo yêu cầu user.
- Cách mapping theo style:
  - `modern`, `floating`, `elegant`, `centered`: render danh sách row dọc.
  - `grid`, `minimal`: render cards/grid từ `contactItems` thay vì 3-4 card cố định.
- Giữ `texts.*` chỉ cho heading/badge/description chung của section; bỏ lệ thuộc vào các key kiểu `addressLabel`, `phoneLabel`, `emailLabel`, `hoursLabel` vì label đã nằm trong từng row.
- Social render dùng platform/icon mới và hỗ trợ `useOriginalSocialIconColors` giống Footer.

### 6) Dọn text config cũ để UX gọn hơn
Files:
- `contact/_lib/constants.ts`
- `contact/_components/DynamicTextFields.tsx` (nếu còn cần)

Thay đổi:
- Bỏ các text keys chỉ phục vụ 4 field hard-code (`addressLabel`, `phoneLabel`, `emailLabel`, `hoursLabel`, `contactLabel`, `addressHeading`...).
- Giữ lại text section-level thật sự cần: ví dụ `badge`, `heading`, `description`.
- Mục tiêu: editor gọn, đúng tinh thần user muốn “UX và cơ động”, không bắt chỉnh label ở 2 nơi.

### 7) Verification plan khi implement
- Repro create route: `/admin/home-components/create/contact`
  - thấy 4 row mặc định từ Settings hoặc rỗng nếu Settings trống
  - add/remove/reorder row OK
  - icon dropdown hiển thị icon + label
  - social dropdown 7 platform + load từ Settings OK
  - toggle màu social hoạt động
- Repro edit route user đưa: `/admin/home-components/contact/k974bkz6rk9k5qpz6wcv2zt7b182hzvw/edit`
  - bản ghi cũ được migrate sang rows động, không mất dữ liệu
  - save xong reload vẫn giữ đúng schema mới
- Preview 6 styles đều render từ rows động, không còn phụ thuộc 4 field cũ
- Site component `components/site/ContactSection.tsx` render đúng dữ liệu mới
- Run verify bắt buộc sau code:
  - kiểm tra script trong `package.json`
  - `bunx tsc --noEmit`
  - lint/test liên quan theo script repo
  - nếu có test contact hiện hữu, cập nhật/đảm bảo pass

## Verification Plan
1. Đọc `package.json` để xác định lệnh lint/test/typecheck chuẩn repo.
2. Chạy `bunx tsc --noEmit` vì có thay đổi TS/schema.
3. Chạy lint và test liên quan Contact/Home Components.
4. Manual verify create/edit/preview cho Contact và social behavior theo 2 route user nêu.
5. Kiểm tra backward compatibility bằng cách mở record Contact cũ trên edit page, save lại, reload.

Nếu anh duyệt spec này, em sẽ implement theo hướng: migrate schema mềm, thay editor sang row manager động, đồng bộ social Contact với Footer, rồi verify đầy đủ trước khi commit.