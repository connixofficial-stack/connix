---
name: module-qa-tester
description: "QA và review code cho admin modules (system + admin) sử dụng checklist-based approach. Sử dụng khi: (1) QA module mới sau khi tạo, (2) Review code module, (3) Kiểm tra tích hợp /system và /admin, (4) Tìm bugs và issues, (5) Tạo ticket/issues để fix. Tham chiếu module Posts đã test OK."
version: 1.0.0
---

# Module QA Tester

Skill này giúp QA và review code các admin modules trong hệ thống VietAdmin một cách có hệ thống, không cần viết script test (tuân thủ KISS).

## Khi nào sử dụng

- Sau khi tạo module mới bằng module-creator
- Khi cần QA toàn diện một module
- Khi review code trước khi merge
- Khi tìm bugs và tạo danh sách issues

## Cấu trúc Module chuẩn (Reference: Posts module)

### 1. System Config Page (`/system/modules/{module}/page.tsx`)
```
app/system/modules/{module}/page.tsx
├── Config Tab: Quản lý settings, features, fields
├── Data Tab: Statistics, seed/clear/reset data, preview tables
├── ModuleHeader với Save button
├── ModuleStatus với toggle
└── Convention notes
```

### 2. Admin Pages (`/admin/{module}/`)
```
app/admin/{module}/
├── page.tsx          # List page với CRUD
├── create/page.tsx   # Create form
└── [id]/edit/page.tsx # Edit form
```

### 3. Convex Backend (`/convex/{module}.ts`)
```
convex/{module}.ts
├── list, listAll     # Read queries
├── getById, getBySlug  # Single item queries
├── count             # Statistics
├── create            # Create mutation
├── update            # Update mutation
└── remove            # Delete mutation với cascade
```

## QA Workflow

### Phase 1: Code Review (Static Analysis)

**Đọc và phân tích code KHÔNG chạy app:**

1. **Check file structure**
   - [ ] System config page tồn tại
   - [ ] Admin pages (list, create, edit) tồn tại
   - [ ] Convex backend file tồn tại
   - [ ] Types/validators đầy đủ

2. **Check imports & dependencies**
   - [ ] Không có unused imports
   - [ ] Dùng đúng API path (@/convex/_generated/api)
   - [ ] Không import circular

3. **Check naming conventions**
   - [ ] MODULE_KEY consistent
   - [ ] Tên biến/function có ý nghĩa
   - [ ] Tuân thủ camelCase (JS) / snake_case (DB fields)

4. **Check TypeScript**
   - [ ] Không có `any` type không cần thiết
   - [ ] Props được type đúng
   - [ ] Return types cho mutations/queries

5. **Check error handling**
   - [ ] Try/catch cho mutations
   - [ ] Toast notifications cho success/error
   - [ ] Loading states

### Phase 2: System Config Page QA

**Checklist cho `/system/modules/{module}/page.tsx`:**

1. **Layout & UI**
   - [ ] ModuleHeader hiển thị đúng icon, title, description
   - [ ] Tabs Config/Data hoạt động
   - [ ] ModuleStatus hiển thị đúng
   - [ ] ConventionNote hiển thị

2. **Config Tab**
   - [ ] Settings load đúng từ DB
   - [ ] Features toggle được
   - [ ] Fields toggle được (trừ isSystem)
   - [ ] Save button enable khi có changes
   - [ ] Save thành công update DB

3. **Data Tab**
   - [ ] Statistics hiển thị đúng count
   - [ ] Seed Data button tạo data mẫu
   - [ ] Clear All xóa hết data
   - [ ] Reset = Clear + Seed
   - [ ] Tables hiển thị preview data

4. **State Management**
   - [ ] Local state sync với server state
   - [ ] hasChanges detect đúng
   - [ ] Loading states hiển thị

### Phase 3: Admin List Page QA

**Checklist cho `/admin/{module}/page.tsx`:**

1. **Layout**
   - [ ] Title và breadcrumb đúng
   - [ ] Add button link đúng
   - [ ] Reset/Reseed button hoạt động

2. **Table**
   - [ ] Columns hiển thị đúng data
   - [ ] Sortable columns hoạt động
   - [ ] Search/filter hoạt động

3. **⚠️ PAGINATION (CRITICAL)**
   - [ ] Query `listModuleSettings` để lấy `{module}PerPage`
   - [ ] State `currentPage` và `totalPages`
   - [ ] `paginatedData` slice từ sortedData
   - [ ] Reset page khi filter/sort thay đổi
   - [ ] UI: Previous/Next buttons
   - [ ] UI: "Trang X / Y" và "Hiển thị A-B / Total"

4. **Selection & Bulk Actions**
   - [ ] Select all checkbox hoạt động
   - [ ] Individual select hoạt động
   - [ ] Bulk delete hoạt động
   - [ ] Selection count hiển thị đúng

5. **Row Actions**
   - [ ] Edit button link đúng
   - [ ] Delete button xóa item
   - [ ] View/External link (nếu có) hoạt động

6. **Empty State**
   - [ ] Hiển thị message khi không có data
   - [ ] Hiển thị message khi search không có kết quả

### Phase 4: Admin Create/Edit Pages QA

**Checklist cho create/edit pages:**

1. **Form Layout**
   - [ ] Tất cả fields hiển thị
   - [ ] Labels đúng
   - [ ] Required fields có marker
   - [ ] Help text (nếu có)

2. **Form Validation**
   - [ ] Required fields validate
   - [ ] Format validation (email, url, etc.)
   - [ ] Unique constraints (slug, etc.)
   - [ ] Error messages hiển thị rõ

3. **Form Submission**
   - [ ] Submit button có loading state
   - [ ] Success redirect đúng
   - [ ] Error hiển thị toast
   - [ ] Data persist đúng trong DB

4. **Edit Page Specific**
   - [ ] Load existing data đúng
   - [ ] Pre-fill form fields
   - [ ] Update không tạo duplicate
   - [ ] Cancel quay về list

### Phase 5: Convex Backend QA

**Checklist cho `/convex/{module}.ts`:**

1. **Queries**
   - [ ] listAll trả về đúng format
   - [ ] getById handle null case
   - [ ] Indexes được sử dụng đúng
   - [ ] Return type validators đúng

2. **Mutations**
   - [ ] create validate input
   - [ ] update check existing
   - [ ] remove handle cascade deletes
   - [ ] Unique constraints enforce

3. **Security**
   - [ ] Không có sensitive data leak
   - [ ] Auth checks (nếu cần)

### Phase 6: Integration QA

**Kiểm tra tích hợp giữa các phần:**

1. **⚠️ System ↔ Admin (CRITICAL)**
   - [ ] **Feature toggle ẢNH HƯỞNG admin UI:**
     - [ ] Tắt feature → ẩn filter/column tương ứng ở list page
     - [ ] Tắt feature → ẩn field tương ứng ở create/edit form
     - [ ] Query `listModuleFeatures` để check enabled features
     - [ ] VD: `enableFolders=false` → ẩn folder filter + folder field trong edit
   - [ ] Field toggle ảnh hưởng form
   - [ ] **Settings apply đúng:**
     - [ ] `{module}PerPage` → Pagination trong admin list page
     - [ ] `defaultStatus` → Default value khi create
     - [ ] Các settings khác ảnh hưởng behavior

2. **Frontend ↔ Backend**
   - [ ] Data flow đúng
   - [ ] Real-time updates (Convex reactivity)
   - [ ] Error handling end-to-end

3. **Cross-module**
   - [ ] Relations hoạt động (categoryId, authorId, etc.)
   - [ ] Cascade deletes hoạt động
   - [ ] Statistics accurate

## Output Format

### Issue Ticket Template

```markdown
## 🐛 [MODULE_NAME] Issue Title

**Severity:** Critical / High / Medium / Low
**Type:** Bug / Enhancement / Code Quality

### Description
[Mô tả ngắn gọn vấn đề]

### Steps to Reproduce
1. Step 1
2. Step 2
3. Expected: X
4. Actual: Y

### Location
- File: `path/to/file.tsx`
- Line: 123
- Component/Function: `ComponentName`

### Suggested Fix
[Code snippet hoặc hướng giải quyết]

### Related
- [ ] Related issue #X
- [ ] Blocks feature Y
```

### QA Report Template

```markdown
# QA Report: [Module Name]

## Summary
- Total Issues: X
- Critical: X | High: X | Medium: X | Low: X
- Pass Rate: X%

## Checklist Results

### System Config Page
- [x] Item passed
- [ ] ❌ Item failed - Issue #1

### Admin List Page
...

### Admin Create/Edit Pages
...

### Convex Backend
...

### Integration
...

## Issues Found

### Issue #1: [Title]
[Details...]

## Recommendations
1. [Recommendation]
```

## Quick Reference

### Common Issues to Check

1. **Missing Loading States**
   ```tsx
   // Bad
   if (!data) return null;
   
   // Good
   if (!data) return <Loader2 className="animate-spin" />;
   ```

2. **Missing Error Handling**
   ```tsx
   // Bad
   await mutation();
   
   // Good
   try {
     await mutation();
     toast.success('Done');
   } catch {
     toast.error('Error');
   }
   ```

3. **Type Safety Issues**
   ```tsx
   // Bad
   const id = params.id as any;
   
   // Good
   const id = params.id as Id<"posts">;
   ```

4. **Missing Cascade Delete**
   ```tsx
   // Bad - orphan comments
   await ctx.db.delete(postId);
   
   // Good
   const comments = await ctx.db.query("comments")
     .withIndex("by_postId")
     .collect();
   for (const c of comments) await ctx.db.delete(c._id);
   await ctx.db.delete(postId);
   ```

5. **Inconsistent State**
   ```tsx
   // Bad - state mismatch
   setLocalFeatures(newFeatures);
   // Forgot to update linked fields
   
   // Good
   setLocalFeatures(newFeatures);
   setLocalFields(prev => prev.map(f => 
     f.linkedFeature === key ? {...f, enabled: newFeatures[key]} : f
   ));
   ```

6. **⚠️ Missing Feature Toggle in Admin UI (CRITICAL)**
   ```tsx
   // Bad - không check feature toggle
   function MediaContent() {
     const foldersData = useQuery(api.media.getFolders);
     return (
       // Folder filter luôn hiển thị dù feature bị tắt
       <select>{foldersData?.map(f => <option>{f}</option>)}</select>
     );
   }
   
   // Good - check feature toggle từ System Config
   const MODULE_KEY = 'media';
   function MediaContent() {
     const foldersData = useQuery(api.media.getFolders);
     const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
     
     const enabledFeatures = useMemo(() => {
       const features: Record<string, boolean> = {};
       featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
       return features;
     }, [featuresData]);
     
     const showFolders = enabledFeatures.enableFolders ?? true;
     
     return (
       // Folder filter chỉ hiển thị khi feature bật
       {showFolders && foldersData && (
         <select>{foldersData.map(f => <option>{f}</option>)}</select>
       )}
     );
   }
   ```

7. **⚠️ Missing Pagination from Settings (CRITICAL)**
   ```tsx
   // Bad - không dùng settings
   const sortedPosts = useSortableData(filteredPosts, sortConfig);
   // Hiển thị tất cả sortedPosts trong table
   
   // Good - dùng settings từ System Config
   const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'posts' });
   const postsPerPage = useMemo(() => {
     const setting = settingsData?.find(s => s.settingKey === 'postsPerPage');
     return (setting?.value as number) || 10;
   }, [settingsData]);
   
   const [currentPage, setCurrentPage] = useState(1);
   const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
   const paginatedPosts = useMemo(() => {
     const start = (currentPage - 1) * postsPerPage;
     return sortedPosts.slice(start, start + postsPerPage);
   }, [sortedPosts, currentPage, postsPerPage]);
   
   // Hiển thị paginatedPosts trong table + pagination UI
   ```

8. **⚠️ Missing Image Compression on Upload (Media Module)**
   ```tsx
   // Bad - upload file gốc không compress
   const response = await fetch(uploadUrl, {
     method: 'POST',
     headers: { 'Content-Type': file.type },
     body: file, // File gốc, có thể rất lớn
   });
   
   // Good - compress image 85% trước khi upload
   const COMPRESSION_QUALITY = 0.85;
   
   async function compressImage(file: File, quality: number): Promise<Blob> {
     if (!file.type.startsWith('image/') || file.type === 'image/png') {
       return file; // Skip PNG to preserve transparency
     }
     return new Promise((resolve) => {
       const img = new Image();
       img.onload = () => {
         const canvas = document.createElement('canvas');
         canvas.width = img.width;
         canvas.height = img.height;
         canvas.getContext('2d')?.drawImage(img, 0, 0);
         canvas.toBlob(
           (blob) => resolve(blob && blob.size < file.size ? blob : file),
           'image/jpeg',
           quality
         );
       };
       img.src = URL.createObjectURL(file);
     });
   }
   
   const compressedBlob = await compressImage(file, COMPRESSION_QUALITY);
   const response = await fetch(uploadUrl, {
     method: 'POST',
     headers: { 'Content-Type': 'image/jpeg' },
     body: compressedBlob,
   });
   ```

 9. **⚠️ Missing Storage Cleanup on Delete**
    ```tsx
    // Bad - chỉ xóa DB record, không xóa file storage
    export const remove = mutation({
      handler: async (ctx, args) => {
        await ctx.db.delete(args.id); // Storage file orphaned!
      },
    });
    
    // Good - giải phóng references và gọi safe cleanup qua FLS gateway
    export const remove = mutation({
      handler: async (ctx, args) => {
        const media = await ctx.db.get(args.id);
        if (!media) throw new Error("Media not found");
        
        // FLS Safe Cleanup: Giải phóng reference
        const { removedStorageIds } = await removeOwnerFileReferences(ctx, {
          ownerTable: "media",
          ownerId: args.id,
        }, {
          previousStorageIds: [media.storageId],
        });
        
        await ctx.db.delete(args.id);
        
        // Dọn dẹp an toàn qua Convex storage cleanup mutation
        for (const storageId of removedStorageIds) {
          await ctx.runMutation(api.storage.cleanupStorageIfUnreferenced, { storageId });
        }
      },
    });
    ```

10. **⚠️ LexicalEditor Image Upload Issues (CRITICAL)**
    ```tsx
    // Bad - insert image trực tiếp gây lỗi "Only element or decorator nodes"
    editor.update(() => {
      const imgHtml = `<img src="${url}" />`;
      const dom = parser.parseFromString(imgHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      selection.insertNodes(nodes); // ERROR: TextNode không insert được
    });
    
    // Good - wrap trong <p> và filter valid nodes
    editor.update(() => {
      const imgHtml = `<p><img src="${url}" style="max-width: 100%;" /></p>`;
      const dom = parser.parseFromString(imgHtml, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      
      // Filter: chỉ ElementNode hoặc DecoratorNode
      const validNodes = nodes.filter(node => 
        $isElementNode(node) || $isDecoratorNode(node)
      );
      
      if (validNodes.length > 0) {
        selection.insertNodes(validNodes);
      }
    });
    ```

    **⚠️ Quan trọng: Base64 Image Handling**
    - Khi user paste ảnh vào editor, browser tạo base64 string
    - KHÔNG lưu base64 vào DB (quá lớn, chậm queries)
    - Cần: PasteImagePlugin để intercept paste → upload file → insert URL
    
    ```tsx
    // PasteImagePlugin - auto upload pasted images
    const PasteImagePlugin = ({ onImageUpload }) => {
      const [editor] = useLexicalComposerContext();
      
      useEffect(() => {
        const handlePaste = async (event: ClipboardEvent) => {
          const items = event.clipboardData?.items;
          for (const item of Array.from(items || [])) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const url = await onImageUpload(file); // Upload + compress 85%
                // Insert URL instead of base64
                editor.update(() => {
                  const imgHtml = `<p><img src="${url}" /></p>`;
                  // ... insert logic
                });
              }
            }
          }
        };
        
        const root = editor.getRootElement();
        root?.addEventListener('paste', handlePaste);
        return () => root?.removeEventListener('paste', handlePaste);
      }, [editor, onImageUpload]);
      
      return null;
    };
    ```

11. **⚠️ LexicalEditor InitialContent Loading Issues**
    ```tsx
    // Bad - append trực tiếp có thể gây lỗi với TextNode
    const InitialContentPlugin = ({ initialContent }) => {
      useEffect(() => {
        editor.update(() => {
          const nodes = $generateNodesFromDOM(editor, dom);
          root.append(...nodes); // ERROR nếu có TextNode
        });
      }, []);
    };
    
    // Good - filter và wrap TextNode trong ParagraphNode
    const InitialContentPlugin = ({ initialContent }) => {
      useEffect(() => {
        editor.update(() => {
          const nodes = $generateNodesFromDOM(editor, dom);
          const validNodes: LexicalNode[] = [];
          
          for (const node of nodes) {
            if ($isElementNode(node) || $isDecoratorNode(node)) {
              validNodes.push(node);
            } else if ($isTextNode(node)) {
              const text = node.getTextContent().trim();
              if (text) {
                const paragraph = $createParagraphNode();
                paragraph.append(node);
                validNodes.push(paragraph);
              }
            }
          }
          
          if (validNodes.length > 0) {
            root.append(...validNodes);
          }
        });
      }, []);
    };
    ```

12. **⚠️ Storage Cleanup cho nhiều Module**
    ```tsx
    // Bad - chỉ check 1 folder
    if (args.folder === "posts") {
      const posts = await ctx.db.query("posts").collect();
      // check...
    }
    
    // Good - check tất cả folders liên quan
    let isUsed = false;
    
    if (args.folder === "posts" || args.folder === "posts-content") {
      const posts = await ctx.db.query("posts").collect();
      isUsed = posts.some(post => 
        post.thumbnail === url || 
        (post.content && post.content.includes(url))
      );
    }
    
    if (args.folder === "products" || args.folder === "products-content") {
      const products = await ctx.db.query("products").collect();
      isUsed = isUsed || products.some(product => 
        product.image === url || 
        (product.images && product.images.includes(url)) ||
        (product.description && product.description.includes(url))
      );
    }
    ```

13. **⚠️ LexicalEditor Custom ImageNode - Resizable & Persistent (CRITICAL)**
    
    **Vấn đề:** Dùng `$generateNodesFromDOM` với `<img>` không tạo được node đúng vì Lexical mặc định không có ImageNode.
    
    **Giải pháp:** Tạo custom ImageNode extends DecoratorNode với đầy đủ methods.
    
    ```tsx
    // File: app/admin/components/nodes/ImageNode.tsx
    
    // 1. ImageNode class - PHẢI có exportDOM để save HTML
    export class ImageNode extends DecoratorNode<JSX.Element> {
      __src: string;
      __altText: string;
      __width?: number;
      __height?: number;

      static getType(): string { return 'image'; }
      
      static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
      }

      // ⚠️ CRITICAL: exportDOM để $generateHtmlFromNodes tạo được <img> tag
      exportDOM(): DOMExportOutput {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__altText);
        if (this.__width) {
          element.setAttribute('width', String(this.__width));
          element.style.width = `${this.__width}px`;
        }
        if (this.__height) {
          element.setAttribute('height', String(this.__height));
          element.style.height = `${this.__height}px`;
        }
        return { element };
      }

      // importDOM để load lại từ HTML
      static importDOM(): DOMConversionMap | null {
        return {
          img: () => ({
            conversion: (domNode: HTMLElement) => {
              if (domNode instanceof HTMLImageElement) {
                const { src, alt } = domNode;
                let width = domNode.getAttribute('width');
                let height = domNode.getAttribute('height');
                // Also check inline style
                if (!width && domNode.style.width) {
                  width = domNode.style.width.replace('px', '');
                }
                if (!height && domNode.style.height) {
                  height = domNode.style.height.replace('px', '');
                }
                return { 
                  node: $createImageNode({ 
                    src, 
                    altText: alt || '',
                    width: width ? parseInt(width, 10) : undefined,
                    height: height ? parseInt(height, 10) : undefined,
                  }) 
                };
              }
              return null;
            },
            priority: 0,
          }),
        };
      }

      // setWidthAndHeight cho resize functionality
      setWidthAndHeight(width: number, height: number): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
      }

      // decorate render ImageComponent với resize handles
      decorate(): JSX.Element {
        return (
          <ImageComponent
            src={this.__src}
            altText={this.__altText}
            width={this.__width}
            height={this.__height}
            nodeKey={this.getKey()}
          />
        );
      }
    }
    
    // 2. ImageComponent với selection và resize handles
    function ImageComponent({ src, altText, width, height, nodeKey }) {
      const imageRef = useRef<HTMLImageElement>(null);
      const [editor] = useLexicalComposerContext();
      const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
      const [isResizing, setIsResizing] = useState(false);

      // Click to select
      const onClick = useCallback((event: MouseEvent) => {
        if (event.target === imageRef.current) {
          clearSelection();
          setSelected(true);
          return true;
        }
        return false;
      }, [setSelected, clearSelection]);

      // Delete/Backspace to remove
      const onDelete = useCallback((event: KeyboardEvent) => {
        if (isSelected && $isNodeSelection($getSelection())) {
          event.preventDefault();
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) node.remove();
        }
        return false;
      }, [isSelected, nodeKey]);

      // onResizeEnd updates node
      const onResizeEnd = (nextWidth: number, nextHeight: number) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setWidthAndHeight(nextWidth, nextHeight);
          }
        });
      };

      const isFocused = isSelected || isResizing;

      return (
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <img
            ref={imageRef}
            src={src}
            alt={altText}
            style={{
              width: width ? `${width}px` : 'auto',
              height: height ? `${height}px` : 'auto',
              outline: isFocused ? '2px solid #3b82f6' : 'none',
            }}
          />
          {isFocused && (
            <ImageResizer
              imageRef={imageRef}
              onResizeEnd={onResizeEnd}
              editor={editor}
            />
          )}
        </div>
      );
    }
    
    // 3. ImageResizer với 8 handles (4 góc + 4 cạnh)
    function ImageResizer({ imageRef, onResizeStart, onResizeEnd, editor }) {
      const handlePointerDown = (event, corner) => {
        const image = imageRef.current;
        const { width, height } = image.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const ratio = width / height;
        
        const handlePointerMove = (moveEvent) => {
          const diffX = moveEvent.clientX - startX;
          let newWidth = width + diffX;
          let newHeight = newWidth / ratio; // Maintain aspect ratio
          image.style.width = `${newWidth}px`;
          image.style.height = `${newHeight}px`;
        };
        
        const handlePointerUp = () => {
          onResizeEnd(image.clientWidth, image.clientHeight);
          document.removeEventListener('pointermove', handlePointerMove);
          document.removeEventListener('pointerup', handlePointerUp);
        };
        
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
      };
      
      return (
        <>
          {/* 8 resize handles: nw, n, ne, e, se, s, sw, w */}
          <div style={{ position: 'absolute', top: -5, left: -5, cursor: 'nw-resize' }}
               onPointerDown={(e) => handlePointerDown(e, 'nw')} />
          {/* ... other 7 handles ... */}
        </>
      );
    }
    
    // 4. ImagesPlugin - đăng ký INSERT_IMAGE_COMMAND
    const ImagesPlugin = () => {
      const [editor] = useLexicalComposerContext();
      
      useEffect(() => {
        return editor.registerCommand(
          INSERT_IMAGE_COMMAND,
          (payload) => {
            const imageNode = $createImageNode(payload);
            // Insert logic...
            return true;
          },
          COMMAND_PRIORITY_EDITOR,
        );
      }, [editor]);
      
      return null;
    };
    ```
    
    **Đăng ký ImageNode trong LexicalEditor:**
    ```tsx
    // LexicalEditor.tsx
    import ImagesPlugin, { ImageNode, INSERT_IMAGE_COMMAND } from './nodes/ImageNode';
    
    const initialConfig = {
      namespace: 'MyEditor',
      nodes: [
        HeadingNode, QuoteNode, ListNode, ListItemNode, 
        AutoLinkNode, LinkNode,
        ImageNode  // ⚠️ PHẢI đăng ký ImageNode
      ],
    };
    
    // Sử dụng command để insert image
    const handleImageUpload = async () => {
      const url = await uploadImage(file);
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: url, altText: '' });
    };
    
    // Trong LexicalComposer
    <LexicalComposer initialConfig={initialConfig}>
      <ImagesPlugin />  {/* ⚠️ PHẢI có plugin này */}
      {/* ... other plugins */}
    </LexicalComposer>
    ```
    
    **Checklist ImageNode:**
    - [ ] ImageNode extends DecoratorNode
    - [ ] `exportDOM()` tạo `<img>` với src, alt, width, height
    - [ ] `importDOM()` parse `<img>` thành ImageNode
    - [ ] `setWidthAndHeight()` cho resize
    - [ ] ImageComponent với `useLexicalNodeSelection`
    - [ ] ImageResizer với pointer events
    - [ ] ImagesPlugin đăng ký INSERT_IMAGE_COMMAND
    - [ ] ImageNode đăng ký trong `initialConfig.nodes`

## Modules đã QA OK (Reference)

- ✅ **Posts** - Module chuẩn với đầy đủ features + pagination
- ✅ **Comments** - Module với full CRUD + pagination
- ✅ **Media** - Module với compression 85%, feature toggle, storage cleanup
- ✅ **Products** - Module với pagination, image upload, cascade delete, feature toggles

## Modules cần QA

Xem danh sách tại: `/system/modules/`
- Products
- Orders
- Customers
- Wishlist
- Notifications
- Promotions
- Cart
- Comments
- Users
- Roles
- Menus
- Media
- Analytics
- Settings
- Homepage

## Tips

1. **Bắt đầu từ Code Review** - Đọc code trước, tìm issues obvious
2. **So sánh với Posts module** - Dùng làm reference
3. **Focus vào Critical paths** - CRUD operations quan trọng nhất
4. **Tạo ticket rõ ràng** - Giúp fix nhanh hơn
5. **Check cả edge cases** - Empty state, error state, boundary conditions
