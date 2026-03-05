"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Inbox, Sun, CalendarDays, BarChart2, Plus, CheckSquare,
  LogOut, X, Zap, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import { AddTaskForm } from "./AddTaskForm";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/inbox",    label: "Inbox",    icon: Inbox },
  { href: "/today",    label: "Today",    icon: Sun },
  { href: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { href: "/review",   label: "Review",   icon: BarChart2 },
];

const PROJECT_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6",
];

export function Sidebar({
  onClose,
  onQuickCapture,
}: {
  onClose:        () => void;
  onQuickCapture: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  // If viewing a project page, pre-assign new tasks to that project
  const currentProjectId = pathname.startsWith("/project/")
    ? pathname.split("/project/")[1]
    : undefined;

  const [showAddTask,    setShowAddTask]    = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectsOpen,   setProjectsOpen]   = useState(true);

  const projects = useQuery(
    api.projects.getProjects,
    userId ? { userId } : "skip"
  );

  return (
    <div className="flex flex-col h-full bg-[#1b2a4a] text-white w-64">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-white">Proland</span>
          <span className="font-light text-white/60 text-sm">To Do</span>
        </div>
        <button onClick={onClose} className="md:hidden p-1 rounded hover:bg-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-3 py-3 space-y-1">
        <button
          onClick={() => setShowAddTask((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          {currentProjectId ? "Add to project" : "Add task"}
        </button>
        <button
          onClick={onQuickCapture}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 text-xs transition-all"
        >
          <Zap className="w-3 h-3" />
          Quick capture
          <kbd className="ml-auto text-white/25 text-[10px]">⌘⇧A</kbd>
        </button>
      </div>

      {showAddTask && userId && (
        <div className="px-3 pb-3">
          <AddTaskForm
            userId={userId}
            projectId={currentProjectId}
            onDone={() => setShowAddTask(false)}
            darkMode
          />
        </div>
      )}

      {/* Nav */}
      <nav className="px-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="space-y-0.5 mb-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                pathname === href
                  ? "bg-white/20 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>

        {/* Projects section */}
        <div className="mt-2">
          <div className="flex items-center px-3 py-1.5">
            <button
              onClick={() => setProjectsOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white/35 uppercase tracking-wider hover:text-white/55 transition-colors flex-1 text-left"
            >
              {projectsOpen
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />}
              Projects
            </button>
            <button
              onClick={() => setShowAddProject((v) => !v)}
              className="p-1 rounded hover:bg-white/10 text-white/35 hover:text-white/60 transition-colors"
              title="New project"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showAddProject && userId && (
            <ProjectForm
              userId={userId}
              onDone={() => {
                setShowAddProject(false);
                setProjectsOpen(true);
              }}
            />
          )}

          {projectsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {(projects ?? []).map((project) => (
                <Link
                  key={project._id}
                  href={`/project/${project._id}`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    pathname === `/project/${project._id}`
                      ? "bg-white/20 text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
              {!showAddProject && (projects ?? []).length === 0 && (
                <p className="px-4 py-2 text-xs text-white/25">No projects yet</p>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      {session?.user && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2">
            {session.user.image ? (
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="text-xs text-white/55 truncate flex-1 min-w-0">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="p-1.5 rounded hover:bg-white/10 text-white/35 hover:text-white/65 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [name,    setName]    = useState("");
  const [color,   setColor]   = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const createProject = useMutation(api.projects.createProject);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter a project name."); return; }
    setLoading(true);
    setError("");
    try {
      await createProject({ name: name.trim(), color, userId });
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create project.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-3 my-1.5 bg-white/10 rounded-xl p-3 space-y-2.5">
      <input
        autoFocus
        value={name}
        onChange={(e) => { setName(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        placeholder="Project name"
        className="w-full bg-white/10 text-white placeholder-white/35 text-sm rounded-lg px-2.5 py-1.5 outline-none border border-white/15 focus:border-white/40"
        disabled={loading}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-1.5 flex-wrap">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={cn(
              "w-5 h-5 rounded-full transition-all",
              color === c && "ring-2 ring-white ring-offset-1 ring-offset-[#1b2a4a] scale-110"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!name.trim() || loading}
          className="flex-1 flex items-center justify-center gap-1.5 bg-white text-[#1b2a4a] text-xs font-bold py-1.5 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 bg-white/10 text-white/60 text-xs py-1.5 rounded-lg hover:bg-white/15 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
