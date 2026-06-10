## VietQR Image Generation

### Mục tiêu
Hiển thị mã QR VietQR động khi khách hàng chọn thanh toán VietQR hoặc Chuyển khoản.

### VietQR API Format
```
https://img.vietqr.io/image/{bankCode}-{accountNumber}-{template}.jpg
  ?amount={amount}
  &addInfo={orderInfo}
  &accountName={accountName}
```

**Templates:** `compact`, `compact2`, `qr_only`, `print`

### Thay đổi

#### 1. Cập nhật Checkout Page (`app/(site)/checkout/page.tsx`)

Thay thế đoạn text "Quét VietQR từ ứng dụng..." bằng QR image thực:

```tsx
{selectedPayment.type === 'VietQR' && (
  <div className="mt-3 flex flex-col items-center">
    <img
      src={`https://img.vietqr.io/image/${bankInfo.bankCode}-${bankInfo.accountNumber}-${bankInfo.vietQrTemplate}.jpg?amount=${finalTotal}&addInfo=${encodeURIComponent(`DH ${orderId || 'PENDING'}`)}&accountName=${encodeURIComponent(bankInfo.accountName)}`}
      alt="VietQR"
      className="w-48 h-48 rounded-lg border"
    />
    <p className="mt-2 text-xs text-slate-500">Quét mã để thanh toán {formatPrice(finalTotal)}</p>
  </div>
)}
```

#### 2. Cập nhật vietQrTemplate setting thành select

Trong `orders.config.ts`, đổi type từ `text` sang `select`:

```ts
{ 
  key: 'vietQrTemplate', 
  label: 'Mẫu VietQR', 
  type: 'select', 
  options: [
    { value: 'compact', label: 'Compact (có logo)' },
    { value: 'compact2', label: 'Compact 2 (đơn giản)' },
    { value: 'qr_only', label: 'Chỉ QR' },
    { value: 'print', label: 'In ấn' },
  ],
  default: 'compact',
  group: 'payment' 
}
```

### Lưu ý
- VietQR API miễn phí, không cần API key
- `bankCode` phải đúng mã NAPAS (VCB, TCB, MB, ACB...)
- Amount sẽ dùng `finalTotal` (đã trừ discount + cộng shipping)