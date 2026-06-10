## Audit Summary

### TL;DR kiểu Feynman
- Triệu chứng đúng như bạn nói: đổi layout trong preview nhưng nút vẫn hiện `Đã lưu`.
- Root cause không nằm ở `setStyle`, cũng không nằm ở nút save, mà nằm ở `useEffect` tính `hasChanges`.
- Cụ thể: logic so sánh đã có `style !== initialData.style`, nhưng dependency array của `useEffect` lại quên không include `style`.
- Kết quả là đổi layout không trigger recompute `hasChanges`, nên dirty state không bật.
- Fix rất nhỏ: thêm `style` vào dependency array của effect dirty-check ở edit page.

### Observation / Inference / Decision
- Observation:
  - Trong `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`, phần tính `changed` có dòng `|| style !== initialData.style`.
  - Nhưng ngay bên dưới, dependency array của `useEffect` lại không có `style`.
  - `HomepageCategoryHeroPreview.tsx` đã gọi `onStyleChange={setStyle}` đúng, nên state `style` thực ra có đổi.
- Inference:
  - Dirty state bị stale do React không rerun effect khi chỉ `style` thay đổi.
  - Đây là bug wiring dependency, không phải bug save flow hay preview selector.
- Decision:
  - Sửa tối thiểu 1 chỗ trong dependency array, không mở rộng scope.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là đổi layout thì nút chuyển sang `Lưu`; actual là vẫn `Đã lưu`.
2. Phạm vi: trang edit của `HomepageCategoryHero`; create page không bị ảnh hưởng vì không có dirty-state save button kiểu này.
3. Tái hiện: ổn định; chỉ cần vào edit page và đổi layout.
4. Mốc thay đổi gần nhất: commit vừa thêm style selector vào edit page nhưng thiếu wiring dependency cho dirty state.
5. Dữ liệu còn thiếu: không thiếu thêm evidence để kết luận.
6. Giả thuyết thay thế: `setStyle` không chạy hoặc preview không propagate change; đã loại trừ vì prop chain `selectedStyle/onStyleChange` đang nối đúng.
7. Rủi ro nếu fix sai nguyên nhân: có thể vá UI nút save nhưng dirty state tổng thể vẫn sai.
8. Pass/fail: đổi layout bất kỳ thì `hasChanges` bật ngay; lưu xong nút quay về `Đã lưu`.

## Root Cause Confidence
**High** — evidence trực tiếp trong cùng file: có compare `style` nhưng thiếu `style` trong dependency array của effect dirty-check.

## Files Impacted
- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: quản lý state edit + dirty-check + save button.
  - Thay đổi: thêm `style` vào dependency array của `useEffect` tính `hasChanges` để đổi layout trigger lại dirty state.

## Execution Preview
1. Mở file edit page của `homepage-category-hero`.
2. Thêm `style` vào dependency array của effect dirty-check.
3. Review tĩnh lại flow: đổi layout → `setStyle` → rerun effect → `hasChanges = true`.
4. Nếu user duyệt và code xong, chạy `bunx tsc --noEmit` rồi commit theo rule repo.

## Acceptance Criteria
- Ở edit page, đổi layout bất kỳ thì nút đổi từ `Đã lưu` sang `Lưu`.
- Nếu đổi layout rồi đổi lại đúng layout ban đầu, nút quay về `Đã lưu`.
- Save xong thì dirty state reset đúng.
- Không ảnh hưởng flow save của các field khác.

## Verification Plan
- Typecheck: `bunx tsc --noEmit` sau khi sửa.
- Static review:
  - xác nhận dependency array có `style`,
  - xác nhận compare `style !== initialData.style` vẫn giữ nguyên,
  - không chạm logic save khác.
- Repro cho tester:
  1. Mở route edit của `HomepageCategoryHero`.
  2. Đổi layout từ layout hiện tại sang layout khác.
  3. Xác nhận nút hiện `Lưu`.
  4. Đổi lại layout ban đầu.
  5. Xác nhận nút quay về `Đã lưu`.

## Risk / Rollback
- Risk rất thấp vì chỉ sửa dependency array của một effect.
- Rollback đơn giản: revert 1 dòng nếu cần.

## Out of Scope
- Không đổi UI preview selector.
- Không đổi flow save/create.
- Không refactor dirty-state cho component khác.

Nếu bạn duyệt spec này, tôi sẽ sửa ngay bug dirty state này.