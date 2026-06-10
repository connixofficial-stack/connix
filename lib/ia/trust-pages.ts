export type TrustPageKey = 'about' | 'terms' | 'privacy' | 'returnPolicy' | 'shipping' | 'payment' | 'faq';

export type TrustPageSlot = {
  key: TrustPageKey;
  label: string;
  slug: string;
  iaKey: string;
  mappingKey: string;
  keywords: string[];
  defaultTitle: string;
};

export const TRUST_PAGE_SLOTS: TrustPageSlot[] = [
  {
    key: 'about',
    label: 'Về chúng tôi',
    slug: '/about',
    iaKey: 'ia_page_about',
    mappingKey: 'trust_page_about_post_id',
    keywords: ['about', 'gioi-thieu', 've-chung-toi', 'gioi-thieu-ve'],
    defaultTitle: 'Về chúng tôi',
  },
  {
    key: 'terms',
    label: 'Điều khoản sử dụng',
    slug: '/terms',
    iaKey: 'ia_page_terms',
    mappingKey: 'trust_page_terms_post_id',
    keywords: ['terms', 'dieu-khoan', 'dieu-khoan-su-dung', 'terms-of-service'],
    defaultTitle: 'Điều khoản sử dụng',
  },
  {
    key: 'privacy',
    label: 'Chính sách bảo mật',
    slug: '/privacy',
    iaKey: 'ia_page_privacy',
    mappingKey: 'trust_page_privacy_post_id',
    keywords: ['privacy', 'bao-mat', 'chinh-sach-bao-mat', 'privacy-policy'],
    defaultTitle: 'Chính sách bảo mật',
  },
  {
    key: 'returnPolicy',
    label: 'Chính sách đổi trả',
    slug: '/return-policy',
    iaKey: 'ia_page_return_policy',
    mappingKey: 'trust_page_return_policy_post_id',
    keywords: ['return', 'return-policy', 'doi-tra', 'hoan-tien', 'refund'],
    defaultTitle: 'Chính sách đổi trả',
  },
  {
    key: 'shipping',
    label: 'Vận chuyển',
    slug: '/shipping',
    iaKey: 'ia_page_shipping',
    mappingKey: 'trust_page_shipping_post_id',
    keywords: ['shipping', 'van-chuyen', 'giao-hang', 'delivery'],
    defaultTitle: 'Chính sách vận chuyển',
  },
  {
    key: 'payment',
    label: 'Thanh toán',
    slug: '/payment',
    iaKey: 'ia_page_payment',
    mappingKey: 'trust_page_payment_post_id',
    keywords: ['payment', 'thanh-toan', 'hinh-thuc-thanh-toan', 'pay'],
    defaultTitle: 'Chính sách thanh toán',
  },
  {
    key: 'faq',
    label: 'Câu hỏi thường gặp',
    slug: '/faq',
    iaKey: 'ia_page_faq',
    mappingKey: 'trust_page_faq_post_id',
    keywords: ['faq', 'cau-hoi-thuong-gap', 'ho-tro', 'support'],
    defaultTitle: 'Câu hỏi thường gặp',
  },
];

export const TRUST_PAGE_MAPPING_KEYS = TRUST_PAGE_SLOTS.map((slot) => slot.mappingKey);

export const TRUST_PAGE_KEYS = TRUST_PAGE_SLOTS.map((slot) => slot.key);

export const findTrustPageSlot = (key: TrustPageKey) =>
  TRUST_PAGE_SLOTS.find((slot) => slot.key === key);
