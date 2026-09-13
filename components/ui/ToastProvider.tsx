"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type?: "info" | "success" | "error";
}

interface ToastContextValue {
  toast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000); // 4 seconds duration
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 left-4 z-[100] flex flex-col gap-2 pointer-events-none sm:bottom-4 sm:left-auto sm:right-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium shadow-xl backdrop-blur-xl border transition-all animate-in fade-in slide-in-from-bottom-5 sm:slide-in-from-right-5 duration-300
              ${t.type === "error" ? "bg-red-500/80 border-red-500/50 text-white" : ""}
              ${t.type === "success" ? "bg-emerald-500/80 border-emerald-500/50 text-white" : ""}
              ${t.type === "info" ? "bg-black/80 border-white/10 text-white" : ""}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
