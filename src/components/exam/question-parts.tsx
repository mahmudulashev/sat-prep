"use client";

import katex from "katex";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { LETTERS } from "@/lib/exam/constants";
import type { ChoiceLetter, RichText } from "@/lib/exam/types";
import { cn } from "@/lib/utils";
import { BookmarkIcon, EliminatorIcon, StrikeLetterIcon } from "./icons";
import { Rich } from "./rich-text";

export function QuestionBar({
  number,
  flagged,
  onToggleFlag,
  eliminateMode,
  onToggleEliminate,
  showEliminator,
}: {
  number: number;
  flagged: boolean;
  onToggleFlag: () => void;
  eliminateMode: boolean;
  onToggleEliminate: () => void;
  showEliminator: boolean;
}) {
  return (
    <div className="font-exam">
      <div className="flex h-8 items-center bg-[#f0f0f0] pr-2">
        <span className="grid h-full w-8 place-items-center bg-[#1e1e1e] text-[17px] font-bold text-white">{number}</span>
        <button
          type="button"
          onClick={onToggleFlag}
          aria-pressed={flagged}
          className="ml-3 flex items-center gap-1.5 text-[14.5px] hover:underline"
        >
          <BookmarkIcon filled={flagged} />
          Mark for Review
        </button>
        {showEliminator && (
          <button
            type="button"
            onClick={onToggleEliminate}
            aria-pressed={eliminateMode}
            aria-label="Cross out answer choices"
            title="Cross out answer choices"
            className={cn(
              "ml-auto grid h-7 w-8 place-items-center rounded-[3px] border",
              eliminateMode ? "border-bb-blue bg-bb-blue text-white" : "border-bb-ink bg-white text-bb-ink",
            )}
          >
            <EliminatorIcon />
          </button>
        )}
      </div>
      <div className="bb-dashed-thin" />
    </div>
  );
}

export function Choices({
  choices,
  selected,
  eliminated,
  eliminateMode,
  onSelect,
  onEliminate,
}: {
  choices: RichText[];
  selected: string | undefined;
  eliminated: ChoiceLetter[];
  eliminateMode: boolean;
  onSelect: (letter: ChoiceLetter) => void;
  onEliminate: (letter: ChoiceLetter) => void;
}) {
  return (
    <div className="mt-5 space-y-4" role="radiogroup">
      {choices.map((choice, i) => {
        const letter = LETTERS[i];
        const isSelected = selected === letter;
        const isOut = eliminated.includes(letter);
        return (
          <div key={letter} className="flex items-center gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(letter)}
              className={cn(
                "relative flex min-h-[50px] flex-1 items-center gap-4 rounded-lg border bg-white px-3 py-2.5 text-left font-serif text-[16px] leading-snug transition-colors",
                isSelected ? "border-bb-blue shadow-[inset_0_0_0_2px_var(--color-bb-blue)]" : "border-[#1e1e1e] hover:bg-[#fafafa]",
              )}
            >
              <span
                className={cn(
                  "grid size-[27px] shrink-0 place-items-center rounded-full border-[1.6px] font-exam text-[13px] font-bold",
                  isSelected ? "border-bb-blue bg-bb-blue text-white" : "border-[#1e1e1e]",
                  isOut && "border-[#9a9a9a] text-[#9a9a9a]",
                )}
              >
                {letter}
              </span>
              <span className={cn(isOut && "text-[#9a9a9a]")}>
                <Rich text={choice} />
              </span>
              {isOut && <span aria-hidden className="absolute top-1/2 -right-1.5 -left-1.5 h-[1.5px] bg-[#1e1e1e]" />}
            </button>
            {eliminateMode && (
              <div className="grid w-10 shrink-0 place-items-center">
                {isOut ? (
                  <button type="button" onClick={() => onEliminate(letter)} className="font-exam text-[14px] font-bold underline">
                    Undo
                  </button>
                ) : (
                  <button type="button" onClick={() => onEliminate(letter)} aria-label={`Cross out choice ${letter}`} className="rounded-full hover:bg-black/5">
                    <StrikeLetterIcon letter={letter} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const SPR_ALLOWED = /^-?[0-9./]*$/;

export function SprInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const maxLength = value.startsWith("-") ? 6 : 5;
  return (
    <div className="mt-6">
      <label className="relative block w-[110px]">
        <span className="sr-only">Your answer</span>
        <input
          value={value}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          maxLength={maxLength}
          onChange={(e) => {
            const next = e.target.value.replace(/\s/g, "");
            if (SPR_ALLOWED.test(next) && next.length <= (next.startsWith("-") ? 6 : 5)) onChange(next);
          }}
          className="h-[58px] w-full rounded-lg border border-[#1e1e1e] bg-white px-3 pb-2 text-center font-serif text-[20px] outline-none focus:border-bb-blue focus:shadow-[inset_0_0_0_1px_var(--color-bb-blue)]"
        />
        <span aria-hidden className="pointer-events-none absolute right-3 bottom-3 left-3 h-px bg-[#1e1e1e]" />
      </label>
      <p className="mt-10 font-serif text-[20px] font-bold">
        Answer Preview: <AnswerPreview value={value} />
      </p>
    </div>
  );
}

function AnswerPreview({ value }: { value: string }) {
  if (!value) return null;
  const neg = value.startsWith("-");
  const body = neg ? value.slice(1) : value;
  const [num, den] = body.split("/");
  const tex = den !== undefined ? `${neg ? "-" : ""}\\dfrac{${num || "\\square"}}{${den || "\\square"}}` : value;
  return (
    <span
      className="ml-2 font-normal"
      dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false }) }}
    />
  );
}

export function SprDirections() {
  const chip = (s: string) => (
    <code className="rounded-[3px] bg-[#ececec] px-1 py-px font-mono text-[13px] tracking-wider">{s}</code>
  );
  const rows: [ReactNode, string[], string[]][] = [
    ["3.5", ["3.5", "3.50", "7/2"], ["31/2", "3 1/2"]],
    [<Rich key="a" text="$\dfrac{2}{3}$" />, ["2/3", ".6666", ".6667", "0.666", "0.667"], ["0.66", ".66", "0.67", ".67"]],
    [<Rich key="b" text="$-\dfrac{1}{3}$" />, ["-1/3", "-.3333", "-0.333"], ["-.33", "-0.33"]],
  ];
  return (
    <div className="font-serif text-[16px] leading-[1.55]">
      <h2 className="text-[19px] font-bold">Student-produced response directions</h2>
      <ul className="mt-4 list-disc space-y-1.5 pl-8">
        <li>
          If you find <strong>more than one correct answer</strong>, enter only one answer.
        </li>
        <li>
          You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6 characters (including the
          negative sign) for a <strong>negative</strong> answer.
        </li>
        <li>
          If your answer is a <strong>fraction</strong> that doesn&apos;t fit in the provided space, enter the decimal
          equivalent.
        </li>
        <li>
          If your answer is a <strong>decimal</strong> that doesn&apos;t fit in the provided space, enter it by truncating
          or rounding at the fourth digit.
        </li>
        <li>
          If your answer is a <strong>mixed number</strong> (such as <Rich text="$3\tfrac{1}{2}$" />), enter it as an
          improper fraction (7/2) or its decimal equivalent (3.5).
        </li>
        <li>
          Don&apos;t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.
        </li>
      </ul>
      <p className="mt-6 text-center">Examples</p>
      <table className="mx-auto mt-2 border-collapse border border-bb-ink text-center">
        <thead>
          <tr>
            <th className="w-28 border border-bb-ink px-3 py-4 font-normal">Answer</th>
            <th className="w-40 border border-bb-ink px-3 py-4 font-normal">Acceptable ways to enter answer</th>
            <th className="w-40 border border-bb-ink px-3 py-4 font-normal">Unacceptable: will NOT receive credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([answer, ok, bad], i) => (
            <tr key={i}>
              <td className="border border-bb-ink px-3 py-3">{answer}</td>
              <td className="border border-bb-ink px-3 py-3">
                <div className="flex flex-col items-center gap-1.5">{ok.map((s) => <span key={s}>{chip(s)}</span>)}</div>
              </td>
              <td className="border border-bb-ink px-3 py-3">
                <div className="flex flex-col items-center gap-1.5">{bad.map((s) => <span key={s}>{chip(s)}</span>)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Two scrollable panes with the draggable divider used in the test interface. */
export function SplitPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [ratio, setRatio] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setRatio(Math.min(0.72, Math.max(0.28, (e.clientX - rect.left) / rect.width)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0"
      onPointerMove={onPointerMove}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <div className="min-w-0 overflow-y-auto" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>
      <div
        className="relative w-[3px] shrink-0 cursor-col-resize bg-[#8f8f8f]"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
      >
        <button
          type="button"
          aria-label="Resize panes"
          onDoubleClick={() => setRatio(0.5)}
          className="absolute top-[228px] left-1/2 grid h-7 w-3.5 -translate-x-1/2 cursor-col-resize place-items-center rounded-[3px] bg-[#1e1e1e] text-white"
        >
          <svg viewBox="0 0 10 12" className="h-3 w-2.5" fill="currentColor">
            <path d="M0 6l4-4v8zM10 6L6 2v8z" />
          </svg>
        </button>
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto">{right}</div>
    </div>
  );
}
