 ---
 name: experience-editor-uiux
 description: "Thiết kế UI/UX cho Experience pages với Full Preview + Floating Bottom Panel pattern. Sử dụng khi: (1) Tạo hoặc refactor Experience pages, (2) Cần preview full-width responsive, (3) Config theo layout-specific (mỗi layout có config riêng), (4) Cross-module sync (1 experience điều khiển nhiều modules). Pattern này dựa trên Shopify Theme Editor, WordPress Customizer, và Webflow Designer."
 version: 1.1.0
 ---
 
 # Experience Editor UI/UX
 
 Skill này cung cấp guidelines và patterns để thiết kế Experience pages với **Full Preview + Floating Bottom Panel** pattern.
 
 **Tối ưu chiều cao - tối đa hóa preview area:**
 
 ## Problem Statement
 ┌───────────────────────────────────────────────────────────────────────┐
 │ 🎨 Title                    [Desktop][Tablet][Mobile]    [Lưu thay đổi] │  ← 48px max
 ├───────────────────────────────────────────────────────────────────────┤
 │                                                                       │
 │                         FULL-WIDTH PREVIEW                            │
 │                    (height: calc(100vh - 48px - panel))               │
 │                                                                       │
 │                         [BrowserFrame content]                        │
 │                                                                       │
 ├─ [Grid][List][Masonry] ──────────────────────────────────────── [∨] ──┤  ← 40px (tabs bar)
 │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
 │  │ Control 1   │ │ Control 2   │ │ Control 3   │ │ Hints       │      │  ← ~180px expanded
 │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
 └───────────────────────────────────────────────────────────────────────┘
 │                   FULL-WIDTH PREVIEW                           │
 │                   (height: calc(100vh - header - panel))        │
 │                                                                 │
 │                   [Device Toggle: Desktop | Tablet | Mobile]    │
 │                                                                 │
 │                                                                 │
 ├─────────────────────────────────────────────────────────────────┤
 │  ┌───────────┬───────────┬───────────┐                         │
 │  │  Classic  │  Modern   │  Minimal  │  ← Layout Tabs          │
 │  ├───────────┴───────────┴───────────┤                         │
 │  │                                   │                         │
 │  │  Layout-specific config controls  │  ← Collapsible Panel    │
 │  │  (toggles, selects, inputs)       │                         │
 │  │                                   │                         │
 │  └───────────────────────────────────┘                         │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### Key Components
 
 1. **Preview Area** (main): Full-width, scrollable, với BrowserFrame
 2. **Device Toggle**: Desktop (1920px) / Tablet (768px) / Mobile (375px)
 3. **Layout Tabs**: Chuyển đổi giữa các layouts, mỗi layout có config riêng
 4. **Config Panel**: Collapsible, chứa settings cho layout đang active
 
 ### Height Optimization Rules
 
 | Component | Max Height | Notes |
 |-----------|-----------|-------|
 | Header | 48px | Icon + Title inline, DeviceToggle inline, Save button |
 | Preview | flex-1 | Chiếm toàn bộ space còn lại |
 | Panel tabs bar | 40px | LayoutTabs + collapse button |
 | Panel content | 180px | Grid of ControlCards khi expanded |
 | **Total overhead** | ~88px collapsed, ~268px expanded | Còn lại cho preview |
 
 ### Compact Header Pattern
 
 ```tsx
 <header className="h-12 px-4 flex items-center justify-between border-b">
   <div className="flex items-center gap-2">
     <Icon className="w-4 h-4 text-{color}" />
     <span className="font-semibold text-sm">Title</span>
   </div>
   <div className="flex items-center gap-3">
     <DeviceToggle value={device} onChange={setDevice} size="sm" />
     <Button size="sm" onClick={handleSave}>Lưu</Button>
   </div>
 </header>
 ```
 
 ## Data Structure
 
 ### Layout-Specific Config Pattern
 
 ```typescript
 // Mỗi layout có config object riêng
 type ExperienceConfig = {
   activeLayout: 'classic' | 'modern' | 'minimal';
   layouts: {
     classic: ClassicLayoutConfig;
     modern: ModernLayoutConfig;
     minimal: MinimalLayoutConfig;
   };
   // Shared settings (apply cho tất cả layouts)
   shared?: SharedConfig;
 };
 
 // Ví dụ: PostDetailExperienceConfig
 type PostDetailExperienceConfig = {
   activeLayout: 'classic' | 'modern' | 'minimal';
   layouts: {
     classic: {
       showAuthor: boolean;
       showDate: boolean;
       showShare: boolean;
       showComments: boolean;
       showRelated: boolean;
       sidebarPosition: 'left' | 'right';
       sidebarWidgets: ('toc' | 'recent' | 'tags')[];
     };
     modern: {
       showAuthor: boolean;
       showShare: boolean;
       showComments: boolean;
       showRelated: boolean;
       heroStyle: 'full' | 'split' | 'minimal';
       showExcerpt: boolean;
     };
     minimal: {
       showAuthor: boolean;
       showShare: boolean;
       showComments: boolean;
       showRelated: boolean;
       contentWidth: 'narrow' | 'medium' | 'wide';
       showTableOfContents: boolean;
     };
   };
 };
 ```
 
 ### Cross-Module Sync Pattern
 
 ```typescript
 // Experience có thể điều khiển settings từ nhiều modules
 type CrossModuleConfig = {
   // Main module settings
   posts: {
     showAuthorAvatar: boolean;
     showPublishDate: boolean;
   };
   // Related module settings
   comments: {
     enabled: boolean;
     showLikes: boolean;
     showReplies: boolean;
     maxDepth: number;
   };
 };
 
 // Sync với module settings khi save
 const syncToModules = async (config: CrossModuleConfig) => {
   await Promise.all([
     updateModuleSetting('posts', 'showAuthorAvatar', config.posts.showAuthorAvatar),
     updateModuleSetting('comments', 'enableLikes', config.comments.showLikes),
     // ... other syncs
   ]);
 };
 ```
 
 ## Component Architecture
 
 ### 1. ExperienceEditorLayout
 
 Main layout component:
 
 ```typescript
 interface ExperienceEditorLayoutProps {
   children: React.ReactNode;           // Preview content
   activeLayout: string;                // Current active layout
   layouts: LayoutOption[];             // Available layouts
   onLayoutChange: (layout: string) => void;
   renderControls: () => React.ReactNode; // Layout-specific controls
   isPanelExpanded?: boolean;
   onPanelToggle?: () => void;
 }
 
 type LayoutOption = {
   id: string;
   label: string;
   description?: string;
   icon?: LucideIcon;
 };
 ```
 
 ### 2. PreviewFrame
 
 Browser-like frame with device simulation:
 
 ```typescript
 interface PreviewFrameProps {
   children: React.ReactNode;
   device: 'desktop' | 'tablet' | 'mobile';
   url?: string;                        // Display URL in address bar
   maxHeight?: string;                  // Default: 520px
 }
 
 const deviceWidths = {
   desktop: 'w-full',
   tablet: 'w-[768px] max-w-full',
   mobile: 'w-[375px] max-w-full',
 };
 ```
 
 ### 3. LayoutTabs
 
 Tab component for switching layouts:
 
 ```typescript
 interface LayoutTabsProps {
   layouts: LayoutOption[];
   activeLayout: string;
   onChange: (layout: string) => void;
   accentColor?: string;                // Brand color for active state
 }
 ```
 
 ### 4. ConfigPanel
 
 Collapsible panel for layout-specific controls:
 
 ```typescript
 interface ConfigPanelProps {
   isExpanded: boolean;
   onToggle: () => void;
   children: React.ReactNode;
 }
 ```
 
 ### 5. SyncIndicator
 
 Shows cross-module sync status:
 
 ```typescript
 interface SyncIndicatorProps {
   modules: { key: string; name: string; synced: boolean }[];
 }
 ```
 
 ## Implementation Checklist
 
 ### Phase 1: Setup
 
 - [ ] Define experience config type with layout-specific structure
 - [ ] Create default config for each layout
 - [ ] Setup useExperienceConfig hook với hasChanges detection
 
 ### Phase 2: Preview Area
 
 - [ ] Full-width preview container (height: calc(100vh - header - panel))
 - [ ] BrowserFrame component với address bar
 - [ ] Device toggle (Desktop/Tablet/Mobile)
 - [ ] Preview component receives `config.layouts[activeLayout]`
 
 ### Phase 3: Bottom Panel
 
 - [ ] Layout tabs (always visible)
 - [ ] Collapsible config panel
 - [ ] Expand/collapse toggle button
 - [ ] Panel height: 200-300px expanded, ~50px collapsed
 
 ### Phase 4: Config Controls
 
 - [ ] Render controls based on activeLayout
 - [ ] Each layout has its own control set
 - [ ] Common patterns: toggles, selects, inputs
 - [ ] Group related controls in cards/sections
 
 ### Phase 5: Cross-Module Sync (if applicable)
 
 - [ ] Identify related modules
 - [ ] Add sync indicators
 - [ ] Sync to module settings on save
 - [ ] Handle conflicts (experience overrides module)
 
 ### Phase 6: Polish
 
 - [ ] Smooth transitions (150-300ms)
 - [ ] Loading states
 - [ ] Error handling
 - [ ] Keyboard shortcuts (Ctrl+S to save)
 
 ## Code Examples
 
 ### Basic Experience Page Structure
 
 ```typescript
 return (
   <div className="h-[calc(100vh-64px)] flex flex-col">
     {/* Compact Header - 48px */}
     <header className="h-12 px-4 flex items-center justify-between border-b bg-white dark:bg-slate-900">
       <div className="flex items-center gap-2">
         <LayoutTemplate className="w-4 h-4 text-blue-600" />
         <span className="font-semibold text-sm">Chi tiết bài viết</span>
       </div>
       <div className="flex items-center gap-3">
         <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
         <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}>
           {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
           <span className="ml-1.5">{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
         </Button>
       </div>
     </header>
     
     {/* Preview Area - flex-1 */}
     <main className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-950">
       <div className={`mx-auto transition-all ${deviceWidths[previewDevice]}`}>
         <BrowserFrame url="yoursite.com/posts/example">
           <PostDetailPreview {...getPreviewProps()} />
         </BrowserFrame>
       </div>
     </main>
     
     {/* Bottom Panel - Compact tabs bar 40px + content 180px */}
     <ConfigPanel
       isExpanded={isPanelExpanded}
       onToggle={() => setIsPanelExpanded(!isPanelExpanded)}
       expandedHeight="220px"
       leftContent={
         <LayoutTabs layouts={LAYOUTS} activeLayout={config.layoutStyle} onChange={...} />
       }
     >
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
         <ControlCard title="Khối hiển thị">...</ControlCard>
         <ControlCard title="Cấu hình">...</ControlCard>
         <ControlCard title="Module">...</ControlCard>
         <Card className="p-2"><ExperienceHintCard hints={HINTS} /></Card>
       </div>
     </ConfigPanel>
   </div>
 );
 ```
 
 ### Layout Controls Component
 
 ```typescript
 function ClassicLayoutControls({ 
   config, 
   onChange 
 }: { 
   config: ClassicConfig;
   onChange: <K extends keyof ClassicConfig>(key: K, value: ClassicConfig[K]) => void;
 }) {
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <ControlCard title="Thông tin bài viết">
         <ToggleRow label="Hiển thị tác giả" checked={config.showAuthor} onChange={v => onChange('showAuthor', v)} />
         <ToggleRow label="Hiển thị ngày đăng" checked={config.showDate} onChange={v => onChange('showDate', v)} />
         <ToggleRow label="Nút chia sẻ" checked={config.showShare} onChange={v => onChange('showShare', v)} />
       </ControlCard>
       
       <ControlCard title="Sidebar">
         <SelectRow 
           label="Vị trí sidebar" 
           value={config.sidebarPosition}
           options={[
             { value: 'left', label: 'Bên trái' },
             { value: 'right', label: 'Bên phải' },
           ]}
           onChange={v => onChange('sidebarPosition', v)}
         />
       </ControlCard>
       
       <ControlCard title="Nội dung liên quan">
         <ToggleRow label="Bình luận" checked={config.showComments} onChange={v => onChange('showComments', v)} />
         <ToggleRow label="Bài viết liên quan" checked={config.showRelated} onChange={v => onChange('showRelated', v)} />
       </ControlCard>
     </div>
   );
 }
 ```
 
 ### Compact Device Toggle (size="sm")
 
 ```typescript
 const devices = [
   { id: 'desktop', icon: Monitor, label: 'Desktop', width: '1920px' },
   { id: 'tablet', icon: Tablet, label: 'Tablet', width: '768px' },
   { id: 'mobile', icon: Smartphone, label: 'Mobile', width: '375px' },
 ] as const;
 
 function DeviceToggle({ 
   value, 
   onChange,
   size = 'default'
 }: { 
   value: 'desktop' | 'tablet' | 'mobile';
   onChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
   size?: 'sm' | 'default';
 }) {
   const iconSize = size === 'sm' ? 14 : 16;
   const padding = size === 'sm' ? 'p-1.5' : 'p-2';
   
   return (
     <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
       {devices.map(device => (
         <button
           key={device.id}
           onClick={() => onChange(device.id)}
           title={`${device.label} (${device.width})`}
           className={cn(
             padding,
             "rounded transition-all",
             value === device.id 
               ? "bg-white dark:bg-slate-700 shadow-sm" 
               : "text-slate-400 hover:text-slate-600"
           )}
         >
           <device.icon size={iconSize} />
         </button>
       ))}
     </div>
   );
 }
 ```
 
 ## Design Guidelines
 
 ### Layout Constraints
 
 - **Header**: Max 48px (h-12), compact với icon + title + controls inline
 - **Preview area**: `flex-1` (fills remaining space), padding 16px (p-4)
 - **Bottom panel tabs bar**: 40px (h-10)
 - **Bottom panel content**: 180px khi expanded
 - **Total panel height**: 220px expanded, 40px collapsed
 - **Minimum preview height**: 300px
 
 ### Compact ControlCard
 
 - Padding: p-2 thay vì p-3 hoặc p-4
 - Title: text-xs font-medium, mb-1.5
 - ToggleRow: py-1 thay vì py-1.5 hoặc py-2
 - Gap giữa cards: gap-3 thay vì gap-4
 
 ### Responsive Behavior
 
 - Desktop: Full layout as designed
 - Tablet: Panel có thể scroll horizontal nếu cần
 - Mobile: Panel stacks vertically, preview giảm height
 
 ### Colors & Theming
 
 - Use brand color từ settings cho active states
 - Maintain contrast ratio 4.5:1 cho text
 - Support dark mode
 
 ### Animations
 
 - Panel expand/collapse: 200ms ease-out
 - Device switch: 300ms transition
 - Layout tab switch: instant (không animation)
 
 ## Component Size Variants
 
 | Component | Default | Compact (sm) |
 |-----------|---------|--------------|
 | Header height | 64px | 48px |
 | Button padding | px-4 py-2 | px-3 py-1.5 |
 | Icon size | 20px | 14-16px |
 | DeviceToggle padding | p-2 | p-1.5 |
 | ControlCard padding | p-4 | p-2 |
 | ToggleRow padding | py-2 | py-1 |
 | Panel expanded | 280px | 220px |
 
 ## Cross-Module Sync Guidelines
 
 ### When to Use
 
 - Experience page controls UI features from multiple modules
 - Settings in experience should override module defaults
 - Need to keep experience and module in sync
 
 ### Implementation Pattern
 
 1. Experience page is the "source of truth" for UI config
 2. On save, sync relevant settings to module tables
 3. Module pages show read-only link to experience for UI settings
 4. Module pages remain master for data-related settings
 
 ### Example: Post Detail syncs with Comments Module
 
 ```typescript
 // Experience controls these Comments settings:
 const commentsSync = {
   'comments.enabled': config.layouts[config.activeLayout].showComments,
   'comments.enableLikes': config.layouts[config.activeLayout].showCommentLikes,
   'comments.enableReplies': config.layouts[config.activeLayout].showCommentReplies,
 };
 
 // On save, update both experience and module settings
 const handleSave = async () => {
   await Promise.all([
     saveExperienceConfig(EXPERIENCE_KEY, config),
     ...Object.entries(commentsSync).map(([key, value]) => 
       updateModuleSetting(key.split('.')[0], key.split('.')[1], value)
     ),
   ]);
 };
 ```
 
 ## Reference Files
 
 ### Current Implementation (VietAdmin)
 
 ```
 app/system/experiences/posts-list/page.tsx    # Simple layout selector
 app/system/experiences/posts-detail/page.tsx  # Cross-module sync example
 components/experiences/previews/              # Preview components
 lib/experiences/index.ts                      # Hooks and utilities
 ```
 
 ### Reusable Components (to be created)
 
 ```
 components/experiences/editor/
 ├── ExperienceEditorLayout.tsx   # Main layout component
 ├── PreviewFrame.tsx             # Browser-like preview frame
 ├── DeviceToggle.tsx             # Desktop/Tablet/Mobile switch
 ├── LayoutTabs.tsx               # Layout tab selector
 ├── ConfigPanel.tsx              # Collapsible bottom panel
 ├── ControlCard.tsx              # Grouped controls container
 ├── ToggleRow.tsx                # Toggle switch with label
 ├── SelectRow.tsx                # Select with label
 └── SyncIndicator.tsx            # Cross-module sync status
 ```
 
 ## Limitations
 
 - Pattern này phù hợp cho 2-5 layouts; nếu nhiều hơn cần horizontal scroll
 - Preview component cần được tối ưu để không gây performance issues
 - Cross-module sync có thể gây race conditions nếu user save quá nhanh
 
 ## Sources & Inspiration
 
 - Shopify Theme Editor: Full preview + sidebar controls
 - WordPress Customizer: Live preview + collapsible panels
 - Webflow Designer: Device simulation + property panels
 - Framer: Bottom panel + canvas-based editing
