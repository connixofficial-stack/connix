import {
  AccentAreaPoint,
  AccentRole,
  AccentTier,
  calculateAccentBalance,
} from './color-utils';

export interface ComponentColorElement {
  name: string;
  role: AccentRole | 'neutral';
  area: number;
  tier?: AccentTier;
  interactive?: boolean;
}

export interface ComponentColorReport {
  totalArea: number;
  primaryPercent: number;
  secondaryPercent: number;
  neutralPercent: number;
  accentBalance: ReturnType<typeof calculateAccentBalance>;
  tierCount: Record<AccentTier, number>;
}

export const analyzeComponentColors = (
  elements: ComponentColorElement[],
  options?: { totalArea?: number; minPrimary?: number; minSecondary?: number }
): ComponentColorReport => {
  const totalArea = options?.totalArea ?? 100;
  const tierCount: Record<AccentTier, number> = { XL: 0, L: 0, M: 0, S: 0 };
  const accents: AccentAreaPoint[] = [];
  const assignments = new Map<string, AccentRole>();

  elements.forEach((element) => {
    if (element.role !== 'neutral') {
      accents.push({
        element: element.name,
        area: element.area,
        tier: element.tier ?? 'M',
        interactive: element.interactive ?? false,
      });
      assignments.set(element.name, element.role);
      tierCount[element.tier ?? 'M'] += 1;
    }
  });

  const accentBalance = calculateAccentBalance(accents, assignments, {
    totalArea,
    minPrimary: options?.minPrimary,
    minSecondary: options?.minSecondary,
  });

  return {
    totalArea,
    primaryPercent: accentBalance.primary,
    secondaryPercent: accentBalance.secondary,
    neutralPercent: accentBalance.neutral,
    accentBalance,
    tierCount,
  };
};
