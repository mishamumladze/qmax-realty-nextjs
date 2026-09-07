"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface AdminPillToggleProps {
  checked: boolean;
  onChange: () => void;
  icon: LucideIcon;
  children: ReactNode;
}

export function AdminPillToggle({ checked, onChange, icon: Icon, children }: AdminPillToggleProps) {
  return (
    <label
      className={`group has-[:focus-visible]:ring-brand-500/40 inline-flex min-h-11 cursor-pointer
        items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all
        duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:outline-none
        motion-safe:active:scale-95 ${
          checked
            ? `border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500 text-white
              shadow-sm motion-safe:scale-[1.02]`
            : `hover:border-brand-400 dark:hover:border-brand-500 border-gray-300 bg-gray-100
              text-gray-700 hover:shadow-sm dark:border-gray-600 dark:bg-gray-800
              dark:text-gray-300`
        }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <Icon
        className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
          checked ? "motion-safe:scale-110" : "opacity-70"
        }`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </label>
  );
}
