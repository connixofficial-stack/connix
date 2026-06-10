# I. Primer

## 1. TL;DR kiểu Feynman

- Trang `create/contact` đang dùng ô “Mạng xã hội” chung cho nhiều nền tảng.
- Hiện validation bắt mọi social link phải là URL `http/https`, nên `0948066514` bị báo lỗi.
- Với riêng Zalo, cần cho phép 2 kiểu nhập: `https://zalo.me/0948066514` hoặc số điện thoại `0948066514`.
- Khi render ra preview/site, nếu Zalo là số điện thoại thuần thì chuyển thành link mở được: `https://zalo.me/0948066514`.
- Không đổi behavior của Facebook/Instagram/Youtube/TikTok/... để tránh nới validation quá rộng.

## 2. Elaboration & Self-Explanation

Audit cho thấy form Contact dùng `SocialLinksManager` để nhập `socialLinks`, `validateContactConfig()` để kiểm tra, và `ContactSectionShared` để render anchor `<a href={social.url || '#'}>`. Vấn đề nằm ở chỗ `validateContactConfig()` gọi `isValidUrl()` cho mọi social link, trong khi số điện thoại Zalo không phải URL nên bị fail. Nếu chỉ nới `isValidUrl()` thì sẽ ảnh hưởng toàn bộ social platform và map URL, không đúng scope. Hướng an toàn hơn là thêm validation riêng cho Zalo và thêm bước resolve URL khi render link Zalo.

## 3. Concrete Examples & Analogies

- Ví dụ hiện tại: chọn platform `Zalo`, nhập `0948066514` → `new URL('0948066514')` throw → báo `URL không hợp lệ`.
- Sau sửa: chọn `Zalo`, nhập `0948066514` → pass validation → khi render dùng `href="https://zalo.me/0948066514"`.
- Sau sửa: chọn `Zalo`, nhập `https://zalo.me/0948066514` → pass validation → render giữ nguyên URL.
- Analogy: Facebook giống địa chỉ nhà đầy đủ, còn Zalo cho phép đọc “số điện thoại” rồi hệ thống tự tra thành địa chỉ `zalo.me/{phone}`.

# II. Audit Summary (Tóm tắt kiểm tra)

- Observation: `app/admin/home-components/create/contact/page.tsx` seed `socialLinks` từ settings và truyền vào `ConfigEditor`.
- Observation: `app/admin/home-components/contact/_components/ConfigEditor.tsx` gọi `validateContactConfig(value)` rồi truyền `validationErrors.socialLinks` vào `SocialLinksManager`.
- Observation: `app/admin/home-components/contact/_lib/validation.ts` hiện dùng `isValidUrl(link.url)` cho mọi social link.
- Observation: `app/admin/home-components/contact/_components/ContactSectionShared.tsx` render social link bằng `href={social.url || '#'}`.
- Observation: `app/admin/home-components/contact/_lib/constants.ts` đã có platform Zalo với key `contact_zalo`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High.
- Lý do: code validation bắt buộc mọi `socialLinks[].url` là URL `http/https`, trong khi yêu cầu mới muốn Zalo nhận phone number thuần.
- Triệu chứng expected vs actual: expected Zalo nhận `https://zalo.me/0948066514` và `0948066514`; actual chỉ URL `http/https` pass, phone thuần fail.
- Phạm vi ảnh hưởng: Contact home-component create/edit/preview/site, riêng phần social links.
- Tái hiện tối thiểu: vào Contact config, thêm/chọn Zalo, nhập `0948066514`; validation báo lỗi.
- Dữ liệu còn thiếu: chưa kiểm tra runtime UI trực tiếp vì đang ở spec mode và repo cấm tự chạy runtime test.
- Giả thuyết thay thế chưa loại trừ: có thể submit create page chưa chặn validation ở create flow, nhưng edit flow có `hasValidationErrors`; dù vậy UI vẫn báo lỗi từ `ConfigEditor`.
- Rủi ro nếu fix sai: nới validation toàn cục có thể cho phép URL không hợp lệ ở Map hoặc social khác.
- Tiêu chí pass/fail: Zalo phone thuần pass và mở đúng `zalo.me`; social khác vẫn cần URL hợp lệ.

# IV. Proposal (Đề xuất)

1. Thêm helper nhỏ trong `validation.ts`:
   - `isLikelyVietnamPhoneNumber(value)` hoặc helper tương đương, nhận số có thể có khoảng trắng/dấu chấm/dấu gạch ngang.
   - `isValidZaloLink(value)` cho phép empty, `http/https` URL, hoặc phone thuần.
   - Trong `validateContactConfig`, nếu `link.platform.toLowerCase() === 'zalo'` thì dùng validator Zalo; platform khác giữ `isValidUrl`.

2. Thêm helper render URL Zalo trong `ContactSectionShared.tsx`:
   - Nếu platform không phải Zalo: giữ `social.url`.
   - Nếu Zalo và input đã là `http/https`: giữ nguyên.
   - Nếu Zalo và input là phone thuần: normalize bỏ ký tự phân tách rồi render `https://zalo.me/{phone}`.
   - Nếu rỗng: giữ `#` như hiện tại.

3. Cập nhật UX nhỏ trong `SocialLinksManager.tsx`:
   - Placeholder động theo platform.
   - Với Zalo hiển thị ví dụ: `https://zalo.me/0948066514 hoặc 0948066514`.
   - Với platform khác giữ placeholder URL hiện tại.

4. Cập nhật test hiện có trong `validation.property.test.ts`:
   - Thêm assertion cụ thể cho Zalo URL và phone number nếu helper được export.
   - Giữ các property test hiện tại cho `isValidUrl` và `isValidHref`.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Sửa: `app/admin/home-components/contact/_lib/validation.ts` — hiện chứa validation chung; sẽ thêm validation riêng cho Zalo social link.
- Sửa: `app/admin/home-components/contact/_components/ContactSectionShared.tsx` — hiện render social href trực tiếp; sẽ resolve phone Zalo thành `https://zalo.me/{phone}` trước khi gán `href`.
- Sửa: `app/admin/home-components/contact/_components/SocialLinksManager.tsx` — hiện dùng placeholder Facebook cố định; sẽ đổi placeholder theo platform để người dùng biết Zalo nhận phone/URL.
- Sửa: `app/admin/home-components/contact/_lib/__tests__/validation.property.test.ts` — hiện test URL/href chung; sẽ thêm case Zalo cụ thể.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại 4 file liên quan để lấy nội dung mới nhất.
2. Sửa `validation.ts` theo hướng validator riêng cho Zalo, không đụng validation map/contact href.
3. Sửa `ContactSectionShared.tsx` để resolve href Zalo trước khi render `<a>`.
4. Sửa `SocialLinksManager.tsx` để placeholder Zalo rõ ràng hơn.
5. Cập nhật test validation nhỏ, chỉ thêm case cần thiết.
6. Tự review tĩnh: type import/export, null-safety, platform lowercase, compatibility dữ liệu cũ.
7. Theo instruction dự án: không tự chạy lint/unit test/build; nếu có thay đổi TS thì trước commit chỉ chạy `bunx tsc --noEmit` khi được phép execute sau spec approval, rồi commit local.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review (Kiểm tra tĩnh): đảm bảo `validateContactConfig` chỉ nới riêng Zalo, các platform khác vẫn dùng `isValidUrl`.
- Typecheck (Kiểm tra kiểu): sau khi user duyệt spec và cho execute, chạy `bunx tsc --noEmit` theo rule dự án vì có sửa TypeScript.
- Manual tester repro (Tester kiểm tra tay):
  - Zalo `https://zalo.me/0948066514` không báo lỗi.
  - Zalo `0948066514` không báo lỗi và preview/site link ra `https://zalo.me/0948066514`.
  - Facebook `0948066514` vẫn báo `URL không hợp lệ`.
  - Empty social URL vẫn không lỗi như hiện tại.

# VIII. Todo

- [ ] Implement validator riêng cho Zalo trong contact validation.
- [ ] Resolve Zalo phone thành `zalo.me` khi render social link.
- [ ] Cập nhật placeholder Zalo trong UI.
- [ ] Bổ sung test case validation Zalo.
- [ ] Tự review tĩnh và chạy typecheck theo rule sau khi được duyệt.
- [ ] Commit local thay đổi sau khi hoàn tất.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Zalo social link nhận `https://zalo.me/0948066514`.
- Zalo social link nhận `0948066514`.
- Phone thuần của Zalo được render thành link mở được qua `https://zalo.me/{phone}`.
- Social platform khác không bị nới lỏng để nhận phone thuần.
- Empty social URL vẫn hợp lệ.
- Không thay đổi schema/config payload shape.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro thấp: thay đổi nhỏ, giới hạn trong Contact home-component.
- Rủi ro chính: phone normalization quá rộng hoặc quá chặt. Giảm rủi ro bằng regex vừa đủ cho số điện thoại Việt Nam phổ biến và vẫn cho phép URL đầy đủ.
- Rollback: revert commit local hoặc revert 4 file đã chỉnh.

# XI. Out of Scope (Ngoài phạm vi)

- Không sửa Settings global cho `contact_zalo`.
- Không thêm platform social mới.
- Không đổi schema Convex hoặc dữ liệu thật.
- Không tự chạy lint/unit test/build theo rule dự án.