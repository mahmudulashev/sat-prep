import type { Section, Subject } from "../src/lib/exam/types.ts";

export type TestModuleSeed = {
  title: string;
  subject: Subject;
  minutes: number;
  /** Optional break shown before this module starts (e.g. between sections). */
  breakMinutes?: number;
  questions: string[];
};

export type TestFormSeed = {
  id: string;
  section: Section;
  title: string;
  description: string;
  sort: number;
  modules: TestModuleSeed[];
};

// Digital SAT structure: Reading and Writing has two 32-minute modules of 27
// questions; Math has two 35-minute modules of 22 questions.

const RW_MODULE_1 = [
  // Craft and Structure
  "en-wic-01", "en-wic-02", "en-wic-06", "en-wic-04", "en-tsp-02", "en-tsp-03", "en-ctc-02",
  // Information and Ideas
  "en-cid-01", "en-cid-02", "en-coe-01", "en-coe-03", "en-coq-01", "en-inf-03", "en-inf-01",
  // Standard English Conventions
  "en-bnd-01", "en-bnd-02", "en-bnd-03", "en-bnd-06", "en-fss-01", "en-fss-02", "en-fss-05",
  // Expression of Ideas
  "en-trn-01", "en-trn-02", "en-trn-03", "en-rs-01", "en-rs-03", "en-rs-05",
];

const RW_MODULE_2 = [
  // Craft and Structure
  "en-wic-03", "en-wic-05", "en-wic-07", "en-tsp-01", "en-tsp-05", "en-tsp-04", "en-ctc-01",
  // Information and Ideas
  "en-cid-04", "en-cid-03", "en-coe-02", "en-coq-03", "en-coq-02", "en-inf-02", "en-inf-04",
  // Standard English Conventions
  "en-fss-07", "en-fss-03", "en-bnd-04", "en-bnd-05", "en-fss-04", "en-fss-06",
  // Expression of Ideas
  "en-trn-05", "en-trn-07", "en-trn-04", "en-trn-06", "en-rs-02", "en-rs-04", "en-rs-06",
];

const MATH_MODULE_1 = [
  // easy
  "ma-alg-01", "ma-adv-04", "ma-psd-01", "ma-psd-11", "ma-geo-02", "ma-adv-01",
  // medium
  "ma-alg-03", "ma-alg-05", "ma-alg-11", "ma-adv-03", "ma-adv-09", "ma-psd-03", "ma-psd-05",
  "ma-psd-09", "ma-geo-03", "ma-geo-04", "ma-geo-08",
  // hard
  "ma-alg-07", "ma-adv-06", "ma-psd-06", "ma-geo-06", "ma-psd-10",
];

const MATH_MODULE_2 = [
  // easy
  "ma-alg-02", "ma-psd-02", "ma-geo-01",
  // medium
  "ma-alg-04", "ma-alg-06", "ma-alg-09", "ma-adv-02", "ma-adv-07", "ma-adv-11", "ma-psd-04",
  "ma-psd-07", "ma-geo-05", "ma-geo-10",
  // hard
  "ma-alg-08", "ma-alg-10", "ma-adv-05", "ma-adv-08", "ma-adv-10", "ma-psd-08", "ma-geo-07",
  "ma-geo-09", "ma-geo-11",
];

const rw = (questions: string[]): TestModuleSeed => ({
  title: "Reading and Writing",
  subject: "english",
  minutes: 32,
  questions,
});

const mathModule = (questions: string[], breakMinutes?: number): TestModuleSeed => ({
  title: "Math",
  subject: "math",
  minutes: 35,
  breakMinutes,
  questions,
});

export const tests: TestFormSeed[] = [
  {
    id: "math-1",
    section: "math",
    title: "Math Practice Test 1",
    description: "Two 35-minute modules covering algebra, advanced math, data analysis and geometry.",
    sort: 1,
    modules: [mathModule(MATH_MODULE_1), mathModule(MATH_MODULE_2)],
  },
  {
    id: "english-1",
    section: "english",
    title: "Reading and Writing Practice Test 1",
    description: "Two 32-minute modules covering vocabulary, evidence, grammar, transitions and rhetoric.",
    sort: 2,
    modules: [rw(RW_MODULE_1), rw(RW_MODULE_2)],
  },
  {
    id: "general-1",
    section: "general",
    title: "Full-Length Practice Test 1",
    description: "The complete digital SAT: Reading and Writing, a 10-minute break, then Math — scored 400–1600.",
    sort: 3,
    modules: [rw(RW_MODULE_1), rw(RW_MODULE_2), mathModule(MATH_MODULE_1, 10), mathModule(MATH_MODULE_2)],
  },
];
