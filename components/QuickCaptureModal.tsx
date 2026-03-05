"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap, X, Loader2 } from "lucide-react";

export function QuickCaptureModal({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession();
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createTask = useMutation(api.tasks.createTask);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/parse-task", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          input,
          currentDate: new Date().toISOString().split("T")[0],
        }),
      });

      const parsed = await res.json();

      if (!res.ok) throw new Error("Parse failed");

      await createTask({
        title:    parsed.title || input.trim(),
        userId:   session.user.id,
        priority: parsed.priority ?? 4,
        labels:   parsed.labels ?? [],
        dueDate:  parsed.dueDate ? new Date(parsed.dueDate).getTime() : undefined,
      });

      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {
      setError("Could not parse task. Try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">Quick Capture</span>
          <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="relative">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onClose()}
              placeholder="e.g. Email Lisa every Monday 8am #Work p1"
              className="w-full text-base text-gray-800 placeholder-gray-300 outline-none py-2"
              disabled={loading || success}
            />
            {loading && (
              <Loader2 className="absolute right-0 top-2.5 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

          {success && (
            <p className="text-xs text-green-500 mt-2 font-medium">✓ Task added</p>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-300">
              AI parses date, priority (#project, @label, p1–p4)
            </p>
            <button
              type="submit"
              disabled={!input.trim() || loading || success}
              className="bg-navy-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
