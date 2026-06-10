import { DEFAULT_PROCESS_CORNER_RADIUS, DEFAULT_PROCESS_SPACING, type ProcessConfig } from '../_types';

export const DEFAULT_PROCESS_CONFIG: ProcessConfig = {
  steps: [
    {
      description: '',
      icon: 'Star',
      title: '',
    },
  ],
  style: 'horizontal',
  desktopColumns: 4,
  cornerRadius: DEFAULT_PROCESS_CORNER_RADIUS,
  noBorderRadius: false,
  spacing: DEFAULT_PROCESS_SPACING,
  noVerticalMargin: false,
};
