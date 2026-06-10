
## Xóa dead code: `CalendarFeatureStep.tsx`

**Thay đổi duy nhất:** Xóa file `components/data/seed-wizard/steps/CalendarFeatureStep.tsx`.

File này không được import ở bất kỳ đâu trong codebase, không ảnh hưởng runtime, không có test nào liên quan. Xóa để clean code.

**Checklist:**
- [ ] Xóa `components/data/seed-wizard/steps/CalendarFeatureStep.tsx`
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
