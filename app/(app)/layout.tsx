"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sidebar } from "@/components/Sidebar";
import { QuickCaptureModal } from "@/components/QuickCaptureModal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const upsertUser = useMutation(api.users.upsertUser);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [quickCapture, setQuickCapture] = useState(false);

  // Client-side auth guard (belt-and-suspenders alongside middleware)
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Sync user to Convex once we have a session
  useEffect(() => {
    if (session?.user?.id && session.user.email) {
      upsertUser({
        userId: session.user.id,
        email:  session.user.email,
        name:   session.user.name ?? session.user.email,
        image:  session.user.image ?? undefined,
      }).catch(console.error);
    }
  }, [session?.user?.id]);

  // Global keyboard shortcut Cmd/Ctrl+Shift+A
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setQuickCapture(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Show nothing while session loads — prevents flash of unauthenticated content
  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex md:flex-shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onQuickCapture={() => setQuickCapture(true)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-[#1b2a4a] text-lg">Proland To Do</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {quickCapture && (
        <QuickCaptureModal onClose={() => setQuickCapture(false)} />
      )}
    </div>
  );
}
