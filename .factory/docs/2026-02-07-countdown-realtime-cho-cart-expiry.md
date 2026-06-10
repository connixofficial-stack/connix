## Spec: Đồng bộ UI "Giỏ hàng hết hạn" - Countdown realtime

### 1. Tạo Hook countdown realtime
**File mới:** `lib/cart/useCartExpiry.ts`
- Hook `useCartExpiry(expiresAt: number | null)` 
- Return: `{ expiryText: string | null, isExpired: boolean }`
- Logic:
  - Tính `remainingMs = expiresAt - Date.now()`
  - Nếu `<= 0`: `isExpired = true`, text = "Đã hết hạn"
  - Nếu `> 0`: format countdown
    - `< 60s`: "còn X giây"
    - `< 60m`: "còn X:XX" (phút:giây)
    - `< 24h`: "còn X giờ Y phút"  
    - `>= 24h`: "còn X ngày"
  - `useEffect` với `setInterval(1000)` để cập nhật mỗi giây
  - Cleanup interval on unmount

### 2. Áp dụng hook vào Frontend UI
**File:** `app/(site)/cart/page.tsx`
- Replace logic hiện tại:
  ```ts
  const expiresInText = useMemo(() => { ... }, [expiresAt]);
  ```
- Bằng:
  ```ts
  const { expiryText, isExpired } = useCartExpiry(expiresAt);
  ```
- Hiển thị: "Giỏ hàng hết hạn sau {expiryText}"

**File:** `components/site/CartDrawer.tsx`
- Tương tự thay logic countdown cũ bằng hook mới

### 3. Áp dụng vào Preview (để test được)
**File:** `components/experiences/previews/CartPreview.tsx`  
- Thêm prop `expiresAt?: number` (optional, default = 30 phút sau)
- Dùng `useCartExpiry(expiresAt)` thay text hardcode "29:45"
- Preview sẽ countdown thật từ giá trị mock

### 4. Style thống nhất
- Text màu: `text-red-500` (cảnh báo)
- Icon: `<Clock size={12-14} />`  
- Khi expired: đổi sang `text-slate-500` + text "Đã hết hạn"

### 5. Files cần sửa
1. **Tạo mới:** `lib/cart/useCartExpiry.ts` (hook countdown)
2. **Sửa:** `app/(site)/cart/page.tsx` (dùng hook)
3. **Sửa:** `components/site/CartDrawer.tsx` (dùng hook)
4. **Sửa:** `components/experiences/previews/CartPreview.tsx` (dùng hook)
5. **Export:** `lib/cart/index.ts` (export hook mới)

### Output mong đợi
- Frontend UI: "Giỏ hàng hết hạn sau 29:12" → đếm ngược realtime
- Preview: Giống y hệt, countdown thật từ mock data
- Khi hết hạn: "Giỏ hàng đã hết hạn" (màu xám)