## Vấn đề
`useSearchParams()` cần được wrap trong `<Suspense>` boundary khi sử dụng ở page level trong Next.js App Router.

## Giải pháp
Tách logic chính của checkout page thành client component riêng, sau đó wrap nó trong `<Suspense>` ở page component.

## Thay đổi

**File: `app/(site)/checkout/page.tsx`**

1. Đổi tên component chính `CheckoutPage` thành `CheckoutContent`
2. Tạo component `CheckoutPage` mới (default export) wrap `CheckoutContent` trong `<Suspense>`

```tsx
// Component chính giữ nguyên logic, chỉ đổi tên
function CheckoutContent() {
  const searchParams = useSearchParams();
  // ... giữ nguyên toàn bộ logic hiện tại
}

// Page component với Suspense boundary
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}

// Loading skeleton
function CheckoutSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
      <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse mt-3 mx-auto" />
    </div>
  );
}
```

Cách này:
- Giữ nguyên toàn bộ logic hiện tại
- Chỉ thêm Suspense wrapper + loading skeleton
- Fix lỗi build ngay lập tức