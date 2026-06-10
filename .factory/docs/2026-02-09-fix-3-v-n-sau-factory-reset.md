## Phân tích 3 vấn đề

### Vấn đề 1 & 2: Feature not found + Thiếu cột ảnh/hiển thị
**Nguyên nhân:** Factory reset xóa sạch `moduleFields`, `moduleFeatures` nhưng:
- Seeder `adminModules` chỉ seed bảng `adminModules`, không seed `moduleFields`/`moduleFeatures`
- Cấu hình module (fields, features) được seed qua mutations riêng trong `convex/seed.ts`: `seedPostsModule`, `seedProductsModule`, `seedServicesModule`...

**Giải pháp:** Tạo mutation `initCoreModulesConfig` để seed lại cấu hình tất cả modules:
```ts
// convex/seedManager.ts
export const initCoreModulesConfig = mutation({
  args: {},
  handler: async (ctx) => {
    // Gọi tuần tự các seed*Module từ seed.ts
    // Để seed moduleFields + moduleFeatures cho tất cả modules
  }
});
```

Và gọi `initCoreModulesConfig` sau khi factory reset xong (hoặc cung cấp nút riêng).

### Vấn đề 3: Cần thanh tiến trình cho Factory Reset
**Giải pháp:** Cập nhật `FactoryResetDialog` để hiển thị progress:
- Hiển thị table đang xóa
- Hiển thị số table đã xóa / tổng số

---

## Files thay đổi

| Action | File |
|--------|------|
| UPDATE | `convex/seedManager.ts` - thêm `initCoreModulesConfig` mutation |
| UPDATE | `components/data/FactoryResetDialog.tsx` - thêm progress state và hiển thị |
| UPDATE | `components/data/DataCommandCenter.tsx` - truyền progress info và gọi init sau reset |

---

## Flow mới

```
Factory Reset với progress:
1. Click "Factory Reset" → Dialog step 1 → step 2 (nhập CHAC CHAN)
2. Chạy loop xóa từng table:
   - Hiển thị "Đang xóa: [table name]"
   - Hiển thị progress: "12/49 tables"
3. Sau khi xóa xong → hỏi "Khởi tạo lại cấu hình modules?"
   - Có → gọi initCoreModulesConfig
   - Không → kết thúc
4. Toast success
```
