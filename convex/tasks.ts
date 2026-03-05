import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTasks = query({
  args: {
    userId:      v.string(),
    workspaceId: v.optional(v.string()),
    projectId:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .filter((q) => q.eq(q.field("completed"), false))
        .collect();
    }
    if (args.workspaceId) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) => q.eq(q.field("completed"), false))
        .collect();
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();
  },
});

export const getCompletedTasks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_user_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .order("desc")
      .take(50);
  },
});

export const createTask = mutation({
  args: {
    title:       v.string(),
    description: v.optional(v.string()),
    userId:      v.string(),
    projectId:   v.optional(v.string()),
    workspaceId: v.optional(v.string()),
    dueDate:     v.optional(v.number()),
    priority:    v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
    labels:      v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return await ctx.db.insert("tasks", {
      title:         args.title,
      description:   args.description,
      userId:        args.userId,
      projectId:     args.projectId,
      workspaceId:   args.workspaceId,
      dueDate:       args.dueDate,
      priority:      args.priority,
      labels:        args.labels,
      completed:     false,
      focusSessions: 0,
      order:         existing.length,
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId:      v.id("tasks"),
    title:       v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate:     v.optional(v.number()),
    priority:    v.optional(v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4))),
    projectId:   v.optional(v.string()),
    labels:      v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(taskId, filtered);
  },
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      completed:   true,
      completedAt: Date.now(),
    });
  },
});

export const uncompleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      completed:   false,
      completedAt: undefined,
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

export const incrementFocusSessions = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return;
    await ctx.db.patch(args.taskId, {
      focusSessions: task.focusSessions + 1,
    });
  },
});

export const getWeeklyStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const weekStart = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    const allCompleted = await ctx.db
      .query("tasks")
      .withIndex("by_user_completed", (q) =>
        q.eq("userId", args.userId).eq("completed", true)
      )
      .collect();

    const thisWeek = allCompleted.filter(
      (t) => t.completedAt && t.completedAt >= weekStart
    );

    const overdue = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect()
      .then((tasks) =>
        tasks.filter((t) => t.dueDate && t.dueDate < now).length
      );

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const completionsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      completionsByDay[dayNames[d.getDay()]] = 0;
    }
    thisWeek.forEach((t) => {
      if (t.completedAt) {
        const day = dayNames[new Date(t.completedAt).getDay()];
        if (day in completionsByDay) completionsByDay[day]++;
      }
    });

    // streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = allCompleted.filter(
        (t) => t.completedAt && t.completedAt >= d.getTime() && t.completedAt < next.getTime()
      ).length;
      if (count > 0) streak++;
      else if (i > 0) break;
    }

    return {
      tasksCompletedThisWeek: thisWeek.length,
      tasksOverdue:           overdue,
      avgTasksPerDay:         Math.round((thisWeek.length / 7) * 10) / 10,
      streakDays:             streak,
      completionsByDay:       Object.entries(completionsByDay).map(([day, count]) => ({ day, count })),
      recentCompleted:        thisWeek.slice(0, 20),
    };
  },
});
