## Tổng quan

Tạo skill mới **`experience-module-status`** để áp dụng pattern "1-way dependency" (Experience phụ thuộc Module) cho các experience editors, sau đó áp dụng vào `/system/experiences/posts-detail`.

---

## Bước 1: Tạo Skill mới

**Location:** `.factory/skills/experience-module-status/SKILL.md`

### Nội dung SKILL.md

```yaml
---
name: experience-module-status
description: Thêm UI hiển thị trạng thái feature/setting từ Module vào Experience Editor theo pattern 1-way dependency (Experience phụ thuộc Module). Sử dụng khi cần hiển thị trạng thái bật/tắt của feature từ module trong experience editor, với link hướng dẫn người dùng đến module để thay đổi.
---
```

**Nội dung hướng dẫn:**
- Mô tả pattern 1-way dependency
- Component template `FeatureStatus`
- Cách query feature/setting từ module
- Cách tích hợp vào experience editor
- Cách ẩn/hiện preview component dựa trên status

---

## Bước 2: Áp dụng vào posts-detail

### Phân tích posts-detail hiện tại

**Các features từ module posts:**
- `enableTags` - Bật/tắt tags
- `enableFeatured` - Bật/tắt nổi bật
- `enableScheduling` - Bật/tắt hẹn giờ

**Hiện tại posts-detail đã có:**
- 2-way sync cho comments (toggle ở experience → sync module)
- Chưa có UI hiển thị status cho features của posts module

### Thay đổi cần làm

1. **Thêm query features từ posts module:**
   ```tsx
   const tagsFeature = useQuery(api.admin.modules.getModuleFeature, 
     { moduleKey: 'posts', featureKey: 'enableTags' });
   const featuredFeature = useQuery(api.admin.modules.getModuleFeature, 
     { moduleKey: 'posts', featureKey: 'enableFeatured' });
   const schedulingFeature = useQuery(api.admin.modules.getModuleFeature, 
     { moduleKey: 'posts', featureKey: 'enableScheduling' });
   ```

2. **Thêm component FeatureStatus (reusable):**
   ```tsx
   function ModuleFeatureStatus({ 
     label, 
     enabled, 
     href 
   }: { label: string; enabled: boolean; href: string }) {
     return (
       <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border...">
         <div className="flex items-start gap-2">
           <span className={`... ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
           <div>
             <p className="text-sm font-medium">{label}</p>
             <p className="text-xs text-slate-500">
               {enabled ? 'Đang bật' : 'Chưa bật'} · Quản lý tại Module
             </p>
           </div>
         </div>
         <Link href={href}>Đi đến →</Link>
       </div>
     );
   }
   ```

3. **Thêm vào ControlCard "Thông tin bài viết":**
   - Tags status → link `/system/modules/posts`
   - Featured status → link `/system/modules/posts`
   - Scheduling status → link `/system/modules/posts`

---

## Files thay đổi

| File | Thay đổi |
|------|----------|
| `.factory/skills/experience-module-status/SKILL.md` | Tạo mới - skill template |
| `app/system/experiences/posts-detail/page.tsx` | Query features, thêm UI status |

---

## Ước tính

- **Skill:** ~100-150 dòng markdown
- **posts-detail:** ~30-40 dòng code mới
- Không ảnh hưởng logic 2-way sync comments hiện có