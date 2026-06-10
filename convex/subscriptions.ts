import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';

const calendarStatus = v.union(
  v.literal('Todo'),
  v.literal('Contacted'),
  v.literal('Renewed'),
  v.literal('Churned')
);

const calendarTaskDoc = v.object({
  _creationTime: v.number(),
  _id: v.id('calendarTasks'),
  allDay: v.boolean(),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  createdBy: v.id('users'),
  customerId: v.optional(v.id('customers')),
  dueDate: v.optional(v.number()),
  order: v.number(),
  productId: v.optional(v.id('products')),
  status: calendarStatus,
  timezone: v.string(),
  title: v.string(),
  updatedAt: v.number(),
});

function getEffectiveDueDate(task: Doc<'calendarTasks'>): number | null {
  return task.dueDate ?? null;
}
export const getSubscription = query({
  args: { id: v.id('calendarTasks') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
  returns: v.union(v.null(), calendarTaskDoc),
});

export const listSubscriptionsRange = query({
  args: {
    customerId: v.optional(v.id('customers')),
    from: v.number(),
    limit: v.optional(v.number()),
    status: v.optional(calendarStatus),
    to: v.number(),
    productId: v.optional(v.id('products')),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 500);

    const dueQuery = args.customerId
      ? ctx.db.query('calendarTasks').withIndex('by_customer_dueDate', q => q.eq('customerId', args.customerId).gte('dueDate', args.from).lt('dueDate', args.to))
      : args.productId
        ? ctx.db.query('calendarTasks').withIndex('by_product_dueDate', q => q.eq('productId', args.productId).gte('dueDate', args.from).lt('dueDate', args.to))
        : args.status
          ? ctx.db.query('calendarTasks').withIndex('by_status_dueDate', q => q.eq('status', args.status!).gte('dueDate', args.from).lt('dueDate', args.to))
          : ctx.db.query('calendarTasks').withIndex('by_dueDate', q => q.gte('dueDate', args.from).lt('dueDate', args.to));

    const dueTasks = await dueQuery.take(limit);

    const items = dueTasks.filter(task => {
      if (args.status && task.status !== args.status) {
        return false;
      }
      if (args.customerId && task.customerId !== args.customerId) {
        return false;
      }
      if (args.productId && task.productId !== args.productId) {
        return false;
      }
      return true;
    }).map(task => ({
      _id: task._id,
      allDay: task.allDay,
      customerId: task.customerId,
      dueDate: task.dueDate,
      productId: task.productId,
      sourceId: task._id,
      status: task.status,
      title: task.title,
    }));

    return items.slice(0, limit);
  },
  returns: v.array(v.object({
    _id: v.string(),
    allDay: v.boolean(),
    customerId: v.optional(v.id('customers')),
    dueDate: v.optional(v.number()),
    productId: v.optional(v.id('products')),
    sourceId: v.id('calendarTasks'),
    status: calendarStatus,
    title: v.string(),
  })),
});

export const listSubscriptionsPage = query({
  args: {
    customerId: v.optional(v.id('customers')),
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
    status: v.optional(calendarStatus),
    productId: v.optional(v.id('products')),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(args.pageSize ?? 20, 100);

    const baseQuery = args.customerId
      ? ctx.db.query('calendarTasks').withIndex('by_customer_dueDate', q => q.eq('customerId', args.customerId).gte('dueDate', 0))
      : args.productId
        ? ctx.db.query('calendarTasks').withIndex('by_product_dueDate', q => q.eq('productId', args.productId).gte('dueDate', 0))
        : args.status
          ? ctx.db.query('calendarTasks').withIndex('by_status_dueDate', q => q.eq('status', args.status!).gte('dueDate', 0))
          : ctx.db.query('calendarTasks').withIndex('by_dueDate', q => q.gte('dueDate', 0));

    const result = await baseQuery
      .order('asc')
      .paginate({ numItems: pageSize, cursor: args.cursor ?? null });

    const items = result.page.filter(task => {
      if (args.status && task.status !== args.status) {
        return false;
      }
      if (args.customerId && task.customerId !== args.customerId) {
        return false;
      }
      if (args.productId && task.productId !== args.productId) {
        return false;
      }
      return true;
    });

    return {
      continueCursor: result.continueCursor,
      isDone: result.isDone,
      items,
    };
  },
  returns: v.object({
    continueCursor: v.union(v.null(), v.string()),
    isDone: v.boolean(),
    items: v.array(calendarTaskDoc),
  }),
});

export const listUpcomingSubscriptions = query({
  args: {
    horizonHours: v.optional(v.number()),
    limit: v.optional(v.number()),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const horizon = args.now + (args.horizonHours ?? 24) * 60 * 60 * 1000;
    const statuses: Array<Doc<'calendarTasks'>['status']> = ['Todo', 'Contacted'];

    const overdue: Doc<'calendarTasks'>[] = [];
    const dueSoon: Doc<'calendarTasks'>[] = [];

    for (const status of statuses) {
      const overdueItems = await ctx.db
        .query('calendarTasks')
        .withIndex('by_status_dueDate', q => q.eq('status', status).lt('dueDate', args.now))
        .take(limit);
      overdue.push(...overdueItems);

      const dueSoonItems = await ctx.db
        .query('calendarTasks')
        .withIndex('by_status_dueDate', q => q.eq('status', status).gte('dueDate', args.now).lt('dueDate', horizon))
        .take(limit);
      dueSoon.push(...dueSoonItems);
    }

    const sortByDueDate = (a: Doc<'calendarTasks'>, b: Doc<'calendarTasks'>) => (getEffectiveDueDate(a) ?? 0) - (getEffectiveDueDate(b) ?? 0);
    return {
      dueSoon: dueSoon.sort(sortByDueDate).slice(0, limit),
      overdue: overdue.sort(sortByDueDate).slice(0, limit),
    };
  },
  returns: v.object({
    dueSoon: v.array(calendarTaskDoc),
    overdue: v.array(calendarTaskDoc),
  }),
});

export const createSubscription = mutation({
  args: {
    allDay: v.boolean(),
    createdBy: v.id('users'),
    customerId: v.optional(v.id('customers')),
    dueDate: v.optional(v.number()),
    productId: v.optional(v.id('products')),
    status: calendarStatus,
    timezone: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (!args.dueDate) {
      throw new Error('Cần chọn ngày bắt đầu hoặc hạn xử lý');
    }

    return ctx.db.insert('calendarTasks', {
      allDay: args.allDay,
      createdAt: now,
      createdBy: args.createdBy,
      customerId: args.customerId,
      dueDate: args.dueDate,
      order: now,
      productId: args.productId,
      status: args.status,
      timezone: args.timezone,
      title: args.title,
      updatedAt: now,
    });
  },
  returns: v.id('calendarTasks'),
});

export const updateSubscription = mutation({
  args: {
    allDay: v.optional(v.boolean()),
    customerId: v.optional(v.id('customers')),
    dueDate: v.optional(v.number()),
    id: v.id('calendarTasks'),
    productId: v.optional(v.id('products')),
    status: v.optional(calendarStatus),
    timezone: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task không tồn tại');
    }
    const nextStatus = args.status ?? task.status;

    await ctx.db.patch(args.id, {
      allDay: args.allDay ?? task.allDay,
      customerId: args.customerId ?? task.customerId,
      dueDate: args.dueDate ?? task.dueDate,
      productId: args.productId ?? task.productId,
      status: nextStatus,
      timezone: args.timezone ?? task.timezone,
      title: args.title ?? task.title,
      updatedAt: Date.now(),
    });

    return null;
  },
  returns: v.null(),
});

const BULK_DELETE_LIMIT = 500;

async function bulkDeleteTasks(
  ctx: { db: { delete: (id: Doc<'calendarTasks'>['_id']) => Promise<void> } },
  tasks: Doc<'calendarTasks'>[]
) {
  for (const task of tasks) {
    await ctx.db.delete(task._id);
  }
}

export const deleteAllSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedCount = 0;
    while (true) {
      const tasks = await ctx.db
        .query('calendarTasks')
        .withIndex('by_dueDate', q => q.gte('dueDate', 0))
        .take(BULK_DELETE_LIMIT);
      if (tasks.length === 0) {
        break;
      }
      await bulkDeleteTasks(ctx, tasks);
      deletedCount += tasks.length;
      if (tasks.length < BULK_DELETE_LIMIT) {
        break;
      }
    }
    return { deletedCount };
  },
  returns: v.object({ deletedCount: v.number() }),
});

export const deleteOverdueSubscriptions = mutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    let deletedCount = 0;
    while (true) {
      const tasks = await ctx.db
        .query('calendarTasks')
        .withIndex('by_dueDate', q => q.lt('dueDate', args.now))
        .take(BULK_DELETE_LIMIT);
      if (tasks.length === 0) {
        break;
      }
      await bulkDeleteTasks(ctx, tasks);
      deletedCount += tasks.length;
      if (tasks.length < BULK_DELETE_LIMIT) {
        break;
      }
    }
    return { deletedCount };
  },
  returns: v.object({ deletedCount: v.number() }),
});

export const deleteSubscription = mutation({
  args: { id: v.id('calendarTasks') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
  returns: v.null(),
});

export const renewSubscription = mutation({
  args: {
    createdBy: v.id('users'),
    id: v.id('calendarTasks'),
    newDueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task không tồn tại');
    }

    const now = Date.now();
    await ctx.db.insert('calendarTasks', {
      allDay: task.allDay,
      createdAt: now,
      createdBy: args.createdBy,
      customerId: task.customerId,
      dueDate: args.newDueDate,
      order: now,
      productId: task.productId,
      status: 'Todo',
      timezone: task.timezone,
      title: task.title,
      updatedAt: now,
    });

    await ctx.db.patch(args.id, { status: 'Renewed', completedAt: now, updatedAt: now });
    return null;
  },
  returns: v.null(),
});

export const markSubscriptionContacted = mutation({
  args: { id: v.id('calendarTasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task không tồn tại');
    }
    await ctx.db.patch(args.id, { status: 'Contacted', updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});

export const markSubscriptionChurned = mutation({
  args: { id: v.id('calendarTasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error('Task không tồn tại');
    }
    await ctx.db.patch(args.id, { status: 'Churned', updatedAt: Date.now() });
    return null;
  },
  returns: v.null(),
});
