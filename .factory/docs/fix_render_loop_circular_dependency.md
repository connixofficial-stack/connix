# Implementation Plan - Giải quyết lỗi phụ thuộc vòng trên toàn dự án

## User Review Required

> [!NOTE]
> Tôi đã chạy phân tích tĩnh trên toàn bộ 346 entrypoints (`page.tsx`, `layout.tsx`, `route.ts`) của dự án bằng công cụ `madge`.
> Kết quả phân tích cho thấy:
> - Chỉ có **duy nhất 1 lỗi Circular Dependency thực tế lúc runtime**: giữa `shared.tsx` và `useTypeColorOverride.ts` (màu sắc giao diện của các form tạo component).
> - 4 lỗi import vòng khác liên quan đến cấu trúc Excel Adapter chỉ là import type (Type-only), hoàn toàn vô hại và biến mất sau khi biên dịch sang JavaScript, không ảnh hưởng đến runtime.
> - Các lỗi import vòng còn lại nằm trong `convex/_generated` là do đặc thù kiến trúc của Convex (Convex CLI tự động xử lý tốt, không ảnh hưởng frontend runtime).
> 
> Giải pháp triệt để là tách hook `useSystemBrandColors` sang một file độc lập để loại bỏ hoàn toàn lỗi import vòng này trên toàn bộ hệ thống Home Components.

## Proposed Changes

### Tách biệt quản lý màu thương hiệu hệ thống

#### [NEW] [useSystemBrandColors.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/hooks/useSystemBrandColors.ts)
Tạo hook mới chứa logic lấy màu primary, secondary từ Convex settings.

#### [MODIFY] [shared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/create/shared.tsx)
- Xóa hàm `useSystemBrandColors` và các helper màu sắc.
- Import chúng từ file hook mới.

#### [MODIFY] [useTypeColorOverride.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/_shared/hooks/useTypeColorOverride.ts)
- Thay đổi import `useSystemBrandColors` sang `./useSystemBrandColors`.

---

# Primer (Lý thuyết cơ bản)

## 1. TL;DR kiểu Feynman
- Trang web bị giật cục và reload liên tục (vòng lặp vô hạn) khi truy cập `/admin/home-components/create/partners`.
- Nguyên nhân là do có sự phụ thuộc vòng (Circular Dependency) giữa hai file: `create/shared.tsx` và `useTypeColorOverride.ts`.
- Việc phụ thuộc vòng này làm cho hook `useSystemBrandColors` bị `undefined` lúc runtime.
- Khi React gọi hook này và nhận về `undefined`, nó ném ra lỗi runtime làm sụp đổ quá trình render (crash). Next.js HMR/Fast Refresh cố gắng tự sửa bằng cách tải lại toàn bộ trang (Full Page Reload), tạo ra vòng lặp vô hạn.
- Giải pháp: Tách hook `useSystemBrandColors` ra một file riêng biệt `useSystemBrandColors.ts` để cắt đứt liên kết vòng này.

## 2. Elaboration & Self-Explanation
- Trong Next.js và Turbopack, khi hai module import chéo nhau, quá trình load module sẽ bị lỗi thứ tự khởi tạo. Khi Module A đang được load, nó sẽ import Module B. Khi Module B load, nó cố gắng import Module A nhưng do Module A chưa hoàn thành khởi tạo nên các export của Module A (như hook `useSystemBrandColors`) sẽ nhận giá trị `undefined`.
- Tại trang partners, React component gọi `useTypeColorOverrideState` (từ `useTypeColorOverride.ts`). Hook này cố gắng gọi `useSystemBrandColors` vốn đang bị `undefined` do liên kết vòng, dẫn đến lỗi runtime trên trình duyệt. Lỗi render liên tục kích hoạt cơ chế fallback reload của Next.js, tạo ra vòng lặp vô hạn.
- Bằng cách di chuyển `useSystemBrandColors` và các hàm phụ trợ của nó sang một file độc lập không import ngược lại `useTypeColorOverride.ts`, ta đảm bảo hook luôn được khởi tạo trước khi sử dụng.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - `app/admin/home-components/create/shared.tsx` import `useTypeColorOverrideState` từ `useTypeColorOverride.ts`.
  - `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts` import `useSystemBrandColors` từ `create/shared.tsx`.
  - Khi load trang `/admin/home-components/create/partners`, Next.js/Turbopack cố gắng giải quyết các import này. Vì liên kết vòng, tại thời điểm `useTypeColorOverride.ts` được thực thi, `useSystemBrandColors` chưa được định nghĩa và mang giá trị `undefined`. Gọi `useSystemBrandColors()` sẽ ném lỗi `TypeError: (0 , shared_1.useSystemBrandColors) is not a function`.
- **Phép ẩn dụ thực tế**:
  - Tưởng tượng hai người A và B đứng xếp hàng. Người A nói "Tôi sẽ đi sau người B", người B nói "Tôi sẽ đi sau người A". Kết quả là cả hai đứng im và làm nghẽn toàn bộ hàng đợi. Giải pháp là đưa ra một người chỉ huy trung gian C (file mới `useSystemBrandColors.ts`) đứng trước để hướng dẫn cho cả A và B.

## Verification Plan

### Automated Tests
- Chạy `bunx tsc --noEmit` để đảm bảo TypeScript biên dịch thành công và không bị lỗi import.

### Manual Verification
- Truy cập vào `/admin/home-components/create/partners` trên trình duyệt và kiểm tra xem trang web đã tải bình thường, không còn bị reload liên tục.
