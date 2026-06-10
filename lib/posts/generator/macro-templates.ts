import type { MacroTemplateKey, ProductStrategy, SlotKey } from './types';

export type GeneratorFieldKey =
  | 'productLimit'
  | 'keyword'
  | 'budgetMin'
  | 'budgetMax'
  | 'categoryId'
  | 'compareProducts'
  | 'selectedProducts'
  | 'tone';

export interface TemplateFieldSpec {
  required: GeneratorFieldKey[];
  advanced?: GeneratorFieldKey[];
}

export interface MacroTemplate {
  key: MacroTemplateKey;
  label: string;
  description: string;
  productStrategy: ProductStrategy;
  titlePatterns: string[];
  preferredSlots?: SlotKey[];
}

const BASE_ADVANCED_FIELDS: GeneratorFieldKey[] = ['tone'];

const STRATEGY_FIELD_SPEC: Record<ProductStrategy, TemplateFieldSpec> = {
  best_sellers: { required: ['productLimit', 'selectedProducts'], advanced: BASE_ADVANCED_FIELDS },
  use_case: { required: ['productLimit', 'keyword'], advanced: BASE_ADVANCED_FIELDS },
  compare: { required: ['compareProducts'], advanced: BASE_ADVANCED_FIELDS },
  budget_under: { required: ['productLimit', 'budgetMax'], advanced: BASE_ADVANCED_FIELDS },
  budget_between: { required: ['productLimit', 'budgetMin', 'budgetMax'], advanced: BASE_ADVANCED_FIELDS },
  category: { required: ['productLimit', 'categoryId'], advanced: BASE_ADVANCED_FIELDS },
  value_popular: { required: ['productLimit', 'selectedProducts'], advanced: BASE_ADVANCED_FIELDS },
};

export const AUTO_POST_TEMPLATES: MacroTemplate[] = [
  {
    key: 'top_best_sellers',
    label: 'Top sản phẩm bán chạy',
    description: 'Tổng hợp top X sản phẩm bán chạy nhất.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Top {count} {category} nổi bật về {differentiator}',
      '{count} {category} đáng chú ý nhờ {differentiator}',
      'Danh sách {count} {category} phù hợp nếu bạn cần {differentiator}',
    ],
  },
  {
    key: 'top_use_case',
    label: 'Top theo nhu cầu',
    description: 'Top X sản phẩm phù hợp cho nhu cầu cụ thể.',
    productStrategy: 'use_case',
    titlePatterns: [
      '{category} nào phù hợp {useCase} và {differentiator}?',
      '{count} {category} cho {useCase} với ưu tiên {differentiator}',
      'Gợi ý {count} {category} dành cho {useCase}',
    ],
  },
  {
    key: 'compare_two',
    label: 'So sánh 2 sản phẩm',
    description: 'So sánh chi tiết sản phẩm A và B.',
    productStrategy: 'compare',
    titlePatterns: [
      'So sánh {productA} và {productB}: khác nhau ở đâu?',
      '{productA} và {productB}: nên chọn phương án nào cho {differentiator}?',
      'Khác biệt giữa {productA} và {productB} khi ưu tiên {differentiator}',
    ],
  },
  {
    key: 'top_under_budget',
    label: 'Top dưới ngân sách',
    description: 'Top X sản phẩm trong ngân sách phù hợp.',
    productStrategy: 'budget_under',
    titlePatterns: [
      '{count} {category} đáng cân nhắc trong {budgetMax}',
      'Gợi ý {count} {category} cho {budgetMax} và {differentiator}',
      'Danh sách {count} {category} phù hợp {budgetMax}',
    ],
  },
  {
    key: 'top_between_budget',
    label: 'Top theo khoảng giá',
    description: 'Top X sản phẩm trong ngân sách.',
    productStrategy: 'budget_between',
    titlePatterns: [
      'Top {count} {category} trong {budgetMin} với {differentiator}',
      '{count} lựa chọn đáng cân nhắc trong {budgetMax}',
      'Gợi ý {count} {category} hợp {budgetMax}',
    ],
  },
  {
    key: 'top_category',
    label: 'Top theo danh mục',
    description: 'Top X sản phẩm trong danh mục.',
    productStrategy: 'category',
    titlePatterns: [
      'Top {count} {category} nổi bật nhờ {differentiator}',
      '{count} {category} đáng cân nhắc cho {useCase}',
      'Danh sách {count} {category} đáng chú ý năm nay',
    ],
  },
  {
    key: 'beginner_friendly',
    label: 'Top cho người mới',
    description: 'Top X sản phẩm dễ dùng cho người mới.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      '{count} {category} dễ bắt đầu, tập trung {differentiator}',
      'Gợi ý {count} {category} thân thiện người mới, ưu tiên {differentiator}',
      '{category} nào dễ dùng cho người mới và {differentiator}?',
    ],
  },
  {
    key: 'premium_pick',
    label: 'Top cao cấp',
    description: 'Top X sản phẩm cao cấp đáng đầu tư.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      '{count} {category} cao cấp nổi bật về {differentiator}',
      'Chọn {category} cao cấp: {differentiator} là điểm cần có',
      'Top {count} {category} đáng đầu tư cho {differentiator}',
    ],
  },
  {
    key: 'seasonal_pick',
    label: 'Top theo mùa/sự kiện',
    description: 'Gợi ý sản phẩm theo mùa/sự kiện.',
    productStrategy: 'value_popular',
    titlePatterns: [
      '{count} {category} nên chuẩn bị cho {useCase} với {differentiator}',
      'Gợi ý {category} theo thời điểm: ưu tiên {differentiator}',
      '{category} đáng cân nhắc mùa này nhờ {differentiator}',
    ],
  },
  {
    key: 'goal_focused',
    label: 'Top theo mục tiêu',
    description: 'Top X sản phẩm theo mục tiêu cụ thể.',
    productStrategy: 'use_case',
    titlePatterns: [
      '{count} {category} bám mục tiêu {useCase} và {differentiator}',
      'Gợi ý {category} cho mục tiêu {useCase}: ưu tiên {differentiator}',
      '{category} nào giúp {useCase} và đảm bảo {differentiator}?',
    ],
  },
  {
    key: 'combo_recommendation',
    label: 'Combo nên mua',
    description: 'Gợi ý combo sản phẩm nên mua cùng nhau.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Combo {count} {category} phối hợp hiệu quả và {differentiator}',
      'Gợi ý {count} {category} đi cùng nhau để {differentiator}',
      '{count} combo {category} nên cân nhắc nếu cần {differentiator}',
    ],
  },
  {
    key: 'best_alternative',
    label: 'Sản phẩm thay thế',
    description: 'Đề xuất sản phẩm thay thế cho lựa chọn phổ biến.',
    productStrategy: 'compare',
    titlePatterns: [
      'Những lựa chọn thay thế {productA} nổi bật về {differentiator}',
      'Nếu cân nhắc {productA}, hãy xem {count} {category} khác về {differentiator}',
      '{count} phương án thay thế {productA} phù hợp {differentiator}',
    ],
  },
  {
    key: 'buyer_checklist',
    label: 'Checklist chọn mua',
    description: 'Checklist chọn mua + gợi ý top sản phẩm.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Checklist chọn {category} + {count} gợi ý tập trung {differentiator}',
      'Checklist nhanh trước khi chọn {category}: ưu tiên {differentiator}',
      '{count} {category} kèm checklist chọn theo {differentiator}',
    ],
  },
  {
    key: 'buyer_faq',
    label: 'Gợi ý trước khi mua',
    description: 'Gợi ý nhanh trước khi quyết định.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Gợi ý nhanh trước khi chọn {category}: {differentiator}',
      'Trước khi mua {category}, hãy nhìn vào {differentiator}',
      '{count} {category} đáng cân nhắc khi ưu tiên {differentiator}',
    ],
  },
  {
    key: 'common_mistakes',
    label: 'Sai lầm khi mua',
    description: 'Sai lầm thường gặp và gợi ý phù hợp.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Tránh sai lầm khi chọn {category}: ưu tiên {differentiator}',
      '{count} {category} giúp tránh lỗi phổ biến và {differentiator}',
      'Sai lầm khi mua {category} và cách chọn theo {differentiator}',
    ],
  },
  {
    key: 'review_by_criteria',
    label: 'Review theo tiêu chí',
    description: 'Review nhanh theo tiêu chí cụ thể.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Review {count} {category} theo tiêu chí {differentiator}',
      '{count} {category} nổi bật khi ưu tiên {differentiator}',
      'Đặt lên bàn cân {count} {category} theo {differentiator}',
    ],
  },
  {
    key: 'compare_three_budget',
    label: 'So kèo 3 sản phẩm theo ngân sách',
    description: 'So sánh 3 sản phẩm theo ngân sách.',
    productStrategy: 'budget_between',
    titlePatterns: [
      'So sánh 3 {category} trong {budgetMin}: nên chọn phương án nào?',
      '3 {category} phù hợp {budgetMax} khi ưu tiên {differentiator}',
      'Chọn 3 {category} đáng cân nhắc trong {budgetMin} theo {differentiator}',
    ],
  },
  {
    key: 'value_popular',
    label: 'Giá trị + phổ biến',
    description: 'Top sản phẩm vừa phổ biến vừa đáng tiền.',
    productStrategy: 'value_popular',
    titlePatterns: [
      '{count} {category} được quan tâm nhờ {differentiator}',
      'Top {count} {category} vừa phổ biến vừa {differentiator}',
      '{count} {category} đáng chú ý khi ưu tiên {differentiator}',
    ],
  },
  {
    key: 'choose_by_audience',
    label: 'Chọn theo đối tượng',
    description: 'Gợi ý theo nhóm khách hàng.',
    productStrategy: 'use_case',
    titlePatterns: [
      '{count} {category} phù hợp {useCase} với {differentiator}',
      'Gợi ý {category} cho {useCase}: ưu tiên {differentiator}',
      '{category} nào hợp {useCase} và {differentiator}?',
    ],
  },
  {
    key: 'ranking_periodic',
    label: 'Bảng xếp hạng tháng/quý',
    description: 'Bảng xếp hạng sản phẩm theo thời kỳ.',
    productStrategy: 'best_sellers',
    titlePatterns: [
      'Bảng xếp hạng {count} {category} nổi bật nhờ {differentiator}',
      'Top {count} {category} kỳ này với {differentiator}',
      '{count} {category} dẫn đầu nhờ {differentiator}',
    ],
  },
];

export const getMacroTemplate = (key: MacroTemplateKey): MacroTemplate => {
  const template = AUTO_POST_TEMPLATES.find((item) => item.key === key);
  if (!template) {
    return AUTO_POST_TEMPLATES[0];
  }
  return template;
};

export const getTemplateFieldSpec = (key: MacroTemplateKey): TemplateFieldSpec => {
  const template = getMacroTemplate(key);
  return STRATEGY_FIELD_SPEC[template.productStrategy];
};
