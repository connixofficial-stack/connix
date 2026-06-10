'use client';

import React, { useRef, useState } from 'react';
import { Button } from '../../../components/ui';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HeroForm } from '../../hero/_components/HeroForm';
import { DEFAULT_HERO_CORNER_RADIUS, DEFAULT_HERO_SPACING, type HeroContent, type HeroCornerRadius, type HeroSlide, type HeroSpacing, type HeroStyle } from '../../hero/_types';
import { DEFAULT_HERO_CONTENT } from '../../hero/_lib/constants';
import { HeroPreview } from '../../hero/_components/HeroPreview';
import { detectMediaType } from '@/lib/utils/media';
import { useDraftFileCleanup } from '../../_shared/hooks/useDraftFileCleanup';

const needsContentForm = (style: HeroStyle) => ['fullscreen', 'conquest', 'split', 'parallax'].includes(style);

const DEMO_HERO_SLIDES: HeroSlide[] = [
  { id: 'demo-1', link: '/khuyen-mai', url: '/demo/brand-banners/banner-1.webp' },
  { id: 'demo-2', link: '/san-pham-moi', url: '/demo/brand-banners/banner-2.webp' },
  { id: 'demo-3', link: '/bo-suu-tap', url: '/demo/brand-banners/banner-3.webp' },
  { id: 'demo-4', link: '', url: '/demo/brand-banners/banner-4.webp' },
];

export default function HeroCreatePage() {
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting, router } = useComponentForm('Hero Banner', 'Hero');
  const draftOwnerKeyRef = useRef(`home-component:hero:create:${Date.now()}:${Math.random().toString(36).slice(2)}`);
  const { commitUploads, trackUpload } = useDraftFileCleanup(draftOwnerKeyRef.current);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState('Hero', { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState('Hero', { seedCustomFromSettingsWhenTypeEmpty: true });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    { id: 'slide-1', link: '', url: '' }
  ]);
  const [heroStyle, setHeroStyle] = useState<HeroStyle>('slider');
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [cornerRadius, setCornerRadius] = useState<HeroCornerRadius>(DEFAULT_HERO_CORNER_RADIUS);
  const [spacing, setSpacing] = useState<HeroSpacing>(DEFAULT_HERO_SPACING);

  const previewSlides = heroSlides.map((s, idx) => ({ 
    id: idx + 1, 
    image: s.url,
    link: s.link,
    mediaType: detectMediaType(s.url),
  }));
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const handleUseDemoImages = () => {
    setHeroSlides(DEMO_HERO_SLIDES.map((slide) => ({ ...slide })));
  };

  const onSubmit = async (e: React.FormEvent) => {
    const id = await handleSubmit(e, {
      content: needsContentForm(heroStyle) ? heroContent : undefined,
      cornerRadius,
      noBorderRadius: cornerRadius === 'none',
      spacing,
      slides: heroSlides.map(s => ({
        image: s.url || s.image,
        link: s.link,
        mediaType: detectMediaType(s.url),
        ...(s.storageId ? { storageId: s.storageId } : {}),
      })),
      style: heroStyle,
    }, { redirect: false });
    if (!id) {
      return;
    }
    await commitUploads(heroSlides.map(slide => slide.storageId).filter((storageId): storageId is NonNullable<typeof storageId> => Boolean(storageId)));
    router.push('/admin/home-components');
  };

  return (
    <ComponentFormWrapper
      type="Hero"
      title={title}
      setTitle={setTitle}
      active={active}
      setActive={setActive}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      customState={customState}
      showCustomBlock={showCustomBlock}
      setCustomState={setCustomState}
      systemColors={systemColors}
      customFontState={customFontState}
      showFontCustomBlock={showFontCustomBlock}
      setCustomFontState={setCustomFontState}
    >
      <HeroForm
        heroSlides={heroSlides}
        setHeroSlides={setHeroSlides}
        heroStyle={heroStyle}
        heroContent={heroContent}
        setHeroContent={setHeroContent}
        cornerRadius={cornerRadius}
        setCornerRadius={setCornerRadius}
        spacing={spacing}
        setSpacing={setSpacing}
        defaultExpanded={true}
        onUploadComplete={({ storageId, folder }) => trackUpload(storageId, folder)}
        actions={(
          <Button type="button" variant="outline" size="sm" onClick={handleUseDemoImages}>
            Dùng ảnh demo
          </Button>
        )}
      />

      <HeroPreview 
        slides={previewSlides} 
        brandColor={effectiveColors.primary}
        secondary={effectiveColors.secondary}
        mode={effectiveColors.mode}
        selectedStyle={heroStyle}
        onStyleChange={setHeroStyle}
        content={heroContent}
        cornerRadius={cornerRadius}
        spacing={spacing}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
