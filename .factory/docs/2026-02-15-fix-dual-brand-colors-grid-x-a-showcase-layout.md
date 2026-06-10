# Spec: Fix Dual-Brand Colors cho Grid Layout + Xóa Showcase Layout

## Executive Summary
**Mục tiêu**: 
1. Xóa hoàn toàn showcase layout khỏi ProductCategories component
2. Fix màu phụ (secondary) trong grid layout theo đúng quy tắc 60-30-10

**File ảnh hưởng**: 
- `app/admin/home-components/previews.tsx` (~13946 lines)

**Estimate**: ~10 phút (2 bugs đơn giản + cleanup showcase)

---

## Problem Analysis (DARE Framework)

### Root Cause (từ spec + commit b4823a9)
**Quy tắc 60-30-10**:
- **Primary (30%)**: Hover interactions (border, shadow), CTAs, icon containers → `brandColor`
- **Secondary (10%)**: Badges, stats, **product counts**, accent text → `secondary`
- **Neutral (60%)**: Backgrounds, main text

**Bug trong grid layout**:
1. **Line 9329** - Product count text: đang dùng `brandColor` → **phải `secondary`** (vì là accent text như stats)

**Showcase layout**: Cần xóa hoàn toàn vì user yêu cầu "bỏ luôn cái layout showcase đi"

---

## Execution Steps

### Step 1: Fix product count color trong grid layout

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line 9329 (trong renderGridStyle function)

**Current**:
```tsx
<p className="text-xs opacity-80 mt-0.5" style={{ color: brandColor }}>12 sản phẩm</p>
```

**Change to**:
```tsx
<p className="text-xs opacity-80 mt-0.5" style={{ color: secondary }}>12 sản phẩm</p>
```

**Reasoning**: Product count là accent text (10% rule), giống như stats values → dùng `secondary`

---

### Step 2: Xóa showcase layout type definition

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line ~9134

**Current**:
```tsx
export type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'showcase' | 'marquee' | 'circular';
```

**Change to**:
```tsx
export type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'marquee' | 'circular';
```

---

### Step 3: Xóa showcase option khỏi styleOptions array

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line ~9177

**Current** (có showcase option):
```tsx
{ id: 'showcase', label: 'Showcase' },
```

**Action**: Xóa dòng này khỏi styleOptions array

---

### Step 4: Xóa renderShowcaseStyle function

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Lines 9508-9588

**Action**: Xóa toàn bộ function từ:
```tsx
// Style 5: Showcase - Featured first item + grid of smaller items
const renderShowcaseStyle = () => {
  ...
};
```

---

### Step 5: Xóa showcase conditional render

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line ~9855

**Current**:
```tsx
{previewStyle === 'showcase' && renderShowcaseStyle()}
```

**Action**: Xóa dòng này

---

### Step 6: Xóa showcase image size hint

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line ~9833

**Current** (trong imageSizeByStyle object):
```tsx
showcase: `${count} danh mục • Featured: 600×800px (3:4) • Others: 400×300px (4:3)`,
```

**Action**: Xóa dòng này

---

### Step 7: Xóa showcase user guide hint (nếu có)

**File**: `app/admin/home-components/previews.tsx`  
**Location**: Line ~9878

**Current**:
```tsx
{previewStyle === 'showcase' && (
  ...
)}
```

**Action**: Xóa block này nếu tồn tại

---

### Step 8: Validate TypeScript

**Command**:
```bash
bunx oxlint --type-aware --type-check --fix
```

**Expected**: Zero errors, zero warnings

---

## Success Criteria

1. ✅ Product count text trong grid layout dùng `secondary` color
2. ✅ Showcase layout hoàn toàn bị xóa (type, option, function, render)
3. ✅ TypeScript compile pass (zero errors)
4. ✅ Không còn reference nào đến 'showcase' trong ProductCategories

---

## Changes Summary

**File**: `app/admin/home-components/previews.tsx`

1. **Line 9329**: Fix product count color từ `brandColor` → `secondary`
2. **Line ~9134**: Remove `'showcase'` từ ProductCategoriesStyle type
3. **Line ~9177**: Remove showcase option từ styleOptions array
4. **Lines 9508-9588**: Remove toàn bộ renderShowcaseStyle() function
5. **Line ~9833**: Remove showcase key từ imageSizeByStyle object
6. **Line ~9855**: Remove showcase conditional render
7. **Line ~9878**: Remove showcase user guide hint (if exists)

**Total changes**: 7 locations, 1 file

---

## Risk Mitigation

- ✅ Backup: Current commit có thể rollback nếu cần
- ✅ Simple changes: Chỉ fix 1 color value + xóa unused code
- ✅ TypeScript validation: Sẽ catch mọi breaking reference
- ✅ No visual testing needed: User chọn "chỉ TypeScript compile"

---

**Ready to implement!** 🚀