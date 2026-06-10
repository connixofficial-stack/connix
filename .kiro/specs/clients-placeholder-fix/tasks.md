# Tasks: Fix Clients Component Placeholder & Preview

## Implementation Tasks

- [x] 1. Analyze root cause
  - [x] 1.1 Read ClientsSectionShared.tsx to understand normalizeClientItems() logic
  - [x] 1.2 Identify filter logic that removes items with empty url
  - [x] 1.3 Verify renderLogoContent() has placeholder logic

- [x] 2. Fix normalizeClientItems() function
  - [x] 2.1 Remove `if (!url) return null;` check
  - [x] 2.2 Update dedupe logic to only dedupe items with url
  - [x] 2.3 Keep placeholder items (url rỗng) without deduplication

- [x] 3. Verify color tokens
  - [x] 3.1 Read colors.ts to check placeholder tokens
  - [x] 3.2 Confirm placeholderBackground uses neutral
  - [x] 3.3 Confirm placeholderIcon uses primary (per skill)

- [x] 4. Run TypeScript check
  - [x] 4.1 Execute `bunx tsc --noEmit`
  - [x] 4.2 Fix any type errors if found

- [x] 5. Commit changes
  - [x] 5.1 Commit with descriptive message

## Testing Tasks (Manual)

- [ ] 6. Test placeholder rendering
  - [ ] 6.1 Navigate to `/admin/home-components/create/clients`
  - [ ] 6.2 Click "Thêm" to add new slot without uploading
  - [ ] 6.3 Verify preview shows placeholder box with icon
  - [ ] 6.4 Verify placeholder has neutral background color

- [ ] 7. Test upload flow
  - [ ] 7.1 Add slot → verify placeholder appears
  - [ ] 7.2 Upload image → verify placeholder becomes image
  - [ ] 7.3 Verify smooth transition

- [ ] 8. Test empty state
  - [ ] 8.1 Remove all slots → verify empty state shows
  - [ ] 8.2 Add 1 slot → verify empty state disappears
  - [ ] 8.3 Verify empty state message is correct

- [ ] 9. Test all 6 styles
  - [ ] 9.1 Test marquee style with mix of images and placeholders
  - [ ] 9.2 Test dualRow style
  - [ ] 9.3 Test wave style
  - [ ] 9.4 Test grid style
  - [ ] 9.5 Test carousel style
  - [ ] 9.6 Test featured style

- [ ] 10. Test edge cases
  - [ ] 10.1 Add 3 empty slots → verify 3 placeholders show
  - [ ] 10.2 Upload duplicate images → verify only 1 shows
  - [ ] 10.3 Mix images and placeholders → verify correct rendering

## Verification Tasks

- [ ] 11. APCA contrast check
  - [ ] 11.1 Verify placeholderIcon on placeholderBackground >= 45 Lc
  - [ ] 11.2 Verify placeholderText on placeholderBackground >= 60 Lc

- [ ] 12. Dual-brand-color-system compliance
  - [ ] 12.1 Verify placeholder uses neutral colors (not primary/secondary tint)
  - [ ] 12.2 Verify icon uses primary solid (per skill Layer 2 rules)
  - [ ] 12.3 Verify no opacity/shadow decorative effects

## Documentation Tasks

- [x] 13. Update spec files
  - [x] 13.1 Create requirements.md
  - [x] 13.2 Create design.md
  - [x] 13.3 Create analysis.md
  - [x] 13.4 Create tasks.md

## Success Criteria

✅ All implementation tasks completed
⏳ Manual testing pending (requires running dev server)
⏳ APCA verification pending
✅ TypeScript check passed
✅ Code committed

## Notes

- Fix implemented: Removed url filter in normalizeClientItems()
- Dedupe logic updated: Only dedupe items with url
- Placeholder logic already existed in renderLogoContent(), now reachable
- No breaking changes, backward compatible
