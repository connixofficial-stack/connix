## Problem Graph
1. [Main] Thêm ColorInfoPanel cho các home-component có brand colors (dual mode)
   1.1 [Sub] Xác định các preview đang thiếu panel
   1.2 [Sub] Chuẩn hoá UI panel giống Hero
   1.3 [Sub] Tích hợp panel ngay dưới PreviewWrapper
   1.4 [Sub] Validate bằng `bunx tsc --noEmit` và commit

## Execution (with reflection)
1. Solving 1.1...
   - Thought: Quét tất cả `*Preview.tsx` trong `app/admin/home-components/**` để xác định những component đang dùng brand colors nhưng chưa có panel.
   - Action: Dùng Glob để lấy danh sách preview; Grep “Màu chính/Màu phụ” để phát hiện panel hiện có.
   - Reflection: ✓ Valid — có danh sách đầy đủ và biết CTA/FAQ/Hero đã có panel.

2. Solving 1.2...
   - Thought: Dùng layout/markup của panel trong `HeroPreview` làm chuẩn.
   - Action: Trích khối JSX panel từ `HeroPreview` (dual mode) làm snippet chuẩn.
   - Reflection: ✓ Valid — đồng nhất UI theo yêu cầu “giống Hero”.

3. Solving 1.3...
   - Thought: Chèn panel **ngay dưới PreviewWrapper** cho các preview có brand colors nhưng thiếu panel.
   - Action: Với từng preview liên quan, thêm JSX panel ở dưới `</PreviewWrapper>` (giống vị trí Hero). Chỉ render khi `mode === 'dual'`. Dùng `brandColor/secondary` hiện có (không tạo logic mới).
   - Reflection: ✓ Valid — đúng vị trí/điều kiện render theo yêu cầu.

4. Solving 1.4...
   - Thought: Có thay đổi TS/TSX nên bắt buộc chạy `bunx tsc --noEmit`, rồi commit.
   - Action: Chạy `bunx tsc --noEmit`. Nếu pass, staging các file liên quan và commit theo convention hiện tại.
   - Reflection: ✓ Valid — tuân thủ hướng dẫn dự án.

## Files dự kiến chỉnh sửa
- Các preview có brand colors nhưng chưa có panel (sẽ xác định bằng quét nguồn). Dự kiến thuộc các thư mục:
  - `app/admin/home-components/*/_components/*Preview.tsx`

## Snippet ColorInfoPanel (chuẩn Hero)
```tsx
{mode === 'dual' && (
  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Màu chính:</span>
        <div className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: brandColor }} title={brandColor} />
        <span className="font-mono text-slate-600 dark:text-slate-400">{brandColor}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-500 dark:text-slate-400">Màu phụ:</span>
        <div className="w-8 h-8 rounded border-2 border-slate-300 dark:border-slate-600 shadow-sm" style={{ backgroundColor: secondary }} title={secondary} />
        <span className="font-mono text-slate-600 dark:text-slate-400">{secondary}</span>
      </div>
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
      Màu phụ được áp dụng cho: nav buttons, borders, badges, accents.
    </p>
  </div>
)}
```

## Cần bạn xác nhận trước khi triển khai
- Xác nhận giúp mình danh sách **component có brand colors** cần thêm panel (mình sẽ dựa trên code để xác định). Nếu bạn có danh sách cụ thể, mình sẽ ưu tiên theo đó.
