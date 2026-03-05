import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createWorkspace = mutation({
  args: { name: v.string(), userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const wsId = await ctx.db.insert("workspaces", {
      name:      args.name,
      ownerId:   args.userId,
      createdAt: Date.now(),
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId: wsId,
      userId:      args.userId,
      email:       args.email,
      role:        "owner",
      joinedAt:    Date.now(),
    });
    return wsId;
  },
});

export const getMyWorkspaces = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const workspaces = await Promise.all(
      memberships.map((m) => ctx.db.get(m.workspaceId as any))
    );
    return workspaces.filter(Boolean);
  },
});

export const getWorkspaceMembers = query({
  args: { workspaceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});

export const inviteMember = mutation({
  args: {
    workspaceId: v.string(),
    email:       v.string(),
    inviterId:   v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    if (existing.some((m) => m.email === args.email)) {
      throw new Error("This person is already a member.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    await ctx.db.insert("workspaceMembers", {
      workspaceId: args.workspaceId,
      userId:      user?.userId ?? args.email,
      email:       args.email,
      role:        "member",
      joinedAt:    Date.now(),
    });
  },
});
