import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { ENGLISH_DOMAINS, MATH_DOMAINS, STRIKE_TYPES } from "@/lib/exam/constants";
import type { DomainBreakdown, Section, Subject, Violation } from "@/lib/exam/types";
import { getCurrentUser } from "@/lib/supabase/server";

export type AttemptSummary = {
  id: string;
  testId: string;
  testTitle: string;
  section: Section;
  status: "in_progress" | "completed";
  startedAt: string;
  submittedAt: string | null;
  deadline: string;
  score: number | null;
  englishScore: number | null;
  mathScore: number | null;
  correct: number;
  total: number;
  breakdown: DomainBreakdown;
  secondsSpent: number;
  strikes: number;
};

/** The signed-in user's profile and attempts (deduplicated per request). */
export const getDashboardData = cache(async () => {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: rows }, { data: forms }] = await Promise.all([
    supabase.from("profiles").select("full_name, target_score, test_date, created_at").eq("id", user.id).maybeSingle(),
    supabase
      .from("attempts")
      .select(
        "id, test_id, section, status, started_at, submitted_at, deadline, score, english_score, math_score, correct_count, total_count, breakdown, time_spent, violations",
      )
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(200),
    supabase.from("test_forms").select("id, title"),
  ]);

  const titles = new Map((forms ?? []).map((f) => [f.id, f.title]));

  const attempts: AttemptSummary[] = (rows ?? []).map((r) => ({
    id: r.id,
    testId: r.test_id,
    testTitle: titles.get(r.test_id) ?? r.test_id,
    section: r.section,
    status: r.status,
    startedAt: r.started_at,
    submittedAt: r.submitted_at,
    deadline: r.deadline,
    score: r.score,
    englishScore: r.english_score,
    mathScore: r.math_score,
    correct: r.correct_count ?? 0,
    total: r.total_count ?? 0,
    breakdown: (r.breakdown ?? {}) as DomainBreakdown,
    secondsSpent: Object.values((r.time_spent ?? {}) as Record<string, number>).reduce((a, b) => a + b, 0),
    strikes: ((r.violations ?? []) as Violation[]).filter((v) => STRIKE_TYPES.includes(v.type)).length,
  }));

  const name = profile?.full_name || user.email?.split("@")[0] || "Student";

  return { user, profile, name, attempts, completed: attempts.filter((a) => a.status === "completed") };
});

export function aggregateDomains(attempts: AttemptSummary[]) {
  const totals = new Map<string, { subject: Subject; correct: number; total: number }>();
  for (const a of attempts) {
    for (const [domain, v] of Object.entries(a.breakdown)) {
      const t = totals.get(domain) ?? { subject: v.subject, correct: 0, total: 0 };
      t.correct += v.correct;
      t.total += v.total;
      totals.set(domain, t);
    }
  }
  const order = [...ENGLISH_DOMAINS, ...MATH_DOMAINS] as readonly string[];
  return [...totals.entries()]
    .map(([domain, v]) => ({ domain, ...v }))
    .sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain));
}


/** An unfinished attempt whose module timer is still running (or paused, when the deadline is "infinity"). */
export function isRunning(attempt: AttemptSummary) {
  return attempt.status === "in_progress" && (attempt.deadline === "infinity" || new Date(attempt.deadline).getTime() > Date.now());
}

/** Whole days from today until a YYYY-MM-DD date (negative once it has passed). */
export function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86_400_000);
}
