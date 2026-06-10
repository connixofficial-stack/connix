 ---
 name: experience-qa-tester
 description: "QA Testing cho Experience Editor Pages - kiểm tra Preview Accuracy, Config Impact, Frontend Sync, Component Quality. Sử dụng khi: (1) QA experience pages sau khi tạo/refactor, (2) Kiểm tra preview có match frontend thực, (3) Verify toggles/configs thực sự hoạt động, (4) Audit cross-module sync, (5) Review trước khi deploy. Checklist 100+ items từ Senior QA perspective."
 version: 1.0.0
 ---
 
 # Experience QA Tester
 
 Skill này cung cấp **comprehensive QA checklist** để đánh giá Experience Editor Pages từ góc nhìn Senior QA với 100+ items kiểm tra.
 
 ## Khi nào sử dụng
 
 - QA experience pages sau khi tạo hoặc refactor
 - Verify preview component có match frontend page thực
 - Kiểm tra các toggles/configs thực sự có impact
 - Audit cross-module sync functionality
 - Review code quality trước deploy
 
 ## Quick Reference
 
 | Category | Items | Priority |
 |----------|-------|----------|
 | I. Preview Accuracy | 25 items | CRITICAL |
 | II. Config Impact | 18 items | CRITICAL |
 | III. Frontend Sync | 15 items | HIGH |
 | IV. Editor Components | 12 items | MEDIUM |
 | V. Preview Components | 15 items | HIGH |
 | VI. UX/Accessibility | 10 items | MEDIUM |
 | VII. Code Quality | 12 items | MEDIUM |
 | VIII. Cross-Page Consistency | 8 items | LOW |
 
 ---
 
 # COMPREHENSIVE QA CHECKLIST
 
 ## I. PREVIEW ACCURACY (25 items) - CRITICAL
 
 ### 1. Layout Structure Matching (1.1 - 1.8)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 1.1 | Preview layout type matches frontend | Compare `layoutStyle` in preview vs actual `/posts`, `/products` page |  |
 | 1.2 | Header section structure identical | Preview header có cùng elements (title, breadcrumb, meta) như frontend |  |
 | 1.3 | Content area structure correct | Main content grid/flex layout match frontend |  |
 | 1.4 | Sidebar position matches | Nếu có sidebar: left/right position giống frontend |  |
 | 1.5 | Footer section present | Preview có footer/related section như frontend |  |
 | 1.6 | Section ordering correct | Thứ tự các sections trong preview đúng như frontend |  |
 | 1.7 | Conditional sections render | Sections có conditional render (if enabled) hoạt động đúng |  |
 | 1.8 | Empty state layout correct | Khi không có data, layout vẫn đúng structure |  |
 
 ### 2. Visual Fidelity (1.9 - 1.16)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 1.9 | Font sizes match | So sánh text-sm, text-lg, text-xl giữa preview và frontend |  |
 | 1.10 | Font weights correct | Bold, semibold, normal weights giống nhau |  |
 | 1.11 | Colors consistent | brandColor, text colors, bg colors match |  |
 | 1.12 | Spacing identical | Padding, margin, gap values giống frontend |  |
 | 1.13 | Border radius match | Rounded corners cùng size |  |
 | 1.14 | Shadow styles correct | Box shadows match design |  |
 | 1.15 | Icon sizes/colors | Icons cùng size và color scheme |  |
 | 1.16 | Line heights | Text line-height không bị khác |  |
 
 ### 3. Responsive Preview (1.17 - 1.21)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 1.17 | Desktop preview (1920px) | DeviceToggle desktop → preview width đúng |  |
 | 1.18 | Tablet preview (768px) | DeviceToggle tablet → responsive breakpoint correct |  |
 | 1.19 | Mobile preview (375px) | DeviceToggle mobile → mobile layout render đúng |  |
 | 1.20 | Grid columns adjust | Grid cols thay đổi đúng khi switch device |  |
 | 1.21 | Elements stack correctly | Mobile: sidebar stack xuống dưới, không bị overlap |  |
 
 ### 4. Mock Data Quality (1.22 - 1.25)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 1.22 | Realistic content | Mock titles, descriptions có nghĩa, không lorem ipsum |  |
 | 1.23 | Correct data types | Dates format đúng (vi-VN), numbers có toLocaleString |  |
 | 1.24 | Appropriate item count | Desktop: 4-6 items, Mobile: 2-3 items |  |
 | 1.25 | Edge case representation | Long titles có line-clamp, missing image có fallback |  |
 
 ---
 
 ## II. CONFIG IMPACT (18 items) - CRITICAL
 
 ### 5. Toggle Visibility Impact (2.1 - 2.10)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 2.1 | Toggle instantly updates preview | Toggle ON/OFF → preview re-render trong <100ms |  |
 | 2.2 | `showSearch` toggle works | Toggle OFF → search box disappears from preview |  |
 | 2.3 | `showCategories` toggle works | Toggle OFF → category filter/chips disappear |  |
 | 2.4 | `showPagination` toggle works | Toggle OFF → pagination/load more button gone |  |
 | 2.5 | `showFilters` toggle works | Toggle OFF → filter sidebar/bar disappears |  |
 | 2.6 | `showSorting` toggle works | Toggle OFF → sort dropdown gone |  |
 | 2.7 | `showAuthor` toggle works | Toggle OFF → author name/avatar hidden |  |
 | 2.8 | `showShare` toggle works | Toggle OFF → share buttons gone |  |
 | 2.9 | `showComments` toggle works | Toggle OFF → comments section hidden |  |
 | 2.10 | `showRelated` toggle works | Toggle OFF → related posts section gone |  |
 
 ### 6. Layout Switch Impact (2.11 - 2.14)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 2.11 | Layout tab switch changes preview | Click different layout tab → preview changes immediately |  |
 | 2.12 | Each layout has independent config | Layout A: toggle ON, switch to B, toggle OFF → switch back to A should still be ON |  |
 | 2.13 | Config persists per layout | Save → reload → each layout retains its own config |  |
 | 2.14 | Default values correct per layout | New layout có sensible defaults (không all OFF) |  |
 
 ### 7. Select/Dropdown Impact (2.15 - 2.18)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 2.15 | Select changes preview | Change dropdown value → preview updates |  |
 | 2.16 | `filterPosition` select works | sidebar/top/none → filter bar position changes |  |
 | 2.17 | `resultsDisplayStyle` works | grid/list → items layout changes |  |
 | 2.18 | `orderSummaryPosition` works | right/bottom → summary position changes |  |
 
 ---
 
 ## III. FRONTEND SYNC (15 items) - HIGH
 
 ### 8. Config to Frontend Mapping (3.1 - 3.8)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 3.1 | Saved config reads correctly | Save in experience → check `api.settings.getByKey` returns correct value |  |
 | 3.2 | `layoutStyle` syncs | Experience saves "sidebar" → frontend `/posts` renders sidebar layout |  |
 | 3.3 | Toggle values sync | Experience `showSearch: false` → frontend hides search |  |
 | 3.4 | Default values match | `DEFAULT_CONFIG` in experience = default behavior in frontend |  |
 | 3.5 | EXPERIENCE_KEY correct | Key format: `{module}_list_ui`, `{module}_detail_ui` |  |
 | 3.6 | Frontend reads same key | `usePostsListConfig()` reads same key as experience saves to |  |
 | 3.7 | Type compatibility | ExperienceConfig type matches what frontend expects |  |
 | 3.8 | Migration handled | Old/legacy config format → new format conversion works |  |
 
 ### 9. Module Feature Sync (3.9 - 3.15)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 3.9 | Module disabled → controls disabled | If `postsModule.enabled = false` → related toggles show disabled state |  |
 | 3.10 | Module features sync to defaults | `enableLikes: true` in module → `showLikes: true` as default |  |
 | 3.11 | Cross-module queries work | `getModuleByKey`, `getModuleFeature` queries return data |  |
 | 3.12 | Disabled state visual feedback | Disabled toggles have opacity, cursor-not-allowed |  |
 | 3.13 | Module link navigates correctly | "Module liên quan" link → correct `/system/modules/{key}` page |  |
 | 3.14 | Module enabled status accurate | Icon shows green/red based on actual module status |  |
 | 3.15 | Feature flags respected | If module feature OFF, experience toggle should be disabled |  |
 
 ---
 
 ## IV. EDITOR COMPONENTS (12 items) - MEDIUM
 
 ### 10. Core Editor Components (4.1 - 4.6)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 4.1 | BrowserFrame renders correctly | Has address bar with URL, chrome styling, content area |  |
 | 4.2 | BrowserFrame URL matches page | `/cart` page shows "yoursite.com/cart" |  |
 | 4.3 | DeviceToggle switches smoothly | Click device → width transition animates (300ms) |  |
 | 4.4 | DeviceToggle size="sm" works | When in header, uses compact size |  |
 | 4.5 | ConfigPanel expand/collapse | Click toggle → panel slides up/down with animation |  |
 | 4.6 | LayoutTabs highlight active | Active tab has accent color, others are muted |  |
 
 ### 11. Control Components (4.7 - 4.12)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 4.7 | ControlCard groups controls | Has title, children render correctly |  |
 | 4.8 | ToggleRow toggle works | Click toggle → onChange fires, visual state updates |  |
 | 4.9 | ToggleRow disabled state | Disabled toggle has muted color, no interaction |  |
 | 4.10 | SelectRow dropdown works | Select option → onChange fires with value |  |
 | 4.11 | ExperienceModuleLink clickable | Link navigates to module page |  |
 | 4.12 | ExperienceHintCard renders hints | Array of hints displays as list items |  |
 
 ---
 
 ## V. PREVIEW COMPONENTS (15 items) - HIGH
 
 ### 12. Props and State (5.1 - 5.7)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 5.1 | All config props passed | Preview receives layoutStyle, showSearch, showCategories, etc. |  |
 | 5.2 | Props typed correctly | TypeScript types match between page and preview |  |
 | 5.3 | Default props sensible | Missing props have reasonable defaults |  |
 | 5.4 | Props changes trigger re-render | Toggle config → preview updates immediately |  |
 | 5.5 | Device prop passed | Preview receives `device` prop for responsive behavior |  |
 | 5.6 | BrandColor applied | Preview uses brandColor for accent styling |  |
 | 5.7 | No unnecessary re-renders | useMemo for expensive computations |  |
 
 ### 13. Preview Content Structure (5.8 - 5.15)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 5.8 | All layout variants implemented | fullwidth, sidebar, magazine each have distinct JSX |  |
 | 5.9 | Conditional rendering correct | `{showSearch && <SearchBox />}` pattern used |  |
 | 5.10 | Empty states handled | No data → shows "Không tìm thấy" message |  |
 | 5.11 | Long text truncated | line-clamp-2 for titles, line-clamp-3 for excerpts |  |
 | 5.12 | Images have fallbacks | Missing image → shows FileText icon placeholder |  |
 | 5.13 | Dates formatted correctly | Vietnamese locale: dd/MM/yyyy |  |
 | 5.14 | Numbers formatted | Views: 1234 → "1,234" or "1.234" |  |
 | 5.15 | Interactive elements disabled | Buttons/inputs have `disabled` attribute in preview |  |
 
 ---
 
 ## VI. UX/ACCESSIBILITY (10 items) - MEDIUM
 
 ### 14. Usability (6.1 - 6.5)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 6.1 | Toggle labels clear | User understands what each toggle controls |  |
 | 6.2 | Hints helpful | ExperienceHintCard provides actionable tips |  |
 | 6.3 | Module links discoverable | Easy to find related module settings |  |
 | 6.4 | Keyboard navigation | Tab through controls works, Enter toggles |  |
 | 6.5 | Focus states visible | Focused controls have ring/outline |  |
 
 ### 15. Visual Hierarchy (6.6 - 6.10)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 6.6 | Header compact | 48px height, not overwhelming |  |
 | 6.7 | Preview maximized | Preview area takes most of viewport |  |
 | 6.8 | Controls organized | Logical grouping in ControlCards |  |
 | 6.9 | Accent color consistent | Same color for buttons, toggles, tabs |  |
 | 6.10 | Dark mode supported | All elements render correctly in dark mode |  |
 
 ---
 
 ## VII. CODE QUALITY (12 items) - MEDIUM
 
 ### 16. Performance (7.1 - 7.4)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 7.1 | No excessive re-renders | React DevTools shows minimal renders on toggle |  |
 | 7.2 | Queries deduplicated | Same query not called multiple times |  |
 | 7.3 | useMemo for serverConfig | Expensive computations memoized |  |
 | 7.4 | useCallback for handlers | Event handlers memoized |  |
 
 ### 17. Error Handling (7.5 - 7.8)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 7.5 | Network error handled | Save fails → shows error toast |  |
 | 7.6 | Invalid config fallback | Corrupted data → uses DEFAULT_CONFIG |  |
 | 7.7 | Loading state shown | Data loading → shows "Đang tải..." |  |
 | 7.8 | Missing module graceful | Module not found → disabled state, not crash |  |
 
 ### 18. Save/Load Flow (7.9 - 7.12)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 7.9 | hasChanges accurate | No changes → "Đã lưu", changes → "Lưu thay đổi" |  |
 | 7.10 | Save button disabled correctly | No changes OR saving → disabled |  |
 | 7.11 | Save persists all values | All config fields saved to DB |  |
 | 7.12 | Page reload restores config | Refresh → same config displayed |  |
 
 ---
 
 ## VIII. CROSS-PAGE CONSISTENCY (8 items) - LOW
 
 ### 19. Pattern Consistency (8.1 - 8.8)
 
 | # | Check Item | How to Verify | Pass/Fail |
 |---|------------|---------------|-----------|
 | 8.1 | All 12 pages use compact header | `h-12 px-4` pattern consistent |  |
 | 8.2 | All pages use same BrowserFrame height | `maxHeight="calc(100vh - 320px)"` |  |
 | 8.3 | All pages use same panel height | `expandedHeight="220px"` |  |
 | 8.4 | Grid layout consistent | `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3` |  |
 | 8.5 | Save button styling consistent | Same size, icon, text pattern |  |
 | 8.6 | Accent colors match page theme | Cart=orange, Checkout=green, etc. |  |
 | 8.7 | EXPERIENCE_KEY naming consistent | `{module}_{type}_ui` format |  |
 | 8.8 | Toggle labels concise | No descriptions, labels self-explanatory |  |
 
 ---
 
 # QA EXECUTION GUIDE
 
 ## Step 1: Preparation
 
 ```bash
 # 1. Run dev server
 bun dev
 
 # 2. Open browser to experience page
 # http://localhost:3000/system/experiences/posts-list
 
 # 3. Open corresponding frontend page in another tab
 # http://localhost:3000/posts
 ```
 
 ## Step 2: Systematic Testing
 
 ### For Each Experience Page:
 
 1. **Open experience page** (`/system/experiences/{name}`)
 2. **Open frontend page** (`/{name}`) in split view
 3. **Compare visually** at each device size
 4. **Toggle each config** and verify preview changes
 5. **Save config** and verify frontend changes
 6. **Reload** and verify persistence
 
 ## Step 3: Document Findings
 
 ```markdown
 ## QA Report: {Experience Name}
 
 **Date**: YYYY-MM-DD
 **Tester**: {Name}
 **Status**: PASS / FAIL / PARTIAL
 
 ### Failed Items:
 | # | Issue | Severity | Notes |
 |---|-------|----------|-------|
 | 1.3 | Content area grid differs | HIGH | Preview uses gap-3, frontend uses gap-6 |
 
 ### Recommendations:
 1. Update ListPreview.tsx gap from gap-3 to gap-6
 ```
 
 ## Step 4: Prioritize Fixes
 
 | Severity | Action |
 |----------|--------|
 | CRITICAL | Fix before deploy |
 | HIGH | Fix within 24h |
 | MEDIUM | Add to backlog |
 | LOW | Nice to have |
 
 ---
 
 # EXPERIENCE PAGES REFERENCE
 
 | # | Page | Path | Key | Layouts |
 |---|------|------|-----|---------|
 | 1 | Posts List | `/system/experiences/posts-list` | `posts_list_ui` | fullwidth, sidebar, magazine |
 | 2 | Posts Detail | `/system/experiences/posts-detail` | `posts_detail_ui` | classic, modern, minimal |
 | 3 | Products List | `/system/experiences/products-list` | `products_list_ui` | grid, list, masonry |
 | 4 | Product Detail | `/system/experiences/product-detail` | `product_detail_ui` | gallery, full, compact |
 | 5 | Services List | `/system/experiences/services-list` | `services_list_ui` | grid, list |
 | 6 | Services Detail | `/system/experiences/services-detail` | `services_detail_ui` | classic, modern, minimal |
 | 7 | Wishlist | `/system/experiences/wishlist` | `wishlist_ui` | grid, list |
 | 8 | Cart | `/system/experiences/cart` | `cart_ui` | drawer, page |
 | 9 | Checkout | `/system/experiences/checkout` | `checkout_ui` | single-page, multi-step |
 | 10 | Comments/Rating | `/system/experiences/comments-rating` | `comments_rating_ui` | (no layouts) |
 | 11 | Contact | `/system/experiences/contact` | `contact_ui` | form-only, with-map, with-info |
 | 12 | Search | `/system/experiences/search` | `search_filter_ui` | search-only, with-filters, advanced |
 
 ---
 
 # COMMON ISSUES & FIXES
 
 ## Issue 1: Preview doesn't match frontend spacing
 
 **Symptom**: Gap between items different
 **Root Cause**: Preview uses `gap-3`, frontend uses `gap-6`
 **Fix**: Update preview component to match frontend
 
 ## Issue 2: Toggle doesn't impact preview
 
 **Symptom**: Toggle ON/OFF but preview unchanged
 **Root Cause**: Preview component not receiving prop or not using it
 **Fix**: 
 1. Check prop is passed: `<Preview showSearch={config.showSearch} />`
 2. Check preview uses it: `{showSearch && <SearchBox />}`
 
 ## Issue 3: Config doesn't sync to frontend
 
 **Symptom**: Save in experience, frontend unchanged
 **Root Cause**: 
 - Wrong EXPERIENCE_KEY
 - Frontend reading different setting key
 - Cache not invalidated
 **Fix**: Verify key matches, check `usePostsListConfig()` reads same key
 
 ## Issue 4: Layout-specific config lost
 
 **Symptom**: Switch layouts, config reverts to default
 **Root Cause**: Not using layout-specific structure `config.layouts[layoutStyle]`
 **Fix**: Ensure state structure is `{ layoutStyle, layouts: { a: {...}, b: {...} } }`
 
 ## Issue 5: Module disabled but toggle enabled
 
 **Symptom**: Can toggle features even when module is OFF
 **Root Cause**: Not checking `!module?.enabled` for disabled state
 **Fix**: Add `disabled={!module?.enabled}` to ToggleRow
 
 ---
 
 # FILES TO CHECK
 
 ```
 # Experience Pages
 app/system/experiences/*/page.tsx
 
 # Preview Components
 components/experiences/previews/
 ├── ListPreview.tsx        # PostsListPreview, ProductsListPreview
 ├── DetailPreview.tsx      # PostDetailPreview, ServiceDetailPreview
 ├── CartPreview.tsx
 ├── CheckoutPreview.tsx
 ├── WishlistPreview.tsx
 ├── ContactPreview.tsx
 ├── SearchFilterPreview.tsx
 └── CommentsRatingPreview.tsx
 
 # Frontend Pages (to compare with)
 app/(site)/posts/page.tsx
 app/(site)/posts/[slug]/page.tsx
 app/(site)/products/page.tsx
 app/(site)/products/[slug]/page.tsx
 
 # Frontend Layouts (source of truth)
 components/site/posts/layouts/
 components/site/products/layouts/
 
 # Editor Components
 components/experiences/editor/
 ├── BrowserFrame.tsx
 ├── DeviceToggle.tsx
 ├── ConfigPanel.tsx
 ├── LayoutTabs.tsx
 ├── ControlCard.tsx
 └── ToggleRow.tsx
 
 # Hooks & Utils
 lib/experiences/index.ts
 ```
 
 ---
 
 # AUTOMATION OPPORTUNITIES
 
 ## Visual Regression Testing
 
 ```typescript
 // Using Playwright for visual testing
 test('posts-list preview matches frontend', async ({ page }) => {
   // Capture preview
   await page.goto('/system/experiences/posts-list');
   await page.getByRole('button', { name: 'Desktop' }).click();
   const previewScreenshot = await page.locator('.browser-frame').screenshot();
   
   // Capture frontend
   await page.goto('/posts');
   const frontendScreenshot = await page.screenshot();
   
   // Compare
   expect(previewScreenshot).toMatchSnapshot('posts-list-preview.png');
   expect(frontendScreenshot).toMatchSnapshot('posts-list-frontend.png');
 });
 ```
 
 ## Config Impact Testing
 
 ```typescript
 test('showSearch toggle hides search box', async ({ page }) => {
   await page.goto('/system/experiences/posts-list');
   
   // Toggle OFF
   await page.getByLabel('Search').click();
   
   // Verify preview
   await expect(page.locator('.browser-frame input[placeholder="Tìm kiếm"]')).not.toBeVisible();
 });
 ```
