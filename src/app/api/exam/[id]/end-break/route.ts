import { NextResponse } from "next/server";
import { errorResponse, parseAttemptId } from "@/lib/exam/api";
import { endBreak } from "@/lib/exam/server";

export async function POST(_request: Request, ctx: RouteContext<"/api/exam/[id]/end-break">) {
  try {
    const id = parseAttemptId((await ctx.params).id);
    return NextResponse.json(await endBreak(id));
  } catch (error) {
    return errorResponse(error);
  }
}
