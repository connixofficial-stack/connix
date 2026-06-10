## Spec: Bỏ 2 toggle dư thừa trong account-profile experience

### Vấn đề
- 2 toggle **"Mã khách hàng"** và **"Ngày tham gia"** không còn tác dụng vì đã bỏ hiển thị ID/ngày tham gia ở cả preview và trang thật.

### Thay đổi

**File:** `app/system/experiences/account-profile/page.tsx`

1. **Xóa 2 ToggleRow** trong ControlCard "Thông tin cá nhân":
   - `Mã khách hàng` (showMemberId)
   - `Ngày tham gia` (showJoinDate)

2. **Xóa khỏi type và default config**:
   - Bỏ `showMemberId` và `showJoinDate` khỏi `AccountProfileExperienceConfig`
   - Bỏ khỏi `DEFAULT_CONFIG`
   - Bỏ khỏi `serverConfig` useMemo

3. **Bỏ props truyền vào preview**:
   - Không truyền `showMemberId` và `showJoinDate` vào `<AccountProfilePreview />`

### Sau khi hoàn thành
- Chạy `bunx oxlint --type-aware --type-check --fix`
- Commit: `fix: remove unused member info toggles`