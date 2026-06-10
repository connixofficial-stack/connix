import type { SectionSpacing } from '../../_shared/types/sectionSpacing';

export type PopupStyle = 'center-card' | 'split-visual' | 'bottom-sheet' | 'side-panel' | 'minimal-alert' | 'full-screen' | 'image-only' | 'centered-advertisement';

export type PopupTrigger = 'immediate' | 'delay';

export type PopupFrequency = 'always' | 'oncePerPageView' | 'oncePerSession' | 'oncePerDevice';

export type PopupCornerRadius = 'none' | 'sm' | 'lg';

export type PopupSpacing = SectionSpacing;

export type PopupBackgroundMode = 
  | 'solid' 
  | 'brand' 
  | 'secondary-solid'
  | 'gradient-brand-to-secondary'
  | 'gradient-secondary-to-brand'
  | 'gradient-brand-dark'
  | 'gradient-secondary-dark'
  | 'pattern-sunburst'
  | 'pattern-sunburst-secondary'
  | 'pattern-sunburst-gradient'
  | 'glassmorphism'
  | 'dark-aesthetic';

export interface PopupConfig {
  style: PopupStyle;
  eyebrow: string;
  heading: string;
  description: string;
  note: string;
  icon: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  primaryButtonDisabled: boolean;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  secondaryButtonDisabled: boolean;
  imageUrl: string;
  storageId?: string | null;
  trigger: PopupTrigger;
  delaySeconds: number;
  frequency: PopupFrequency;
  showIcon: boolean;
  cornerRadius: PopupCornerRadius;
  spacing: PopupSpacing;
  noBorderRadius?: boolean;
  noVerticalMargin?: boolean;
  squareCorners?: boolean;
  colorIntensity: number;
  showDoNotShowToday: boolean;
  backgroundMode?: PopupBackgroundMode;
}
