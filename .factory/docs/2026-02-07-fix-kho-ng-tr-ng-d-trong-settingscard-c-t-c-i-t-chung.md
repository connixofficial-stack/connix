## Phân tích

Sau khi xem lại code, tôi thấy vấn đề có thể do:

1. **SettingsCard component** có structure:
   - `p-4` (padding)
   - `h3.mb-3` (title với margin-bottom)
   - `div.space-y-3` wrapper children

2. **Trong tab "Cài đặt chung"**, mỗi setting item có `div.space-y-2` chứa label + input

→ Kết quả: `space-y-3` (từ SettingsCard) + `space-y-2` (từ mỗi item) tạo khoảng cách lớn giữa label và input.

## Giải pháp đề xuất

Bỏ `space-y-2` trong mỗi setting item (vì `space-y-3` của SettingsCard đã đủ spacing giữa các items):

```diff
{config.settings
  ?.filter((setting) => (setting.group ?? 'general') === 'general')
  .map((setting) => (
-    <div key={setting.key} className="space-y-2">
+    <div key={setting.key}>
      <label className="text-xs text-slate-500">{setting.label}</label>
      ...
    </div>
  ))}
```

**Lưu ý:** Label và Input cần có khoảng cách nhỏ - sẽ thêm `mb-1` cho label nếu cần.