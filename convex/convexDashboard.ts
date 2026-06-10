import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const config = await ctx.db.query("convexDashboard").first();
    return config ?? null;
  },
  returns: v.union(
    v.object({
      _creationTime: v.number(),
      _id: v.id("convexDashboard"),
      dashboardUrl: v.string(),
      email: v.optional(v.string()),
      notes: v.optional(v.string()),
      password: v.optional(v.string()),
    }),
    v.null()
  ),
});

export const upsert = mutation({
  args: {
    dashboardUrl: v.string(),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("convexDashboard").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return  ctx.db.insert("convexDashboard", args);
  },
  returns: v.id("convexDashboard"),
});

export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("convexDashboard").first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
  returns: v.null(),
});
