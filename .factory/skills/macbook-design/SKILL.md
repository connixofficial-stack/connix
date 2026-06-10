---
name: macbook-design
description: Hướng dẫn thiết kế giao diện Web/App theo phong cách tối giản phẳng macOS/iOS (Calm Productivity UI / Ultra-Minimal Dense).
---

# Hướng Dẫn Thiết Kế Giao Diện Web/App Phong Cách MacBook (macOS/iOS)

Tài liệu này cung cấp các nguyên tắc cốt lõi, bố cục chuẩn và các đoạn mã Tailwind CSS mẫu giúp xây dựng giao diện ứng dụng web sang trọng, tinh tế và tối giản phẳng theo ngôn ngữ thiết kế của Apple và triết lý **"Calm Productivity UI"**.

---

## I. TRIẾT LÝ THIẾT KẾ CỐT LÕI (Design Philosophy)

### 1. Sự Tôn Trọng Nội Dung (Deference / Zero Noise)
* Giao diện đóng vai trò làm nền để làm nổi bật nội dung. Loại bỏ hoàn toàn các dải màu Gradient sặc sỡ, lòe loẹt và các bóng đổ (shadow) lớn.
* Sử dụng màu phẳng (Flat Color), các đường viền mảnh (`zinc-200` / `border-zinc-200`) và khoảng giãn thoáng đãng để định hình không gian.

### 2. Mật Độ Thông Tin Chặt Chẽ (Density over Whitespace)
* Spacing nhỏ gọn (`p-1.5`, `p-2`, `gap-2`, `gap-3`) giúp thông tin được tổ chức chặt chẽ, tối ưu diện tích hiển thị của màn hình máy tính (Desktop App Feel).
* Cỡ chữ nhỏ gọn (90% nội dung sử dụng `text-xs` hoặc `text-sm`), font chữ sắc nét (Inter, Geist, Be Vietnam Pro) với độ dày vừa phải.

### 3. Tương Tác Chỉ Hiện Khi Hover (Reveal on Hover)
* Các nút điều khiển phụ (như nút Xóa, Chỉnh sửa, Icon hỗ trợ) được đặt ẩn mặc định (`opacity-0`) và chỉ hiện lên khi người dùng đưa con trỏ chuột vào vùng cha (`group-hover:opacity-100`). Điều này giảm thiểu tối đa sự nhiễu loạn thị giác.

### 4. Cảm Giác Ứng Dụng Desktop (Desktop App Feel)
* Sử dụng thuộc tính `select-none` và `cursor-default` trên các thành phần tương tác (như nút bấm, danh mục, thanh bên) thay vì dùng con trỏ tay chỉ `cursor-pointer`, tạo cảm giác như đang sử dụng một ứng dụng native thực thụ.

---

## II. HỆ THỐNG TOKENS THIẾT KẾ (Design Tokens)

### 1. Bảng Màu (Palette)
* **Background App**: `bg-white` (trắng tinh khiết) hoặc `bg-slate-50`/`bg-zinc-50` (xám nhạt dịu mắt).
* **Sidebar / Inspector**: `bg-zinc-50/50` hoặc `bg-slate-50/70`.
* **Border Color**: `zinc-200` (`#e4e4e7`) làm tiêu chuẩn phân cách.
* **Text Primary**: `zinc-900` (`#09090b`) cho tiêu đề chính.
* **Text Secondary**: `zinc-750` / `zinc-800` cho nội dung đọc.
* **Text Muted**: `zinc-500` / `zinc-400` cho nhãn phụ, ngày tháng, thông số.
* **Accent Color**: Sử dụng màu thương hiệu dưới dạng màu phẳng hoặc màu xám đậm `bg-zinc-800` / `hover:bg-zinc-700`. Không dùng hiệu ứng phản chiếu hay phát sáng (glow) bóng bẩy.

### 2. Bo Góc & Bóng Đổ (Border & Shadow)
* **Bo góc nhỏ gọn**: Sử dụng `rounded-sm` (2px) hoặc `rounded` (4px) cho các nút bấm, thẻ và ảnh lưới.
* **Shadow tối giản**: Chỉ dùng `shadow-sm` hoặc `shadow-[0_1px_2px_rgba(0,0,0,0.05)]`. Tránh tuyệt đối `shadow-lg`, `shadow-xl`.

---

## III. CẤU TRÚC GIAO DIỆN CHUẨN (UI Anatomy)

### 1. Bố Cục 2 Cột Mở (Open 2-Column Layout)
Bố cục macOS phẳng thông thoáng nhất là không sử dụng các khung viền bao quanh cứng ngắc. Thay vào đó, đặt Sidebar và Main view trực tiếp lên trang web và phân cách bằng khoảng giãn tự nhiên (`gap-10` hoặc `gap-12`).

```
┌──────────────────────────────────────────────────────────┐
│  Breadcrumb / Navigation (Quay lại...)                   │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│  SIDEBAR (Trái)        │  MAIN VIEW (Phải)               │
│  - Rộng 280px - 300px  │  - Flex-1                       │
│  - Category, Title     │  - Gallery Block (Lưới ảnh)     │
│  - CtaCard phẳng       │  - Divider (Kẻ ngang mỏng)      │
│  - Filters & Tags      │  - RichContent bài viết         │
│  - Related List        │                                 │
│                        │                                 │
└────────────────────────┴─────────────────────────────────┘
```

### 2. Widget CtaCard Phẳng (Flat Action Card)
Thẻ thực hiện hành động chính (Mua/Tải về) được tối giản hóa tối đa để tạo cảm giác chuyên nghiệp:
* Viền mảnh `border-zinc-200`, nền trắng, bo góc nhẹ `rounded-sm`.
* Nút hành động chính phẳng màu thương hiệu hoặc màu đen xám `bg-zinc-800 hover:bg-zinc-700` không shadow.

### 3. Danh Sách Liên Kết Kiểu Finder File List
Danh sách tệp tin liên quan hoặc các tài nguyên liên quan được tổ chức dạng dòng phẳng:
* Mỗi dòng có icon file text nhỏ đi kèm (`lucide-react/FileText`).
* Hiệu ứng hover đổi màu nền thành xám nhạt mỏng nhẹ (`hover:bg-zinc-50` / `hover:bg-zinc-100/50`).
* Chữ nhỏ `text-xs`, có cơ chế cắt ngắn text tự động `truncate`.

---

## IV. ĐOẠN MÃ MẪU TIÊU CHUẨN (Tailwind CSS Examples)

### 1. Bố cục 2 cột macOS phẳng (Responsive)
```tsx
<div className="mx-auto max-w-7xl px-4 py-8">
  {/* Navigation */}
  <div className="mb-6">
    <Link href="/resources" className="inline-flex items-center gap-1.5 text-xs text-zinc-550 hover:text-zinc-900 transition-colors font-semibold">
      <ArrowLeft size={12} /> Quay lại tất cả tài nguyên
    </Link>
  </div>

  {/* 2 Columns grid */}
  <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10">
    {/* Left Column (Sidebar) */}
    <aside className="space-y-6 shrink-0 lg:max-w-[300px]">
      {/* Category Tag */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-sm bg-zinc-100 text-zinc-650 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border border-zinc-200/60">
          AutoCAD
        </span>
      </div>

      {/* Main Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight tracking-tight">Thư viện AutoCAD 2D</h1>
        <p className="text-xs text-zinc-500 leading-relaxed font-normal">Mô tả ngắn gọn về tài nguyên...</p>
      </div>
      
      {/* CtaCard Phẳng ở dưới */}
    </aside>

    {/* Right Column (Main View) */}
    <section className="space-y-6">
      {/* Content & Gallery */}
    </section>
  </div>
</div>
```

### 2. Widget CtaCard phẳng hóa
```tsx
const CtaCard = () => (
  <div className="border border-zinc-200 bg-white p-4 rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    {/* Preview image */}
    <div className="mb-3 flex aspect-video items-center justify-center overflow-hidden bg-slate-100 rounded-sm">
      <img src="https://images.unsplash.com/photo-1503387762-592dedb802d7" alt="Preview" className="h-full w-full object-cover" />
    </div>
    
    {/* Pricing info */}
    <div className="space-y-0.5">
      <p className="text-[11px] text-zinc-400">Đăng nhập để tải</p>
      <p className="text-xl font-bold text-zinc-900">Miễn phí</p>
    </div>

    {/* Nút hành động phẳng */}
    <button
      type="button"
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-sm transition-all cursor-default select-none"
    >
      <Download size={14} />
      Tải tài nguyên
    </button>
  </div>
);
```

### 3. Custom Scrollbar mỏng kiểu macOS (globals.css)
```css
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d4d4d8;
}
```

---

## V. NHỮNG ĐIỀU TUYỆT ĐỐI NÊN TRÁNH (Anti-patterns)

* **KHÔNG** giả lập giao diện cửa sổ macOS thô cứng (như thêm nút traffic lights, dán nhãn "Finder" giả...) lên trang web nếu nó không thực sự được chạy trong Electron hoặc app dạng desktop. Điều này làm trang web chật chội và phản tác dụng.
* **KHÔNG** sử dụng các bóng đổ mờ lớn (`shadow-lg`, `shadow-2xl`) làm lệch cấu trúc phẳng.
* **KHÔNG** sử dụng padding và gap quá rộng (`p-8`, `p-12`, `gap-6` trên desktop) nếu muốn giữ độ cô đọng thông tin kiểu ứng dụng.
* **KHÔNG** sử dụng các màu Gradient cầu vồng chói lóa cho các khối tiêu đề hoặc banner.
