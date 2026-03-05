"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Play, Pause, SkipForward, Target } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const WORK_SECS  = 25 * 60;
const BREAK_SECS = 5  * 60;

interface Task {
  _id:           Id<"tasks">;
  title:         string;
  focusSessions: number;
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch {}
}

export function FocusMode({ task, onClose }: { task: Task; onClose: () => void }) {
  const [seconds, setSeconds] = useState(WORK_SECS);
  const [running, setRunning] = useState(true);
  const [isBreak, setIsBreak] = useState(false);
  const [session, setSession] = useState(1);
  const [showPrompt, setShowPrompt] = useState(false);

  const increment = useMutation(api.tasks.incrementFocusSessions);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            beep();
            clearInterval(intervalRef.current!);
            if (!isBreak) {
              increment({ taskId: task._id });
              setIsBreak(true);
              setSeconds(BREAK_SECS);
              setRunning(true);
            } else {
              setIsBreak(false);
              setShowPrompt(true);
              setRunning(false);
              return 0;
            }
            return s;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, isBreak]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  const continueWork = () => {
    setSession((s) => s + 1);
    setSeconds(WORK_SECS);
    setShowPrompt(false);
    setRunning(true);
  };

  const circumference = 2 * Math.PI * 54;
  const total = isBreak ? BREAK_SECS : WORK_SECS;
  const progress = circumference - (seconds / total) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/95 backdrop-blur-md">
      <div className="text-center max-w-sm w-full px-6">
        {/* Phase label */}
        <p className="text-white/40 text-xs uppercase tracking-widest mb-8 font-medium">
          {isBreak ? "Break" : `Session ${session} of 4`}
        </p>

        {/* Task title */}
        <h2 className="text-white text-2xl font-bold mb-10 leading-tight">
          {task.title}
        </h2>

        {/* Circular timer */}
        <div className="relative w-40 h-40 mx-auto mb-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={isBreak ? "#52B788" : "#fff"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-4xl font-light tracking-widest">
              {mins}:{secs}
            </span>
          </div>
        </div>

        {/* Continue prompt */}
        {showPrompt ? (
          <div className="space-y-3">
            <p className="text-white/70 text-sm mb-4">
              Session complete. Continue with "{task.title}"?
            </p>
            <button onClick={continueWork} className="w-full bg-white text-navy-700 font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors">
              Yes, keep going
            </button>
            <button onClick={onClose} className="w-full bg-white/10 text-white/70 py-3 rounded-xl hover:bg-white/15 transition-colors text-sm">
              No, I'm done
            </button>
          </div>
        ) : (
          /* Controls */
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setRunning(!running)}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={() => { setIsBreak(false); setSeconds(WORK_SECS); setRunning(true); }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              title="Skip"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sessions badge */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <Target className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/30 text-xs">{task.focusSessions} sessions completed</span>
        </div>

        {/* Exit */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
