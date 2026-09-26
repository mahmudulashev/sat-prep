import type { ChoiceLetter, Difficulty, StimulusBlock, Subject } from "../../src/lib/exam/types.ts";

type Base = {
  id: string;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  stimulus?: StimulusBlock[];
  prompt: string;
  explanation: string;
};

export type McqSeed = Base & {
  type?: "mcq";
  choices: [string, string, string, string];
  answer: ChoiceLetter;
};

export type SprSeed = Base & {
  type: "spr";
  /** Numeric value used for equivalent-answer checks. */
  value: number;
  /** Canonical forms, first one is shown as the correct answer. */
  accepted: string[];
};

export type QuestionSeed = McqSeed | SprSeed;

export type SubjectBank = { subject: Subject; questions: QuestionSeed[] };

export const text = (value: string, title?: string): StimulusBlock =>
  title ? { type: "text", text: value, title } : { type: "text", text: value };
