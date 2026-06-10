## Fix Plan: Hero Fade Layout Color Issue

### Root Cause
`renderPlaceholder()` function trong HeroPreview.tsx đang dùng gradient cố định `from-slate-800 to-slate-900` làm background, override lại `backgroundColor` được truyền vào. Điều này làm màu primary (xanh lá) không hiển thị trong layout "Fade".

### Changes Required

#### 1. Fix `renderPlaceholder()` function (HeroPreview.tsx)
**Lines ~100-120**
- Thay đổi: Remove gradient background `from-slate-800 to-slate-900`
- Sử dụng: `backgroundColor` được truyền vào
- Giữ: Icon color và text content

#### 2. Verify thumbnail placeholder in Fade layout
**Line ~177**
- Currently correctly uses: `backgroundColor: fadeColors.placeholderBg`
- No change needed

#### 3. Test affected layouts
- Fade: ✅ Will show primary tint background
- Fullscreen: ✅ Will show primary tint background  
- Parallax: ✅ Will show primary tint background
- Slider: ✅ Already works (uses different pattern)

### Files to modify
1. `app/admin/home-components/hero/_components/HeroPreview.tsx`

### Expected outcome
- Fade layout sẽ hiển thị màu primary (xanh lá) đúng như thiết kế
- Tất cả placeholder backgrounds sẽ respect color scheme
- Icon colors sẽ maintain contrast properly