## Audit Summary
- Observation: Build fail tại `components/site/CareerSection.tsx:2` vì import hằng mặc định màu phụ và hàm normalize màu phụ từ `app/admin/home-components/career/_lib/constants.ts`, nhưng file này hiện chỉ export `DEFAULT_CAREER_TEXTS`, `CAREER_STYLES`, `createCareerJob`, `DEFAULT_CAREER_CONFIG`.
- Observation: `app/admin/home-components/career/_types/index.ts` cũng chưa có type màu phụ; `app/admin/home-components/career/_lib/normalize.ts` không normalize field màu phụ; `app/admin/home-components/career/_lib/colors.ts` chỉ nhận `{ primary, secondary, mode }`, không nhận màu phụ.
- Observation: `components/site/CareerSection.tsx` đang dùng API màu phụ mới (fallback về màu phụ mặc định), nhưng module career chưa được migrate đồng bộ như các component khác.
- Inference: Đây là lỗi lệch contract sau refactor hàng loạt cơ chế phối màu phụ cho home-components: consumer đã cập nhật, provider chưa export/normalize/type hóa tương ứng.
- Decision: Sửa theo hướng hoàn tất contract màu phụ cho riêng module Career, thay vì rollback import ở site component, để giữ nhất quán với thay đổi đang diễn ra trong repo.

## Root Cause Confidence
- High — Evidence trực tiếp từ file paths và symbol table:
  - `components/site/CareerSection.tsx` đang import symbol không tồn tại.
  - `career/_lib/constants.ts` không export hằng mặc định màu phụ hay hàm normalize màu phụ.
  - `career/_types/index.ts` và `career/_lib/normalize.ts` chưa chứa field/type màu phụ.
- Counter-hypothesis đã loại trừ:
  - Không phải lỗi alias/import path sai, vì module được resolve đúng và Next/Turbopack chỉ báo thiếu export cụ thể.
  - Không phải do client/server boundary, vì lỗi xảy ra ở static export analysis trước runtime.

## Proposal
1. Cập nhật `app/admin/home-components/career/_types/index.ts`
   - Thêm type màu phụ cho Career (theo pattern đang dùng ở repo, nhiều khả năng union như `analogous | complementary | triadic` hoặc đúng contract hiện có sau khi đối chiếu file cùng họ).
   - Mở rộng `CareerConfig` với field màu phụ.

2. Cập nhật `app/admin/home-components/career/_lib/constants.ts`
   - Export hằng mặc định màu phụ.
   - Thêm hàm normalize màu phụ để chuẩn hóa input về giá trị hợp lệ.
   - Gắn default màu phụ vào `DEFAULT_CAREER_CONFIG` nếu contract các component khác đang làm vậy.

3. Cập nhật `app/admin/home-components/career/_lib/normalize.ts`
   - Đưa field màu phụ vào `normalizeCareerConfig(...)` bằng hàm normalize tương ứng.
   - Giữ backward compatibility cho config cũ chưa có field này.

4. Cập nhật `app/admin/home-components/career/_lib/colors.ts`
   - Nếu token system chung của repo đã dùng cơ chế phối màu phụ để sinh secondary/accents, mở rộng signature `getCareerColorTokens` và `getCareerValidationResult` nhận thêm màu phụ.
   - Nếu Career chưa thật sự dùng cơ chế phối màu phụ để tính màu, vẫn nhận tham số nhưng fallback an toàn để thống nhất API và tránh build fail.

5. Rà soát call sites của Career
   - Kiểm tra `app/admin/home-components/career/[id]/edit/page.tsx`, `app/admin/home-components/create/career/page.tsx`, preview/shared components để chắc field mới không làm lệch type hoặc props.
   - Không mở rộng sang module khác ngoài Career trong task này.

## File dự kiến đổi
- `E:\NextJS\persional_project\system-nhan\app\admin\home-components\career\_types\index.ts`
- `E:\NextJS\persional_project\system-nhan\app\admin\home-components\career\_lib\constants.ts`
- `E:\NextJS\persional_project\system-nhan\app\admin\home-components\career\_lib\normalize.ts`
- `E:\NextJS\persional_project\system-nhan\app\admin\home-components\career\_lib\colors.ts`
- Có thể chạm nhẹ các file gọi nếu type check yêu cầu, ưu tiên nhỏ nhất có thể.

## Verification Plan
- Repro: xác nhận import error biến mất ở `components/site/CareerSection.tsx`.
- Typecheck: chạy `bunx tsc --noEmit` vì có thay đổi TS/code.
- Build-focused verification: chạy build/script phù hợp để chắc Turbopack không còn báo thiếu export ở Career.
- Pass criteria:
  1. Hằng mặc định màu phụ và hàm normalize màu phụ tồn tại, import được.
  2. `normalizeCareerConfig` trả về config có màu phụ hợp lệ hoặc fallback an toàn.
  3. Site Career section render qua compile phase không lỗi.
  4. Không phát sinh type error mới ở create/edit/preview flow của Career.