import Image, { type ImageProps } from 'next/image';

type PublicImageMode = 'hero' | 'primary' | 'thumb' | 'logo' | 'decorative';

type PublicImageProps = ImageProps & {
  alt?: string;
  mode?: PublicImageMode;
  unoptimized?: boolean;
};

const UNOPTIMIZED_MODES: Record<PublicImageMode, boolean> = {
  hero: false,
  primary: false,
  thumb: true,
  logo: true,
  decorative: true,
};

export function PublicImage({ alt = '', mode = 'primary', unoptimized, ...props }: PublicImageProps) {
  const isExternalUrl = typeof props.src === 'string' && /^https?:\/\//.test(props.src);
  const resolvedUnoptimized = unoptimized ?? (isExternalUrl || UNOPTIMIZED_MODES[mode]);
  const resolvedSrc = typeof props.src === 'string'
    ? normalizeLocalNextImageUrl(props.src)
    : props.src;
  return <Image alt={alt} unoptimized={resolvedUnoptimized} {...props} src={resolvedSrc} />;
}

const normalizeLocalNextImageUrl = (value: string) => {
  if (!value.includes('/_next/image?')) {
    return value;
  }

  try {
    const parsed = new URL(value, 'http://localhost');
    if (parsed.hostname !== 'localhost') {
      return value;
    }
    const original = parsed.searchParams.get('url');
    if (!original) {
      return value;
    }
    return decodeURIComponent(original);
  } catch {
    return value;
  }
};
