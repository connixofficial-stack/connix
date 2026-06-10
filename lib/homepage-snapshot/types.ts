export const HOMEPAGE_SNAPSHOT_VERSION = '2026-04-22.v1';
export const HOMEPAGE_SNAPSHOT_VERSION_V2 = '2026-04-25.v2';

export const SNAPSHOT_REQUIRED_TYPES = [
  'Blog',
  'ProductList',
  'ProductGrid',
  'ServiceList',
  'ProductCategories',
  'CategoryProducts',
  'HomepageCategoryHero',
] as const;

export type SnapshotRequiredType = (typeof SNAPSHOT_REQUIRED_TYPES)[number];

export type SnapshotEntityType = 'post' | 'product' | 'service' | 'productCategory';

export type SnapshotImportMode = 'append';

export type SnapshotStaticItem = {
  sourceId: string;
  sourceType: SnapshotEntityType;
  title: string;
  image?: string;
  slug?: string;
  subtitle?: string;
  price?: number;
};

export type SnapshotStaticCategory = {
  sourceId: string;
  title: string;
  image?: string;
  slug?: string;
  description?: string;
};

export type SnapshotDependencyCapture = {
  posts: SnapshotStaticItem[];
  products: SnapshotStaticItem[];
  services: SnapshotStaticItem[];
  productCategories: SnapshotStaticCategory[];
};

export type SnapshotComponentPayload = {
  componentKey: string;
  type: string;
  title: string;
  order: number;
  active: boolean;
  config: unknown;
  mediaRefs: string[];
  fallbackUsed: boolean;
};

export type SnapshotSystemStylePayload = {
  hiddenTypes: string[];
  typeColorOverrides: Record<string, unknown>;
  typeFontOverrides: Record<string, unknown>;
  globalFontOverride: {
    enabled: boolean;
    fontKey: string;
  };
};

export type HomepageSnapshotManifest = {
  snapshotVersion: string;
  exportedAt: string;
  sourceCoreVersion: string;
  snapshotLabel: string;
  componentCount: number;
  capabilities: {
    supportsZip: boolean;
    supportsStaticFallback: boolean;
    supportsAppendImport: boolean;
  };
};

export type HomepageSnapshotPayload = {
  manifest: HomepageSnapshotManifest;
  homepage: {
    components: SnapshotComponentPayload[];
    componentOrder: string[];
    dependencies: SnapshotDependencyCapture;
    systemStyle: SnapshotSystemStylePayload;
    demoBundle?: Record<string, unknown>;
  };
  index: {
    mediaIndex: Array<{
      logicalPath: string;
      originalUrl: string;
      mimeType: string;
      sourceType: string;
      usedBy: string[];
    }>;
  };
};

export type HomepageSnapshotReportIssue = {
  code: string;
  severity: 'blocking' | 'warning';
  message: string;
  componentKey?: string;
  file?: string;
};

export type HomepageSnapshotImportReport = {
  summary: {
    blocking: number;
    warnings: number;
  };
  errors: HomepageSnapshotReportIssue[];
  warnings: HomepageSnapshotReportIssue[];
};
