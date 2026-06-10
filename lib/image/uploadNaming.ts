export const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const EXTENSION_MIME_MAP: Record<string, string> = Object.entries(MIME_EXTENSION_MAP).reduce((acc, [mime, ext]) => {
  acc[ext] = mime;
  return acc;
}, {} as Record<string, string>);

EXTENSION_MIME_MAP.jpeg = 'image/jpeg';

export type ImageNamingStyle = 'legacy' | 'slug-index';

export type ImageNamingContext = {
  entityName?: string;
  field?: string;
  index?: number;
  style?: ImageNamingStyle;
};

export function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[đĐ]/g, 'd')
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .trim();

  return normalized || 'image';
}

export function getExtensionFromMime(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? 'bin';
}

export function getMimeFromExtension(extension: string): string | undefined {
  const clean = extension.replace(/^\./, '').toLowerCase();
  return EXTENSION_MIME_MAP[clean];
}

export function resolveNamingContext(
  context: ImageNamingContext | undefined,
  defaults: { entityName: string; field: string; index?: number; style?: ImageNamingStyle }
): ImageNamingContext {
  return {
    entityName: context?.entityName ?? defaults.entityName,
    field: context?.field ?? defaults.field,
    index: context?.index ?? defaults.index,
    style: context?.style ?? defaults.style,
  };
}

export function buildImageFilename(options: {
  context: ImageNamingContext;
  originalName: string;
  mimeType: string;
}): string {
  const baseName = options.originalName.replace(/\.[^/.]+$/, '');
  const entityName = slugify(options.context.entityName ?? baseName);
  const index = Number.isFinite(options.context.index) && (options.context.index ?? 0) > 0
    ? Math.floor(options.context.index!)
    : 1;
  const ext = getExtensionFromMime(options.mimeType);
  const style = options.context.style ?? 'legacy';

  if (style === 'slug-index') {
    return `${entityName}-${index}.${ext}`;
  }

  const field = slugify(options.context.field ?? 'image');
  return `${entityName}-anh-${field}-${index}.${ext}`;
}
