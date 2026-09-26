import { ArrowLeft, CheckCircle2, Clock, Flag, ShieldAlert, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DifficultyColumns,
  DomainBars,
  SkillRadar,
  TimingBars,
  type DomainDatum,
  type TimingDatum,
} from "@/components/charts/charts";
import { Logo } from "@/components/logo";
import { QuestionReview } from "@/components/results/question-review";
import { ButtonLink } from "@/components/ui/button";
import { ENGLISH_DOMAINS, MATH_DOMAINS, SECTION_META, STRIKE_TYPES } from "@/lib/exam/constants";
import { ExamError, getResult } from "@/lib/exam/server";
import type { AttemptResult } from "@/lib/exam/types";
import { cn, formatDate, formatDuration, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Score report" };

const RADAR_COLOR = { english: "#14b8a6", math: "#7b6cff", general: "#6c5ce7" } as const;

export default async function ResultPage({ params }: PageProps<"/results/[id]">) {
  const { id } = await params;
  let result: AttemptResult;
  try {
    result = await getResult(id);
  } catch (error) {
    if (error instanceof ExamError && error.code !== "UNKNOWN") notFound();
    throw error;
  }

  const meta = SECTION_META[result.section];
  const isCombined = result.section === "general";
  const range = isCombined ? "400–1600" : "200–800";

  const domainOrder = [...ENGLISH_DOMAINS, ...MATH_DOMAINS] as readonly string[];
  const domains: DomainDatum[] = Object.entries(result.breakdown ?? {})
    .map(([domain, v]) => ({ domain, ...v }))
    .sort((a, b) => domainOrder.indexOf(a.domain) - domainOrder.indexOf(b.domain));

  const difficulty = (["easy", "medium", "hard"] as const).map((level) => {
    const items = result.items.filter((i) => i.difficulty === level);
    return {
      level: level[0].toUpperCase() + level.slice(1),
      correct: items.filter((i) => i.is_correct).length,
      total: items.length,
    };
  });

  const timing: TimingDatum[] = result.items.map((item, i) => ({
    label: String(i + 1),
    seconds: item.time_spent,
    correct: item.is_correct,
    subject: item.subject,
  }));

  const timeUsed = result.items.reduce((sum, i) => sum + i.time_spent, 0);
  const flaggedCount = result.items.filter((i) => i.flagged).length;
  const strikes = (result.violations ?? []).filter((v) => STRIKE_TYPES.includes(v.type)).length;
  const accuracy = percent(result.correct_count, result.total_count);
  const weakest = [...domains].sort((a, b) => a.correct / a.total - b.correct / b.total)[0];

  return (
    <div className="min-h-screen pb-20" data-page-scale="app">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link
          href={result.is_guest ? "/" : "/dashboard"}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> {result.is_guest ? "Home" : "Dashboard"}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
        {result.is_guest && (
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-lime p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold text-ink">This report won&apos;t be saved to a profile.</p>
              <p className="text-sm text-ink/70">Create a free account to keep every result, track progress and take 3 tests a day.</p>
            </div>
            <ButtonLink href="/signup" variant="dark">
              Create free account
            </ButtonLink>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[23.75rem_1fr]">
          {/* Score card, modeled on the official practice score report */}
          <div className="overflow-hidden rounded-3xl bg-surface shadow-card">
            <div className="bg-[#1f2a5c] px-6 pt-5 pb-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold tracking-tight">SAT</span>
                <span className="text-xs font-semibold text-white/70">{formatDate(result.submitted_at)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-[#2b3a7a] px-6 py-2 text-sm font-bold text-white">
              <span className="whitespace-nowrap uppercase">{meta.examTitle}</span>
              <span className="truncate pl-4 text-xs font-semibold text-white/75">{result.title}</span>
            </div>
            <div className="bg-[#f3f6fc] py-7 text-center">
              <p className="text-xs font-bold tracking-[0.14em] text-ink-2">{isCombined ? "TOTAL SCORE" : "SECTION SCORE"}</p>
              <p className="mt-1 text-7xl font-extrabold tracking-tight text-ink">{result.score}</p>
              <p className="mt-1 text-sm text-muted underline decoration-dotted underline-offset-4">{range}</p>
            </div>
            <div className="divide-y divide-line px-6">
              {result.english_score !== null && <SectionScore label="Reading and Writing" score={result.english_score} />}
              {result.math_score !== null && <SectionScore label="Math" score={result.math_score} />}
            </div>
            {result.modules.some((m) => m.route) && (
              <div className="space-y-1.5 border-t border-line px-6 py-4 text-xs text-muted">
                {result.modules.map((m, i) =>
                  m.route ? (
                    <p key={i} className="flex items-center justify-between gap-3">
                      <span>
                        {m.title} · Module {result.modules.slice(0, i + 1).filter((x) => x.subject === m.subject).length}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-bold",
                          m.route === "upper" ? "bg-ink text-lime" : "bg-canvas text-ink-2",
                        )}
                      >
                        {m.route === "upper" ? "Harder version" : "Easier version"}
                      </span>
                    </p>
                  ) : null,
                )}
              </div>
            )}
          </div>

          <div className="grid content-start gap-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile icon={<CheckCircle2 className="size-5" />} label="Correct" value={`${result.correct_count}/${result.total_count}`} hint={`${accuracy}% accuracy`} />
              <StatTile icon={<Clock className="size-5" />} label="Time used" value={formatDuration(timeUsed)} hint={`${formatDuration(timeUsed / Math.max(1, result.total_count))} per question`} />
              <StatTile icon={<Flag className="size-5" />} label="Marked for review" value={String(flaggedCount)} hint="questions flagged" />
              <StatTile
                icon={<ShieldAlert className="size-5" />}
                label="Integrity warnings"
                value={String(strikes)}
                hint={strikes ? "recorded during the test" : "clean attempt"}
              />
            </div>

            {weakest && (
              <div className="flex items-start gap-4 rounded-3xl bg-ink p-6 text-white">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-lime text-ink">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="font-bold">Focus next on {weakest.domain}</p>
                  <p className="mt-1 text-sm text-white/70">
                    You answered {weakest.correct} of {weakest.total} correctly in this area — your lowest domain on this test.
                    Review the explanations below, then retake a test to track your improvement.
                  </p>
                </div>
              </div>
            )}

            <Card title="Skill profile" subtitle="Accuracy by content domain">
              <SkillRadar data={domains} color={RADAR_COLOR[result.section]} />
            </Card>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card title="Performance by domain" subtitle="Percent of questions answered correctly">
            <DomainBars data={domains} />
          </Card>
          <Card title="By difficulty" subtitle="Accuracy on easy, medium and hard questions">
            <DifficultyColumns data={difficulty} />
          </Card>
        </section>

        <Card title="Time per question" subtitle="Seconds spent on each question, in test order">
          <TimingBars data={timing} />
        </Card>

        <Card title="Question review" subtitle="Select a question to see the passage, your answer and an explanation">
          <QuestionReview items={result.items} modules={result.modules} />
        </Card>
      </main>
    </div>
  );
}

function SectionScore({ label, score }: { label: string; score: number }) {
  const pct = ((score - 200) / 600) * 100;
  return (
    <div className="py-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted">200–800</p>
        </div>
        <p className="text-3xl font-bold tabular-nums">{score}</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-surface p-5 shadow-card">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">{icon}</span>
      <p className="mt-4 text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
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
