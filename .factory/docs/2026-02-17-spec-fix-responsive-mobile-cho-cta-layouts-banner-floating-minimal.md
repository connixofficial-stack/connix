# Spec: Fix Responsive Mobile cho CTA Layouts (Banner, Floating, Minimal)

## Root Causes
1. **Banner**: Buttons stack thiếu gap, `w-full` không cần thiết ở desktop
2. **Floating**: Padding card quá nhỏ ở mobile (16px), buttons thiếu spacing
3. **Minimal**: Accent line bị ẩn hoàn toàn ở mobile, buttons stack không tối ưu

## Implementation Plan

### File: `app/admin/home-components/cta/_components/CTASectionShared.tsx`

#### 1. Banner Layout (line 89-104)
**Thay đổi**:
```tsx
// OLD: line 101-103
<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

// NEW:
<div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3">
```
**Lý do**: Tăng gap từ `gap-3` → `gap-4` ở mobile, reset về `gap-3` ở desktop

#### 2. Floating Layout (line 152-180)
**Thay đổi**:
```tsx
// OLD: line 158-160
<div
  className="rounded-xl border p-4 sm:p-6 md:p-8"

// NEW:
<div
  className="rounded-xl border p-5 sm:p-6 md:p-8"

// OLD: line 173-175
<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

// NEW:
<div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3">
```
**Lý do**: 
- Tăng padding mobile từ `p-4` (16px) → `p-5` (20px) để có breathing room
- Tăng gap buttons mobile từ `gap-3` → `gap-4`

#### 3. Minimal Layout (line 217-247)
**Thay đổi**:
```tsx
// OLD: line 232-233
<div className="hidden h-12 w-1 rounded-full sm:h-14 md:block" style={{ backgroundColor: tokens.accentLine }} />

// NEW:
<div className="block h-8 w-1 rounded-full sm:h-12 md:h-14" style={{ backgroundColor: tokens.accentLine }} />

// OLD: line 242-244
<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

// NEW:
<div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-3">
```
**Lý do**:
- Hiển thị accent line ở mobile: `hidden md:block` → `block`
- Mobile: `h-8 w-1`, Small: `h-12`, Desktop: `h-14`
- Tăng gap buttons mobile từ `gap-3` → `gap-4`

## Expected Outcome
- ✅ Banner: Buttons stack có spacing đủ lớn ở mobile
- ✅ Floating: Card có padding thoải mái hơn ở mobile, buttons có spacing tốt
- ✅ Minimal: Accent line hiển thị ở mọi breakpoint, buttons stack tối ưu

## Testing
1. Test ở mobile preview (< 640px): Kiểm tra gap buttons, padding card
2. Test ở tablet (640-768px): Kiểm tra transition sang flex-row
3. Test ở desktop (> 768px): Đảm bảo không ảnh hưởng layout hiện tại