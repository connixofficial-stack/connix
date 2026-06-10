## Problem Graph
1. [Main] Cần áp dụng auto-heal cho toàn bộ module để không phải chạy Seed Wizard
   1.1 [Sub] Trigger phải an toàn, không seed thừa
      1.1.1 [ROOT CAUSE] Một số module có thể thiếu `moduleFields/moduleFeatures` sau clear/reset cũ
   1.2 [Sub] UX cần im lặng (không toast thành công)

## Execution (with reflection)
1. Chuẩn hóa điều kiện auto-heal ở hook dùng chung
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Giữ auto-heal tại đây để tất cả trang `/system/modules/*` dùng chung.
   - Điều kiện chạy theo lựa chọn của bạn:
     - Chỉ chạy khi đã load xong query.
     - Module không bị disabled.
     - Thiếu **khung config**: `featuresData.length === 0` **hoặc** `fieldsData.length === 0`.
     - Không dựa vào thiếu setting lẻ.
   - Dùng `useRef` guard để chỉ chạy 1 lần mỗi mount, tránh loop/network spam.
   - Reflection: ✓ đúng scope “toàn bộ module”, không seed thừa.

2. Chuyển sang silent mode
   - File: `lib/modules/hooks/useModuleConfig.ts`
   - Bỏ toast thành công khi auto-heal xong.
   - Bỏ toast thất bại theo yêu cầu “Im lặng không toast”; thay bằng `console.error` để dev vẫn trace được.
   - Reflection: ✓ UX sạch, không làm phiền user.

3. Chặn tác động ngoài ý muốn
   - Không thêm endpoint mới, không thêm nút UI.
   - Chỉ tái sử dụng action `api.seed.seedAllModulesConfig` (idempotent).
   - Không thay đổi flow save/toggle hiện có của module.
   - Reflection: ✓ KISS/YAGNI, rủi ro thấp.

4. Verification
   - Chạy `bunx tsc --noEmit`.
   - Kiểm tra tay 3 case:
     - Module đủ config: không gọi heal.
     - Module thiếu fields/features: tự heal và render lại bình thường.
     - Module disabled: không auto-heal.
   - Reflection: ✓ xác nhận đúng behavior theo policy mới.

5. Commit
   - Commit message đề xuất: `fix(modules): rollout silent auto-heal for missing module config`
   - Include `.factory/docs` nếu có thay đổi.

## Checklist chốt
- [ ] Áp dụng cho toàn bộ module qua `useModuleConfig`
- [ ] Chỉ heal khi thiếu `fields/features`
- [ ] Silent mode (không toast)
- [ ] Pass `bunx tsc --noEmit`
- [ ] Commit đầy đủ