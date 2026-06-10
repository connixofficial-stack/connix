'use client';

import React, { useState } from 'react';
import { ComponentFormWrapper, useComponentForm } from '../shared';
import { useTypeColorOverrideState } from '../../_shared/hooks/useTypeColorOverride';
import { useTypeFontOverrideState } from '../../_shared/hooks/useTypeFontOverride';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { toast } from 'sonner';
import { CTAForm } from '../../cta/_components/CTAForm';
import { CTAPreview } from '../../cta/_components/CTAPreview';
import { DEFAULT_CTA_CONFIG } from '../../cta/_lib/constants';
import { getCTAValidationResult } from '../../cta/_lib/colors';
import type { CTAConfig, CTAContainerWidth, CTAStyle } from '../../cta/_types';
import { Label, cn } from '../../../components/ui';

const CONTAINER_WIDTH_OPTIONS: Array<{ value: CTAContainerWidth; label: string; description: string }> = [
  { value: 'max-7xl', label: 'Max-w-7xl', description: 'Giới hạn chiều rộng gọn gàng' },
  { value: 'full', label: 'Full width', description: 'Mở rộng toàn chiều ngang' },
];

const INITIAL_CTA_CONFIG: CTAConfig = {
  ...DEFAULT_CTA_CONFIG,
  buttonLink: '/register',
  buttonText: 'Đăng ký ngay',
  description: 'Đăng ký ngay hôm nay để nhận ưu đãi đặc biệt',
  secondaryButtonLink: '/about',
  secondaryButtonText: 'Tìm hiểu thêm',
  title: 'Sẵn sàng bắt đầu?',
};

export default function CTACreatePage() {
  const COMPONENT_TYPE = 'CTA';
  const { title, setTitle, active, setActive, handleSubmit, isSubmitting } = useComponentForm('Kêu gọi hành động (CTA)', COMPONENT_TYPE);
  const { customState, effectiveColors, showCustomBlock, setCustomState, systemColors } = useTypeColorOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { customState: customFontState, effectiveFont, showCustomBlock: showFontCustomBlock, setCustomState: setCustomFontState } = useTypeFontOverrideState(COMPONENT_TYPE, { seedCustomFromSettingsWhenTypeEmpty: true });
  const { primary, secondary, mode } = effectiveColors;
  const fontStyle = { '--font-active': `var(${effectiveFont.fontVariable})` } as React.CSSProperties;

  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(INITIAL_CTA_CONFIG);
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('banner');
  const [displayOpen, setDisplayOpen] = useState(true);

  const onSubmit = (e: React.FormEvent) => {
    const { harmonyStatus } = getCTAValidationResult({
      config: ctaConfig,
      primary,
      secondary,
      mode,
      style: ctaStyle,
    });

    if (mode === 'dual' && harmonyStatus.isTooSimilar) {
      e.preventDefault();
      toast.error(`Không thể lưu CTA: deltaE=${harmonyStatus.deltaE} < 20 (Primary/Secondary quá giống nhau).`);
      return;
    }

    void handleSubmit(e, {
      ...ctaConfig,
      noBorderRadius: ctaConfig.cornerRadius === 'none',
      noVerticalMargin: ctaConfig.spacing === 'none',
      style: ctaStyle,
    });
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
      <div className="mb-3">
        <HomeComponentDisplaySettingsSection
          open={displayOpen}
          onOpenChange={setDisplayOpen}
          cornerRadius={ctaConfig.cornerRadius ?? 'lg'}
          onCornerRadiusChange={(cornerRadius) => setCtaConfig((prev) => ({ ...prev, cornerRadius }))}
          spacing={ctaConfig.spacing ?? 'normal'}
          onSpacingChange={(spacing) => setCtaConfig((prev) => ({ ...prev, spacing }))}
        >
            <div className="space-y-2">
              <Label>Chiều rộng</Label>
              <div className="grid grid-cols-2 gap-2">
                {CONTAINER_WIDTH_OPTIONS.map((option) => {
                  const selected = (ctaConfig.containerWidth ?? 'max-7xl') === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCtaConfig((prev) => ({ ...prev, containerWidth: option.value }))}
                      className={cn(
                        'rounded-md border px-3 py-2 text-left transition-colors',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      <span className="block text-xs font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] opacity-75">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
        </HomeComponentDisplaySettingsSection>
      </div>

      <CTAForm
        config={ctaConfig}
        onChange={setCtaConfig}
      />

      <CTAPreview
        config={ctaConfig}
        brandColor={primary}
        secondary={secondary}
        mode={mode}
        selectedStyle={ctaStyle}
        onStyleChange={setCtaStyle}
        fontStyle={fontStyle}
        fontClassName="font-active"
      />
    </ComponentFormWrapper>
  );
}
