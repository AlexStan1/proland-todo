"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { FolderOpen } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const project = useQuery(api.projects.getProject, {
    projectId: params.id as Id<"projects">,
  });
  const tasks = useQuery(
    api.tasks.getTasks,
    session?.user?.id
      ? { userId: session.user.id, projectId: params.id }
      : "skip"
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-6">
        {project ? (
          <span
            className="w-5 h-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
        ) : (
          <FolderOpen className="w-5 h-5 text-gray-400" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {project?.name ?? "Project"}
        </h1>
        {tasks && (
          <span className="text-sm text-gray-400">{tasks.length} tasks</span>
        )}
      </div>

      <TaskList
        tasks={tasks ?? []}
        userId={session?.user?.id ?? ""}
        projectId={params.id}
        emptyMessage="No tasks in this project yet."
      />
    </div>
  );
}
