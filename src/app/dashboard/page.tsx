import { ArrowUpRight, BookOpenCheck, Clock, Target, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DomainBars, ScoreTrend, Sparkline } from "@/components/charts/charts";
import { SectionArt } from "@/components/section-art";
import { ButtonLink } from "@/components/ui/button";
import { aggregateDomains, getDashboardData, isRunning, type AttemptSummary } from "@/lib/dashboard";
import { SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { getUsage } from "@/lib/exam/server";
import { cn, formatDate, formatDuration, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [{ completed, attempts, profile }, usage] = await Promise.all([getDashboardData(), getUsage().catch(() => null)]);
  const chronological = [...completed].reverse();
  const inProgress = attempts.find(isRunning);

  if (!completed.length) {
    return (
      <div className="space-y-6">
        {inProgress && <ResumeBanner attempt={inProgress} />}
        <div className="rounded-3xl bg-surface p-8 shadow-card sm:p-10">
          <p className="text-sm font-bold tracking-wide text-brand uppercase">Let&apos;s get started</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Take your first practice test</h2>
          <p className="mt-2 max-w-xl text-muted">
            Your scores, skill breakdowns and progress charts appear here after your first test. You can take up to 3 tests a day.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SECTIONS.map((s) => (
              <Link key={s} href={`/exam/${s}`} className="group rounded-3xl bg-canvas p-2.5 transition hover:-translate-y-0.5">
                <SectionArt section={s} className="aspect-[16/9] rounded-2xl" />
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="font-bold">{SECTION_META[s].name}</p>
                    <p className="text-xs text-muted">
                      {SECTION_META[s].questions} questions · {SECTION_META[s].minutes} min
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white transition group-hover:bg-ink group-hover:text-white">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sectionScores = completed.flatMap((a) => [a.englishScore, a.mathScore]).filter((s): s is number => s !== null);
  const bestTotal = Math.max(0, ...completed.filter((a) => a.section === "general").map((a) => a.score ?? 0));
  const bestSection = Math.max(0, ...sectionScores);
  const accuracies = chronological.map((a) => percent(a.correct, a.total));
  const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
  const totalSeconds = completed.reduce((sum, a) => sum + a.secondsSpent, 0);
  const domains = aggregateDomains(completed);
  const target = profile?.target_score;

  const trend = chronological.map((a) => ({
    label: formatDate(a.submittedAt ?? a.startedAt, { month: "short", day: "numeric", year: undefined }),
    english: a.englishScore,
    math: a.mathScore,
  }));

  return (
    <div className="space-y-6">
      {inProgress && <ResumeBanner attempt={inProgress} />}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<BookOpenCheck className="size-4" />}
          tint="bg-english-soft text-english"
          title="Tests completed"
          value={String(completed.length)}
          spark={chronological.map((_, i) => i + 1)}
          sparkColor="#14b8a6"
        />
        <StatCard
          icon={<Trophy className="size-4" />}
          tint="bg-general-soft text-general"
          title={bestTotal ? "Best total score" : "Best section score"}
          value={String(bestTotal || bestSection)}
          spark={
            bestTotal
              ? chronological.filter((a) => a.section === "general").map((a) => a.score ?? 0)
              : chronological.flatMap((a) => [a.englishScore, a.mathScore]).filter((v): v is number => v !== null)
          }
          sparkColor="#f59e0b"
        />
        <StatCard
          icon={<Target className="size-4" />}
          tint="bg-math-soft text-math"
          title="Average accuracy"
          value={`${avgAccuracy}%`}
          spark={accuracies}
          sparkColor="#7b6cff"
        />
        <StatCard
          icon={<Clock className="size-4" />}
          tint="bg-brand-soft text-brand"
          title="Time practiced"
          value={formatDuration(totalSeconds)}
          spark={chronological.map((a) => a.secondsSpent)}
          sparkColor="#6c5ce7"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card
          title="Section score trend"
          subtitle={target ? `Scaled scores by attempt · your target total is ${target}` : "Scaled section scores by attempt"}
        >
          <ScoreTrend data={trend} />
        </Card>

        <div className="flex flex-col gap-6">
          {usage && (
            <div className="rounded-3xl bg-ink p-6 text-white shadow-float">
              <p className="text-sm font-semibold text-white/60">Tests today</p>
              <p className="mt-1 text-4xl font-extrabold">
                {usage.remaining}
                <span className="text-lg font-semibold text-white/50"> of {usage.limit} left</span>
              </p>
              <div className="mt-4 flex gap-1.5">
                {Array.from({ length: usage.limit }, (_, i) => (
                  <span key={i} className={cn("h-2 flex-1 rounded-full", i < usage.used ? "bg-lime" : "bg-white/15")} />
                ))}
              </div>
              <ButtonLink href="/dashboard/tests" variant="lime" className="mt-5 w-full" aria-disabled={usage.remaining === 0}>
                {usage.remaining ? "Start a test" : "Come back tomorrow"}
              </ButtonLink>
            </div>
          )}
          <Card title="Recent attempts">
            <ul className="-my-2 divide-y divide-line">
              {completed.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link href={`/results/${a.id}`} className="flex items-center gap-3 py-3 transition hover:opacity-80">
                    <SectionArt section={a.section} className="size-11 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.testTitle}</p>
                      <p className="text-xs text-muted">{formatDate(a.submittedAt ?? a.startedAt)}</p>
                    </div>
                    <span className="text-lg font-extrabold tabular-nums">{a.score}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <Card title="Domain mastery" subtitle="Accuracy across every completed test">
        <DomainBars data={domains} />
      </Card>
    </div>
  );
}

function ResumeBanner({ attempt }: { attempt: AttemptSummary }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-lime p-6 sm:flex-row sm:items-center">
      <div>
        <p className="font-bold">You have a test in progress</p>
        <p className="text-sm text-ink/70">
          {attempt.testTitle} — the timer is still running. Resume before it runs out.
        </p>
      </div>
      <ButtonLink href={`/exam/${attempt.section}`} variant="dark">
        Resume test
      </ButtonLink>
    </div>
  );
}

function StatCard({
  icon,
  tint,
  title,
  value,
  spark,
  sparkColor,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  value: string;
  spark: number[];
  sparkColor: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-card">
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
        <span className={cn("grid size-7 place-items-center rounded-lg", tint)}>{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="flex items-end justify-between gap-3 px-5 pt-3 pb-4">
        <p className="text-3xl font-extrabold tracking-tight whitespace-nowrap tabular-nums">{value}</p>
        <div className="w-24 min-w-0 shrink">
          <Sparkline values={spark} color={sparkColor} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-6 shadow-card">
      <h2 className="font-bold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
