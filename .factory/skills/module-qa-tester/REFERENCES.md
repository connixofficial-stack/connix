# Reference: Module Posts (QA Passed)

Module Posts là module chuẩn đã được test và QA đầy đủ. Sử dụng làm reference khi QA các module khác.

## File Paths

```
System Config:  app/system/modules/posts/page.tsx
Admin List:     app/admin/posts/page.tsx
Admin Create:   app/admin/posts/create/page.tsx
Admin Edit:     app/admin/posts/[id]/edit/page.tsx
Convex Backend: convex/posts.ts
Seed Data:      convex/seed.ts (seedPostsModule, clearPostsData)
```

## Key Patterns

### 1. System Config Page Pattern

```tsx
// Constants
const MODULE_KEY = 'posts';
const CATEGORY_MODULE_KEY = 'postCategories';

const FEATURES_CONFIG = [
  { key: 'enableTags', label: 'Tags', icon: Tag, linkedField: 'tags' },
  { key: 'enableFeatured', label: 'Nổi bật', icon: Star, linkedField: 'featured' },
  { key: 'enableScheduling', label: 'Hẹn giờ', icon: Clock, linkedField: 'publish_date' },
];

// State Types
type FeaturesState = Record<string, boolean>;
type SettingsState = { postsPerPage: number; defaultStatus: string };
type TabType = 'config' | 'data';
```

### 2. Local State Sync Pattern

```tsx
// Sync features from server
useEffect(() => {
  if (featuresData) {
    const features: FeaturesState = {};
    featuresData.forEach(f => { features[f.featureKey] = f.enabled; });
    setLocalFeatures(features);
  }
}, [featuresData]);
```

### 3. Change Detection Pattern

```tsx
const hasChanges = useMemo(() => {
  const featuresChanged = Object.keys(localFeatures).some(
    key => localFeatures[key] !== serverFeatures[key]
  );
  const fieldsChanged = localFields.some(f => {
    const server = serverFields.find(s => s.id === f.id);
    return server && f.enabled !== server.enabled;
  });
  const settingsChanged = 
    localSettings.postsPerPage !== serverSettings.postsPerPage ||
    localSettings.defaultStatus !== serverSettings.defaultStatus;
  return featuresChanged || fieldsChanged || settingsChanged;
}, [localFeatures, serverFeatures, localFields, serverFields, localSettings, serverSettings]);
```

### 4. Feature Toggle with Linked Fields Pattern

```tsx
const handleToggleFeature = (key: string) => {
  setLocalFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  // Also update linked fields
  setLocalPostFields(prev => prev.map(f => 
    f.linkedFeature === key ? { ...f, enabled: !localFeatures[key] } : f
  ));
};
```

### 5. Admin List Page Pattern

```tsx
export default function PostsListPage() {
  return (
    <ModuleGuard moduleKey="posts">
      <PostsContent />
    </ModuleGuard>
  );
}

function PostsContent() {
  // Queries
  const postsData = useQuery(api.posts.listAll);
  const categoriesData = useQuery(api.postCategories.listAll);
  
  // Mutations
  const deletePost = useMutation(api.posts.remove);
  
  // States
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Data processing
  const categoryMap = useMemo(() => {...}, [categoriesData]);
  const filteredPosts = useMemo(() => {...}, [posts, searchTerm, filterStatus]);
  const sortedPosts = useSortableData(filteredPosts, sortConfig);
  
  // Handlers
  const handleSort = (key) => {...};
  const toggleSelectAll = () => {...};
  const handleDelete = async (id) => {...};
  const handleBulkDelete = async () => {...};
}
```

### 6. Convex Query Pattern

```tsx
export const listAll = query({
  args: {},
  returns: v.array(postDoc),
  handler: async (ctx) => {
    return await ctx.db.query("posts").collect();
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  returns: v.union(postDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

### 7. Convex Mutation Pattern

```tsx
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    // ... other fields
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    // Check unique
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Slug already exists");
    
    // Default values
    const count = (await ctx.db.query("posts").collect()).length;
    
    // Insert
    return await ctx.db.insert("posts", {
      ...args,
      status: args.status ?? "Draft",
      views: 0,
      order: args.order ?? count,
    });
  },
});
```

### 8. Cascade Delete Pattern

```tsx
export const remove = mutation({
  args: { id: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete related comments first
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target_status", (q) =>
        q.eq("targetType", "post").eq("targetId", args.id)
      )
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }
    // Then delete main entity
    await ctx.db.delete(args.id);
    return null;
  },
});
```

## Common Components Used

```tsx
import { 
  ModuleHeader, ModuleStatus, ConventionNote, Code,
  SettingsCard, SettingInput, SettingSelect,
  FeaturesCard, FieldsCard
} from '@/components/modules/shared';

import { 
  Card, Badge, Button, Input, Table, 
  TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/app/admin/components/ui';

import { 
  SortableHeader, BulkActionBar, SelectCheckbox, useSortableData 
} from '../components/TableUtilities';

import { ModuleGuard } from '../components/ModuleGuard';
```

## Status Values

```tsx
// Content status
type ContentStatus = 'Published' | 'Draft' | 'Archived';

// Badge variants
variant={status === 'Published' ? 'success' : status === 'Draft' ? 'secondary' : 'warning'}
```

## Icons Commonly Used

```tsx
import { 
  FileText,      // Posts icon
  FolderTree,    // Categories icon
  Tag,           // Tags feature
  Star,          // Featured feature
  Clock,         // Scheduling feature
  Loader2,       // Loading spinner
  Database,      // Data tab
  Trash2,        // Delete action
  RefreshCw,     // Reset action
  MessageSquare, // Comments
  Settings,      // Config tab
  Eye,           // View action
  Plus,          // Add action
  Edit,          // Edit action
  ExternalLink,  // External link
  Search,        // Search input
} from 'lucide-react';
```

## Toast Messages

```tsx
// Success
toast.success('Đã lưu cấu hình thành công!');
toast.success('Đã tạo dữ liệu mẫu thành công!');
toast.success('Đã xóa bài viết');

// Error
toast.error('Có lỗi xảy ra khi lưu cấu hình');
toast.error('Có lỗi khi xóa bài viết');

// Loading
toast.loading('Đang tạo dữ liệu mẫu...');
toast.dismiss();
```

## Confirm Dialogs

```tsx
if (confirm('Xóa toàn bộ dữ liệu bài viết, danh mục và bình luận?')) {
  // proceed
}

if (confirm(`Xóa ${selectedIds.length} bài viết đã chọn?`)) {
  // proceed
}
```

## Module Color Scheme

| Module | Primary Color | Icon BG | Icon Text |
|--------|--------------|---------|-----------|
| Posts | cyan-500 | bg-cyan-500/10 | text-cyan-600 |
| Categories | emerald-500 | bg-emerald-500/10 | text-emerald-600 |
| Comments | amber-500 | bg-amber-500/10 | text-amber-600 |
| Products | indigo-500 | bg-indigo-500/10 | text-indigo-600 |
| Orders | orange-500 | bg-orange-500/10 | text-orange-600 |
