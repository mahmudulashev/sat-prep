import type { ChoiceLetter, Section } from "./types";

export const GUEST_COOKIE = "sp_gid";

export const LETTERS: ChoiceLetter[] = ["A", "B", "C", "D"];

export const GUEST_DAILY_LIMIT = 1;
export const MEMBER_DAILY_LIMIT = 3;

/** Integrity events allowed before the exam is submitted automatically. */
export const MAX_VIOLATIONS = 3;

export const SECTIONS: Section[] = ["math", "english", "general"];

export const SECTION_META: Record<
  Section,
  {
    name: string;
    examTitle: string;
    tagline: string;
    description: string;
    questions: number;
    minutes: number;
    scoreRange: string;
    accent: string;
    soft: string;
  }
> = {
  math: {
    name: "Math",
    examTitle: "Math",
    tagline: "Algebra, advanced math, data and geometry",
    description:
      "Linear equations, functions, statistics and geometry with a built-in graphing calculator and reference sheet.",
    questions: 22,
    minutes: 35,
    scoreRange: "200–800",
    accent: "var(--color-math)",
    soft: "var(--color-math-soft)",
  },
  english: {
    name: "English",
    examTitle: "Reading and Writing",
    tagline: "Reading, vocabulary, grammar and rhetoric",
    description:
      "Short passages covering words in context, evidence, grammar conventions and transitions — just like the digital SAT.",
    questions: 27,
    minutes: 32,
    scoreRange: "200–800",
    accent: "var(--color-english)",
    soft: "var(--color-english-soft)",
  },
  general: {
    name: "General",
    examTitle: "Combined",
    tagline: "Both sections, back to back",
    description:
      "Section 1 Reading and Writing, then Section 2 Math — a full-picture checkup scored on the 400–1600 scale.",
    questions: 39,
    minutes: 53,
    scoreRange: "400–1600",
    accent: "var(--color-general)",
    soft: "var(--color-general-soft)",
  },
};

export const ENGLISH_DOMAINS = [
  "Craft and Structure",
  "Information and Ideas",
  "Standard English Conventions",
  "Expression of Ideas",
] as const;

export const MATH_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
] as const;

export function isSection(value: string): value is Section {
  return (SECTIONS as string[]).includes(value);
}
