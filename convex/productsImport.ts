import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const bulkVariantDoc = v.object({
  sku: v.optional(v.string()),
  variantOption1: v.optional(v.string()),
  variantOption1Name: v.optional(v.string()),
  variantOption2: v.optional(v.string()),
  variantOption2Name: v.optional(v.string()),
  price: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  stock: v.optional(v.number()),
  imageUrl: v.optional(v.string()),
});

const bulkProductDoc = v.object({
  id: v.optional(v.string()),
  sku: v.string(),
  name: v.optional(v.string()),
  categoryId: v.optional(v.string()),
  categoryName: v.optional(v.string()),
  productType: v.optional(v.union(v.literal("physical"), v.literal("digital"))),
  price: v.optional(v.number()),
  salePrice: v.optional(v.number()),
  stock: v.optional(v.number()),
  digitalDeliveryType: v.optional(v.string()),
  digitalData: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  images: v.optional(v.array(v.string())),
  variants: v.array(bulkVariantDoc),
});

export const upsertBulk = mutation({
  args: { 
    products: v.array(bulkProductDoc),
    optionNames: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const opt1Name = args.optionNames?.[0] || "Phân loại 1";
    const opt2Name = args.optionNames?.[1] || "Phân loại 2";

    // TỐI ƯU BANDWIDTH 1: Batch load existing products (Tránh N+1)
    const skus = args.products.map(p => p.sku);
    const existingProductsList = await Promise.all(
      skus.map(sku => ctx.db.query("products").withIndex("by_sku", q => q.eq("sku", sku)).unique())
    );
    const existingProductsMap = new Map(existingProductsList.filter(Boolean).map(p => [p!.sku, p]));

    // TỐI ƯU BANDWIDTH 2: Load danh mục 1 lần
    const categories = await ctx.db.query("productCategories").collect();
    const categoryMap = new Map(categories.map(c => [c._id.toString(), c._id]));
    const categoryByNameMap = new Map(categories.map(c => [c.name.toLowerCase().trim(), c._id]));

    let defaultCategoryId: Id<"productCategories"> | undefined = undefined;
    if (categories.length > 0) {
      defaultCategoryId = categories[0]._id;
    } else {
      const defaultId = await ctx.db.insert("productCategories", {
        name: "Chưa phân loại",
        slug: "chua-phan-loai",
        active: true,
        order: 0,
      });
      defaultCategoryId = defaultId;
      categoryMap.set(defaultId.toString(), defaultId);
      categoryByNameMap.set("chưa phân loại", defaultId);
    }

    // TỐI ƯU BANDWIDTH 3: Load toàn bộ Options & Values (số lượng thường rất ít < 1000, 
    // fetch 1 lần rẻ hơn nhiều so với query từng dòng)
    const allOptions = await ctx.db.query("productOptions").collect();
    const allValues = await ctx.db.query("productOptionValues").collect();
    
    // Map options by slug/name
    const optionMap = new Map(allOptions.map(o => [o.name.toLowerCase(), o]));
    const valueMap = new Map(); // Key: `${optionId}_${value}` -> Value: valueDoc
    for (const val of allValues) {
      valueMap.set(`${val.optionId}_${val.value.toLowerCase()}`, val);
    }

    // Helper: Lấy hoặc tạo Option + Value trong memory (không N+1 query)
    const getOrCreateOptionValue = async (optionName: string, valueStr: string) => {
      if (!valueStr) return null;
      let option = optionMap.get(optionName.toLowerCase());
      if (!option) {
        const optionId = await ctx.db.insert("productOptions", {
          name: optionName,
          slug: optionName.toLowerCase().replace(/\s+/g, '-'),
          active: true,
          displayType: "dropdown",
          isPreset: false,
          order: optionMap.size,
        });
        option = (await ctx.db.get(optionId)) ?? undefined;
        if (option) optionMap.set(optionName.toLowerCase(), option);
      }

      if (!option) return null;

      const valKey = `${option._id}_${valueStr.toLowerCase()}`;
      let valDoc = valueMap.get(valKey);
      if (!valDoc) {
        const valId = await ctx.db.insert("productOptionValues", {
          active: true,
          optionId: option._id,
          value: valueStr,
          order: 0,
        });
        valDoc = (await ctx.db.get(valId)) ?? undefined;
        if (valDoc) valueMap.set(valKey, valDoc);
      }
      return valDoc;
    };

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { sku: string; message: string }[] = [];

    // Lấy order kế tiếp
    const totalStats = await ctx.db.query("productStats").withIndex("by_key", q => q.eq("key", "total")).unique();
    let nextOrder = totalStats?.lastOrder ?? 0;
    let totalProductsCreated = 0;

    for (const p of args.products) {
      const existing = existingProductsMap.get(p.sku);
      let categoryId = p.categoryId ? categoryMap.get(p.categoryId) : undefined;
      
      // Nếu không khớp categoryId nhưng có categoryName từ Excel, thử map theo tên hoặc tự tạo mới
      if (!categoryId && p.categoryName?.trim()) {
        const cleanName = p.categoryName.trim();
        const cleanKey = cleanName.toLowerCase();
        const matchedId = categoryByNameMap.get(cleanKey);
        
        if (matchedId) {
          categoryId = matchedId;
        } else {
          // Tạo danh mục mới tự động
          const rawSlug = cleanKey
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
          const newCatId = await ctx.db.insert("productCategories", {
            name: cleanName,
            slug: rawSlug || `danh-muc-${Date.now()}`,
            active: true,
            order: 0,
          });
          categoryId = newCatId;
          categoryMap.set(newCatId.toString(), newCatId);
          categoryByNameMap.set(cleanKey, newCatId);
        }
      }
      
      if (!categoryId) {
        categoryId = defaultCategoryId;
      }
      
      if (!existing && !categoryId) {
        errors.push({ sku: p.sku, message: "Thiếu danh mục khi tạo mới." });
        continue;
      }

      // 1. Resolve Variants Options
      const resolvedVariants: any[] = [];
      const optionIdsToLink: Id<"productOptions">[] = [];

      if (p.variants && p.variants.length > 0) {
        for (let i = 0; i < p.variants.length; i++) {
          const vData = p.variants[i];
          const optionValuesData = [];
          
          if (vData.variantOption1) {
            const optName = vData.variantOption1Name || opt1Name;
            const vDoc = await getOrCreateOptionValue(optName, vData.variantOption1);
            if (vDoc) {
              optionValuesData.push({ optionId: vDoc.optionId, valueId: vDoc._id });
              if (!optionIdsToLink.includes(vDoc.optionId)) optionIdsToLink.push(vDoc.optionId);
            }
          }
          if (vData.variantOption2) {
            const optName = vData.variantOption2Name || opt2Name;
            const vDoc = await getOrCreateOptionValue(optName, vData.variantOption2);
            if (vDoc) {
              optionValuesData.push({ optionId: vDoc.optionId, valueId: vDoc._id });
              if (!optionIdsToLink.includes(vDoc.optionId)) optionIdsToLink.push(vDoc.optionId);
            }
          }
          resolvedVariants.push({
            vData,
            optionValuesData
          });
        }
      }

      // Chuẩn bị payload cho SP
      let targetProductId: Id<"products">;
      const hasVariants = resolvedVariants.length > 0;

      if (existing) {
        // UPDATE PRODUCT
        targetProductId = existing._id;
        await ctx.db.patch(targetProductId, {
          name: p.name ?? existing.name,
          price: p.price ?? existing.price,
          salePrice: p.salePrice,
          stock: p.stock ?? existing.stock,
          categoryId: categoryId ?? existing.categoryId,
          image: p.imageUrl ?? existing.image,
          images: p.images ?? existing.images,
          hasVariants: hasVariants ? true : existing.hasVariants,
          optionIds: optionIdsToLink.length > 0 ? optionIdsToLink : existing.optionIds,
        });
        updatedCount++;
      } else {
        // CREATE PRODUCT
        nextOrder++;
        targetProductId = await ctx.db.insert("products", {
          sku: p.sku,
          name: p.name || p.sku,
          slug: p.sku.toLowerCase(),
          categoryId: categoryId!,
          price: p.price ?? 0,
          salePrice: p.salePrice,
          stock: p.stock ?? 0,
          status: "Draft",
          sales: 0,
          order: nextOrder,
          image: p.imageUrl,
          images: p.images,
          hasVariants: hasVariants,
          optionIds: optionIdsToLink.length > 0 ? optionIdsToLink : undefined,
          productType: p.productType,
          digitalDeliveryType: p.digitalDeliveryType as any,
          // Nếu có digitalData, bạn có thể lưu vào digitalCredentialsTemplate.customContent
          digitalCredentialsTemplate: p.digitalData ? { customContent: p.digitalData } : undefined,
        });
        createdCount++;
        totalProductsCreated++;
      }

      // Xử lý ghi đè/cập nhật Variants sử dụng đối khớp SKU
      if (hasVariants) {
        const existingVariants = await ctx.db
          .query("productVariants")
          .withIndex("by_product", q => q.eq("productId", targetProductId))
          .collect();
        
        const existingVariantsMap = new Map(existingVariants.map(ev => [ev.sku, ev]));
        const newVariantSkus = new Set<string>();
        
        for (let i = 0; i < resolvedVariants.length; i++) {
          const rv = resolvedVariants[i];
          const variantSku = rv.vData.sku || `${p.sku}-${i + 1}`;
          newVariantSkus.add(variantSku);

          const existingVariant = existingVariantsMap.get(variantSku);
          if (existingVariant) {
            // Cập nhật biến thể cũ
            await ctx.db.patch(existingVariant._id, {
              optionValues: rv.optionValuesData,
              price: rv.vData.price ?? existingVariant.price,
              salePrice: rv.vData.salePrice,
              stock: rv.vData.stock ?? 0,
              image: rv.vData.imageUrl ?? existingVariant.image,
            });
          } else {
            // Chèn biến thể mới
            await ctx.db.insert("productVariants", {
              productId: targetProductId,
              sku: variantSku,
              optionValues: rv.optionValuesData,
              price: rv.vData.price,
              salePrice: rv.vData.salePrice,
              stock: rv.vData.stock ?? 0,
              status: "Active",
              order: i,
              image: rv.vData.imageUrl,
            });
          }
        }

        // Cập nhật tồn kho về 0 cho các biến thể cũ không xuất hiện trong file Excel Sapo
        for (const ev of existingVariants) {
          if (!newVariantSkus.has(ev.sku)) {
            await ctx.db.patch(ev._id, { stock: 0 });
          }
        }
      }
    }

    // Update Stats 1 lần cuối (Tránh N+1 ghi đè)
    if (totalProductsCreated > 0) {
      if (totalStats) {
         await ctx.db.patch(totalStats._id, { 
           count: totalStats.count + totalProductsCreated,
           lastOrder: nextOrder 
         });
      }
      const draftStats = await ctx.db.query("productStats").withIndex("by_key", q => q.eq("key", "Draft")).unique();
      if (draftStats) {
         await ctx.db.patch(draftStats._id, { count: draftStats.count + totalProductsCreated });
      }
    }
    
    return { success: true, createdCount, updatedCount, errors };
  }
});
