import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TestsView } from "@/components/dashboard/tests-view";
import { isSection } from "@/lib/exam/constants";
import type { Section } from "@/lib/exam/types";

const TITLE: Record<Section, string> = { math: "Math", english: "Reading and Writing", general: "Full-length" };

export async function generateMetadata({ params }: PageProps<"/dashboard/tests/[section]">): Promise<Metadata> {
  const { section } = await params;
  return { title: isSection(section) ? `${TITLE[section]} tests` : "Tests" };
}

export default async function SectionTestsPage({ params }: PageProps<"/dashboard/tests/[section]">) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  return <TestsView />;
}
