import type { TestimonialsConfig } from '../_types';

export const DEFAULT_TESTIMONIALS_CONFIG: TestimonialsConfig = {
  items: [
    {
      avatar: '',
      avatarIcon: '',
      avatarType: 'initials',
      avatarUrl: '',
      company: '',
      content: '',
      name: '',
      rating: 5,
      role: '',
    },
  ],
  style: 'cards',
  desktopColumns: 3,
  splitBackgroundImage: '/demo/brand-banners/banner-1.webp',
  splitBackgroundOverlayOpacity: 62,
  // Header defaults
  hideHeader: false,
  showTitle: true,
  showSubtitle: true,
  subtitle: '',
  headerAlign: 'left',
  titleColorPrimary: false,
  subtitleAboveTitle: false,
  uppercaseText: false,
  showBadge: true,
  badgeText: '',
  spacing: 'normal',
  cornerRadius: 'lg',
};
