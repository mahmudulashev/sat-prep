"use client";

import {
  AlarmClock,
  AlignJustify,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Keyboard,
  LogOut,
  MoreVertical,
  NotebookPen,
  Pause,
  X,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { ModuleSummary, Subject } from "@/lib/exam/types";
import { cn, formatClock } from "@/lib/utils";
import { BookmarkIcon, LocationPinIcon } from "./icons";

export function moduleLabel(modules: ModuleSummary[], index: number) {
  const subjects: Subject[] = [];
  modules.forEach((m) => {
    if (!subjects.includes(m.subject)) subjects.push(m.subject);
  });
  const current = modules[index];
  const section = subjects.indexOf(current.subject) + 1;
  const moduleNumber = modules.slice(0, index + 1).filter((m) => m.subject === current.subject).length;
  const perSection = modules.filter((m) => m.subject === current.subject).length;
  return perSection > 1
    ? `Section ${section}, Module ${moduleNumber}: ${current.title}`
    : `Section ${section}: ${current.title}`;
}

export const DIRECTIONS: Record<Subject, ReactNode> = {
  english: (
    <>
      <p>
        The questions in this section address a number of important reading and writing skills. Each question
        includes one or more passages, which may include a table or graph. Read each passage and question
        carefully, and then choose the best answer to the question based on the passage(s).
      </p>
      <p>All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.</p>
    </>
  ),
  math: (
    <>
      <p>
        The questions in this section address a number of important math skills. Use of a calculator is
        permitted for all questions. A reference sheet, calculator, and these directions can be accessed
        throughout the test.
      </p>
      <p>Unless otherwise indicated:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>All variables and expressions represent real numbers.</li>
        <li>Figures provided are drawn to scale.</li>
        <li>All figures lie in a plane.</li>
        <li>
          The domain of a given function <i>f</i> is the set of all real numbers <i>x</i> for which <i>f</i>(<i>x</i>)
          is a real number.
        </li>
      </ul>
      <p>
        For multiple-choice questions, solve each problem and choose the correct answer from the choices provided.
        Each multiple-choice question has a single correct answer.
      </p>
      <p>
        For student-produced response questions, solve each problem and enter your answer following the directions
        shown next to the question.
      </p>
    </>
  ),
};

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const id = window.setTimeout(() => document.addEventListener("pointerdown", onDown), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return ref;
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

type Tool = "highlights" | "calculator" | "reference";

export function ExamHeader({
  title,
  subject,
  remaining,
  timerHidden,
  onToggleTimer,
  directionsOpen,
  onToggleDirections,
  activeTools,
  onTool,
  moreOpen,
  onToggleMore,
  onMore,
  lineReaderOn,
  hideTools,
  onPause,
  pauseBusy,
}: {
  title: string;
  subject: Subject;
  remaining: number;
  timerHidden: boolean;
  onToggleTimer: () => void;
  directionsOpen: boolean;
  onToggleDirections: () => void;
  activeTools: Tool[];
  onTool: (tool: Tool) => void;
  moreOpen: boolean;
  onToggleMore: () => void;
  onMore: (item: "help" | "shortcuts" | "line-reader" | "exit") => void;
  lineReaderOn: boolean;
  hideTools?: boolean;
  /** Stops the module clock; the button is hidden when not given. */
  onPause?: () => void;
  pauseBusy?: boolean;
}) {
  const warning = remaining <= 5 * 60;
  const directionsRef = useDismiss(directionsOpen, onToggleDirections);
  const moreRef = useDismiss(moreOpen, onToggleMore);

  return (
    <header className="relative z-30 shrink-0 bg-bb-header font-exam text-bb-ink">
      <div className="grid h-[76px] grid-cols-[1fr_auto_1fr] items-center px-6 sm:px-10">
        <div className="relative min-w-0">
          <h1 className="truncate text-[19px] font-medium tracking-[0.1px]">{title}</h1>
          {!hideTools && (
            <button
              type="button"
              onClick={onToggleDirections}
              className="mt-1.5 flex items-center gap-1 text-[14px] font-medium hover:underline"
              aria-expanded={directionsOpen}
            >
              Directions {directionsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
          )}

          {directionsOpen && (
            <div
              ref={directionsRef}
              className="absolute top-[calc(100%+14px)] left-0 z-50 w-[min(900px,calc(100vw-48px))] animate-fade-up rounded-[3px] bg-white shadow-[0_6px_28px_rgba(0,0,0,0.25)]"
            >
              <span className="absolute -top-2 left-10 size-4 rotate-45 bg-white" />
              <div className="max-h-[70vh] space-y-3 overflow-y-auto px-8 pt-8 pb-6 font-serif text-[16px] leading-[1.6]">
                {DIRECTIONS[subject]}
              </div>
              <div className="flex justify-end px-8 pb-6">
                <YellowButton onClick={onToggleDirections}>Close</YellowButton>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          {timerHidden ? (
            <button type="button" onClick={onToggleTimer} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Show timer">
              <AlarmClock className="size-6" />
            </button>
          ) : (
            <span className={cn("text-[22px] font-bold tabular-nums", warning && "text-bb-review")} role="timer" aria-live="off">
              {formatClock(remaining)}
            </span>
          )}
          <div className="mt-0.5 flex gap-1.5">
            <button
              type="button"
              onClick={onToggleTimer}
              className="rounded-full border border-bb-ink px-3 py-px text-[12px] font-bold hover:bg-black/5"
            >
              {timerHidden ? "Show" : "Hide"}
            </button>
            {onPause && (
              <button
                type="button"
                onClick={onPause}
                disabled={pauseBusy}
                className="flex items-center gap-1 rounded-full border border-bb-ink px-3 py-px text-[12px] font-bold hover:bg-black/5 disabled:opacity-50"
              >
                <Pause className="size-3" fill="currentColor" strokeWidth={0} /> Pause
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-5">
          {!hideTools && subject === "english" && (
            <ToolButton label="Highlights & Notes" active={activeTools.includes("highlights")} onClick={() => onTool("highlights")}>
              <NotebookPen className="size-5" strokeWidth={1.6} />
            </ToolButton>
          )}
          {!hideTools && subject === "math" && (
            <>
              <ToolButton label="Calculator" active={activeTools.includes("calculator")} onClick={() => onTool("calculator")}>
                <CalculatorGlyph />
              </ToolButton>
              <ToolButton label="Reference" active={activeTools.includes("reference")} onClick={() => onTool("reference")}>
                <span className="font-serif text-[17px] font-bold italic">
                  x<sup className="text-[10px]">2</sup>
                </span>
              </ToolButton>
            </>
          )}
          <div className="relative">
            <ToolButton label="More" active={moreOpen} onClick={onToggleMore}>
              <MoreVertical className="size-5" />
            </ToolButton>
            {moreOpen && (
              <div
                ref={moreRef}
                className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 animate-fade-up rounded-md bg-white py-2 shadow-[0_6px_28px_rgba(0,0,0,0.25)]"
              >
                <MenuItem icon={<CircleHelp className="size-5" />} onClick={() => onMore("help")}>
                  Help
                </MenuItem>
                <MenuItem icon={<Keyboard className="size-5" />} onClick={() => onMore("shortcuts")}>
                  Shortcuts
                </MenuItem>
                <MenuItem icon={<AlignJustify className="size-5" />} onClick={() => onMore("line-reader")}>
                  Line Reader {lineReaderOn && <span className="ml-auto text-xs font-bold text-bb-blue">ON</span>}
                </MenuItem>
                <MenuItem icon={<LogOut className="size-5" />} onClick={() => onMore("exit")}>
                  Exit the Exam
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bb-dashed" />
    </header>
  );
}

function CalculatorGlyph() {
  return (
    <svg viewBox="0 0 16 20" className="h-5 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="1" width="14" height="18" rx="2" />
      <rect x="3.5" y="3.5" width="9" height="4" rx="0.5" />
      <path d="M4 11h1M7.5 11h1M11 11h1M4 14h1M7.5 14h1M11 14h1M4 17h1M7.5 17h1M11 17h1" strokeLinecap="round" />
    </svg>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex flex-col items-center gap-0.5 text-[12.5px] font-medium"
    >
      <span className="grid h-6 place-items-center">{children}</span>
      <span className={cn("border-b-2 pb-px", active ? "border-bb-ink" : "border-transparent")}>{label}</span>
    </button>
  );
}

function MenuItem({ icon, onClick, children }: { icon: ReactNode; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 px-5 py-3 text-left text-[16px] hover:bg-[#f2f2f2]">
      {icon}
      {children}
    </button>
  );
}

export function YellowButton({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "h-11 rounded-full border border-bb-ink bg-bb-yellow px-6 font-exam text-[15px] font-bold text-bb-ink hover:brightness-95 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PracticeBanner() {
  return (
    <div className="mx-6 shrink-0 rounded-b-[14px] bg-bb-navy py-2 text-center font-exam text-[12.5px] font-bold tracking-wide text-white sm:mx-10">
      THIS IS A PRACTICE TEST
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                      */
/* -------------------------------------------------------------------------- */

export function ExamFooter({
  studentName,
  navLabel,
  navOpen,
  onToggleNav,
  canBack,
  onBack,
  onNext,
  nextDisabled,
  navigator,
}: {
  studentName: string;
  navLabel?: string;
  navOpen: boolean;
  onToggleNav: () => void;
  canBack: boolean;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  navigator?: ReactNode;
}) {
  return (
    <footer className="relative z-30 shrink-0 bg-bb-header font-exam text-bb-ink">
      <div className="bb-dashed" />
      <div className="grid h-[62px] grid-cols-[1fr_auto_1fr] items-center px-6 sm:px-10">
        <span className="truncate text-[19px] font-medium">{studentName}</span>
        <div className="relative">
          {navLabel && (
            <button
              type="button"
              onClick={onToggleNav}
              className="flex h-10 items-center gap-2 rounded-md bg-[#1e1e1e] px-4 text-[15px] font-bold text-white hover:bg-black"
              aria-expanded={navOpen}
            >
              {navLabel}
              {navOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          )}
          {navOpen && navigator}
        </div>
        <div className="flex justify-end gap-3">
          {canBack && <BlueButton onClick={onBack}>Back</BlueButton>}
          <BlueButton onClick={onNext} disabled={nextDisabled}>
            Next
          </BlueButton>
        </div>
      </div>
    </footer>
  );
}

export function BlueButton({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "h-11 min-w-20 rounded-full bg-bb-blue px-6 text-[15px] font-bold text-white hover:bg-bb-blue-600 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Question grid (navigator popover + Check Your Work)                         */
/* -------------------------------------------------------------------------- */

export type GridItem = { number: number; answered: boolean; flagged: boolean; current: boolean };

export function QuestionGrid({
  items,
  onSelect,
  size = "sm",
}: {
  items: GridItem[];
  onSelect: (index: number) => void;
  size?: "sm" | "lg";
}) {
  return (
    <div className={cn("flex flex-wrap", size === "lg" ? "gap-x-8 gap-y-6" : "gap-x-5 gap-y-5")}>
      {items.map((item, index) => (
        <button
          key={item.number}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "relative grid place-items-center font-bold",
            size === "lg" ? "size-11 text-[24px]" : "size-9 text-[17px]",
            item.answered ? "bg-bb-blue text-white" : "border border-dashed border-bb-ink text-bb-blue",
            "hover:outline-2 hover:outline-offset-2 hover:outline-bb-blue",
          )}
          aria-label={`Question ${item.number}${item.answered ? ", answered" : ", unanswered"}${item.flagged ? ", marked for review" : ""}`}
        >
          {item.number}
          {item.current && <LocationPinIcon className="absolute -top-5 left-1/2 -translate-x-1/2" />}
          {item.flagged && <BookmarkIcon filled className="absolute -top-1.5 -right-1.5 h-3.5 w-3" />}
        </button>
      ))}
    </div>
  );
}

export function GridLegend({ showCurrent }: { showCurrent?: boolean }) {
  return (
    <div className="flex items-center gap-5 text-[14px]">
      {showCurrent && (
        <span className="flex items-center gap-1.5">
          <LocationPinIcon /> Current
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="size-4 border border-dashed border-bb-ink" /> Unanswered
      </span>
      <span className="flex items-center gap-1.5">
        <BookmarkIcon filled /> For Review
      </span>
    </div>
  );
}

export function NavigatorPopover({
  title,
  items,
  onSelect,
  onClose,
  onReviewPage,
}: {
  title: string;
  items: GridItem[];
  onSelect: (index: number) => void;
  onClose: () => void;
  onReviewPage: () => void;
}) {
  const ref = useDismiss(true, onClose);
  return (
    <div
      ref={ref}
      className="absolute bottom-[calc(100%+18px)] left-1/2 z-50 w-[min(640px,calc(100vw-32px))] -translate-x-1/2 animate-fade-up rounded-[10px] bg-white px-7 pt-6 pb-6 shadow-[0_6px_32px_rgba(0,0,0,0.28)]"
    >
      <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white" />
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[17px] font-bold">{title} Questions</h2>
        <button type="button" onClick={onClose} className="-mt-1 rounded p-1 hover:bg-black/5" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="mt-3 border-b border-[#bfbfbf] pb-3">
        <GridLegend showCurrent />
      </div>
      <div className="max-h-[46vh] overflow-y-auto pt-7 pb-2">
        <QuestionGrid items={items} onSelect={onSelect} />
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onReviewPage}
          className="h-10 rounded-full border-2 border-bb-blue px-6 text-[15px] font-bold text-bb-blue hover:bg-bb-blue/5"
        >
          Go to Review Page
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

export function ExamModal({
  title,
  children,
  onClose,
  actions,
  wide,
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  actions?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/45 p-4 font-exam text-bb-ink">
      <div className={cn("w-full animate-fade-up rounded-lg bg-white shadow-2xl", wide ? "max-w-2xl" : "max-w-lg")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between border-b border-[#e3e3e3] px-7 py-5">
          <h2 className="text-[20px] font-bold">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/5" aria-label="Close">
              <X className="size-5" />
            </button>
          )}
        </div>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto px-7 py-5 text-[15.5px] leading-relaxed">{children}</div>
        {actions && <div className="flex justify-end gap-3 px-7 pb-6">{actions}</div>}
      </div>
    </div>
  );
}
