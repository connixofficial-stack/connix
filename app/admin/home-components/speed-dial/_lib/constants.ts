import type { SpeedDialConfig, SpeedDialStyle } from '../_types';

export const SPEED_DIAL_STYLES: Array<{ id: SpeedDialStyle; label: string }> = [
  { id: 'fab', label: '(1) Nút tròn' },
  { id: 'sidebar', label: '(2) Thanh bên' },
  { id: 'pills', label: '(3) Dạng dẹt' },
  { id: 'stack', label: '(4) Xếp chồng' },
  { id: 'dock', label: '(5) Thanh dưới' },
  { id: 'minimal', label: '(6) Tối giản' },
  { id: 'builder-bar', label: '(7) Thanh khối' },
];

export const normalizeSpeedDialStyle = (value?: string): SpeedDialStyle => {
  if (value === 'fab' || value === 'sidebar' || value === 'pills' || value === 'stack' || value === 'dock' || value === 'minimal' || value === 'builder-bar') {
    return value;
  }
  return 'fab';
};

export const DEFAULT_SPEED_DIAL_CONFIG: SpeedDialConfig = {
  actions: [
    {
      id: 'default-1',
      bgColor: '#3b82f6',
      icon: 'phone',
      label: '',
      url: '',
    },
  ],
  position: 'bottom-right',
  style: 'fab',
  defaultOpen: true,
  showOnAllPages: false,
  enableShadow: true,
};
