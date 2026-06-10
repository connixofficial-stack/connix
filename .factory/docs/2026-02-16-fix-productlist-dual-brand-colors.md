## Kế hoạch sửa ProductListSection theo dual-brand-color-system

### Vấn đề hiện tại:
- Product-list component CHƯA tuân thủ dual-brand-color-system
- Giá sản phẩm, nút CTA, navigation đang dùng màu sai (secondary thay vì primary)

### Kế hoạch thực hiện:

#### 1. Cập nhật ProductListSection.tsx
- Đổi màu price từ `text-secondary` sang `text-primary`
- Đổi màu CTA button từ `bg-secondary` sang `bg-primary`
- Đổi màu navigation arrows từ `text-secondary` sang `text-primary`
- Giữ nguyên màu secondary cho: hover effects, background tints, subtle accents

#### 2. Cập nhật 6 layouts:
- **Minimal**: Sửa price và CTA
- **Commerce**: Sửa price và CTA  
- **Bento**: Sửa price (CTA đã đúng)
- **Carousel**: Sửa price và navigation
- **Compact**: Sửa price
- **Showcase**: Sửa price (CTA đã đúng)

#### 3. Đảm bảo color distribution 60-30-10:
- Primary: headings (30%), prices (15%), CTAs (10%), navigation (5%)
- Secondary: subtitles (5%), hover effects (3%), badges (2%)
- Neutral: backgrounds, borders, text-muted (60%)

#### 4. Test và verify:
- Kiểm tra tất cả 6 layouts trong admin preview
- Verify trang chủ render đúng màu
- Run TypeScript check: `bunx tsc --noEmit`
- Commit changes

### Files cần chỉnh sửa:
- `/app/home-components/product-list/_components/ProductListSection.tsx`
- `/app/home-components/product-list/_components/ProductListPreview.tsx` (nếu cần sync)

Thời gian dự kiến: 15-20 phút