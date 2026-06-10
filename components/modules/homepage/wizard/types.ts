export type WizardStepKey = 'industry' | 'template';

export type ModuleReality = {
  dependencies: string[];
  dependencyType: string;
  enabled: boolean;
  key: string;
  name: string;
};

export type RealitySnapshot = {
  coreSettings: Record<string, unknown>;
  experienceSettings: Record<string, unknown>;
  featureMap: Record<string, Record<string, boolean>>;
  moduleSettings: Record<string, Record<string, unknown>>;
  modules: ModuleReality[];
  sampleIds: {
    postIds: string[];
    productCategoryIds: string[];
    productIds: string[];
    serviceIds: string[];
  };
  tableStats: Array<{ category: string; count: number; isApproximate: boolean; table: string }>;
  homeComponents: Array<{ _id: string; type: string; title: string; order: number; active: boolean; config: unknown }>;
};

export type ReadinessIssue = {
  key: string;
  level: 'blocker' | 'warning';
  message: string;
  reason: string;
  quickActions: Array<{ href: string; label: string }>;
};

export type ReadinessReport = {
  blockers: ReadinessIssue[];
  warnings: ReadinessIssue[];
  availableComponents: string[];
  unavailableComponents: Array<{ type: string; reason: string; quickActions: Array<{ href: string; label: string }> }>;
  experienceWarnings: Array<{ type: string; message: string; href: string }>;
  dataCounts: Record<string, number>;
};

export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
};

export type QuestionDefinition = {
  key: string;
  label: string;
  description?: string;
  options: QuestionOption[];
};

export type QuestionPack = {
  componentType: string;
  title: string;
  priority: number;
  questions: QuestionDefinition[];
};

export type TemplateDefinition = {
  key: string;
  name: string;
  description: string;
  sequence: string[];
  insertionPoints: Record<string, string[]>;
};

export type WizardAnswerMap = Record<string, string>;

export type WizardState = {
  selectedIndustry: string;
  selectedTemplate: string;
  applyMode: 'replace_all' | 'append_missing';
};
