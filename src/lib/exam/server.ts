import "server-only";

import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { GUEST_COOKIE } from "./constants";
import type {
  AttemptPayload,
  AttemptResult,
  AttemptState,
  ProgressBody,
  TestForm,
  UsageStatus,
} from "./types";

export type ExamErrorCode =
  | "DAILY_LIMIT_REACHED"
  | "ATTEMPT_NOT_FOUND"
  | "ATTEMPT_IN_PROGRESS"
  | "GUEST_KEY_REQUIRED"
  | "TEST_NOT_FOUND"
  | "UNKNOWN";

export class ExamError extends Error {
  constructor(
    public code: ExamErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }

  get status() {
    switch (this.code) {
      case "DAILY_LIMIT_REACHED":
        return 429;
      case "ATTEMPT_NOT_FOUND":
      case "TEST_NOT_FOUND":
        return 404;
      case "ATTEMPT_IN_PROGRESS":
      case "GUEST_KEY_REQUIRED":
        return 409;
      default:
        return 500;
    }
  }
}

const KNOWN_CODES: ExamErrorCode[] = [
  "DAILY_LIMIT_REACHED",
  "ATTEMPT_NOT_FOUND",
  "ATTEMPT_IN_PROGRESS",
  "GUEST_KEY_REQUIRED",
  "TEST_NOT_FOUND",
];

function toExamError(error: { message: string }): ExamError {
  const code = KNOWN_CODES.find((c) => error.message.includes(c)) ?? "UNKNOWN";
  return new ExamError(code, error.message);
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Resolves who is taking the exam. Signed-in users are identified by their
 * session; guests by a hashed httpOnly cookie plus a salted hash of their IP.
 */
export async function getExamContext({ ensureGuestCookie = false } = {}) {
  const [supabase, cookieStore, headerList] = await Promise.all([
    createClient(),
    cookies(),
    headers(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let guestId = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestId && ensureGuestCookie) {
    guestId = crypto.randomUUID();
    cookieStore.set(GUEST_COOKIE, guestId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    null;

  const { examSecret, ipSalt } = serverEnv();

  return {
    supabase,
    user,
    secret: examSecret,
    guestKey: guestId ? sha256(`guest:${guestId}`) : undefined,
    ipHash: ip ? sha256(`${ipSalt}:${ip}`) : undefined,
  };
}

export async function getUsage(): Promise<UsageStatus> {
  const ctx = await getExamContext();
  const { data, error } = await ctx.supabase.rpc("usage_status", {
    p_secret: ctx.secret,
    p_guest_key: ctx.guestKey,
    p_ip_hash: ctx.ipHash,
  });
  if (error) throw toExamError(error);
  return data as unknown as UsageStatus;
}

export async function listTests(): Promise<TestForm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("test_forms")
    .select("id, section, title, description, modules, sort")
    .order("sort");
  if (error) throw toExamError(error);
  return data as unknown as TestForm[];
}

export async function startAttempt(testId: string): Promise<AttemptPayload> {
  const ctx = await getExamContext({ ensureGuestCookie: true });
  const { data, error } = await ctx.supabase.rpc("start_attempt", {
    p_secret: ctx.secret,
    p_test_id: testId,
    p_guest_key: ctx.guestKey,
    p_ip_hash: ctx.ipHash,
  });
  if (error) throw toExamError(error);
  return data as unknown as AttemptPayload;
}

export async function getAttempt(attemptId: string): Promise<AttemptState> {
  const ctx = await getExamContext();
  const { data, error } = await ctx.supabase.rpc("get_attempt", {
    p_secret: ctx.secret,
    p_attempt_id: attemptId,
    p_guest_key: ctx.guestKey,
  });
  if (error) throw toExamError(error);
  return data as unknown as AttemptState;
}

function progressArgs(body: ProgressBody) {
  return {
    p_answers: body.answers as Json,
    p_flagged: body.flagged,
    p_time_spent: body.timeSpent as Json,
    p_violations: body.violations as unknown as Json,
  };
}

export async function saveProgress(attemptId: string, body: ProgressBody) {
  const ctx = await getExamContext();
  const { data, error } = await ctx.supabase.rpc("save_progress", {
    p_secret: ctx.secret,
    p_attempt_id: attemptId,
    p_guest_key: ctx.guestKey,
    ...progressArgs(body),
  });
  if (error) throw toExamError(error);
  return data as { status: string; deadline: string; server_now: string };
}

/** Finishes the current module; returns the next module or a completed state. */
export async function submitModule(attemptId: string, body: ProgressBody): Promise<AttemptState> {
  const ctx = await getExamContext();
  const { data, error } = await ctx.supabase.rpc("submit_module", {
    p_secret: ctx.secret,
    p_attempt_id: attemptId,
    p_guest_key: ctx.guestKey,
    ...progressArgs(body),
  });
  if (error) throw toExamError(error);
  return data as unknown as AttemptState;
}

export async function getResult(attemptId: string): Promise<AttemptResult> {
  const ctx = await getExamContext();
  const { data, error } = await ctx.supabase.rpc("get_result", {
    p_secret: ctx.secret,
    p_attempt_id: attemptId,
    p_guest_key: ctx.guestKey,
  });
  if (error) throw toExamError(error);
  return data as unknown as AttemptResult;
}
