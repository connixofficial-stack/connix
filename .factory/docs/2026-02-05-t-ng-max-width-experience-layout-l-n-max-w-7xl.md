## Tăng max-width experience layout

### Thay đổi
**File:** `app/system/experiences/posts-list/page.tsx`

```diff
- <div className="max-w-4xl mx-auto space-y-6 pb-20">
+ <div className="max-w-7xl mx-auto space-y-6 pb-20">
```

### Lý do
- `max-w-4xl` = 896px - hơi hẹp cho preview responsive
- `max-w-7xl` = 1280px - đủ rộng để xem preview desktop thoải mái, đồng nhất với layout home-components