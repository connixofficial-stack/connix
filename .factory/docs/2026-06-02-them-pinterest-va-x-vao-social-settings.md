# I. Primer

## 1. TL;DR kiểu Feynman
Hãy tưởng tượng trang web của bạn giống như một ngôi nhà có nhiều cửa sổ kết nối ra thế giới bên ngoài (đây chính là các liên kết mạng xã hội như Facebook, Instagram). Hiện tại, ngôi nhà của bạn mới chỉ mở các cửa sổ cho Facebook, Instagram và Youtube ở dưới chân trang (Footer) và trong phần thiết lập thông tin liên hệ. 

Bây giờ, bạn muốn mở thêm hai cửa sổ mới là **X (Twitter)** và **Pinterest**. Để làm được điều này:
1. Chúng ta sẽ làm một công tắc (switch) bật/tắt cho hai cửa sổ này trong phần quản lý hệ thống (`/system/modules/settings`).
2. Khi công tắc được bật, giao diện nhập liệu ở trang cài đặt liên hệ (`/admin/settings/contact`) sẽ xuất hiện thêm hai ô để bạn dán link trang X và Pinterest của mình vào.
3. Khi bạn dán link và lưu lại, trang web của bạn sẽ tự động vẽ thêm icon X và Pinterest ở dưới chân trang (Footer) của website chính thức để khách truy cập có thể click vào.

## 2. Elaboration & Self-Explanation
Yêu cầu của người dùng bao gồm hai phần:
- Trang cài đặt thông tin liên hệ (`/admin/settings/contact`) của Admin chưa hiển thị hai mạng xã hội là Pinterest và X. Cần thêm hai ô nhập liệu này vào giao diện cài đặt liên hệ.
- Trong giao diện cấu hình module hệ thống (`/system/modules/settings`), quản trị viên hệ thống phải có thể bật/tắt (cho phép hiển thị hoặc ẩn đi) hai trường Pinterest và X này giống như các trường mạng xã hội khác (Zalo, Facebook, TikTok...).

**Cơ chế hoạt động hiện tại của hệ thống:**
1. Trang cài đặt của admin (`SettingsPageShell.tsx`) không tự động render các input cố định mà nó sẽ query danh sách các trường được cấu hình động từ bảng `moduleFields` trong Convex DB thông qua API `api.admin.modules.listModuleFields`. Các trường thuộc group `social` sẽ được tự động gom nhóm lại và hiển thị ở phần "Mạng xã hội" ngay bên dưới phần "Thông tin liên hệ".
2. Dữ liệu cấu hình các trường này (bao gồm cả trạng thái bật/tắt `enabled: true/false`) được định nghĩa trong file cấu hình module tĩnh của Next.js tại `lib/modules/configs/settings.config.ts`.
3. Khi hệ thống khởi chạy hoặc khi admin vào trang cấu hình module hệ thống (`/system/modules/settings`), hệ thống sẽ gọi mutation Convex để đồng bộ dữ liệu cấu hình tĩnh từ Next.js (`settings.config.ts`) vào Convex DB (`moduleFields`). Do đó, chỉ cần khai báo hai trường này trong `settings.config.ts` thì trang cấu hình bật/tắt module sẽ tự động hiển thị hai switch bật/tắt, và khi admin bật/tắt thì Convex DB sẽ cập nhật trường tương ứng, kéo theo giao diện cài đặt admin tự động thêm/bớt ô nhập liệu!
4. Phía client (website chính), component `DynamicFooter.tsx` hiển thị các icon mạng xã hội dựa trên dữ liệu lấy từ hook `useSocialLinks()`. Hook này hiện chưa trả về Pinterest, và icon Pinterest cũng chưa được hỗ trợ vẽ trong thư viện icon dùng chung `getIconNode` của Speed Dial.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi quản trị viên vào trang quản lý module hệ thống (`/system/modules/settings`) và gạt công tắc bật cho **Pinterest**, Convex DB sẽ cập nhật dòng record có `fieldKey: 'social_pinterest'` trong bảng `moduleFields` thành `enabled: true`. Khi đó, tại trang cài đặt admin (`/admin/settings/contact`), hệ thống kiểm tra thấy trường Pinterest đã bật, nó sẽ render thêm một input text có nhãn là "Pinterest" để người dùng nhập link URL (ví dụ: `https://pinterest.com/mybrand`). Link này sau khi lưu sẽ được lưu vào bảng `settings` với key là `social_pinterest`. Cuối cùng, hook `useSocialLinks()` đọc dữ liệu từ DB, thấy có giá trị `social_pinterest`, Footer của trang web sẽ tự động render icon Pinterest màu đỏ đặc trưng cùng link đi kèm.
- **Ẩn dụ đời thường:** Hệ thống cấu hình giống như một bảng menu món ăn của nhà hàng. Thay vì đầu bếp phải tự đi sửa từng tờ thực đơn khi có món mới, nhà hàng có một bảng điều khiển trung tâm (`settings.config.ts`). Chỉ cần thêm món "Pinterest" và "X" vào bảng điều khiển này, món ăn đó sẽ tự động hiển thị lên bảng menu gọi món của khách (`/system/modules/settings`). Khi khách chọn món (bật switch), phục vụ sẽ tự động mang ra bát đĩa (input trong admin settings) để khách sử dụng, và cuối cùng món ăn thực tế (icon mạng xã hội) sẽ xuất hiện trên bàn tiệc (Footer trang web).

---

# II. Audit Summary (Tóm tắt kiểm tra)

Qua kiểm tra codebase, chúng tôi thu được các thông tin thực tế sau:
1. **Trang thiết lập Admin Settings**: `/admin/settings/contact` sử dụng `SettingsPageShell` và query động danh sách các trường cài đặt từ Convex DB thông qua `fieldsData` (`api.admin.modules.listModuleFields`). Nó lọc các trường có `group === 'social'` và render chúng thông qua `socialFields.map(field => renderField(field))`.
2. **Cấu hình tĩnh của Settings Module**: Định nghĩa tại [settings.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/settings.config.ts). Nó chứa danh sách `features` và `runtimeConfig.fields`. Các trường mạng xã hội hiện tại gồm `social_facebook`, `social_instagram`, `social_youtube` và `social_tiktok` nhưng hoàn toàn thiếu Pinterest và X.
3. **Database Seeder & Preset**:
   - `convex/seed.ts` chứa mutation `seedSettingsModule` để khởi tạo cấu hình và dữ liệu mẫu cho module settings trong Convex DB.
   - `convex/seeders/settings.seeder.ts` chứa class seeder tương tự dùng để seed data ban đầu, bao gồm cả việc gọi `syncModuleRuntimeConfig` để đồng bộ runtime config từ code Next.js vào Convex DB.
   - `convex/homepageSnapshots.ts` sử dụng một danh sách hằng số các key bắt buộc `SNAPSHOT_REQUIRED_SETTINGS_KEYS.social`, trong đó **đã có** khai báo `'social_pinterest'` và `'social_twitter'`.
4. **Hiển thị ngoài Client (Footer)**:
   - [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/DynamicFooter.tsx) sử dụng hàm `getIconNode` từ Speed Dial để render icon mạng xã hội. Danh sách màu sắc nguyên bản `SOCIAL_ORIGINAL_COLORS` đã khai báo màu cho `x` (`#000000`) và `pinterest` (`#E60023`).
   - Hàm `getIconNode` trong [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx) **đã hỗ trợ case `'x'` nhưng CHƯA hỗ trợ case `'pinterest'`**, dẫn tới icon Pinterest bị fallback thành icon điện thoại nếu cố render.
   - Hook `useSocialLinks()` trong [hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts) chưa trả về Pinterest (`pinterest`) và X (`twitter`).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### 1. Nguyên nhân gốc
- **Thiếu khai báo cấu hình tĩnh**: Module cấu hình [settings.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/settings.config.ts) chưa khai báo các trường `social_pinterest` và `social_twitter` trong danh sách `runtimeConfig.fields`. Do đó hệ thống không sinh ra switch bật tắt trong `/system/modules/settings`, dẫn tới database không có cấu hình trường, khiến admin settings contact không thể hiển thị 2 ô nhập liệu này.
- **Thiếu logic trong hook và component client**: Hook `useSocialLinks` chưa truy vấn và trả về giá trị của `social_pinterest` và `social_twitter` từ DB, đồng thời `DynamicFooter.tsx` chưa lấy giá trị của 2 trường này từ hook khi render danh sách mạng xã hội mặc định (fallback từ settings).
- **Thiếu icon Pinterest**: Hàm vẽ icon dùng chung `getIconNode` trong Speed Dial chưa định nghĩa switch-case cho `'pinterest'` và chưa import SVG của Pinterest, dẫn tới icon không hiển thị đúng thiết kế.

### 2. Giả thuyết đối chứng
- *Giả thuyết:* Có thể tự hardcode thẳng 2 input Pinterest và X vào file `SettingsPageShell.tsx` mà không cần thông qua hệ thống `moduleFields` và `settings.config.ts` để tiết kiệm thời gian?
- *Phản bác:* Không nên làm vậy. Hệ thống đang đi theo thiết kế **Clean-by-construction** và **Convention Over Configuration (CoC)**. Mọi module fields đều được quản lý động qua `moduleFields` để cho phép bật/tắt linh hoạt từ trang cấu hình hệ thống (`/system/modules/settings`). Nếu hardcode trực tiếp vào giao diện cài đặt admin, chúng ta sẽ phá vỡ kiến trúc đồng bộ trường, mất khả năng bật/tắt từ trang cấu hình hệ thống, và gây khó khăn cho việc bảo trì, không tuân thủ rule KISS và Rails Convention của dự án.

---

# IV. Proposal (Đề xuất)

Chúng tôi đề xuất giải pháp đồng bộ và sạch sẽ theo kiến trúc CoC hiện tại của dự án:

### 1. Cập nhật cấu hình tĩnh của Module Cài đặt
Thêm hai trường `social_pinterest` and `social_twitter` vào `runtimeConfig.fields` của [settings.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/settings.config.ts).
- `social_pinterest`: Nhãn "Pinterest", group "social", linkedFeature "enableSocial", order 20.
- `social_twitter`: Nhãn "X (Twitter)", group "social", linkedFeature "enableSocial", order 21.

### 2. Bổ sung seeder mặc định trong Convex DB
- Cập nhật mutation `seedSettingsModule` trong [seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seed.ts):
  - Thêm 2 settings mặc định giá trị rỗng (`social_pinterest` và `social_twitter`) vào mảng `settingsData`.
  - Thêm 2 định nghĩa trường tương ứng vào mảng `fields` để khi seed hệ thống sẽ tự động thêm vào DB.
- Cập nhật tương tự trong seeder độc lập [settings.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seeders/settings.seeder.ts) để đồng bộ dữ liệu seed.

### 3. Bổ sung icon Pinterest vào thư viện icon dùng chung
- Cập nhật [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx):
  - Khai báo component `PinterestIcon` chứa mã SVG chuẩn của Pinterest (màu đỏ `#E60023` và path vẽ logo Pinterest).
  - Thêm case `'pinterest'` vào hàm `getIconNode` để trả về component `PinterestIcon`.

### 4. Cập nhật Hook lấy dữ liệu mạng xã hội
Cập nhật hook `useSocialLinks()` trong [hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts):
- Thêm `'social_pinterest'` vào danh sách `enabledKeys` mặc định (khi skip DB).
- Đọc giá trị của `social_pinterest` và `social_twitter` từ `settingsMap`.
- Trả về `pinterest` và `twitter` trong kết quả của hook.

### 5. Cập nhật Footer của Website chính thức
Cập nhật [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/DynamicFooter.tsx):
- Trong hàm `getSocials(config)`, bổ sung kiểm tra: nếu `socialLinks.twitter` có giá trị thì push vào mảng hiển thị (với platform `'x'`), và nếu `socialLinks.pinterest` có giá trị thì push vào mảng hiển thị (với platform `'pinterest'`).

---

# V. Tệp bị ảnh hưởng (Files Impacted)

### 1. Cấu hình & Logic Next.js:
- **[Sửa]** [settings.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/settings.config.ts)
  * *Vai trò:* Cung cấp cấu hình module cài đặt tĩnh.
  * *Thay đổi:* Thêm `social_pinterest` và `social_twitter` vào `runtimeConfig.fields`.
- **[Sửa]** [hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts)
  * *Vai trò:* Chứa các custom hooks cho trang client.
  * *Thay đổi:* Cập nhật hook `useSocialLinks()` để truy xuất và trả về link Pinterest và X (Twitter) từ DB.
- **[Sửa]** [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/DynamicFooter.tsx)
  * *Vai trò:* Hiển thị footer chân trang website chính.
  * *Thay đổi:* Lấy dữ liệu link X và Pinterest từ hook `useSocialLinks()` để đưa vào danh sách MXH hiển thị mặc định.
- **[Sửa]** [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx)
  * *Vai trò:* Chứa thư viện vẽ icon dùng chung `getIconNode`.
  * *Thay đổi:* Định nghĩa component `PinterestIcon` và bổ sung case `'pinterest'` vào `getIconNode`.

### 2. Backend Convex DB:
- **[Sửa]** [seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seed.ts)
  * *Vai trò:* Mutation seed dữ liệu hệ thống Convex.
  * *Thay đổi:* Bổ sung dữ liệu mẫu và định nghĩa module field cho `social_pinterest` và `social_twitter`.
- **[Sửa]** [settings.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seeders/settings.seeder.ts)
  * *Vai trò:* Class seeder độc lập cho settings.
  * *Thay đổi:* Đồng bộ dữ liệu seed giống như `seed.ts` để tránh mâu thuẫn dữ liệu.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1: Sửa đổi cấu hình Static Module Fields**
   Tiến hành sửa đổi file `lib/modules/configs/settings.config.ts` để thêm định nghĩa cho 2 trường mới.
2. **Bước 2: Sửa đổi logic phía Client và vẽ Icon**
   - Sửa file `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx` để add icon Pinterest.
   - Sửa file `components/site/hooks.ts` để hook `useSocialLinks` lấy thêm 2 trường này.
   - Sửa file `components/site/DynamicFooter.tsx` để map link X và Pinterest vào Footer.
3. **Bước 3: Đồng bộ Database Seeder**
   Cập nhật `convex/seed.ts` và `convex/seeders/settings.seeder.ts` để chuẩn bị dữ liệu schema mới.
4. **Bước 4: Chạy đồng bộ (Sync) Schema cấu hình vào Convex**
   Chạy lệnh để Convex cập nhật schema cấu hình trường (chúng ta sẽ chạy qua terminal của Convex hoặc trigger sync qua admin).
5. **Bước 5: Kiểm tra typecheck tĩnh và Verify**
   Tự kiểm tra code thông qua build và review logic để đảm bảo không lỗi type.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### 1. Kiểm tra tĩnh (Static Check):
- Thực hiện chạy kiểm tra kiểu typescript bằng cách đề xuất lệnh:
  `bunx tsc --noEmit`
  Để đảm bảo các file code Next.js không có bất kỳ lỗi typecheck nào sau khi sửa.

### 2. Kiểm chứng thủ công (Manual Verification):
- **Kiểm tra giao diện quản lý Module:**
  1. Truy cập `/system/modules/settings`.
  2. Xác minh giao diện tự động xuất hiện 2 switch bật/tắt cho **Pinterest** và **X (Twitter)**.
  3. Bật cả 2 switch này lên.
- **Kiểm tra giao diện cài đặt Admin:**
  1. Truy cập `/admin/settings/contact`.
  2. Kiểm tra phần "Mạng xã hội" xem đã tự động xuất hiện thêm 2 ô nhập liệu có nhãn **Pinterest** và **X (Twitter)** chưa.
  3. Nhập link thử nghiệm (ví dụ: `https://x.com/dohy` và `https://pinterest.com/dohy`) rồi bấm **Lưu cài đặt**.
  4. Tải lại trang và xác nhận dữ liệu đã được lưu thành công trong ô nhập liệu.
- **Kiểm tra hiển thị Client (Footer):**
  1. Mở trang chủ hoặc bất kỳ trang nào có chứa Footer.
  2. Cuộn xuống chân trang và kiểm tra xem có xuất hiện thêm icon của X (màu đen) và Pinterest (màu đỏ) không.
  3. Click vào các icon và kiểm tra xem liên kết có trỏ đúng về URL đã nhập ở trang cài đặt không.
  4. Thử tắt switch bật/tắt của Pinterest/X ở `/system/modules/settings` và xác nhận ô nhập liệu trong admin cũng như icon ngoài Footer biến mất tương ứng.

---

# VIII. Todo

- [ ] Sửa [settings.config.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/modules/configs/settings.config.ts) để thêm định nghĩa trường mạng xã hội cho Pinterest và X.
- [ ] Cập nhật [seed.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seed.ts) bổ sung dữ liệu seed mặc định và định nghĩa trường.
- [ ] Cập nhật [settings.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/seeders/settings.seeder.ts) để đồng bộ hóa seeder độc lập.
- [ ] Bổ sung `PinterestIcon` và case render vào `getIconNode` trong [SpeedDialSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx).
- [ ] Cập nhật hook `useSocialLinks` trong [hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/hooks.ts).
- [ ] Cập nhật [DynamicFooter.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/DynamicFooter.tsx) để map link từ settings vào Footer.
- [ ] Kiểm tra type toàn dự án bằng `bunx tsc --noEmit`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Trang `/system/modules/settings` hiển thị đầy đủ công tắc bật tắt cho Pinterest và X.
2. Trang `/admin/settings/contact` hiển thị ô nhập link cho Pinterest và X khi chúng được bật cấu hình.
3. Người dùng có thể nhập link, lưu lại thành công và khi tải lại trang admin dữ liệu vẫn được giữ nguyên.
4. Chân trang (Footer) của website hiển thị chính xác logo Pinterest (màu đỏ) và logo X (màu đen), trỏ đúng đến link đã cấu hình.
5. Không xảy ra lỗi typecheck hay crash ứng dụng ở cả môi trường Admin và Client.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Khi đồng bộ dữ liệu cấu hình module, nếu có xung đột hoặc seeder chạy đè dữ liệu thật của dự án có thể làm mất cấu hình cũ.
- **Biện pháp giảm thiểu & Hoàn tác:**
  - Thay đổi chỉ mang tính chất mở rộng thêm trường mới (Expand), không sửa đổi cấu trúc trường cũ nên cực kỳ an toàn.
  - Sử dụng git để theo dõi thay đổi. Nếu có bất kỳ vấn đề gì, có thể rollback nhanh chóng bằng lệnh:
    `git checkout -- .`

---

# XI. Out of Scope (Ngoài phạm vi)

- Thiết kế trang chia sẻ Pinterest/X riêng biệt.
- Tự động lấy feed bài viết từ Pinterest/X để hiển thị lên trang web.
- Tích hợp nút share Pinterest/X vào trang chi tiết sản phẩm hoặc bài viết.

---

# XII. Open Questions (Câu hỏi mở)
- Dự án có cần chạy lệnh seed lại toàn bộ hay chỉ cần đồng bộ qua trang admin? *(Trả lời: Hệ thống có cơ chế tự động đồng bộ cấu hình module khi truy cập vào trang quản trị hoặc thông qua sync API, nên không cần seed đè lại dữ liệu thật).*
