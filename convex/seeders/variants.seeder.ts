import { faker } from "@faker-js/faker";
import type { GenericMutationCtx } from "convex/server";
import type { DataModel, Doc } from "../_generated/dataModel";
import { seedVariantPresetOptions } from "./variantPresets.seeder";

type ProductDoc = Doc<"products">;
type VariantDoc = Doc<"productVariants">;

type SeedVariantOptions = {
  maxVariants?: number;
  minVariants?: number;
  presetKey?: string;
  strictVariantPresetScope?: boolean;
};

type OptionValueSelection = {
  optionId: Doc<"productOptions">["_id"];
  valueId: Doc<"productOptionValues">["_id"];
};

export async function seedProductVariants(
  ctx: GenericMutationCtx<DataModel>,
  options: SeedVariantOptions = {}
): Promise<number> {
  const minVariants = options.minVariants ?? 2;
  const maxVariants = options.maxVariants ?? 6;

  const products = await ctx.db.query("products").collect();
  if (products.length === 0) {
    return 0;
  }

  const existingVariants = await ctx.db.query("productVariants").collect();
  const variantsByProduct = new Map<string, VariantDoc[]>();
  for (const variant of existingVariants) {
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  const presetSeed = await seedVariantPresetOptions(ctx, options.presetKey, {
    strictVariantPresetScope: options.strictVariantPresetScope,
  });
  const optionValueLists = presetSeed.optionIds
    .map((optionId) => ({ optionId, values: presetSeed.optionValues[optionId] ?? [] }))
    .filter((entry) => entry.values.length > 0);

  if (optionValueLists.length === 0) {
    return 0;
  }

  const combinations = buildCombinations(optionValueLists);
  if (combinations.length === 0) {
    return 0;
  }

  let created = 0;

  for (const product of products) {
    if ((variantsByProduct.get(product._id) ?? []).length > 0) {
      continue;
    }

    const availableCount = Math.min(maxVariants, combinations.length);
    const variantCount = Math.min(
      availableCount,
      faker.number.int({ max: availableCount, min: Math.min(minVariants, availableCount) })
    );

    const selectedCombos = faker.helpers.arrayElements(combinations, variantCount);
    let order = 0;

    for (const combo of selectedCombos) {
      await ctx.db.insert("productVariants", buildVariant(product, combo, order));
      order += 1;
      created += 1;
    }

    await ctx.db.patch(product._id, {
      hasVariants: true,
      optionIds: presetSeed.optionIds,
    });
  }

  return created;
}

function buildCombinations(
  options: Array<{ optionId: Doc<"productOptions">["_id"]; values: Doc<"productOptionValues">[] }>
): OptionValueSelection[][] {
  return options.reduce<OptionValueSelection[][]>((acc, option) => {
    const entries = option.values.map((value) => ({ optionId: option.optionId, valueId: value._id }));
    if (acc.length === 0) {
      return entries.map((entry) => [entry]);
    }
    return acc.flatMap((combo) => entries.map((entry) => [...combo, entry]));
  }, []);
}

function buildVariant(product: ProductDoc, combo: OptionValueSelection[], order: number) {
  const basePrice = product.price ?? 0;
  const priceDelta = faker.number.int({ max: Math.round(basePrice * 0.08), min: 0 });
  const price = basePrice + priceDelta;

  return {
    allowBackorder: false,
    barcode: undefined,
    image: product.image,
    images: product.image ? [product.image] : undefined,
    optionValues: combo.map((item) => ({
      optionId: item.optionId,
      valueId: item.valueId,
    })),
    order,
    price: price > 0 ? price : undefined,
    productId: product._id,
    salePrice: product.salePrice ? product.salePrice + priceDelta : undefined,
    sku: `${product.sku}-${order + 1}`,
    status: "Active" as const,
    stock: faker.number.int({ max: 200, min: 0 }),
  };
}
