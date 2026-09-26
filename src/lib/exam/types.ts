import type { Enums } from "@/lib/supabase/types";

export type Section = Enums<"exam_section">;
export type Subject = Enums<"subject">;
export type Difficulty = Enums<"difficulty">;
export type QuestionType = Enums<"question_type">;
export type ChoiceLetter = "A" | "B" | "C" | "D";

/**
 * Question text uses a small inline markup:
 *   *italic*   **bold**   $latex$   ___ (blank line)   \* (literal)
 *   {{img:<asset id>:<width>:<height>}} (question image)
 */
export type RichText = string;

export type ScatterFigure = {
  kind: "scatter";
  xLabel: string;
  yLabel: string;
  x: [min: number, max: number, step: number];
  y: [min: number, max: number, step: number];
  points: [number, number][];
  line?: [[number, number], [number, number]];
  /** Draw a zigzag axis break between 0 and the first tick. */
  xBreak?: boolean;
};

export type LineFigure = {
  kind: "line";
  xLabel: string;
  yLabel: string;
  x: [min: number, max: number, step: number];
  y: [min: number, max: number, step: number];
  points: [number, number][];
};

export type BarFigure = {
  kind: "bar";
  yLabel: string;
  xLabel?: string;
  y: [min: number, max: number, step: number];
  bars: { label: string; value: number }[];
};

export type SvgFigure = {
  kind: "svg";
  /** Trusted SVG markup authored in the question bank. */
  svg: string;
  width: number;
  height: number;
};

export type Figure = ScatterFigure | LineFigure | BarFigure | SvgFigure;

export type StimulusBlock =
  | { type: "text"; text: RichText; title?: string }
  | { type: "table"; title?: string; headers: RichText[]; rows: RichText[][]; note?: RichText }
  | { type: "list"; intro?: RichText; items: RichText[] }
  | { type: "figure"; figure: Figure; caption?: RichText }
  | { type: "image"; asset: string; width: number; height: number };

export type ExamQuestion = {
  id: string;
  subject: Subject;
  domain: string;
  type: QuestionType;
  stimulus: StimulusBlock[];
  prompt: RichText;
  choices: RichText[] | null;
};

export type ViolationType =
  | "fullscreen-exit"
  | "tab-hidden"
  | "window-blur"
  | "devtools"
  | "blocked-shortcut"
  | "context-menu"
  | "clipboard";

export type Violation = { type: ViolationType; at: string; detail?: string };

export type ModuleSummary = {
  title: string;
  subject: Subject;
  duration_seconds: number;
  /** Break shown before this module starts, in seconds. */
  break_seconds: number;
  question_count: number;
  /** Adaptive modules get an easier or harder version from the previous module's score. */
  adaptive?: boolean;
  route?: "lower" | "upper" | null;
};

export type TestForm = {
  id: string;
  section: Section;
  title: string;
  description: string;
  modules: {
    title: string;
    subject: Subject;
    duration_seconds: number;
    break_seconds?: number;
    question_ids: string[];
    adaptive?: { from: number; threshold: number; lower: string[]; upper: string[] };
  }[];
  sort: number;
};

export type AttemptPayload = {
  attempt_id: string;
  test_id: string;
  section: Section;
  title: string;
  status: "in_progress";
  started_at: string;
  deadline: string;
  /** Set while the student is on a break before the current module. */
  break_until: string | null;
  server_now: string;
  /** Index of the module being taken; questions belong to this module only. */
  module_index: number;
  modules: ModuleSummary[];
  answers: Record<string, string>;
  flagged: string[];
  time_spent: Record<string, number>;
  violations: Violation[];
  resumed: boolean;
  questions: ExamQuestion[];
};

export type AttemptState =
  | AttemptPayload
  | { attempt_id: string; status: "completed" };

export type UsageStatus = {
  is_guest: boolean;
  /** No daily limit and no test lockdown (the site owner). */
  unlimited?: boolean;
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
  active: { attempt_id: string; test_id: string; section: Section; deadline: string }[];
};

export type DomainBreakdown = Record<string, { subject: Subject; correct: number; total: number }>;

export type ResultItem = {
  id: string;
  number: number;
  subject: Subject;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  type: QuestionType;
  stimulus: StimulusBlock[];
  prompt: RichText;
  choices: RichText[] | null;
  correct_answer: string;
  user_answer: string | null;
  is_correct: boolean;
  flagged: boolean;
  time_spent: number;
  explanation: RichText;
};

export type AttemptResult = {
  attempt_id: string;
  test_id: string;
  section: Section;
  title: string;
  is_guest: boolean;
  started_at: string;
  submitted_at: string;
  modules: ModuleSummary[];
  correct_count: number;
  total_count: number;
  score: number;
  english_score: number | null;
  math_score: number | null;
  breakdown: DomainBreakdown;
  violations: Violation[];
  items: ResultItem[];
};

export type ProgressBody = {
  answers: Record<string, string>;
  flagged: string[];
  timeSpent: Record<string, number>;
  violations: Violation[];
};
