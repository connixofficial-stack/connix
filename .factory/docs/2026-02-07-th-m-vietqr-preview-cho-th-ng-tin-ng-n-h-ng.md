## Mục tiêu
Thêm preview VietQR realtime trong tab Thanh toán, hiển thị mã QR dựa trên thông tin ngân hàng đã nhập.

## Thay đổi

### 1. Tạo component `VietQRPreview.tsx`
**File:** `components/modules/orders/VietQRPreview.tsx`

```tsx
interface VietQRPreviewProps {
  bankCode: string;
  bankAccountNumber: string;
  bankAccountName: string;
  template: string;
}
```

**Logic:**
- Nhận props từ `localSettings`
- Generate URL: `https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.jpg?accountName={accountName}`
- Hiển thị QR image với fallback khi thiếu thông tin
- Hiển thị text hướng dẫn bên dưới

### 2. Cập nhật layout tab Payment trong `OrdersConfigTab.tsx`

**Trước:**
```
[Phương thức thanh toán] (col-span-3)
[Thông tin ngân hàng]   (col-span-3)
```

**Sau:**
```
[Phương thức thanh toán]     (col-span-3)
[Thông tin ngân hàng] (2col) | [VietQR Preview] (1col)
```

### 3. UI Preview
- Card "Preview VietQR" với icon QrCode
- Hiển thị ảnh QR từ VietQR API (kích thước ~200x200)
- Text: "Mẫu: {template}" + "Quét mã để thanh toán"
- Placeholder khi chưa đủ thông tin: "Nhập đầy đủ thông tin ngân hàng để xem preview"

### Lưu ý
- VietQR API miễn phí, không cần API key
- Không truyền `amount` vì đây là preview config, không phải đơn hàng thực
- Dùng `next/image` với `unoptimized` vì là external URL