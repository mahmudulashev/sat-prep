"use client";

import { Home, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ViolationType } from "@/lib/exam/types";
import { formatClock } from "@/lib/utils";
import { YellowButton, GridLegend, QuestionGrid, type GridItem } from "./chrome";
import { DotsSpinner } from "./icons";

export function CheckYourWork({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: GridItem[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-bb-gray px-6 py-8 font-exam text-bb-ink">
      <h2 className="text-center text-[34px] font-normal">Check Your Work</h2>
      <p className="mt-6 text-center text-[16px]">
        On test day, you won&apos;t be able to move on to the next module until time expires.
      </p>
      <p className="mt-3 text-center text-[16px]">
        For these practice questions, you can click <strong>Next</strong> when you&apos;re ready to move on.
      </p>
      <div className="mx-auto mt-8 max-w-[1000px] rounded-xl bg-white px-8 pt-8 pb-10 shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9a9a9a] pb-4">
          <h3 className="text-[19px] font-bold">{title} Questions</h3>
          <GridLegend />
        </div>
        <div className="pt-8">
          <QuestionGrid items={items} onSelect={onSelect} size="lg" />
        </div>
      </div>
    </div>
  );
}

export function ModuleOver() {
  return (
    <div className="grid h-screen place-items-center bg-bb-gray font-exam text-bb-ink">
      <div className="text-center">
        <h2 className="text-[32px] font-light text-bb-blue">This Module Is Over</h2>
        <p className="mt-8 text-[18px]">All your work has been saved.</p>
        <p className="mt-4 text-[18px]">You&apos;ll move on automatically in just a moment.</p>
        <p className="mt-4 text-[18px]">Do not refresh this page or quit the app.</p>
        <DotsSpinner className="mx-auto mt-14 animate-spin-slow" />
      </div>
    </div>
  );
}

export function BreakScreen({ remaining, onResume, busy }: { remaining: number; onResume: () => void; busy: boolean }) {
  return (
    <div className="grid h-screen place-items-center bg-[#1e1e1e] px-6 font-exam text-white">
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <div className="rounded-xl border border-white/40 px-12 py-8 text-center">
            <p className="text-[18px]">Remaining Break Time:</p>
            <p className="mt-2 text-[64px] font-bold tabular-nums">{formatClock(remaining)}</p>
          </div>
          <YellowButton className="mt-8 px-10" onClick={onResume} disabled={busy}>
            Resume Testing
          </YellowButton>
        </div>
        <div className="space-y-5 text-[17px] leading-relaxed">
          <h2 className="text-[26px] font-bold">Practice Test Break</h2>
          <p>
            You can resume this practice test as soon as you&apos;re ready to move on. On test day, you&apos;ll wait until the
            clock counts down.
          </p>
          <p className="font-bold">Take a Break: Do Not Close Your Device</p>
          <p>
            After the break, the Math section starts with its own timer. Stay in full screen — leaving it is still recorded during
            the break.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Shown while the module clock is paused (signed-in students only); the questions stay hidden until the student resumes. */
export function PausedScreen({ remaining, onResume, busy }: { remaining: number; onResume: () => void; busy: boolean }) {
  return (
    <div className="grid h-screen place-items-center bg-[#1e1e1e] px-6 font-exam text-white">
      <div className="grid w-full max-w-5xl items-center gap-12 md:grid-cols-2">
        <div className="flex flex-col items-center">
          <div className="rounded-xl border border-white/40 px-12 py-8 text-center">
            <p className="text-[18px]">Time Left in This Module:</p>
            <p className="mt-2 text-[64px] font-bold tabular-nums">{formatClock(remaining)}</p>
          </div>
          <YellowButton className="mt-8 px-10" onClick={onResume} disabled={busy}>
            Resume Testing
          </YellowButton>
        </div>
        <div className="space-y-5 text-[17px] leading-relaxed">
          <h2 className="text-[26px] font-bold">Test Paused</h2>
          <p>
            The clock is stopped and your answers are saved. The questions are hidden until you resume, so you can step away
            without losing time.
          </p>
          <p>
            You can leave full screen or close this page while the test is paused. When you come back, the module continues
            with the same time left.
          </p>
          <p className="text-white/60">On test day the clock can&apos;t be paused. This is a practice-only feature.</p>
        </div>
      </div>
    </div>
  );
}

const CONFETTI_COLORS = ["#f7c948", "#d2567a", "#7fd3e0", "#9aa4e8", "#f7c948", "#7fd3e0"];

/** Deterministic pseudo-random numbers, so confetti renders the same on every pass. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONFETTI = (() => {
  const random = seeded(2026);
  return Array.from({ length: 90 }, (_, i) => ({
    left: random() * 100,
    delay: random() * 4,
    duration: 5 + random() * 5,
    size: 4 + random() * 6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: random() * 360,
    round: random() > 0.6,
  }));
})();

export function Finished({ resultHref, homeHref = "/", message }: { resultHref: string; homeHref?: string; message?: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bb-gray font-exam text-bb-ink">
      <style>{`@keyframes confetti-fall{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}`}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {CONFETTI.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 1.8,
              background: p.color,
              borderRadius: p.round ? "50%" : 2,
              transform: `rotate(${p.rotate}deg)`,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      <div className="relative flex h-12 items-center justify-end bg-white px-10">
        <Link href={homeHref} className="flex items-center gap-2 text-[14px] font-medium hover:underline">
          Return to Home <Home className="size-4" />
        </Link>
      </div>

      <div className="relative flex flex-col items-center px-4 pt-10 pb-16">
        <h1 className="text-[34px] font-normal">You&apos;re All Finished!</h1>
        <div className="mt-8 w-full max-w-[480px] rounded-md bg-white px-10 pt-10 pb-10 text-center shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <LaptopSmile />
          <p className="mt-6 text-[16px] leading-relaxed">{message ?? "Your answers have been submitted and scored."}</p>
          <p className="mt-4 text-[16px] leading-relaxed">
            Open your score report to see your scaled scores, a breakdown by skill and a review of every question.
          </p>
          <Link href={resultHref} className="mt-7 inline-block">
            <YellowButton className="px-8">View Your Score</YellowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LaptopSmile() {
  return (
    <svg viewBox="0 0 260 220" className="mx-auto h-48 w-56" aria-hidden>
      <circle cx="130" cy="110" r="108" fill="#f3f5fc" stroke="#e3e7f5" />
      <rect x="40" y="40" width="180" height="120" rx="10" fill="#e8ebf4" stroke="#3b3b3b" strokeWidth="3" />
      <path d="M150 42 L218 42 L218 158 L90 158 Z" fill="#dde1ee" />
      <rect x="60" y="56" width="140" height="92" fill="#fff" stroke="#3b3b3b" strokeWidth="2.5" />
      <circle cx="130" cy="102" r="32" fill="#dbeefe" stroke="#3b3b3b" strokeWidth="3" />
      <path d="M116 96 q4 -6 8 0 M136 96 q4 -6 8 0" stroke="#3b3b3b" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M115 108 q15 16 30 0 z" fill="#fff" stroke="#3b3b3b" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="160" width="224" height="14" rx="4" fill="#cfd4e2" stroke="#3b3b3b" strokeWidth="3" />
      <path d="M22 174 q108 16 216 0" fill="#f6f7fb" stroke="#3b3b3b" strokeWidth="3" />
    </svg>
  );
}

const WARNING_COPY: Record<string, { title: string; body: string }> = {
  "fullscreen-exit": {
    title: "You left full screen",
    body: "The test must stay in full screen. Leaving it is recorded as an integrity event.",
  },
  "tab-hidden": {
    title: "You switched away from the test",
    body: "Switching tabs or apps during the test is recorded as an integrity event.",
  },
  devtools: {
    title: "Developer tools detected",
    body: "Inspecting the page is not allowed during the test. Close developer tools to continue.",
  },
};

export function LockdownOverlay({
  reason,
  strikes,
  maxStrikes,
  needsFullscreen,
  onResume,
}: {
  reason: ViolationType | null;
  strikes: number;
  maxStrikes: number;
  needsFullscreen: boolean;
  onResume: () => void;
}) {
  const copy = WARNING_COPY[reason ?? "fullscreen-exit"] ?? WARNING_COPY["fullscreen-exit"];
  const left = Math.max(0, maxStrikes - strikes);
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#10122e]/80 p-4 font-exam backdrop-blur-xl">
      <div className="w-full max-w-md animate-fade-up rounded-2xl bg-white p-8 text-center text-bb-ink shadow-2xl">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#fdecee] text-bb-review">
          <ShieldAlert className="size-7" />
        </span>
        <h2 className="mt-5 text-[22px] font-bold">{copy.title}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[#444]">{copy.body}</p>
        <div className="mt-5 flex items-center justify-center gap-2" aria-label={`${strikes} of ${maxStrikes} warnings used`}>
          {Array.from({ length: maxStrikes }, (_, i) => (
            <span key={i} className={`h-2 w-10 rounded-full ${i < strikes ? "bg-bb-review" : "bg-[#e5e5e5]"}`} />
          ))}
        </div>
        <p className="mt-3 text-[14px] font-medium">
          {left > 0
            ? `Warning ${strikes} of ${maxStrikes}. After ${maxStrikes}, your test is submitted automatically.`
            : "Your test is being submitted."}
        </p>
        {left > 0 && (
          <YellowButton className="mt-6 px-8" onClick={onResume}>
            {needsFullscreen ? "Return to Full Screen" : "Continue Test"}
          </YellowButton>
        )}
      </div>
    </div>
  );
}

/** Dims the screen except for a horizontal band that follows the pointer. */
export function LineReader({ onClose }: { onClose: () => void }) {
  const [y, setY] = useState(260);
  const band = 76;

  useEffect(() => {
    const onMove = (e: PointerEvent) => setY(e.clientY);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setY((v) => v + 24);
      if (e.key === "ArrowUp") setY((v) => v - 24);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <div className="absolute inset-x-0 top-0 bg-black/55" style={{ height: Math.max(0, y - band / 2) }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/55" style={{ top: y + band / 2 }} />
      <button
        type="button"
        onClick={onClose}
        className="pointer-events-auto absolute right-4 rounded-full bg-white px-3 py-1 font-exam text-xs font-bold shadow"
        style={{ top: y + band / 2 + 8 }}
      >
        Close Line Reader
      </button>
    </div>
  );
}
