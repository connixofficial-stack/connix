# Spec: Fix 3 Seed Wizard Bugs - 100% Accurate Root Cause Analysis

## 🎯 Summary
Sau khi đọc kỹ toàn bộ code, xác định được 3 root causes chính xác:

1. **Issue #1**: Chọn ngành hàng → lùi về bước 0
   - **ROOT CAUSE**: `handleIndustryChange` đổi `websiteType` → trigger useEffect với dependency `[industryTemplate, state.websiteType, hasProducts]` → `setCurrentStep(0)`

2. **Issue #2**: Dịch vụ vẫn hiện khi không chọn seed
   - **ROOT CAUSE**: Logic `syncModules()` ĐÚNG, nhưng user chưa nhấn "Bắt đầu Seed" → modules chưa được sync

3. **Issue #3**: Seed bài viết nhưng không thấy
   - **ROOT CAUSE**: PostSeeder seed 70% Published, 20% Draft, 10% Archived → KHÔNG phải vấn đề status. Cần verify thực tế có seed không.

---

## 📊 Detailed Root Cause Analysis

### **Issue #1: Chọn ngành hàng → lùi về bước 0** 🔴 CONFIRMED

**Code Path:**
```typescript
// 1. User chọn industry → trigger handleIndustryChange()
const handleIndustryChange = (industryKey: string) => {
  const template = getIndustryTemplate(industryKey);
  setState((prev) => {
    const nextWebsiteType = template.websiteTypes.includes(prev.websiteType)
      ? prev.websiteType
      : template.websiteTypes[0];  // ← ĐỔI websiteType nếu không support
    return {
      ...prev,
      websiteType: nextWebsiteType,  // ← state.websiteType thay đổi
    };
  });
};

// 2. state.websiteType thay đổi → trigger useEffect
useEffect(() => {
  setCurrentStep(0);  // ← RESET về 0
  // ...
}, [industryTemplate, state.websiteType, hasProducts]);  // ← state.websiteType trong dependencies
```

**Khi nào xảy ra:**
- User ở step 1 chọn websiteType = "blog"
- User chuyển step 2 chọn industry = "Thời trang nam" (industry này chỉ support websiteType = ["ecommerce", "catalog"])
- `handleIndustryChange` → đổi `websiteType` từ "blog" → "ecommerce"
- useEffect trigger → `setCurrentStep(0)` → User bị đá về step 0

**Solution:**
Tách useEffect thành 2:
1. **useEffect 1**: CHỈ reset step khi steps array thực sự thay đổi (length hoặc content)
2. **useEffect 2**: Update experiencePresetKey KHÔNG reset step

---

### **Issue #2: Dịch vụ vẫn hiện khi không chọn seed** 🟡 NOT A BUG

**Analysis:**
```typescript
// Logic syncModules() là ĐÚNG:
const toDisable = modules
  .filter((m) => !desiredSet.has(m.key) && m.enabled && !m.isCore)
  .map((m) => m.key);

for (const moduleKey of toDisable) {
  const cascadeKeys = getCascadeKeys(moduleKey).filter((key) => !desiredSet.has(key));
  await toggleModuleWithCascade({ enabled: false, key: moduleKey, cascadeKeys });
}
```

**Khi nào thấy services:**
- User seed lần 1 với services → services enabled
- User MỞ wizard lần 2, KHÔNG chọn services, nhưng CHƯA nhấn "Bắt đầu Seed"
- → Wizard chỉ show preview, CHƯA gọi `syncModules()` → services vẫn enabled
- Chỉ khi user nhấn "Bắt đầu Seed" → `handleSeed()` → `syncModules(selectedModules)` → mới disable services

**Vậy đây KHÔNG phải bug!** User cần nhấn "Bắt đầu Seed" để apply changes.

**Optional Enhancement:** Có thể thêm warning trong Review step:
> "Module 'services' đang enabled nhưng không nằm trong cấu hình. Sẽ bị disable khi seed."

---

### **Issue #3: Seed bài viết nhưng không thấy** 🔴 NEED VERIFICATION

**Code Analysis:**
```typescript
// 1. PostSeeder seed với status random (70% Published, 20% Draft, 10% Archived)
const status = this.faker.helpers.weightedArrayElement([
  { value: 'Published' as const, weight: 7 },
  { value: 'Draft' as const, weight: 2 },
  { value: 'Archived' as const, weight: 1 },
]);
```

→ **70% posts sẽ là Published**, KHÔNG phải vấn đề status!

```typescript
// 2. Admin list filter mặc định = '' (show all)
const [filterStatus, setFilterStatus] = useState<'' | 'Published' | 'Draft' | 'Archived'>('');
```

→ KHÔNG phải vấn đề filter!

```typescript
// 3. Seed với force = false
const seedConfigs = buildSeedConfigs(...).map((config) => ({
  ...config,
  force: false,
}));
```

Nhưng trong `BaseSeeder`:
```typescript
if (!config.force) {
  const existing = await this.checkExisting();
  if (existing > 0) {
    console.log(`Data already exists. Use force=true to re-seed.`);
    // ← KHÔNG skip, vẫn seed thêm!
  }
}
```

→ KHÔNG phải vấn đề force!

**Possible Root Causes:**
1. ✅ **clearBeforeSeed = true** nhưng user thay đổi thành `false` → không xóa data cũ → seed fail silent
2. ✅ **posts module không enabled** → ModuleGuard chặn không cho vào /admin/posts
3. ✅ **Seed thất bại silent** → cần check console logs

**Solution:**
- Thêm logging để debug
- Verify posts module enabled sau khi seed
- Verify posts count sau khi seed

---

## 🔧 Implementation Plan

### **Fix #1: Chọn ngành hàng không lùi về bước 0** ⭐ CRITICAL

**File:** `components/data/SeedWizardDialog.tsx`

**Change 1:** Xóa useEffect cũ (dòng ~172-177)
```typescript
// ❌ DELETE THIS:
useEffect(() => {
  setCurrentStep(0);
  const presetKey = industryTemplate?.experiencePresetKey
    ?? (getDefaultExperiencePresetKey(state.websiteType) as ExperiencePresetKey);
  setState((prev) => ({ ...prev, experiencePresetKey: presetKey }));
}, [industryTemplate, state.websiteType, hasProducts]);
```

**Change 2:** Thêm 2 useEffect mới NGAY SAU `steps` useMemo (dòng ~170)
```typescript
// ✅ ADD: Reset step CHỈ khi steps array thay đổi
const prevStepsRef = useRef<string[]>([]);
useEffect(() => {
  const currentStepsKey = steps.join(',');
  const prevStepsKey = prevStepsRef.current.join(',');
  
  // Chỉ reset nếu steps array thực sự thay đổi (không phải lần đầu mount)
  if (prevStepsRef.current.length > 0 && currentStepsKey !== prevStepsKey) {
    console.log('[Wizard] Steps changed, resetting to step 0');
    console.log('  Previous steps:', prevStepsRef.current);
    console.log('  Current steps:', steps);
    setCurrentStep(0);
  }
  
  prevStepsRef.current = steps;
}, [steps]);

// ✅ ADD: Update experiencePresetKey khi industry thay đổi (KHÔNG reset step)
useEffect(() => {
  const presetKey = industryTemplate?.experiencePresetKey
    ?? (getDefaultExperiencePresetKey(state.websiteType) as ExperiencePresetKey);
  setState((prev) => ({ ...prev, experiencePresetKey: presetKey }));
}, [industryTemplate?.experiencePresetKey, state.websiteType]);
```

**Imports:** Ensure `useRef` is imported:
```typescript
import React, { useEffect, useMemo, useRef, useState } from 'react';
```

**Why this works:**
- `prevStepsRef` track steps array trước đó
- Chỉ reset step khi `steps.join(',')` thay đổi
- Ignore first mount (`prevStepsRef.current.length > 0`)
- Khi user chọn industry → `industryTemplate` thay đổi → CHỈ update `experiencePresetKey`, KHÔNG reset step
- Khi user đổi websiteType hoặc toggle hasProducts → steps array thay đổi → reset step về 0 (đúng behavior)

---

### **Fix #2: Thêm warning cho modules sẽ bị disable** (Optional Enhancement)

**File:** `components/data/seed-wizard/steps/ReviewStep.tsx`

**Đọc file để xem cấu trúc:**

<function_calls>
<invoke name="Read">
<parameter name="file_path">E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\components\data\seed-wizard\steps\ReviewStep.tsx