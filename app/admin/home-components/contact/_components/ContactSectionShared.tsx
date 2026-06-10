'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Twitter,
  X,
  Youtube,
} from 'lucide-react';
import { cn } from '../../../components/ui';
import { ContactInquiryForm } from '@/components/contact/ContactInquiryForm';
import OpenStreetMapDisplay from '@/components/maps/OpenStreetMapDisplay';
import { sanitizeGoogleMapIframe, type ContactMapData } from '@/lib/contact/getContactMapData';
import { getSectionSpacingClassName } from '../../_shared/types/sectionSpacing';
import { renderContactIcon } from '../_lib/iconOptions';
import { getContactCornerRadiusClassName } from '../_lib/constants';
import type { PreviewDevice } from '../../_shared/hooks/usePreviewDevice';
import { isValidUrl, normalizeZaloPhone } from '../_lib/validation';
import type {
  ContactBrandMode,
  ContactConfigState,
  ContactSocialLink,
  ContactStyle,
} from '../_types';
import type { ContactColorTokens } from '../_lib/colors';
import { DEFAULT_CONTACT_TEXTS } from '../_lib/constants';

type ContactSectionContext = 'preview' | 'site';

interface ContactSectionSharedProps {
  config: ContactConfigState;
  style: ContactStyle;
  tokens: ContactColorTokens;
  mode: ContactBrandMode;
  context: ContactSectionContext;
  device?: PreviewDevice;
  title?: string;
  mapData?: ContactMapData;
  sourcePath?: string;
  isDark?: boolean;
}

const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12.1 2.1c-5.4 0-8.1 3.9-8.1 7.1 0 2 1.2 3.8 3.1 4.5.3.1.5 0 .6-.3.1-.2.2-.8.2-1 0-.3-.1-.4-.3-.7-.6-.8-1-1.9-1-3.1 0-4 3-6.9 7.8-6.9 4.3 0 6.6 2.6 6.6 6.1 0 4.6-2 8.5-5.1 8.5-1.7 0-3-1.4-2.6-3.1.4-2 1.2-4.1 1.2-5.6 0-1.3-.7-2.4-2.2-2.4-1.7 0-3.1 1.8-3.1 4.2 0 1.5.5 2.6.5 2.6s-1.8 7.5-2.1 8.8c-.6 2.4-.1 5.3 0 5.6 0 .2.2.2.3.1.1-.1 1.9-2.3 2.5-4.5.2-.6 1.1-4.4 1.1-4.4.6 1.1 2.2 2 3.9 2 5.1 0 8.6-4.6 8.6-10.8 0-4.6-3.9-9-9.6-9z" />
  </svg>
);

const TikTokIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const ZaloIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 0 1-.5763-.5729l-.0006.0005a3.273 3.273 0 0 1-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 0 1 1.9372.6321l.0006.0005zM6.9188 7.7896v.205c0 .3823-.051.6944-.2995 1.0605l-.03.0343c-.0542.0615-.1815.206-.2421.2843L2.024 14.8h4.8948v.7682a.5764.5764 0 0 1-.5767.5761H0v-.3622c0-.4436.1102-.6414.2495-.8476L4.8582 9.23H.1922V7.7896h6.7266zm8.5513 8.3548a.4805.4805 0 0 1-.4803-.4798v-7.875h1.4416v8.3548H15.47zM20.6934 9.6C22.52 9.6 24 11.0807 24 12.9044c0 1.8252-1.4801 3.306-3.3066 3.306-1.8264 0-3.3066-1.4808-3.3066-3.306 0-1.8237 1.4802-3.3044 3.3066-3.3044zm-10.1412 5.253c1.0675 0 1.9324-.8645 1.9324-1.9312 0-1.065-.865-1.9295-1.9324-1.9295s-1.9324.8644-1.9324 1.9295c0 1.0667.865 1.9312 1.9324 1.9312zm10.1412-.0033c1.0737 0 1.945-.8707 1.945-1.9453 0-1.073-.8713-1.9436-1.945-1.9436-1.0753 0-1.945.8706-1.945 1.9436 0 1.0746.8697 1.9453 1.945 1.9453z" />
  </svg>
);

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  twitter: Twitter,
  x: X,
  youtube: Youtube,
  zalo: ZaloIcon,
  pinterest: PinterestIcon,
};

const getSocialIconComponent = (platform: string) => iconMap[platform.toLowerCase()] ?? Globe;

const resolveSocialHref = (social: ContactSocialLink) => {
  const trimmed = social.url.trim();
  if (!trimmed) {return '#';}

  if (social.platform.trim().toLowerCase() !== 'zalo') {
    return trimmed;
  }

  if (isValidUrl(trimmed)) {
    return trimmed;
  }

  const normalizedPhone = normalizeZaloPhone(trimmed);
  return normalizedPhone ? `https://zalo.me/${normalizedPhone}` : '#';
};

const SOCIAL_ORIGINAL_COLORS: Record<string, { bg: string; icon: string }> = {
  facebook: { bg: '#1877f2', icon: '#ffffff' },
  instagram: { bg: '#e1306c', icon: '#ffffff' },
  youtube: { bg: '#ff0000', icon: '#ffffff' },
  tiktok: { bg: '#000000', icon: '#ffffff' },
  zalo: { bg: '#0084ff', icon: '#ffffff' },
  twitter: { bg: '#1da1f2', icon: '#ffffff' },
  x: { bg: '#000000', icon: '#ffffff' },
  pinterest: { bg: '#E60023', icon: '#ffffff' },
  linkedin: { bg: '#0a66c2', icon: '#ffffff' },
};

const getDisplayDevice = (context: ContactSectionContext, device?: PreviewDevice): PreviewDevice => {
  if (context === 'site') {return 'desktop';}
  return device ?? 'desktop';
};

const getSectionInlinePadding = (context: ContactSectionContext, currentDevice: PreviewDevice) => {
  if (context === 'site') {return 'px-4';}
  return currentDevice === 'mobile' ? 'px-3' : 'px-4';
};

const getRootContainerClass = (context: ContactSectionContext, currentDevice: PreviewDevice) => {
  if (context === 'site') {return 'max-w-6xl mx-auto';}
  if (currentDevice === 'mobile') {return 'w-full';}
  if (currentDevice === 'tablet') {return 'max-w-3xl mx-auto';}
  return 'max-w-5xl mx-auto';
};

const MAP_HEIGHT_HERO = 'min-h-[320px] md:min-h-[360px]';
const MAP_HEIGHT_STANDARD = 'min-h-[240px] md:min-h-[280px]';

const getContactItemGridClassName = (
  columns: ContactConfigState['desktopColumns'],
  currentDevice: PreviewDevice,
  context: ContactSectionContext,
) => {
  const desktopColumns = columns === 3 ? 3 : 4;

  if (context === 'site') {
    return desktopColumns === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  }

  if (desktopColumns === 3) {
    return currentDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-3';
  }

  return currentDevice === 'desktop' ? 'grid-cols-4' : 'grid-cols-2';
};

const getInfo = (config: ContactConfigState, title?: string) => {
  const texts = config.texts ?? {};
  const defaultTexts = DEFAULT_CONTACT_TEXTS[config.style] ?? {};
  
  const heading = (config.formTitle ?? title)?.trim() || 'Liên hệ với chúng tôi';
  const description = config.formDescription?.trim() || defaultTexts.description || 'Chúng tôi luôn sẵn sàng hỗ trợ bạn';
  const submitLabel = config.submitButtonText?.trim() || 'Gửi yêu cầu';
  const responseText = config.responseTimeText?.trim() || 'Phản hồi trong 24h';
  const subjectFallback = heading || title || 'Liên hệ từ website';

  return {
    heading,
    description,
    submitLabel,
    responseText,
    subjectFallback,
    texts: {
      badge: texts.badge || defaultTexts.badge || 'Thông tin liên hệ',
      heading: texts.heading || defaultTexts.heading || 'Kết nối với chúng tôi',
      description: texts.description || defaultTexts.description || 'Chúng tôi luôn sẵn sàng hỗ trợ bạn',
    },
  };
};

const renderMapOrPlaceholder = ({
  mapData,
  fallbackEmbed,
  tokens,
  isPreview,
  className = 'w-full h-full',
}: {
  mapData?: ContactMapData;
  fallbackEmbed?: string;
  tokens: ContactColorTokens;
  isPreview: boolean;
  className?: string;
}) => {
  const sanitizedIframe = mapData?.mapProvider === 'google_embed'
    ? sanitizeGoogleMapIframe(mapData.googleMapEmbedIframe)
    : '';

  if (mapData?.mapProvider === 'google_embed' && sanitizedIframe) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedIframe }}
      />
    );
  }

  if (mapData?.mapProvider === 'openstreetmap') {
    return (
      <div className={className}>
        <OpenStreetMapDisplay
          location={{
            address: mapData.address || 'Vị trí doanh nghiệp',
            lat: mapData.lat,
            lng: mapData.lng,
          }}
          height="100%"
          zoom={15}
        />
      </div>
    );
  }

  if (fallbackEmbed) {
    return <iframe src={fallbackEmbed} className={`${className} border-0`} loading="lazy" title="Google Map" />;
  }

  return (
    <div className={cn(className, 'flex flex-col items-center justify-center text-center gap-2')} style={{ backgroundColor: tokens.mapPlaceholderBg, color: tokens.mapPlaceholderIcon }}>
      <MapPin size={32} />
      <span className="text-xs">Chưa có bản đồ</span>
      {isPreview && (
        <Link
          href="/admin/settings"
          className="text-xs font-medium underline"
          style={{ color: tokens.primary }}
        >
          Cấu hình trong Settings
        </Link>
      )}
    </div>
  );
};

const IconBadge = ({
  icon,
  tokens,
  size = 18,
  className,
}: {
  icon: React.ReactNode;
  tokens: ContactColorTokens;
  size?: number;
  className?: string;
}) => (
  <div
    className={cn(
      'rounded-full flex items-center justify-center shrink-0',
      size >= 24 ? 'w-12 h-12' : size >= 20 ? 'w-10 h-10' : 'w-9 h-9',
      className,
    )}
    style={{ backgroundColor: tokens.iconTintBackground, color: tokens.iconTintColor }}
  >
    {icon}
  </div>
);

const getDisplayItems = (config: ContactConfigState, isPreview: boolean) => {
  const items = config.contactItems ?? [];
  return items.filter((item) => {
    const hasLabel = item.label?.trim().length > 0;
    const hasValue = (item.value ?? '').trim().length > 0 || (item.href ?? '').trim().length > 0;
    return hasLabel && (isPreview || hasValue);
  });
};

const renderItemValue = (item: ContactConfigState['contactItems'][number], tokens: ContactColorTokens, isPreview: boolean, className = 'text-sm') => {
  const displayValue = item.value?.trim() || item.href?.trim() || (isPreview ? 'Chưa có nội dung' : '');
  if (!displayValue) {return null;}
  const textClassName = cn('min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]', className);
  const content = <span className={textClassName} style={{ color: tokens.valueText }}>{displayValue}</span>;

  if (!item.href) {return content;}
  const isExternal = item.href.startsWith('http');
  return (
    <a
      href={item.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={textClassName}
      style={{ color: tokens.valueText }}
    >
      {displayValue}
    </a>
  );
};

const ContactItemRow = ({
  item,
  tokens,
  iconSize = 16,
  isPreview,
  valueClassName,
}: {
  item: ContactConfigState['contactItems'][number];
  tokens: ContactColorTokens;
  iconSize?: number;
  isPreview: boolean;
  valueClassName?: string;
}) => {
  return (
    <div className="flex items-start gap-3">
      <IconBadge icon={renderContactIcon(item.icon, iconSize)} tokens={tokens} className="mt-0.5" />
      <div className="min-w-0">
        <h4 className="font-semibold text-sm mb-0.5" style={{ color: tokens.labelText }}>{item.label}</h4>
        {renderItemValue(item, tokens, isPreview, valueClassName ?? 'text-sm')}
      </div>
    </div>
  );
};

const ContactItemCard = ({
  item,
  tokens,
  iconSize = 18,
  isPreview,
  radiusClassName,
}: {
  item: ContactConfigState['contactItems'][number];
  tokens: ContactColorTokens;
  iconSize?: number;
  isPreview: boolean;
  radiusClassName?: string;
}) => {
  return (
    <div className={cn('flex min-w-0 flex-col items-center border p-5 text-center', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
      <IconBadge icon={renderContactIcon(item.icon, iconSize)} tokens={tokens} className="mb-3" />
      <h3 className="font-medium text-sm mb-1" style={{ color: tokens.labelText }}>{item.label}</h3>
      {renderItemValue(item, tokens, isPreview, 'text-sm font-semibold')}
    </div>
  );
};

const ContactSocialLinks = ({
  socials,
  tokens,
  size = 18,
  centered = false,
  useOriginalColors = true,
}: {
  socials: ContactSocialLink[];
  tokens: ContactColorTokens;
  size?: number;
  centered?: boolean;
  useOriginalColors?: boolean;
}) => {
  if (socials.length === 0) {return null;}

  const resolveSocialStyles = (platform: string) => {
    if (!useOriginalColors) {
      return {
        bg: tokens.socialBackground,
        border: tokens.socialBorder,
        color: tokens.socialIcon,
      };
    }

    const original = SOCIAL_ORIGINAL_COLORS[platform];
    if (!original) {
      return {
        bg: tokens.socialBackground,
        border: tokens.socialBorder,
        color: tokens.socialIcon,
      };
    }

    return {
      bg: original.bg,
      border: original.bg,
      color: original.icon,
    };
  };

  return (
    <div className={cn('flex items-center gap-2', centered && 'justify-center')}>
      {socials.map((social, idx) => {
        const Icon = getSocialIconComponent(social.platform);
        const styles = resolveSocialStyles(social.platform);
        return (
          <a
            key={`${social.id}-${social.platform}-${idx}`}
            href={resolveSocialHref(social)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
            style={{
              backgroundColor: styles.bg,
              borderColor: styles.border,
              color: styles.color,
            }}
            aria-label={social.platform || 'social'}
          >
            <Icon size={size} />
          </a>
        );
      })}
    </div>
  );
};

const ContactSectionHeader = ({
  title,
  config,
  tokens,
}: {
  title?: string;
  config: ContactConfigState;
  tokens: ContactColorTokens;
}) => {
  const resolvedTitle = typeof title === 'string' ? title.trim() : '';
  const resolvedSubtitle = typeof config.subtitle === 'string' ? config.subtitle.trim() : '';
  const resolvedBadgeText = typeof config.badgeText === 'string' ? config.badgeText.trim() : '';
  const hasTitle = config.showTitle !== false && resolvedTitle.length > 0;
  const hasSubtitle = config.showSubtitle !== false && resolvedSubtitle.length > 0;
  const hasBadge = config.showBadge !== false && resolvedBadgeText.length > 0;

  if (config.hideHeader || (!hasTitle && !hasSubtitle && !hasBadge)) {
    return null;
  }

  const headerAlign = config.headerAlign ?? 'left';
  const alignClass = headerAlign === 'center' ? 'text-center' : headerAlign === 'right' ? 'text-right' : 'text-left';
  const widthClass = headerAlign === 'center' ? 'mx-auto max-w-3xl' : headerAlign === 'right' ? 'ml-auto max-w-3xl' : 'mr-auto max-w-3xl';
  const titleColor = config.titleColorPrimary ? tokens.primary : tokens.heading;

  const badgeElement = hasBadge && (
    <div className={cn('mb-3 md:mb-4', alignClass)}>
      <span
        className="inline-block rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-wider"
        style={{
          backgroundColor: tokens.sectionBadgeBg,
          borderColor: tokens.sectionBadgeBorder,
          color: tokens.sectionBadgeText,
        }}
      >
        {resolvedBadgeText}
      </span>
    </div>
  );

  const titleElement = hasTitle && (
    <h2
      className={cn(
        'mb-2 text-2xl font-bold leading-tight tracking-tight text-balance md:text-3xl',
        config.uppercaseText && 'uppercase',
      )}
      style={{ color: titleColor }}
    >
      {resolvedTitle}
    </h2>
  );

  const subtitleElement = hasSubtitle && (
    <p
      className={cn(
        'text-sm leading-relaxed md:text-base',
        config.uppercaseText ? 'font-medium uppercase tracking-wide' : 'font-normal',
      )}
      style={{ color: tokens.helperText }}
    >
      {resolvedSubtitle}
    </p>
  );

  return (
    <div className={cn('mb-4 md:mb-6', widthClass, alignClass)}>
      {badgeElement}
      {config.subtitleAboveTitle ? (
        <>
          {subtitleElement}
          {titleElement}
        </>
      ) : (
        <>
          {titleElement}
          {subtitleElement}
        </>
      )}
    </div>
  );
};

const renderModern = ({
  info,
  config,
  tokens,
  currentDevice,
  activeSocials,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  activeSocials: ContactSocialLink[];
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);
  const contactItems = getDisplayItems(config, isPreview);
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);
  const contentWidthClass = isPreview
    ? currentDevice === 'mobile' ? 'w-full' : hasMap ? 'lg:w-1/2' : 'lg:w-full'
    : hasMap ? 'w-full lg:w-1/2' : 'w-full';
  const mapWidthClass = isPreview
    ? currentDevice === 'mobile' ? `w-full ${MAP_HEIGHT_STANDARD}` : `lg:w-1/2 ${MAP_HEIGHT_HERO}`
    : 'w-full lg:w-1/2 min-h-[240px] md:min-h-[280px] lg:min-h-[360px]';

  return (
    <div
      className={cn('overflow-hidden border shadow-sm', radiusClassName)}
      style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}
    >
      <div className={cn('flex min-h-[380px]', currentDevice === 'mobile' ? 'flex-col' : 'flex-col lg:flex-row')}>
        <div
          className={cn(
            'p-6 lg:p-10 flex flex-col justify-center gap-6',
            contentWidthClass,
          )}
        >
        <div className="max-w-md mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border mb-4"
            style={{
              backgroundColor: tokens.sectionBadgeBg,
              color: tokens.sectionBadgeText,
              borderColor: tokens.sectionBadgeBorder,
            }}
          >
            {info.texts.badge}
          </div>
          <h2 className={cn('font-bold tracking-tight mb-6', currentDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>
            {info.texts.heading}
          </h2>

          <div className="space-y-5">
            {contactItems.map((item) => (
              <ContactItemRow key={item.id} item={item} tokens={tokens} isPreview={isPreview} />
            ))}
          </div>

          {activeSocials.length > 0 && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: tokens.neutralBorder }}>
              <ContactSocialLinks socials={activeSocials} tokens={tokens} useOriginalColors={useOriginalSocialIconColors} />
            </div>
          )}
        </div>

        {hasForm && (
          <div className="w-full">
            <ContactInquiryForm
              brandColor={tokens.primary}
              secondaryColor={tokens.secondary}
              title={info.heading}
              description={info.description}
              submitLabel={info.submitLabel}
              responseTimeText={info.responseText}
              fields={config.formFields}
              tokens={tokens}
              sourcePath={sourcePath}
              subjectFallback={info.subjectFallback}
              isPreview={isPreview}
            />
          </div>
        )}
      </div>

      {hasMap && (
        <div
          className={cn(
            'relative border-t lg:border-t-0 lg:border-l',
            mapWidthClass,
          )}
          style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.mapPlaceholderBg }}
        >
          {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
        </div>
      )}
    </div>
  </div>
  );
};

const renderFloating = ({
  info,
  config,
  tokens,
  currentDevice,
  activeSocials,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  activeSocials: ContactSocialLink[];
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);
  const contactItems = getDisplayItems(config, isPreview);
  const hasAux = hasForm || hasMap;
  const useOriginalSocialIconColors = config.useOriginalSocialIconColors !== false;
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);
  const gridClass = isPreview
    ? currentDevice === 'mobile'
      ? 'grid-cols-1'
      : hasAux
        ? 'grid-cols-[1fr,1fr]'
        : 'grid-cols-1'
    : hasAux ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div
      className={cn('w-full overflow-hidden border shadow-sm', radiusClassName, currentDevice === 'mobile' ? 'min-h-[520px]' : 'min-h-[460px]')}
      style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}
    >
      <div className={cn('grid gap-6 p-6 lg:p-8', gridClass)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-bold" style={{ color: tokens.heading }}>{info.texts.heading}</h2>
          <p className="text-sm" style={{ color: tokens.helperText }}>{info.texts.description}</p>
        </div>

        <div className="space-y-4">
          {contactItems.map((item) => (
            <ContactItemRow key={item.id} item={item} tokens={tokens} isPreview={isPreview} />
          ))}
        </div>

        {activeSocials.length > 0 && (
          <div className="pt-4 border-t" style={{ borderColor: tokens.neutralBorder }}>
            <ContactSocialLinks socials={activeSocials} tokens={tokens} useOriginalColors={useOriginalSocialIconColors} />
          </div>
        )}
      </div>

      {hasAux && (
        <div className="space-y-4">
        {hasForm && (
          <ContactInquiryForm
            brandColor={tokens.primary}
            secondaryColor={tokens.secondary}
            title={info.heading}
            description={info.description}
            submitLabel={info.submitLabel}
            responseTimeText={info.responseText}
            fields={config.formFields}
            tokens={tokens}
            sourcePath={sourcePath}
            subjectFallback={info.subjectFallback}
            isPreview={isPreview}
          />
        )}
        {hasMap && (
          <div
            className={cn('relative overflow-hidden border', radiusClassName, currentDevice === 'mobile' ? MAP_HEIGHT_STANDARD : MAP_HEIGHT_STANDARD)}
            style={{ borderColor: tokens.neutralBorder }}
          >
            {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
          </div>
        )}
      </div>
      )}
    </div>
  </div>
  );
};

const renderGrid = ({
  info,
  config,
  tokens,
  currentDevice,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);
  const contactItems = getDisplayItems(config, isPreview);
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);
  const gridColumns = isPreview
    ? currentDevice === 'mobile'
      ? 'grid-cols-1'
      : hasForm && hasMap
        ? 'grid-cols-2'
        : 'grid-cols-1'
    : hasForm && hasMap ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div className={cn('w-full border p-6', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.neutralBackground }}>
    <div className={cn('mb-6 grid gap-3', getContactItemGridClassName(config.desktopColumns, currentDevice, isPreview ? 'preview' : 'site'))}>
      {contactItems.map((item) => (
        <ContactItemCard key={item.id} item={item} tokens={tokens} isPreview={isPreview} radiusClassName={radiusClassName} />
      ))}
    </div>

    <div className={cn('grid gap-4 items-stretch', gridColumns)}>
      {hasForm && (
        <div className={cn('h-full border p-4', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
          <ContactInquiryForm
            brandColor={tokens.primary}
            secondaryColor={tokens.secondary}
            title={info.heading}
            description={info.description}
            submitLabel={info.submitLabel}
            responseTimeText={info.responseText}
            fields={config.formFields}
            tokens={tokens}
            sourcePath={sourcePath}
            subjectFallback={info.subjectFallback}
            withContainer={false}
            isPreview={isPreview}
          />
        </div>
      )}
      {hasMap && (
        <div className={cn('flex h-full flex-col border p-4', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
          <div className="flex items-start gap-3">
            <MapPin size={20} className="shrink-0 mt-0.5" style={{ color: tokens.secondary }} />
            <div className="min-w-0">
              <h3 className="font-bold text-base mb-1.5" style={{ color: tokens.heading }}>Vị trí bản đồ</h3>
              <p className="text-sm leading-relaxed" style={{ color: tokens.valueText }}>{mapData?.address || 'Địa chỉ đang cập nhật'}</p>
            </div>
          </div>
          <div
            className={cn(
              'relative mt-4 flex-1 overflow-hidden',
              radiusClassName,
              currentDevice === 'mobile' ? MAP_HEIGHT_STANDARD : 'min-h-[240px]',
            )}
          >
            {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

const renderElegant = ({
  info,
  config,
  tokens,
  currentDevice,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);
  const contactItems = getDisplayItems(config, isPreview);
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);
  const layoutClass = isPreview
    ? currentDevice === 'mobile' ? 'flex-col' : 'flex-row'
    : 'flex-col lg:flex-row';
  const infoWidthClass = isPreview
    ? currentDevice === 'mobile' ? 'w-full' : hasMap ? 'w-5/12' : 'w-full'
    : hasMap ? 'w-full lg:w-5/12' : 'w-full';
  const mapWidthClass = isPreview
    ? currentDevice === 'mobile' ? `w-full ${MAP_HEIGHT_STANDARD}` : `w-7/12 ${MAP_HEIGHT_HERO}`
    : 'w-full lg:w-7/12 min-h-[240px] md:min-h-[280px] lg:min-h-[360px]';

  return (
    <div className={cn('w-full overflow-hidden border shadow-sm', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
    <div className="p-6 border-b text-center" style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.neutralBackground }}>
      <div className="flex justify-center mb-3">
        <IconBadge icon={<Building2 size={22} />} tokens={tokens} size={24} />
      </div>
      <h2 className={cn('font-bold tracking-tight', currentDevice === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: tokens.heading }}>
        {info.texts.heading}
      </h2>
      <p className="mt-1.5 max-w-lg mx-auto text-sm" style={{ color: tokens.helperText }}>
        {info.texts.description}
      </p>
    </div>

    <div className={cn('flex', layoutClass)}>
      <div
        className={cn('p-6 space-y-0 divide-y', infoWidthClass)}
        style={{ borderColor: tokens.neutralBorder }}
      >
        {contactItems.map((item) => (
          <div key={item.id} className="py-4 first:pt-0">
            <p className="text-[10px] font-semibold uppercase mb-1.5" style={{ color: tokens.labelText }}>{item.label}</p>
            <div className="flex items-center gap-2.5">
              <span className="shrink-0" style={{ color: tokens.secondary }}>
                {renderContactIcon(item.icon, 16)}
              </span>
              {renderItemValue(item, tokens, isPreview, 'text-sm font-medium')}
            </div>
          </div>
        ))}

        {hasForm && (
          <div className="pt-6">
            <ContactInquiryForm
              brandColor={tokens.primary}
              secondaryColor={tokens.secondary}
              title={info.heading}
              description={info.description}
              submitLabel={info.submitLabel}
              responseTimeText={info.responseText}
              fields={config.formFields}
              tokens={tokens}
              sourcePath={sourcePath}
              subjectFallback={info.subjectFallback}
              isPreview={isPreview}
            />
          </div>
        )}
      </div>

      {hasMap && (
        <div
          className={cn(
            'relative border-t lg:border-t-0 lg:border-l',
            mapWidthClass,
          )}
          style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.mapPlaceholderBg }}
        >
          {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
        </div>
      )}
    </div>
  </div>
  );
};

const renderMinimal = ({
  info,
  config,
  tokens,
  currentDevice,
  activeSocials,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  activeSocials: ContactSocialLink[];
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);

  return (
  <div className={cn('w-full overflow-hidden border shadow-sm', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
    <div className="p-6 lg:p-10">
      <div className="text-center mb-8">
        <h2 className={cn('font-bold tracking-tight', currentDevice === 'mobile' ? 'text-xl' : 'text-2xl')} style={{ color: tokens.heading }}>{info.heading}</h2>
        <p className="text-sm mt-2" style={{ color: tokens.helperText }}>{info.description}</p>
      </div>
      <div className={cn('grid gap-4', getContactItemGridClassName(config.desktopColumns, currentDevice, isPreview ? 'preview' : 'site'))}>
        {getDisplayItems(config, isPreview).map((item) => (
          <ContactItemCard key={item.id} item={item} tokens={tokens} isPreview={isPreview} iconSize={20} radiusClassName={radiusClassName} />
        ))}
      </div>
      {config.showForm && (
        <div className="mb-8">
          <ContactInquiryForm
            brandColor={tokens.primary}
            secondaryColor={tokens.secondary}
            title={info.heading}
            description={info.description}
            submitLabel={info.submitLabel}
            responseTimeText={info.responseText}
            fields={config.formFields}
            tokens={tokens}
            sourcePath={sourcePath}
            subjectFallback={info.subjectFallback}
            isPreview={isPreview}
          />
        </div>
      )}
      {(activeSocials.length > 0 || config.showMap) && (
        <div className="mt-8 pt-6 border-t space-y-4" style={{ borderColor: tokens.neutralBorder }}>
          {activeSocials.length > 0 && (
            <ContactSocialLinks
              socials={activeSocials}
              tokens={tokens}
              centered={currentDevice !== 'mobile'}
              useOriginalColors={config.useOriginalSocialIconColors !== false}
            />
          )}
          {config.showMap && (
            <div className={cn('relative w-full overflow-hidden', radiusClassName, MAP_HEIGHT_STANDARD)}>
              {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

const renderCentered = ({
  info,
  config,
  tokens,
  currentDevice,
  activeSocials,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  activeSocials: ContactSocialLink[];
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);
  const contactItems = getDisplayItems(config, isPreview);
  const radiusClassName = getContactCornerRadiusClassName(config.cornerRadius);
  const gridColumns = isPreview
    ? currentDevice === 'mobile'
      ? 'grid-cols-1'
      : hasForm
        ? 'grid-cols-2'
        : 'grid-cols-1'
    : hasForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

  return (
    <div className={cn('w-full overflow-hidden border shadow-sm', radiusClassName)} style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}>
    <div className="text-center p-4 lg:p-6" style={{ backgroundColor: tokens.centeredHeaderBg }}>
      <div className="mb-3 flex justify-center">
        <IconBadge icon={renderContactIcon('phone', 28)} tokens={tokens} size={24} />
      </div>
      <h2 className={cn('mb-1.5 font-bold tracking-tight', currentDevice === 'mobile' ? 'text-lg' : 'text-xl')} style={{ color: tokens.heading }}>{info.heading}</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: tokens.helperText }}>{info.description}</p>
      <p className="text-xs mt-2" style={{ color: tokens.labelText }}>{info.responseText}</p>
      <span className="mt-3 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold" style={{ backgroundColor: tokens.sectionBadgeBg, borderColor: tokens.sectionBadgeBorder, color: tokens.sectionBadgeText }}>
        {info.submitLabel}
      </span>
    </div>
    <div className="space-y-4 p-4 lg:p-5">
      <div className={cn('grid gap-4', gridColumns)}>
        <div className="space-y-3">
          {contactItems.map((item) => (
            <div key={item.id} className={cn('flex min-w-0 items-center gap-3 p-3', radiusClassName)} style={{ backgroundColor: tokens.centeredSurface }}>
              <IconBadge icon={renderContactIcon(item.icon, 18)} tokens={tokens} size={18} />
              <div className="min-w-0">
                <p className="text-xs mb-0.5" style={{ color: tokens.labelText }}>{item.label}</p>
                {renderItemValue(item, tokens, isPreview, 'text-sm font-bold')}
              </div>
            </div>
          ))}
          {activeSocials.length > 0 && (
            <div className="pt-2">
              <ContactSocialLinks
                socials={activeSocials}
                tokens={tokens}
                size={20}
                centered
                useOriginalColors={config.useOriginalSocialIconColors !== false}
              />
            </div>
          )}
        </div>

        {hasForm && (
          <ContactInquiryForm
            brandColor={tokens.primary}
            secondaryColor={tokens.secondary}
            title={info.heading}
            description={info.description}
            submitLabel={info.submitLabel}
            responseTimeText={info.responseText}
            fields={config.formFields}
            tokens={tokens}
            sourcePath={sourcePath}
            subjectFallback={info.subjectFallback}
            isPreview={isPreview}
          />
        )}
      </div>

      {hasMap && (
        <div className={cn('relative w-full overflow-hidden', radiusClassName, currentDevice === 'mobile' ? MAP_HEIGHT_STANDARD : MAP_HEIGHT_STANDARD)}>
          {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens, className: 'absolute inset-0', isPreview })}
        </div>
      )}
    </div>
  </div>
  );
};

const renderKanban = ({
  info,
  config,
  tokens,
  currentDevice,
  activeSocials,
  mapData,
  sourcePath,
  isPreview,
}: {
  info: ReturnType<typeof getInfo>;
  config: ContactConfigState;
  tokens: ContactColorTokens;
  currentDevice: PreviewDevice;
  activeSocials: ContactSocialLink[];
  mapData?: ContactMapData;
  sourcePath?: string;
  isPreview: boolean;
}) => {
  const contactItems = getDisplayItems(config, isPreview);
  const hasForm = Boolean(config.showForm);
  const hasMap = Boolean(config.showMap);

  const kanbanTokens = {
    ...tokens,
    formBackground: 'transparent',
  };

  let columnsCount = 1;
  if (hasForm) {
    columnsCount++;
  }
  if (hasMap) {
    columnsCount++;
  }

  const gridClass = isPreview
    ? currentDevice === 'mobile'
      ? 'grid-cols-1'
      : columnsCount === 3
        ? 'grid-cols-3'
        : columnsCount === 2
          ? 'grid-cols-2'
          : 'grid-cols-1'
    : columnsCount === 3
      ? 'grid-cols-1 lg:grid-cols-3'
      : columnsCount === 2
        ? 'grid-cols-1 lg:grid-cols-2'
        : 'grid-cols-1';

  return (
    <div
      className="w-full rounded-sm border p-4 transition-colors duration-300"
      style={{
        backgroundColor: tokens.neutralBackground,
        borderColor: tokens.neutralBorder,
      }}
    >
      <div className={cn('grid gap-4 items-stretch', gridClass)}>
        <div className="flex flex-col space-y-3">
          <div className="border-b pb-1.5" style={{ borderColor: tokens.neutralBorder }}>
            <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase" style={{ color: tokens.labelText }}>
              {info.texts.badge || 'Thông tin liên hệ'}
            </span>
          </div>
          <div className="space-y-2 flex-1">
            {contactItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 p-2.5 border rounded-sm transition-all duration-200 group border-l-[3px]"
                style={{
                  backgroundColor: tokens.cardBackground,
                  borderTopColor: tokens.cardBorder,
                  borderRightColor: tokens.cardBorder,
                  borderBottomColor: tokens.cardBorder,
                  borderLeftColor: tokens.primary,
                }}
              >
                <div className="shrink-0 mt-0.5" style={{ color: kanbanTokens.primary }}>
                  {renderContactIcon(item.icon, 14)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider mb-0.5" style={{ color: tokens.labelText }}>{item.label}</h4>
                  {renderItemValue(item, kanbanTokens, isPreview, 'text-xs font-semibold leading-relaxed')}
                </div>
              </div>
            ))}
          </div>

          {activeSocials.length > 0 && (
            <div className="pt-3 border-t" style={{ borderColor: tokens.neutralBorder }}>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeSocials.map((social, idx) => {
                  const Icon = getSocialIconComponent(social.platform);
                  const original = SOCIAL_ORIGINAL_COLORS[social.platform];
                  const bg = original?.bg || tokens.socialBackground;
                  const border = original?.bg || tokens.socialBorder;
                  const color = original?.icon || tokens.socialIcon;

                  return (
                    <a
                      key={`${social.id}-${social.platform}-${idx}`}
                      href={resolveSocialHref(social)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-sm border flex items-center justify-center transition-colors duration-200"
                      style={{
                        backgroundColor: bg,
                        borderColor: border,
                        color: color,
                      }}
                      aria-label={social.platform || 'social'}
                    >
                      <Icon size={12} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {hasForm && (
          <div className="flex flex-col space-y-3">
            <div className="border-b pb-1.5" style={{ borderColor: tokens.neutralBorder }}>
              <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase" style={{ color: tokens.labelText }}>
                {info.heading || 'Gửi yêu cầu'}
              </span>
            </div>
            <div
              className={cn(
                "p-3 border rounded-sm flex-1",
                " [&_input]:rounded-none [&_textarea]:rounded-none [&_button]:rounded-none [&_input]:text-xs [&_textarea]:text-xs [&_button]:text-xs",
                " [&_input]:px-2.5 [&_textarea]:px-2.5 [&_input]:py-2 [&_textarea]:py-2 [&_button]:py-2.5",
                "hover:[&_button]:opacity-90 [&_svg]:hidden"
              )}
              style={{
                backgroundColor: tokens.cardBackground,
                borderColor: tokens.cardBorder,
              }}
            >
              <ContactInquiryForm
                brandColor={kanbanTokens.primary}
                secondaryColor={kanbanTokens.secondary}
                title={undefined}
                description={undefined}
                submitLabel={info.submitLabel}
                responseTimeText={info.responseText}
                fields={config.formFields}
                tokens={kanbanTokens}
                sourcePath={sourcePath}
                subjectFallback={info.subjectFallback}
                withContainer={false}
                isPreview={isPreview}
              />
            </div>
          </div>
        )}

        {hasMap && (
          <div className="flex flex-col space-y-3">
            <div className="border-b pb-1.5" style={{ borderColor: tokens.neutralBorder }}>
              <span className="text-[10px] font-extrabold tracking-[0.15em] uppercase" style={{ color: tokens.labelText }}>
                Bản đồ vị trí
              </span>
            </div>
            <div
              className="border rounded-sm flex-1 overflow-hidden relative min-h-[220px]"
              style={{
                borderColor: tokens.cardBorder,
                backgroundColor: tokens.cardBackground,
              }}
            >
              {renderMapOrPlaceholder({ mapData, fallbackEmbed: config.mapEmbed, tokens: kanbanTokens, className: 'absolute inset-0', isPreview })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function ContactSectionShared({
  config,
  style,
  tokens,
  context,
  device,
  title,
  mapData,
  sourcePath,
  isDark = false,
}: ContactSectionSharedProps) {
  const currentDevice = getDisplayDevice(context, device);
  const isPreview = context === 'preview';
  const info = getInfo(config, title);
  const activeSocials = (config.socialLinks ?? []).filter((social) => social.url && social.url.trim().length > 0);
  const containerClass = getRootContainerClass(context, currentDevice);

  const content = (() => {
    if (style === 'kanban') {
      return renderKanban({ info, config, tokens, currentDevice, activeSocials, mapData, sourcePath, isPreview });
    }

    if (style === 'modern') {
      return renderModern({ info, config, tokens, currentDevice, activeSocials, mapData, sourcePath, isPreview });
    }

    if (style === 'floating') {
      return renderFloating({ info, config, tokens, currentDevice, activeSocials, mapData, sourcePath, isPreview });
    }

    if (style === 'grid') {
      return renderGrid({ info, config, tokens, currentDevice, mapData, sourcePath, isPreview });
    }

    if (style === 'minimal') {
      return renderMinimal({ info, config, tokens, currentDevice, activeSocials, mapData, sourcePath, isPreview });
    }

    if (style === 'centered') {
      return renderCentered({ info, config, tokens, currentDevice, activeSocials, mapData, sourcePath, isPreview });
    }

    return renderElegant({ info, config, tokens, currentDevice, mapData, sourcePath, isPreview });
  })();

  return (
    <section className={cn(getSectionSpacingClassName(config.spacing), getSectionInlinePadding(context, currentDevice), isDark && 'dark')}>
      <div className={cn(containerClass, 'space-y-6')}>
        <ContactSectionHeader
          title={title}
          config={config}
          tokens={tokens}
        />
        {content}
      </div>
    </section>
  );
}
