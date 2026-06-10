import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Doc } from "../_generated/dataModel";
import {
  DEFAULT_VARIANT_PRESET_KEY,
  VARIANT_PRESETS,
  type VariantPreset,
  type VariantPresetOption,
  type VariantPresetValue,
} from "../../lib/modules/variant-presets";

type OptionDoc = Doc<"productOptions">;
type OptionValueDoc = Doc<"productOptionValues">;

export type VariantPresetSeedResult = {
  optionIds: Array<Doc<"productOptions">["_id"]>;
  optionValues: Record<string, OptionValueDoc[]>;
  preset: VariantPreset;
};

type VariantPresetSeedOptions = {
  strictVariantPresetScope?: boolean;
};

export async function seedVariantPresetOptions(
  ctx: GenericMutationCtx<DataModel>,
  presetKey?: string,
  options: VariantPresetSeedOptions = {}
): Promise<VariantPresetSeedResult> {
  const preset = VARIANT_PRESETS[presetKey ?? ""] ?? VARIANT_PRESETS[DEFAULT_VARIANT_PRESET_KEY];
  const optionIds: Array<Doc<"productOptions">["_id"]> = [];
  const optionValues: Record<string, OptionValueDoc[]> = {};

  if (options.strictVariantPresetScope) {
    await enforceStrictPresetScope(ctx, preset);
  }

  for (const option of preset.options) {
    const optionDoc = await ensureOption(ctx, option);
    optionIds.push(optionDoc._id);
    optionValues[optionDoc._id] = await ensureOptionValues(ctx, optionDoc, option.values);
  }

  return { optionIds, optionValues, preset };
}

async function enforceStrictPresetScope(
  ctx: GenericMutationCtx<DataModel>,
  preset: VariantPreset
) {
  const presetOptionMap = new Map(preset.options.map((option) => [option.slug, option]));
  const existingOptions = await ctx.db.query("productOptions").collect();

  for (const option of existingOptions) {
    const presetOption = presetOptionMap.get(option.slug);
    if (!presetOption) {
      const values = await ctx.db
        .query("productOptionValues")
        .withIndex("by_option", (q) => q.eq("optionId", option._id))
        .collect();
      await Promise.all(values.map((value) => ctx.db.delete(value._id)));
      await ctx.db.delete(option._id);
      continue;
    }

    const allowedValues = new Set(presetOption.values.map((value) => value.value.toLowerCase()));
    const values = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option", (q) => q.eq("optionId", option._id))
      .collect();
    const toDelete = values.filter((value) => !allowedValues.has(value.value.toLowerCase()));
    await Promise.all(toDelete.map((value) => ctx.db.delete(value._id)));
  }

}

async function ensureOption(
  ctx: GenericMutationCtx<DataModel>,
  option: VariantPresetOption
): Promise<OptionDoc> {
  const existing = await ctx.db
    .query("productOptions")
    .withIndex("by_slug", (q) => q.eq("slug", option.slug))
    .unique();
  if (existing) {
    return existing;
  }

  const lastOption = await ctx.db.query("productOptions").order("desc").first();
  const nextOrder = lastOption ? lastOption.order + 1 : 0;

  const payload: Omit<DataModel["productOptions"]["document"], "_id" | "_creationTime"> = {
    active: true,
    displayType: option.displayType,
    inputType: option.inputType,
    isPreset: true,
    name: option.name,
    order: nextOrder,
    slug: option.slug,
    unit: option.unit,
  };

  const id = await ctx.db.insert("productOptions", payload);
  const created = await ctx.db.get(id);
  if (!created) {
    throw new Error(`Không thể tạo option ${option.slug}`);
  }
  return created;
}

async function ensureOptionValues(
  ctx: GenericMutationCtx<DataModel>,
  option: OptionDoc,
  values: VariantPresetValue[]
): Promise<OptionValueDoc[]> {
  const existing = await ctx.db
    .query("productOptionValues")
    .withIndex("by_option", (q) => q.eq("optionId", option._id))
    .collect();
  const existingMap = new Map(existing.map((value) => [value.value.toLowerCase(), value]));
  const result: OptionValueDoc[] = [...existing];

  let nextOrder = 0;
  if (existing.length > 0) {
    const lastValue = await ctx.db
      .query("productOptionValues")
      .withIndex("by_option_order", (q) => q.eq("optionId", option._id))
      .order("desc")
      .first();
    nextOrder = lastValue ? lastValue.order + 1 : existing.length;
  }

  for (const value of values) {
    const key = value.value.toLowerCase();
    if (existingMap.has(key)) {
      continue;
    }

    const id = await ctx.db.insert("productOptionValues", {
      active: true,
      badge: undefined,
      colorCode: value.colorCode,
      image: undefined,
      isLifetime: undefined,
      label: value.label,
      numericValue: value.numericValue,
      optionId: option._id,
      order: nextOrder,
      value: value.value,
    });
    const created = await ctx.db.get(id);
    if (created) {
      result.push(created);
      existingMap.set(key, created);
      nextOrder += 1;
    }
  }

  return result.sort((a, b) => a.order - b.order);
}
