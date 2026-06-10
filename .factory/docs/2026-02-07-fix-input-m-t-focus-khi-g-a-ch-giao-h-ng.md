## Problem Graph
```
1. [Main] Input địa chỉ mất focus khi gõ
   1.1 [ROOT CAUSE] ShippingInfoCard được định nghĩa là function component 
       BÊN TRONG CheckoutContent
       → Mỗi lần state thay đổi (setShippingAddress), parent re-render
       → ShippingInfoCard được re-create (reference mới)
       → React unmount component cũ, mount component mới
       → Input mất focus
```

## Giải pháp

**Option 1: Chuyển ShippingInfoCard thành inline JSX** (Recommended - đơn giản nhất)
- Thay vì gọi `<ShippingInfoCard />`, inline trực tiếp JSX vào trong render
- Không cần thay đổi logic, chỉ cần xóa function wrapper

**Option 2: Di chuyển các Card components ra ngoài CheckoutContent**
- Tách `ShippingInfoCard`, `ShippingOptionsCard`, `PaymentMethodsCard` thành separate components
- Truyền props cần thiết (state + setters)
- Phức tạp hơn do nhiều props

## Code thay đổi (Option 1)

Thay đoạn:
```tsx
const ShippingInfoCard = () => (
  <div className="bg-white rounded-2xl ...">
    ...
  </div>
);
```

Thành inline JSX khi render:
```tsx
{/* Inline ShippingInfoCard JSX directly here */}
<div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
  ...input fields...
</div>
```

Tương tự cho `ShippingOptionsCard` và `PaymentMethodsCard` nếu chúng cũng có input (radio buttons không bị ảnh hưởng nhiều nhưng nên fix luôn để nhất quán).