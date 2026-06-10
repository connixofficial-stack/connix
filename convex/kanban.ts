import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { kanbanPriority } from "./lib/validators";

const boardDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("kanbanBoards"),
  createdBy: v.id("users"),
  description: v.optional(v.string()),
  name: v.string(),
  order: v.number(),
});

const columnDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("kanbanColumns"),
  boardId: v.id("kanbanBoards"),
  color: v.optional(v.string()),
  icon: v.string(),
  order: v.number(),
  title: v.string(),
  wipLimit: v.optional(v.number()),
});

const taskDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("kanbanTasks"),
  assigneeId: v.optional(v.id("users")),
  boardId: v.id("kanbanBoards"),
  columnId: v.id("kanbanColumns"),
  createdBy: v.id("users"),
  description: v.optional(v.string()),
  dueDate: v.optional(v.number()),
  order: v.number(),
  priority: kanbanPriority,
  title: v.string(),
});

export const listBoards = query({
  args: {},
  handler: async (ctx) => {
    const boards = await ctx.db.query("kanbanBoards").collect();
    return boards.sort((a, b) => a.order - b.order);
  },
  returns: v.array(boardDoc),
});

export const getBoard = query({
  args: { boardId: v.id("kanbanBoards"), taskLimit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board) {
      return null;
    }

    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_board_order", (q) => q.eq("boardId", args.boardId))
      .collect();

    const limit = Math.min(args.taskLimit ?? 500, 1000);
    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .take(limit);

    return { board, columns, tasks };
  },
  returns: v.union(
    v.null(),
    v.object({
      board: boardDoc,
      columns: v.array(columnDoc),
      tasks: v.array(taskDoc),
    })
  ),
});

export const listTasksByColumn = query({
  args: { columnId: v.id("kanbanColumns"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 1000);
    return ctx.db
      .query("kanbanTasks")
      .withIndex("by_column_order", (q) => q.eq("columnId", args.columnId))
      .take(limit);
  },
  returns: v.array(taskDoc),
});

export const createBoard = mutation({
  args: {
    createdBy: v.id("users"),
    description: v.optional(v.string()),
    includeReview: v.optional(v.boolean()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const count = (await ctx.db.query("kanbanBoards").collect()).length;
    const boardId = await ctx.db.insert("kanbanBoards", {
      createdBy: args.createdBy,
      description: args.description,
      name: args.name,
      order: count,
    });

    const columns = [
      { title: "Chưa làm", icon: "CircleDashed", color: "slate" },
      { title: "Đang làm", icon: "Loader2", color: "blue" },
      ...(args.includeReview ? [{ title: "Review", icon: "Eye", color: "amber" }] : []),
      { title: "Xong", icon: "CheckCircle2", color: "emerald" },
    ];

    await Promise.all(
      columns.map((column, index) =>
        ctx.db.insert("kanbanColumns", {
          boardId,
          color: column.color,
          icon: column.icon,
          order: index,
          title: column.title,
        })
      )
    );

    return boardId;
  },
  returns: v.id("kanbanBoards"),
});

export const updateBoard = mutation({
  args: {
    description: v.optional(v.string()),
    id: v.id("kanbanBoards"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const board = await ctx.db.get(id);
    if (!board) {
      throw new Error("Board không tồn tại");
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const deleteBoard = mutation({
  args: { id: v.id("kanbanBoards") },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_board_order", (q) => q.eq("boardId", args.id))
      .collect();
    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();

    await Promise.all(tasks.map((task) => ctx.db.delete(task._id)));
    await Promise.all(columns.map((column) => ctx.db.delete(column._id)));
    await ctx.db.delete(args.id);

    const boards = await ctx.db.query("kanbanBoards").collect();
    boards.sort((a, b) => a.order - b.order);
    await Promise.all(
      boards.map((board, index) =>
        ctx.db.patch(board._id, { order: index })
      )
    );

    return null;
  },
  returns: v.null(),
});

export const createColumn = mutation({
  args: {
    boardId: v.id("kanbanBoards"),
    color: v.optional(v.string()),
    icon: v.string(),
    title: v.string(),
    wipLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_board_order", (q) => q.eq("boardId", args.boardId))
      .collect();

    return ctx.db.insert("kanbanColumns", {
      boardId: args.boardId,
      color: args.color,
      icon: args.icon,
      order: columns.length,
      title: args.title,
      wipLimit: args.wipLimit,
    });
  },
  returns: v.id("kanbanColumns"),
});

export const updateColumn = mutation({
  args: {
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    id: v.id("kanbanColumns"),
    title: v.optional(v.string()),
    wipLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const column = await ctx.db.get(id);
    if (!column) {
      throw new Error("Cột không tồn tại");
    }
    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const deleteColumn = mutation({
  args: { id: v.id("kanbanColumns"), targetColumnId: v.optional(v.id("kanbanColumns")) },
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.id);
    if (!column) {
      throw new Error("Cột không tồn tại");
    }

    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_column_order", (q) => q.eq("columnId", args.id))
      .collect();

    if (tasks.length > 0) {
      if (!args.targetColumnId) {
        throw new Error("Cần chọn cột để chuyển task");
      }
      const targetColumnId = args.targetColumnId;
      const targetColumn = await ctx.db.get(targetColumnId);
      if (!targetColumn || targetColumn.boardId !== column.boardId) {
        throw new Error("Cột đích không hợp lệ");
      }
      const targetTasks = await ctx.db
        .query("kanbanTasks")
        .withIndex("by_column_order", (q) => q.eq("columnId", targetColumnId))
        .collect();

      await Promise.all(
        tasks.map((task, index) =>
          ctx.db.patch(task._id, {
            columnId: targetColumnId,
            order: targetTasks.length + index,
          })
        )
      );
    }

    await ctx.db.delete(args.id);

    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_board_order", (q) => q.eq("boardId", column.boardId))
      .collect();
    await Promise.all(
      columns.map((col, index) => ctx.db.patch(col._id, { order: index }))
    );

    return null;
  },
  returns: v.null(),
});

export const reorderColumns = mutation({
  args: { boardId: v.id("kanbanBoards"), orderedIds: v.array(v.id("kanbanColumns")) },
  handler: async (ctx, args) => {
    const columns = await ctx.db
      .query("kanbanColumns")
      .withIndex("by_board_order", (q) => q.eq("boardId", args.boardId))
      .collect();

    const columnIds = new Set(columns.map((column) => column._id));
    const orderedIds = args.orderedIds.filter((id) => columnIds.has(id));

    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { order: index }))
    );

    return null;
  },
  returns: v.null(),
});

export const createTask = mutation({
  args: {
    assigneeId: v.optional(v.id("users")),
    boardId: v.id("kanbanBoards"),
    columnId: v.id("kanbanColumns"),
    createdBy: v.id("users"),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    priority: kanbanPriority,
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_column_order", (q) => q.eq("columnId", args.columnId))
      .collect();

    return ctx.db.insert("kanbanTasks", {
      assigneeId: args.assigneeId,
      boardId: args.boardId,
      columnId: args.columnId,
      createdBy: args.createdBy,
      description: args.description,
      dueDate: args.dueDate,
      order: tasks.length,
      priority: args.priority,
      title: args.title,
    });
  },
  returns: v.id("kanbanTasks"),
});

export const updateTask = mutation({
  args: {
    assigneeId: v.optional(v.id("users")),
    columnId: v.optional(v.id("kanbanColumns")),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    id: v.id("kanbanTasks"),
    priority: v.optional(kanbanPriority),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const updates: Partial<Doc<"kanbanTasks">> = { ...rest };
    const task = await ctx.db.get(id);
    if (!task) {
      throw new Error("Task không tồn tại");
    }

    if (args.columnId && args.columnId !== task.columnId) {
      const nextColumnId = args.columnId;
      const tasks = await ctx.db
        .query("kanbanTasks")
        .withIndex("by_column_order", (q) => q.eq("columnId", nextColumnId))
        .collect();
      updates.columnId = nextColumnId;
      updates.order = tasks.length;
    }

    await ctx.db.patch(id, updates);
    return null;
  },
  returns: v.null(),
});

export const deleteTask = mutation({
  args: { id: v.id("kanbanTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task không tồn tại");
    }
    await ctx.db.delete(args.id);

    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_column_order", (q) => q.eq("columnId", task.columnId))
      .collect();
    await Promise.all(
      tasks.map((item, index) => ctx.db.patch(item._id, { order: index }))
    );
    return null;
  },
  returns: v.null(),
});

export const reorderTasks = mutation({
  args: { columnId: v.id("kanbanColumns"), orderedIds: v.array(v.id("kanbanTasks")) },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("kanbanTasks")
      .withIndex("by_column_order", (q) => q.eq("columnId", args.columnId))
      .collect();

    const taskIds = new Set(tasks.map((task) => task._id));
    const orderedIds = args.orderedIds.filter((id) => taskIds.has(id));

    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { order: index }))
    );

    return null;
  },
  returns: v.null(),
});

export const moveTask = mutation({
  args: {
    destinationOrderIds: v.array(v.id("kanbanTasks")),
    fromColumnId: v.id("kanbanColumns"),
    sourceOrderIds: v.array(v.id("kanbanTasks")),
    taskId: v.id("kanbanTasks"),
    toColumnId: v.id("kanbanColumns"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task không tồn tại");
    }

    const targetColumn = await ctx.db.get(args.toColumnId);
    if (!targetColumn) {
      throw new Error("Cột đích không tồn tại");
    }

    await ctx.db.patch(args.taskId, { columnId: args.toColumnId });

    const updates: Promise<void>[] = [];

    args.sourceOrderIds.forEach((id, index) => {
      updates.push(ctx.db.patch(id, { order: index }));
    });

    args.destinationOrderIds.forEach((id, index) => {
      updates.push(ctx.db.patch(id, { order: index }));
    });

    await Promise.all(updates);
    return null;
  },
  returns: v.null(),
});
