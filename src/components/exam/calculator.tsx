"use client";

import { Calculator as CalculatorIcon, Loader2, Maximize2, Minimize2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Mode = "graphing" | "scientific";

// The College Board edition of Desmos, the same calculator Bluebook embeds.
const DESMOS_URL: Record<Mode, string> = {
  graphing: "https://www.desmos.com/testing/cb-digital-sat/graphing",
  scientific: "https://www.desmos.com/testing/cb-digital-sat/scientific",
};

export function CalculatorPanel({
  expanded,
  onToggleExpanded,
  onClose,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("graphing");
  // Each calculator is loaded the first time it is shown and then kept, so
  // switching modes or closing the panel never loses the student's work.
  const [loaded, setLoaded] = useState<Record<Mode, boolean>>({ graphing: false, scientific: false });
  const [opened, setOpened] = useState<Record<Mode, boolean>>({ graphing: true, scientific: false });

  const show = (m: Mode) => {
    setMode(m);
    setOpened((o) => ({ ...o, [m]: true }));
  };

  return (
    <div className="flex h-full flex-col bg-white font-exam text-bb-ink">
      <div className="flex h-11 shrink-0 items-center justify-between bg-[#1e1e1e] px-3 text-white">
        <div className="flex items-center rounded-md border border-white/40 p-0.5 text-[13px]">
          {(["graphing", "scientific"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => show(m)}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 font-medium capitalize",
                mode === m ? "bg-white text-bb-ink underline underline-offset-2" : "text-white hover:bg-white/10",
              )}
            >
              {m === "graphing" ? <GraphGlyph /> : <CalculatorIcon className="size-3.5" />}
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleExpanded}
            className="rounded p-1 hover:bg-white/10"
            aria-label={expanded ? "Collapse calculator" : "Expand calculator"}
          >
            {expanded ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}
          </button>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close calculator">
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {(["graphing", "scientific"] as const).map(
          (m) =>
            opened[m] && (
              <iframe
                key={m}
                src={DESMOS_URL[m]}
                title={m === "graphing" ? "Desmos graphing calculator" : "Desmos scientific calculator"}
                onLoad={() => setLoaded((l) => ({ ...l, [m]: true }))}
                className={cn("absolute inset-0 size-full border-0", mode !== m && "invisible")}
              />
            ),
        )}
        {!loaded[mode] && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-[#555]">
            <Loader2 className="size-4 animate-spin" /> Loading calculator…
          </div>
        )}
      </div>
    </div>
  );
}

function GraphGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 12c3 0 3-8 6-8s3 8 7 8" />
    </svg>
  );
}
