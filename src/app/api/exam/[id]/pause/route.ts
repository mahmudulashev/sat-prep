import { NextResponse } from "next/server";
import { errorResponse, parseAttemptId, readProgress } from "@/lib/exam/api";
import { pauseAttempt } from "@/lib/exam/server";

export async function POST(request: Request, ctx: RouteContext<"/api/exam/[id]/pause">) {
  try {
    const id = parseAttemptId((await ctx.params).id);
    return NextResponse.json(await pauseAttempt(id, await readProgress(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
