"use client";

import { useState } from "react";
import { TaskCard } from "./TaskCard";
import { AddTaskForm } from "./AddTaskForm";
import { Plus } from "lucide-react";

interface Task {
  _id:           any;
  title:         string;
  priority:      1 | 2 | 3 | 4;
  dueDate?:      number;
  completed:     boolean;
  focusSessions: number;
  labels:        string[];
  projectId?:    string;
}

interface Props {
  tasks:          Task[];
  userId:         string;
  projectId?:     string;
  workspaceId?:   string;
  emptyMessage?:  string;
  showAddButton?: boolean;
}

export function TaskList({
  tasks, userId, projectId, workspaceId,
  emptyMessage = "No tasks here. Add one below.",
  showAddButton = true,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      {sorted.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyMessage}</p>
      )}

      {sorted.map((task) => (
        <TaskCard key={task._id} task={task} userId={userId} />
      ))}

      {showAdd ? (
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <AddTaskForm
            userId={userId}
            projectId={projectId}
            workspaceId={workspaceId}
            onDone={() => setShowAdd(false)}
          />
        </div>
      ) : (
        showAddButton && (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors group"
          >
            <Plus className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            Add task
          </button>
        )
      )}
    </div>
  );
}
