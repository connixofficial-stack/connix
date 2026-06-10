import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import type { Id } from '@/convex/_generated/dataModel';
import { normalizeRouteMode, type RouteMode } from './route-mode';
import { TRUST_PAGE_MAPPING_KEYS, TRUST_PAGE_SLOTS, type TrustPageKey } from './trust-pages';

export const IA_SETTINGS_KEYS = [
  'ia_route_mode',
  'ia_auto_resolve_slug',
  'ia_page_about',
  'ia_page_terms',
  'ia_page_privacy',
  'ia_page_return_policy',
  'ia_page_shipping',
  'ia_page_payment',
  'ia_page_faq',
  ...TRUST_PAGE_MAPPING_KEYS,
] as const;

export type IASettings = {
  routeMode: RouteMode;
  autoResolveSlug: boolean;
  pages: {
    about: boolean;
    terms: boolean;
    privacy: boolean;
    returnPolicy: boolean;
    shipping: boolean;
    payment: boolean;
    faq: boolean;
  };
  trustPages: Record<TrustPageKey, Id<'posts'> | null>;
};

const resolveBoolean = (value: unknown, fallback = true): boolean => {
  if (typeof value === 'boolean') {return value;}
  return fallback;
};

const resolvePostId = (value: unknown): Id<'posts'> | null => {
  if (typeof value === 'string' && value.trim()) {return value as Id<'posts'>;}
  return null;
};

export const getIASettings = async (): Promise<IASettings> => {
  const client = getConvexClient();
  const raw = await client.query(api.settings.getMultiple, { keys: [...IA_SETTINGS_KEYS] });

  return {
    autoResolveSlug: resolveBoolean(raw.ia_auto_resolve_slug, true),
    pages: {
      about: resolveBoolean(raw.ia_page_about, true),
      faq: resolveBoolean(raw.ia_page_faq, true),
      payment: resolveBoolean(raw.ia_page_payment, true),
      privacy: resolveBoolean(raw.ia_page_privacy, true),
      returnPolicy: resolveBoolean(raw.ia_page_return_policy, true),
      shipping: resolveBoolean(raw.ia_page_shipping, true),
      terms: resolveBoolean(raw.ia_page_terms, true),
    },
    routeMode: normalizeRouteMode(raw.ia_route_mode),
    trustPages: TRUST_PAGE_SLOTS.reduce((acc, slot) => {
      acc[slot.key] = resolvePostId(raw[slot.mappingKey]);
      return acc;
    }, {} as Record<TrustPageKey, Id<'posts'> | null>),
  };
};
