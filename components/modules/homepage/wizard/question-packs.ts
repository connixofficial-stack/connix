import { HOME_COMPONENT_BASE_TYPES } from '@/lib/home-components/componentTypes';
import type { QuestionPack } from './types';

const HERO_LAYOUT_OPTIONS = [
  { value: 'split', label: 'Split (2 cột)' },
  { value: 'fullscreen', label: 'Fullscreen' },
  { value: 'slider', label: 'Slider' },
  { value: 'bento', label: 'Bento Grid' },
  { value: 'video', label: 'Video Hero' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'immersive', label: 'Immersive' },
  { value: 'story', label: 'Story Scroll' },
];

const CTA_STYLE_OPTIONS = [
  { value: 'banner', label: 'Banner' },
  { value: 'centered', label: 'Centered' },
  { value: 'split', label: 'Split' },
  { value: 'floating', label: 'Floating' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'sticky-bar', label: 'Sticky Bar' },
  { value: 'lead-form', label: 'Lead Form' },
];

const DENSITY_OPTIONS = [
  { value: 'ultra-lean', label: 'Ultra Lean' },
  { value: 'lean', label: 'Lean' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'rich', label: 'Rich' },
  { value: 'deep', label: 'Deep' },
  { value: 'immersive', label: 'Immersive' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'editorial', label: 'Editorial' },
];

const DATA_SOURCE_OPTIONS = [
  { value: 'auto', label: 'Auto (dữ liệu thật)' },
  { value: 'hybrid', label: 'Hybrid (auto + chỉnh tay)' },
  { value: 'manual', label: 'Manual (chọn tay)' },
  { value: 'featured', label: 'Featured ưu tiên' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'best-selling', label: 'Best selling' },
  { value: 'random', label: 'Random curated' },
];

const SEQUENCE_OPTIONS = [
  { value: 'auto', label: 'Auto theo template' },
  { value: 'top', label: 'Ưu tiên đầu trang' },
  { value: 'mid', label: 'Ở giữa' },
  { value: 'bottom', label: 'Gần cuối' },
];

const LAYOUT_OPTION_MAP: Record<string, Array<{ value: string; label: string }>> = {
  Hero: HERO_LAYOUT_OPTIONS,
  SpeedDial: [
    { value: 'fab', label: 'FAB' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'pills', label: 'Pills' },
    { value: 'stack', label: 'Stack' },
    { value: 'dock', label: 'Dock' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'floating', label: 'Floating' },
    { value: 'compact', label: 'Compact' },
  ],
  CTA: CTA_STYLE_OPTIONS,
  ProductList: [
    { value: 'commerce', label: 'Commerce' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'bento', label: 'Bento' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'compact', label: 'Compact' },
    { value: 'showcase', label: 'Showcase' },
  ],
  ProductGrid: [
    { value: 'grid', label: 'Grid' },
    { value: 'masonry', label: 'Masonry' },
    { value: 'bento', label: 'Bento' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'cards', label: 'Cards' },
    { value: 'carousel', label: 'Carousel' },
  ],
  Blog: [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
    { value: 'featured', label: 'Featured' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'minimal', label: 'Minimal' },
  ],
  Contact: [
    { value: 'modern', label: 'Modern Split' },
    { value: 'floating', label: 'Executive Panel' },
    { value: 'grid', label: 'Grid Cards' },
    { value: 'elegant', label: 'Elegant Clean' },
    { value: 'minimal', label: 'Minimal Form' },
    { value: 'centered', label: 'Balanced Split' },
  ],
};

const buildBasePack = (componentType: string, label: string, priority: number): QuestionPack => ({
  componentType,
  title: label,
  priority,
  questions: [
    {
      key: `${componentType}:enabled`,
      label: `Bật ${label}?`,
      options: [
        { value: 'on', label: 'Bật' },
        { value: 'off', label: 'Tắt' },
      ],
    },
    {
      key: `${componentType}:layout`,
      label: `Layout cho ${label}`,
      options: LAYOUT_OPTION_MAP[componentType] ?? [
        { value: 'default', label: 'Default' },
        { value: 'modern', label: 'Modern' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'showcase', label: 'Showcase' },
      ],
    },
    {
      key: `${componentType}:data`,
      label: `Nguồn dữ liệu cho ${label}`,
      options: DATA_SOURCE_OPTIONS,
    },
    {
      key: `${componentType}:density`,
      label: `Mật độ nội dung ${label}`,
      options: DENSITY_OPTIONS,
    },
    {
      key: `${componentType}:sequence`,
      label: `Vị trí ${label} trong trang`,
      options: SEQUENCE_OPTIONS,
    },
  ],
});

export const buildQuestionPacks = () => {
  const baseTypes = HOME_COMPONENT_BASE_TYPES.map((item) => ({
    type: item.value,
    label: item.label,
  }));

  const packs = baseTypes.map((item) => {
    if (item.type === 'Hero') {
      return buildBasePack(item.type, item.label, 1);
    }
    if (item.type === 'SpeedDial') {
      return buildBasePack(item.type, item.label, 2);
    }
    if (item.type === 'CTA') {
      return buildBasePack(item.type, item.label, 3);
    }
    if (item.type === 'Contact') {
      return buildBasePack(item.type, item.label, 4);
    }
    return buildBasePack(item.type, item.label, 10);
  });

  const priorityPacks = packs
    .filter((pack) => pack.priority < 10)
    .sort((a, b) => a.priority - b.priority);
  const otherPacks = packs
    .filter((pack) => pack.priority >= 10)
    .sort((a, b) => a.title.localeCompare(b.title));

  return { otherPacks, priorityPacks };
};
