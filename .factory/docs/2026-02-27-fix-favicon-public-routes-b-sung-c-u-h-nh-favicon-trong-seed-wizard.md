## Problem Graph
1. [Main] Public routes chưa ưu tiên favicon đã cấu hình + seed wizard chưa hỏi favicon <- depends on 1.1, 1.2
   1.1 [Sub] /admin/settings chưa có thao tác nhanh "dùng logo làm favicon" <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Form settings chỉ upload riêng site_logo/site_favicon, chưa có action copy value giữa 2 field
   1.2 [Sub] Seed Wizard chưa có trường favicon nên sau seed dễ rơi về fallback icon chữ <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] BusinessInfo + WizardState + setSettings chưa mang key site_favicon

## Execution (with reflection)
1. Solving 1.1.1 - Thêm nút one-click trong `/admin/settings`
   - File: `app/admin/settings/page.tsx`
   - Thay đổi:
     - Ở render field `site_favicon` (type image), thêm button nhỏ cạnh uploader: **"Dùng logo hiện tại"**.
     - Click sẽ set `site_favicon = site_logo` nếu có `site_logo`; nếu rỗng thì toast báo chưa có logo.
     - Optional: thêm button phụ **"Xóa favicon"** để user chủ động quay về fallback.
   - Logic cụ thể:
     - Dùng `form.site_logo` và `updateField('site_favicon', form.site_logo)`.
     - Không tạo API mới, tận dụng flow save hiện tại `setMultiple`.
   - Reflection: ✓ KISS, không đụng backend, đúng nhu cầu "click phát dùng luôn logo".

2. Solving 1.2.1 - Seed Wizard hỏi rõ favicon và lưu settings
   - File: `components/data/seed-wizard/types.ts`
   - Thay đổi:
     - Mở rộng `BusinessInfo` thêm `faviconUrl: string`.

   - File: `components/data/SeedWizardDialog.tsx`
   - Thay đổi:
     - `DEFAULT_BUSINESS_INFO` thêm `faviconUrl: ''`.
     - Khi đổi industry (`handleIndustryChange`), nếu đang có `selectedLogo` thì set mặc định `businessInfo.faviconUrl = selectedLogo` (để “dùng luôn logo”).
     - Khi toggle seed_mau off, giữ nguyên giá trị user đã nhập favicon.
     - Trong `handleSeed` phần `setSettings`, thêm setting:
       - `{ group: 'site', key: 'site_favicon', value: resolvedFavicon }`
       - `resolvedFavicon = businessInfo.faviconUrl || selectedLogo || ''`.

   - File: `components/data/seed-wizard/steps/BusinessInfoStep.tsx`
   - Thay đổi:
     - Thêm UI hỏi user rõ favicon (đúng yêu cầu “có hỏi người dùng”):
       - Input `Favicon URL`.
       - Toggle/checkbox nhanh: **"Dùng logo đã chọn làm favicon"**.
       - Khi bật toggle => set faviconUrl bằng logo được chọn từ wizard (truyền từ parent).
     - Nếu chưa có logo seed_mau thì chỉ cho nhập URL thủ công.

   - File: `components/data/SeedWizardDialog.tsx` + props step
   - Thay đổi:
     - Truyền xuống `BusinessInfoStep` thêm:
       - `suggestedLogoUrl?: string` (từ `state.selectedLogo`)
       - callback `onUseLogoAsFavicon`.

   - Reflection: ✓ Giữ flow wizard hiện tại, chỉ thêm 1 quyết định rõ về favicon, không mở rộng scope.

3. Đảm bảo public routes dùng favicon đúng và chỉ fallback khi thiếu
   - File: `app/(site)/layout.tsx`
   - Giữ `icons: { icon: '/api/favicon' }` (đã đúng entrypoint cho toàn bộ public routes).

   - File: `app/api/favicon/route.ts`
   - Tinh chỉnh nhẹ:
     - Trim `site_favicon` trước khi check để tránh chuỗi khoảng trắng.
     - Nếu có URL thì redirect như hiện tại.
     - Nếu không có thì mới generate icon chữ fallback.
   - Reflection: ✓ Đúng mong muốn “chỉ fallback”, không phá hành vi hiện có.

4. Verify + commit theo rule repo
   - Chạy: `bunx tsc --noEmit` (theo CLAUDE.md).
   - Kiểm tra nhanh:
     - `/admin/settings`: click "Dùng logo hiện tại" -> save -> `/api/favicon` redirect về logo URL.
     - `/system/data` -> seed wizard: step Business hiển thị cấu hình favicon + chọn dùng logo.
     - Public route bất kỳ (ví dụ `/`, `/products`) hiển thị favicon đúng.
   - Commit 1 commit local (không push) với message dạng: `feat(settings): add one-click logo-to-favicon and seed wizard favicon prompt`.