import type {
  ClientEditorItem,
  ClientsConfig,
  ClientsHeaderAlign,
  ClientsStyle,
} from '../_types';
import { DEFAULT_CLIENTS_CORNER_RADIUS } from '../_types';

export const CLIENTS_STYLES: Array<{ id: ClientsStyle; label: string }> = [
  { id: 'layout01', label: '(1) Một lớn' },
  { id: 'layout02', label: '(2) Tràn viền' },
  { id: 'layout03', label: '(3) Xếp tầng' },
  { id: 'layout04', label: '(4) Hai banner' },
  { id: 'layout05', label: '(5) Ba banner' },
  { id: 'layout06', label: '(6) Bốn banner' },
  { id: 'layout07', label: '(7) Lưới ô' },
  { id: 'layout08', label: '(8) Trượt ngang' },
];

export const CLIENTS_HEADER_ALIGN_OPTIONS: Array<{ value: ClientsHeaderAlign; label: string }> = [
  { value: 'left', label: 'Trái' },
  { value: 'center', label: 'Giữa' },
  { value: 'right', label: 'Phải' },
];

export const CLIENTS_CROP_ASPECT_RATIO_BY_STYLE: Record<ClientsStyle, { cssValue?: string; label: string; value: number }> = {
  layout01: { cssValue: '1 / 1', label: 'Vuông (1:1)', value: 1 },
  layout02: { cssValue: '8 / 3', label: 'Banner rộng (8:3)', value: 8 / 3 },
  layout03: { cssValue: '8 / 3', label: 'Banner rộng (8:3)', value: 8 / 3 },
  layout04: { cssValue: '8 / 3', label: 'Banner rộng (8:3)', value: 8 / 3 },
  layout05: { cssValue: '16 / 9', label: 'Ngang (16:9)', value: 16 / 9 },
  layout06: { cssValue: '3 / 4', label: 'Dọc (3:4)', value: 3 / 4 },
  layout07: { cssValue: '24 / 9', label: 'Ngang rộng (24:9)', value: 24 / 9 },
  layout08: { cssValue: '16 / 9', label: 'Ngang (16:9)', value: 16 / 9 },
};

export const CLIENTS_DEMO_ITEMS_BY_STYLE: Record<ClientsStyle, ClientEditorItem[]> = {
  layout01: [
    { id: 'demo-layout01-1', inputMode: 'upload', link: '', url: '/demo/clients/square-kitchen-1.png' },
    { id: 'demo-layout01-2', inputMode: 'upload', link: '', url: '/demo/clients/square-kitchen-2.png' },
    { id: 'demo-layout01-3', inputMode: 'upload', link: '', url: '/demo/clients/square-kitchen-3.png' },
    { id: 'demo-layout01-4', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-1.png' },
  ],
  layout02: [
    { id: 'demo-layout02-1', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-1.png' },
    { id: 'demo-layout02-2', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-2.png' },
    { id: 'demo-layout02-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout02-4', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
  ],
  layout03: [
    { id: 'demo-layout03-1', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-2.png' },
    { id: 'demo-layout03-2', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout03-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
    { id: 'demo-layout03-4', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-3.png' },
  ],
  layout04: [
    { id: 'demo-layout04-1', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-1.png' },
    { id: 'demo-layout04-2', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-2.png' },
    { id: 'demo-layout04-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout04-4', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
  ],
  layout05: [
    { id: 'demo-layout05-1', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout05-2', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
    { id: 'demo-layout05-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-3.png' },
    { id: 'demo-layout05-4', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-1.png' },
  ],
  layout06: [
    { id: 'demo-layout06-1', inputMode: 'upload', link: '', url: '/demo/clients/portrait-kitchen-1.png' },
    { id: 'demo-layout06-2', inputMode: 'upload', link: '', url: '/demo/clients/portrait-kitchen-2.png' },
    { id: 'demo-layout06-3', inputMode: 'upload', link: '', url: '/demo/clients/portrait-kitchen-3.png' },
    { id: 'demo-layout06-4', inputMode: 'upload', link: '', url: '/demo/clients/portrait-kitchen-4.png' },
  ],
  layout07: [
    { id: 'demo-layout07-1', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout07-2', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
    { id: 'demo-layout07-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-3.png' },
    { id: 'demo-layout07-4', inputMode: 'upload', link: '', url: '/demo/clients/square-kitchen-1.png' },
  ],
  layout08: [
    { id: 'demo-layout08-1', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-1.png' },
    { id: 'demo-layout08-2', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-2.png' },
    { id: 'demo-layout08-3', inputMode: 'upload', link: '', url: '/demo/clients/landscape-kitchen-3.png' },
    { id: 'demo-layout08-4', inputMode: 'upload', link: '', url: '/demo/clients/wide-kitchen-1.png' },
  ],
};

export const DEFAULT_CLIENTS_CONFIG: ClientsConfig = {
  items: [
    {
      link: '',
      url: '',
    },
  ],
  style: 'layout02',
  // Shared header config
  hideHeader: false,
  showTitle: true,
  subtitle: '',
  showSubtitle: true,
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: 'normal',
  cornerRadius: DEFAULT_CLIENTS_CORNER_RADIUS,
  noBorderRadius: false,
  noVerticalMargin: false,
};
