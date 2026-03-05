"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2, Flame, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

export default function ReviewPage() {
  const { data: session, status } = useSession();

  const userId = session?.user?.id;

  const stats = useQuery(
    api.tasks.getWeeklyStats,
    userId ? { userId } : "skip"
  );

  // Still loading session
  if (status === "loading") {
    return <Skeleton />;
  }

  // Session loaded but stats not yet returned from Convex
  if (!stats) {
    return <Skeleton />;
  }

  const statCards = [
    {
      label: "Completed",
      value: stats.tasksCompletedThisWeek,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Overdue",
      value: stats.tasksOverdue,
      icon: AlertCircle,
      color: stats.tasksOverdue > 0 ? "text-red-600" : "text-gray-400",
      bg:    stats.tasksOverdue > 0 ? "bg-red-50"   : "bg-gray-50",
    },
    {
      label: "Daily Avg",
      value: stats.avgTasksPerDay,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Streak",
      value: `${stats.streakDays}d`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center gap-3 mb-8">
        <BarChart2 className="w-6 h-6 text-[#1b2a4a]" />
        <h1 className="text-2xl font-bold text-gray-900">Weekly Review</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Tasks Completed — Last 7 Days
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.completionsByDay} barSize={28}>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              cursor={{ fill: "#f3f4f6" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {stats.completionsByDay.map((entry, i) => (
                <Cell key={i} fill={entry.count > 0 ? "#1b2a4a" : "#e5e7eb"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Completed */}
      {stats.recentCompleted.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Completed This Week
          </h2>
          <div className="space-y-2">
            {stats.recentCompleted.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-500 line-through flex-1 min-w-0 truncate">
                  {task.title}
                </span>
                {task.completedAt && (
                  <span className="text-xs text-gray-300 flex-shrink-0">
                    {new Date(task.completedAt).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center">
          <p className="text-gray-400 text-sm">No tasks completed this week yet.</p>
          <p className="text-gray-300 text-xs mt-1">Complete your first task to see stats here.</p>
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-56 bg-gray-200 rounded-xl mb-8" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  );
}
