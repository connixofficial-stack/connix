import {
  actionStatements,
  closingStatements,
  benefitVerbs,
  comparisonAngles,
  criteriaPhrases,
  disclaimerPhrases,
  hookIntents,
  hookVerbs,
  proofStatements,
  trustCues,
  urgencyPhrases,
  valueStatements,
} from './phrase-banks';
import { stripHtml } from '../../seo';
import type { GeneratorProduct, SlotKey, Tone } from './types';

const slotTemplates: Record<SlotKey, string[]> = {
  hero: [
    '{{hookVerb}} {intent} {trustCue} để đi thẳng vào điểm khác biệt quan trọng.',
    '{{hookVerb}} top lựa chọn {intent} {trustCue} để tiết kiệm thời gian đánh giá.',
    '{{hookVerb}} các phương án {intent} {trustCue} và khoanh vùng nhu cầu thật.',
    '{{hookVerb}} {intent} {trustCue} để tránh chọn theo cảm tính.',
    '{{hookVerb}} {intent} {trustCue} để có shortlist đáng tin.',
  ],
  problem: [
    'Nhiều người chọn sai vì thiếu tiêu chí rõ ràng. Phần này giúp bạn bóc tách nhu cầu thật và tránh lãng phí.',
    'Nếu bạn đang phân vân giữa quá nhiều lựa chọn, hãy bắt đầu từ tiêu chí cốt lõi để giảm rủi ro.',
    'Sai lầm thường gặp là nhìn thông số rời rạc mà bỏ qua hiệu quả dài hạn.',
    'Cùng một ngân sách, kết quả khác nhau nằm ở việc chọn đúng mục tiêu.',
    'Nhiều lựa chọn hấp dẫn nhưng không phải cái nào cũng phù hợp bối cảnh của bạn.',
  ],
  criteria: [
    '3 tiêu chí chọn nhanh: {{criteria}}, độ ổn định, và mức độ phù hợp nhu cầu.',
    'Checklist chọn mua: {{criteria}}, tính tiện dụng, và khả năng mở rộng.',
    'Khi chọn sản phẩm, ưu tiên {{criteria}} và trải nghiệm sử dụng lâu dài.',
    'Một bộ tiêu chí gọn: {{criteria}}, độ bền, và chi phí vận hành.',
    'Tiêu chí then chốt: {{criteria}}, khả năng đáp ứng nhu cầu, và hiệu quả ngân sách.',
  ],
  top_list: [
    'Dưới đây là danh sách lựa chọn nổi bật kèm điểm mạnh chính để bạn so nhanh.',
    'Các phương án bên dưới đã được sàng lọc theo mức độ phù hợp thực tế.',
    'Danh sách này ưu tiên lựa chọn cân bằng giữa hiệu quả và chi phí vận hành.',
    'Các lựa chọn sau phù hợp cho bối cảnh cần quyết định rõ ràng, ít rủi ro.',
    'Danh sách này tập trung vào phương án dễ triển khai và ổn định dài hạn.',
  ],
  spotlight: [
    'Nếu cần một lựa chọn “đánh nhanh thắng nhanh”, {{productName}} là ứng viên rất đáng cân nhắc.',
    '{{productName}} phù hợp khi bạn cần {{benefitVerb}} thời gian triển khai và vẫn giữ chất lượng.',
    '{{productName}} nổi bật ở {{criteria}}, phù hợp cho nhu cầu gấp rút.',
    'Với người ưu tiên {{criteria}}, {{productName}} là lựa chọn ổn định.',
    '{{productName}} mang lại giá trị tốt nếu bạn muốn {{benefitVerb}} chi phí.',
  ],
  comparison: [
    'So sánh theo {{angle}} giúp bạn nhìn rõ điểm khác biệt quan trọng.',
    'Đối chiếu {{angle}} sẽ dễ thấy lựa chọn phù hợp nhất.',
    'Khi ưu tiên {{angle}}, phương án phù hợp sẽ lộ rõ lợi thế.',
    'So sánh theo {{angle}} giúp tránh mua dư tính năng.',
    'Phân tích {{angle}} để chốt phương án đúng nhu cầu dài hạn.',
  ],
  budget: [
    'Trong {budgetRange}, ưu tiên lựa chọn có {{criteria}} tốt nhất.',
    'Với {budgetRange}, bạn nên tập trung vào hiệu quả thay vì chạy theo quá nhiều tính năng.',
    'Ngân sách {budgetRange} phù hợp với nhóm sản phẩm cân bằng, dễ triển khai.',
    'Trong {budgetRange}, lựa chọn thông minh là sản phẩm có {{criteria}} tốt.',
    'Nếu bám {budgetRange}, hãy ưu tiên sản phẩm giúp {{benefitVerb}} vận hành.',
  ],
  cta: [
    'Nếu bạn muốn {{urgency}}, hãy xem chi tiết từng phương án dưới đây.',
    'Sẵn sàng đi sâu hơn? Các liên kết sau giúp bạn kiểm tra thông số thực tế.',
    'Bạn có thể mở trang chi tiết để so nhanh theo nhu cầu của mình.',
    'Khi cần chốt nhanh, hãy ưu tiên xem kỹ 2–3 lựa chọn nổi bật.',
    'Nếu muốn tiết kiệm thời gian, hãy bắt đầu từ các liên kết phù hợp bên dưới.',
  ],
  disclaimer: [
    '{{disclaimer}}',
    '{{disclaimer}}',
    '{{disclaimer}}',
    '{{disclaimer}}',
    '{{disclaimer}}',
  ],
};

const slotBankMap: Record<SlotKey, Record<string, string[]>> = {
  hero: { hookVerb: hookVerbs, intent: hookIntents, trustCue: trustCues },
  problem: {},
  criteria: { criteria: criteriaPhrases },
  top_list: {},
  spotlight: { benefitVerb: benefitVerbs, criteria: criteriaPhrases },
  comparison: { angle: comparisonAngles },
  budget: { criteria: criteriaPhrases, benefitVerb: benefitVerbs },
  cta: { urgency: urgencyPhrases },
  disclaimer: { disclaimer: disclaimerPhrases },
};

export const estimateVariantCapacity = (slotKey: SlotKey): number => {
  const templates = slotTemplates[slotKey] ?? [];
  const banks = slotBankMap[slotKey] ?? {};
  const bankSize = Object.values(banks).reduce((total, values) => total * Math.max(values.length, 1), 1);
  return Math.max(templates.length * bankSize, 1);
};

export const buildSlotVariant = ({
  slotKey,
  rng,
  tone,
  primaryProduct,
  secondaryProduct,
  budgetRange,
}: {
  slotKey: SlotKey;
  rng: () => number;
  tone: Tone;
  primaryProduct?: GeneratorProduct;
  secondaryProduct?: GeneratorProduct;
  budgetRange?: string;
}): { title: string; paragraphs: string[] } => {
  const templates = slotTemplates[slotKey];
  const template = templates[Math.floor(rng() * templates.length)];
  const banks = slotBankMap[slotKey] ?? {};
  const variables: Record<string, string> = {
    productName: primaryProduct?.name ?? 'Sản phẩm',
    productB: secondaryProduct?.name ?? 'Sản phẩm B',
    budgetRange: budgetRange ?? 'ngân sách phù hợp',
  };

  Object.entries(banks).forEach(([key, values]) => {
    const value = values[Math.floor(rng() * values.length)];
    variables[key] = value;
  });

  if (tone === 'expert') {
    variables.trustCue = `${variables.trustCue ?? 'theo dữ liệu'} và benchmark thực tế`;
  }
  if (tone === 'friendly') {
    variables.urgency = `dễ bắt đầu, ${variables.urgency ?? 'đáng thử ngay'}`;
  }
  if (tone === 'sales') {
    variables.urgency = `${variables.urgency ?? 'đáng thử ngay'} để tối đa giá trị`;
  }

  const body = template.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (_, keyA, keyB) => {
    const key = keyA || keyB;
    return variables[key] ?? '';
  });

  const trimSentence = (value?: string, limit = 180) => {
    if (!value?.trim()) {return undefined;}
    const clean = stripHtml(value).replace(/\s+/g, ' ').trim();
    if (clean.length <= limit) {return clean;}
    return `${clean.slice(0, limit).trim()}...`;
  };

  const extraParagraphs: string[] = [];
  const pick = (items: string[]) => items[Math.floor(rng() * items.length)];

  if (slotKey === 'hero') {
    extraParagraphs.push(pick(valueStatements));
  }

  if (slotKey === 'top_list' || slotKey === 'comparison') {
    extraParagraphs.push(pick(proofStatements));
  }

  if (slotKey === 'spotlight' || slotKey === 'comparison') {
    const summary = trimSentence(primaryProduct?.description);
    if (summary) {
      extraParagraphs.push(`Tóm tắt nhanh: ${summary}`);
    }
  }

  if (slotKey === 'cta') {
    extraParagraphs.push(pick(actionStatements));
  }

  if (slotKey === 'disclaimer') {
    extraParagraphs.push(pick(closingStatements));
  }

  const categoryLabel = primaryProduct?.categoryName ?? 'sản phẩm';
  const compareTitle = primaryProduct && secondaryProduct
    ? `Nên chọn ${primaryProduct.name} hay ${secondaryProduct.name}?`
    : `Tổng quan nhanh trước khi chọn ${categoryLabel}`;
  const titleMap: Record<SlotKey, string> = {
    hero: compareTitle,
    problem: 'Bối cảnh sử dụng và nhu cầu thực tế',
    criteria: `Tiêu chí quan trọng khi chọn ${categoryLabel}`,
    top_list: `Các lựa chọn ${categoryLabel} đáng cân nhắc`,
    spotlight: primaryProduct?.name ? `${primaryProduct.name} có gì đáng chú ý?` : `Lựa chọn ${categoryLabel} nổi bật`,
    comparison: primaryProduct && secondaryProduct
      ? `Khác nhau ở đâu giữa ${primaryProduct.name} và ${secondaryProduct.name}?`
      : 'So sánh theo tiêu chí chính',
    budget: `Chọn ${categoryLabel} theo ngân sách`,
    cta: 'Khi nào nên xem chi tiết từng phương án',
    disclaimer: 'Lưu ý trước khi quyết định',
  };

  const paragraphs = [body, ...extraParagraphs].filter(Boolean);
  return { title: titleMap[slotKey], paragraphs };
};

