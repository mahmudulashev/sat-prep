import { NextResponse } from "next/server";
import { errorResponse, parseAttemptId } from "@/lib/exam/api";
import { resumeAttempt } from "@/lib/exam/server";

export async function POST(_request: Request, ctx: RouteContext<"/api/exam/[id]/resume">) {
  try {
    const id = parseAttemptId((await ctx.params).id);
    return NextResponse.json(await resumeAttempt(id));
  } catch (error) {
    return errorResponse(error);
  }
}
