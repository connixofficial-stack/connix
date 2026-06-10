# Fix Gallery Lightbox Close Issue

## Root Cause
GalleryLightbox trong ComponentRenderer.tsx (site render) thiếu `onClick={onClose}` trên div chính, trong khi GalleryPreview.tsx (admin) có đầy đủ.

## Files cần fix

### 1. ComponentRenderer.tsx
**Vị trí**: GalleryLightbox component (khoảng dòng 1550-1650)
**Thay đổi**: Thêm `onClick={onClose}` vào div chính của GalleryLightbox

**Before**:
```tsx
return (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200"
  >
    <div className="absolute inset-0 bg-slate-950" onClick={onClose} />
```

**After**:
```tsx
return (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div className="absolute inset-0 bg-slate-950" onClick={onClose} />
```

### 2. Kiểm tra và fix các lightbox khác (nếu có)
- CertificateModal: Đã có đúng `onClick={onClose}` trên div chính
- Countdown popup style: Đã có `onClick={dismissPopup}` trên div chính

## Test verification
1. Click vào backdrop area của GalleryLightbox → phải đóng
2. Click vào X button → phải đóng  
3. Click vào navigation arrows → không đóng
4. Click vào image content → không đóng
5. ESC key → không đóng (theo yêu cầu user)

## Scope
- Fix tất cả lightbox trong hệ thống để đồng bộ
- Chỉ giữ X và backdrop click, không cần ESC key
- Áp dụng cho Gallery, CertificateModal, và các modal khác