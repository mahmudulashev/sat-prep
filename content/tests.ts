import type { Section, Subject } from "../src/lib/exam/types.ts";

export type TestModuleSeed = {
  title: string;
  subject: Subject;
  minutes: number;
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

export const tests: TestFormSeed[] = [
  {
    id: "math-1",
    section: "math",
    title: "Math Practice Test 1",
    description: "Algebra, advanced math, data analysis and geometry. Calculator and reference sheet available.",
    sort: 1,
    modules: [
      {
        title: "Math",
        subject: "math",
        minutes: 35,
        questions: [
          "ma-alg-01", "ma-alg-02", "ma-adv-01", "ma-adv-04", "ma-psd-01", "ma-geo-02",
          "ma-alg-03", "ma-alg-05", "ma-adv-03", "ma-adv-09", "ma-psd-03", "ma-psd-05",
          "ma-psd-09", "ma-geo-03", "ma-geo-04",
          "ma-alg-07", "ma-alg-10", "ma-adv-05", "ma-adv-06", "ma-psd-06", "ma-geo-06", "ma-geo-07",
        ],
      },
    ],
  },
  {
    id: "english-1",
    section: "english",
    title: "Reading and Writing Practice Test 1",
    description: "Words in context, evidence, grammar conventions, transitions and rhetorical synthesis.",
    sort: 2,
    modules: [
      {
        title: "Reading and Writing",
        subject: "english",
        minutes: 32,
        questions: [
          "en-wic-01", "en-wic-02", "en-wic-03", "en-wic-04", "en-wic-06", "en-tsp-02", "en-tsp-03", "en-ctc-02",
          "en-cid-01", "en-cid-02", "en-coe-01", "en-coq-01", "en-coq-02", "en-inf-01", "en-inf-02",
          "en-bnd-01", "en-bnd-02", "en-bnd-04", "en-bnd-05", "en-fss-01", "en-fss-03", "en-fss-04",
          "en-trn-01", "en-trn-03", "en-trn-04", "en-rs-01", "en-rs-02",
        ],
      },
    ],
  },
  {
    id: "general-1",
    section: "general",
    title: "Combined Practice Test 1",
    description: "Section 1 Reading and Writing, then Section 2 Math — scored on the 400–1600 scale.",
    sort: 3,
    modules: [
      {
        title: "Reading and Writing",
        subject: "english",
        minutes: 25,
        questions: [
          "en-wic-05", "en-tsp-01", "en-tsp-04", "en-ctc-01",
          "en-cid-03", "en-coe-02", "en-coe-03", "en-coq-03", "en-inf-03",
          "en-bnd-03", "en-bnd-06", "en-fss-02", "en-fss-05", "en-fss-06",
          "en-trn-02", "en-trn-05", "en-trn-06", "en-rs-03", "en-rs-04", "en-rs-05", "en-rs-06",
        ],
      },
      {
        title: "Math",
        subject: "math",
        minutes: 28,
        questions: [
          "ma-psd-02", "ma-geo-01",
          "ma-alg-04", "ma-alg-06", "ma-alg-09", "ma-adv-02", "ma-adv-07", "ma-psd-04", "ma-psd-07",
          "ma-geo-05", "ma-geo-08", "ma-geo-10",
          "ma-alg-08", "ma-adv-08", "ma-adv-10", "ma-psd-08", "ma-psd-10", "ma-geo-09",
        ],
      },
    ],
  },
];
