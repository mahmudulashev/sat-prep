"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function deleteAttempt(attemptId: string): Promise<{ ok: boolean }> {
  const id = z.uuid().safeParse(attemptId);
  if (!id.success) return { ok: false };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("delete_attempt", { p_attempt_id: id.data });
  if (error || !data) return { ok: false };

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
