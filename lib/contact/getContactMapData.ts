export type ContactMapProvider = 'openstreetmap' | 'google_embed';

export type ContactMapData = {
  address: string;
  taxId?: string;
  lat: number;
  lng: number;
  mapProvider: ContactMapProvider;
  googleMapEmbedIframe: string;
};

const DEFAULT_LAT = 10.762622;
const DEFAULT_LNG = 106.660172;

const coerceNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(
    typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  );
  return Number.isFinite(parsed) ? parsed : fallback;
};

const coerceString = (value: unknown) => (typeof value === 'string' ? value : '');

export const getContactMapDataFromSettings = (
  settings?: Array<{ key: string; value: string | number | boolean }>
): ContactMapData => {
  const map: Record<string, string | number | boolean> = {};
  settings?.forEach((item) => {
    map[item.key] = item.value;
  });

  const mapProvider: ContactMapProvider = map.contact_map_provider === 'google_embed'
    ? 'google_embed'
    : 'openstreetmap';

  return {
    address: coerceString(map.contact_address),
    taxId: coerceString(map.contact_tax_id),
    lat: coerceNumber(map.contact_lat, DEFAULT_LAT),
    lng: coerceNumber(map.contact_lng, DEFAULT_LNG),
    mapProvider,
    googleMapEmbedIframe: coerceString(map.contact_google_map_embed_iframe),
  };
};

export const sanitizeGoogleMapIframe = (html: string) => {
  const trimmed = html.trim();
  if (!trimmed.includes('<iframe') || !trimmed.includes('</iframe>')) {
    return '';
  }
  const sanitized = trimmed
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '');

  return sanitized.replace(/<iframe\b[^>]*>/i, (match) => {
    const tag = match
      .replace(/\s(width|height)=(["']).*?\2/gi, '')
      .replace(/\sstyle=(["']).*?\1/gi, '')
      .replace(/\sloading=(["']).*?\1/gi, '')
      .replace(/\sreferrerpolicy=(["']).*?\1/gi, '');

    const forcedAttrs = ' style="border:0;width:100%;height:100%;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"';
    return tag.replace('<iframe', `<iframe${forcedAttrs}`);
  });
};
