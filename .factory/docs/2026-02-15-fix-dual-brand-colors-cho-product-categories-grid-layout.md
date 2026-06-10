# Kế hoạch Fix Dual-Brand Colors cho Product Categories Grid Layout

## Đánh giá vấn đề

Dựa trên **dual-brand-color-system skill**, tôi phát hiện **3 vấn đề chính** trong `renderGridStyle()`:

### 1. Vi phạm 60-30-10 Rule (Visual Weight)
- **Hiện tại**: Secondary được dùng cho border/shadow của **TẤT CẢ items** + "+N more" → visual weight ~30-40%
- **Tiêu chuẩn**: Accent chỉ nên 10% visual weight
- **Nguyên nhân**: Dùng `secondary` cho quá nhiều element có diện tích lớn

### 2. Thiếu Neutral Buffer Pattern
- **Hiện tại**: Border/shadow mặc định dùng `${secondary}10`, `${secondary}30` → tạo "halo effect" khắp nơi
- **Tiêu chuẩn**: Cần neutral (slate/gray) cho default state, chỉ dùng brand color cho accent/hover
- **Hậu quả**: Clash giữa primary/secondary, thiếu tầng neutral 60%

### 3. Contrast thấp trên ảnh (WCAG)
- **Hiện tại**: Text "12 sản phẩm" dùng `style={{ color: secondary }}` trực tiếp lên ảnh (không nền)
- **Vấn đề**: Ảnh sáng → secondary (thường pastel) → contrast ratio < 3:1 → fail WCAG AA
- **Cần**: Overlay gradient + đổi text về neutral/white

---

## Kế hoạch chi tiết (Step-by-step)

### Step 1: Refactor renderGridStyle() - Neutral Buffer Pattern

**File**: `app/admin/home-components/previews.tsx`  
**Vị trí**: Hàm `renderGridStyle()` (line ~9285-9350)

**Thay đổi**:

1. **Default border/shadow → Neutral**
   ```tsx
   // TỪ:
   style={{ 
     boxShadow: `0 2px 8px ${secondary}10`,
     border: `1px solid ${secondary}10`,
   }}
   
   // SANG:
   style={{ 
     boxShadow: '0 2px 8px rgb(226 232 240 / 0.5)', // slate-200/50
     border: '1px solid rgb(226 232 240)', // slate-200
   }}
   ```

2. **Hover → Primary (không dùng secondary)**
   ```tsx
   // GIỮ NGUYÊN onMouseEnter nhưng chỉ dùng brandColor:
   onMouseEnter={(e) => {
     e.currentTarget.style.boxShadow = `0 8px 24px ${brandColor}25`;
     e.currentTarget.style.borderColor = brandColor;
     e.currentTarget.style.transform = 'translateY(-4px)';
   }}
   // onMouseLeave cũng reset về neutral
   ```

3. **"+N more" card → Secondary accent nhẹ**
   ```tsx
   // TỪ:
   style={{ backgroundColor: `${secondary}08`, border: `2px dashed ${secondary}30` }}
   
   // SANG: giảm saturation
   style={{ backgroundColor: `${secondary}05`, border: `2px dashed ${secondary}20` }}
   ```
   → Icon Plus vẫn dùng secondary nhưng giảm opacity

---

### Step 2: Tăng contrast cho text count - WCAG AA

**File**: `app/admin/home-components/previews.tsx`  
**Vị trí**: Bên trong grid item card (line ~9325-9333)

**Thay đổi**:

1. **Thêm gradient overlay để tăng contrast**
   ```tsx
   // Sau {renderCategoryVisual(cat, 'lg')}
   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" 
        style={{ height: '60%' }} 
   />
   
   <div className={cn("absolute bottom-0 left-0 right-0 text-white z-10", isMobile ? 'p-3' : 'p-4')}>
     {/* nội dung text */}
   </div>
   ```

2. **Đổi text count về neutral trắng**
   ```tsx
   // TỪ:
   <p className="text-xs opacity-80 mt-0.5" style={{ color: secondary }}>12 sản phẩm</p>
   
   // SANG:
   <p className="text-xs text-white/90 mt-0.5">12 sản phẩm</p>
   ```
   → Lý do: trắng trên nền đen gradient → contrast 18:1 > WCAG AAA

---

### Step 3: Điều chỉnh Empty State - Vai trò secondary

**File**: `app/admin/home-components/previews.tsx`  
**Vị trí**: Hàm `renderEmptyState()` (line ~9265-9275)

**Giữ nguyên** (đã đúng):
- Background icon: `${secondary}10` (accent nhẹ, đúng 10% rule)
- Icon color: `secondary` (điểm nhấn duy nhất)

---

### Step 4: Validate toàn bộ Grid Layout theo checklist

**Checklist (theo skill)**:

- [ ] **60-30-10 Rule**:
  - Neutral (slate) ~60%: default border/shadow/spacing
  - Primary ~30%: hover effect (chỉ khi tương tác)
  - Secondary ~10%: "+N" card + empty state icon
  
- [ ] **Neutral Buffer Pattern**:
  - Mọi default state dùng slate/gray
  - Brand color chỉ xuất hiện khi hover/focus hoặc accent < 10%

- [ ] **WCAG Contrast**:
  - Text count trên ảnh: white on dark gradient → 18:1 ✓
  - Border default: slate-200 → không ảnh hưởng text
  
- [ ] **Semantic Tokens** (optional, không cần refactor ngay):
  - Hiện tại: `secondary`, `brandColor` props
  - Sau này: có thể tách semantic tokens (không ưu tiên trong spec này)

---

## Tóm tắt thay đổi

| Element | Trước (vi phạm) | Sau (fix) | Lý do |
|---------|----------------|-----------|-------|
| Grid item border default | `${secondary}10` | `slate-200` | Neutral buffer, giảm visual weight secondary |
| Grid item shadow default | `${secondary}10` | `slate-200/50` | Neutral buffer |
| Grid item hover border | `brandColor` | `brandColor` | ✓ Đúng (primary role) |
| Text "12 sản phẩm" | `color: secondary` trên ảnh | `text-white/90` + gradient overlay | WCAG contrast + không clash với ảnh |
| "+N more" border | `${secondary}30` dashed | `${secondary}20` dashed | Giảm saturation, giữ vai trò accent nhẹ |
| "+N more" bg | `${secondary}08` | `${secondary}05` | Giảm visual weight |

---

## Output

Sau khi implement:
- **60% neutral** (slate borders/shadows default)
- **30% primary** (brandColor hover)
- **10% secondary** ("+N" card accent + empty state)
- **WCAG AA** pass (text count contrast ≥ 4.5:1)
- **Không clash** giữa màu ảnh và text

File cần edit: `app/admin/home-components/previews.tsx` (chỉ hàm `renderGridStyle()` và `renderEmptyState()` nếu cần).