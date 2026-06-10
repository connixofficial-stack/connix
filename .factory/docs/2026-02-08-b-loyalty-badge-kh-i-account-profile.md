## Spec: Bỏ Loyalty badge khỏi account-profile

### Mục tiêu
- Loại bỏ hoàn toàn tuỳ chọn và hiển thị “Loyalty badge” khỏi trang experience, preview, và trang thật (account profile), vì không còn dùng.

### Phạm vi thay đổi
1. **Trang experience** `app/system/experiences/account-profile/page.tsx`
   - Xoá `showLoyaltyBadge` khỏi type `AccountProfileExperienceConfig`.
   - Xoá khỏi `DEFAULT_CONFIG` và `serverConfig` useMemo.
   - Xoá ToggleRow “Loyalty badge”.
   - Không truyền prop `showLoyaltyBadge` vào `AccountProfilePreview`.

2. **Preview** `components/experiences/previews/AccountProfilePreview.tsx`
   - Xoá `showLoyaltyBadge` khỏi props type và destructuring.
   - Xoá toàn bộ UI hiển thị badge trong 3 layout (card/sidebar/compact).

3. **Trang thật** `app/(site)/account/profile/page.tsx`
   - Xoá mọi điều kiện/UI dùng `config.showLoyaltyBadge` trong 3 layout.

4. **Config hook** `lib/experiences/useSiteConfig.ts`
   - Xoá `showLoyaltyBadge` khỏi `AccountProfileConfig` và logic `useAccountProfileConfig`.

### Validation
- Chạy `bunx oxlint --type-aware --type-check --fix`.

### Commit
- `fix: remove loyalty badge`