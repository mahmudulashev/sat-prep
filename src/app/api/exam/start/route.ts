import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/exam/api";
import { startAttempt } from "@/lib/exam/server";

const bodySchema = z.object({ testId: z.string().min(1).max(40) });

export async function POST(request: Request) {
  try {
    const { testId } = bodySchema.parse(await request.json());
    const attempt = await startAttempt(testId);
    return NextResponse.json(attempt, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
