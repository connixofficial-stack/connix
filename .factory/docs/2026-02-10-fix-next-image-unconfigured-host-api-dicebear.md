## Fix: Thêm hostname `api.dicebear.com` vào `next.config.ts`

Lỗi do `next/image` không cho phép load ảnh từ `api.dicebear.com` vì chưa được whitelist.

### Thay đổi

**File: `next.config.ts`** - Thêm entry vào `images.remotePatterns`:

```ts
{
  hostname: 'api.dicebear.com',
  protocol: 'https',
},
```

Chỉ cần 1 dòng config, không cần thay đổi code component.