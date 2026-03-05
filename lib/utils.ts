import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isToday(timestamp: number): boolean {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

export function isOverdue(timestamp: number): boolean {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date < new Date();
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const PRIORITY_CONFIG = {
  1: { label: "Urgent", color: "text-red-500",    bg: "bg-red-50",    dot: "bg-red-500",    border: "border-red-300" },
  2: { label: "High",   color: "text-orange-500", bg: "bg-orange-50", dot: "bg-orange-500", border: "border-orange-300" },
  3: { label: "Normal", color: "text-blue-500",   bg: "bg-blue-50",   dot: "bg-blue-500",   border: "border-blue-300" },
  4: { label: "None",   color: "text-gray-400",   bg: "bg-gray-50",   dot: "bg-gray-300",   border: "border-gray-200" },
} as const;
