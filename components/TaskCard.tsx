"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PRIORITY_CONFIG, formatDate, isOverdue, cn } from "@/lib/utils";
import { Flag, Calendar, Trash2, Target, Pencil, Check, Undo2, FolderOpen } from "lucide-react";
import { FocusMode } from "./FocusMode";
import type { Id } from "@/convex/_generated/dataModel";

interface Task {
  _id:           Id<"tasks">;
  title:         string;
  priority:      1 | 2 | 3 | 4;
  dueDate?:      number;
  completed:     boolean;
  focusSessions: number;
  labels:        string[];
  projectId?:    string;
  userId:        string;
}

const PRIORITIES = [1, 2, 3, 4] as const;

function localDateTimestamp(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).getTime();
}

function timestampToDateInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TaskCard({ task, userId }: { task: Task; userId: string }) {
  const [focusMode,     setFocusMode]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [undoVisible,   setUndoVisible]   = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Edit state
  const [editTitle,     setEditTitle]     = useState(task.title);
  const [editPriority,  setEditPriority]  = useState<1|2|3|4>(task.priority);
  const [editDueDate,   setEditDueDate]   = useState(task.dueDate ? timestampToDateInput(task.dueDate) : "");
  const [editProjectId, setEditProjectId] = useState<string>(task.projectId ?? "");
  const [saving,        setSaving]        = useState(false);

  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const completeTask   = useMutation(api.tasks.completeTask);
  const uncompleteTask = useMutation(api.tasks.uncompleteTask);
  const deleteTask     = useMutation(api.tasks.deleteTask);
  const updateTask     = useMutation(api.tasks.updateTask);

  // Load projects for the dropdown
  const projects = useQuery(api.projects.getProjects, userId ? { userId } : "skip") ?? [];

  const priority = PRIORITY_CONFIG[task.priority];
  const overdue  = task.dueDate ? isOverdue(task.dueDate) : false;

  // Current project name for display
  const currentProject = projects.find((p) => p._id === task.projectId);

  // Complete with 5-second undo window
  const handleComplete = async () => {
    setJustCompleted(true);
    setUndoVisible(true);
    await completeTask({ taskId: task._id });
    undoTimer.current = setTimeout(() => setUndoVisible(false), 5000);
  };

  const handleUndo = async () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoVisible(false);
    setJustCompleted(false);
    await uncompleteTask({ taskId: task._id });
  };

  useEffect(() => {
    return () => { if (undoTimer.current) clearTimeout(undoTimer.current); };
  }, []);

  const handleDeleteConfirm = async () => {
    await deleteTask({ taskId: task._id });
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await updateTask({
        taskId:    task._id,
        title:     editTitle.trim(),
        priority:  editPriority,
        dueDate:   editDueDate ? localDateTimestamp(editDueDate) : undefined,
        projectId: editProjectId || undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Undo toast
  if (justCompleted && undoVisible) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-green-100 bg-green-50 text-sm">
        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
        <span className="text-green-700 flex-1 truncate line-through text-xs">{task.title}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 flex-shrink-0"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
      </div>
    );
  }

  if (justCompleted) return null;

  // Delete confirmation
  if (confirmDelete) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-100 bg-red-50">
        <span className="text-sm text-red-700 flex-1 min-w-0 truncate">Delete "{task.title}"?</span>
        <button
          onClick={handleDeleteConfirm}
          className="flex-shrink-0 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="flex-shrink-0 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Edit mode
  if (editing) {
    return (
      <div className="rounded-xl border border-[#1b2a4a]/20 bg-white p-3 space-y-2 shadow-sm">
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter") handleSave(); }}
          className="w-full text-sm text-gray-800 outline-none border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#1b2a4a]"
        />

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          <div className="flex gap-1">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setEditPriority(p)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded border font-medium transition-all",
                  editPriority === p
                    ? cn(PRIORITY_CONFIG[p].bg, PRIORITY_CONFIG[p].color, PRIORITY_CONFIG[p].border)
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                )}
              >
                P{p}
              </button>
            ))}
          </div>

          {/* Due date */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ml-auto",
            editDueDate
              ? "border-[#1b2a4a]/30 bg-[#1b2a4a]/5 text-[#1b2a4a]"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          )}>
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="text-xs outline-none bg-transparent text-gray-700 w-28"
            />
          </div>
        </div>

        {/* Project picker */}
        <div className="flex items-center gap-2">
          <FolderOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <select
            value={editProjectId}
            onChange={(e) => setEditProjectId(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#1b2a4a] text-gray-700 bg-white"
          >
            <option value="">No project (Inbox)</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!editTitle.trim() || saving}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#1b2a4a] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#243660] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : <><Check className="w-3 h-3" /> Save</>}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <>
      <div className={cn(
        "group flex items-start gap-3 p-3 rounded-xl border bg-white transition-all hover:shadow-sm",
        overdue ? "border-red-100 bg-red-50/30" : "border-gray-100"
      )}>
        {/* Complete button */}
        <button
          onClick={handleComplete}
          className="mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 group/check"
          style={{ borderColor: priorityColor(task.priority) }}
          title="Complete task"
        >
          <span
            className="w-2 h-2 rounded-full opacity-0 group-hover/check:opacity-40 transition-opacity"
            style={{ backgroundColor: priorityColor(task.priority) }}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{task.title}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {task.dueDate && (
              <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-red-500" : "text-gray-400")}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            <span className={cn("flex items-center gap-1 text-xs font-medium", priority.color)}>
              <Flag className="w-3 h-3" />
              {priority.label}
            </span>
            {currentProject && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentProject.color }} />
                {currentProject.name}
              </span>
            )}
            {task.focusSessions > 0 && (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <Target className="w-3 h-3" />
                {task.focusSessions}
              </span>
            )}
            {task.labels.map((l) => (
              <span key={l} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{l}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFocusMode(true)}
            className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-300 hover:text-purple-500 transition-colors"
            title="Focus mode"
          >
            <Target className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {focusMode && <FocusMode task={task} onClose={() => setFocusMode(false)} />}
    </>
  );
}

function priorityColor(p: 1 | 2 | 3 | 4): string {
  return { 1: "#ef4444", 2: "#f97316", 3: "#3b82f6", 4: "#d1d5db" }[p];
}
