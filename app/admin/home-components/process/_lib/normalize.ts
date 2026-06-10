import {
  normalizeProcessCornerRadius,
  normalizeProcessSpacing,
  type ProcessConfig,
  type ProcessStep,
  type ProcessStyle,
} from '../_types';

export interface ProcessRenderableStep {
  key: string;
  icon: string;
  title: string;
  description: string;
  iconStorageId?: string | null;
}

export interface ProcessFormStep extends ProcessStep {
  id: string;
}

const PROCESS_STYLE_SET = new Set<ProcessStyle>([
  'horizontal',
  'stepper',
  'cards',
  'accordion',
  'minimal',
  'compactMinimal',
  'grid',
  'alternating',
  'circular',
]);

const coerceText = (value: unknown) => {
  if (typeof value === 'string') {return value;}
  if (typeof value === 'number') {return String(value);}
  return '';
};

const getStepBaseKey = (
  source: Record<string, unknown>,
  index: number,
  icon: string,
  title: string,
  description: string,
) => {
  const keyCandidate = source.uiKey ?? source.key ?? source.id;

  if (typeof keyCandidate === 'string' && keyCandidate.trim().length > 0) {
    return `key:${keyCandidate.trim()}`;
  }

  if (typeof keyCandidate === 'number') {
    return `key:${keyCandidate}`;
  }

  const contentKey = `${title.trim()}|${description.trim()}|${icon.trim()}`;
  if (contentKey.replaceAll('|', '').trim().length > 0) {
    return `content:${contentKey}`;
  }

  return `idx:${index}`;
};

const toStepRecord = (raw: unknown): Record<string, unknown> => {
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
};

export const normalizeProcessStyle = (value: unknown): ProcessStyle => {
  if (typeof value === 'string' && PROCESS_STYLE_SET.has(value as ProcessStyle)) {
    return value as ProcessStyle;
  }
  return 'horizontal';
};

export const normalizeProcessRenderSteps = (input: unknown): ProcessRenderableStep[] => {
  if (!Array.isArray(input)) {return [];}

  const duplicates = new Map<string, number>();

  return input.map((raw, index) => {
    const step = toStepRecord(raw);
    const icon = coerceText(step.icon);
    const title = coerceText(step.title);
    const description = coerceText(step.description);
    const iconStorageId = step.iconStorageId === null ? null : (step.iconStorageId ? coerceText(step.iconStorageId) : undefined);
    const baseKey = getStepBaseKey(step, index, icon, title, description);
    const count = duplicates.get(baseKey) ?? 0;
    duplicates.set(baseKey, count + 1);

    return {
      key: count === 0 ? baseKey : `${baseKey}::${count}`,
      icon,
      title,
      description,
      iconStorageId,
    };
  });
};

const generateFormStepId = (seed: string, index: number) => `${seed}-${index}-${Math.random().toString(36).slice(2, 8)}`;

export const createProcessFormStep = (partial?: Partial<ProcessStep>): ProcessFormStep => ({
  id: generateFormStepId('process-step', Date.now()),
  icon: partial?.icon ?? '',
  title: partial?.title ?? '',
  description: partial?.description ?? '',
  iconStorageId: partial?.iconStorageId,
});

export const normalizeProcessFormSteps = (input: unknown): ProcessFormStep[] => {
  const normalized = normalizeProcessRenderSteps(input);

  return normalized.map((step, index) => ({
    id: generateFormStepId(step.key.replaceAll(':', '-'), index),
    icon: step.icon,
    title: step.title,
    description: step.description,
    iconStorageId: step.iconStorageId,
  }));
};

export const serializeProcessFormSteps = (steps: ProcessFormStep[]): ProcessStep[] => (
  steps.map((step) => ({
    icon: step.icon,
    title: step.title,
    description: step.description,
    iconStorageId: step.iconStorageId,
  }))
);

export const normalizeProcessConfig = (rawConfig: unknown): ProcessConfig => {
  const config = (typeof rawConfig === 'object' && rawConfig !== null)
    ? rawConfig as Record<string, unknown>
    : {};

  const rawCols = config.desktopColumns;
  const desktopColumns: 3 | 4 = rawCols === 3 ? 3 : 4;

  return {
    cornerRadius: normalizeProcessCornerRadius(config.cornerRadius, config.noBorderRadius),
    hideHeader: typeof config.hideHeader === 'boolean' ? config.hideHeader : false,
    showTitle: typeof config.showTitle === 'boolean' ? config.showTitle : true,
    showSubtitle: typeof config.showSubtitle === 'boolean' ? config.showSubtitle : true,
    subtitle: coerceText(config.subtitle),
    headerAlign: config.headerAlign === 'left' || config.headerAlign === 'right' ? config.headerAlign : 'center',
    titleColorPrimary: typeof config.titleColorPrimary === 'boolean' ? config.titleColorPrimary : false,
    subtitleAboveTitle: typeof config.subtitleAboveTitle === 'boolean' ? config.subtitleAboveTitle : false,
    uppercaseText: typeof config.uppercaseText === 'boolean' ? config.uppercaseText : false,
    showBadge: typeof config.showBadge === 'boolean' ? config.showBadge : true,
    badgeText: coerceText(config.badgeText),
    circularCtaText: coerceText(config.circularCtaText),
    circularCtaLink: coerceText(config.circularCtaLink),
    noBorderRadius: config.noBorderRadius === true,
    noVerticalMargin: config.noVerticalMargin === true,
    spacing: normalizeProcessSpacing(config.spacing, config.noVerticalMargin),
    steps: serializeProcessFormSteps(normalizeProcessFormSteps(config.steps)),
    style: normalizeProcessStyle(config.style),
    desktopColumns,
  };
};
