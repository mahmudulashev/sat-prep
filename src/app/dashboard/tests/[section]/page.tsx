import { ArrowRight, BookOpenCheck, Calculator, Clock, Coffee, Layers, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionArt } from "@/components/section-art";
import { getDashboardData, isRunning, type AttemptSummary } from "@/lib/dashboard";
import { isSection, SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { formSize, moduleSize } from "@/lib/exam/forms";
import { getUsage, listTests } from "@/lib/exam/server";
import type { Section, TestForm } from "@/lib/exam/types";
import { cn, formatDate } from "@/lib/utils";

const TAB: Record<Section, { label: string; title: string; icon: typeof Calculator }> = {
  math: { label: "Math", title: "Math mock tests", icon: Calculator },
  english: { label: "Reading and Writing", title: "Reading and Writing mock tests", icon: BookOpenCheck },
  general: { label: "Full-length", title: "Full-length mock tests", icon: Layers },
};

export async function generateMetadata({ params }: PageProps<"/dashboard/tests/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? TAB[section].title : "Tests" };
}

export default async function SectionTestsPage({ params }: PageProps<"/dashboard/tests/[section]">) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  const [{ attempts }, allTests, usage] = await Promise.all([getDashboardData(), listTests(), getUsage().catch(() => null)]);
  const tests = allTests.filter((t) => t.section === section);
  const sectionAttempts = attempts.filter((a) => a.section === section);
  const done = sectionAttempts.filter((a) => a.status === "completed");
  const best = Math.max(0, ...done.map((a) => a.score ?? 0));
  const meta = SECTION_META[section];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Tests</h2>
          <p className="mt-1 text-muted">Adaptive mock tests in the digital SAT format, built from official questions.</p>
        </div>
        {usage && (
          <p className="rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-card ring-1 ring-line">
            {usage.remaining} of {usage.limit} tests left today
          </p>
        )}
      </div>

      <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-2xl bg-surface p-1.5 shadow-card ring-1 ring-line sm:w-fit" aria-label="Test sections">
        {SECTIONS.map((s) => {
          const { label, icon: Icon } = TAB[s];
          const active = s === section;
          return (
            <Link
              key={s}
              href={`/dashboard/tests/${s}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                active ? "bg-ink text-white shadow-sm" : "text-ink-2 hover:bg-canvas",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-6 grid overflow-hidden rounded-3xl bg-surface shadow-card md:grid-cols-[18rem_1fr]">
        <SectionArt section={section} className="aspect-[16/9] md:aspect-auto" />
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
          <div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: meta.soft, color: meta.accent }}>
              {meta.scoreRange}
            </span>
            <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{TAB[section].title}</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              {section === "general"
                ? "Reading and Writing, a 10-minute break, then Math. In each section, Module 2 gets easier or harder depending on how you did in Module 1."
                : "Module 2 gets easier or harder depending on how you did in Module 1, just like test day."}
            </p>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-2">
            <Stat label="Mock tests" value={String(tests.length)} />
            <Stat label="Completed" value={String(done.length)} />
            <Stat label="Best score" value={best ? String(best) : "—"} icon={<Trophy className="size-3" />} />
          </dl>
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {tests.map((test, i) => (
          <MockCard key={test.id} test={test} index={i + 1} attempts={sectionAttempts.filter((a) => a.testId === test.id)} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-canvas px-3 py-2.5">
      <dt className="flex items-center gap-1 text-xs text-muted">
        {icon} {label}
      </dt>
      <dd className="text-lg font-extrabold">{value}</dd>
    </div>
  );
}

function MockCard({ test, index, attempts }: { test: TestForm; index: number; attempts: AttemptSummary[] }) {
  const meta = SECTION_META[test.section];
  const active = attempts.find(isRunning);
  const done = attempts.filter((a) => a.status === "completed");
  const best = Math.max(0, ...done.map((a) => a.score ?? 0));
  const minutes = test.modules.reduce((n, m) => n + m.duration_seconds / 60, 0);
  const status = active ? "In progress" : done.length ? "Completed" : "New";

  // Module numbers restart for each section: "Math · Module 1".
  const outline = test.modules.map((m, i) => ({
    ...m,
    number: test.modules.slice(0, i + 1).filter((x) => x.subject === m.subject).length,
  }));

  return (
    <article className="flex flex-col rounded-3xl bg-surface p-6 shadow-card ring-1 ring-transparent transition hover:ring-line">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-12 place-items-center rounded-2xl text-xl font-extrabold"
          style={{ background: meta.soft, color: meta.accent }}
        >
          {index}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6875rem] font-bold text-lime">Adaptive</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.6875rem] font-bold",
              status === "In progress" && "border-general/40 bg-general-soft text-[#b86e00]",
              status === "Completed" && "border-english/40 bg-english-soft text-[#0b8577]",
              status === "New" && "border-brand/30 bg-brand-soft text-brand",
            )}
          >
            {status}
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-extrabold tracking-tight">{test.title}</h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Layers className="size-3.5" /> {formSize(test)} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" /> {minutes} min
        </span>
      </p>

      <ol className="mt-5 space-y-2">
        {outline.map((m, i) => (
          <li key={i}>
            {m.break_seconds ? (
              <p className="mb-2 flex items-center gap-2 px-1 text-xs text-muted">
                <Coffee className="size-3.5" /> {m.break_seconds / 60}-minute break
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2 text-sm">
              <span className="font-medium">
                {m.subject === "english" ? "Reading & Writing" : "Math"} · Module {m.number}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {moduleSize(m)}q · {m.duration_seconds / 60}m{m.adaptive ? " · adaptive" : ""}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-auto pt-6">
        {done.length > 0 && (
          <p className="mb-3 flex items-center justify-between text-xs text-muted">
            <span>Last taken {formatDate(done[0].submittedAt ?? done[0].startedAt)}</span>
            <span className="font-bold text-ink">Best {best}</span>
          </p>
        )}
        <Link
          href={`/exam/${test.section}?test=${test.id}`}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition",
            active ? "bg-general text-white hover:brightness-95" : "bg-ink text-white hover:bg-ink-2",
          )}
        >
          {active ? "Resume" : done.length ? "Take again" : "Start test"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
