## Nguyên nhân
Trong `OrdersConfigTab.tsx`, tab "Cài đặt chung" đang wrap children bên trong `<div className="space-y-3">`, nhưng component `SettingsCard` cũng đã wrap children trong `<div className="space-y-3">` rồi.

→ Kết quả: **Double nested spacing**, tạo khoảng trắng dư thừa.

## Fix
**File:** `components/modules/orders/OrdersConfigTab.tsx`

Xóa wrapper `<div className="space-y-3">` thừa trong SettingsCard "Cài đặt chung" (dòng ~152):

```diff
<SettingsCard title="Cài đặt chung">
-  <div className="space-y-3">
     {config.settings
       ?.filter(...)
       .map(...)}
-  </div>
</SettingsCard>
```

Vì `SettingsCard` đã có sẵn `space-y-3` wrapper bên trong.