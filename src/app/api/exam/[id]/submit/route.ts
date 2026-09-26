import { NextResponse } from "next/server";
import { errorResponse, parseAttemptId, readProgress } from "@/lib/exam/api";
import { submitAttempt } from "@/lib/exam/server";

export async function POST(request: Request, ctx: RouteContext<"/api/exam/[id]/submit">) {
  try {
    const id = parseAttemptId((await ctx.params).id);
    const result = await submitAttempt(id, await readProgress(request));
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
