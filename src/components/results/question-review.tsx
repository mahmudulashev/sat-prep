"use client";

import { Check, ChevronDown, Flag, Minus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Rich, StimulusBlocks } from "@/components/exam/rich-text";
import { LETTERS } from "@/lib/exam/constants";
import type { ModuleSummary, ResultItem } from "@/lib/exam/types";
import { cn, formatDuration } from "@/lib/utils";

type Filter = "all" | "incorrect" | "flagged";

export function QuestionReview({ items, modules }: { items: ResultItem[]; modules: ModuleSummary[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(null);

  // Split items back into their modules for per-module numbering.
  const groups = useMemo(
    () =>
      modules.map((m, i) => {
        const start = modules.slice(0, i).reduce((sum, prev) => sum + prev.question_count, 0);
        return { key: i, title: `Module ${i + 1}: ${m.title}`, items: items.slice(start, start + m.question_count) };
      }),
    [items, modules],
  );

  const counts = {
    all: items.length,
    incorrect: items.filter((i) => !i.is_correct).length,
    flagged: items.filter((i) => i.flagged).length,
  };

  const visible = (item: ResultItem) =>
    filter === "all" || (filter === "incorrect" && !item.is_correct) || (filter === "flagged" && item.flagged);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["all", "incorrect", "flagged"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold capitalize transition",
              filter === f ? "bg-ink text-white" : "bg-canvas text-ink-2 hover:bg-line",
            )}
          >
            {f === "all" ? "All questions" : f === "incorrect" ? "Incorrect" : "Marked for review"}
            <span className="ml-1.5 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {groups.map((group) => {
          const rows = group.items.map((item, index) => ({ item, index })).filter(({ item }) => visible(item));
          if (!rows.length) return null;
          return (
            <section key={group.key}>
              <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">{group.title}</h3>
              <div className="overflow-hidden rounded-2xl border border-line">
                <table className="w-full text-left text-sm">
                  <thead className="bg-canvas text-xs text-muted">
                    <tr>
                      <th className="w-14 px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Skill</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Difficulty</th>
                      <th className="px-4 py-3 font-semibold">Your answer</th>
                      <th className="px-4 py-3 font-semibold">Correct</th>
                      <th className="hidden px-4 py-3 font-semibold sm:table-cell">Time</th>
                      <th className="w-10 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, index }) => (
                      <ReviewRow
                        key={item.id}
                        item={item}
                        number={index + 1}
                        open={open === item.id}
                        onToggle={() => setOpen(open === item.id ? null : item.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        {groups.every((g) => !g.items.some(visible)) && (
          <p className="rounded-2xl bg-canvas p-6 text-center text-sm text-muted">No questions match this filter.</p>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ item, number, open, onToggle }: { item: ResultItem; number: number; open: boolean; onToggle: () => void }) {
  const status = item.user_answer ? (item.is_correct ? "correct" : "incorrect") : "skipped";
  return (
    <>
      <tr className="cursor-pointer border-t border-line transition hover:bg-canvas/60" onClick={onToggle}>
        <td className="px-4 py-3">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-lg text-xs font-bold",
              status === "correct" && "bg-[#dcf5e6] text-success",
              status === "incorrect" && "bg-[#fde4e5] text-danger",
              status === "skipped" && "bg-canvas text-muted",
            )}
            aria-label={status}
          >
            {number}
          </span>
        </td>
        <td className="px-4 py-3">
          <p className="font-medium text-ink">{item.skill}</p>
          <p className="text-xs text-muted">{item.domain}</p>
        </td>
        <td className="hidden px-4 py-3 capitalize md:table-cell">
          <DifficultyPill level={item.difficulty} />
        </td>
        <td className="px-4 py-3">
          <span className="flex items-center gap-1.5 font-semibold">
            {status === "correct" && <Check className="size-4 text-success" />}
            {status === "incorrect" && <X className="size-4 text-danger" />}
            {status === "skipped" && <Minus className="size-4 text-muted" />}
            {item.user_answer || "—"}
            {item.flagged && <Flag className="size-3.5 text-bb-review" aria-label="Marked for review" />}
          </span>
        </td>
        <td className="px-4 py-3 font-semibold">{item.correct_answer}</td>
        <td className="hidden px-4 py-3 text-muted tabular-nums sm:table-cell">{formatDuration(item.time_spent)}</td>
        <td className="px-2 py-3">
          <ChevronDown className={cn("size-4 text-muted transition", open && "rotate-180")} />
        </td>
      </tr>
      {open && (
        <tr className="border-t border-line bg-[#fbfbfe]">
          <td colSpan={7} className="px-4 py-6 sm:px-8">
            <div className="grid gap-8 font-serif text-[0.97rem] leading-relaxed text-bb-ink lg:grid-cols-2">
              {item.stimulus.length > 0 && <StimulusBlocks blocks={item.stimulus} />}
              <div className={cn(item.stimulus.length === 0 && "lg:col-span-2")}>
                <Rich text={item.prompt} />
                {item.choices ? (
                  <div className="mt-4 space-y-2.5">
                    {item.choices.map((choice, i) => {
                      const letter = LETTERS[i];
                      const isCorrect = letter === item.correct_answer;
                      const isYours = letter === item.user_answer;
                      return (
                        <div
                          key={letter}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                            isCorrect && "border-success bg-[#effaf3]",
                            isYours && !isCorrect && "border-danger bg-[#fdf0f0]",
                            !isCorrect && !isYours && "border-line bg-white",
                          )}
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded-full border font-exam text-xs font-bold">
                            {letter}
                          </span>
                          <span className="flex-1">
                            <Rich text={choice} />
                          </span>
                          {isCorrect && <span className="font-sans text-xs font-bold text-success">Correct</span>}
                          {isYours && !isCorrect && <span className="font-sans text-xs font-bold text-danger">Your answer</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 font-sans text-sm">
                    Your answer: <strong>{item.user_answer || "—"}</strong> · Correct answer: <strong>{item.correct_answer}</strong>
                  </p>
                )}
                <div className="mt-5 rounded-xl bg-brand-soft/60 p-4 font-sans text-sm leading-relaxed text-ink-2">
                  <p className="mb-1 font-bold text-ink">Explanation</p>
                  <Rich text={item.explanation} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DifficultyPill({ level }: { level: string }) {
  const bars = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-2">
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((b) => (
          <span key={b} className={cn("w-1 rounded-sm", b <= bars ? "bg-ink" : "bg-line")} style={{ height: 4 + b * 3 }} />
        ))}
      </span>
      {level}
    </span>
  );
}
