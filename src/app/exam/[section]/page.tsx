import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamLobby } from "@/components/exam/exam-lobby";
import { isSection, SECTION_META } from "@/lib/exam/constants";
import { getUsage, listTests } from "@/lib/exam/server";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/exam/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? `${SECTION_META[section].name} test` : "Test" };
}

export default async function ExamPage({ params }: PageProps<"/exam/[section]">) {
  const { section } = await params;
  if (!isSection(section)) notFound();

  const [{ supabase, user }, tests, usage] = await Promise.all([
    getCurrentUser(),
    listTests(),
    getUsage().catch(() => null),
  ]);

  const test = tests.find((t) => t.section === section);
  if (!test) notFound();

  let studentName = "Guest Student";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    studentName = profile?.full_name || user.email?.split("@")[0] || "Student";
  }

  return <ExamLobby test={test} usage={usage} studentName={studentName} signedIn={Boolean(user)} />;
}
