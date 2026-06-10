'use client';

import React from 'react';
import { Play, Video as VideoIcon } from 'lucide-react';
import { cn } from '@/app/admin/components/ui';
import { SectionHeader } from '../../_shared/components/SectionHeader';
import { getPreviewAwareClass } from '../../_shared/lib/previewResponsive';
import { getSectionSpacingClassName, normalizeSectionSpacing, type SectionSpacing } from '../../_shared/types/sectionSpacing';
import type { VideoColorTokens } from '../_lib/colors';
import { getVideoInfo, getYouTubeThumbnail } from '../_lib/colors';
import type { VideoConfig, VideoProvider, VideoStyle } from '../_types';
import { normalizeVideoCornerRadius, normalizeVideoPlayButtonSize } from '../_lib/constants';

export type VideoSectionDevice = 'desktop' | 'tablet' | 'mobile';

interface VideoSectionSharedProps {
  config: VideoConfig;
  style: VideoStyle;
  tokens: VideoColorTokens;
  title?: string;
  context: 'preview' | 'site';
  isPreview?: boolean;
  device?: VideoSectionDevice;
  // Header config props (Pattern B - caller-driven)
  brandColor?: string;
  hideHeader?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  headerAlign?: 'left' | 'center' | 'right';
  titleColorPrimary?: boolean;
  subtitleAboveTitle?: boolean;
  uppercaseText?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  spacing?: SectionSpacing;
}

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const toSafeHref = (value?: string) => {
  const href = (value ?? '').trim();
  if (!href) {return '#';}

  if (
    href.startsWith('/')
    || href.startsWith('#')
    || href.startsWith('mailto:')
    || href.startsWith('tel:')
    || href.startsWith('http://')
    || href.startsWith('https://')
  ) {
    return href;
  }

  return '#';
};

const toText = (value: unknown, fallback = '') => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || fallback;
};

// (SectionHeading, getCardTextClass, getHeadingClass removed — all layouts use shared SectionHeader)

function VideoSurface({
  videoUrl,
  thumbnailUrl,
  provider,
  title,
  tokens,
  isPlaying,
  onPlay,
  ratioClass = 'aspect-video',
  playSize = 'large',
  roundedClass = 'rounded-xl',
}: {
  videoUrl: string;
  thumbnailUrl: string;
  provider: VideoProvider;
  title: string;
  tokens: VideoColorTokens;
  isPlaying: boolean;
  onPlay: () => void;
  ratioClass?: string;
  playSize?: 'small' | 'medium' | 'large';
  roundedClass?: string;
}) {
  if (!videoUrl) {
    return (
      <div
        className={cn('w-full flex flex-col items-center justify-center border', ratioClass, roundedClass)}
        style={{ backgroundColor: tokens.videoPlaceholder, borderColor: tokens.neutralBorder }}
      >
        <VideoIcon size={42} style={{ color: tokens.iconText }} />
        <p className="mt-2 text-sm" style={{ color: tokens.mutedText }}>Chưa có video</p>
      </div>
    );
  }

  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn('relative overflow-hidden border', ratioClass, roundedClass)} style={{ borderColor: tokens.neutralBorder, backgroundColor: tokens.videoSurface }}>
      {!isPlaying ? (
        <>
          {thumbnailUrl && !imgError ? (
            <img 
              src={thumbnailUrl} 
              alt={title || 'Video thumbnail'} 
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: tokens.videoPlaceholder }}>
              <VideoIcon size={54} style={{ color: tokens.iconText }} />
            </div>
          )}
          <button
            type="button"
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center group"
            style={{ backgroundColor: tokens.sectionOverlay }}
            aria-label="Phát video"
          >
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full transition-colors',
                playSize === 'large' ? 'h-16 w-16 md:h-20 md:w-20' : playSize === 'medium' ? 'h-14 w-14 md:h-16 md:w-16' : 'h-12 w-12',
              )}
              style={{ 
                backgroundColor: tokens.playButtonBackground, 
                color: tokens.playButtonText,
                '--hover-bg': tokens.playButtonHover,
              } as React.CSSProperties}
            >
              <Play className={cn(playSize === 'large' ? 'h-8 w-8' : playSize === 'medium' ? 'h-6 w-6' : 'h-5 w-5', 'translate-x-[1px]')} fill="currentColor" />
            </span>
          </button>
        </>
      ) : (
        <VideoEmbed videoUrl={videoUrl} provider={provider} title={title} />
      )}
    </div>
  );
}

function VideoEmbed({
  videoUrl,
  provider,
  title,
}: {
  videoUrl: string;
  provider: VideoProvider;
  title: string;
}) {
  const info = getVideoInfo(videoUrl);

  if (provider === 'youtube' && info.id) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (provider === 'vimeo' && info.id) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${info.id}?autoplay=1`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (provider === 'drive' && info.id) {
    return (
      <iframe
        src={`https://drive.google.com/file/d/${info.id}/preview`}
        className="absolute inset-0 h-full w-full"
        title={title || 'Video player'}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    );
  }

  if (!videoUrl) {
    return null;
  }

  return (
    <video
      src={videoUrl}
      className="absolute inset-0 h-full w-full object-cover"
      controls
      autoPlay
      playsInline
      muted
    />
  );
}

export function VideoSectionShared({
  config,
  style,
  tokens,
  title,
  context,
  isPreview = false,
  device = 'desktop',
  // Header config props
  brandColor,
  hideHeader: hideHeaderProp,
  showTitle: showTitleProp,
  showSubtitle: showSubtitleProp,
  subtitle: subtitleProp,
  headerAlign: headerAlignProp,
  titleColorPrimary: titleColorPrimaryProp,
  subtitleAboveTitle: subtitleAboveTitleProp,
  uppercaseText: uppercaseTextProp,
  showBadge: showBadgeProp,
  badgeText: badgeTextProp,
  spacing: spacingProp,
}: VideoSectionSharedProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    setIsPlaying(false);
  }, [
    config.videoUrl,
    config.thumbnailUrl,
    config.autoplay,
    config.loop,
    config.muted,
    style,
  ]);

  const heading = toText(title, toText(config.heading));
  const description = toText(config.description);
  const _badge = toText(config.badge);
  const buttonText = toText(config.buttonText);
  const buttonLink = toSafeHref(config.buttonLink);
  const safeVideoUrl = toText(config.videoUrl);
  const info = getVideoInfo(safeVideoUrl);
  const fallbackThumbnail = info.type === 'youtube' && info.id ? getYouTubeThumbnail(info.id) : '';
  const thumbnail = toText(config.thumbnailUrl) || fallbackThumbnail;
  const provider = info.type;
  const isPortraitVideo = config.videoAspect === 'portrait';
  const cornerRadius = normalizeVideoCornerRadius(config.cornerRadius, config.noBorderRadius);
  const playButtonSize = normalizeVideoPlayButtonSize(config.playButtonSize);
  const sectionClassName = cn(getSectionSpacingClassName(config.noVerticalMargin === true ? 'none' : normalizeSectionSpacing(spacingProp ?? config.spacing)), 'px-3');
  const hideHeader = hideHeaderProp ?? config.hideHeader;
  const showTitle = showTitleProp ?? config.showTitle;
  const showSubtitle = showSubtitleProp ?? config.showSubtitle;
  const subtitle = subtitleProp ?? config.subtitle ?? description;
  const headerAlign = headerAlignProp ?? config.headerAlign;
  const titleColorPrimary = titleColorPrimaryProp ?? config.titleColorPrimary;
  const subtitleAboveTitle = subtitleAboveTitleProp ?? config.subtitleAboveTitle;
  const uppercaseText = uppercaseTextProp ?? config.uppercaseText;
  const showBadge = showBadgeProp ?? config.showBadge;
  const badgeText = badgeTextProp ?? config.badgeText;

  // Shared SectionHeader for standard layout styles
  const sharedHeader = (
    <SectionHeader
      title={heading}
      subtitle={subtitle}
      badgeText={badgeText}
      hideHeader={hideHeader}
      showTitle={showTitle}
      showSubtitle={showSubtitle}
      showBadge={showBadge}
      headerAlign={headerAlign}
      titleColorPrimary={titleColorPrimary}
      subtitleAboveTitle={subtitleAboveTitle}
      uppercaseText={uppercaseText}
      brandColor={brandColor ?? tokens.primary}
    />
  );

  // renderBadge removed — badge handled by sharedHeader

  const renderButton = (compact = false) => (
    buttonText ? (
      <a
        href={buttonLink}
        target={isExternalUrl(buttonLink) ? '_blank' : undefined}
        rel={isExternalUrl(buttonLink) ? 'noopener noreferrer' : undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-semibold transition-colors',
          compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm',
        )}
        style={{ 
          backgroundColor: tokens.ctaBackground, 
          color: tokens.ctaText,
          '--hover-bg': tokens.ctaHover,
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = tokens.ctaHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = tokens.ctaBackground;
        }}
      >
        {buttonText}
      </a>
    ) : null
  );

  const ContainerTag = context === 'site' ? 'section' : 'div';
  const videoTitle = heading || title || 'Video';
  const defaultRatioClass = isPortraitVideo ? 'aspect-[9/16]' : 'aspect-video';
  const fullwidthRatioClass = isPortraitVideo ? 'aspect-[9/16]' : (isPreview ? 'aspect-video' : 'aspect-video md:aspect-[21/9]');
  const cinemaRatioClass = isPortraitVideo ? 'aspect-[9/16]' : 'aspect-[21/9]';
  const parallaxRatioClass = isPortraitVideo ? 'aspect-[9/16]' : (isPreview ? 'aspect-video' : 'aspect-video md:aspect-[2/1]');
  const surfaceWrapClassName = isPortraitVideo ? 'mx-auto w-full max-w-[360px]' : 'w-full';
  const roundedClassName = cornerRadius === 'none'
    ? 'rounded-none'
    : cornerRadius === 'sm'
      ? 'rounded-lg'
      : 'rounded-2xl';

  const splitGridClassName = getPreviewAwareClass({
    isPreview,
    device,
    preview: {
      mobile: 'grid grid-cols-1 items-center gap-6',
      tablet: 'grid grid-cols-2 items-center gap-8',
      desktop: 'grid grid-cols-2 items-center gap-10',
    },
    site: 'grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10',
  });

  /* ── Centered ──────────────────────────────────────────── */
  if (style === 'centered') {
    return (
      <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-5xl space-y-5">
          {sharedHeader}
          <div className={surfaceWrapClassName}>
            <VideoSurface
              videoUrl={safeVideoUrl}
              thumbnailUrl={thumbnail}
              provider={provider}
              title={videoTitle}
              tokens={tokens}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              ratioClass={defaultRatioClass}
              playSize={playButtonSize}
              roundedClass={roundedClassName}
            />
          </div>
        </div>
      </ContainerTag>
    );
  }

  /* ── Split ─────────────────────────────────────────────── */
  if (style === 'split') {
    return (
      <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-6xl">
          <div className={splitGridClassName}>
            <div className={surfaceWrapClassName}>
              <VideoSurface
                videoUrl={safeVideoUrl}
                thumbnailUrl={thumbnail}
                provider={provider}
                title={videoTitle}
                tokens={tokens}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                playSize={playButtonSize}
                ratioClass={defaultRatioClass}
                roundedClass={roundedClassName}
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              {sharedHeader}
              {renderButton()}
            </div>
          </div>
        </div>
      </ContainerTag>
    );
  }

  /* ── Fullwidth ─────────────────────────────────────────── */
  if (style === 'fullwidth') {
    return (
      <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-7xl space-y-5">
          {sharedHeader}
          <div className={surfaceWrapClassName}>
            <VideoSurface
              videoUrl={safeVideoUrl}
              thumbnailUrl={thumbnail}
              provider={provider}
              title={videoTitle}
              tokens={tokens}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              ratioClass={fullwidthRatioClass}
              playSize={playButtonSize}
              roundedClass={roundedClassName}
            />
          </div>
          {buttonText ? <div>{renderButton()}</div> : null}
        </div>
      </ContainerTag>
    );
  }

  /* ── Cinema ────────────────────────────────────────────── */
  if (style === 'cinema') {
    return (
      <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-6xl space-y-5">
          {sharedHeader}
          <div className={cn('p-1', roundedClassName, surfaceWrapClassName)} style={{ backgroundColor: tokens.frameBackground }}>
            <VideoSurface
              videoUrl={safeVideoUrl}
              thumbnailUrl={thumbnail}
              provider={provider}
              title={videoTitle}
              tokens={tokens}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              ratioClass={cinemaRatioClass}
              playSize={playButtonSize}
              roundedClass={roundedClassName}
            />
          </div>
          {buttonText ? <div className="text-center">{renderButton()}</div> : null}
        </div>
      </ContainerTag>
    );
  }

  /* ── Minimal ───────────────────────────────────────────── */
  if (style === 'minimal') {
    return (
      <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
        <div className="mx-auto max-w-5xl space-y-5">
          {sharedHeader}
          <div className={cn('overflow-hidden border', roundedClassName)} style={{ backgroundColor: tokens.cardBackground, borderColor: '#111827' }}>
            <div className={surfaceWrapClassName}>
              <VideoSurface
                videoUrl={safeVideoUrl}
                thumbnailUrl={thumbnail}
                provider={provider}
                title={videoTitle}
                tokens={tokens}
                isPlaying={isPlaying}
                onPlay={() => setIsPlaying(true)}
                ratioClass={defaultRatioClass}
                playSize={playButtonSize}
                roundedClass={roundedClassName}
              />
            </div>
            {buttonText ? (
              <div className="border-t px-4 py-3" style={{ borderColor: tokens.cardBorder }}>
                {renderButton(true)}
              </div>
            ) : null}
          </div>
        </div>
      </ContainerTag>
    );
  }

  /* ── Parallax (default) ────────────────────────────────── */
  return (
    <ContainerTag className={sectionClassName} style={{ backgroundColor: tokens.neutralBackground }}>
      <div className="mx-auto max-w-7xl space-y-5">
        {sharedHeader}
        <div className={cn('relative overflow-hidden shadow-lg', roundedClassName, surfaceWrapClassName)}>
          <VideoSurface
            videoUrl={safeVideoUrl}
            thumbnailUrl={thumbnail}
            provider={provider}
            title={videoTitle}
            tokens={tokens}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            ratioClass={parallaxRatioClass}
            playSize={playButtonSize}
            roundedClass={roundedClassName}
          />
        </div>
        {buttonText ? <div>{renderButton()}</div> : null}
      </div>
    </ContainerTag>
  );
}

export const VIDEO_STYLE_META: Record<VideoStyle, { label: string; ratioHint: string }> = {
  centered: { label: 'Centered', ratioHint: '1280×720 (16:9)' },
  split: { label: 'Split', ratioHint: '1280×720 (16:9)' },
  fullwidth: { label: 'Fullwidth', ratioHint: '1920×820 (21:9)' },
  cinema: { label: 'Cinema', ratioHint: '1920×820 (21:9)' },
  minimal: { label: 'Minimal', ratioHint: '1280×720 (16:9)' },
  parallax: { label: 'Parallax', ratioHint: '1920×1080 (16:9)' },
};
