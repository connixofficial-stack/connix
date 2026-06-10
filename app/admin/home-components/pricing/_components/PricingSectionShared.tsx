'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { cn } from '../../../components/ui';
import type { PricingColorTokens } from '../_lib/colors';
import type {
  PricingBrandMode,
  PricingCornerRadius,
  PricingPlan,
  PricingStyle,
} from '../_types';
import { getPricingCornerRadiusClassName, normalizePricingCornerRadius } from '../_types';

type PricingSharedContext = 'preview' | 'site';

const MAX_PRICING_PLANS = 4;

const PRICING_SECTION_FONT: React.CSSProperties = {
  fontSize: '0.85em',
};

/** Price text: giữ gần nguyên gốc (0.85 × 1.15 ≈ 0.98) */
const PRICING_PRICE_SCALE: React.CSSProperties = {
  fontSize: '1.15em',
};

interface PricingSectionSharedProps {
  context: PricingSharedContext;
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  style: PricingStyle;
  mode: PricingBrandMode;
  tokens: PricingColorTokens;
  texts: Record<string, string>;
  isYearly: boolean;
  showBillingToggle: boolean;
  monthlyLabel: string;
  yearlyLabel: string;
  yearlySavingText: string;
  onBillingToggle?: (value: boolean) => void;
  skipHeader?: boolean;
  /** When set, responsive grid uses this instead of viewport breakpoints */
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
  /** Grid columns: 3 or 4. Affects responsive breakpoints. */
  gridCols?: 3 | 4;
  cornerRadius?: PricingCornerRadius;
}

const formatPriceDisplay = (value?: string) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {return '0';}
  return trimmed;
};

const normalizePeriod = (value?: string, isYearly = false) => {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return isYearly ? '/năm' : '/tháng';
  }
  return trimmed;
};

const sanitizeFeatures = (features?: string[]) => (
  (features || [])
    .map((feature) => String(feature ?? '').trim())
    .filter((feature) => feature.length > 0)
);

const getPlanPrice = (plan: PricingPlan, isYearly: boolean) => {
  if (isYearly && String(plan.yearlyPrice ?? '').trim()) {
    return formatPriceDisplay(plan.yearlyPrice);
  }
  return formatPriceDisplay(plan.price);
};

/** Chỉ thêm 'đ' khi giá là số; text như 'Liên hệ' giữ nguyên */
const formatPriceWithSuffix = (price: string) => {
  const cleaned = price.replace(/[.,\s]/g, '');
  if (/^\d+$/.test(cleaned)) {
    return `${price}đ`;
  }
  return price;
};

const wrapAction = ({
  context,
  href,
  className,
  style,
  children,
}: {
  context: PricingSharedContext;
  href: string;
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => {
  if (context === 'site' && href && href !== '#') {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};

const BillingToggle = ({
  showBillingToggle,
  isYearly,
  monthlyLabel,
  yearlyLabel,
  yearlySavingText,
  onBillingToggle,
  tokens,
}: {
  showBillingToggle: boolean;
  isYearly: boolean;
  monthlyLabel: string;
  yearlyLabel: string;
  yearlySavingText: string;
  onBillingToggle?: (value: boolean) => void;
  tokens: PricingColorTokens;
}) => {
  if (!showBillingToggle) {
    return null;
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: isYearly ? tokens.toggleInactiveLabel : tokens.toggleActiveLabel }}
      >
        {monthlyLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        onClick={() => { onBillingToggle?.(!isYearly); }}
        className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors"
        style={{ backgroundColor: isYearly ? tokens.toggleTrackOn : tokens.toggleTrackOff }}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full transition-transform',
            isYearly ? 'translate-x-6' : 'translate-x-1',
          )}
          style={{ backgroundColor: tokens.toggleThumb }}
        />
      </button>
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: isYearly ? tokens.toggleActiveLabel : tokens.toggleInactiveLabel }}
      >
        {yearlyLabel}
      </span>
      {isYearly && yearlySavingText.trim() ? (
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
          style={{
            backgroundColor: tokens.badgeSoftBg,
            borderColor: tokens.badgeSoftBorder,
            color: tokens.badgeSoftText,
          }}
        >
          {yearlySavingText}
        </span>
      ) : null}
    </div>
  );
};

const EmptyState = ({ tokens, texts }: { tokens: PricingColorTokens; texts: Record<string, string> }) => (
  <div className="py-14 text-center">
    <div className="mx-auto mb-3 h-12 w-12 rounded-full border" style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralBackground }}></div>
    <p className="text-sm font-medium" style={{ color: tokens.neutralText }}>{texts.emptyStateTitle || 'Chưa có gói nào'}</p>
    <p className="mt-1 text-xs" style={{ color: tokens.mutedText }}>{texts.emptyStateDescription || 'Thêm gói để hiển thị bảng giá'}</p>
  </div>
);

const renderSectionHeader = ({
  title,
  subtitle,
  tokens,
}: {
  title: string;
  subtitle: string;
  tokens: PricingColorTokens;
}) => (
  <header className="mb-8 text-center">
    <h2 className="text-3xl font-bold tracking-tight" style={{ color: tokens.headingText }}>{title}</h2>
    {subtitle.trim() ? (
      <p className="mt-2 text-sm" style={{ color: tokens.subtitleText }}>{subtitle}</p>
    ) : null}
  </header>
);

export function PricingSectionShared({
  context,
  title,
  subtitle,
  plans,
  style,
  mode,
  tokens,
  texts,
  isYearly,
  showBillingToggle,
  monthlyLabel,
  yearlyLabel,
  yearlySavingText,
  onBillingToggle,
  skipHeader = false,
  previewDevice,
  gridCols = 3,
  cornerRadius,
}: PricingSectionSharedProps) {
  const cardRadiusClassName = getPricingCornerRadiusClassName(normalizePricingCornerRadius(cornerRadius));

  const renderPlanFeatures = (features: string[]) => {
    const list = sanitizeFeatures(features).slice(0, 8);
    if (list.length === 0) {
      return [texts.defaultFeature || 'Tính năng đang cập nhật'];
    }
    return list;
  };

  const displayPlans = plans
    .filter((plan) => plan.name.trim() || plan.price.trim() || plan.yearlyPrice?.trim() || sanitizeFeatures(plan.features).length > 0)
    .slice(0, MAX_PRICING_PLANS);
  const [activeTabbedPlanKey, setActiveTabbedPlanKey] = React.useState<string | null>(null);

  const getPlanKey = (plan: PricingPlan, index: number) => `${String(plan.id ?? index)}-${index}`;

  const getGridCountClass = (gapClass: string) => {
    if (displayPlans.length <= 1) {
      return `${gapClass} grid-cols-1 max-w-md mx-auto`;
    }

    if (previewDevice) {
      if (gridCols === 4) {
        return `${gapClass} ${previewDevice === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'}`;
      }

      return `${gapClass} ${previewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`;
    }

    return gridCols === 4
      ? `${gapClass} grid-cols-2 @lg:grid-cols-4`
      : `${gapClass} grid-cols-1 @md:grid-cols-3`;
  };

  const cardsGridClass = getGridCountClass('gap-5');
  const compactGridClass = getGridCountClass('gap-3');

  const sectionBase = (
    <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
      <div className="mx-auto max-w-6xl">
        {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
        <BillingToggle
          showBillingToggle={showBillingToggle}
          isYearly={isYearly}
          monthlyLabel={monthlyLabel}
          yearlyLabel={yearlyLabel}
          yearlySavingText={yearlySavingText}
          onBillingToggle={onBillingToggle}
          tokens={tokens}
        />
        {displayPlans.length === 0 ? <EmptyState tokens={tokens} texts={texts} /> : null}
      </div>
    </section>
  );

  if (displayPlans.length === 0) {
    return sectionBase;
  }

  if (style === 'cards') {
    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-6xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className={cn('grid', cardsGridClass)}>
            {displayPlans.map((plan, index) => {
              const isPopular = Boolean(plan.isPopular);
              const actionHref = plan.buttonLink.trim() || '#';
              const features = renderPlanFeatures(plan.features);
              return (
                <article
                  key={`${String(plan.id ?? index)}-${index}`}
                  className={cn('relative flex h-full flex-col border bg-white p-5', cardRadiusClassName)}
                  style={{
                    backgroundColor: tokens.cardBackground,
                    borderColor: isPopular ? tokens.cardPopularBorder : tokens.cardBorder,
                  }}
                >
                  {isPopular ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span
                        className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: tokens.badgeSolidBg,
                          borderColor: tokens.neutralBorder,
                          color: tokens.badgeSolidText,
                        }}
                      >
                        {texts.popularBadge || 'Phổ biến'}
                      </span>
                    </div>
                  ) : null}

                  <h3 className="text-center text-lg font-semibold" style={{ color: tokens.neutralText }}>
                    {plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}
                  </h3>
                  <div className="mt-3 text-center">
                    <span className="text-3xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                      {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                    </span>
                    <span className="ml-1 text-sm" style={{ color: tokens.periodText }}>
                      {normalizePeriod(plan.period, isYearly)}
                    </span>
                  </div>

                  <ul className="mt-4 flex-1 space-y-2">
                    {features.map((feature, featureIndex) => (
                      <li key={`${featureIndex}-${feature}`} className="flex items-start gap-2 text-sm" style={{ color: tokens.featureText }}>
                        <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: tokens.featureIcon }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    {isPopular
                      ? wrapAction({
                          context,
                          href: actionHref,
                          className: 'block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors',
                          style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                          children: plan.buttonText.trim() || 'Chọn gói',
                        })
                      : wrapAction({
                          context,
                          href: actionHref,
                          className: 'block w-full rounded-lg border py-3 text-center text-sm font-semibold transition-colors',
                          style: {
                            backgroundColor: tokens.ctaGhostBg,
                            borderColor: tokens.ctaGhostBorder,
                            color: tokens.ctaGhostText,
                          },
                          children: plan.buttonText.trim() || 'Chọn gói',
                        })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'horizontal') {
    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-4xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className="space-y-3">
            {displayPlans.map((plan, index) => {
              const actionHref = plan.buttonLink.trim() || '#';
              const featureText = renderPlanFeatures(plan.features).slice(0, 2).join(' • ');
              return (
                <article
                  key={`${String(plan.id ?? index)}-${index}`}
                  className={cn('border p-4 @md:flex @md:items-center @md:justify-between', cardRadiusClassName)}
                  style={{ backgroundColor: tokens.cardBackground, borderColor: plan.isPopular ? tokens.cardPopularBorder : tokens.cardBorder }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="min-w-0 break-words text-base font-semibold" style={{ color: tokens.neutralText }}>{plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}</h3>
                      {plan.isPopular ? (
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{ backgroundColor: tokens.badgeSoftBg, borderColor: tokens.badgeSoftBorder, color: tokens.badgeSoftText }}
                        >
                          {texts.hotBadge || 'Hot'}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 break-words text-xs" style={{ color: tokens.mutedText }}>{featureText}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 @md:mt-0 @md:flex-shrink-0">
                    <span className="text-xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                      {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                      <span className="ml-1 text-sm font-normal" style={{ color: tokens.periodText }}>
                        {normalizePeriod(plan.period, isYearly)}
                      </span>
                    </span>
                    {wrapAction({
                      context,
                      href: actionHref,
                      className: 'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                      style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                      children: plan.buttonText.trim() || texts.selectButton || 'Chọn',
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'minimal') {
    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-4xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className={cn('overflow-hidden border', cardRadiusClassName)} style={{ borderColor: tokens.neutralBorder }}>
            {displayPlans.map((plan, index) => {
              const actionHref = plan.buttonLink.trim() || '#';
              const featureText = renderPlanFeatures(plan.features).slice(0, 2).join(' • ');
              return (
                <article
                  key={`${String(plan.id ?? index)}-${index}`}
                  className={cn('p-5 @md:flex @md:items-center @md:justify-between', index !== displayPlans.length - 1 ? 'border-b' : '')}
                  style={{
                    backgroundColor: plan.isPopular ? tokens.comparisonPopularColumnBg : tokens.cardBackground,
                    borderColor: tokens.neutralBorder,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="min-w-0 break-words text-lg font-semibold" style={{ color: tokens.neutralText }}>{plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}</h3>
                      {plan.isPopular ? (
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                          style={{ backgroundColor: tokens.badgeSoftBg, borderColor: tokens.badgeSoftBorder, color: tokens.badgeSoftText }}
                        >
                          {texts.popularBadge || 'Phổ biến'}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs" style={{ color: tokens.mutedText }}>{featureText}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-4 @md:mt-0">
                    <span className="text-2xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                      {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                      <span className="ml-1 text-sm font-normal" style={{ color: tokens.periodText }}>
                        {normalizePeriod(plan.period, isYearly)}
                      </span>
                    </span>
                    {plan.isPopular
                      ? wrapAction({
                          context,
                          href: actionHref,
                          className: 'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                          style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                          children: plan.buttonText.trim() || 'Chọn gói',
                        })
                      : wrapAction({
                          context,
                          href: actionHref,
                          className: 'rounded-lg border px-5 py-2.5 text-sm font-semibold',
                          style: { backgroundColor: tokens.ctaGhostBg, borderColor: tokens.ctaGhostBorder, color: tokens.ctaGhostText },
                          children: plan.buttonText.trim() || 'Chọn gói',
                        })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'comparison') {
    const comparisonPlans = displayPlans.slice(0, 4);
    const allFeatures = [...new Set(comparisonPlans.flatMap((plan) => renderPlanFeatures(plan.features)))].slice(0, 12);

    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-6xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className={cn('overflow-x-auto border', cardRadiusClassName)} style={{ borderColor: tokens.neutralBorder }}>
            <table className="w-full border-collapse" style={{ backgroundColor: tokens.neutralSurface }}>
              <thead>
                <tr style={{ backgroundColor: tokens.comparisonHeaderBg }}>
                  <th className="border-b p-4 text-left text-sm font-semibold" style={{ color: tokens.mutedText, borderColor: tokens.neutralBorder }}>Tính năng</th>
                  {comparisonPlans.map((plan, index) => (
                    <th
                      key={`${String(plan.id ?? index)}-${index}`}
                      className="min-w-[150px] border-b p-4 text-center"
                      style={{
                        borderColor: tokens.neutralBorder,
                        backgroundColor: plan.isPopular ? tokens.comparisonPopularColumnBg : tokens.neutralSurface,
                      }}
                    >
                      <div className="text-sm font-semibold" style={{ color: tokens.neutralText }}>{plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}</div>
                      <div className="mt-1 text-2xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                        {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                      </div>
                      {plan.isPopular ? (
                        <div className="mt-2">
                          <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase"
                            style={{ 
                              backgroundColor: tokens.badgeSoftOnHeaderBg, 
                              borderColor: tokens.badgeSoftBorder, 
                              color: tokens.badgeSoftOnHeaderText 
                            }}
                          >
                            {texts.recommendedBadge || 'Khuyên dùng'}
                          </span>
                        </div>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, featureIndex) => (
                  <tr key={`${featureIndex}-${feature}`} style={{ backgroundColor: featureIndex % 2 === 0 ? tokens.comparisonAltRowBg : tokens.neutralSurface }}>
                    <td className="border-b p-4 text-sm" style={{ color: tokens.featureText, borderColor: tokens.neutralBorder }}>{feature}</td>
                    {comparisonPlans.map((plan, planIndex) => (
                      <td
                        key={`${String(plan.id ?? planIndex)}-feature-${featureIndex}`}
                        className="border-b p-4 text-center"
                        style={{
                          borderColor: tokens.neutralBorder,
                          backgroundColor: plan.isPopular ? tokens.comparisonPopularColumnBg : undefined,
                        }}
                      >
                        {renderPlanFeatures(plan.features).includes(feature)
                          ? <Check size={16} className="mx-auto" style={{ color: tokens.featureIcon }} />
                          : <X size={16} className="mx-auto" style={{ color: tokens.mutedText }} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-4"></td>
                  {comparisonPlans.map((plan, index) => {
                    const actionHref = plan.buttonLink.trim() || '#';
                    return (
                      <td
                        key={`${String(plan.id ?? index)}-action`}
                        className="p-4 text-center"
                        style={{ backgroundColor: plan.isPopular ? tokens.comparisonPopularColumnBg : undefined }}
                      >
                        {plan.isPopular
                          ? wrapAction({
                              context,
                              href: actionHref,
                              className: 'inline-block rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
                              style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                              children: plan.buttonText.trim() || 'Chọn',
                            })
                          : wrapAction({
                              context,
                              href: actionHref,
                              className: 'inline-block rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors',
                              style: { backgroundColor: tokens.ctaGhostBg, borderColor: tokens.ctaGhostBorder, color: tokens.ctaGhostText },
                              children: plan.buttonText.trim() || 'Chọn',
                            })}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'featured') {
    const featuredPlan = displayPlans.find((plan) => plan.isPopular) ?? displayPlans[0];
    const sidePlans = displayPlans.filter((plan) => plan !== featuredPlan).slice(0, 2);

    if (!featuredPlan) {
      return sectionBase;
    }

    const actionHref = featuredPlan.buttonLink.trim() || '#';

    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-6xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className="flex flex-col gap-5 @lg:flex-row">
            <article
              className={cn('relative flex flex-1 flex-col border p-7', cardRadiusClassName)}
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardPopularBorder }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: tokens.badgeSolidBg, borderColor: tokens.neutralBorder, color: tokens.badgeSolidText }}
                >
                  {texts.featuredBadge || '★ Phổ biến nhất'}
                </span>
              </div>

              <h3 className="mt-3 text-center text-2xl font-bold" style={{ color: tokens.neutralText }}>
                {featuredPlan.name.trim() || texts.defaultPlanName || 'Gói nổi bật'}
              </h3>

              <div className="my-6 text-center">
                <span className="text-4xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                  {formatPriceWithSuffix(getPlanPrice(featuredPlan, isYearly))}
                </span>
                <span className="ml-1 text-sm" style={{ color: tokens.periodText }}>
                  {normalizePeriod(featuredPlan.period, isYearly)}
                </span>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {renderPlanFeatures(featuredPlan.features).slice(0, 7).map((feature, featureIndex) => (
                  <li key={`${featureIndex}-${feature}`} className="flex items-start gap-2 text-sm" style={{ color: tokens.featureText }}>
                    <Check size={15} className="mt-0.5 flex-shrink-0" style={{ color: tokens.featureIcon }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {wrapAction({
                context,
                href: actionHref,
                className: 'block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors',
                style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                children: featuredPlan.buttonText.trim() || texts.startNowButton || 'Bắt đầu ngay',
              })}
            </article>

            {sidePlans.length > 0 ? (
              <div className="flex flex-col gap-4 @lg:w-72">
                {sidePlans.map((plan, index) => {
                  const sideHref = plan.buttonLink.trim() || '#';
                  return (
                    <article
                      key={`${String(plan.id ?? index)}-${index}`}
                      className={cn('flex flex-1 flex-col border p-4', cardRadiusClassName)}
                      style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                    >
                      <h4 className="text-sm font-semibold" style={{ color: tokens.neutralText }}>{plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}</h4>
                      <p className="mt-2 text-xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                        {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                        <span className="ml-1 text-xs font-normal" style={{ color: tokens.periodText }}>{normalizePeriod(plan.period, isYearly)}</span>
                      </p>
                      <p className="mt-2 flex-1 text-xs" style={{ color: tokens.mutedText }}>
                        {renderPlanFeatures(plan.features).slice(0, 2).join(', ')}
                      </p>
                      <div className="mt-3">
                        {wrapAction({
                          context,
                          href: sideHref,
                          className: 'block w-full rounded-lg border py-2 text-center text-xs font-semibold transition-colors',
                          style: { backgroundColor: tokens.ctaGhostBg, borderColor: tokens.ctaGhostBorder, color: tokens.ctaGhostText },
                          children: plan.buttonText.trim() || texts.selectButton || 'Chọn',
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (style === 'tabbed') {
    const activeIndex = Math.max(
      0,
      displayPlans.findIndex((plan, index) => getPlanKey(plan, index) === activeTabbedPlanKey),
    );
    const activePlan = displayPlans[activeIndex] ?? displayPlans[0];
    const activeFeatures = renderPlanFeatures(activePlan.features).slice(0, 8);
    const midpoint = Math.ceil(activeFeatures.length / 2);
    const featureColumns = [
      activeFeatures.slice(0, midpoint),
      activeFeatures.slice(midpoint),
    ].filter((column) => column.length > 0);
    const actionHref = activePlan.buttonLink.trim() || '#';
    const isStacked = previewDevice === 'mobile';

    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-6xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div
            className={cn('flex gap-5 border p-4 md:p-5', cardRadiusClassName, isStacked ? 'flex-col' : 'flex-col @md:flex-row')}
            style={{ backgroundColor: tokens.secondary, borderColor: tokens.neutralBorder }}
          >
            <div className={cn('flex shrink-0 gap-3.5', isStacked ? 'w-full flex-col' : 'w-full flex-col @md:w-[45%]')}>
              {displayPlans.map((plan, index) => {
                const planKey = getPlanKey(plan, index);
                const isActive = index === activeIndex;
                return (
                  <button
                    key={planKey}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTabbedPlanKey(planKey)}
                    className={cn(
                      'flex items-center justify-between gap-4 border-2 p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:p-[18px]',
                      cardRadiusClassName,
                    )}
                    style={{
                      backgroundColor: isActive ? tokens.primary : tokens.neutralSurface,
                      borderColor: isActive ? tokens.neutralBorder : 'transparent',
                      color: isActive ? tokens.ctaSolidText : tokens.neutralText,
                    }}
                  >
                    <span className="min-w-0 break-words text-lg font-semibold leading-tight md:text-xl">
                      {plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs opacity-80">từ</span>
                      <span className="text-2xl font-bold tabular-nums">
                        {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn('relative flex w-full flex-col overflow-hidden bg-white px-5 py-5 shadow-sm md:px-[18px] md:py-[14px]', cardRadiusClassName)}
              style={{ border: `1px solid ${tokens.neutralBorder}` }}
            >
              <div className="mb-6 flex items-start justify-between gap-3 border-b border-dashed pb-3" style={{ borderColor: tokens.neutralBorder }}>
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-semibold md:text-xl" style={{ color: tokens.headingText }}>
                    {activePlan.name.trim() || texts.defaultPlanName || 'Gói dịch vụ'}
                  </h3>
                  <div className="mt-1">
                    <span className="text-3xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                      {formatPriceWithSuffix(getPlanPrice(activePlan, isYearly))}
                    </span>
                    <span className="ml-1 text-sm" style={{ color: tokens.periodText }}>
                      {normalizePeriod(activePlan.period, isYearly)}
                    </span>
                  </div>
                </div>
                {activePlan.isPopular ? (
                  <span
                    className="shrink-0 rounded-md border px-3 py-1 text-xs font-semibold uppercase"
                    style={{
                      backgroundColor: tokens.badgeSolidBg,
                      borderColor: tokens.neutralBorder,
                      color: tokens.badgeSolidText,
                    }}
                  >
                    {texts.popularBadge || 'Phổ biến'}
                  </span>
                ) : null}
              </div>

              <div className={cn('mb-8 flex flex-1 gap-6', isStacked ? 'flex-col' : 'flex-col sm:flex-row')}>
                {featureColumns.map((column, columnIndex) => (
                  <ul key={columnIndex} className="flex-1 space-y-3">
                    {column.map((feature, featureIndex) => (
                      <li key={`${columnIndex}-${featureIndex}-${feature}`} className="flex items-start gap-2 text-[15px] font-medium" style={{ color: tokens.featureText }}>
                        <Check size={15} className="mt-0.5 shrink-0" style={{ color: tokens.featureIcon }} />
                        <span className="break-words">{feature}</span>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>

              <div className="mt-auto">
                {wrapAction({
                  context,
                  href: actionHref,
                  className: 'block w-full rounded-full py-3.5 px-6 text-center text-sm font-semibold transition-colors',
                  style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                  children: activePlan.buttonText.trim() || texts.defaultButtonText || 'Xem chi tiết',
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (style === 'construction') {
    return (
      <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
        <div className="mx-auto max-w-6xl">
          {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
          <BillingToggle
            showBillingToggle={showBillingToggle}
            isYearly={isYearly}
            monthlyLabel={monthlyLabel}
            yearlyLabel={yearlyLabel}
            yearlySavingText={yearlySavingText}
            onBillingToggle={onBillingToggle}
            tokens={tokens}
          />

          <div className={cn('grid', cardsGridClass)}>
            {displayPlans.map((plan, index) => {
              const actionHref = plan.buttonLink.trim() || '#';
              const features = renderPlanFeatures(plan.features);
              return (
                <article
                  key={`${String(plan.id ?? index)}-${index}`}
                  className={cn('relative flex h-full flex-col overflow-hidden bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl', cardRadiusClassName)}
                  style={{ border: `1px solid ${tokens.neutralBorder}` }}
                >
                  <div className="absolute left-0 top-0 h-1.5 w-full" style={{ backgroundColor: tokens.primary }} />

                  <div className="px-6 pb-8 pt-10 text-center">
                    <div className="mb-6 flex justify-center">
                      <h3
                        className="m-0 inline-block rounded-full border px-6 py-2 text-sm font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: tokens.primary,
                          borderColor: tokens.neutralBorder,
                          color: tokens.ctaSolidText,
                        }}
                      >
                        {plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <p className="break-words text-4xl font-extrabold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>
                        {formatPriceWithSuffix(getPlanPrice(plan, isYearly))}
                      </p>
                      <p className="mt-2 block text-sm font-medium uppercase tracking-widest" style={{ color: tokens.mutedText }}>
                        {normalizePeriod(plan.period, isYearly)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-grow px-8">
                    <div className="mb-8 h-px w-full" style={{ backgroundColor: tokens.neutralBorder }} />
                    <ul className="space-y-4 text-left">
                      {features.map((feature, featureIndex) => (
                        <li key={`${featureIndex}-${feature}`} className="flex items-start">
                          <Check size={20} className="mr-3 mt-0.5 shrink-0" style={{ color: tokens.featureIcon }} />
                          <span className="break-words leading-snug" style={{ color: tokens.featureText }}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto flex justify-center px-8 pb-10 pt-8">
                    {wrapAction({
                      context,
                      href: actionHref,
                      className: 'block h-14 w-full rounded-full px-6 py-4 text-center text-base font-medium transition-all hover:shadow-md',
                      style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                      children: plan.buttonText.trim() || texts.defaultButtonText || 'Đăng ký ngay',
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const compactPlans = displayPlans;

  return (
    <section className="bg-white px-4" data-mode={mode} style={PRICING_SECTION_FONT}>
      <div className="mx-auto max-w-5xl">
        {!skipHeader && renderSectionHeader({ title, subtitle, tokens })}
        <BillingToggle
          showBillingToggle={showBillingToggle}
          isYearly={isYearly}
          monthlyLabel={monthlyLabel}
          yearlyLabel={yearlyLabel}
          yearlySavingText={yearlySavingText}
          onBillingToggle={onBillingToggle}
          tokens={tokens}
        />

        <div className={cn('grid', compactGridClass)}>
          {compactPlans.map((plan, index) => {
            const actionHref = plan.buttonLink.trim() || '#';
            return (
              <article
                key={`${String(plan.id ?? index)}-${index}`}
                className={cn('relative flex flex-col border p-3 text-center', cardRadiusClassName)}
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderColor: plan.isPopular ? tokens.cardPopularBorder : tokens.cardBorder,
                }}
              >
                {plan.isPopular ? (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: tokens.badgeSolidBg, borderColor: tokens.neutralBorder, color: tokens.badgeSolidText }}
                    >
                      {texts.hotBadge || 'HOT'}
                    </span>
                  </div>
                ) : null}
                <h4 className="mt-1 break-words text-sm font-semibold" style={{ color: tokens.neutralText }}>
                  {plan.name.trim() || `${texts.defaultPlanName || 'Gói'} ${index + 1}`}
                </h4>
                <div className="my-2">
                  <span className="text-xl font-bold tabular-nums" style={{ color: tokens.priceText, ...PRICING_PRICE_SCALE }}>{formatPriceWithSuffix(getPlanPrice(plan, isYearly))}</span>
                  <span className="block text-[10px]" style={{ color: tokens.periodText }}>{normalizePeriod(plan.period, isYearly)}</span>
                </div>
                <p className="mb-2 min-h-[2rem] text-[11px]" style={{ color: tokens.mutedText }}>
                  {renderPlanFeatures(plan.features).slice(0, 2).join(', ')}
                </p>
                {plan.isPopular
                  ? wrapAction({
                      context,
                      href: actionHref,
                      className: 'mt-auto block w-full rounded py-1.5 text-center text-xs font-semibold transition-colors',
                      style: { backgroundColor: tokens.ctaSolidBg, color: tokens.ctaSolidText },
                      children: plan.buttonText.trim() || 'Chọn',
                    })
                  : wrapAction({
                      context,
                      href: actionHref,
                      className: 'mt-auto block w-full rounded border py-1.5 text-center text-xs font-semibold transition-colors',
                      style: { backgroundColor: tokens.ctaGhostBg, borderColor: tokens.ctaGhostBorder, color: tokens.ctaGhostText },
                      children: plan.buttonText.trim() || 'Chọn',
                    })}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
