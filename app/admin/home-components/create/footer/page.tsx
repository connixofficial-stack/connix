'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { FooterPreview } from '../../footer/_components/FooterPreview';
import { FooterForm } from '../../footer/_components/FooterForm';
import { normalizeFooterConfig } from '../../footer/_lib/constants';
import type { FooterConfig } from '../../footer/_types';

export default function FooterCreatePage() {
  const COMPONENT_TYPE = 'Footer';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Footer', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => normalizeFooterConfig({
    columns: [
      { id: 1, links: [{ label: 'Giới thiệu', url: '/about' }, { label: 'Tuyển dụng', url: '/careers' }], title: 'Về chúng tôi' },
      { id: 2, links: [{ label: 'FAQ', url: '/faq' }, { label: 'Liên hệ', url: '/contact' }], title: 'Hỗ trợ' },
    ],
    copyright: '© 2024 VietAdmin. All rights reserved.',
    description: 'Đối tác tin cậy cho hành trình số hóa của bạn',
    logo: '',
    showSocialLinks: true,
    socialLinks: [],
    style: 'classic',
  }));

  const brandMode: 'single' | 'dual' = mode === 'single' ? 'single' : 'dual';

  const onSubmit = (e: React.FormEvent) => {
    void handleSubmit(e, {
      ...footerConfig,
      noBorderRadius: footerConfig.cornerRadius === 'none',
      noVerticalMargin: footerConfig.spacing === 'none',
    } as unknown as Record<string, unknown>);
  };

  return (
    <ComponentFormWrapper
      type={COMPONENT_TYPE}
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
      <FooterForm value={footerConfig} onChange={setFooterConfig} primary={primary} secondary={secondary} mode={brandMode} />

      <FooterPreview
        config={footerConfig as any}
        brandColor={primary}
        secondary={secondary}
        mode={brandMode}
        selectedStyle={footerConfig.style}
        onStyleChange={(style) =>{  setFooterConfig({ ...footerConfig, style }); }}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
