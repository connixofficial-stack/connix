import type { FeatureItem, FeaturesConfig } from '../_types';
import {
  icons, Star,
} from 'lucide-react';
import type { IconOption } from '../../_shared/components/IconPopoverPicker';

export const FEATURE_ICON_OPTIONS = [
  'Star', 'Heart', 'ShoppingCart', 'Truck', 'ShieldCheck', 'Package',
  'CreditCard', 'Phone', 'Mail', 'MapPin', 'Clock', 'Check',
  'Gift', 'Zap', 'Sparkles', 'Home', 'Users', 'Settings',
  'Award', 'Tag', 'Store', 'Rocket', 'Lightbulb', 'Shield',
  'Wallet', 'Bell', 'ShoppingBag', 'Handshake', 'Globe', 'Lock',
  'HeartPulse', 'HeartHandshake', 'CheckCircle', 'Send', 'Target',
  'Trophy', 'Crown', 'Gem', 'Flame', 'ThumbsUp', 'Eye',
  'Bookmark', 'Megaphone', 'Camera', 'Coffee', 'Utensils',
  'Car', 'Plane', 'Building', 'Building2', 'Hotel', 'Key',
  'Briefcase', 'GraduationCap', 'Book', 'Headphones', 'Music',
  'Sun', 'Leaf', 'Smile', 'UserCheck', 'WandSparkles',
  'Ambulance', 'Stethoscope', 'Hospital', 'Pill', 'Baby',
  'Dumbbell', 'Brain', 'Laptop', 'Smartphone', 'Wifi',
  'Code', 'Database', 'Server', 'Cloud', 'Bot',
  'Hammer', 'Wrench', 'Paintbrush', 'Scissors', 'Ruler',
  'Ship', 'Train', 'Bike', 'Bus',
  'Apple', 'Pizza', 'ChefHat', 'Wine', 'Beer',
  'Dog', 'Cat', 'Fish', 'Bird', 'TreePine',
  'Printer', 'Calculator', 'Receipt', 'FileText',
] as const;

export const FEATURE_ICON_PICKER_OPTIONS: IconOption[] = FEATURE_ICON_OPTIONS.map((name) => ({
  value: name,
  label: name,
  Icon: (icons as unknown as Record<string, IconOption['Icon']>)[name] ?? Star,
}));

export const createFeatureItem = (overrides?: Partial<FeatureItem>): FeatureItem => ({
  id: Date.now() + Math.floor(Math.random() * 10000),
  icon: 'Star',
  title: '',
  description: '',
  ...overrides,
});

export const normalizeFeatureItems = (items: unknown): FeatureItem[] => {
  if (!Array.isArray(items)) {
    return [createFeatureItem()];
  }

  const normalized = items
    .map((item, index) => {
      if (!item || typeof item !== 'object') {return null;}
      const source = item as Record<string, unknown>;
      const fallbackId = Date.now() + index;
      return createFeatureItem({
        id: typeof source.id === 'number' ? source.id : fallbackId,
        icon: typeof source.icon === 'string' && source.icon.trim().length > 0 ? source.icon : 'Star',
        title: typeof source.title === 'string' ? source.title : '',
        description: typeof source.description === 'string' ? source.description : '',
        image: typeof source.image === 'string' ? source.image : undefined,
      });
    })
    .filter((item): item is FeatureItem => item !== null);

  return normalized.length > 0 ? normalized : [createFeatureItem()];
};

export const DEFAULT_FEATURES_CONFIG: FeaturesConfig = {
  items: [createFeatureItem()],
  style: 'carousel6',
  showIcons: true,
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
};
