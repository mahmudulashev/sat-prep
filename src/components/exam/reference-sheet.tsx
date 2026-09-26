"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { Rich } from "./rich-text";

const S = { fill: "none", stroke: "#1e1e1e", strokeWidth: 1.5 } as const;
const T = { fontFamily: "'Noto Serif', Georgia, serif", fontStyle: "italic", fontSize: 13, fill: "#1e1e1e" } as const;

function Item({ figure, formula }: { figure: React.ReactNode; formula: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 110 80" className="h-20 w-28">
        {figure}
      </svg>
      <Rich text={formula} className="text-[15px]" />
    </div>
  );
}

export function ReferenceSheet({
  onClose,
  expanded,
  onToggleExpand,
}: {
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white font-exam text-bb-ink">
      <div className="flex h-11 shrink-0 items-center justify-between bg-[#1e1e1e] px-4 text-white">
        <span className="font-medium">Reference</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onToggleExpand} className="rounded p-1 hover:bg-white/10" aria-label={expanded ? "Collapse" : "Expand"}>
            {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-white/10" aria-label="Close reference">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 font-serif">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
          <Item
            figure={
              <>
                <circle cx="55" cy="40" r="30" {...S} />
                <circle cx="55" cy="40" r="2.5" fill="#1e1e1e" />
                <line x1="55" y1="40" x2="85" y2="40" {...S} />
                <text x="68" y="35" {...T}>r</text>
              </>
            }
            formula="$A = \pi r^2 \quad C = 2\pi r$"
          />
          <Item
            figure={
              <>
                <rect x="20" y="22" width="70" height="36" {...S} />
                <text x="52" y="16" {...T}>ℓ</text>
                <text x="95" y="44" {...T}>w</text>
              </>
            }
            formula="$A = \ell w$"
          />
          <Item
            figure={
              <>
                <polygon points="15,65 95,65 45,12" {...S} />
                <line x1="45" y1="12" x2="45" y2="65" {...S} strokeDasharray="3 3" />
                <rect x="45" y="58" width="7" height="7" {...S} strokeWidth={1} />
                <text x="49" y="42" {...T}>h</text>
                <text x="52" y="78" {...T}>b</text>
              </>
            }
            formula="$A = \dfrac{1}{2}bh$"
          />
          <Item
            figure={
              <>
                <polygon points="25,65 90,65 25,15" {...S} />
                <rect x="25" y="58" width="7" height="7" {...S} strokeWidth={1} />
                <text x="14" y="44" {...T}>b</text>
                <text x="55" y="78" {...T}>a</text>
                <text x="60" y="36" {...T}>c</text>
              </>
            }
            formula="$c^2 = a^2 + b^2$"
          />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-end gap-8">
            <svg viewBox="0 0 120 80" className="h-20 w-32">
              <polygon points="10,65 100,65 100,15" {...S} />
              <rect x="93" y="58" width="7" height="7" {...S} strokeWidth={1} />
              <text x="40" y="34" {...T}>2x</text>
              <text x="104" y="44" {...T}>x</text>
              <text x="44" y="78" {...T}>x√3</text>
              <text x="22" y="61" {...T} fontSize="10" fontStyle="normal">30°</text>
              <text x="82" y="28" {...T} fontSize="10" fontStyle="normal">60°</text>
            </svg>
            <svg viewBox="0 0 100 80" className="h-20 w-28">
              <polygon points="15,65 80,65 15,10" {...S} />
              <rect x="15" y="58" width="7" height="7" {...S} strokeWidth={1} />
              <text x="4" y="40" {...T}>s</text>
              <text x="45" y="78" {...T}>s</text>
              <text x="50" y="32" {...T}>s√2</text>
              <text x="19" y="24" {...T} fontSize="10" fontStyle="normal">45°</text>
              <text x="60" y="61" {...T} fontSize="10" fontStyle="normal">45°</text>
            </svg>
          </div>
          <p className="font-bold">Special Right Triangles</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8">
          <Item
            figure={
              <>
                <polygon points="15,35 70,35 70,68 15,68" {...S} />
                <polyline points="15,35 32,20 87,20 70,35" {...S} />
                <polyline points="87,20 87,53 70,68" {...S} />
                <text x="40" y="79" {...T}>ℓ</text>
                <text x="82" y="68" {...T}>w</text>
                <text x="91" y="40" {...T}>h</text>
              </>
            }
            formula="$V = \ell wh$"
          />
          <Item
            figure={
              <>
                <ellipse cx="55" cy="18" rx="30" ry="8" {...S} />
                <line x1="25" y1="18" x2="25" y2="62" {...S} />
                <line x1="85" y1="18" x2="85" y2="62" {...S} />
                <path d="M25 62 A30 8 0 0 0 85 62" {...S} />
                <line x1="55" y1="18" x2="82" y2="16" {...S} />
                <text x="64" y="13" {...T}>r</text>
                <text x="90" y="44" {...T}>h</text>
              </>
            }
            formula="$V = \pi r^2 h$"
          />
          <Item
            figure={
              <>
                <circle cx="55" cy="40" r="30" {...S} />
                <ellipse cx="55" cy="40" rx="30" ry="8" {...S} strokeDasharray="3 3" />
                <line x1="55" y1="40" x2="84" y2="38" {...S} />
                <circle cx="55" cy="40" r="2.2" fill="#1e1e1e" />
                <text x="68" y="34" {...T}>r</text>
              </>
            }
            formula="$V = \dfrac{4}{3}\pi r^3$"
          />
          <Item
            figure={
              <>
                <ellipse cx="55" cy="64" rx="30" ry="8" {...S} strokeDasharray="3 3" />
                <path d="M25 64 L55 8 L85 64" {...S} />
                <line x1="55" y1="8" x2="55" y2="64" {...S} strokeDasharray="3 3" />
                <line x1="55" y1="64" x2="85" y2="64" {...S} />
                <text x="59" y="40" {...T}>h</text>
                <text x="68" y="60" {...T}>r</text>
              </>
            }
            formula="$V = \dfrac{1}{3}\pi r^2 h$"
          />
          <Item
            figure={
              <>
                <polygon points="12,68 72,68 95,52 55,8" {...S} />
                <line x1="55" y1="8" x2="72" y2="68" {...S} />
                <polyline points="12,68 35,52 95,52" {...S} strokeDasharray="3 3" />
                <line x1="55" y1="8" x2="53" y2="60" {...S} strokeDasharray="3 3" />
                <text x="58" y="44" {...T}>h</text>
                <text x="38" y="79" {...T}>ℓ</text>
                <text x="86" y="66" {...T}>w</text>
              </>
            }
            formula="$V = \dfrac{1}{3}\ell wh$"
          />
        </div>

        <div className="mt-10 space-y-4 text-[15px] leading-relaxed">
          <p>The number of degrees of arc in a circle is 360.</p>
          <p>
            The number of radians of arc in a circle is <Rich text="$2\pi$" />.
          </p>
          <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
        </div>
      </div>
    </div>
  );
}
