import { CalendarCheck2, Clock, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionArt } from "@/components/section-art";
import { getDashboardData, isRunning } from "@/lib/dashboard";
import { SECTION_META } from "@/lib/exam/constants";
import { getUsage, listTests } from "@/lib/exam/server";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tests" };

export default async function TestsPage() {
  const [{ attempts }, tests, usage] = await Promise.all([getDashboardData(), listTests(), getUsage().catch(() => null)]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">All tests</h2>
          <p className="mt-1 text-muted">Full digital SAT structure, timed and locked like test day.</p>
        </div>
        {usage && (
          <p className="rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-card ring-1 ring-line">
            {usage.remaining} of {usage.limit} tests left today
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {tests.map((test) => {
          const meta = SECTION_META[test.section];
          const mine = attempts.filter((a) => a.testId === test.id);
          const active = mine.find(isRunning);
          const done = mine.filter((a) => a.status === "completed");
          const best = Math.max(0, ...done.map((a) => a.score ?? 0));
          const questions = test.modules.reduce((n, m) => n + m.question_ids.length, 0);
          const minutes = test.modules.reduce((n, m) => n + m.duration_seconds / 60, 0);
          const status = active ? "In progress" : done.length ? "Completed" : "New";

          return (
            <article key={test.id} className="flex flex-col rounded-3xl bg-surface p-3 shadow-card">
              <SectionArt section={test.section} className="aspect-[16/10] rounded-[1.3rem]" />
              <div className="flex flex-1 flex-col px-3 pt-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg leading-snug font-bold">{test.title}</h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold",
                      status === "In progress" && "border-general/40 bg-general-soft text-[#b86e00]",
                      status === "Completed" && "border-english/40 bg-english-soft text-[#0b8577]",
                      status === "New" && "border-brand/30 bg-brand-soft text-brand",
                    )}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <span>{meta.name}</span>
                  <span className="h-3.5 w-px bg-line" />
                  <span className="flex items-center gap-1">
                    <Layers className="size-3.5" /> {test.modules.length} modules · {questions} questions
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="size-3.5" /> {minutes} minutes · scored {meta.scoreRange}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <CalendarCheck2 className="size-3.5" />
                  {done.length
                    ? `Best ${best} · last taken ${formatDate(done[0].submittedAt ?? done[0].startedAt)}`
                    : "Not taken yet"}
                </p>
                <Link
                  href={`/exam/${test.section}`}
                  className="mt-5 flex h-11 items-center justify-center rounded-2xl border border-line text-sm font-bold transition hover:border-ink hover:bg-ink hover:text-white"
                >
                  {active ? "Resume test" : done.length ? "Take again" : "Start test"}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
