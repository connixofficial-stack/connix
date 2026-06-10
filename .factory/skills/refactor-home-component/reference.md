# Hero Pattern Reference

## File structure (thực tế)
```
app/admin/home-components/_shared/
├── components/BrowserFrame.tsx
├── components/PreviewImage.tsx
├── components/PreviewWrapper.tsx
└── hooks/usePreviewDevice.tsx

app/admin/home-components/hero/
├── [id]/edit/page.tsx
├── _types/index.ts
├── _lib/constants.ts
└── _components/
    ├── HeroForm.tsx
    └── HeroPreview.tsx
```

## Types & constants
- `_types/index.ts`: `HeroStyle`, `HeroContent`, `HeroSlide`
- `_lib/constants.ts`: `HERO_STYLES`, `DEFAULT_HERO_CONTENT`

## Preview
- `HeroPreview.tsx` dùng `PreviewWrapper` + `BrowserFrame`
- Hỗ trợ multi-device (desktop/tablet/mobile)
- Tối thiểu 1 component render cho mỗi style
- Áp dụng dual brand colors (primary + secondary)

## Form
- `HeroForm.tsx` tách phần UI input
- Conditional fields theo style (ví dụ: chỉ hiện content ở fullscreen/split/parallax)

## Edit route
- `hero/[id]/edit/page.tsx`:
  - `useQuery` load component
  - `useMutation` update
  - Layout 2 cột: form + preview

## Redirect & cleanup
- Route cũ `app/admin/home-components/[id]/edit/page.tsx` redirect khi `type === 'hero'`
- Xoá preview trong `app/admin/home-components/previews.tsx`

## Commit tham chiếu
- `bb45763` — feat(home-components): split hero edit route
