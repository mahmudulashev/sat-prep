import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { ExamError } from "./server";
import type { ProgressBody } from "./types";

const uuid = z.uuid();

const progressSchema = z.object({
  answers: z.record(z.string().max(40), z.string().max(12)).default({}),
  flagged: z.array(z.string().max(40)).max(100).default([]),
  timeSpent: z.record(z.string().max(40), z.number().min(0).max(36000)).default({}),
  violations: z
    .array(
      z.object({
        type: z.enum([
          "fullscreen-exit",
          "tab-hidden",
          "window-blur",
          "devtools",
          "blocked-shortcut",
          "context-menu",
          "clipboard",
        ]),
        at: z.string().max(40),
        detail: z.string().max(80).optional(),
      }),
    )
    .max(200)
    .default([]),
});

export function parseAttemptId(id: string) {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ExamError("ATTEMPT_NOT_FOUND");
  return parsed.data;
}

/** Accepts JSON sent with fetch() as well as text/plain beacons. */
export async function readProgress(request: Request): Promise<ProgressBody> {
  const raw = await request.text();
  let json: unknown = {};
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    json = {};
  }
  return progressSchema.parse(json);
}

export function errorResponse(error: unknown) {
  if (error instanceof ExamError) {
    return NextResponse.json({ code: error.code }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json({ code: "BAD_REQUEST" }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ code: "UNKNOWN" }, { status: 500 });
}
