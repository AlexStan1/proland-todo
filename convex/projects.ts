import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProjects = query({
  args: {
    userId:      v.string(),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.workspaceId) {
      return await ctx.db
        .query("projects")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .collect();
    }
    const all = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return all.filter((p) => !p.workspaceId);
  },
});

export const createProject = mutation({
  args: {
    name:        v.string(),
    color:       v.string(),
    userId:      v.string(),
    workspaceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return await ctx.db.insert("projects", {
      name:        args.name,
      color:       args.color,
      userId:      args.userId,
      workspaceId: args.workspaceId,
      order:       existing.length,
    });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects"), userId: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== args.userId) return;
    await ctx.db.delete(args.projectId);
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});
