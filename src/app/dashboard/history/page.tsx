import { ArrowUpRight, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAttemptButton } from "@/components/dashboard/delete-attempt-button";
import { SectionArt } from "@/components/section-art";
import { getDashboardData } from "@/lib/dashboard";
import { isSection, SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { cn, formatDate, formatDuration, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage({ searchParams }: PageProps<"/dashboard/history">) {
  const { section } = await searchParams;
  const filter = typeof section === "string" && isSection(section) ? section : null;
  const { completed } = await getDashboardData();
  const rows = filter ? completed.filter((a) => a.section === filter) : completed;

  return (
    <div>
      <h2 className="text-3xl font-extrabold tracking-tight">History</h2>
      <p className="mt-1 text-muted">Every completed test, with a full score report for each.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/dashboard/history" active={!filter} label="All" count={completed.length} />
        {SECTIONS.map((s) => (
          <FilterChip
            key={s}
            href={`/dashboard/history?section=${s}`}
            active={filter === s}
            label={SECTION_META[s].name}
            count={completed.filter((a) => a.section === s).length}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center shadow-card">
          <p className="font-semibold">No completed tests yet.</p>
          <Link href="/dashboard/tests" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
            Browse tests
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl bg-surface shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-5 py-4 font-semibold">Test</th>
                <th className="hidden px-5 py-4 font-semibold md:table-cell">Date</th>
                <th className="px-5 py-4 font-semibold">Score</th>
                <th className="hidden px-5 py-4 font-semibold sm:table-cell">R&amp;W</th>
                <th className="hidden px-5 py-4 font-semibold sm:table-cell">Math</th>
                <th className="hidden px-5 py-4 font-semibold xl:table-cell">Accuracy</th>
                <th className="hidden px-5 py-4 font-semibold xl:table-cell">Time</th>
                <th className="w-24 px-3 py-4 sm:px-5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((a) => (
                <tr key={a.id} className="transition hover:bg-canvas/60">
                  <td className="py-3.5 pr-3 pl-4 sm:px-5">
                    <Link href={`/results/${a.id}`} className="flex items-center gap-3">
                      <SectionArt section={a.section} className="size-10 shrink-0 rounded-xl" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{a.testTitle}</span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          {SECTION_META[a.section].name}
                          {a.strikes > 0 && (
                            <span className="flex items-center gap-0.5 text-danger">
                              · <ShieldAlert className="size-3" /> {a.strikes}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3.5 whitespace-nowrap text-muted md:table-cell">{formatDate(a.submittedAt ?? a.startedAt)}</td>
                  <td className="px-3 py-3.5 text-base font-extrabold tabular-nums sm:px-5">{a.score}</td>
                  <td className="hidden px-5 py-3.5 tabular-nums sm:table-cell">{a.englishScore ?? "—"}</td>
                  <td className="hidden px-5 py-3.5 tabular-nums sm:table-cell">{a.mathScore ?? "—"}</td>
                  <td className="hidden px-5 py-3.5 xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${percent(a.correct, a.total)}%` }} />
                      </div>
                      <span className="text-xs text-muted tabular-nums">{percent(a.correct, a.total)}%</span>
                    </div>
                  </td>
                  <td className="hidden px-5 py-3.5 whitespace-nowrap text-muted tabular-nums xl:table-cell">{formatDuration(a.secondsSpent)}</td>
                  <td className="px-3 py-3.5 sm:px-5">
                    <div className="flex items-center justify-end gap-1">
                      <DeleteAttemptButton attemptId={a.id} title={a.testTitle} score={a.score} />
                      <Link
                        href={`/results/${a.id}`}
                        className="grid size-8 place-items-center rounded-full bg-canvas hover:bg-ink hover:text-white"
                        aria-label="Open score report"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:bg-canvas",
      )}
    >
      {label} <span className="opacity-60">{count}</span>
    </Link>
  );
}
