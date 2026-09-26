import { ArrowRight, BookOpenCheck, Calculator, Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionArt } from "@/components/section-art";
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
    <div>
      <PageHeader
        title="Tests"
        description="Adaptive mock tests built from official questions. Module 2 adapts to your Module 1 score."
        action={
          usage && (
            <span className="rounded-full bg-surface px-4 py-2 text-sm font-semibold shadow-card ring-1 ring-line">
              {usage.unlimited ? "Unlimited tests" : `${usage.remaining} of ${usage.limit} left today`}
            </span>
          )
        }
      />

      <nav
        className="no-scrollbar mt-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-surface p-1.5 shadow-card ring-1 ring-line"
        aria-label="Test sections"
      >
        {SECTIONS.map((s) => {
          const { label, icon: Icon } = TAB[s];
          const active = s === section;
          return (
            <Link
              key={s}
              href={`/dashboard/tests/${s}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                active ? "bg-ink text-white shadow-sm" : "text-ink-2 hover:bg-canvas",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-6 grid gap-5 sm:grid-cols-3">
        {tests.map((test, i) => (
          <MockCard key={test.id} test={test} index={i + 1} attempts={attempts.filter((a) => a.testId === test.id)} />
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

function MockCard({ test, index, attempts }: { test: TestForm; index: number; attempts: AttemptSummary[] }) {
  const meta = SECTION_META[test.section];
  const active = attempts.find(isRunning);
  const done = attempts.filter((a) => a.status === "completed");
  const best = Math.max(0, ...done.map((a) => a.score ?? 0));

  return (
    <li className="group flex flex-col overflow-hidden rounded-3xl bg-surface p-2.5 shadow-card ring-1 ring-transparent transition hover:-translate-y-0.5 hover:ring-line">
      <div className="relative">
        <SectionArt section={test.section} className="aspect-[16/8] rounded-2xl" />
        <span className="absolute top-3 left-3 grid size-9 place-items-center rounded-xl bg-white/90 text-base font-extrabold text-ink shadow-sm backdrop-blur">
          {index}
        </span>
        {done.length > 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
            Best {best}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2.5 pt-4 pb-2">
        <p className="font-bold">{test.title}</p>
        <p className="mt-1 text-sm text-muted">
          {formSize(test)} questions · {duration(test)}
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: meta.soft, color: meta.accent }}>
            Adaptive
          </span>
          {active
            ? "In progress"
            : done.length
              ? `Taken ${formatDate(done[0].submittedAt ?? done[0].startedAt)}`
              : "Not taken yet"}
        </p>
        <Link
          href={`/exam/${test.section}?test=${test.id}`}
          className={cn(
            "mt-5 flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition",
            active
              ? "bg-general text-white hover:brightness-95"
              : done.length
                ? "bg-canvas text-ink ring-1 ring-line hover:bg-line/60"
                : "bg-ink text-white hover:bg-ink-2",
          )}
        >
          {active ? "Resume" : done.length ? "Retake" : "Start test"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </li>
  );
}
