'use client';

import React, { useState, useMemo } from 'react';
import { extractSectionHeaderConfig } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { toast } from 'sonner';
import { saveSnapshotComponent } from '../_lib/snapshotComponentSave';

// Imports
import { FaqForm } from '../../faq/_components/FaqForm';
import { FaqPreview } from '../../faq/_components/FaqPreview';
import { DEFAULT_FAQ_ITEMS, DEFAULT_FAQ_CONFIG } from '../../faq/_lib/constants';

import { VideoForm } from '../../video/_components/VideoForm';
import { VideoPreview } from '../../video/_components/VideoPreview';
import { normalizeVideoConfig, normalizeVideoStyle } from '../../video/_lib/constants';

import { TeamForm } from '../../team/_components/TeamForm';
import { TeamPreview } from '../../team/_components/TeamPreview';
import { normalizeTeamConfig, normalizeTeamMembers } from '../../team/_lib/constants';

import { TestimonialsForm } from '../../testimonials/_components/TestimonialsForm';
import { TestimonialsPreview } from '../../testimonials/_components/TestimonialsPreview';

import { HeroForm } from '../../hero/_components/HeroForm';
import { HeroPreview } from '../../hero/_components/HeroPreview';
import { DEFAULT_HERO_CONTENT } from '../../hero/_lib/constants';
import type { HeroSlide } from '../../hero/_types';

const normalizeHeroSlides = (slides: unknown): HeroSlide[] => {
  if (!Array.isArray(slides) || slides.length === 0) {
    return [{ id: 'slide-1', link: '', url: '' }];
  }

  return slides.map((slide, index) => {
    const item = typeof slide === 'object' && slide !== null ? slide as Record<string, unknown> : {};
    const image = typeof item.url === 'string'
      ? item.url
      : typeof item.image === 'string'
        ? item.image
        : '';

    const id = (typeof item.id === 'string' || typeof item.id === 'number') ? item.id : `slide-${index + 1}`;
    const mediaType = item.mediaType === 'image' || item.mediaType === 'video' ? item.mediaType : undefined;

    return {
      id,
      link: typeof item.link === 'string' ? item.link : '',
      mediaType,
      url: image,
    };
  });
};

export function SnapshotRouter2({
  component,
  snapshotId,
  payload,
  snapshotLabel,
  decodedKey,
  updateSnapshot,
  effectiveColors,
  fontStyle,
  onCancel,
}: any) {
  const [title, setTitle] = useState(component.title || '');
  const [active, setActive] = useState(component.active ?? true);
  const [isSaving, setIsSaving] = useState(false);
  
  const rawConfig = component.config || {};
  const [headerConfig, setHeaderConfig] = useState(() => {
    const extracted = extractSectionHeaderConfig(rawConfig);
    return {
      hideHeader: extracted.hideHeader ?? false,
      showTitle: extracted.showTitle ?? true,
      subtitle: extracted.subtitle ?? '',
      showSubtitle: extracted.showSubtitle ?? true,
      headerAlign: (extracted.headerAlign === 'center' || extracted.headerAlign === 'right') ? extracted.headerAlign as 'center' | 'left' | 'right' : 'left',
      titleColorPrimary: extracted.titleColorPrimary ?? false,
      subtitleAboveTitle: extracted.subtitleAboveTitle ?? false,
      uppercaseText: extracted.uppercaseText ?? false,
      showBadge: extracted.showBadge ?? true,
      badgeText: extracted.badgeText ?? '',
    };
  });
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);

  // States for Faq
  const [faqItems, setFaqItems] = useState(() => rawConfig.items?.length > 0 ? rawConfig.items : DEFAULT_FAQ_ITEMS);
  const [faqConfig, setFaqConfig] = useState(() => ({ ...DEFAULT_FAQ_CONFIG, ...rawConfig }));
  const [faqStyle, setFaqStyle] = useState(() => rawConfig.style ?? 'accordion');

  // States for Video
  const [videoConfig, setVideoConfig] = useState(() => normalizeVideoConfig(rawConfig));
  const [videoStyle, setVideoStyle] = useState(() => normalizeVideoStyle(rawConfig.style));

  // States for Team
  const teamNormalized = useMemo(() => normalizeTeamConfig(rawConfig), [rawConfig]);
  const [teamMembers, setTeamMembers] = useState(() => normalizeTeamMembers(rawConfig.members));
  const [teamConfig] = useState(() => teamNormalized);
  const [teamStyle, setTeamStyle] = useState(() => rawConfig.style ?? 'grid');

  // States for Testimonials
  const [testimonialsItems, setTestimonialsItems] = useState(() => rawConfig.items ?? []);
  const [testimonialsStyle, setTestimonialsStyle] = useState(() => rawConfig.style ?? 'cards');
  const [testimonialsConfig] = useState(() => rawConfig);

  // States for Hero
  const [heroSlides, setHeroSlides] = useState(() => normalizeHeroSlides(rawConfig.slides));
  const [heroContent, setHeroContent] = useState(() => ({ ...DEFAULT_HERO_CONTENT, ...rawConfig.content }));
  const [heroStyle, setHeroStyle] = useState(() => rawConfig.style ?? 'slider');
  const [noBorderRadius, setNoBorderRadius] = useState(() => rawConfig.noBorderRadius ?? false);

  const getConfig = () => {
    switch (component.type) {
      case 'FAQ': return { items: faqItems, style: faqStyle, ...faqConfig, ...headerConfig };
      case 'Video': return { ...videoConfig, style: videoStyle, ...headerConfig };
      case 'Team': return { ...teamConfig, members: teamMembers as any, style: teamStyle, ...headerConfig };
      case 'Testimonials': return { items: testimonialsItems, style: testimonialsStyle, ...testimonialsConfig, ...headerConfig };
      case 'Hero': return {
        slides: heroSlides.map((slide: any) => ({
          image: slide.url ?? slide.image ?? '',
          link: slide.link || '',
          mediaType: slide.mediaType,
        })),
        content: heroContent,
        style: heroStyle,
        noBorderRadius,
        ...headerConfig,
      };
      default: return rawConfig;
    }
  };

  const currentSnapshot = JSON.stringify(getConfig());
  const initialSnapshot = useMemo(() => JSON.stringify(rawConfig), [rawConfig]);
  const hasChanges = title !== component.title || active !== component.active || currentSnapshot !== initialSnapshot;

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (isSaving || !hasChanges) return;

    setIsSaving(true);
    try {
      await saveSnapshotComponent({
        active,
        component,
        config: getConfig(),
        decodedKey,
        label: snapshotLabel,
        payload,
        snapshotId,
        title,
        updateSnapshot,
      });
      toast.success('Đã lưu component');
      onCancel();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi lưu component');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <form onSubmit={handleSave}>
        <HeaderConfigSection
          {...headerConfig}
          title={title}
          onHideHeaderChange={(val) => setHeaderConfig(p => ({ ...p, hideHeader: val }))}
          onTitleChange={setTitle}
          onShowTitleChange={(val) => setHeaderConfig(p => ({ ...p, showTitle: val }))}
          onSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitle: val }))}
          onShowSubtitleChange={(val) => setHeaderConfig(p => ({ ...p, showSubtitle: val }))}
          onHeaderAlignChange={(val) => setHeaderConfig(p => ({ ...p, headerAlign: val }))}
          onTitleColorPrimaryChange={(val) => setHeaderConfig(p => ({ ...p, titleColorPrimary: val }))}
          onSubtitleAboveTitleChange={(val) => setHeaderConfig(p => ({ ...p, subtitleAboveTitle: val }))}
          onUppercaseTextChange={(val) => setHeaderConfig(p => ({ ...p, uppercaseText: val }))}
          onShowBadgeChange={(val) => setHeaderConfig(p => ({ ...p, showBadge: val }))}
          onBadgeTextChange={(val) => setHeaderConfig(p => ({ ...p, badgeText: val }))}
          expanded={headerOpenSections.header}
          onExpandedChange={(open) => toggleHeaderSection('header', open)}
          titleRequired={true}
          titleLabel="Tiêu đề hiển thị"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 mt-6">
          <div>
            {component.type === 'FAQ' && <FaqForm faqItems={faqItems} setFaqItems={setFaqItems} faqStyle={faqStyle} brandColor={effectiveColors.primary} faqConfig={faqConfig} setFaqConfig={setFaqConfig} expanded={true} onExpandedChange={()=>{}} />}
            {component.type === 'Video' && <VideoForm config={videoConfig} onChange={setVideoConfig} selectedStyle={videoStyle} defaultExpanded={true} />}
            {component.type === 'Team' && <TeamForm members={teamMembers as any} onChange={setTeamMembers as any} secondary={effectiveColors.secondary} defaultExpanded={true} />}
            {component.type === 'Testimonials' && <TestimonialsForm items={testimonialsItems} setItems={setTestimonialsItems} defaultExpanded={true} />}
            {component.type === 'Hero' && <HeroForm heroSlides={heroSlides} setHeroSlides={setHeroSlides} heroStyle={heroStyle} heroContent={heroContent} setHeroContent={setHeroContent} noBorderRadius={noBorderRadius} setNoBorderRadius={setNoBorderRadius} />}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {component.type === 'FAQ' && <FaqPreview items={faqItems as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={faqStyle} onStyleChange={setFaqStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...(faqConfig as any)} {...headerConfig} />}
            {component.type === 'Video' && <VideoPreview config={videoConfig} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={videoStyle} onStyleChange={setVideoStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...headerConfig} />}
            {component.type === 'Team' && <TeamPreview brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={teamStyle} onStyleChange={setTeamStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...teamConfig} {...headerConfig} members={teamMembers as any} />}
            {component.type === 'Testimonials' && <TestimonialsPreview items={testimonialsItems as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={testimonialsStyle} onStyleChange={setTestimonialsStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...testimonialsConfig} {...headerConfig} />}
            {component.type === 'Hero' && <HeroPreview slides={heroSlides.map((slide, index) => ({ id: index + 1, image: slide.url, link: slide.link, mediaType: slide.mediaType }))} content={heroContent} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={heroStyle} onStyleChange={setHeroStyle} fontStyle={fontStyle} fontClassName="font-active" />}
          </div>
        </div>

        <HomeComponentStickyFooter isSubmitting={isSaving} hasChanges={hasChanges} onCancel={onCancel} submitLabel="Lưu thay đổi" active={active} onActiveChange={setActive} />
      </form>
    </div>
  );
}
