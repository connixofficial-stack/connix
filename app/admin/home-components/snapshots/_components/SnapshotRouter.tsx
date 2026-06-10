'use client';

import React, { useState, useMemo } from 'react';
import { extractSectionHeaderConfig } from '../../_shared/hooks/useSectionHeaderState';
import { HeaderConfigSection } from '../../_shared/components/HeaderConfigSection';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { toast } from 'sonner';
import { saveSnapshotComponent } from '../_lib/snapshotComponentSave';

// Imports
import { AboutForm } from '../../about/_components/AboutForm';
import { AboutPreview } from '../../about/_components/AboutPreview';
import { normalizeAboutCornerRadius, normalizeAboutImages, normalizeAboutEditorFeatures, normalizeAboutEditorStats, toAboutPersistFeatures, toAboutPersistStats, createAboutEditorFeature, DEFAULT_ABOUT_EDITOR_STATE, normalizeAboutStyle } from '../../about/_lib/constants';

import { CTAForm } from '../../cta/_components/CTAForm';
import { CTAPreview } from '../../cta/_components/CTAPreview';
import { normalizeCTAStyle } from '../../cta/_lib/constants';

import { FeaturesForm } from '../../features/_components/FeaturesForm';
import { FeaturesPreview } from '../../features/_components/FeaturesPreview';
import { normalizeFeatureItems } from '../../features/_lib/constants';

import { CareerForm } from '../../career/_components/CareerForm';
import { CareerPreview } from '../../career/_components/CareerPreview';
import { normalizeCareerConfig } from '../../career/_lib/normalize';

import { BenefitsForm } from '../../benefits/_components/BenefitsForm';
import { BenefitsPreview } from '../../benefits/_components/BenefitsPreview';
import { DEFAULT_BENEFITS_EDITOR_STATE } from '../../benefits/_lib/constants';
import { normalizeBenefitItems, toBenefitPersistItems } from '../../benefits/_lib/normalize';
import { normalizeBenefitsStyle } from '../../benefits/_lib/colors';

import { ClientsForm } from '../../clients/_components/ClientsForm';
import { ClientsPreview } from '../../clients/_components/ClientsPreview';
import { normalizeClientItems, toPersistClientItems } from '../../clients/_lib/items';

export function SnapshotRouter({
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
      spacing: extracted.spacing,
    };
  });
  const { openSections: headerOpenSections, toggleSection: toggleHeaderSection } = useFormSectionsState(['header'], false);

  // States for About
  const [aboutState, setAboutState] = useState(() => {
    const fallbackImage = typeof rawConfig.image === 'string' ? rawConfig.image : '';
    const normalizedImages = normalizeAboutImages(rawConfig.images, fallbackImage);
    const normalizedFeatures = normalizeAboutEditorFeatures(rawConfig.features);
    const normalizedStats = normalizeAboutEditorStats(rawConfig.stats);
    return {
      subHeading: typeof rawConfig.subHeading === 'string' ? rawConfig.subHeading : DEFAULT_ABOUT_EDITOR_STATE.subHeading,
      heading: typeof rawConfig.heading === 'string' ? rawConfig.heading : DEFAULT_ABOUT_EDITOR_STATE.heading,
      highlightText: typeof rawConfig.highlightText === 'string' ? rawConfig.highlightText : DEFAULT_ABOUT_EDITOR_STATE.highlightText,
      description: typeof rawConfig.description === 'string' ? rawConfig.description : DEFAULT_ABOUT_EDITOR_STATE.description,
      phone: typeof rawConfig.phone === 'string' ? rawConfig.phone : DEFAULT_ABOUT_EDITOR_STATE.phone,
      image: normalizedImages[0] ?? fallbackImage,
      images: normalizedImages,
      imageCaption: typeof rawConfig.imageCaption === 'string' ? rawConfig.imageCaption : '',
      buttonText: typeof rawConfig.buttonText === 'string' ? rawConfig.buttonText : DEFAULT_ABOUT_EDITOR_STATE.buttonText,
      buttonLink: typeof rawConfig.buttonLink === 'string' ? rawConfig.buttonLink : DEFAULT_ABOUT_EDITOR_STATE.buttonLink,
      features: normalizedFeatures.length > 0 ? normalizedFeatures : DEFAULT_ABOUT_EDITOR_STATE.features.map(createAboutEditorFeature),
      style: normalizeAboutStyle(rawConfig.style),
      stats: normalizedStats.length > 0 ? normalizedStats : DEFAULT_ABOUT_EDITOR_STATE.stats,
      cornerRadius: normalizeAboutCornerRadius(rawConfig.cornerRadius),
    };
  });

  // States for CTA
  const [ctaConfig, setCtaConfig] = useState(() => ({
    badge: rawConfig.badge ?? '',
    buttonLink: rawConfig.buttonLink ?? '',
    buttonText: rawConfig.buttonText ?? '',
    description: rawConfig.description ?? '',
    secondaryButtonLink: rawConfig.secondaryButtonLink ?? '',
    secondaryButtonText: rawConfig.secondaryButtonText ?? '',
    title: rawConfig.title ?? '',
  }));
  const [ctaStyle, setCtaStyle] = useState(() => normalizeCTAStyle(rawConfig.style));

  // States for Features
  const [featuresItems, setFeaturesItems] = useState(() => normalizeFeatureItems(rawConfig.items));
  const [featuresStyle, setFeaturesStyle] = useState(() => rawConfig.style ?? 'iconGrid');
  const [featuresShowIcons, setFeaturesShowIcons] = useState(() => rawConfig.showIcons !== false);

  // States for Career
  const careerNormalized = useMemo(() => normalizeCareerConfig(rawConfig), []);
  const [careerJobs, setCareerJobs] = useState(() => careerNormalized.jobs.length > 0 ? careerNormalized.jobs : []);
  const [careerTexts, setCareerTexts] = useState(careerNormalized.texts);
  const [careerStyle, setCareerStyle] = useState(careerNormalized.style);

  // States for Benefits
  const [benefitsState, setBenefitsState] = useState(() => {
    return {
      items: normalizeBenefitItems(rawConfig.items),
      style: normalizeBenefitsStyle(rawConfig.style),
      subHeading: rawConfig.subHeading ?? DEFAULT_BENEFITS_EDITOR_STATE.subHeading,
      heading: rawConfig.heading ?? DEFAULT_BENEFITS_EDITOR_STATE.heading,

      gridColumnsDesktop: rawConfig.gridColumnsDesktop ?? DEFAULT_BENEFITS_EDITOR_STATE.gridColumnsDesktop,
      gridColumnsMobile: rawConfig.gridColumnsMobile ?? DEFAULT_BENEFITS_EDITOR_STATE.gridColumnsMobile,
      buttonText: rawConfig.buttonText ?? DEFAULT_BENEFITS_EDITOR_STATE.buttonText,
      buttonLink: rawConfig.buttonLink ?? DEFAULT_BENEFITS_EDITOR_STATE.buttonLink,
      visualImage: rawConfig.visualImage ?? DEFAULT_BENEFITS_EDITOR_STATE.visualImage,
      highlightIndex: rawConfig.highlightIndex ?? DEFAULT_BENEFITS_EDITOR_STATE.highlightIndex,
      showItemNumbers: rawConfig.showItemNumbers ?? DEFAULT_BENEFITS_EDITOR_STATE.showItemNumbers,
      showDecorativeVisuals: rawConfig.showDecorativeVisuals ?? DEFAULT_BENEFITS_EDITOR_STATE.showDecorativeVisuals,
      harmony: rawConfig.harmony ?? DEFAULT_BENEFITS_EDITOR_STATE.harmony,
      ...headerConfig
    };
  });

  // States for Clients
  const [clientsItems, setClientsItems] = useState(() => normalizeClientItems(rawConfig.items));
  const [clientsStyle, setClientsStyle] = useState(() => rawConfig.style ?? 'marquee');

  const getConfig = () => {
    switch (component.type) {
      case 'About': return { ...aboutState, features: toAboutPersistFeatures(aboutState.features), stats: toAboutPersistStats(aboutState.stats), style: normalizeAboutStyle(aboutState.style), ...headerConfig };
      case 'CTA': return { ...ctaConfig, style: ctaStyle, ...headerConfig };
      case 'Features': return { items: featuresItems, showIcons: featuresShowIcons, style: featuresStyle, ...headerConfig };
      case 'Career': return { jobs: careerJobs, style: careerStyle, texts: careerTexts, ...headerConfig };
      case 'Benefits': return { ...benefitsState, items: toBenefitPersistItems(benefitsState.items), style: normalizeBenefitsStyle(benefitsState.style), ...headerConfig };
      case 'Clients': return { items: toPersistClientItems(clientsItems), style: clientsStyle, ...headerConfig };
      default: return rawConfig;
    }
  };

  const currentSnapshot = JSON.stringify(getConfig());
  const [initialSnapshot] = useState(() => JSON.stringify(getConfig()));
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
            {component.type === 'About' && (
              <AboutForm
                state={aboutState as any}
                previewStyle={aboutState.style}
                onChange={setAboutState as any}
                spacing={headerConfig.spacing ?? 'normal'}
                onSpacingChange={(spacing) => setHeaderConfig((current) => ({ ...current, spacing }))}
                cornerRadius={aboutState.cornerRadius}
                onCornerRadiusChange={(cornerRadius) => setAboutState((current) => ({ ...current, cornerRadius }))}
                defaultExpanded={false}
              />
            )}
            {component.type === 'CTA' && <CTAForm config={ctaConfig as any} onChange={setCtaConfig as any} />}
            {component.type === 'Features' && <FeaturesForm items={featuresItems} onChange={setFeaturesItems} brandColor={effectiveColors.primary} style={featuresStyle} showIcons={featuresShowIcons} onShowIconsChange={setFeaturesShowIcons} />}
            {component.type === 'Career' && <CareerForm jobs={careerJobs} onJobsChange={setCareerJobs} texts={careerTexts as any} onTextsChange={setCareerTexts} />}
            {component.type === 'Benefits' && (
              <BenefitsForm
                state={benefitsState as any}
                onChange={setBenefitsState as any}
                mode={effectiveColors.mode}
                spacing={headerConfig.spacing ?? 'normal'}
                onSpacingChange={(spacing) => setHeaderConfig((current) => ({ ...current, spacing }))}
              />
            )}
            {component.type === 'Clients' && <ClientsForm items={clientsItems as any} setItems={setClientsItems as any} />}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            {component.type === 'About' && <AboutPreview config={{...aboutState, features: toAboutPersistFeatures(aboutState.features), stats: toAboutPersistStats(aboutState.stats)}} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={aboutState.style} onStyleChange={(s) => setAboutState(p => ({ ...p, style: s }))} fontStyle={fontStyle} fontClassName="font-active" title={title} cornerRadius={aboutState.cornerRadius} {...headerConfig} />}
            {component.type === 'CTA' && <CTAPreview config={ctaConfig} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={ctaStyle} onStyleChange={setCtaStyle} fontStyle={fontStyle} fontClassName="font-active" />}
            {component.type === 'Features' && <FeaturesPreview items={featuresItems} sectionTitle={title} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={featuresStyle} onStyleChange={setFeaturesStyle} showIcons={featuresShowIcons} fontStyle={fontStyle} fontClassName="font-active" {...headerConfig} />}
            {component.type === 'Career' && <CareerPreview jobs={careerJobs} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={careerStyle} onStyleChange={setCareerStyle} title={title} texts={careerTexts} fontStyle={fontStyle} fontClassName="font-active" />}
            {component.type === 'Benefits' && <BenefitsPreview items={benefitsState.items as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={benefitsState.style} onStyleChange={(s) => setBenefitsState(p => ({ ...p, style: s }))} fontStyle={fontStyle} fontClassName="font-active" title={title} {...(benefitsState as any)} {...headerConfig} />}
            {component.type === 'Clients' && <ClientsPreview items={clientsItems as any} brandColor={effectiveColors.primary} secondary={effectiveColors.secondary} mode={effectiveColors.mode} selectedStyle={clientsStyle} onStyleChange={setClientsStyle} fontStyle={fontStyle} fontClassName="font-active" title={title} {...headerConfig} />}
          </div>
        </div>

        <HomeComponentStickyFooter isSubmitting={isSaving} hasChanges={hasChanges} onCancel={onCancel} submitLabel="Lưu thay đổi" active={active} onActiveChange={setActive} />
      </form>
    </div>
  );
}
