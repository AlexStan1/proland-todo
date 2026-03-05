"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TaskList } from "@/components/TaskList";
import { CalendarDays } from "lucide-react";

export default function UpcomingPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const tasks = useQuery(
    api.tasks.getTasks,
    userId ? { userId } : "skip"
  );

  const now       = Date.now();
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000;

  const upcoming = (tasks ?? []).filter(
    (t) => t.dueDate && t.dueDate >= now && t.dueDate <= sevenDays
  );

  // Group by day label
  const grouped: Record<string, typeof upcoming> = {};
  const dayOrder: string[] = [];

  upcoming.forEach((t) => {
    const label = new Date(t.dueDate!).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    if (!grouped[label]) {
      grouped[label] = [];
      dayOrder.push(label);
    }
    grouped[label].push(t);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-6 h-6 text-purple-500" />
        <h1 className="text-2xl font-bold text-gray-900">Upcoming</h1>
        <span className="text-sm text-gray-400">Next 7 days</span>
      </div>

      {dayOrder.length === 0 ? (
        <div className="space-y-2">
          <p className="text-gray-400 text-sm text-center py-6">
            No tasks scheduled for the next 7 days.
          </p>
          {/* Add task button even when empty */}
          <TaskList
            tasks={[]}
            userId={userId ?? ""}
            emptyMessage=""
            showAddButton
          />
        </div>
      ) : (
        <>
          {dayOrder.map((day) => (
            <div key={day} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 mb-3 pb-2 border-b border-gray-100">
                {day}
              </h2>
              <TaskList
                tasks={grouped[day]}
                userId={userId ?? ""}
                showAddButton={false}
              />
            </div>
          ))}
          {/* Single add button at the bottom */}
          <TaskList
            tasks={[]}
            userId={userId ?? ""}
            emptyMessage=""
            showAddButton
          />
        </>
      )}
    </div>
  );
}
