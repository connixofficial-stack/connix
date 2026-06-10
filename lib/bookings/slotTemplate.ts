export type BookingSlotTemplateByWeekday = Record<string, string[]>;

const SLOT_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeMinute = (value: number) => ((value % 1440) + 1440) % 1440;

export const formatMinutesToSlotTime = (minutes: number) => {
  const normalized = normalizeMinute(minutes);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const parseSlotTimeToMinutes = (value: string) => {
  const trimmed = value.trim();
  const match = SLOT_TIME_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
};

export const normalizeSlotTime = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }
  const minutes = parseSlotTimeToMinutes(value);
  if (minutes === null) {
    return null;
  }
  return formatMinutesToSlotTime(minutes);
};

export const normalizeSlotTemplate = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  value.forEach((item) => {
    const normalized = normalizeSlotTime(item);
    if (normalized) {
      unique.add(normalized);
    }
  });

  return Array.from(unique).sort((a, b) => {
    const aMinutes = parseSlotTimeToMinutes(a) ?? 0;
    const bMinutes = parseSlotTimeToMinutes(b) ?? 0;
    return aMinutes - bMinutes;
  });
};

export const normalizeSlotTemplateByWeekday = (value: unknown): BookingSlotTemplateByWeekday => {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const normalized: BookingSlotTemplateByWeekday = {};
  for (let day = 0; day <= 6; day += 1) {
    const dayValue = (value as Record<string, unknown>)[String(day)];
    if (dayValue === undefined) {
      continue;
    }
    normalized[day] = normalizeSlotTemplate(dayValue);
  }

  return normalized;
};

const resolveConfiguredTemplate = (value: unknown) => {
  if (value === undefined) {
    return { configured: false, slots: [] as string[] };
  }
  return { configured: true, slots: normalizeSlotTemplate(value) };
};

const resolveConfiguredTemplateFromRecord = (record: BookingSlotTemplateByWeekday, day: number) => {
  if (!Object.prototype.hasOwnProperty.call(record, String(day))) {
    return { configured: false, slots: [] as string[] };
  }
  return { configured: true, slots: normalizeSlotTemplate(record[String(day)]) };
};

export const resolveSlotTemplateForWeekday = (params: {
  weekday: number;
  globalDefault: unknown;
  globalByWeekday: unknown;
  serviceDefault?: unknown;
  serviceByWeekday?: unknown;
}) => {
  const normalizedWeekday = Math.min(6, Math.max(0, Math.round(params.weekday)));
  const globalByWeekday = normalizeSlotTemplateByWeekday(params.globalByWeekday);
  const serviceByWeekday = normalizeSlotTemplateByWeekday(params.serviceByWeekday);

  const fromServiceDay = resolveConfiguredTemplateFromRecord(serviceByWeekday, normalizedWeekday);
  if (fromServiceDay.configured) {
    return fromServiceDay;
  }

  const fromServiceDefault = resolveConfiguredTemplate(params.serviceDefault);
  if (fromServiceDefault.configured) {
    return fromServiceDefault;
  }

  const fromGlobalDay = resolveConfiguredTemplateFromRecord(globalByWeekday, normalizedWeekday);
  if (fromGlobalDay.configured) {
    return fromGlobalDay;
  }

  return resolveConfiguredTemplate(params.globalDefault);
};

export const filterSlotsByTemplate = (autoSlots: string[], template: { configured: boolean; slots: string[] }) => {
  if (!template.configured) {
    return autoSlots;
  }
  const allowedSet = new Set(template.slots);
  return autoSlots.filter((slot) => allowedSet.has(slot));
};

export const buildAutoSlotsFromWindow = (params: {
  startHour: number;
  endHour: number;
  slotIntervalMin: number;
  durationMin: number;
}) => {
  const start = Math.round(params.startHour) * 60;
  const end = Math.round(params.endHour) * 60;
  const slotIntervalMin = Math.round(params.slotIntervalMin);
  const durationMin = Math.round(params.durationMin);

  if (slotIntervalMin <= 0 || durationMin <= 0) {
    return [];
  }

  const span = start === end ? 0 : (end - start + 1440) % 1440;
  if (span <= 0) {
    return [];
  }

  const slots: string[] = [];
  for (let offset = 0; offset + durationMin <= span; offset += slotIntervalMin) {
    slots.push(formatMinutesToSlotTime(start + offset));
  }

  return slots;
};
