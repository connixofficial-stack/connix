## Kết quả Research

**Nguồn logo chính thức nhất** (từ cổng `online.gov.vn` của chính phủ):
- Logo xanh "Đã thông báo": `http://online.gov.vn/Content/EndUser/LogoCCDVSaleNoti/logoSaleNoti.png`
- Logo đỏ "Đã đăng ký": `http://online.gov.vn/Content/EndUser/LogoCCDVSaleNoti/logoCCDV.png`

Đây là nguồn gốc chính phủ, chất lượng chuẩn, dùng làm fallback tốt. Tuy nhiên, để tránh phụ thuộc external URL và đảm bảo tải nhanh, **tải về project** là best practice.

---

## Phân tích codebase hiện tại

### Type hiện tại (`_types/index.ts`)
```ts
export interface FooterConfig {
  columns, copyright, description, logo, showSocialLinks,
  useOriginalSocialIconColors, socialLinks, style
}
```

### Cần thêm vào `FooterConfig`:
```ts
showBctLogo?: boolean;       // bật/tắt logo BCT
bctLogoType?: 'thong-bao' | 'dang-ky';  // loại logo
bctLogoLink?: string;        // link BCT cá nhân hoá (vd: https://online.gov.vn/...)
```

---

## Kế hoạch triển khai

### Bước 1: Tải logo về project
Tải 2 file PNG về `public/images/bct/`:
- `logo-da-thong-bao-bct.png` (logo xanh từ online.gov.vn)
- `logo-da-dang-ky-bct.png` (logo đỏ từ online.gov.vn)

### Bước 2: Cập nhật `_types/index.ts`
Thêm 3 field vào `FooterConfig`:
```ts
showBctLogo?: boolean;
bctLogoType?: 'thong-bao' | 'dang-ky';
bctLogoLink?: string;
```

### Bước 3: Cập nhật `_lib/constants.ts`
Thêm default values vào `DEFAULT_FOOTER_CONFIG`:
```ts
showBctLogo: false,
bctLogoType: 'thong-bao',
bctLogoLink: '',
```
Cập nhật `normalizeFooterConfig` để normalize 3 field mới.

### Bước 4: Cập nhật `FooterForm.tsx`
Thêm section "Bộ Công Thương" vào form với:
- Checkbox bật/tắt hiển thị logo BCT
- (Khi bật) Radio/Select chọn loại: "Đã thông báo" (xanh) vs "Đã đăng ký" (đỏ) — hiển thị preview mini logo
- (Khi bật) Input text cho link BCT cá nhân (placeholder: `https://online.gov.vn/Home/WebSiteDisplay/...`)

### Bước 5: Cập nhật `FooterPreview.tsx`
Thêm render logo BCT vào **tất cả 6 layout** (`classic`, `modern`, `corporate`, `minimal`, `centered`, `stacked`):
- Vị trí: vùng copyright / bottom bar của mỗi layout
- Render: `<img>` nhỏ (height ~32-40px) wrapped trong `<a href={bctLogoLink} target="_blank">`
- Nếu `bctLogoLink` rỗng thì không wrap `<a>` (chỉ hiển thị ảnh)
- Logic chọn ảnh:
  ```ts
  const bctSrc = config.bctLogoType === 'dang-ky'
    ? '/images/bct/logo-da-dang-ky-bct.png'
    : '/images/bct/logo-da-thong-bao-bct.png';
  ```

### Bước 6: TypeScript check
```bash
bunx tsc --noEmit
```

### Bước 7: Git commit

---

## Checklist

- [ ] Tải 2 ảnh PNG từ online.gov.vn về `public/images/bct/`
- [ ] Thêm 3 field vào `FooterConfig` type
- [ ] Cập nhật default + normalize trong constants.ts
- [ ] Thêm UI section BCT vào FooterForm
- [ ] Render logo BCT trong cả 6 layout preview
- [ ] TypeScript pass clean
- [ ] Commit

## Lưu ý
- Logo chỉ hiển thị ở Preview và site thực — **không** hardcode logo vào form preview bên trái
- Không yêu cầu user upload logo BCT — chọn type là đủ, ảnh lấy từ public/
- Link BCT là optional: nếu rỗng thì không có `href`
