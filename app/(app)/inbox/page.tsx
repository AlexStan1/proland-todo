"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { Inbox } from "lucide-react";

export default function InboxPage() {
  const { data: session } = useSession();
  const tasks = useQuery(
    api.tasks.getTasks,
    session?.user?.id ? { userId: session.user.id } : "skip"
  );

  const inboxTasks = (tasks ?? []).filter((t) => !t.projectId);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-6">
        <Inbox className="w-6 h-6 text-navy-700" />
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        {inboxTasks.length > 0 && (
          <span className="text-sm text-gray-400 font-normal">
            {inboxTasks.length} task{inboxTasks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <TaskList tasks={inboxTasks} userId={session?.user?.id ?? ""} />
    </div>
  );
}
