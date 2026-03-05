import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email:  v.string(),
    name:   v.string(),
    image:  v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_email",  ["email"]),

  projects: defineTable({
    name:        v.string(),
    color:       v.string(),
    userId:      v.string(),
    workspaceId: v.optional(v.string()),
    order:       v.number(),
  })
    .index("by_user",      ["userId"])
    .index("by_workspace", ["workspaceId"]),

  tasks: defineTable({
    title:           v.string(),
    description:     v.optional(v.string()),
    userId:          v.string(),
    projectId:       v.optional(v.string()),
    workspaceId:     v.optional(v.string()),
    parentTaskId:    v.optional(v.string()),
    dueDate:         v.optional(v.number()),
    priority:        v.union(v.literal(1), v.literal(2), v.literal(3), v.literal(4)),
    labels:          v.array(v.string()),
    completed:       v.boolean(),
    completedAt:     v.optional(v.number()),
    assignedToEmail: v.optional(v.string()),
    focusSessions:   v.number(),
    order:           v.number(),
  })
    .index("by_user",      ["userId"])
    .index("by_project",   ["projectId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_user_completed", ["userId", "completed"]),

  workspaces: defineTable({
    name:      v.string(),
    ownerId:   v.string(),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  workspaceMembers: defineTable({
    workspaceId: v.string(),
    userId:      v.string(),
    email:       v.string(),
    role:        v.union(v.literal("owner"), v.literal("member")),
    joinedAt:    v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user",      ["userId"]),
});
