# Patterns — Home Component Parity Guard

## 1. Preview shell chuẩn

### Đúng
- `PreviewWrapper + BrowserFrame`
- Device chỉ điều khiển responsive/content density
- Không thêm phone notch/ring/frame nếu không có evidence rõ

### Sai
- Mỗi component tự chế shell riêng
- Preview mobile giả lập điện thoại nặng tay
- Preview desktop fix bằng width hack nhiều vòng mà không audit container thật

## 2. Preview ↔ Site shared section

### Đúng
- Preview và site cùng dùng `*SectionShared`
- Override riêng chỉ áp cho `context === 'preview'`

### Sai
- Preview copy-paste layout riêng khỏi site rồi drift dần
- Site sửa mà preview không theo

## 3. Style mapping 1-1

### Đúng
- `layout1` ↔ `layout1`
- `cards` ↔ `cards`
- label chỉ là text hiển thị, key runtime phải ổn định

### Sai
- Preview button “Layout 4” nhưng runtime lại render style khác
- Alias âm thầm kiểu “magazine” -> “layout4” mà không normalize rõ

## 4. Fallback style

### Đúng
```tsx
if (style === 'layout1') { return <Layout1 />; }
if (style === 'layout2') { return <Layout2 />; }
return <DefaultLayout />;
```

### Sai
```tsx
if (style === 'layout1') { return <Layout1 />; }
return <DefaultLayout />;
if (style === 'layout2') { return <Layout2 />; }
```

## 5. Breakpoint / container query

### Đúng
- Xác định rõ breakpoint đo theo viewport hay container
- Audit node gắn `@container`
- Nếu preview là môi trường khác site, override preview có khóa context

### Sai
- Chỉ tăng `min-width` ngẫu nhiên ở node con
- Không biết node nào quyết định `grid-cols-2` hay `grid-cols-3`

## 6. Button trong preview

### Đúng
```tsx
<button type="button" onClick={...}>Next</button>
```

### Sai
```tsx
<button onClick={...}>Next</button>
```

## 7. Config contract

### Đúng
- Create submit, Edit load/save, Renderer read cùng một shape
- Style-specific field là optional config field rõ ràng

### Sai
- Preview đọc field chưa save
- Renderer hardcode text khác config

## 8. Empty state / image fallback

### Đúng
- Có fallback khi thiếu ảnh
- Có empty state khi thiếu item
- Long text có clamp

### Sai
- Preview chỉ đẹp khi data hoàn hảo
- Thiếu ảnh là vỡ layout

## 9. Khi cần override preview

Chỉ override preview nếu có một trong các lý do:
- preview shell là môi trường khác runtime,
- browser frame làm lệch breakpoint,
- preview cần tắt interaction runtime,
- mock data cần limit khác runtime.

Mọi override phải:
- nhỏ,
- có evidence,
- khóa bằng context/device,
- không làm đổi site runtime.
