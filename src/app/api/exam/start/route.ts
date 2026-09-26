import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/exam/api";
import { SECTIONS } from "@/lib/exam/constants";
import { startAttempt } from "@/lib/exam/server";

const bodySchema = z.object({ section: z.enum(SECTIONS as [string, ...string[]]) });

export async function POST(request: Request) {
  try {
    const { section } = bodySchema.parse(await request.json());
    const attempt = await startAttempt(section as (typeof SECTIONS)[number]);
    return NextResponse.json(attempt, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
