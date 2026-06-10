
# Spec: Bỏ `weekStartsOn` khỏi calendar config + Kiểm tra Seed Wizard

## Phân tích

### 1. Xóa setting `weekStartsOn` trong calendar config
**Vấn đề:** Setting "Bắt đầu tuần là Thứ 2" trong `/system/modules/calendar` luôn là Thứ 2 (YAGNI — không có view tuần/tháng nào dùng setting này trong UI hiện tại). Theo CoC: mặc định Thứ 2 là convention, không cần expose setting.

**Thay đổi:** Xóa object `{ key: 'weekStartsOn', ... }` khỏi mảng `settings` trong `lib/modules/configs/calendar.config.ts`.

### 2. Seed Wizard — CalendarFeatureStep là dead code
**Phát hiện:** File `components/data/seed-wizard/steps/CalendarFeatureStep.tsx` tồn tại nhưng **không được import** trong `SeedWizardDialog.tsx`. `WizardState` cũng không có field `calendarFeatures`. File này là dead code hoàn toàn — không ảnh hưởng runtime, không được dùng.

**Kết luận:** Seed Wizard calendar đã ổn — chọn "Calendar nội bộ" ở bước Extras là đủ để seed calendar tasks. Không cần sửa gì thêm.

---

## Thay đổi cần làm

### `lib/modules/configs/calendar.config.ts`
Xóa setting `weekStartsOn` (3 dòng):
```ts
// Xóa:
{
  key: 'weekStartsOn',
  label: 'Bắt đầu tuần',
  type: 'select',
  default: 'monday',
  options: [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'sunday', label: 'Chủ nhật' },
  ],
},
```

Kết quả settings còn lại: `calendarPerPage`, `defaultStatus`, `warningDays`.

---

## Checklist
- [ ] `lib/modules/configs/calendar.config.ts` — xóa setting `weekStartsOn`
- [ ] Không cần sửa Seed Wizard (CalendarFeatureStep là dead code, không ảnh hưởng)
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
