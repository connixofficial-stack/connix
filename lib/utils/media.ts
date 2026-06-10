type VideoProvider = 'youtube' | 'vimeo' | 'drive' | 'direct';

const VIDEO_URL_MATCHERS: Array<{ type: Exclude<VideoProvider, 'direct'>; regex: RegExp }> = [
  { type: 'youtube', regex: /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&?/]+)/i },
  { type: 'vimeo', regex: /vimeo\.com\/(?:video\/)?(\d+)/i },
  { type: 'drive', regex: /drive\.google\.com\/(?:file\/d\/|open\?id=)([^/&?]+)/i },
];

export function getVideoInfo(url: string): { type: VideoProvider; id?: string } {
  if (!url) {
    return { type: 'direct' };
  }

  for (const matcher of VIDEO_URL_MATCHERS) {
    const match = url.match(matcher.regex);
    if (match?.[1]) {
      return { type: matcher.type, id: match[1] };
    }
  }

  return { type: 'direct' };
}

export function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const { pathname } = new URL(url);
    const ext = pathname.split('.').pop()?.toLowerCase();
    return ext === 'mp4' || ext === 'webm' || ext === 'ogg';
  } catch {
    const lower = url.toLowerCase();
    return /\.mp4(\?|$)/i.test(lower)
      || /\.webm(\?|$)/i.test(lower)
      || /\.ogg(\?|$)/i.test(lower);
  }
}

export function isEmbeddableVideoUrl(url: string): boolean {
  return getVideoInfo(url).type !== 'direct';
}

/**
 * Detect xem URL có phải video hay không (dựa vào extension/provider).
 * Hỗ trợ: .mp4, .webm, .ogg, YouTube watch/shorts/youtu.be, Vimeo, Google Drive.
 */
export function isVideoUrl(url: string): boolean {
  return isDirectVideoUrl(url) || isEmbeddableVideoUrl(url);
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getVideoThumbnail(url: string): string | undefined {
  const videoInfo = getVideoInfo(url);
  if (videoInfo.type === 'youtube' && videoInfo.id) {
    return getYouTubeThumbnail(videoInfo.id);
  }
  return undefined;
}

export function getVideoEmbedUrl(
  url: string,
  options: { autoplay?: boolean; muted?: boolean; loop?: boolean; controls?: boolean } = {}
): string | undefined {
  const videoInfo = getVideoInfo(url);
  if (!videoInfo.id) {
    return undefined;
  }

  if (videoInfo.type === 'youtube') {
    const showControls = options.controls === true;
    const params = new URLSearchParams({
      controls: showControls ? '1' : '0',
      disablekb: showControls ? '0' : '1',
      fs: showControls ? '1' : '0',
      iv_load_policy: '3',
      modestbranding: '1',
      playsinline: '1',
      rel: '0',
    });
    if (options.autoplay) {
      params.set('autoplay', '1');
    }
    if (options.muted) {
      params.set('mute', '1');
    }
    if (options.loop) {
      params.set('loop', '1');
      params.set('playlist', videoInfo.id);
    }
    return `https://www.youtube-nocookie.com/embed/${videoInfo.id}?${params.toString()}`;
  }

  if (videoInfo.type === 'vimeo') {
    const params = new URLSearchParams();
    if (options.autoplay) {
      params.set('autoplay', '1');
    }
    if (options.muted) {
      params.set('muted', '1');
    }
    if (options.loop) {
      params.set('loop', '1');
    }
    const query = params.toString();
    return `https://player.vimeo.com/video/${videoInfo.id}${query ? `?${query}` : ''}`;
  }

  if (videoInfo.type === 'drive') {
    return `https://drive.google.com/file/d/${videoInfo.id}/preview`;
  }

  return undefined;
}

/**
 * Auto-detect mediaType từ URL.
 * Return 'video' nếu URL là video, undefined nếu là ảnh (default).
 */
export function detectMediaType(url: string): 'video' | undefined {
  return isVideoUrl(url) ? 'video' : undefined;
}
