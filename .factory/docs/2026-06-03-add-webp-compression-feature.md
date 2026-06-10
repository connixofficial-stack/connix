# Spec: Tích Hợp Tab Giảm Dung Lượng Ảnh WebP Lossless & Lossy (100% vs 90%)

# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Người dùng muốn có 2 lựa chọn nén ảnh logo/sản phẩm: hoặc giữ nguyên 100% chất lượng tuyệt đối không mất pixel nào (Lossless), hoặc giảm dung lượng tối đa (giảm mạnh 80-90% dung lượng gốc) với chất lượng cực nét 90% (Lossy).
* **Giải pháp**:
  * Thiết lập tab riêng **"Giảm dung lượng ảnh"** trong trình chỉnh sửa.
  * Tích hợp hai nút nén:
    1. **"Nén WebP (Đẹp 100%)"**: Xuất file WebP Lossless qua Canvas gọi `canvas.toBlob(..., 'image/webp', 1.0)`.
    2. **"Nén WebP (Giảm mạnh 90%)"**: Xuất file WebP Lossy chất lượng 90% qua Canvas gọi `canvas.toBlob(..., 'image/webp', 0.9)`.
* **Lợi ích**: Admin có toàn quyền quyết định giữa độ nét tuyệt đối (Đẹp 100%) và dung lượng siêu nhẹ (Giảm mạnh 90%) ngay trên một giao diện thống nhất.

## 2. Elaboration & Self-Explanation
Bộ mã hóa WebP của trình duyệt cho phép nén theo 2 phương thức:
* **Lossless (quality = 1.0)**: Giữ nguyên 100% thông tin pixel, nén không tổn hao. Kích thước file giảm từ 30% đến 50% so với PNG gốc. Phù hợp cho logo dạng vector, chứa text hoặc chi tiết siêu mảnh cần độ chính xác tuyệt đối.
* **Lossy (quality = 0.9)**: Tối ưu màu sắc để giảm dung lượng mạnh mẽ nhất. Kích thước file giảm đến 80-90%. Phù hợp cho các ảnh sản phẩm lớn hoặc logo có màu sắc phức tạp, ảnh chụp thật. Ở mức 90%, mắt thường hoàn toàn không thể nhận thấy sự khác biệt về chất lượng so với ảnh gốc.

Hàm handler `handleCompressToWebP(quality)` sẽ nhận đối số chất lượng và thực hiện nén Canvas tương ứng, cập nhật metadata hiển thị trực quan.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Admin tải lên ảnh PNG 1.2 MB.
  * Bấm **Nén WebP (Đẹp 100%)**: Dung lượng ảnh giảm còn **650 KB** (giảm 45%), độ nét 10/10.
  * Bấm **Nén WebP (Giảm mạnh 90%)**: Dung lượng ảnh giảm chỉ còn **120 KB** (giảm 90%), độ nét 9.9/10 (mắt thường thấy giống hệt ảnh gốc).

# II. Audit Summary (Tóm tắt kiểm tra)
* **Tình trạng file hiện tại**:
  * [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx) đã hỗ trợ tab `compress` mang tên "Giảm dung lượng ảnh".
  * Hàm `handleCompressToWebP` đang mặc định chất lượng nén `1.0`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Phân tích thiết kế**:
  * Cần cập nhật callback `handleCompressToWebP` nhận tham số `quality` động để hỗ trợ cả hai nút bấm (1.0 và 0.9).

# IV. Proposal (Đề xuất)

## Option 1 (Recommend) — Confidence 98%
Mở rộng giao diện tab "Giảm dung lượng ảnh" để cung cấp hai nút nén (1.0 và 0.9).
* **a) Hàm xử lý**:
  * Sửa `handleCompressToWebP(quality: number)` để nén và thông báo tương ứng.
* **b) Nút bấm**:
  * Render hai nút **"Nén WebP (Đẹp 100%)"** và **"Nén WebP (Giảm mạnh 90%)"** cạnh nhau trong tab `compress`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [ImageEditorDialog.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/components/ImageEditorDialog.tsx)
  * Thay đổi: Nâng cấp `handleCompressToWebP` nhận quality, render 2 nút bấm tương ứng trên giao diện.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Cập nhật hàm `handleCompressToWebP` nhận quality.
2. **Bước 2**: Thay đổi nút bấm trong tab `compress` thành hai nút nén 100% và 90%.
3. **Bước 3**: Chạy kiểm tra compile TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra biên dịch**: Chạy `tsc --noEmit` để xác nhận không lỗi compile.
* **Kiểm tra thủ công**:
  * Mở dialog chỉnh sửa logo.
  * Vào tab "Giảm dung lượng ảnh".
  * Bấm nút **Nén WebP (Đẹp 100%)**, verify dung lượng và định dạng. Bấm Hoàn tác.
  * Bấm nút **Nén WebP (Giảm mạnh 90%)**, verify dung lượng giảm sâu hơn (ví dụ 80-90%), ảnh vẫn hiển thị sắc nét. Bấm Áp dụng.

# VIII. Todo
* [x] Cập nhật spec dự án.
* [x] Cập nhật `handleCompressToWebP` hỗ trợ tham số quality.
* [x] Render hai nút nén 100% và 90% trong tab `compress`.
* [ ] Kiểm tra lỗi biên dịch TypeScript.
* [ ] Commit thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Tab "Giảm dung lượng ảnh" hiển thị 2 nút: "Nén WebP (Đẹp 100%)" và "Nén WebP (Giảm mạnh 90%)".
* Nút 100% thực hiện nén lossless, nút 90% thực hiện nén lossy chất lượng 90%.
* Dung lượng hiển thị cập nhật chính xác.
* Không lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Không có rủi ro lớn. Hoàn tác bằng `git checkout`.
