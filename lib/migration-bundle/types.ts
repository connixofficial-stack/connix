export const BUNDLE_VERSION = '2026-04-11.v1';

export const MIGRATION_MODULES = [
  'settings',
  'products',
  'services',
  'posts',
  'menus',
  'home-components',
] as const;

export type MigrationModule = (typeof MIGRATION_MODULES)[number];

export type ImportMode = 'full' | 'partial';

export type BundleMediaEntry = {
  logicalPath: string;
  originalUrl: string;
  mimeType: string;
  sourceModule: MigrationModule;
  checksumSha256?: string;
  usedByRecordKeys: string[];
};

export type BundleRecordIndexEntry = {
  recordKey: string;
  chunkFile: string;
  position: number;
  dependencies?: string[];
  mediaRefs?: string[];
  configPointers?: string[];
};

export type BundleManifest = {
  bundleVersion: string;
  exportedAt: string;
  sourceCoreVersion: string;
  selectedModules: MigrationModule[];
  counts: Record<string, number>;
  capabilities: {
    supportsPartialImport: boolean;
    supportsMediaEmbed: boolean;
    supportsAutoDependencies: boolean;
    supportsStrictValidation: boolean;
    supportsChunkIndexes: boolean;
  };
};

export type BundleReportIssue = {
  code: string;
  severity: 'blocking' | 'warning';
  module: string;
  recordKey?: string;
  file?: string;
  indexFile?: string;
  position?: number;
  jsonPath?: string;
  value?: unknown;
  message: string;
  suggestion?: string;
  relatedRecordKeys?: string[];
};

export type BundleImportReport = {
  summary: {
    blocking: number;
    warnings: number;
    modulesAffected: string[];
  };
  errors: BundleReportIssue[];
  warnings: BundleReportIssue[];
};

export type MigrationBundlePayload = {
  manifest: BundleManifest;
  readmeAgent: {
    startHere: string[];
    stableKeys: Record<string, string[]>;
    importOrder: string[];
    repairHints: Record<string, string>;
  };
  index: {
    modules: MigrationModule[];
    dependencies: Record<string, string[]>;
    mediaIndex: BundleMediaEntry[];
    records: Record<string, BundleRecordIndexEntry[]>;
  };
  modules: Record<string, unknown>;
};
