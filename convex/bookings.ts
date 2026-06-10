import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_BOOKING_CUSTOMER_FIELDS,
  normalizeBookingCustomerFieldConfigs,
  type BookingCustomerFieldConfig,
} from "../lib/bookings/customerFieldConfig";
import {
  filterSlotsByTemplate,
  normalizeSlotTemplate,
  normalizeSlotTemplateByWeekday,
  resolveSlotTemplateForWeekday,
  type BookingSlotTemplateByWeekday,
} from "../lib/bookings/slotTemplate";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { consumeRateLimit } from "./lib/rateLimit";

const bookingStatus = v.union(
  v.literal("Pending"),
  v.literal("Confirmed"),
  v.literal("Cancelled")
);

const bookingDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("bookings"),
  serviceId: v.id("services"),
  customerName: v.string(),
  bookingDate: v.string(),
  slotTime: v.string(),
  timezone: v.string(),
  status: bookingStatus,
  note: v.optional(v.string()),
  bookingFields: v.optional(v.record(v.string(), v.string())),
});

type BookingSettings = {
  timezoneDefault: string;
  maxAdvanceDays: number;
  dayStartHour: number;
  dayEndHour: number;
  visibilityMode: "show_full" | "show_anonymous" | "hide_calendar";
  openDays: Record<number, boolean>;
  customerFieldConfigs: BookingCustomerFieldConfig[];
  slotTemplateDefault?: string[];
  slotTemplateByWeekday: BookingSlotTemplateByWeekday;
};

const DEFAULT_SETTINGS: BookingSettings = {
  timezoneDefault: "Asia/Ho_Chi_Minh",
  maxAdvanceDays: 14,
  dayStartHour: 9,
  dayEndHour: 20,
  visibilityMode: "show_anonymous",
  openDays: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true },
  customerFieldConfigs: DEFAULT_BOOKING_CUSTOMER_FIELDS,
  slotTemplateDefault: undefined,
  slotTemplateByWeekday: {},
};

const getModuleSettingValue = async (
  ctx: QueryCtx | MutationCtx,
  settingKey: string,
) => {
  const setting = await ctx.db
    .query("moduleSettings")
    .withIndex("by_module_setting", (q) => q.eq("moduleKey", "bookings").eq("settingKey", settingKey))
    .unique();
  return setting?.value;
};

const resolveSettings = async (ctx: QueryCtx | MutationCtx): Promise<BookingSettings> => {
  const [
    timezoneDefault,
    maxAdvanceDays,
    dayStartHour,
    dayEndHour,
    visibilityMode,
    openMon,
    openTue,
    openWed,
    openThu,
    openFri,
    openSat,
    openSun,
    customerFieldConfigsRaw,
    slotTemplateDefaultRaw,
    slotTemplateByWeekdayRaw,
  ] = await Promise.all([
    getModuleSettingValue(ctx, "timezoneDefault"),
    getModuleSettingValue(ctx, "maxAdvanceDays"),
    getModuleSettingValue(ctx, "dayStartHour"),
    getModuleSettingValue(ctx, "dayEndHour"),
    getModuleSettingValue(ctx, "visibilityMode"),
    getModuleSettingValue(ctx, "openMon"),
    getModuleSettingValue(ctx, "openTue"),
    getModuleSettingValue(ctx, "openWed"),
    getModuleSettingValue(ctx, "openThu"),
    getModuleSettingValue(ctx, "openFri"),
    getModuleSettingValue(ctx, "openSat"),
    getModuleSettingValue(ctx, "openSun"),
    getModuleSettingValue(ctx, "customerFieldConfigs"),
    getModuleSettingValue(ctx, "slotTemplateDefault"),
    getModuleSettingValue(ctx, "slotTemplateByWeekday"),
  ]);

  return {
    timezoneDefault: typeof timezoneDefault === "string" ? timezoneDefault : DEFAULT_SETTINGS.timezoneDefault,
    maxAdvanceDays: typeof maxAdvanceDays === "number" ? maxAdvanceDays : DEFAULT_SETTINGS.maxAdvanceDays,
    dayStartHour: typeof dayStartHour === "number" ? dayStartHour : DEFAULT_SETTINGS.dayStartHour,
    dayEndHour: typeof dayEndHour === "number" ? dayEndHour : DEFAULT_SETTINGS.dayEndHour,
    visibilityMode: visibilityMode === "show_full" || visibilityMode === "show_anonymous" || visibilityMode === "hide_calendar"
      ? visibilityMode
      : DEFAULT_SETTINGS.visibilityMode,
    openDays: {
      0: typeof openSun === "boolean" ? openSun : DEFAULT_SETTINGS.openDays[0],
      1: typeof openMon === "boolean" ? openMon : DEFAULT_SETTINGS.openDays[1],
      2: typeof openTue === "boolean" ? openTue : DEFAULT_SETTINGS.openDays[2],
      3: typeof openWed === "boolean" ? openWed : DEFAULT_SETTINGS.openDays[3],
      4: typeof openThu === "boolean" ? openThu : DEFAULT_SETTINGS.openDays[4],
      5: typeof openFri === "boolean" ? openFri : DEFAULT_SETTINGS.openDays[5],
      6: typeof openSat === "boolean" ? openSat : DEFAULT_SETTINGS.openDays[6],
    },
    customerFieldConfigs: normalizeBookingCustomerFieldConfigs(customerFieldConfigsRaw),
    slotTemplateDefault: slotTemplateDefaultRaw === undefined ? undefined : normalizeSlotTemplate(slotTemplateDefaultRaw),
    slotTemplateByWeekday: normalizeSlotTemplateByWeekday(slotTemplateByWeekdayRaw),
  };
};

const parseBookingDate = (bookingDate: string) => new Date(`${bookingDate}T00:00:00Z`);

const getWeekday = (bookingDate: string) => parseBookingDate(bookingDate).getUTCDay();

const resolveMinutes = (time: string) => {
  const [h, m] = time.split(":").map((value) => Number(value));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  return h * 60 + m;
};

const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const toDayMinute = (minuteOfDay: number) => ((minuteOfDay % 1440) + 1440) % 1440;

const resolveOperatingWindow = (settings: BookingSettings) => {
  const start = settings.dayStartHour * 60;
  const end = settings.dayEndHour * 60;
  if (start === end) {
    return { start, end, span: 0 };
  }
  const span = (end - start + 1440) % 1440;
  return { start, end, span };
};

const isSlotInOperatingWindow = (
  settings: BookingSettings,
  slotMinutes: number,
  durationMin: number,
  slotIntervalMin: number,
) => {
  const { start, span } = resolveOperatingWindow(settings);
  if (span <= 0 || durationMin <= 0 || slotIntervalMin <= 0) {
    return false;
  }

  const normalizedStart = toDayMinute(start);
  const normalizedSlot = toDayMinute(slotMinutes);
  const offset = (normalizedSlot - normalizedStart + 1440) % 1440;

  if (offset % slotIntervalMin !== 0) {
    return false;
  }

  return offset + durationMin <= span;
};

const buildSlots = (settings: BookingSettings, service: Doc<"services">) => {
  const durationMin = service.bookingDurationMin ?? 60;
  const slotIntervalMin = service.bookingSlotIntervalMin ?? 30;
  const { start, span } = resolveOperatingWindow(settings);
  if (span <= 0 || durationMin <= 0 || slotIntervalMin <= 0) {
    return [];
  }

  const slots: string[] = [];
  for (let offset = 0; offset + durationMin <= span; offset += slotIntervalMin) {
    slots.push(formatMinutes(toDayMinute(start + offset)));
  }
  return slots;
};

const resolveAllowedSlots = (params: {
  settings: BookingSettings;
  service: Doc<"services">;
  weekday: number;
  autoSlots: string[];
}) => {
  const template = resolveSlotTemplateForWeekday({
    weekday: params.weekday,
    globalDefault: params.settings.slotTemplateDefault,
    globalByWeekday: params.settings.slotTemplateByWeekday,
    serviceDefault: params.service.bookingSlotTemplateDefault,
    serviceByWeekday: params.service.bookingSlotTemplateByWeekday,
  });

  return filterSlotsByTemplate(params.autoSlots, template);
};

const normalizeSubmittedBookingFields = (input?: Record<string, string>) => {
  const normalized: Record<string, string> = {};
  if (!input) {
    return normalized;
  }

  Object.entries(input).forEach(([key, value]) => {
    if (typeof key !== "string" || typeof value !== "string") {
      return;
    }
    const nextKey = key.trim();
    if (!nextKey) {
      return;
    }
    normalized[nextKey] = value.trim();
  });

  return normalized;
};

const validateBookingDate = (settings: BookingSettings, bookingDate: string) => {
  const date = parseBookingDate(bookingDate);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: "Ngày đặt lịch không hợp lệ" };
  }
  const today = new Date();
  const diffDays = Math.floor((date.getTime() - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) {
    return { ok: false, message: "Không thể đặt lịch cho ngày đã qua" };
  }
  if (diffDays > settings.maxAdvanceDays) {
    return { ok: false, message: "Ngày đặt lịch vượt quá giới hạn cho phép" };
  }
  const weekday = getWeekday(bookingDate);
  if (!settings.openDays[weekday]) {
    return { ok: false, message: "Ngày này không mở đặt lịch" };
  }
  return { ok: true };
};

export const getPublicAvailability = query({
  args: {
    bookingDate: v.string(),
    serviceId: v.id("services"),
  },
  handler: async (ctx, args) => {
    const [settings, service] = await Promise.all([
      resolveSettings(ctx),
      ctx.db.get(args.serviceId),
    ]);
    if (!service || service.bookingEnabled !== true) {
      return { allowed: false, message: "Dịch vụ không hỗ trợ đặt lịch", visibilityMode: settings.visibilityMode, slots: [] };
    }

    const validation = validateBookingDate(settings, args.bookingDate);
    if (!validation.ok) {
      return { allowed: false, message: validation.message, visibilityMode: settings.visibilityMode, slots: [] };
    }

    if (settings.visibilityMode === "hide_calendar") {
      return { allowed: true, visibilityMode: settings.visibilityMode, slots: [] };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_service_date", (q) => q.eq("serviceId", args.serviceId).eq("bookingDate", args.bookingDate))
      .collect();
    const activeBookings = bookings.filter((booking) => booking.status !== "Cancelled");
    const autoSlots = buildSlots(settings, service);
    const weekday = getWeekday(args.bookingDate);
    const slots = resolveAllowedSlots({
      settings,
      service,
      weekday,
      autoSlots,
    });
    const slotMap = new Map<string, { count: number; names: string[] }>();

    for (const slot of slots) {
      slotMap.set(slot, { count: 0, names: [] });
    }

    for (const booking of activeBookings) {
      const entry = slotMap.get(booking.slotTime);
      if (!entry) {continue;}
      entry.count += 1;
      if (settings.visibilityMode === "show_full") {
        entry.names.push(booking.customerName);
      }
    }

    return {
      allowed: true,
      visibilityMode: settings.visibilityMode,
      capacityPerSlot: service.bookingCapacityPerSlot ?? 1,
      slots: Array.from(slotMap.entries()).map(([slotTime, info]) => ({
        slotTime,
        count: info.count,
        names: settings.visibilityMode === "show_full" ? info.names : undefined,
      })),
    };
  },
  returns: v.object({
    allowed: v.boolean(),
    message: v.optional(v.string()),
    visibilityMode: v.union(v.literal("show_full"), v.literal("show_anonymous"), v.literal("hide_calendar")),
    capacityPerSlot: v.optional(v.number()),
    slots: v.array(v.object({
      slotTime: v.string(),
      count: v.number(),
      names: v.optional(v.array(v.string())),
    })),
  }),
});

export const getPublicMonthOverview = query({
  args: {
    serviceId: v.id("services"),
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, args) => {
    const [settings, service] = await Promise.all([
      resolveSettings(ctx),
      ctx.db.get(args.serviceId),
    ]);

    if (!service || service.bookingEnabled !== true) {
      return {
        capacityPerSlot: 0,
        visibilityMode: settings.visibilityMode,
        days: [] as Array<{ bookingDate: string; activeCount: number; isFull: boolean }>,
      };
    }

    if (args.fromDate > args.toDate) {
      return {
        capacityPerSlot: service.bookingCapacityPerSlot ?? 1,
        visibilityMode: settings.visibilityMode,
        days: [] as Array<{ bookingDate: string; activeCount: number; isFull: boolean }>,
      };
    }

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_service_date", (q) => q.eq("serviceId", args.serviceId).gte("bookingDate", args.fromDate).lte("bookingDate", args.toDate))
      .collect();

    const dayMap = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === "Cancelled") {continue;}
      dayMap.set(booking.bookingDate, (dayMap.get(booking.bookingDate) ?? 0) + 1);
    }

    const capacityPerSlot = service.bookingCapacityPerSlot ?? 1;
    const days = Array.from(dayMap.entries())
      .map(([bookingDate, activeCount]) => {
        const weekday = getWeekday(bookingDate);
        const autoSlots = buildSlots(settings, service);
        const allowedSlots = resolveAllowedSlots({
          settings,
          service,
          weekday,
          autoSlots,
        });
        const totalCapacityForDay = allowedSlots.length * capacityPerSlot;
        const isFull = totalCapacityForDay > 0 && activeCount >= totalCapacityForDay;

        return { bookingDate, activeCount, isFull };
      })
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate));

    return {
      capacityPerSlot,
      visibilityMode: settings.visibilityMode,
      days,
    };
  },
  returns: v.object({
    capacityPerSlot: v.number(),
    visibilityMode: v.union(v.literal("show_full"), v.literal("show_anonymous"), v.literal("hide_calendar")),
    days: v.array(v.object({
      bookingDate: v.string(),
      activeCount: v.number(),
      isFull: v.boolean(),
    })),
  }),
});

export const createPublicBooking = mutation({
  args: {
    serviceId: v.id("services"),
    customerName: v.string(),
    bookingDate: v.string(),
    slotTime: v.string(),
    note: v.optional(v.string()),
    bookingFields: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const [settings, service] = await Promise.all([
      resolveSettings(ctx),
      ctx.db.get(args.serviceId),
    ]);
    if (!service || service.bookingEnabled !== true) {
      throw new Error("Dịch vụ không hỗ trợ đặt lịch");
    }

    const submittedFields = normalizeSubmittedBookingFields(args.bookingFields);
    const canonicalName = args.customerName.trim() || submittedFields.full_name?.trim() || "";
    if (!canonicalName) {
      throw new Error("Vui lòng nhập họ và tên");
    }

    const rateLimit = await consumeRateLimit(
      ctx,
      `${args.serviceId}:${args.bookingDate}:${canonicalName.toLowerCase()}`,
      "publicBooking"
    );
    if (!rateLimit.allowed) {
      throw new Error("Bạn gửi yêu cầu đặt lịch quá nhanh. Vui lòng thử lại sau.");
    }

    const activeCustomerFields = settings.customerFieldConfigs.filter((field) => field.enabled);
    for (const field of activeCustomerFields) {
      if (!field.required) {
        continue;
      }
      const value = (submittedFields[field.key] ?? "").trim();
      if (!value) {
        throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}`);
      }
    }

    submittedFields.full_name = canonicalName;

    const validation = validateBookingDate(settings, args.bookingDate);
    if (!validation.ok) {
      throw new Error(validation.message ?? "Ngày đặt lịch không hợp lệ");
    }

    const slotMinutes = resolveMinutes(args.slotTime);
    if (slotMinutes === null) {
      throw new Error("Khung giờ không hợp lệ");
    }
    const slotIntervalMin = service.bookingSlotIntervalMin ?? 30;
    const durationMin = service.bookingDurationMin ?? 60;
    if (!isSlotInOperatingWindow(settings, slotMinutes, durationMin, slotIntervalMin)) {
      throw new Error("Khung giờ ngoài thời gian hoạt động");
    }

    const autoSlots = buildSlots(settings, service);
    const weekday = getWeekday(args.bookingDate);
    const allowedSlots = resolveAllowedSlots({
      settings,
      service,
      weekday,
      autoSlots,
    });
    if (!allowedSlots.includes(args.slotTime)) {
      throw new Error("Khung giờ chưa được mở để đặt lịch");
    }

    const existing = await ctx.db
      .query("bookings")
      .withIndex("by_service_date_slot", (q) =>
        q.eq("serviceId", args.serviceId).eq("bookingDate", args.bookingDate).eq("slotTime", args.slotTime)
      )
      .collect();
    const activeCount = existing.filter((booking) => booking.status !== "Cancelled").length;
    const capacity = service.bookingCapacityPerSlot ?? 1;
    if (activeCount >= capacity) {
      throw new Error("Khung giờ đã đầy");
    }

    const note = submittedFields.note || args.note?.trim() || undefined;
    if (note) {
      submittedFields.note = note;
    }

    return ctx.db.insert("bookings", {
      serviceId: args.serviceId,
      customerName: canonicalName,
      bookingDate: args.bookingDate,
      slotTime: args.slotTime,
      timezone: settings.timezoneDefault,
      status: "Pending",
      note,
      bookingFields: submittedFields,
    });
  },
  returns: v.id("bookings"),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(bookingStatus),
    bookingDate: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    enabledServiceOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 200, 2000);
    let bookings: Doc<"bookings">[] = [];

    if (args.serviceId && args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_service_date", (q) =>
          q.eq("serviceId", args.serviceId!).eq("bookingDate", args.bookingDate!)
        )
        .order("desc")
        .take(fetchLimit);
    } else if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_status_date", (q) =>
          args.bookingDate
            ? q.eq("status", args.status!).eq("bookingDate", args.bookingDate!)
            : q.eq("status", args.status!)
        )
        .order("desc")
        .take(fetchLimit);
    } else if (args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date_slot", (q) => q.eq("bookingDate", args.bookingDate!))
        .order("desc")
        .take(fetchLimit);
    } else if (args.fromDate && args.toDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date_slot", (q) => q.gte("bookingDate", args.fromDate!).lte("bookingDate", args.toDate!))
        .take(fetchLimit);
    } else {
      bookings = await ctx.db.query("bookings").order("desc").take(fetchLimit);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      bookings = bookings.filter((booking) => booking.customerName.toLowerCase().includes(searchLower));
    }

    if (args.serviceId && !args.bookingDate) {
      bookings = bookings.filter((booking) => booking.serviceId === args.serviceId);
    }

    if (args.fromDate && args.toDate) {
      bookings = bookings.filter((booking) => booking.bookingDate >= args.fromDate! && booking.bookingDate <= args.toDate!);
    }

    if (args.enabledServiceOnly) {
      const serviceIds = Array.from(new Set(bookings.map((booking) => booking.serviceId)));
      const serviceEntries = await Promise.all(serviceIds.map(async (id) => ({ id, service: await ctx.db.get(id) })));
      const enabledServiceIdSet = new Set(
        serviceEntries
          .filter((entry) => entry.service?.bookingEnabled === true)
          .map((entry) => entry.id)
      );
      bookings = bookings.filter((booking) => enabledServiceIdSet.has(booking.serviceId));
    }

    return bookings.slice(offset, offset + limit);
  },
  returns: v.array(bookingDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(bookingStatus),
    bookingDate: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    enabledServiceOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let bookings: Doc<"bookings">[] = [];

    if (args.serviceId && args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_service_date", (q) =>
          q.eq("serviceId", args.serviceId!).eq("bookingDate", args.bookingDate!)
        )
        .take(limit + 1);
    } else if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_status_date", (q) =>
          args.bookingDate
            ? q.eq("status", args.status!).eq("bookingDate", args.bookingDate!)
            : q.eq("status", args.status!)
        )
        .take(limit + 1);
    } else if (args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date_slot", (q) => q.eq("bookingDate", args.bookingDate!))
        .take(limit + 1);
    } else {
      bookings = await ctx.db.query("bookings").take(limit + 1);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      bookings = bookings.filter((booking) => booking.customerName.toLowerCase().includes(searchLower));
    }

    if (args.enabledServiceOnly) {
      const serviceIds = Array.from(new Set(bookings.map((booking) => booking.serviceId)));
      const serviceEntries = await Promise.all(serviceIds.map(async (id) => ({ id, service: await ctx.db.get(id) })));
      const enabledServiceIdSet = new Set(
        serviceEntries
          .filter((entry) => entry.service?.bookingEnabled === true)
          .map((entry) => entry.id)
      );
      bookings = bookings.filter((booking) => enabledServiceIdSet.has(booking.serviceId));
    }

    return { count: Math.min(bookings.length, limit), hasMore: bookings.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(bookingStatus),
    bookingDate: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    enabledServiceOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let bookings: Doc<"bookings">[] = [];

    if (args.serviceId && args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_service_date", (q) =>
          q.eq("serviceId", args.serviceId!).eq("bookingDate", args.bookingDate!)
        )
        .take(limit + 1);
    } else if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_status_date", (q) =>
          args.bookingDate
            ? q.eq("status", args.status!).eq("bookingDate", args.bookingDate!)
            : q.eq("status", args.status!)
        )
        .take(limit + 1);
    } else if (args.bookingDate) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("by_date_slot", (q) => q.eq("bookingDate", args.bookingDate!))
        .take(limit + 1);
    } else {
      bookings = await ctx.db.query("bookings").take(limit + 1);
    }

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      bookings = bookings.filter((booking) => booking.customerName.toLowerCase().includes(searchLower));
    }

    if (args.enabledServiceOnly) {
      const serviceIds = Array.from(new Set(bookings.map((booking) => booking.serviceId)));
      const serviceEntries = await Promise.all(serviceIds.map(async (id) => ({ id, service: await ctx.db.get(id) })));
      const enabledServiceIdSet = new Set(
        serviceEntries
          .filter((entry) => entry.service?.bookingEnabled === true)
          .map((entry) => entry.id)
      );
      bookings = bookings.filter((booking) => enabledServiceIdSet.has(booking.serviceId));
    }

    const hasMore = bookings.length > limit;
    return { ids: bookings.slice(0, limit).map((booking) => booking._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("bookings")), hasMore: v.boolean() }),
});

export const getById = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(bookingDoc, v.null()),
});

export const updateStatus = mutation({
  args: { id: v.id("bookings"), status: bookingStatus },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
  returns: v.null(),
});

export const getBookingSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await resolveSettings(ctx);
    return settings;
  },
  returns: v.object({
    timezoneDefault: v.string(),
    maxAdvanceDays: v.number(),
    dayStartHour: v.number(),
    dayEndHour: v.number(),
    visibilityMode: v.union(v.literal("show_full"), v.literal("show_anonymous"), v.literal("hide_calendar")),
    openDays: v.record(v.string(), v.boolean()),
    customerFieldConfigs: v.array(v.object({
      key: v.union(v.literal("full_name"), v.literal("phone"), v.literal("note")),
      label: v.string(),
      required: v.boolean(),
      enabled: v.boolean(),
    })),
    slotTemplateDefault: v.optional(v.array(v.string())),
    slotTemplateByWeekday: v.record(v.string(), v.array(v.string())),
  }),
});

export const listBookableServices = query({
  args: {},
  handler: async (ctx) => {
    const services = await ctx.db
      .query("services")
      .withIndex("by_booking_enabled", (q) => q.eq("bookingEnabled", true))
      .collect();
    return services.map((service) => ({
      _id: service._id,
      title: service.title,
      bookingDurationMin: service.bookingDurationMin ?? 60,
      bookingSlotIntervalMin: service.bookingSlotIntervalMin ?? 30,
      bookingCapacityPerSlot: service.bookingCapacityPerSlot ?? 1,
    }));
  },
  returns: v.array(v.object({
    _id: v.id("services"),
    title: v.string(),
    bookingDurationMin: v.number(),
    bookingSlotIntervalMin: v.number(),
    bookingCapacityPerSlot: v.number(),
  })),
});
