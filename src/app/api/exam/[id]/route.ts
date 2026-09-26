import { NextResponse } from "next/server";
import { errorResponse, parseAttemptId } from "@/lib/exam/api";
import { getAttempt } from "@/lib/exam/server";

export async function GET(_request: Request, ctx: RouteContext<"/api/exam/[id]">) {
  try {
    const id = parseAttemptId((await ctx.params).id);
    const attempt = await getAttempt(id);
    return NextResponse.json(attempt, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
