import { ArrowRight, BookOpenCheck, Calculator, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardData, isRunning, type AttemptSummary } from "@/lib/dashboard";
import { isSection, SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { formSize } from "@/lib/exam/forms";
import { getUsage, listTests } from "@/lib/exam/server";
import type { Section, TestForm } from "@/lib/exam/types";
import { cn, formatDate } from "@/lib/utils";

const TAB: Record<Section, { label: string; title: string; icon: typeof Calculator }> = {
  math: { label: "Math", title: "Math", icon: Calculator },
  english: { label: "Reading and Writing", title: "Reading and Writing", icon: BookOpenCheck },
  general: { label: "Full-length", title: "Full-length", icon: Layers },
};

export async function generateMetadata({ params }: PageProps<"/dashboard/tests/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? `${TAB[section].title} tests` : "Tests" };
}

export default async function SectionTestsPage({ params }: PageProps<"/dashboard/tests/[section]">) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  const [{ attempts }, allTests, usage] = await Promise.all([getDashboardData(), listTests(), getUsage().catch(() => null)]);
  const tests = allTests.filter((t) => t.section === section);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Tests</h1>
        {usage && (
          <p className="text-sm font-semibold text-muted">
            {usage.unlimited ? "Unlimited" : `${usage.remaining} of ${usage.limit} left today`}
          </p>
        )}
      </div>

      <nav className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Test sections">
        {SECTIONS.map((s) => {
          const { label, icon: Icon } = TAB[s];
          const active = s === section;
          return (
            <Link
              key={s}
              href={`/dashboard/tests/${s}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 pb-3 text-sm font-semibold transition",
                active ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="mt-6 text-sm text-muted">
        Adaptive mock tests built from official questions. Module 2 gets easier or harder depending on your Module 1.
      </p>

      <ul className="mt-4 space-y-3">
        {tests.map((test, i) => (
          <MockRow key={test.id} test={test} index={i + 1} attempts={attempts.filter((a) => a.testId === test.id)} />
        ))}
      </ul>
    </div>
  );
}

function duration(test: TestForm) {
  const minutes = test.modules.reduce((n, m) => n + m.duration_seconds / 60, 0);
  const text = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
  return test.modules.some((m) => m.break_seconds) ? `${text} + break` : text;
}

function MockRow({ test, index, attempts }: { test: TestForm; index: number; attempts: AttemptSummary[] }) {
  const meta = SECTION_META[test.section];
  const active = attempts.find(isRunning);
  const done = attempts.filter((a) => a.status === "completed");
  const best = Math.max(0, ...done.map((a) => a.score ?? 0));

  return (
    <li className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line/60 sm:p-5">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl text-lg font-extrabold"
        style={{ background: meta.soft, color: meta.accent }}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{test.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted">
          {formSize(test)} questions · {duration(test)}
          {done.length > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-ink-2">Best {best}</span> · {formatDate(done[0].submittedAt ?? done[0].startedAt)}
            </>
          )}
        </p>
      </div>
      <Link
        href={`/exam/${test.section}?test=${test.id}`}
        className={cn(
          "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition sm:px-5",
          active ? "bg-general text-white hover:brightness-95" : done.length ? "bg-canvas text-ink ring-1 ring-line hover:bg-line/60" : "bg-ink text-white hover:bg-ink-2",
        )}
      >
        {active ? "Resume" : done.length ? "Retake" : "Start"}
        <ArrowRight className="size-4" />
      </Link>
    </li>
  );
}
