## Nâng cấp Skill Dual Brand Color System v11

### 1. Thêm "Accent Prominence Calculator"
- Tạo helper function tự động tính visual weight dựa trên area estimates
- Phát hiện khi primary < 25% hoặc secondary < 5%
- Gợi ý cụ thể哪些 element cần chuyển màu

### 2. Thêm "Component Color Analyzer"
- Auto-scan component code để phân tích primary/secondary usage
- Đếm số element theo từng tier (XL/L/M/S)
- Tạo report chi tiết: "Component X đang dùng: Primary 15%, Secondary 20%, Neutral 65%"

### 3. Cải thiện Element-Level Color Rules
- Thêm quy tắc cho "Interactive Accent Elements" (buttons, links, hover states)
- Thêm quy tắc cho "Data Highlight Elements" (prices, stats, counts)
- Thêm quy tắc cho "Structural Elements" (dividers, borders, backgrounds)

### 4. Thêm "Color Harmony Validator"
- Check similarity giữa primary và secondary (ΔE < 20 = too similar)
- Gợi ý harmony scheme phù hợp với brand personality
- Auto-generate 3 secondary options từ primary

### 5. Tạo "Quick Fix Templates"
- Template cho common patterns: "Fix primary underuse", "Fix secondary invisible", "Fix heading colors"
- Code snippets sẵn sàng copy-paste cho từng component type
- Batch fix cho multiple components cùng lúc

### 6. Thêm "Accessibility Score"
- Tính điểm APCA cho tất cả text combinations
- Cảnh báo khi contrast < threshold
- Gợi ý adjustment (lightness/chroma)

### 7. Cải thiện Component Color Map
- Thêm cột "Last Updated" và "Status" (OK/Needs Review)
- Thêm filter theo status để dễ tracking
- Auto-detect khi component code thay đổi

### Files cần cập nhật:
1. `examples/color-utils.ts` - Thêm calculator functions
2. `examples/component-analyzer.ts` - New file
3. `examples/quick-fix-templates.md` - New file
4. `SKILL.md` - Cập nhật rules và add new sections
5. `checklist.md` - Thêm automated checks
6. `reference.md` - Thêm formulas và examples