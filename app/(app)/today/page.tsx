"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { isToday, isOverdue } from "@/lib/utils";
import { Sun } from "lucide-react";

export default function TodayPage() {
  const { data: session } = useSession();
  const tasks = useQuery(
    api.tasks.getTasks,
    session?.user?.id ? { userId: session.user.id } : "skip"
  );

  const todayTasks  = (tasks ?? []).filter((t) => t.dueDate && isToday(t.dueDate));
  const overdueTasks = (tasks ?? []).filter((t) => t.dueDate && isOverdue(t.dueDate) && !isToday(t.dueDate));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-1">
        <Sun className="w-6 h-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
      </div>
      <p className="text-sm text-gray-400 mb-6 ml-9">{today}</p>

      {overdueTasks.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">
            Overdue
          </h2>
          <TaskList tasks={overdueTasks} userId={session?.user?.id ?? ""} />
        </div>
      )}

      <TaskList
        tasks={todayTasks}
        userId={session?.user?.id ?? ""}
        emptyMessage="Nothing due today. Enjoy your day!"
      />
    </div>
  );
}
