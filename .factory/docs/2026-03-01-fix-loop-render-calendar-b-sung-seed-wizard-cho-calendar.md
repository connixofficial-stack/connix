Chuẩn rồi, mình đã rà soát và chốt scope theo ý bạn: **fix crash** + **bổ sung Calendar vào Seed Wizard (Extra Features + Data Scale)**.

## 1) Vì sao `/system/modules/calendar` đang trống?
Root cause khả năng cao là **chưa có dữ liệu `moduleFeatures/moduleFields/moduleSettings` cho moduleKey `calendar`** trong DB hiện tại (do dữ liệu cũ trước khi có calendar seeder).
- Trang `/system/modules/calendar` render theo `useModuleConfig` và đọc dữ liệu runtime từ các bảng module config.
- Nếu chưa seed config module này thì UI có thể nhìn “trống”.

## 2) Scope thay đổi (đúng yêu cầu)
### A. Fix lỗi infinite re-render ở `/admin/calendar`
File:
- `app/admin/calendar/page.tsx`

Cách fix:
1. Không dùng `Date.now()` trực tiếp trong args `useQuery`.
2. Tạo `nowTick` state, khởi tạo 1 lần.
3. Dùng `setInterval` 60s trong `useEffect([])` để cập nhật `nowTick`.
4. Truyền `now: nowTick` vào `api.calendar.listUpcomingTasks`.

Kết quả mong đợi:
- Hết `Too many re-renders` / `Maximum update depth exceeded`.
- Khối overdue/dueSoon vẫn cập nhật theo chu kỳ 60s.

---
### B. Bổ sung Calendar vào Seed Wizard trong `/system/data`
Files:
- `components/data/seed-wizard/wizard-presets.ts`
- `components/data/seed-wizard/steps/ExtraFeaturesStep.tsx` (không cần logic lớn, chủ yếu hiển thị option mới)
- (nếu cần) `components/data/seed-wizard/steps/ReviewStep.tsx` để hiển thị summary đẹp hơn

Thay đổi cụ thể:
1. Thêm option mới vào `EXTRA_FEATURE_OPTIONS`:
   - key: `calendar`
   - label: `Calendar nội bộ`
   - modules: `['calendar']`
   - description phù hợp.
2. Thêm `calendar` vào `SCALE_QUANTITIES` cho low/medium/high để wizard seed đúng số lượng.
3. Thêm `calendar` vào `SCALE_SUMMARY_ITEMS` để phần review hiển thị thống kê seed.

Kết quả mong đợi:
- Trong `/system/data` > Seed Wizard sẽ thấy checkbox Calendar.
- Khi tick Calendar, wizard sẽ seed luôn module calendar tasks + config.

## 3) Cách seed để hết “trống” ngay (mình sẽ gửi lại ngắn gọn sau khi fix)
Tại `/system/data` có 2 đường:
1. **Seed nhanh từng module**: tìm `calendar` trong Dependency/Table list rồi bấm Seed.
2. **Seed Wizard**: mở wizard → chọn Extra Feature `Calendar nội bộ` → run seed.

Sau seed:
- Vào `/system/modules/calendar` sẽ có Features/Fields/Settings đầy đủ.
- Vào `/admin/calendar` có dữ liệu mẫu để test.

## 4) Verification
- `bunx tsc --noEmit` pass.
- Manual check:
  - `/admin/calendar` không còn loop crash.
  - `/system/data` wizard có option Calendar.
  - Seed calendar xong, `/system/modules/calendar` không còn trống.

## 5) Gate check
Critical:
- Không còn lỗi render loop.
- Calendar xuất hiện trong wizard và seed được.
- Module config calendar hiển thị đúng sau seed.

Non-critical:
- Không đụng tối ưu sâu query/UI ngoài phạm vi yêu cầu.

## Next-safe-step
Nếu bạn duyệt spec này, mình sẽ triển khai đúng phạm vi trên, chạy `bunx tsc --noEmit`, rồi commit (kèm `.factory/docs`) theo rule repo.