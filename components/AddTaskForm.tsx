"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Calendar, Loader2 } from "lucide-react";

const PRIORITIES = [
  { value: 1 as const, label: "P1", active: "bg-red-50 border-red-300 text-red-600",         inactive: "border-gray-200 text-gray-400" },
  { value: 2 as const, label: "P2", active: "bg-orange-50 border-orange-300 text-orange-600", inactive: "border-gray-200 text-gray-400" },
  { value: 3 as const, label: "P3", active: "bg-blue-50 border-blue-300 text-blue-600",       inactive: "border-gray-200 text-gray-400" },
  { value: 4 as const, label: "P4", active: "bg-gray-100 border-gray-300 text-gray-600",      inactive: "border-gray-200 text-gray-400" },
];

function localDateTimestamp(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

interface Props {
  userId:           string;
  projectId?:       string;
  workspaceId?:     string;
  onDone:           () => void;
  darkMode?:        boolean;
  initialTitle?:    string;
  initialPriority?: 1 | 2 | 3 | 4;
  initialDueDate?:  string;
}

export function AddTaskForm({
  userId, projectId, workspaceId, onDone, darkMode,
  initialTitle    = "",
  initialPriority = 4,
  initialDueDate  = "",
}: Props) {
  const [title,    setTitle]    = useState(initialTitle);
  const [priority, setPriority] = useState<1|2|3|4>(initialPriority);
  const [dueDate,  setDueDate]  = useState(initialDueDate);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const createTask = useMutation(api.tasks.createTask);
  const hasTitle   = title.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasTitle) { setError("Please enter a task title."); return; }
    if (!userId)   { setError("Not signed in. Please refresh the page."); return; }

    setLoading(true);
    setError("");
    try {
      await createTask({
        title:       title.trim(),
        userId,
        projectId:   projectId   || undefined,
        workspaceId: workspaceId || undefined,
        priority,
        labels:      [],
        dueDate:     dueDate ? localDateTimestamp(dueDate) : undefined,
      });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add task. Try again.");
      setLoading(false);
    }
  };

  const inputBase = darkMode
    ? "w-full bg-white/10 text-white placeholder-white/40 text-sm rounded-lg px-3 py-2 outline-none border border-white/20 focus:border-white/50"
    : "w-full bg-white text-gray-900 placeholder-gray-400 text-sm rounded-lg px-3 py-2 outline-none border border-gray-200 focus:border-[#1b2a4a] focus:ring-1 focus:ring-[#1b2a4a]/20";

  // Submit button transitions from muted → vivid as soon as user types
  const submitBtn = cn(
    "flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all duration-150",
    loading
      ? "bg-[#1b2a4a] text-white cursor-wait"
      : hasTitle
        ? darkMode
          ? "bg-white text-[#1b2a4a] hover:bg-white/90 shadow-sm"
          : "bg-[#1b2a4a] text-white hover:bg-[#243660] shadow-sm"
        : darkMode
          ? "bg-white/10 text-white/30 cursor-not-allowed"
          : "bg-gray-100 text-gray-300 cursor-not-allowed"
  );

  // Date row — more visible styling
  const dateRow = cn(
    "flex items-center gap-1.5 ml-auto px-2 py-1 rounded-lg border transition-colors",
    dueDate
      ? darkMode
        ? "border-white/30 bg-white/10 text-white"
        : "border-[#1b2a4a]/30 bg-[#1b2a4a]/5 text-[#1b2a4a]"
      : darkMode
        ? "border-white/15 text-white/50 hover:border-white/30"
        : "border-gray-200 text-gray-500 hover:border-gray-300"
  );

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => { setTitle(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        placeholder="Task title..."
        className={cn(inputBase, error && "!border-red-400")}
        disabled={loading}
      />

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority buttons */}
        <div className="flex gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={cn(
                "px-2 py-0.5 text-xs rounded border font-medium transition-all",
                priority === p.value
                  ? p.active
                  : darkMode
                    ? "border-white/20 text-white/40 hover:border-white/40"
                    : p.inactive + " hover:border-gray-300"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Due date — clearly visible */}
        <div className={dateRow}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={cn(
              "text-xs outline-none bg-transparent w-28",
              darkMode ? "text-white" : "text-gray-700"
            )}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!hasTitle || loading}
          className={submitBtn}
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {loading ? "Adding..." : "Add task"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(
            "px-3 py-2 rounded-lg text-xs transition-colors",
            darkMode
              ? "bg-white/10 text-white/70 hover:bg-white/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
