import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/** Đảm bảo danh mục "Khác" luôn tồn tại */
const ensureDefaultCategory = async (ctx: any) => {
  const existing = await ctx.db
    .query('snapshotCategories')
    .withIndex('by_name', (q: any) => q.eq('name', 'Khác'))
    .unique();
  if (!existing) {
    await ctx.db.insert('snapshotCategories', {
      color: '#6b7280',
      isSystem: true,
      name: 'Khác',
      order: 9999,
    });
  }
};

export const listSnapshotCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('snapshotCategories')
      .withIndex('by_order')
      .collect();
  },
  returns: v.array(
    v.object({
      _id: v.id('snapshotCategories'),
      _creationTime: v.number(),
      color: v.optional(v.string()),
      isSystem: v.boolean(),
      name: v.string(),
      order: v.number(),
    }),
  ),
});

export const ensureDefaultSnapshotCategory = mutation({
  args: {},
  handler: async (ctx) => {
    await ensureDefaultCategory(ctx);
    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

export const createSnapshotCategory = mutation({
  args: {
    color: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error('Tên danh mục không được rỗng');
    // Check trùng tên
    const existing = await ctx.db
      .query('snapshotCategories')
      .withIndex('by_name', (q) => q.eq('name', name))
      .unique();
    if (existing) throw new Error(`Danh mục "${name}" đã tồn tại`);
    // Tính order = max hiện tại + 1
    const all = await ctx.db.query('snapshotCategories').withIndex('by_order').collect();
    const maxOrder = all.reduce((m, r) => (r.isSystem ? m : Math.max(m, r.order)), 0);
    return await ctx.db.insert('snapshotCategories', {
      color: args.color || '#6b7280',
      isSystem: false,
      name,
      order: maxOrder + 1,
    });
  },
  returns: v.id('snapshotCategories'),
});

export const updateSnapshotCategoryMeta = mutation({
  args: {
    categoryId: v.id('snapshotCategories'),
    color: v.optional(v.string()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.categoryId);
    if (!cat) throw new Error('Không tìm thấy danh mục');
    if (cat.isSystem) throw new Error('Không thể sửa danh mục hệ thống');
    const name = args.name.trim();
    if (!name) throw new Error('Tên không được rỗng');
    await ctx.db.patch(args.categoryId, { name, color: args.color || cat.color });
    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});

export const deleteSnapshotCategory = mutation({
  args: { categoryId: v.id('snapshotCategories') },
  handler: async (ctx, args) => {
    const cat = await ctx.db.get(args.categoryId);
    if (!cat) throw new Error('Không tìm thấy danh mục');
    if (cat.isSystem) throw new Error('Không thể xóa danh mục hệ thống');
    await ctx.db.delete(args.categoryId);
    return { ok: true };
  },
  returns: v.object({ ok: v.boolean() }),
});
