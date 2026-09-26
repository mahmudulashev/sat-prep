"use client";

import { BookOpenCheck, Calculator, Layers } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isSection, SECTIONS } from "@/lib/exam/constants";
import type { Section } from "@/lib/exam/types";
import { cn } from "@/lib/utils";

const TAB: Record<Section, { label: string; icon: typeof Calculator }> = {
  math: { label: "Math", icon: Calculator },
  english: { label: "Reading and Writing", icon: BookOpenCheck },
  general: { label: "Full-length", icon: Layers },
};

/**
 * Tabs for the Tests page. All sections are rendered on the server once;
 * switching only swaps the visible panel and updates the URL, so it is instant.
 */
export function SectionTabs({ panels }: { panels: Record<Section, ReactNode> }) {
  const pathname = usePathname();
  const last = pathname.split("/").pop() ?? "";
  const section: Section = isSection(last) ? last : "math";

  return (
    <>
      <nav
        className="no-scrollbar mt-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-surface p-1.5 shadow-card ring-1 ring-line"
        aria-label="Test sections"
      >
        {SECTIONS.map((s) => {
          const { label, icon: Icon } = TAB[s];
          const active = s === section;
          const href = `/dashboard/tests/${s}`;
          return (
            <a
              key={s}
              href={href}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                if (!active) window.history.pushState(null, "", href);
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                active ? "bg-ink text-white shadow-sm" : "text-ink-2 hover:bg-canvas",
              )}
            >
              <Icon className="size-4" />
              {label}
            </a>
          );
        })}
      </nav>

      {SECTIONS.map((s) => (
        <div key={s} hidden={s !== section}>
          {panels[s]}
        </div>
      ))}
    </>
  );
}
