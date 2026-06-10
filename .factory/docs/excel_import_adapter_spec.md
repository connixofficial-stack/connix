# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi Admin vận hành tải file Excel Sapo ThanShoes lên mà hệ thống chưa bật tính năng biến thể, họ cần báo Dev điều chỉnh cấu hình. Tuy nhiên, tin nhắn hướng dẫn không nên quá dài dòng hay chứa đường dẫn hệ thống nội bộ để tránh Admin thắc mắc hoặc truy cập trái phép. Đồng thời, ảnh sản phẩm nằm trên CDN của Sapo, Next.js sẽ chặn không cho hiển thị nếu chưa được cấu hình tên miền cho phép.
*   **Giải pháp:** 
    *   Tối giản hóa tin nhắn copy để gửi trực tiếp cho Dev mà không kèm link hay lời chào hỏi dư thừa.
    *   Cấu hình `next.config.ts` cho phép nạp ảnh từ `sapo.dktcdn.net` và `*.dktcdn.net`.
*   **Kết quả:** Đảm bảo hệ thống vừa import dữ liệu khớp chính xác, vừa hiển thị hình ảnh sản phẩm mượt mà, không bị lỗi chặn CDN.

## 2. Elaboration & Self-Explanation
Nhân viên vận hành (Admin cửa hàng) không cần quan tâm đến các đường dẫn kỹ thuật như `system/modules/...` và việc hiển thị link này có thể khiến họ tò mò hoặc hỏi han phiền phức. 

Khi có lỗi tương thích cấu hình, hệ thống sẽ sinh ra một đoạn tin nhắn tối giản, mang tính chất kỹ thuật cao để gửi thẳng cho Dev. Dev chỉ cần đọc các tham số này là tự khắc biết phải truy cập vào đâu trong hệ thống để cấu hình lại, không cần bất kỳ sự giải thích hay dẫn link nào từ phía Admin.

Ngoài ra, hình ảnh sản phẩm trong file Excel Sapo chứa đường dẫn từ CDN của Sapo (ví dụ: `https://sapo.dktcdn.net/...`). Next.js có cơ chế bảo mật hình ảnh nghiêm ngặt, bắt buộc phải cấu hình `remotePatterns` trong `next.config.ts` thì mới render được ảnh thông qua Next.js `<Image />` component. Chúng ta đã thêm `*.dktcdn.net` và `sapo.dktcdn.net` để mở khóa cho toàn bộ ảnh Sapo được hiển thị an toàn.

## 3. Concrete Examples & Analogies
*   **Ví dụ đoạn tin nhắn tối giản được sinh ra:**
    > 📋 **Nội dung tin nhắn sao chép:**
    > Nhờ kỹ thuật cấu hình lại module Sản phẩm (Products) để import file Excel Sapo:
    > - Bật tính năng Phiên bản (variantEnabled = true)
    > - Chuyển quản lý Giá sang cấp Phiên bản (variantPricing = variant)
    > - Chuyển quản lý Tồn kho sang cấp Phiên bản (variantStock = variant)

---

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Tinh giản UI/UX:**
    *   Bỏ đường dẫn URL cấu hình hệ thống khỏi tin nhắn copy.
    *   Rút gọn ngôn từ tin nhắn, đi thẳng vào cấu hình kỹ thuật để Dev dễ xử lý.
*   **Các Gap kỹ thuật cần xử lý để cả Import lẫn Update hoạt động hoàn hảo:**
    1.  **CategoryId bắt buộc:** Convex yêu cầu `categoryId` khi tạo mới sản phẩm. Ta cần map tên danh mục (cột C của Sapo) sang ID danh mục tương ứng của Convex.
    2.  **SKU biến thể:** Convex tự sinh SKU dạng `SKUCHA-1`, `SKUCHA-2`... Ta cần nhận SKU biến thể từ Excel (dạng `SKUCHA-SIZE`) để đồng bộ kho chính xác với Sapo.
    3.  **Đồng bộ tồn kho về 0:** Các size cũ có trong database nhưng không xuất hiện trong file Excel Sapo cần được cập nhật tồn kho về 0 thay vì xóa hoàn toàn (giúp giữ lịch sử đơn hàng cũ).
    4.  **Mảng ảnh:** Đồng bộ tất cả các URL ảnh từ biến thể (cột R) vào mảng ảnh `images` của sản phẩm cha.
    5.  **Cấu hình hiển thị ảnh Sapo CDN:** Cho phép Next.js nạp ảnh từ tên miền `*.dktcdn.net` và `sapo.dktcdn.net` để tránh lỗi vỡ/chặn ảnh ngoài site chính.

---

# IV. Proposal (Đề xuất)

## 1. Nâng cấp UI Import Modal (import-modal.tsx)
Truyền danh sách `categories` từ client-side vào Server Action `parseProductExcelBase64` để thực hiện ánh xạ danh mục:
```tsx
const categoryList = categories.map(c => ({ id: c._id, name: c.name }));
const result = await parseProductExcelBase64(base64String, configData, excelOptions, categoryList);
```

## 2. Ánh xạ Danh mục và SKU biến thể trong Adapter (sapo-thanshoes.adapter.ts)
*   Nhận `categories` trong hàm `parse` để tìm danh mục khớp với tên loại sản phẩm (Cột C).
*   Gom toàn bộ ảnh của các biến thể vào mảng `images` của sản phẩm cha.
*   Gán trường `sku` cho từng biến thể: `sku: skuVal` (cột N từ Excel).

## 3. Tối ưu hóa Convex mutation (convex/productsImport.ts)
*   Mở rộng schema `bulkVariantDoc` hỗ trợ trường `sku: v.optional(v.string())`.
*   Sửa logic cập nhật biến thể sản phẩm: Sử dụng đối khớp theo SKU. Nếu SKU biến thể đã tồn tại thì thực hiện cập nhật (`patch`), nếu chưa thì tạo mới (`insert`).
*   Các biến thể cũ trong database không xuất hiện trong file Excel sẽ bị set `stock: 0` thay vì bị delete hoàn toàn để đảm bảo an toàn dữ liệu lịch sử đơn hàng.

## 4. Cấu hình Next.js Image Security (next.config.ts)
*   Thêm `sapo.dktcdn.net` và `*.dktcdn.net` vào mảng `remotePatterns` trong cấu hình Next.js.

---

# V. Tệp bị ảnh hưởng (Files Impacted)
*   **[NEW]** `lib/excel/adapters/excel-adapter.interface.ts`
*   **[NEW]** `lib/excel/adapters/sapo-thanshoes.adapter.ts`
*   **[NEW]** `lib/excel/adapters/registry.ts`
*   **[MODIFY]** `app/admin/products/actions/excel-actions.ts`
*   **[MODIFY]** `app/admin/products/components/import-modal.tsx`
*   **[MODIFY]** `convex/productsImport.ts`
*   **[MODIFY]** `next.config.ts`

---

# VIII. Todo
- `[x]` Thêm phương thức `checkCompatibility` vào interface `ExcelImportAdapter`.
- `[x]` Cài đặt kiểm tra tính tương thích cấu hình trong `sapo-thanshoes.adapter.ts`.
- `[x]` Thêm hàm sinh tin nhắn tối giản `generateSupportMessage` và `handleCopyMessage` trong `import-modal.tsx`.
- `[x]` Hiển thị Smart Panel cảnh báo tối giản kèm nút Copy to Clipboard trong giao diện Modal Import.
- `[x]` Vô hiệu hóa nút **"Tiến hành Import"** khi phát hiện lỗi không tương thích.
- `[x]` Cập nhật Convex mutation `upsertBulk` hỗ trợ nhận SKU biến thể và tối ưu hóa quản lý biến thể (đối khớp SKU, cập nhật tồn kho về 0 thay vì xóa biến thể cũ).
- `[x]` Chuyển danh sách `categories` từ client vào Server Action để tự động map danh mục.
- `[x]` Cập nhật `next.config.ts` cho phép load ảnh CDN từ Sapo.
- `[x]` Chạy compile check TypeScript và commit toàn bộ thay đổi.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Đúng dữ liệu (Import & Update):** Khi import hoặc cập nhật dữ liệu, sản phẩm cha và các biến thể con (Size, Giá bán, Tồn kho, Ảnh đại diện) phải được cập nhật/thêm mới chính xác vào database Convex dựa trên SKU biến thể thực tế (dạng `SKUCHA-SIZE`).
*   **Đồng bộ tồn kho:** Các biến thể không xuất hiện trong file Excel nhập kho phải được set `stock: 0` để cập nhật tồn kho thực tế, nhưng không bị xóa khỏi database.
*   **Hiển thị hình ảnh:** Toàn bộ ảnh sản phẩm của ThanShoes sau khi import (nằm trên CDN Sapo) phải được hiển thị chính xác trên website mà không bị chặn bởi Next.js Security.
*   **Tính an toàn:** Nút **"Tiến hành Import"** bị vô hiệu hóa khi cấu hình hệ thống bị lệch, ngăn chặn việc người dùng cố tình gửi dữ liệu lỗi.
