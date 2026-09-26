import { ArrowRight, Clock, Coffee, Layers, Sparkles, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SectionArt } from "@/components/section-art";
import { getDashboardData, isRunning, type AttemptSummary } from "@/lib/dashboard";
import { SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { getUsage, listTests } from "@/lib/exam/server";
import type { Section, TestForm } from "@/lib/exam/types";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tests" };

const SECTION_TITLE: Record<Section, string> = {
  math: "Math",
  english: "Reading and Writing",
  general: "Full-length SAT",
};

export default async function TestsPage() {
  const [{ attempts }, tests, usage] = await Promise.all([getDashboardData(), listTests(), getUsage().catch(() => null)]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Tests</h2>
          <p className="mt-1 text-muted">Full digital SAT structure, timed and locked like test day.</p>
        </div>
        {usage && (
          <p className="rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-card ring-1 ring-line">
            {usage.remaining} of {usage.limit} tests left today
          </p>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => {
          const sectionTests = tests.filter((t) => t.section === section);
          if (!sectionTests.length) return null;
          return (
            <SectionBlock
              key={section}
              section={section}
              tests={sectionTests}
              attempts={attempts.filter((a) => a.section === section)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SectionBlock({ section, tests, attempts }: { section: Section; tests: TestForm[]; attempts: AttemptSummary[] }) {
  const meta = SECTION_META[section];
  const done = attempts.filter((a) => a.status === "completed");
  const best = Math.max(0, ...done.map((a) => a.score ?? 0));

  return (
    <section className="grid overflow-hidden rounded-3xl bg-surface shadow-card lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col p-3">
        <SectionArt section={section} className="aspect-[16/10] rounded-[1.3rem]" />
        <div className="flex flex-1 flex-col px-3 pt-4 pb-3">
          <span className="w-fit rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: meta.soft, color: meta.accent }}>
            {meta.scoreRange}
          </span>
          <h3 className="mt-3 text-xl font-extrabold tracking-tight">{SECTION_TITLE[section]}</h3>
          <p className="mt-1 text-sm text-muted">{meta.tagline}</p>
          <dl className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-canvas px-3 py-2.5">
              <dt className="text-xs text-muted">Attempts</dt>
              <dd className="text-lg font-extrabold">{done.length}</dd>
            </div>
            <div className="rounded-2xl bg-canvas px-3 py-2.5">
              <dt className="flex items-center gap-1 text-xs text-muted">
                <Trophy className="size-3" /> Best
              </dt>
              <dd className="text-lg font-extrabold">{best || "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-line lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm font-semibold text-ink-2">
            {tests.length} {tests.length === 1 ? "test" : "tests"}
          </p>
        </div>
        <ul className="divide-y divide-line border-t border-line">
          {tests.map((test) => (
            <TestRow key={test.id} test={test} attempts={attempts.filter((a) => a.testId === test.id)} />
          ))}
          <li className="px-6 py-5">
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3.5 text-sm text-muted">
              <Sparkles className="size-4 text-brand" />
              More {SECTION_TITLE[section]} practice tests are on the way.
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}

function TestRow({ test, attempts }: { test: TestForm; attempts: AttemptSummary[] }) {
  const active = attempts.find(isRunning);
  const done = attempts.filter((a) => a.status === "completed");
  const questions = test.modules.reduce((n, m) => n + m.question_ids.length, 0);
  const minutes = test.modules.reduce((n, m) => n + m.duration_seconds / 60, 0);
  const hasBreak = test.modules.some((m) => m.break_seconds);
  const status = active ? "In progress" : done.length ? "Completed" : "New";

  return (
    <li className="flex flex-col gap-5 px-6 py-5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold">{test.title}</h4>
          <span
            className={cn(
              "rounded-full border px-2 py-px text-[11px] font-bold",
              status === "In progress" && "border-general/40 bg-general-soft text-[#b86e00]",
              status === "Completed" && "border-english/40 bg-english-soft text-[#0b8577]",
              status === "New" && "border-brand/30 bg-brand-soft text-brand",
            )}
          >
            {status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{test.description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {test.modules.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-lg bg-canvas px-2.5 py-1 text-xs font-medium text-ink-2">
              {m.break_seconds ? <Coffee className="size-3 text-muted" /> : null}
              M{i + 1} · {m.title} · {m.question_ids.length}q · {m.duration_seconds / 60}m
            </span>
          ))}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5" /> {questions} questions
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" /> {minutes} min{hasBreak ? " + 10 min break" : ""}
          </span>
          {done.length > 0 && <span>Last taken {formatDate(done[0].submittedAt ?? done[0].startedAt)}</span>}
        </p>
      </div>

      <Link
        href={`/exam/${test.section}`}
        className={cn(
          "flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition",
          active ? "bg-general text-white hover:brightness-95" : "bg-ink text-white hover:bg-ink-2",
        )}
      >
        {active ? "Resume" : done.length ? "Take again" : "Start test"}
        <ArrowRight className="size-4" />
      </Link>
    </li>
  );
}
