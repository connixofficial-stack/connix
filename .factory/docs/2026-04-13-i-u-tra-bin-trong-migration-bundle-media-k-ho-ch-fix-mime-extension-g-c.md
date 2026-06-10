# I. Primer
## 1. TL;DR kiểu Feynman
- File ảnh bị ra `.bin` vì pipeline export bundle đang gán cứng `mimeType: application/octet-stream` thay vì lấy MIME thật từ nguồn.
- Khi import, UI tiếp tục upload với `Content-Type` fallback octet-stream, rồi lưu vào bảng media bằng MIME này, nên `/admin/media` phân loại sai và trông như “file rác”.
- Ảnh **vẫn có thể hiển thị** (nếu URL hợp lệ), nhưng metadata sai làm hỏng phân loại, cleanup và trải nghiệm quản trị.
- Hướng fix đã chốt theo ý anh: **giữ đúng đuôi + MIME gốc** xuyên suốt export → zip → parse → import.
- Em sẽ sửa tối thiểu ở 3 điểm: exporter (convex), client zip parser, import uploader.

## 2. Elaboration & Self-Explanation
Hiện tại logic bundle coi media như “blob generic”, nên mất loại file ngay từ export.
Khi mất loại file:
1) tên file trong bundle có thể thành `.bin` (do không suy ra extension),
2) lúc import lên storage/media, hệ thống lưu `mimeType` sai,
3) trang `/admin/media` dùng `mimeType` để phân loại image/video/document, nên bị lệch.

Nói ngắn gọn: dữ liệu ảnh không mất nội dung, nhưng “nhãn nhận dạng” bị mất nên sinh hành vi lộn xộn ở quản trị.

## 3. Concrete Examples & Analogies
- Ví dụ thực tế theo code hiện tại:
  - Export: `convex/migrationBundles.ts` đang set `mimeType: "application/octet-stream"` cho media entry.
  - Parse ZIP: `lib/migration-bundle/client.ts` tạo `File(..., { type: blob.type || media.mimeType || 'application/octet-stream' })`.
  - Import: `components/data/import-export/MigrationBundleCard.tsx` upload bằng `media.file.type || 'application/octet-stream'` và saveImage với MIME tương tự.
- Analogy: giống việc chuyển kho hàng nhưng gỡ hết tem sản phẩm và dán nhãn “hàng tổng hợp”; hàng vẫn dùng được, nhưng quản lý kho sẽ lộn xộn.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Observation**
  - `convex/migrationBundles.ts`:
    - `collectProductMedia` và `collectSimpleMedia` ghi cứng `mimeType: application/octet-stream`.
    - `buildMediaLogicalPath` lấy extension từ URL nguồn, thiếu fallback theo MIME thật.
  - `lib/migration-bundle/client.ts`:
    - `responseToFile` và `parseBundleFile` có fallback `file.bin` + `application/octet-stream`.
  - `components/data/import-export/MigrationBundleCard.tsx`:
    - upload/import media dùng fallback octet-stream khi thiếu `media.file.type`.
- **Inference**
  - Root cause nằm ở hợp đồng media trong bundle + import path, không phải riêng UI `/admin/media`.
- **Decision**
  - Giữ policy anh chọn: **bảo toàn MIME + extension gốc**, không đổi sang ép JPG/PNG.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc): High
- Có bằng chứng trực tiếp tại các điểm set/fallback `application/octet-stream` trong exporter + importer UI.

## 2. Audit theo 8 câu hỏi
- a) Triệu chứng: ảnh trong bundle có đuôi `.bin`, import xong `/admin/media` xuất hiện item phân loại bất thường.
- b) Phạm vi: migration bundle cho các module có media (`products/services/posts/home-components/settings`).
- c) Tái hiện: ổn định khi export/import qua flow bundle hiện tại.
- d) Mốc thay đổi: logic hiện hành trong `convex/migrationBundles.ts` + `lib/migration-bundle/client.ts` + `MigrationBundleCard.tsx`.
- e) Thiếu dữ liệu: chưa có evidence trực tiếp từ thư mục anh nêu vì môi trường đọc được trả về `Empty directory`; tuy nhiên code evidence đủ để kết luận nguyên nhân.
- f) Giả thuyết thay thế:
  - URL nguồn không có extension nên sinh `.bin`.
  - Blob từ ZIP không trả MIME đúng.
  - Cả 2 có thể góp phần, nhưng đều được khuếch đại bởi fallback octet-stream toàn pipeline.
- g) Rủi ro fix sai: có thể sửa tên file nhưng vẫn lưu MIME sai ở DB, dẫn tới lỗi ngầm còn tồn tại.
- h) Pass/fail: pass khi export/import không còn `.bin` cho ảnh hợp lệ và `/admin/media` phân loại đúng `image/*`.

## 3. Counter-Hypothesis (Giả thuyết đối chứng)
- Chỉ sửa UI `/admin/media`: không đủ vì dữ liệu MIME trong DB đã sai từ import.
- Chỉ sửa parse ZIP: không đủ vì exporter vẫn ghi metadata sai.

# IV. Proposal (Đề xuất)
- Chuẩn hóa media contract theo nguyên tắc: **source URL + detected MIME + extension nhất quán**.
- Bổ sung hàm suy MIME/extension:
  1) ưu tiên `Content-Type` từ fetch response,
  2) fallback từ extension URL,
  3) cuối cùng mới `application/octet-stream`.
- Sửa export:
  - ghi `BundleMediaEntry.mimeType` theo MIME detect thật.
  - logicalPath dùng extension map từ MIME (nếu URL thiếu/ext lạ).
- Sửa parse/import client:
  - tạo `File` với MIME thật từ entry.
  - khi upload/saveImage, gửi MIME thật; chỉ fallback octet-stream khi bất khả kháng.
- Bổ sung preflight warning mới:
  - cảnh báo media entry có MIME generic hoặc extension không khớp MIME.

```mermaid
flowchart TD
  A[Source URL] --> B[Detect MIME]
  B --> C[Build logicalPath ext]
  C --> D[Write media.index]
  D --> E[ZIP]
  E --> F[Parse bundle]
  F --> G[Create File with MIME]
  G --> H[Upload storage]
  H --> I[saveImage mimeType]
  I --> J[/admin/media classify]
```

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `convex/migrationBundles.ts`
  - Vai trò hiện tại: export/preflight/import bundle.
  - Thay đổi: detect MIME đúng cho media entries; xây logicalPath với extension chuẩn theo MIME.
- **Sửa:** `lib/migration-bundle/client.ts`
  - Vai trò hiện tại: tạo ZIP và parse bundle file.
  - Thay đổi: preserve MIME khi tạo `File`; giảm fallback `file.bin`/octet-stream không cần thiết.
- **Sửa:** `components/data/import-export/MigrationBundleCard.tsx`
  - Vai trò hiện tại: UI thực thi preflight/import, upload media.
  - Thay đổi: upload/saveImage dùng MIME chuẩn từ parsed media.
- **Sửa (nhẹ):** `lib/image/uploadNaming.ts`
  - Vai trò hiện tại: map MIME → extension.
  - Thay đổi: mở rộng map cho các MIME phổ biến (nếu thiếu) để tránh rơi về `bin`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc/sửa helper detect MIME + ext trong `convex/migrationBundles.ts`.
2. Nối helper vào `collectProductMedia`/`collectSimpleMedia`.
3. Cập nhật `client.ts` để bảo toàn MIME khi parse ZIP.
4. Cập nhật `MigrationBundleCard.tsx` cho upload/saveImage theo MIME thật.
5. Review tĩnh TypeScript + edge cases URL không extension.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static check: `bunx tsc --noEmit` (theo rule repo).
- Repro thủ công:
  1) Export bundle có ảnh jpg/png/webp.
  2) Mở ZIP kiểm tra `media/*` không còn `.bin` bất thường.
  3) Import bundle.
  4) Kiểm tra `/admin/media` ảnh vào đúng nhóm image.
  5) Kiểm tra `images.mimeType` lưu đúng `image/*`.
- Không chạy lint/unit theo guideline repo hiện tại.

# VIII. Todo
1. Chuẩn hóa hàm detect MIME + extension cho bundle exporter.
2. Sửa metadata media export để bỏ hardcode octet-stream.
3. Sửa parse bundle giữ MIME đúng khi tạo File.
4. Sửa import upload/saveImage dùng MIME chuẩn.
5. Thêm preflight warnings cho MIME/extension mismatch.
6. Type-check và self-review tĩnh trước bàn giao.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Ảnh export bundle giữ đúng đuôi gốc (hoặc đuôi tương thích MIME), không còn `.bin` cho ảnh hợp lệ.
- `media.index.json` chứa MIME cụ thể (`image/jpeg`, `image/png`, ...), không hardcode octet-stream hàng loạt.
- Import xong `/admin/media` phân loại đúng image/video/document dựa trên MIME.
- Không phát sinh “mớ file vớ vẩn” do MIME generic từ migration flow.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: một số URL nguồn trả `Content-Type` sai hoặc thiếu.
- Giảm rủi ro: fallback đa tầng (header -> ext URL -> octet-stream).
- Rollback: đổi lại nhánh detect MIME về behavior cũ (1 file chính `convex/migrationBundles.ts` + 2 điểm client).

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor toàn bộ module media/cleanup ngoài migration bundle flow.
- Không đổi UX lớn ở `/admin/media`, chỉ sửa đúng nguồn dữ liệu MIME/filename.

# XII. Open Questions (Câu hỏi mở)
- Không còn câu hỏi mở cho phase fix này (policy đã chốt: giữ MIME + đuôi gốc).