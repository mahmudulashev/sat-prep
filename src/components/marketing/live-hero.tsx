"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Calls `onTick` every `ms` while `ref` is on screen and the tab is visible. */
function useVisibleInterval(ref: React.RefObject<HTMLElement | null>, ms: number, onTick: () => void) {
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let inView = false;
    let timer = 0;
    const sync = () => {
      window.clearInterval(timer);
      if (inView && document.visibilityState === "visible") timer = window.setInterval(() => tick.current(), ms);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [ref, ms]);
}

/* -------------------------------------------------------------------------- */
/* Score card that flips through a student's recent attempts                   */
/* -------------------------------------------------------------------------- */

type Attempt = { label: string; rw: number; math: number; trend: number[] };

const ATTEMPTS: Attempt[] = [
  { label: "Combined · Test 1", rw: 680, math: 660, trend: [1080, 1130, 1120, 1190, 1240, 1230, 1310, 1340] },
  { label: "Combined · Test 2", rw: 700, math: 710, trend: [1120, 1150, 1210, 1200, 1270, 1330, 1360, 1410] },
  { label: "Combined · Test 3", rw: 730, math: 750, trend: [1150, 1210, 1240, 1300, 1290, 1370, 1420, 1480] },
];

type Frame = { total: number; rw: number; math: number; trend: number[] };
const frameOf = (a: Attempt): Frame => ({ total: a.rw + a.math, rw: a.rw, math: a.math, trend: a.trend });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 4);

function tween(from: Frame, to: Frame, duration: number, onFrame: (f: Frame) => void) {
  const start = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = ease(Math.min(1, (now - start) / duration));
    onFrame({
      total: Math.round(lerp(from.total, to.total, t)),
      rw: Math.round(lerp(from.rw, to.rw, t)),
      math: Math.round(lerp(from.math, to.math, t)),
      trend: to.trend.map((v, i) => lerp(from.trend[i] ?? v, v, t)),
    });
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export function LiveScore() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cycled, setCycled] = useState(false);
  const [frame, setFrame] = useState<Frame>(() => frameOf(ATTEMPTS[0]));
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  });
  const stop = useRef<() => void>(() => {});

  // First appearance: count up from the bottom of each scale.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const target = frameOf(ATTEMPTS[0]);
    let cancel = () => {};
    const timer = window.setTimeout(() => {
      cancel = tween({ total: 400, rw: 200, math: 200, trend: target.trend }, target, 1800, setFrame);
      stop.current = cancel;
    }, 250);
    setFrame({ total: 400, rw: 200, math: 200, trend: target.trend });
    return () => {
      window.clearTimeout(timer);
      cancel();
    };
  }, []);

  useVisibleInterval(ref, 5200, () => {
    const next = (index + 1) % ATTEMPTS.length;
    setIndex(next);
    setCycled(true);
    stop.current();
    stop.current = tween(frameRef.current, frameOf(ATTEMPTS[next]), 1300, setFrame);
  });

  const attempt = ATTEMPTS[index];
  const gain = attempt.trend[attempt.trend.length - 1] - attempt.trend[0];
  const [min, max] = [1000, 1550];
  const points = frame.trend
    .map((v, i) => `${(i / (frame.trend.length - 1)) * 240 + 10},${92 - ((v - min) / (max - min)) * 84}`)
    .join(" ");

  return (
    <div ref={ref} className="relative flex animate-fade-up flex-col overflow-hidden rounded-3xl bg-surface p-3 shadow-card [animation-delay:60ms]">
      <div className="rounded-[1.4rem] bg-gradient-to-br from-[#1f2468] to-[#2d3494] p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight">SAT</span>
          <span className="relative overflow-hidden rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <span key={attempt.label} className="block animate-fade-up">
              {attempt.label}
            </span>
          </span>
        </div>
        <p className="mt-6 text-center text-xs font-bold tracking-[0.14em] text-white/70 short:mt-4">TOTAL SCORE</p>
        <p className="text-center text-6xl font-extrabold tracking-tight tabular-nums">{frame.total}</p>
        <p className="text-center text-xs text-white/60">400–1600</p>
        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {ATTEMPTS.map((a, i) => (
            <span
              key={a.label}
              className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-5 bg-lime" : "w-1.5 bg-white/30")}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-2xl bg-english-soft p-4">
          <p className="text-xs font-semibold text-ink-2">Reading and Writing</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{frame.rw}</p>
        </div>
        <div className="rounded-2xl bg-math-soft p-4">
          <p className="text-xs font-semibold text-ink-2">Math</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums">{frame.math}</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex flex-1 flex-col rounded-2xl bg-canvas p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Score trend</p>
          <span
            key={gain}
            className={cn("inline-block animate-pop rounded-full bg-lime px-2 py-0.5 text-xs font-bold", index === 0 && !cycled ? "[--d:1.9s]" : "[--d:500ms]")}
          >
            +{gain}
          </span>
        </div>
        <svg viewBox="0 0 260 100" preserveAspectRatio="none" className="mt-2 min-h-24 w-full flex-1 animate-sweep [--d:600ms]" aria-hidden>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6c5ce7" stopOpacity="0.25" />
              <stop offset="1" stopColor="#6c5ce7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`10,100 ${points} 250,100`} fill="url(#trend-fill)" />
          <polyline points={points} fill="none" stroke="#6c5ce7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timed · Locked · Scored, lit up one after another                           */
/* -------------------------------------------------------------------------- */

const TOOLS = [
  { label: "Timed", Icon: ClockGlyph },
  { label: "Locked", Icon: LockGlyph },
  { label: "Scored", Icon: BarsGlyph },
];

export function LiveTools() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  useVisibleInterval(ref, 2200, () => setActive((i) => (i + 1) % TOOLS.length));

  return (
    <div ref={ref} className="grid animate-fade-up grid-cols-3 gap-2 rounded-3xl bg-surface p-5 shadow-card [animation-delay:140ms]">
      {TOOLS.map(({ label, Icon }, i) => {
        const on = i === active;
        return (
          <div
            key={label}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl py-4 transition-colors duration-500",
              on ? "bg-ink text-white" : "bg-canvas text-ink-2",
            )}
          >
            <Icon key={on ? "on" : "off"} on={on} className={cn("size-5 transition-colors duration-500", on ? "text-lime" : "text-brand")} />
            <span className="text-xs font-semibold">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

type GlyphProps = { on: boolean; className?: string };

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ClockGlyph({ on, className }: GlyphProps) {
  return (
    <svg {...glyph} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" className={on ? "origin-center animate-[clock-turn_1.2s_cubic-bezier(0.6,0,0.2,1)]" : undefined} style={{ transformBox: "view-box" }} />
    </svg>
  );
}

function LockGlyph({ on, className }: GlyphProps) {
  return (
    <svg {...glyph} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" className={on ? "animate-[lock-shut_0.7s_cubic-bezier(0.2,0.7,0.2,1)]" : undefined} />
    </svg>
  );
}

function BarsGlyph({ on, className }: GlyphProps) {
  return (
    <svg {...glyph} className={className}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      {[
        { x: 8, y: 13, d: 0 },
        { x: 13, y: 9, d: 120 },
        { x: 18, y: 5, d: 240 },
      ].map((b) => (
        <path
          key={b.x}
          d={`M${b.x} 17V${b.y}`}
          className={on ? "origin-bottom animate-[grow-y_0.6s_cubic-bezier(0.2,0.7,0.2,1)_both]" : undefined}
          style={{ transformBox: "fill-box", animationDelay: `${b.d}ms` }}
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* A pencil that keeps underlining a word                                      */
/* -------------------------------------------------------------------------- */

const UNDERLINE = "M4 14 C 40 6, 70 18, 104 11 S 170 7, 196 12";

export function PencilUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      {children}
      {/* Rests (reduced motion) on a frame where the line is drawn and the pencil has left. */}
      <svg viewBox="0 0 200 24" className="pointer-events-none absolute -bottom-3 left-0 w-full overflow-visible" data-rest-at="3" aria-hidden>
        <path d={UNDERLINE} pathLength={1} strokeDasharray="1" fill="none" stroke="#6c5ce7" strokeWidth="3.5" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" values="1;1;0;0" keyTimes="0;0.05;0.3;1" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.78;0.9;1" dur="6s" repeatCount="indefinite" />
        </path>
        <g opacity="0">
          <animateMotion path={UNDERLINE} keyPoints="0;0;1;1" keyTimes="0;0.05;0.3;1" calcMode="linear" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.04;0.3;0.4;1" dur="6s" repeatCount="indefinite" />
          {/* Tip at the origin, body leaning up and to the right */}
          <g transform="rotate(-40)">
            <path d="M0 0 L5 -3 L5 3 Z" fill="#f7d9a8" />
            <path d="M0 0 L2 -1.2 L2 1.2 Z" fill="#11132a" />
            <rect x="5" y="-3" width="26" height="6" fill="#ff8fb1" />
            <rect x="31" y="-3" width="5" height="6" rx="1.5" fill="#11132a" />
          </g>
        </g>
      </svg>
    </span>
  );
}
