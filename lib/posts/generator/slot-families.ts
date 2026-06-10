import type { SlotKey } from './types';

export interface SlotFamily {
  key: SlotKey;
  label: string;
  required?: boolean;
}

export const SLOT_FAMILIES: SlotFamily[] = [
  { key: 'hero', label: 'Hero hook', required: true },
  { key: 'problem', label: 'Pain/problem framing' },
  { key: 'criteria', label: 'Selection criteria' },
  { key: 'top_list', label: 'Top list block', required: true },
  { key: 'spotlight', label: 'Product spotlight' },
  { key: 'comparison', label: 'Comparison matrix' },
  { key: 'budget', label: 'Budget/value analysis' },
  { key: 'cta', label: 'CTA + internal links', required: true },
  { key: 'disclaimer', label: 'Tiny-note/disclaimer' },
];

export const REQUIRED_SLOTS = SLOT_FAMILIES.filter((slot) => slot.required).map((slot) => slot.key);
export const OPTIONAL_SLOTS = SLOT_FAMILIES.filter((slot) => !slot.required).map((slot) => slot.key);
