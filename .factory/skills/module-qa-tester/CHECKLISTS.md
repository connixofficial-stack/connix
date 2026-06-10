# QA Checklists Chi Tiết

## 1. System Config Page Checklist

### 1.1 File Structure
```
□ File tồn tại tại: app/system/modules/{module}/page.tsx
□ Import đúng từ @/convex/_generated/api
□ Sử dụng 'use client' directive
□ Export default function đúng naming
```

### 1.2 Queries & Mutations Setup
```
□ moduleData = useQuery(api.admin.modules.getModuleByKey)
□ featuresData = useQuery(api.admin.modules.listModuleFeatures)
□ fieldsData = useQuery(api.admin.modules.listModuleFields)
□ settingsData = useQuery(api.admin.modules.listModuleSettings)
□ toggleFeature = useMutation(api.admin.modules.toggleModuleFeature)
□ updateField = useMutation(api.admin.modules.updateModuleField)
□ setSetting = useMutation(api.admin.modules.setModuleSetting)
□ Seed mutations đúng module
□ Clear mutations đúng module
```

### 1.3 State Management
```
□ localFeatures state khởi tạo đúng
□ localFields state khởi tạo đúng
□ localSettings state khởi tạo đúng
□ useEffect sync với server data
□ serverFeatures/serverFields memoized
□ hasChanges computed đúng
□ isSaving state
□ activeTab state (config/data)
```

### 1.4 UI Components
```
□ ModuleHeader với icon, title, description
□ Tabs với Config và Data
□ ModuleStatus component
□ SettingsCard với inputs
□ FeaturesCard với toggles
□ FieldsCard cho mỗi entity type
□ ConventionNote
□ Loading state với Loader2
```

### 1.5 Config Tab Functions
```
□ handleToggleFeature cập nhật cả features và linked fields
□ handleToggleField không cho toggle isSystem fields
□ handleSave gọi đúng mutations
□ Toast success/error messages
```

### 1.6 Data Tab Functions
```
□ Statistics cards với đúng counts
□ handleSeedAll gọi seed mutation
□ handleClearAll có confirm dialog
□ handleResetAll = clear + seed
□ Preview tables với data từ queries
□ Giới hạn hiển thị (e.g., slice(0, 10))
```

## 2. Admin List Page Checklist

### 2.1 File Structure
```
□ File tồn tại tại: app/admin/{module}/page.tsx
□ Có ModuleGuard wrapper
□ Export default function với Guard
□ Inner content component
```

### 2.2 Queries & Mutations
```
□ listAll query cho main entity
□ Related entity queries (categories, etc.)
□ settingsData = useQuery(api.admin.modules.listModuleSettings) ⚠️ CRITICAL
□ delete mutation
□ Seed/clear mutations (optional)
```

### 2.3 State Management
```
□ sortConfig state
□ searchTerm state
□ filterStatus state (nếu có)
□ selectedIds state cho bulk actions
□ currentPage state cho pagination ⚠️ CRITICAL
□ isLoading check
```

### 2.4 Data Processing
```
□ categoryMap hoặc related data mapping
□ filteredData với search/filter
□ sortedData với useSortableData hook
□ itemsPerPage từ module settings ⚠️ CRITICAL (e.g., postsPerPage, commentsPerPage)
□ totalPages = Math.ceil(sortedData.length / itemsPerPage)
□ paginatedData = sortedData.slice(start, start + itemsPerPage)
□ Reset currentPage khi filter/sort thay đổi
```

### 2.5 Table Structure
```
□ SelectCheckbox column
□ Thumbnail/Image column (nếu có)
□ SortableHeader cho sortable columns
□ Badge cho status columns
□ Action buttons column (edit, delete, view)
```

### 2.6 Handlers
```
□ handleSort function
□ toggleSelectAll function
□ toggleSelectItem function
□ handleDelete với confirm
□ handleBulkDelete với confirm
□ openFrontend function (nếu có)
□ handleReseed function (nếu có)
```

### 2.7 UI States
```
□ Loading spinner
□ Empty state message
□ No results message
□ Selection count display
□ BulkActionBar component
□ Pagination UI với Previous/Next buttons ⚠️ CRITICAL
□ Hiển thị "Trang X / Y" và "Hiển thị A - B / Total"
```

## 3. Admin Create Page Checklist

### 3.1 File Structure
```
□ File tồn tại tại: app/admin/{module}/create/page.tsx
□ Có ModuleGuard wrapper (optional)
□ Export default function
```

### 3.2 Form Setup
```
□ Form state với useState hoặc react-hook-form
□ Validation schema (nếu dùng zod)
□ Create mutation
□ Related data queries (categories, users, etc.)
```

### 3.3 Form Fields
```
□ Tất cả required fields có mặt
□ Labels đúng
□ Placeholder text
□ Required indicator (*)
□ Help text cho complex fields
□ File upload handler (nếu có)
```

### 3.4 Validation
```
□ Required field validation
□ Format validation (email, url, etc.)
□ Unique validation (slug, etc.)
□ Error messages display
```

### 3.5 Submission
```
□ handleSubmit function
□ Loading state khi submit
□ Success redirect (router.push)
□ Error handling với toast
□ Disabled submit khi invalid
```

### 3.6 Navigation
```
□ Back/Cancel button
□ Breadcrumb (optional)
□ Proper routing
```

## 4. Admin Edit Page Checklist

### 4.1 File Structure
```
□ File tồn tại tại: app/admin/{module}/[id]/edit/page.tsx
□ Lấy params.id đúng
□ Export default function
```

### 4.2 Data Loading
```
□ getById query với id
□ Pre-fill form với existing data
□ Handle not found case
□ Loading state khi fetch
□ isDataLoaded flag để tránh re-init LexicalEditor
```

### 4.3 Form Updates
```
□ Update mutation thay vì create
□ Partial update support
□ Không tạo duplicate
□ Handle concurrent edits (optional)
```

### 4.4 Special Handling
```
□ Slug change validation
□ Image update/keep existing
□ Related entity updates
□ Status change side effects
□ LexicalEditor initialContent prop (nếu có rich text)
```

### 4.5 LexicalEditor Integration (nếu có)
```
□ Truyền initialContent prop với content cũ
□ Đợi isDataLoaded trước khi render LexicalEditor
□ Không hiển thị preview HTML riêng (đã có trong editor)
```

## 5. Convex Backend Checklist

### 5.1 File Structure
```
□ File tồn tại tại: convex/{module}.ts
□ Import từ ./_generated/server
□ Import validators từ convex/values
□ Định nghĩa document validator
```

### 5.2 Queries
```
□ list với pagination
□ listAll không pagination
□ getById với null handling
□ getBySlug (nếu có slug field)
□ count với optional filters
□ Related queries (listByCategory, etc.)
□ Return type validators
```

### 5.3 Mutations
```
□ create với validation
□ create với unique check
□ create với default values
□ update với existence check
□ update với unique check (slug)
□ update với side effects (publishedAt)
□ remove với cascade delete
□ Return type validators
```

### 5.4 Indexes
```
□ by_slug (nếu có)
□ by_status
□ by_category (nếu có relations)
□ by_author (nếu có)
□ Composite indexes cho common queries
```

### 5.5 Security & Performance
```
□ Không leak sensitive data
□ Sử dụng indexes thay vì full scan
□ Batch operations khi cần
□ Auth checks (nếu applicable)
```

## 6. Integration Checklist

### 6.1 System → Admin ⚠️ CRITICAL INTEGRATION
```
□ Module disabled → Admin pages blocked (ModuleGuard)
□ Feature toggle → UI elements hidden/shown
□ Field toggle → Form fields hidden/shown
□ Settings → Behavior changes:
  □ {module}PerPage setting → Admin list pagination ⚠️ MUST CHECK
  □ defaultStatus setting → Create mutation default value
  □ autoApprove setting → Ảnh hưởng status khi tạo mới
```

### 6.2 Admin → Frontend (nếu có)
```
□ Published items visible
□ Draft items hidden
□ Slug routing works
□ SEO metadata (nếu có)
```

### 6.3 Cross-Module Relations
```
□ Category relation resolve đúng
□ Author relation resolve đúng
□ Cascade delete hoạt động
□ Referential integrity maintained
```

### 6.4 Real-time Updates
```
□ Data auto-refresh khi mutation
□ Multiple tabs sync
□ No stale data issues
```

## 7. Code Quality Checklist

### 7.1 TypeScript
```
□ Không có any type không cần thiết
□ Props được type đầy đủ
□ Return types explicit
□ Generics sử dụng đúng (Id<"posts">)
```

### 7.2 React Best Practices
```
□ Keys trong lists
□ Không inline functions trong JSX
□ useMemo/useCallback hợp lý
□ Cleanup trong useEffect
```

### 7.3 Accessibility
```
□ Labels cho form inputs
□ Alt text cho images
□ Keyboard navigation
□ ARIA attributes (nếu cần)
```

### 7.4 Performance
```
□ Không re-render không cần thiết
□ Lazy loading (nếu cần)
□ Image optimization
□ Bundle size reasonable
```

### 7.5 LexicalEditor (Rich Text) ⚠️ CRITICAL
```
□ PasteImagePlugin có mặt - auto upload pasted images
□ Ảnh paste được compress 85% trước khi upload
□ KHÔNG lưu base64 vào DB (dùng storage URL)
□ InitialContentPlugin filter valid nodes (ElementNode/DecoratorNode)
□ handleImageUpload compress + upload + return URL
□ Images được lưu vào folder riêng (e.g., posts-content, products-content)
```

### 7.6 LexicalEditor Custom ImageNode ⚠️ CRITICAL
```
□ File ImageNode.tsx tồn tại tại: app/admin/components/nodes/ImageNode.tsx
□ ImageNode extends DecoratorNode<JSX.Element>
□ static getType() return 'image'
□ static clone() copy đúng properties
□ static importJSON() / exportJSON() cho serialization
□ static importDOM() parse <img> tag từ HTML
□ exportDOM() tạo <img> tag với src, alt, width, height ⚠️ QUAN TRỌNG
□ setWidthAndHeight() method cho resize functionality
□ decorate() return <ImageComponent /> với nodeKey
□ ImageNode đăng ký trong initialConfig.nodes array
□ ImagesPlugin có mặt và đăng ký INSERT_IMAGE_COMMAND
```

### 7.7 ImageComponent Selection & Resize ⚠️
```
□ useLexicalNodeSelection hook cho selection state
□ Click vào ảnh → setSelected(true)
□ Viền xanh (#3b82f6) khi ảnh được chọn (isFocused)
□ Delete/Backspace key → xóa ảnh đã chọn
□ ImageResizer hiển thị khi isFocused
□ 8 resize handles (4 góc + 4 cạnh)
□ Pointer events: pointerdown → pointermove → pointerup
□ Maintain aspect ratio khi kéo góc
□ onResizeEnd gọi node.setWidthAndHeight()
□ Width/height persist sau khi save và reload
```

### 7.8 Image Persistence Flow
```
□ Save: $generateHtmlFromNodes → exportDOM() → <img width="X" height="Y">
□ Load: $generateNodesFromDOM → importDOM() → ImageNode với width/height
□ Width/height lưu vào cả attributes và inline styles
□ convertImageElement parse width/height từ attributes VÀ styles
□ Test: Upload → Resize → Save → Reload → Kiểm tra kích thước giữ nguyên
```

### 7.5 Maintainability
```
□ DRY - không duplicate code
□ Single responsibility
□ Clear naming
□ Reasonable file size
```

## Quick Issue Severity Guide

| Severity | Criteria |
|----------|----------|
| **Critical** | App crash, data loss, security vulnerability |
| **High** | Core feature broken, bad UX, data corruption |
| **Medium** | Minor feature issues, cosmetic bugs with workaround |
| **Low** | Code style, minor UX improvements, nice-to-have |

## Workflow Tips

1. **Đọc code trước** - Static analysis tìm được ~60% issues
2. **So sánh với Posts** - Reference module đã OK
3. **Check từng layer** - System → Admin → Convex
4. **Ghi chú ngay** - Đừng tin vào memory
5. **Ưu tiên Critical/High** - Fix những cái quan trọng trước
