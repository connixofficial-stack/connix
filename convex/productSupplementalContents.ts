import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getGlobalTemplate = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query('productSupplementalContents').collect();
    if (templates.length === 0) {
      return null;
    }
    return templates[templates.length - 1];
  },
  returns: v.union(
    v.object({
      _id: v.id('productSupplementalContents'),
      _creationTime: v.number(),
      preContent: v.optional(v.string()),
      postContent: v.optional(v.string()),
      createdBy: v.optional(v.union(v.id('users'), v.null())),
      updatedBy: v.optional(v.union(v.id('users'), v.null())),
    }),
    v.null()
  ),
});

export const upsertGlobalTemplate = mutation({
  args: {
    preContent: v.optional(v.string()),
    postContent: v.optional(v.string()),
    updatedBy: v.optional(v.union(v.id('users'), v.null())),
  },
  handler: async (ctx, args) => {
    const templates = await ctx.db.query('productSupplementalContents').collect();
    if (templates.length > 0) {
      const first = templates[0];
      await ctx.db.patch(first._id, {
        preContent: args.preContent,
        postContent: args.postContent,
        updatedBy: args.updatedBy ?? null,
      });
      if (templates.length > 1) {
        for (let i = 1; i < templates.length; i++) {
          await ctx.db.delete(templates[i]._id);
        }
      }
      return first._id;
    } else {
      const id = await ctx.db.insert('productSupplementalContents', {
        preContent: args.preContent,
        postContent: args.postContent,
        createdBy: args.updatedBy ?? null,
        updatedBy: args.updatedBy ?? null,
      });
      return id;
    }
  },
  returns: v.id('productSupplementalContents'),
});

export const getEffectiveByProduct = query({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product || product.status !== 'Active') {
      return null;
    }

    const featureSetting = await ctx.db
      .query('moduleSettings')
      .withIndex('by_module_setting', (q) =>
        q.eq('moduleKey', 'products').eq('settingKey', 'enableProductSupplementalContent')
      )
      .unique();

    if (featureSetting?.value !== true) {
      return null;
    }

    const templates = await ctx.db.query('productSupplementalContents').collect();
    if (templates.length === 0) {
      return null;
    }

    return templates[templates.length - 1];
  },
  returns: v.union(
    v.object({
      _id: v.id('productSupplementalContents'),
      _creationTime: v.number(),
      preContent: v.optional(v.string()),
      postContent: v.optional(v.string()),
      createdBy: v.optional(v.union(v.id('users'), v.null())),
      updatedBy: v.optional(v.union(v.id('users'), v.null())),
    }),
    v.null()
  ),
});
