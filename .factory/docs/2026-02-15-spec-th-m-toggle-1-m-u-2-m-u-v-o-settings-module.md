# Spec: Thêm toggle "1 màu / 2 màu" vào Settings Module

## 🎯 Mục tiêu
Thêm tính năng toggle giữa **chế độ 1 màu (single brand color)** và **chế độ 2 màu (dual brand color)** vào `/system/modules/settings`, để:
- Khi chọn **1 màu**: disable trường màu thương hiệu phụ (`site_brand_secondary`)
- Khi chọn **2 màu**: bật trường màu phụ để user edit

## 📋 Yêu cầu đã xác nhận (từ AskUser)
1. **Storage**: Lưu toggle vào `settings` table với key `site_brand_mode` = `'single'` hoặc `'dual'`
2. **UI Behavior**: Khi 1 màu → field màu phụ **disabled (xám)** nhưng **vẫn hiển thị**
3. **Logic Hook**: `useBrandColors()` sẽ **tắt `generateComplementary()`** và trả về `null`/`''` cho `secondary` khi mode = `'single'`

---

## 🛠️ Implementation Plan

### **BƯỚC 1: Update Convex Settings Seeder**
**File:** `convex/seeders/settings.seeder.ts`

**Thêm vào `seedSettingsData()`:**
```typescript
{ group: 'site', key: 'site_brand_mode', value: 'dual' }, // Default: 2 màu
```

**Thêm vào `seedModuleConfig()` - moduleFields:**
```typescript
{ 
  enabled: true, 
  fieldKey: 'site_brand_mode', 
  group: 'site', 
  isSystem: false, 
  moduleKey: 'settings', 
  name: 'Chế độ màu thương hiệu', 
  order: 6.5, // Giữa site_language (order 6) và site_brand_primary (order 7)
  required: false, 
  type: 'select' as const 
},
```

**Update field `site_brand_secondary` để thêm dependency logic** (thực hiện ở BƯỚC 3, không chỉnh seeder field này)

---

### **BƯỚC 2: Update Schema (nếu cần thêm field type)**
**File:** `convex/schema.ts`

✅ Hiện tại đã hỗ trợ `select` type → **Không cần update schema**.

---

### **BƯỚC 3: Update Settings Module Config**
**File:** `lib/modules/configs/settings.config.ts`

**Thêm setting mới vào `settings` array:**
```typescript
{ 
  key: 'brandColorMode', 
  label: 'Chế độ màu thương hiệu', 
  type: 'select' as const,
  options: [
    { label: '1 màu (Primary)', value: 'single' },
    { label: '2 màu (Primary + Secondary)', value: 'dual' },
  ],
  default: 'dual',
  group: 'appearance', // Hoặc 'general' nếu không có group 'appearance'
},
```

**Giải thích logic:**
- Key `brandColorMode` trong config map tới `site_brand_mode` trong DB (convention: moduleSettings vs settings table)
- Options: `single` / `dual`
- Default: `dual` (2 màu)

---

### **BƯỚC 4: Update ModuleConfigPage để xử lý disable logic**
**File:** `components/modules/ModuleConfigPage.tsx`

**Trong `ConfigTab` component, update render logic cho Settings fields:**

Hiện tại code render settings theo groups. Ta cần **thêm logic disable cho field `site_brand_secondary`** dựa trên `localSettings.brandColorMode`:

```tsx
// Trong ConfigTab function, tại vị trí render SettingInput
{groupSettings.map(setting => {
  // Existing dependency check
  if (setting.dependsOn && !localSettings[setting.dependsOn]) {
    return null;
  }

  // NEW: Check nếu field là site_brand_secondary thì disable khi mode = 'single'
  const isSecondaryColorField = 
    config.key === 'settings' && 
    setting.key === 'site_brand_secondary';
  const isDisabled = 
    isSecondaryColorField && 
    localSettings.brandColorMode === 'single';

  // Render logic với disabled prop
  if (setting.type === 'select') {
    return (
      <SettingSelect
        key={setting.key}
        label={setting.label}
        value={String(localSettings[setting.key] ?? '')}
        onChange={(v) => onSettingChange(setting.key, v)}
        options={setting.options ?? []}
        disabled={isDisabled} // NEW
      />
    );
  }

  // ... existing switch cases ...
  
  // For text/number inputs
  return (
    <SettingInput
      key={setting.key}
      type={setting.type === 'text' ? 'text' : 'number'}
      label={setting.label}
      value={localSettings[setting.key] ?? ''}
      onChange={(v) => onSettingChange(setting.key, v)}
      disabled={isDisabled} // NEW
    />
  );
})}
```

**⚠️ QUAN TRỌNG:** Cần check xem `SettingInput`, `SettingSelect` đã hỗ trợ `disabled` prop chưa. Nếu chưa thì update components đó.

---

### **BƯỚC 5: Update Shared Components để hỗ trợ disabled**
**File:** `components/modules/shared/SettingInput.tsx` (và các shared components tương tự)

**Thêm `disabled` prop:**
```tsx
interface SettingInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number';
  disabled?: boolean; // NEW
}

export function SettingInput({ label, value, onChange, type = 'text', disabled = false }: SettingInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className={cn(disabled && "opacity-50")}>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        disabled={disabled} // NEW
        className={cn(disabled && "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60")}
      />
    </div>
  );
}
```

**Áp dụng tương tự cho:**
- `SettingSelect.tsx`
- `SettingTextarea.tsx`
- Các component khác nếu cần

---

### **BƯỚC 6: Update useBrandColors hook**
**File:** `components/site/hooks.ts`

**Sửa `useBrandColors()` để tắt `generateComplementary()` khi mode = 'single':**

```typescript
export function useBrandColors() {
  const primarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_primary' });
  const legacySetting = useQuery(api.settings.getByKey, { key: 'site_brand_color' });
  const secondarySetting = useQuery(api.settings.getByKey, { key: 'site_brand_secondary' });
  const modeSetting = useQuery(api.settings.getByKey, { key: 'site_brand_mode' }); // NEW
  
  const primary = resolveColorSetting(primarySetting?.value)
    ?? resolveColorSetting(legacySetting?.value)
    ?? DEFAULT_BRAND_COLOR;
  
  // NEW: Logic based on mode
  const mode = modeSetting?.value === 'single' ? 'single' : 'dual';
  
  let secondary: string;
  if (mode === 'single') {
    // Khi 1 màu: trả về '' thay vì generate complementary
    secondary = '';
  } else {
    // Khi 2 màu: ưu tiên user-defined, fallback là complementary
    secondary = resolveColorSetting(secondarySetting?.value)
      ?? generateComplementary(primary);
  }

  return { primary, secondary };
}
```

**⚠️ Lưu ý:** Code hiện tại ở experiences có thể đang dùng `secondary` cho styling. Cần **review toàn bộ usages** để đảm bảo không bị lỗi khi `secondary = ''`.

---

### **BƯỚC 7: Update /admin/settings page (nếu cần)**
**File:** `app/admin/settings/page.tsx`

Hiện tại trang này đã có logic disable màu phụ dựa trên checkbox `isSecondaryAuto`. **Cần sync logic với mode từ `/system/modules/settings`:**

```tsx
// Trong SettingsContent, thay vì useStatecheckbox:
const mode = form.site_brand_mode || 'dual';
const isSecondaryDisabled = mode === 'single';

// Update render field màu phụ:
case 'color': {
  if (key === 'site_brand_secondary') {
    const displayColor = isSecondaryDisabled ? derivedSecondary : value;
    
    return (
      <div className="space-y-2" key={key}>
        <div className="flex items-center justify-between gap-3">
          <Label className={cn(isSecondaryDisabled && "opacity-50")}>
            {field.name}
          </Label>
          {/* Remove checkbox, mode is controlled by toggle in /system now */}
        </div>
        <Input
          type="color"
          value={displayColor}
          onChange={(e) => updateField(key, e.target.value)}
          disabled={isSecondaryDisabled} // NEW
          className={cn(
            "h-10 cursor-pointer",
            isSecondaryDisabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>
    );
  }
  // ... existing primary color logic
}
```

**Hoặc giữ nguyên logic hiện tại** nếu muốn `/admin/settings` độc lập với `/system/modules/settings`. Tùy bạn quyết định.

---

### **BƯỚC 8: Re-seed database**
**Chạy seed để apply changes:**
```bash
# Trong Convex dashboard hoặc via mutation
# Hoặc reset toàn bộ settings table nếu cần
```

**Hoặc manual insert setting:**
```typescript
// Via Convex dashboard -> Data -> settings table
{ group: 'site', key: 'site_brand_mode', value: 'dual' }
```

---

### **BƯỚC 9: Test flow**
1. Vào `/system/modules/settings`
2. Chọn **"Chế độ màu thương hiệu"** = **"1 màu"**
3. → Field **"Màu thương hiệu (phụ)"** sẽ **disabled (xám, không edit được)**
4. Save → Check DB: `site_brand_mode = 'single'`
5. Reload trang → Check `useBrandColors()` trả về `secondary = ''`
6. Chọn **"2 màu"** → Field phụ **enabled** lại
7. Kiểm tra UI experiences (homepage, posts, products) có bị lỗi không khi `secondary = ''`

---

## 📝 Checklist

- [ ] **BƯỚC 1:** Update seeder - thêm `site_brand_mode` vào settings + moduleFields
- [ ] **BƯỚC 2:** (Skip - schema đã đủ)
- [ ] **BƯỚC 3:** Update `settings.config.ts` - thêm setting `brandColorMode`
- [ ] **BƯỚC 4:** Update `ModuleConfigPage.tsx` - thêm logic disable field secondary
- [ ] **BƯỚC 5:** Update shared components (`SettingInput`, `SettingSelect`) - hỗ trợ `disabled` prop
- [ ] **BƯỚC 6:** Update `hooks.ts` - `useBrandColors()` logic dựa trên mode
- [ ] **BƯỚC 7:** (Optional) Update `/admin/settings/page.tsx` để sync với mode
- [ ] **BƯỚC 8:** Re-seed database
- [ ] **BƯỚC 9:** Test toàn bộ flow

---

## 🚨 Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Experiences bị lỗi khi `secondary = ''` | Review toàn bộ usages của `useBrandColors().secondary` trong ComponentRenderer, experiences. Fallback về `primary` nếu `secondary` rỗng. |
| User đã set màu phụ thủ công, khi switch sang "1 màu" sẽ mất data | ✅ OK - vì chỉ disable UI, không xóa data trong DB. Khi switch lại "2 màu" thì data vẫn còn. |
| Seeder cũ chưa có `site_brand_mode` | Insert manual vào DB hoặc chạy migration nhỏ để thêm setting này cho existing instances. |

---

## 🎨 Convention Notes
- **CoC (Convention over Configuration):** Default là `'dual'` (2 màu) để giữ backward compatibility
- **Field order:** `site_brand_mode` order = 6.5 (giữa language và primary color)
- **Naming:** `site_brand_mode` (settings table) vs `brandColorMode` (module config key) - follow convention hiện có

---

## ✅ Acceptance Criteria
- [ ] Toggle "1 màu / 2 màu" hiển thị đúng trong `/system/modules/settings`
- [ ] Khi chọn "1 màu": field màu phụ **disabled** (xám, không edit)
- [ ] Khi chọn "2 màu": field màu phụ **enabled** (edit bình thường)
- [ ] `useBrandColors()` trả về `secondary = ''` khi mode = `'single'`
- [ ] Experiences không bị lỗi UI khi `secondary = ''`
- [ ] Save/reload giữ nguyên state của toggle
- [ ] Oxlint pass (chỉ chạy khi có thay đổi code TS)

---

Bạn có muốn tôi điều chỉnh spec này không? Nếu OK thì tôi sẽ proceed với implementation! 🚀