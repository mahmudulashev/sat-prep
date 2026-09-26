"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: string };

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  targetScore: z
    .union([z.literal(""), z.coerce.number().int().min(400, "Target must be 400–1600.").max(1600, "Target must be 400–1600.")])
    .transform((v) => (v === "" ? null : v)),
  testDate: z
    .union([z.literal(""), z.iso.date("Enter a valid date.")])
    .transform((v) => (v === "" ? null : v)),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const parsed = schema.safeParse({
    fullName: formData.get("fullName"),
    targetScore: formData.get("targetScore") ?? "",
    testDate: formData.get("testDate") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      target_score: parsed.data.targetScore,
      test_date: parsed.data.testDate,
    })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save your profile. Please try again." };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
