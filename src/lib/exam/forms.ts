import type { TestForm } from "./types";

type FormModule = TestForm["modules"][number];

/** Questions in a module; adaptive modules have the same size on either route. */
export function moduleSize(m: FormModule) {
  return m.question_ids.length || m.adaptive?.lower.length || 0;
}

export function formSize(test: TestForm) {
  return test.modules.reduce((n, m) => n + moduleSize(m), 0);
}

export function isAdaptive(test: TestForm) {
  return test.modules.some((m) => m.adaptive);
}
