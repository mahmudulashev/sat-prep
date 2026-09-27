"use client";

import { AlertCircle, ArrowLeft, Clock, Coffee, Loader2, Lock, Maximize, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { SectionArt } from "@/components/section-art";
import { Button, ButtonLink } from "@/components/ui/button";
import { MAX_VIOLATIONS, SECTION_META } from "@/lib/exam/constants";
import { formSize, moduleSize } from "@/lib/exam/forms";
import type { AttemptPayload, TestForm, UsageStatus } from "@/lib/exam/types";
import { cn } from "@/lib/utils";
import { ExamRunner } from "./exam-runner";
import { enterFullscreen, exitFullscreen, FULLSCREEN_REQUIRED } from "./use-lockdown";

type Props = {
  test: TestForm;
  usage: UsageStatus | null;
  studentName: string;
  signedIn: boolean;
};

function hoursUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.max(1, Math.round((ms % 3_600_000) / 60_000));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ExamLobby({ test, usage, studentName, signedIn }: Props) {
  const [attempt, setAttempt] = useState<AttemptPayload | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const meta = SECTION_META[test.section];
  const resumable = usage?.active.find((a) => a.test_id === test.id);
  const outOfTests = !resumable && (limitHit || (usage ? usage.remaining <= 0 : false));
  const totalQuestions = formSize(test);
  const totalMinutes = test.modules.reduce((n, m) => n + m.duration_seconds / 60, 0);

  async function start() {
    setError(null);
    setStarting(true);
    const fullscreen = await enterFullscreen();
    if (!fullscreen && FULLSCREEN_REQUIRED && !usage?.unlimited) {
      setStarting(false);
      setError("Your browser blocked full screen. Allow full screen for this site and try again.");
      return;
    }
    try {
      const response = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        await exitFullscreen();
        if (data.code === "DAILY_LIMIT_REACHED") setLimitHit(true);
        else setError("We couldn't start the test. Please try again.");
        return;
      }
      setAttempt(data as AttemptPayload);
    } catch {
      await exitFullscreen();
      setError("Network error — check your connection and try again.");
    } finally {
      setStarting(false);
    }
  }

  if (attempt)
    return (
      <ExamRunner initial={attempt} studentName={studentName} unrestricted={Boolean(usage?.unlimited)} signedIn={signedIn} />
    );

  return (
    <div className="min-h-screen" data-page-scale="app">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link
          href={signedIn ? "/dashboard/tests" : "/#tests"}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All tests
        </Link>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 pt-4 pb-16 sm:px-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="animate-fade-up rounded-3xl bg-surface p-3 shadow-card">
          <SectionArt section={test.section} className="aspect-[16/7] rounded-[1.4rem] short:aspect-[16/5]" />
          <div className="p-5 sm:p-7">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: meta.soft, color: meta.accent }}>
              {meta.name} · {meta.scoreRange}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{test.title}</h1>
            <p className="mt-3 max-w-xl text-muted">{test.description}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-ink-2">
              <span className="flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5">
                <Timer className="size-4 text-brand" /> {totalMinutes} min
              </span>
              <span className="flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5">{totalQuestions} questions</span>
              <span className="flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5">{test.modules.length} modules</span>
            </div>

            <ol className="mt-8 space-y-3">
              {test.modules.map((m, i) => (
                <li key={i}>
                  {m.break_seconds ? (
                    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-muted">
                      <Coffee className="size-4" /> {m.break_seconds / 60}-minute break
                    </div>
                  ) : null}
                  <div className="flex items-center gap-4 rounded-2xl bg-canvas px-4 py-3.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-white text-sm font-bold shadow-sm">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{m.title}</p>
                      <p className="text-sm text-muted">
                        {moduleSize(m)} questions
                        {m.adaptive ? " · adapts to your Module " + (m.adaptive.from + 1) + " score" : ""}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-2">
                      <Clock className="size-4" /> {m.duration_seconds / 60} min
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="flex animate-fade-up flex-col gap-6 [animation-delay:80ms]">
          <div className="rounded-3xl bg-ink p-7 text-white shadow-float">
            <h2 className="text-xl font-bold">Before you begin</h2>
            <ul className="mt-5 space-y-4 text-sm text-white/80">
              <Rule icon={<Maximize className="size-4" />}>
                The test opens in full screen and must stay there until you finish.
              </Rule>
              <Rule icon={<Lock className="size-4" />}>
                Right-click, copy and paste, developer tools and browser shortcuts are disabled.
              </Rule>
              <Rule icon={<ShieldCheck className="size-4" />}>
                Leaving full screen, switching tabs or opening developer tools gives a warning. After {MAX_VIOLATIONS} warnings
                the test is submitted automatically.
              </Rule>
              <Rule icon={<Timer className="size-4" />}>
                Each module has its own timer, which keeps running if you close the page. Your answers save automatically.
              </Rule>
            </ul>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-white/8 p-4 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-4 accent-[#e3f86b]"
              />
              I understand the test rules and I&apos;m ready to start.
            </label>

            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-danger/20 px-4 py-3 text-sm text-white">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}

            {outOfTests ? (
              <div className="mt-6 rounded-2xl bg-white/10 p-5 text-sm">
                <p className="font-semibold text-white">
                  You&apos;ve used today&apos;s {usage?.is_guest ? "free test" : "tests"}.
                </p>
                <p className="mt-1 text-white/70">
                  {usage?.is_guest
                    ? "Create a free account to take up to 4 tests a day and save your results."
                    : `Your limit resets in ${usage ? hoursUntil(usage.resets_at) : "a few hours"}.`}
                </p>
                {usage?.is_guest && (
                  <ButtonLink href={`/signup?next=/exam/${test.section}`} variant="lime" className="mt-4 w-full">
                    Create free account
                  </ButtonLink>
                )}
              </div>
            ) : (
              <Button variant="lime" size="lg" className="mt-6 w-full" disabled={!agreed || starting} onClick={start}>
                {starting && <Loader2 className="size-4 animate-spin" />}
                {resumable ? "Resume test" : "Start test"}
              </Button>
            )}
          </div>

          {usage && (
            <div className="flex flex-1 flex-col rounded-3xl bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Tests today</p>
                <p className="text-sm text-muted">
                  {usage.unlimited ? `${usage.used} taken · no limit` : `${usage.used} of ${usage.limit} used`}
                </p>
              </div>
              {!usage.unlimited && (
                <div className="mt-3 flex gap-1.5">
                  {Array.from({ length: usage.limit }, (_, i) => (
                    <span key={i} className={cn("h-2 flex-1 rounded-full", i < usage.used ? "bg-brand" : "bg-line")} />
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm text-muted">
                {usage.is_guest ? (
                  <>
                    Guests get 2 tests a day and results aren&apos;t saved.{" "}
                    <Link href={`/signup?next=/exam/${test.section}`} className="font-semibold text-brand hover:underline">
                      Sign up
                    </Link>{" "}
                    for 4 tests a day with saved progress.
                  </>
                ) : (
                  <>Testing as {studentName}. Every result is saved to your dashboard.</>
                )}
              </p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function Rule({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 text-lime">{icon}</span>
      <span>{children}</span>
    </li>
  );
}
