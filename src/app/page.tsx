import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  Clock,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { CountUp, RevealOnScroll } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";
import { SectionArt } from "@/components/section-art";
import { SocialLinks } from "@/components/social-links";
import { ButtonLink } from "@/components/ui/button";
import { GUEST_DAILY_LIMIT, MEMBER_DAILY_LIMIT, SECTION_META, SECTIONS } from "@/lib/exam/constants";
import { getCurrentUser } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/utils";

export default async function Home() {
  const { user } = await getCurrentUser();

  return (
    <div className="min-h-screen" data-page-scale="landing">
      <RevealOnScroll />
      <SiteHeader signedIn={Boolean(user)} />

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Hero signedIn={Boolean(user)} />
        <Tests />
        <Features />
        <Plans signedIn={Boolean(user)} />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7 rounded-lg" />
            <span className="font-semibold text-ink">{SITE_NAME}</span>
            <span>· Digital SAT practice</span>
          </div>
          <SocialLinks withHandles />
        </div>
        <p className="border-t border-line px-4 py-4 text-center text-xs text-muted">
          SAT is a trademark of the College Board, which is not affiliated with this site.
        </p>
      </footer>
    </div>
  );
}

function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="grid gap-4 pt-8 sm:pt-12 short:pt-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="relative animate-fade-up overflow-hidden rounded-3xl bg-lime p-7 sm:p-10 short:py-8">
          <Link
            href={signedIn ? "/dashboard/tests" : "#tests"}
            className="inline-flex h-11 w-20 items-center justify-end rounded-full p-1 ring-2 ring-ink/10 transition hover:ring-ink/25"
            aria-label="Browse tests"
          >
            <span className="grid size-9 animate-nudge place-items-center rounded-full bg-white shadow-sm">
              <ArrowUpRight className="size-5" />
            </span>
          </Link>
          <h1 className="mt-6 text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-ink sm:text-6xl short:mt-4 short:text-[3.25rem]">
            <span className="rise-line">
              <span style={{ "--d": "150ms" } as React.CSSProperties}>Boost your</span>
            </span>
            <span className="rise-line">
              <span style={{ "--d": "270ms" } as React.CSSProperties}>SAT confidence</span>
            </span>
          </h1>
          <p className="mt-5 max-w-xl animate-fade-up text-[0.9375rem] [animation-delay:420ms] short:mt-4 leading-relaxed text-ink/75 sm:text-base">
            Timed Math, Reading and Writing, and combined practice tests in an interface that
            works like the real digital SAT, with detailed score analytics after every attempt.
          </p>
          <div className="mt-7 flex animate-fade-up flex-wrap gap-3 [animation-delay:520ms] short:mt-6">
            <ButtonLink href={signedIn ? "/dashboard/tests" : "#tests"} variant="dark" size="lg">
              Start a practice test
              <ArrowRight className="size-4" />
            </ButtonLink>
            {!signedIn && (
              <ButtonLink href="/signup" variant="secondary" size="lg" className="bg-white/70 ring-ink/10">
                Create free account
              </ButtonLink>
            )}
          </div>
          <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 size-56 animate-drift rounded-full bg-white/25 blur-2xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
          <div className="animate-fade-up rounded-3xl bg-surface p-7 shadow-card [animation-delay:80ms] short:py-5">
            <p className="text-2xl leading-snug font-light text-ink-2 sm:text-[1.7rem]">
              Practice perfect,
              <br />
              achieve excellence.
            </p>
          </div>
          <div className="grid animate-fade-up grid-cols-3 gap-2 rounded-3xl bg-surface p-5 shadow-card [animation-delay:140ms]">
            {[
              { icon: Clock, label: "Timed" },
              { icon: Lock, label: "Locked" },
              { icon: BarChart3, label: "Scored" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-canvas py-4">
                <Icon className="size-5 text-brand" />
                <span className="text-xs font-semibold text-ink-2">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ScorePreview />
    </section>
  );
}

function ScorePreview() {
  const trend = [1080, 1130, 1120, 1190, 1240, 1230, 1310, 1340];
  const max = 1400;
  const min = 1000;
  const points = trend
    .map((v, i) => `${(i / (trend.length - 1)) * 240 + 10},${90 - ((v - min) / (max - min)) * 80}`)
    .join(" ");

  return (
    <div className="relative flex animate-fade-up flex-col overflow-hidden rounded-3xl bg-surface p-3 shadow-card [animation-delay:60ms]">
      <div className="rounded-[1.4rem] bg-gradient-to-br from-[#1f2468] to-[#2d3494] p-6 text-white">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-extrabold tracking-tight">SAT</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Combined · Test 1</span>
        </div>
        <p className="mt-6 text-center text-xs font-bold tracking-[0.14em] text-white/70 short:mt-4">TOTAL SCORE</p>
        <p className="text-center text-6xl font-extrabold tracking-tight">
          <CountUp from={400} to={1340} delay={250} duration={1800} />
        </p>
        <p className="text-center text-xs text-white/60">400–1600</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="rounded-2xl bg-english-soft p-4">
          <p className="text-xs font-semibold text-ink-2">Reading and Writing</p>
          <p className="mt-1 text-2xl font-extrabold">
            <CountUp from={200} to={680} delay={450} />
          </p>
        </div>
        <div className="rounded-2xl bg-math-soft p-4">
          <p className="text-xs font-semibold text-ink-2">Math</p>
          <p className="mt-1 text-2xl font-extrabold">
            <CountUp from={200} to={660} delay={550} />
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex flex-1 flex-col rounded-2xl bg-canvas p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Score trend</p>
          <span className="inline-block animate-pop rounded-full bg-lime px-2 py-0.5 text-xs font-bold [--d:1.9s]">+260</span>
        </div>
        <svg viewBox="0 0 260 100" preserveAspectRatio="none" className="mt-2 min-h-24 w-full flex-1 animate-sweep [--d:600ms]" aria-hidden>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6c5ce7" stopOpacity="0.25" />
              <stop offset="1" stopColor="#6c5ce7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`10,100 ${points} 250,100`} fill="url(#trend-fill)" />
          <polyline points={points} fill="none" stroke="#6c5ce7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}

function Tests() {
  return (
    <section id="tests" className="scroll-mt-6 pt-24">
      <SectionHeading
        eyebrow="Practice tests"
        title="Three ways to practice"
        body="Each test runs in a locked, full-screen interface with the same tools you'll see on test day."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {SECTIONS.map((section, i) => {
          const meta = SECTION_META[section];
          return (
            <div key={section} data-reveal className="flex" style={{ "--d": `${i * 120}ms` } as React.CSSProperties}>
              <Link
                href={`/exam/${section}`}
                className="group flex flex-1 flex-col rounded-3xl bg-surface p-3 shadow-card ring-1 ring-transparent transition hover:-translate-y-1 hover:ring-line"
              >
                <SectionArt section={section} className="aspect-[16/10] rounded-[1.3rem]" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{meta.name}</h3>
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: meta.soft, color: meta.accent }}>
                      {meta.scoreRange}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{meta.description}</p>
                  <div className="mt-5 flex items-center gap-4 border-t border-dashed border-line pt-4 text-sm text-ink-2">
                    <span>{meta.questions} questions</span>
                    <span className="size-1 rounded-full bg-line" />
                    <span>{meta.minutes} min</span>
                    <span className="ml-auto grid size-9 place-items-center rounded-full bg-canvas transition group-hover:bg-ink group-hover:text-white">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="scroll-mt-6 pt-24">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need on test day"
        body="The same tools, layout and pressure as the real digital SAT — plus the feedback it doesn't give you."
      />
      <div className="mt-10">
        <FeatureBento />
      </div>
    </section>
  );
}

function Plans({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="plans" className="scroll-mt-6 pt-24">
      <SectionHeading eyebrow="Plans" title="Free, with a daily rhythm" body="Limits reset every day at 00:00 UTC." />
      <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
        <div data-reveal="zoom" className="rounded-3xl bg-surface p-8 shadow-card">
          <p className="text-sm font-semibold text-muted">Guest</p>
          <p className="mt-2 text-4xl font-extrabold">
            {GUEST_DAILY_LIMIT} <span className="text-lg font-semibold text-muted">test / day</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-2">
            <PlanItem>No sign-up needed</PlanItem>
            <PlanItem>Full test interface and tools</PlanItem>
            <PlanItem>Score report right after the test</PlanItem>
          </ul>
          <ButtonLink href="#tests" variant="secondary" className="mt-8 w-full">
            Try a test now
          </ButtonLink>
        </div>
        <div data-reveal="zoom" className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-float [--d:140ms]">
          <span className="absolute top-6 right-6 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">Recommended</span>
          <p className="text-sm font-semibold text-white/60">Free account</p>
          <p className="mt-2 text-4xl font-extrabold">
            {MEMBER_DAILY_LIMIT} <span className="text-lg font-semibold text-white/60">tests / day</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            <PlanItem dark>Every result saved to your profile</PlanItem>
            <PlanItem dark>Progress charts and domain analytics</PlanItem>
            <PlanItem dark>Full question review with explanations</PlanItem>
          </ul>
          <ButtonLink href={signedIn ? "/dashboard" : "/signup"} variant="lime" className="mt-8 w-full">
            {signedIn ? "Go to dashboard" : "Create free account"}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function PlanItem({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <span className={`grid size-5 place-items-center rounded-full ${dark ? "bg-lime text-ink" : "bg-brand-soft text-brand"}`}>
        <Check className="size-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div data-reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold tracking-wide text-brand uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-muted">{body}</p>}
    </div>
  );
}
