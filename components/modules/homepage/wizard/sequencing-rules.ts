import type { TemplateDefinition, WizardAnswerMap } from './types';

const TOP_ZONE = new Set(['Hero']);
const BOTTOM_ZONE = new Set(['Footer']);

const DEFAULT_INSERT_ORDER = ['TrustBadges', 'Testimonials', 'Partners', 'Clients', 'Stats', 'Benefits', 'Features', 'FAQ'];

const resolveSequencePreference = (answers: WizardAnswerMap, componentType: string) => {
  const key = `${componentType}:sequence`;
  return answers[key] ?? 'auto';
};

export const buildSequenceFromTemplate = (
  template: TemplateDefinition,
  enabledComponents: string[],
  answers: WizardAnswerMap,
) => {
  const base = template.sequence.filter((type) => enabledComponents.includes(type));
  const extra = enabledComponents.filter((type) => !base.includes(type));

  const addWithPreference = (list: string[], type: string) => {
    const preference = resolveSequencePreference(answers, type);
    if (preference === 'top' && !TOP_ZONE.has(type)) {
      list.splice(1, 0, type);
      return;
    }
    if (preference === 'bottom' && !BOTTOM_ZONE.has(type)) {
      list.push(type);
      return;
    }
    list.push(type);
  };

  const sequence = [...base];
  extra.forEach((type) => addWithPreference(sequence, type));

  const finalSequence = sequence.filter((type, index, arr) => arr.indexOf(type) === index);
  const hasFooter = finalSequence.includes('Footer');
  if (!hasFooter && enabledComponents.includes('Footer')) {
    finalSequence.push('Footer');
  }
  if (finalSequence[0] !== 'Hero' && enabledComponents.includes('Hero')) {
    finalSequence.unshift('Hero');
  }

  const ordered = [
    ...finalSequence.filter((type) => TOP_ZONE.has(type)),
    ...finalSequence.filter((type) => !TOP_ZONE.has(type) && !BOTTOM_ZONE.has(type)),
    ...finalSequence.filter((type) => BOTTOM_ZONE.has(type)),
  ];

  const normalized = ordered.filter((type) => enabledComponents.includes(type));
  const enriched = DEFAULT_INSERT_ORDER.filter((type) => enabledComponents.includes(type));
  enriched.forEach((type) => {
    if (!normalized.includes(type)) {
      normalized.splice(Math.min(3, normalized.length), 0, type);
    }
  });

  return normalized;
};
