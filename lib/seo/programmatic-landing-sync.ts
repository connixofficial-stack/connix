import type { Id } from '../../convex/_generated/dataModel';
import type { ProgrammaticLandingItem, ProgrammaticLandingPlan } from './programmatic-landing';

export type ExistingProgrammaticLandingPage = {
  _id: Id<'landingPages'>;
  content?: string;
  faqItems?: Array<{ question: string; answer: string }>;
  landingType: ProgrammaticLandingItem['landingType'];
  order?: number;
  primaryIntent?: string;
  relatedProductSlugs?: string[];
  relatedServiceSlugs?: string[];
  relatedSlugs?: string[];
  slug: string;
  status: 'draft' | 'published';
  summary: string;
  title: string;
  heroImage?: string;
  publishedAt?: number;
};

export type ProgrammaticSyncPreview = {
  byType: Record<string, number>;
  createCount: number;
  draftCount: number;
  publishedCount: number;
  skippedCount: number;
  total: number;
  updateCount: number;
};

export type ProgrammaticSyncDecision = {
  create: ProgrammaticLandingItem[];
  preview: ProgrammaticSyncPreview;
  update: Array<{
    existing: ExistingProgrammaticLandingPage;
    next: ProgrammaticLandingItem;
    status: 'draft' | 'published';
  }>;
};

const normalizeArray = (items?: string[]): string[] => items ?? [];
const normalizeFaqItems = (items?: Array<{ question: string; answer: string }>): Array<{ question: string; answer: string }> => items ?? [];

const toComparableRecord = (item: ProgrammaticLandingItem | ExistingProgrammaticLandingPage) => ({
  content: item.content ?? '',
  faqItems: normalizeFaqItems(item.faqItems),
  landingType: item.landingType,
  order: item.order ?? null,
  primaryIntent: item.primaryIntent ?? '',
  relatedProductSlugs: normalizeArray(item.relatedProductSlugs),
  relatedServiceSlugs: normalizeArray(item.relatedServiceSlugs),
  relatedSlugs: normalizeArray(item.relatedSlugs),
  slug: item.slug,
  summary: item.summary,
  title: item.title,
});

export const resolveProgrammaticStatus = (params: {
  existingStatus?: 'draft' | 'published';
}): 'draft' | 'published' => {
  if (params.existingStatus === 'published') {
    return 'published';
  }
  return 'draft';
};

export const hasMeaningfulProgrammaticChanges = (
  existing: ExistingProgrammaticLandingPage,
  next: ProgrammaticLandingItem,
): boolean => JSON.stringify(toComparableRecord(existing)) !== JSON.stringify(toComparableRecord(next));

export const buildProgrammaticSyncDecision = (params: {
  existingPages: ExistingProgrammaticLandingPage[];
  nextPlan: ProgrammaticLandingPlan;
}): ProgrammaticSyncDecision => {
  const existingBySlug = new Map(params.existingPages.map((page) => [page.slug, page]));
  const create: ProgrammaticLandingItem[] = [];
  const update: Array<{
    existing: ExistingProgrammaticLandingPage;
    next: ProgrammaticLandingItem;
    status: 'draft' | 'published';
  }> = [];

  const byType: Record<string, number> = {};
  let draftCount = 0;
  let publishedCount = 0;
  let skippedCount = 0;

  for (const item of params.nextPlan.items) {
    byType[item.landingType] = (byType[item.landingType] ?? 0) + 1;
    const existing = existingBySlug.get(item.slug);
    const status = resolveProgrammaticStatus({ existingStatus: existing?.status });

    if (status === 'published') {
      publishedCount += 1;
    } else {
      draftCount += 1;
    }

    if (!existing) {
      create.push(item);
      continue;
    }

    if (!hasMeaningfulProgrammaticChanges(existing, item)) {
      skippedCount += 1;
      continue;
    }

    update.push({ existing, next: item, status });
  }

  return {
    create,
    preview: {
      byType,
      createCount: create.length,
      draftCount,
      publishedCount,
      skippedCount,
      total: params.nextPlan.items.length,
      updateCount: update.length,
    },
    update,
  };
};
