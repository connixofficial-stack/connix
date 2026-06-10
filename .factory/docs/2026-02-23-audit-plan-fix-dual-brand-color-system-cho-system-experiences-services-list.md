## Problem Graph
1. [Main] Services List experience chưa tuân thủ đầy đủ dual-brand-color-system <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chỉ dùng `useBrandColor()` (1 màu), thiếu `useBrandColors()` (primary+secondary+mode)
   1.2 [Sub] UI config thiếu `ColorConfigCard` (không có toggle single/dual + secondary picker)
   1.3 [Sub] Các accent color đang hardcode `#8b5cf6`, chưa bind theo brand/tokens
   1.4 [Sub] Preview chỉ nhận `brandColor`, thiếu `secondaryColor` + `colorMode` nên không phản ánh dual mode

## Execution (with reflection)
1. Solving 1.1.1 (đồng bộ state màu theo settings)
   - Thought: Theo skill 6.1, experience phải init + sync đủ 3 giá trị: primary/secondary/mode.
   - Action: Tại `app/system/experiences/services-list/page.tsx`, thay `useBrandColor()` bằng `useBrandColors()`, thêm state:
     - `brandColor`, `secondaryColor`, `colorMode`
     - `useEffect` sync cả 3 từ settings (`brandColors.primary`, `brandColors.secondary`, `brandColors.mode`)
   - Reflection: ✓ Valid, đúng Convention over Configuration của skill.

2. Solving 1.2 (bổ sung UI cấu hình màu)
   - Thought: Phải có `ColorConfigCard` để user override preview real-time.
   - Action: Import và render `ColorConfigCard` trong grid controls (card thiết lập), truyền:
     - `mode={colorMode}`, `onModeChange={setColorMode}`
     - `primary={brandColor}`, `onPrimaryChange={setBrandColor}`
     - `secondary={secondaryColor}`, `onSecondaryChange={setSecondaryColor}`
   - Reflection: ✓ Valid, đáp ứng yêu cầu UI components trong skill.

3. Solving 1.3 (loại bỏ hardcode accent)
   - Thought: `#8b5cf6` vi phạm single source of truth màu trong experience controls.
   - Action: Đổi `accentColor` của `ToggleRow`, `LayoutTabs`, và `ExampleLinks.color` từ hardcoded sang computed accent theo mode:
     - single: dùng `brandColor`
     - dual: vẫn dùng primary cho action chính, secondary cho action phụ nếu component hỗ trợ
   - Reflection: ✓ Valid, giữ quy tắc 60-30-10 và primary cho action chính.

4. Solving 1.4 (đồng bộ preview props dual mode)
   - Thought: `ServicesListPreview` cần nhận đủ màu để render đúng dual-brand.
   - Action:
     - Pass thêm `secondaryColor`, `colorMode` vào `ServicesListPreview`.
     - Nếu preview component chưa support, cập nhật ở `components/experiences/.../ServicesListPreview` để dùng helper màu chuẩn (resolve secondary theo mode trước khi build palette).
   - Reflection: ✓ Valid, đảm bảo preview phản ánh đúng settings + override.

5. Safety + compatibility
   - Thought: Cần tránh break dữ liệu cũ và giữ migration ổn định.
   - Action:
     - Giữ normalize config hiện tại (legacy `list` -> `sidebar`).
     - Khi `secondary` rỗng/invalid thì fallback `primary` trong dual resolver.
   - Reflection: ✓ Valid, tương thích ngược.

6. Validation gate (theo rule repo)
   - Thought: Repo yêu cầu trước commit chỉ chạy typecheck.
   - Action khi implement: chạy `bunx tsc --noEmit`; fix hết lỗi nếu có.
   - Reflection: ✓ Valid, đúng guideline dự án.

7. Commit plan (sau khi implement xong)
   - Action:
     - `git status`
     - review diff (`git diff` + `git diff --cached`)
     - commit message gợi ý: `fix(services-list): align experience color config with dual-brand system`
   - Reflection: ✓ Valid, đáp ứng rule “hoàn thành đều phải commit, không push”.

## Danh sách vấn đề phát hiện cụ thể
- `useBrandColor()` tại services-list page => chỉ primary, mất secondary/mode.
- Không có state `secondaryColor`, `colorMode` và không sync theo settings.
- Không có `ColorConfigCard` để user cấu hình single/dual trong experience.
- `accentColor`/`color` hardcode `#8b5cf6` tại nhiều control.
- `ServicesListPreview` chỉ nhận `brandColor`, chưa nhận dual props.

## File dự kiến chỉnh khi được duyệt
- `app/system/experiences/services-list/page.tsx`
- (nếu cần) file chứa `ServicesListPreview` trong `components/experiences/**` để nhận + áp dụng `secondaryColor` và `colorMode` nhất quán.