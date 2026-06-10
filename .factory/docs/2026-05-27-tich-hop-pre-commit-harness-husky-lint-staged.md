# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Hiện tại, việc kiểm tra code (`oxlint` và `tsc --noEmit`) đang được thực hiện thủ công hoặc thiếu chốt chặn tự động trước khi commit. Điều này dễ dẫn đến việc lọt code lỗi cú pháp hoặc gãy kiểu dữ liệu lên repository.
- **Giải pháp:** Tích hợp bộ **Pre-commit Harness** chuẩn doanh nghiệp lớn (SAAS-grade) sử dụng **Husky** (kích hoạt git hooks) và **Lint-staged** (lọc file thay đổi cục bộ).
- **Kết quả:** Tự động sửa lỗi cú pháp (`oxlint --fix`) trên chính xác những file chuẩn bị commit chỉ trong <0.5 giây và kiểm tra toàn vẹn kiểu dữ liệu toàn dự án (`bun tsc --noEmit`) trước khi cho phép commit.

## 2. Elaboration & Self-Explanation
Chúng ta sử dụng `bun` (vì có file `bun.lock` trong repo) để cài đặt `husky` và `lint-staged`. 
Khi dev gõ lệnh `git commit`, Husky sẽ bắt được sự kiện (hook) `pre-commit` và kích hoạt kịch bản kiểm tra:
1. `lint-staged` sẽ lọc ra các file code `.js`, `.jsx`, `.ts`, `.tsx` đã staged, chạy `bunx oxlint --type-aware --type-check --fix` cục bộ trên các file đó.
2. Tiếp theo, hệ thống sẽ chạy `bun tsc --noEmit` để đảm bảo đồ thị kiểu dữ liệu toàn bộ dự án không bị gãy.
Nếu một trong hai bước thất bại, tiến trình commit sẽ bị hủy (exit 1), bảo vệ mã nguồn tối đa.

---

# IV. Proposal (Đề xuất)
1. Cài đặt các gói dev dependencies: `husky`, `lint-staged` bằng `bun add -d`.
2. Khởi tạo cấu hình Husky (`bunx husky init`).
3. Cập nhật cấu hình `lint-staged` trong `package.json`.
4. Tạo và cấu hình file `.husky/pre-commit` với kịch bản chạy tuần tự linter cục bộ và typecheck toàn cục.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [package.json](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/package.json)
  - *Thay đổi:* Thêm `husky`, `lint-staged` vào `devDependencies`, thêm cấu hình `"lint-staged"` chạy `oxlint --fix`.
- **Thêm:** [`.husky/pre-commit`](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/.husky/pre-commit)
  - *Thay đổi:* Tập lệnh script chạy kiểm chứng pre-commit.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng tự động:** Chạy thử `bunx lint-staged` ở local để kiểm tra xem cấu hình hoạt động đúng không.
- **Kiểm chứng thủ công:** Thử thực hiện sửa đổi nhỏ trên file bất kỳ, gõ `git add` và `git commit` để xem Husky có kích hoạt đúng luồng kiểm tra không.
