---
name: madge-circular-scanner
description: Quét và phát hiện các lỗi phụ thuộc vòng (Circular Dependency) trên toàn dự án Next.js bằng công cụ Madge.
---

# Madge Circular Scanner

Phụ thuộc vòng (Circular Dependency) xảy ra khi Module A import Module B, và Module B trực tiếp hoặc gián tiếp import lại Module A. Trong các ứng dụng Next.js (đặc biệt là App Router), điều này dễ dẫn đến các lỗi runtime khó gỡ như:
- Trạng thái chưa khởi tạo (`Cannot access '...' before initialization`).
- Lặp vô hạn khi render (render loops).
- Lỗi Hydration mismatch do trật tự import bị đảo lộn trên Server và Client.
- Ứng dụng chạy chậm hoặc sập bất ngờ.

Skill này cung cấp kịch bản quét tự động sử dụng thư viện `madge` qua API Node.js để phân tích đồ thị phụ thuộc của toàn bộ dự án, tránh giới hạn độ dài dòng lệnh trên môi trường Windows.

## When to Use
- **Khi gặp lỗi khởi tạo runtime:** Khi gặp lỗi liên quan đến việc truy cập một module/biến trước khi khởi tạo (`ReferenceError: Cannot access 'X' before initialization`).
- **Trước khi commit code hoặc deploy:** Tích hợp hoặc chạy định kỳ trước khi bàn giao mã nguồn để đảm bảo cấu trúc thư mục và import luôn sạch sẽ.
- **Tái cấu trúc (Refactoring) codebase:** Khi chia tách các module lớn, gom nhóm components, hoặc tổ chức lại thư mục `app/`.

## When Not to Use
- **Dành riêng cho Convex Schema/Functions:** Không nên dùng để phân tích lỗi phụ thuộc vòng trong các query/mutation của Convex (`convex/`). Convex tự động sinh mã (codegen) và quản lý liên kết bảng theo cách tạo ra các tham chiếu vòng ảo không gây ảnh hưởng thực tế lúc runtime. Bộ quét này đã được cấu hình mặc định bỏ qua thư mục `convex/`.
- **Dự án không phải Node.js/Next.js App Router:** Kịch bản quét này được tối ưu để tự động tìm kiếm các entrypoint tiêu chuẩn như `page.tsx`, `layout.tsx`, `route.ts` trong thư mục `app/`. Nếu dự án sử dụng cấu trúc khác, kết quả có thể không đầy đủ.

## Workflow
1. **Khởi chạy quét:** Từ thư mục gốc của dự án, chạy lệnh:
   ```bash
   node .factory/skills/madge-circular-scanner/scripts/scan.js
   ```
2. **Quá trình tự động cài đặt và quét:**
   - Kịch bản sẽ tự động phát hiện package manager của dự án (`bun`, `pnpm`, `yarn`, hoặc `npm`).
   - Nếu `madge` chưa được cài đặt trong dự án, kịch bản tự động sao lưu cấu hình, cài đặt tạm thời `madge` làm devDependency.
   - Quét tất cả file `page.tsx`, `layout.tsx`, `route.ts` trong thư mục `app/` để dựng đồ thị phụ thuộc.
3. **Phân tích kết quả đầu ra:**
   - **Thành công (Không có lỗi):** Output hiển thị màu xanh:
     ```text
     √ No circular dependencies found (excluding convex)!
     ```
   - **Thất bại (Phát hiện import vòng):** Output hiển thị màu đỏ danh sách các file import chéo nhau dưới dạng chuỗi liên kết:
     ```text
     Found 2 circular dependencies:
     1) app/home/page.tsx > components/Sidebar.tsx > app/home/page.tsx
     2) app/layout.tsx > lib/utils.ts > app/layout.tsx
     ```
4. **Khắc phục lỗi:**
   - **Tách biệt logic dùng chung:** Di chuyển phần logic hoặc hằng số bị import chéo ra một file helper độc lập mới (ví dụ: `lib/shared-helpers.ts` hoặc `hooks/useSharedState.ts`). Cập nhật các module cũ import từ file helper này.
   - **Type-only imports:** Với các interface hoặc type của TypeScript, sử dụng cú pháp `import type { User } from './types'` thay vì `import { User }`. Trình biên dịch TypeScript sẽ loại bỏ hoàn toàn các dòng này khi build ra JavaScript runtime, triệt tiêu lỗi phụ thuộc vòng.
5. **Tự động dọn dẹp (Cleanup):**
   - Sau khi hoàn thành hoặc nếu xảy ra bất kỳ lỗi/hủy ngang nào trong quá trình chạy (SIGINT, SIGTERM, crash), script sẽ tự động uninstall `madge` (nếu cài tạm thời), phục hồi hoàn toàn trạng thái nguyên bản của `package.json` và lockfile thông qua sao lưu vật lý kết hợp lệnh `git checkout --`.

## Checklist
- [ ] Chắc chắn đang chạy lệnh ở thư mục gốc của dự án Next.js.
- [ ] Đảm bảo thư mục `app/` có chứa các entrypoint chính cần phân tích.
- [ ] Chạy script quét và kiểm tra xem có bất kỳ dòng circular dependency nào được in ra không.
- [ ] Nếu phát hiện circular dependency, thực hiện chỉnh sửa code theo hướng dẫn khắc phục ở phần Workflow.
- [ ] Chạy lại lệnh quét để xác minh mã nguồn đã sạch hoàn toàn.
- [ ] Kiểm tra trạng thái Git (`git status`) để đảm bảo không còn tàn dư cài đặt tạm thời của `madge` trong `package.json` hoặc các lockfile.
