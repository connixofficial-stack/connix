# 📋 SPEC: Logo Wizard Enhancement - Site Logo + Partners Auto-Split

## 🎯 Executive Summary

**Problem:**
- User chọn logo trong wizard seed nhưng KHÔNG xuất hiện ở `/admin/settings`
- Logo hiện tại chỉ lưu vào `homeComponents.config.logos[]` (partners section)
- Thiếu logic set `site_logo` trong settings table

**Solution:**
1. **Logo đầu tiên** user chọn → lưu vào `settings.site_logo` (logo website chính)
2. **Logos còn lại** trong pool → random 6-8 logos làm partners
3. UI wizard cập nhật: hiển thị rõ "Logo này sẽ làm logo website"
4. Settings page vẫn cho phép user upload thay đổi sau

**User Requirements:**
- Chọn 1 logo làm site_logo, còn lại tự động làm partners ✅
- Partners max 6-8 logos (không lấy hết) ✅
- User có thể upload logo khác ở /admin/settings sau khi seed ✅

---

## 🔬 DARE Framework Analysis

### 1. DECOMPOSE - Problem Graph

```
[ROOT] Logo wizard không set site_logo
│
├── [A] UI/UX Update
│   ├── [A.1] LogoSelectionStep: Label rõ "Logo website"
│   ├── [A.2] ReviewStep: Hiển thị site_logo preview
│   └── [A.3] Help text: "Logo này dùng cho header/footer"
│
├── [B] Backend Logic (ROOT CAUSE)
│   ├── [B.1] 🚨 homepage.seeder CHỈ set homeComponents.config.logos
│   │   ├── [B.1.1] MISSING: settings.site_logo không được set
│   │   └── [B.1.2] FIX: Thêm logic insert/update settings.site_logo
│   │
│   ├── [B.2] Partners logos selection
│   │   ├── [B.2.1] Filter: Exclude selectedLogo khỏi pool
│   │   ├── [B.2.2] Random pick 6-8 logos từ remaining
│   │   └── [B.2.3] Set homeComponents.config.logos = partners
│   │
│   └── [B.3] Settings seeder coordination
│       ├── [B.3.1] settings.seeder đã set site_logo = ""
│       ├── [B.3.2] homepage.seeder phải UPDATE site_logo
│       └── [B.3.3] Seed order: settings → homepage (OK)
│
└── [C] Edge Cases
    ├── [C.1] Industry không có logos → site_logo = "", partners = []
    ├── [C.2] Industry có 1-7 logos → site_logo = selected, partners = còn lại
    ├── [C.3] useSeedMauImages = false → site_logo = "", partners = []
    └── [C.4] User upload logo mới ở settings → KHÔNG ảnh hưởng partners
```

### 2. ANALYZE - Root Cause Deep Dive

#### **ROOT CAUSE: homepage.seeder không set site_logo**

**File:** `convex/seeders/homepage.seeder.ts:100-115`

**Current Code:**
```typescript
const { selectedLogo, useSeedMauImages } = this.config;
const randomLogo = useSeedMauImages && template.assets.logos.length > 0
  ? (selectedLogo ?? pickRandom(template.assets.logos))
  : undefined;

// ❌ PROBLEM: Chỉ set vào homeComponents
if (Array.isArray(config.logos) && randomLogo) {
  config.logos = [randomLogo];
}
```

**Why Bug:**
- `randomLogo` chỉ lưu vào `homeComponents.config.logos` (partners)
- `settings.site_logo` vẫn là `""` (default từ settings.seeder)
- User mở `/admin/settings` → không thấy logo

**Expected Flow:**
```
Wizard selectedLogo → 2 destinations:
  1. settings.site_logo (website logo)
  2. homeComponents partners (exclude selectedLogo, pick 6-8 random)
```

---

### 3. REFLECT - Design Decisions

#### **Q1: Nên update settings trong homepage.seeder hay tách riêng?**

**Option A:** Update trong `homepage.seeder.seedComponents()`
- ✅ Pros: Tất cả logic logo ở 1 chỗ
- ✅ Cons: homepage phụ thuộc settings table (coupling)

**Option B:** Tạo mutation riêng `settings.updateLogo()`
- ✅ Pros: Separation of concerns
- ❌ Cons: Thêm 1 mutation call (phức tạp hơn)

**Decision:** **Option A** - Update trực tiếp trong homepage.seeder
- Settings table đơn giản (key-value)
- Seed order đảm bảo: settings → homepage
- Ít code hơn, logic tập trung

---

#### **Q2: Partners logos: Có nên exclude site_logo không?**

**Yêu cầu user:** Chọn 1 logo làm site, còn lại làm partners

**Logic:**
```typescript
const partnersPool = template.assets.logos.filter(logo => logo !== selectedLogo);
const partnersLogos = pickMany(partnersPool, Math.min(8, partnersPool.length));
```

**Edge case:** Nếu industry chỉ có 1 logo?
- site_logo = logo đó
- partners = [] (empty, không duplicate)

---

#### **Q3: Hardcode 6-8 hay configurable?**

**Decision:** Hardcode 8 (simple)
- User requirement: "tối đa 6-8"
- Không cần UI config thêm
- Code đơn giản: `Math.min(8, partnersPool.length)`

---

### 4. EXECUTE - Implementation Plan

## 📐 Detailed Implementation Steps

### **STEP 1: Update LogoSelectionStep UI**

**File:** `components/data/seed-wizard/steps/LogoSelectionStep.tsx`

**Change:** Line 67 - Update heading + help text

```typescript
<div>
  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
    Chọn logo website {/* ✅ CHANGED: Thêm "website" */}
  </h3>
  <p className="text-xs text-slate-500">
    {/* ✅ CHANGED: Text rõ ràng hơn */}
    Logo này sẽ hiển thị ở header, footer và làm logo chính của website. 
    Các logo còn lại sẽ tự động thành logo đối tác.
  </p>
</div>
```

**Impact:**
- User hiểu rõ logo chọn = logo chính
- Không cần thay đổi logic component (chỉ text)

---

### **STEP 2: Update ReviewStep Preview**

**File:** `components/data/seed-wizard/steps/ReviewStep.tsx`

**Change:** Add logo preview section

```typescript
{/* ✅ NEW: Logo preview section */}
{state.selectedLogo && (
  <div className="border-t pt-4">
    <h4 className="text-sm font-semibold mb-2">Logo website</h4>
    <div className="flex items-center gap-3 text-xs">
      <img 
        src={state.selectedLogo} 
        alt="Logo" 
        className="h-10 object-contain border rounded px-2 bg-white"
      />
      <div>
        <p className="font-medium text-slate-900">
          Logo chính
        </p>
        <p className="text-slate-500">
          Sẽ hiển thị ở header/footer và settings
        </p>
      </div>
    </div>
    <p className="text-xs text-slate-400 mt-2">
      + Tự động chọn 6-8 logos khác làm đối tác
    </p>
  </div>
)}
```

**Impact:**
- User xác nhận lại logo trước khi seed
- Hiểu rõ logos đối tác được chọn tự động

---

### **STEP 3: Update homepage.seeder - Set site_logo**

**File:** `convex/seeders/homepage.seeder.ts`

**Change 1:** Line 100 - Add setSiteLogo logic

```typescript
private async seedComponents(): Promise<number> {
  const existing = await this.ctx.db.query('homeComponents').first();
  if (existing) return 0;

  const template = getIndustryTemplate(this.config.industryKey);
  if (template) {
    // ... existing code ...
    
    const { selectedLogo, useSeedMauImages } = this.config;
    
    // ✅ NEW: Set site_logo in settings
    if (selectedLogo && useSeedMauImages) {
      await this.setSiteLogo(selectedLogo);
    }
    
    // ✅ CHANGED: Partners logos (exclude site_logo)
    const partnersPool = template.assets.logos.filter(
      logo => logo !== selectedLogo
    );
    const partnersCount = Math.min(8, partnersPool.length);
    const partnersLogos = this.pickMany(partnersPool, partnersCount);
    
    const components = template.homeComponents.map((component) => {
      const config = { ...component.config } as Record<string, unknown>;
      
      // ... existing hero/products/gallery logic ...
      
      // ✅ CHANGED: Use partnersLogos instead of single logo
      if (Array.isArray(config.logos) && partnersLogos.length > 0) {
        config.logos = partnersLogos;
      }
      
      // ... rest of mapping
    });
    
    // ... insert components
  }
  
  // ... fallback logic
}
```

**Change 2:** Add helper methods

```typescript
// ✅ NEW: Helper to set site_logo in settings
private async setSiteLogo(logoPath: string): Promise<void> {
  // Find existing site_logo setting
  const existing = await this.ctx.db
    .query('settings')
    .withIndex('by_key', q => q.eq('key', 'site_logo'))
    .first();
  
  if (existing) {
    // Update existing
    await this.ctx.db.patch(existing._id, { value: logoPath });
  } else {
    // Insert new (fallback, should not happen)
    await this.ctx.db.insert('settings', {
      key: 'site_logo',
      value: logoPath,
      group: 'site',
    });
  }
  
  console.log(`[homepage.seeder] Set site_logo: ${logoPath}`);
}

// ✅ NEW: pickMany helper (already exists as pickMany in seedComponents)
// Move to class method for reuse
private pickMany<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  
  const pool = [...items];
  const picked: T[] = [];
  
  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  
  return picked;
}
```

**Impact:**
- `site_logo` settings được set = selectedLogo
- Partners section có 6-8 logos (exclude site_logo)
- Console log để debug

---

### **STEP 4: Handle Edge Cases**

**Edge Case 1: useSeedMauImages = false**

```typescript
// Already handled by existing code
if (!useSeedMauImages) {
  // site_logo remains "" (default)
  // partners = []
}
```

**Edge Case 2: Industry không có logos**

```typescript
if (!template || template.assets.logos.length === 0) {
  // site_logo remains ""
  // partners = []
  // UI already shows warning
}
```

**Edge Case 3: Industry có 1 logo duy nhất**

```typescript
const partnersPool = logos.filter(logo => logo !== selectedLogo);
// partnersPool.length = 0
const partnersLogos = pickMany(partnersPool, 8);
// partnersLogos = [] (empty)

// Result:
// - site_logo = selected logo ✅
// - partners = [] ✅
```

**Edge Case 4: User không customize (random logo)**

```typescript
// LogoSelectionStep default behavior:
// - selectedLogo = random logo from pool
// - logoCustomized = false

// Backend:
// - site_logo = random logo ✅
// - partners = 7 logos khác (exclude random) ✅
```

---

## 📋 Testing Checklist

### **UI/UX Tests**

- [ ] LogoSelectionStep title = "Chọn logo website"
- [ ] Help text mention "header, footer, logo chính"
- [ ] Help text mention "logos còn lại → đối tác"
- [ ] ReviewStep preview hiển thị:
  - [ ] Logo image (h-10)
  - [ ] Label "Logo chính"
  - [ ] Text "Sẽ hiển thị ở header/footer và settings"
  - [ ] Text "Tự động chọn 6-8 logos khác làm đối tác"

### **Backend Tests**

- [ ] **Case 1: Industry có 30 logos, user chọn logo #5**
  - [ ] `settings.site_logo` = path logo #5
  - [ ] `homeComponents.partners.config.logos` = array 8 logos (KHÔNG chứa #5)
  - [ ] Partners logos random (không phải 8 logos đầu)

- [ ] **Case 2: Industry có 5 logos, user chọn logo #2**
  - [ ] `settings.site_logo` = path logo #2
  - [ ] Partners = 4 logos còn lại (exclude #2)

- [ ] **Case 3: Industry có 1 logo duy nhất**
  - [ ] `settings.site_logo` = logo đó
  - [ ] Partners = [] (empty array)

- [ ] **Case 4: useSeedMauImages = false**
  - [ ] `settings.site_logo` = ""
  - [ ] Partners = []

- [ ] **Case 5: User random logo (không customize)**
  - [ ] `settings.site_logo` = random logo
  - [ ] Partners = 6-8 logos (exclude site_logo)

### **Integration Tests**

- [ ] Seed flow: settings → homepage → OK
- [ ] Mở `/admin/settings` → tab "Chung" → field "Logo" có preview
- [ ] Logo URL = selectedLogo path
- [ ] User upload logo mới ở settings → update OK
- [ ] Re-seed (force = true) → logo thay đổi, partners cũng đổi

---

## 📊 Files Summary

### **UPDATED FILES (3):**

1. `components/data/seed-wizard/steps/LogoSelectionStep.tsx`
   - Update heading: "Chọn logo website"
   - Update help text: Giải thích site_logo + partners

2. `components/data/seed-wizard/steps/ReviewStep.tsx`
   - Add logo preview section
   - Show site_logo image + label
   - Show partners auto-select info

3. `convex/seeders/homepage.seeder.ts`
   - Add `setSiteLogo()` method
   - Update `seedComponents()`: call setSiteLogo
   - Update partners logic: filter exclude selectedLogo, pick max 8
   - Add `pickMany()` class method

**Total:** 3 files updated (no new files)

---

## 🎯 Success Criteria

- [ ] ✅ User chọn logo trong wizard → xuất hiện ở `/admin/settings` tab "Chung"
- [ ] ✅ Partners section có 6-8 logos (không trùng site_logo)
- [ ] ✅ UI/UX rõ ràng: "Logo website" vs "Đối tác"
- [ ] ✅ Edge cases handle OK (0-1-many logos)
- [ ] ✅ User có thể upload logo khác ở settings sau khi seed

---

## ⏱️ Estimated Time

- **Step 1-2 (UI):** 15 phút
- **Step 3 (Backend):** 30 phút
- **Step 4 (Edge cases + testing):** 20 phút

**Total:** ~65 phút (1 giờ)

---

## 🚀 Migration Notes

- **Backward compatible:** Settings table đã có `site_logo` field
- **No breaking changes:** Existing seeds vẫn chạy OK (site_logo = "")
- **User action required:** Re-seed để có site_logo tự động

---

**END OF SPEC**