export type ExperienceKey = 
  | 'product_detail_ui'
  | 'wishlist_ui'
  | 'cart_ui'
  | 'checkout_ui'
  | 'comments_rating_ui'
  | 'posts_list_ui'
  | 'posts_detail_ui'
  | 'services_list_ui'
  | 'services_detail_ui'
  | 'projects_list_ui'
  | 'projects_detail_ui'
  | 'courses_list_ui'
  | 'courses_detail_ui'
  | 'resources_list_ui'
  | 'resources_detail_ui'
  | 'lesson_detail_ui'
  | 'booking_ui'
  | 'products_list_ui'
  | 'header_menu_ui'
  | 'contact_ui'
  | 'error_pages_ui'
  | 'search_filter_ui'
  | 'promotions_list_ui'
  | 'account_orders_ui'
  | 'account_profile_ui';

export type ColorScheme = 'pink' | 'orange' | 'green' | 'purple' | 'cyan' | 'blue' | 'violet' | 'emerald' | 'indigo' | 'teal';

export const EXPERIENCE_COLORS: Record<ExperienceKey, ColorScheme> = {
  product_detail_ui: 'cyan',
  wishlist_ui: 'pink',
  cart_ui: 'orange',
  checkout_ui: 'green',
  comments_rating_ui: 'purple',
  posts_list_ui: 'blue',
  posts_detail_ui: 'blue',
  services_list_ui: 'violet',
  services_detail_ui: 'violet',
  projects_list_ui: 'teal',
  projects_detail_ui: 'teal',
  courses_list_ui: 'indigo',
  courses_detail_ui: 'indigo',
  resources_list_ui: 'teal',
  resources_detail_ui: 'teal',
  lesson_detail_ui: 'indigo',
  booking_ui: 'indigo',
  products_list_ui: 'emerald',
  header_menu_ui: 'orange',
  contact_ui: 'indigo',
  error_pages_ui: 'orange',
  search_filter_ui: 'teal',
  promotions_list_ui: 'pink',
  account_orders_ui: 'indigo',
  account_profile_ui: 'teal',
};

export const EXPERIENCE_GROUP = 'experience';

export const MESSAGES = {
  loading: 'Đang tải...',
  saveError: 'Có lỗi khi lưu cấu hình',
  saveSuccess: (name: string) => `Đã lưu cấu hình trải nghiệm ${name}`,
};

export const EXPERIENCE_NAMES: Record<ExperienceKey, string> = {
  product_detail_ui: 'Product Detail',
  wishlist_ui: 'Wishlist',
  cart_ui: 'Giỏ hàng',
  checkout_ui: 'Checkout',
  comments_rating_ui: 'Comments & Rating',
  posts_list_ui: 'Posts List',
  posts_detail_ui: 'Posts Detail',
  services_list_ui: 'Services List',
  services_detail_ui: 'Services Detail',
  projects_list_ui: 'Projects List',
  projects_detail_ui: 'Projects Detail',
  courses_list_ui: 'Courses List',
  courses_detail_ui: 'Courses Detail',
  resources_list_ui: 'Resources List',
  resources_detail_ui: 'Resources Detail',
  lesson_detail_ui: 'Lesson Detail',
  booking_ui: 'Booking',
  products_list_ui: 'Products List',
  header_menu_ui: 'Header Menu',
  contact_ui: 'Contact',
  error_pages_ui: 'Error Pages',
  search_filter_ui: 'Search & Filter',
  promotions_list_ui: 'Promotions List',
  account_orders_ui: 'Account Orders',
  account_profile_ui: 'Account Profile',
};
