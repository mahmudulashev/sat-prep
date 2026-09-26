"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_VIOLATIONS } from "@/lib/exam/constants";
import type { AttemptPayload, AttemptState, ChoiceLetter, ExamQuestion, ProgressBody } from "@/lib/exam/types";
import { cn } from "@/lib/utils";
import { CalculatorPanel } from "./calculator";
import {
  BlueButton,
  ExamFooter,
  ExamHeader,
  ExamModal,
  moduleLabel,
  NavigatorPopover,
  PracticeBanner,
  type GridItem,
} from "./chrome";
import { Highlightable, type Highlight } from "./highlighter";
import { Choices, QuestionBar, SplitPane, SprDirections, SprInput } from "./question-parts";
import { ReferenceSheet } from "./reference-sheet";
import { StimulusBlocks, Rich } from "./rich-text";
import { BreakScreen, CheckYourWork, Finished, LineReader, LockdownOverlay, ModuleOver } from "./screens";
import { exitFullscreen, useLockdown } from "./use-lockdown";

type View = "question" | "review" | "module-over" | "break" | "finished";
type Local = { eliminated: Record<string, ChoiceLetter[]>; highlights: Record<string, Highlight[]> };

const storageKey = (attemptId: string) => `satify:attempt:${attemptId}`;

/** Seconds from the payload's server time until a timestamp. */
function secondsUntil(iso: string | null, serverNow: string) {
  return iso ? Math.max(0, (new Date(iso).getTime() - new Date(serverNow).getTime()) / 1000) : 0;
}

function clockFor(payload: AttemptPayload) {
  return {
    remaining: secondsUntil(payload.deadline, payload.server_now),
    breakRemaining: secondsUntil(payload.break_until, payload.server_now),
  };
}

function loadLocal(attemptId: string): Local {
  try {
    const raw = localStorage.getItem(storageKey(attemptId));
    if (raw) return JSON.parse(raw) as Local;
  } catch {
    // Storage may be unavailable (private mode); annotations are optional.
  }
  return { eliminated: {}, highlights: {} };
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function ExamRunner({ initial, studentName }: { initial: AttemptPayload; studentName: string }) {
  const [attempt, setAttempt] = useState(initial);
  const [view, setView] = useState<View>(initial.break_until ? "break" : "question");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initial.answers ?? {});
  const [flagged, setFlagged] = useState<string[]>(initial.flagged ?? []);
  const [local, setLocal] = useState<Local>(() => loadLocal(initial.attempt_id));
  const [eliminateMode, setEliminateMode] = useState(false);
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [finishMessage, setFinishMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Tools and popovers
  const [timerHidden, setTimerHidden] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(!initial.resumed);
  const [navOpen, setNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referenceExpanded, setReferenceExpanded] = useState(false);
  const [highlightsHint, setHighlightsHint] = useState(false);
  const [lineReader, setLineReader] = useState(false);
  const [modal, setModal] = useState<"help" | "shortcuts" | "exit" | null>(null);

  // Clock: server time = Date.now() + offset, refreshed by an interval.
  const offsetRef = useRef(0);
  const [clock, setClock] = useState(() => clockFor(initial));
  const { remaining, breakRemaining } = clock;

  const timeSpent = useRef<Record<string, number>>({ ...(initial.time_spent ?? {}) });
  const questionStart = useRef(0);
  const submitting = useRef(false);
  const viewRef = useRef(view);

  const questions = attempt.questions;
  const current = questions[Math.min(index, questions.length - 1)] as ExamQuestion | undefined;
  const currentModule = attempt.modules[attempt.module_index];
  const title = moduleLabel(attempt.modules, attempt.module_index);
  const active = view !== "finished" && view !== "module-over";

  /* ------------------------------------------------------------------ */
  /* Progress + persistence                                              */
  /* ------------------------------------------------------------------ */

  const flushTime = useCallback(() => {
    if (!current || view !== "question") {
      questionStart.current = Date.now();
      return;
    }
    const elapsed = (Date.now() - questionStart.current) / 1000;
    questionStart.current = Date.now();
    if (elapsed > 0 && elapsed < 3600) {
      timeSpent.current[current.id] = Math.round((timeSpent.current[current.id] ?? 0) + elapsed);
    }
  }, [current, view]);

  const endExamRef = useRef<(reason: string) => void>(() => undefined);
  const lockdown = useLockdown({
    active,
    initial: initial.violations ?? [],
    maxStrikes: MAX_VIOLATIONS,
    onLimitReached: () => endExamRef.current("The test was submitted automatically after repeated integrity warnings."),
  });

  const progress = useCallback((): ProgressBody => {
    flushTime();
    const moduleIds = new Set(questions.map((q) => q.id));
    return {
      answers: Object.fromEntries(Object.entries(answers).filter(([id, v]) => moduleIds.has(id) && v)),
      flagged: flagged.filter((id) => moduleIds.has(id)),
      timeSpent: Object.fromEntries(Object.entries(timeSpent.current).filter(([id]) => moduleIds.has(id))),
      violations: lockdown.violations.slice(-200),
    };
  }, [answers, flagged, flushTime, lockdown.violations, questions]);

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const save = useCallback(async () => {
    if (submitting.current) return;
    try {
      await postJson(`/api/exam/${attempt.attempt_id}/save`, progressRef.current());
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [attempt.attempt_id]);

  // Debounced autosave after changes (answers, flags, integrity events), plus a periodic save.
  const violationCount = lockdown.violations.length;
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(save, 1200);
    return () => window.clearTimeout(id);
  }, [answers, flagged, violationCount, active, save]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(save, 20000);
    const onHide = () => {
      if (document.visibilityState === "hidden" && !submitting.current) {
        navigator.sendBeacon(`/api/exam/${attempt.attempt_id}/save`, JSON.stringify(progressRef.current()));
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [active, attempt.attempt_id, save]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(attempt.attempt_id), JSON.stringify(local));
    } catch {
      // Ignore storage failures.
    }
  }, [local, attempt.attempt_id]);

  /* ------------------------------------------------------------------ */
  /* Module flow                                                         */
  /* ------------------------------------------------------------------ */

  const finish = useCallback(async (attemptId: string, message?: string) => {
    setCompletedId(attemptId);
    setFinishMessage(message);
    setView("finished");
    await exitFullscreen();
  }, []);

  const applyNext = useCallback((next: AttemptPayload) => {
    offsetRef.current = new Date(next.server_now).getTime() - Date.now();
    setClock(clockFor(next));
    timeSpent.current = { ...timeSpent.current, ...(next.time_spent ?? {}) };
    setAttempt(next);
    setAnswers((a) => ({ ...a, ...next.answers }));
    setIndex(0);
    setEliminateMode(false);
    setCalculatorOpen(false);
    setReferenceOpen(false);
    setDirectionsOpen(true);
    questionStart.current = Date.now();
    setView(next.break_until ? "break" : "question");
  }, []);

  const submitModule = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNavOpen(false);
    const body = progressRef.current();
    const isLast = attempt.module_index >= attempt.modules.length - 1;
    if (!isLast) setView("module-over");

    for (let tries = 0; tries < 4; tries++) {
      try {
        const [result] = await Promise.all([
          postJson<AttemptState>(`/api/exam/${attempt.attempt_id}/submit`, body),
          new Promise((r) => setTimeout(r, isLast ? 0 : 2600)),
        ]);
        submitting.current = false;
        setBusy(false);
        if (result.status === "completed") await finish(result.attempt_id);
        else applyNext(result);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 1500 * (tries + 1)));
      }
    }
    submitting.current = false;
    setBusy(false);
    setSaveError(true);
    setView("review");
  }, [applyNext, attempt.attempt_id, attempt.module_index, attempt.modules.length, finish]);

  /** Ends the whole test: submits the current and every remaining module. */
  const endExam = useCallback(
    async (message: string) => {
      if (submitting.current) return;
      submitting.current = true;
      setBusy(true);
      let body: ProgressBody = progressRef.current();
      let attemptId = attempt.attempt_id;
      for (let guard = 0; guard < 8; guard++) {
        try {
          const result = await postJson<AttemptState>(`/api/exam/${attemptId}/submit`, body);
          if (result.status === "completed") {
            submitting.current = false;
            setBusy(false);
            await finish(result.attempt_id, message);
            return;
          }
          attemptId = result.attempt_id;
          body = { answers: {}, flagged: [], timeSpent: {}, violations: lockdown.violations };
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      submitting.current = false;
      setBusy(false);
      setSaveError(true);
    },
    [attempt.attempt_id, finish, lockdown.violations],
  );

  useEffect(() => {
    endExamRef.current = (message: string) => void endExam(message);
  }, [endExam]);

  const submitRef = useRef(submitModule);
  useEffect(() => {
    submitRef.current = submitModule;
    viewRef.current = view;
  }, [submitModule, view]);

  useEffect(() => {
    questionStart.current = Date.now();
    offsetRef.current = new Date(initial.server_now).getTime() - Date.now();
  }, [initial.server_now]);

  // Clock tick. When time runs out the module is submitted (the server allows
  // a short grace period); when a break ends the next module starts.
  useEffect(() => {
    if (view === "finished") return;
    const id = window.setInterval(() => {
      const serverNow = Date.now() + offsetRef.current;
      const next = {
        remaining: Math.max(0, (new Date(attempt.deadline).getTime() - serverNow) / 1000),
        breakRemaining: attempt.break_until ? Math.max(0, (new Date(attempt.break_until).getTime() - serverNow) / 1000) : 0,
      };
      setClock(next);
      const current = viewRef.current;
      if ((current === "question" || current === "review") && next.remaining <= 0 && !submitting.current) {
        void submitRef.current();
      }
      if (current === "break" && next.breakRemaining <= 0) {
        questionStart.current = Date.now();
        setView("question");
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [view, attempt.deadline, attempt.break_until]);

  const resumeFromBreak = useCallback(async () => {
    setBusy(true);
    try {
      const next = await postJson<AttemptState>(`/api/exam/${attempt.attempt_id}/end-break`);
      if (next.status === "completed") await finish(next.attempt_id);
      else {
        offsetRef.current = new Date(next.server_now).getTime() - Date.now();
        setClock(clockFor(next));
        setAttempt(next);
        setView("question");
        questionStart.current = Date.now();
      }
    } finally {
      setBusy(false);
    }
  }, [attempt.attempt_id, finish]);

  /* ------------------------------------------------------------------ */
  /* Navigation + answers                                                */
  /* ------------------------------------------------------------------ */

  const goTo = useCallback(
    (next: number) => {
      flushTime();
      setIndex(next);
      setView("question");
      setNavOpen(false);
    },
    [flushTime],
  );

  const onNext = useCallback(() => {
    if (view === "review") return void submitModule();
    if (index < questions.length - 1) goTo(index + 1);
    else {
      flushTime();
      setView("review");
    }
  }, [view, index, questions.length, goTo, flushTime, submitModule]);

  const onBack = useCallback(() => {
    if (view === "review") return goTo(questions.length - 1);
    if (index > 0) goTo(index - 1);
  }, [view, index, questions.length, goTo]);

  const select = useCallback(
    (letter: ChoiceLetter) => {
      if (!current) return;
      setAnswers((a) => ({ ...a, [current.id]: letter }));
      setLocal((l) => ({
        ...l,
        eliminated: { ...l.eliminated, [current.id]: (l.eliminated[current.id] ?? []).filter((x) => x !== letter) },
      }));
    },
    [current],
  );

  const toggleEliminate = useCallback(
    (letter: ChoiceLetter) => {
      if (!current) return;
      setLocal((l) => {
        const list = l.eliminated[current.id] ?? [];
        const next = list.includes(letter) ? list.filter((x) => x !== letter) : [...list, letter];
        return { ...l, eliminated: { ...l.eliminated, [current.id]: next } };
      });
      if (answers[current.id] === letter) setAnswers((a) => ({ ...a, [current.id]: "" }));
    },
    [current, answers],
  );

  const toggleFlag = useCallback(() => {
    if (!current) return;
    setFlagged((f) => (f.includes(current.id) ? f.filter((x) => x !== current.id) : [...f, current.id]));
  }, [current]);

  // Keyboard shortcuts (Alt + key), ignored while typing.
  useEffect(() => {
    if (view !== "question" && view !== "review") return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const map: Record<string, () => void> = {
        KeyN: onNext,
        KeyB: onBack,
        KeyR: toggleFlag,
        KeyX: () => setEliminateMode((v) => !v),
        KeyC: () => currentModule.subject === "math" && setCalculatorOpen((v) => !v),
        KeyF: () => currentModule.subject === "math" && setReferenceOpen((v) => !v),
        KeyT: () => setTimerHidden((v) => !v),
        KeyL: () => setLineReader((v) => !v),
        Digit1: () => select("A"),
        Digit2: () => select("B"),
        Digit3: () => select("C"),
        Digit4: () => select("D"),
      };
      const action = map[e.code];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, onNext, onBack, toggleFlag, select, currentModule.subject]);

  const gridItems: GridItem[] = useMemo(
    () =>
      questions.map((q, i) => ({
        number: i + 1,
        answered: Boolean(answers[q.id]),
        flagged: flagged.includes(q.id),
        current: view === "question" && i === index,
      })),
    [questions, answers, flagged, index, view],
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  if (view === "finished" && completedId) {
    return <Finished resultHref={`/results/${completedId}`} message={finishMessage} />;
  }
  if (view === "module-over") return <ModuleOver />;
  if (view === "break") {
    return (
      <>
        <BreakScreen remaining={breakRemaining} onResume={resumeFromBreak} busy={busy} />
        {!lockdown.isFullscreen && (
          <LockdownOverlay
            reason={lockdown.warning ?? "fullscreen-exit"}
            strikes={lockdown.strikes}
            maxStrikes={MAX_VIOLATIONS}
            needsFullscreen
            onResume={lockdown.resume}
          />
        )}
      </>
    );
  }
  if (!current) return null;

  const eliminated = local.eliminated[current.id] ?? [];
  const isEnglish = current.subject === "english";
  const isSpr = current.type === "spr";
  const number = index + 1;

  const questionColumn = (
    <div className={cn("pt-9 pb-16 font-serif text-[16px] leading-[1.6] text-bb-ink", isEnglish || isSpr ? "px-10 lg:px-[72px]" : "")}>
      <QuestionBar
        number={number}
        flagged={flagged.includes(current.id)}
        onToggleFlag={toggleFlag}
        eliminateMode={eliminateMode}
        onToggleEliminate={() => setEliminateMode((v) => !v)}
        showEliminator={!isSpr}
      />
      {!isEnglish && current.stimulus.length > 0 && <StimulusBlocks blocks={current.stimulus} className="mt-5" />}
      <div className="mt-4">
        <Rich text={current.prompt} />
      </div>
      {isSpr ? (
        <SprInput value={answers[current.id] ?? ""} onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))} />
      ) : (
        <Choices
          choices={current.choices ?? []}
          selected={answers[current.id]}
          eliminated={eliminated}
          eliminateMode={eliminateMode}
          onSelect={select}
          onEliminate={toggleEliminate}
        />
      )}
    </div>
  );

  let body: React.ReactNode;
  if (view === "review") {
    body = <CheckYourWork title={title} items={gridItems} onSelect={goTo} />;
  } else if (isEnglish) {
    body = (
      <SplitPane
        left={
          <div className="px-10 pt-10 pb-16 font-serif text-[16px] leading-[1.6] text-bb-ink lg:px-[96px]">
            <Highlightable
              highlights={local.highlights[current.id] ?? []}
              onChange={(next) => setLocal((l) => ({ ...l, highlights: { ...l.highlights, [current.id]: next } }))}
            >
              <StimulusBlocks blocks={current.stimulus} />
            </Highlightable>
          </div>
        }
        right={<div className="mx-auto max-w-[760px]">{questionColumn}</div>}
      />
    );
  } else if (isSpr) {
    body = (
      <SplitPane
        left={
          <div className="px-10 pt-10 pb-16 text-bb-ink lg:px-[96px]">
            <SprDirections />
          </div>
        }
        right={<div className="mx-auto max-w-[760px]">{questionColumn}</div>}
      />
    );
  } else {
    body = (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6">{questionColumn}</div>
      </div>
    );
  }

  const showLockdown = !lockdown.isFullscreen || lockdown.warning !== null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white select-none">
      <ExamHeader
        title={title}
        subject={currentModule.subject}
        remaining={remaining}
        timerHidden={timerHidden}
        onToggleTimer={() => setTimerHidden((v) => !v)}
        directionsOpen={directionsOpen}
        onToggleDirections={() => setDirectionsOpen((v) => !v)}
        activeTools={[
          ...(highlightsHint ? (["highlights"] as const) : []),
          ...(calculatorOpen ? (["calculator"] as const) : []),
          ...(referenceOpen ? (["reference"] as const) : []),
        ]}
        onTool={(tool) => {
          if (tool === "calculator") setCalculatorOpen((v) => !v);
          if (tool === "reference") setReferenceOpen((v) => !v);
          if (tool === "highlights") setHighlightsHint((v) => !v);
        }}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen((v) => !v)}
        onMore={(item) => {
          setMoreOpen(false);
          if (item === "line-reader") setLineReader((v) => !v);
          else setModal(item);
        }}
        lineReaderOn={lineReader}
      />

      <div className="relative flex min-h-0 flex-1">
        {calculatorOpen && (
          <aside className="w-[min(420px,40vw)] shrink-0 border-r border-[#cfcfcf] shadow-[2px_0_8px_rgba(0,0,0,0.08)]">
            <CalculatorPanel onClose={() => setCalculatorOpen(false)} />
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <PracticeBanner />
          {highlightsHint && isEnglish && view === "question" && (
            <div className="mx-auto mt-3 flex items-center gap-3 rounded-full bg-[#fff8d6] px-4 py-1.5 font-exam text-[13px]">
              Select any text in the passage to highlight or underline it.
              <button type="button" className="font-bold underline" onClick={() => setHighlightsHint(false)}>
                Got it
              </button>
            </div>
          )}
          <main className="min-h-0 flex-1">{body}</main>
        </div>
        {referenceOpen && (
          <aside
            className={cn(
              "shrink-0 border-l border-[#cfcfcf] shadow-[-2px_0_8px_rgba(0,0,0,0.08)]",
              referenceExpanded ? "w-[min(760px,60vw)]" : "w-[min(620px,40vw)]",
            )}
          >
            <ReferenceSheet
              onClose={() => setReferenceOpen(false)}
              expanded={referenceExpanded}
              onToggleExpand={() => setReferenceExpanded((v) => !v)}
            />
          </aside>
        )}
      </div>

      <ExamFooter
        studentName={studentName}
        navLabel={view === "question" ? `Question ${number} of ${questions.length}` : undefined}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((v) => !v)}
        canBack={view === "review" || index > 0}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={busy}
        navigator={
          <NavigatorPopover
            title={title}
            items={gridItems}
            onSelect={goTo}
            onClose={() => setNavOpen(false)}
            onReviewPage={() => {
              flushTime();
              setNavOpen(false);
              setView("review");
            }}
          />
        }
      />

      {saveError && (
        <div className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#1e1e1e] px-4 py-2 font-exam text-sm text-white shadow-lg">
          Connection problem — your answers will be saved when you&apos;re back online.
        </div>
      )}

      {lineReader && <LineReader onClose={() => setLineReader(false)} />}

      {modal === "help" && (
        <ExamModal title="Help" onClose={() => setModal(null)} wide>
          <p>
            <strong>Navigating:</strong> use <strong>Back</strong> and <strong>Next</strong>, or open the question menu at
            the bottom of the screen to jump to any question in this module.
          </p>
          <p>
            <strong>Mark for Review:</strong> flag a question to come back to it. Flagged questions show a red bookmark on
            the review page.
          </p>
          <p>
            <strong>Answer eliminator:</strong> select the ABC button to cross out answer choices you have ruled out.
          </p>
          <p>
            <strong>Highlights:</strong> in Reading and Writing, select text in the passage to highlight or underline it.
          </p>
          <p>
            <strong>Calculator and reference sheet:</strong> available for every Math question.
          </p>
          <p>
            <strong>Test security:</strong> the test runs in full screen. Leaving full screen, switching tabs or opening
            developer tools is recorded; after {MAX_VIOLATIONS} warnings the test is submitted automatically.
          </p>
        </ExamModal>
      )}

      {modal === "shortcuts" && (
        <ExamModal title="Keyboard Shortcuts" onClose={() => setModal(null)}>
          <ul className="divide-y divide-[#eee]">
            {[
              ["Next question", "Alt + N"],
              ["Previous question", "Alt + B"],
              ["Mark for review", "Alt + R"],
              ["Choose answer A–D", "Alt + 1 … 4"],
              ["Answer eliminator", "Alt + X"],
              ["Calculator", "Alt + C"],
              ["Reference sheet", "Alt + F"],
              ["Hide / show timer", "Alt + T"],
              ["Line reader", "Alt + L"],
            ].map(([label, keys]) => (
              <li key={label} className="flex justify-between py-2.5">
                <span>{label}</span>
                <kbd className="rounded bg-[#f0f0f0] px-2 py-0.5 font-mono text-sm">{keys}</kbd>
              </li>
            ))}
          </ul>
        </ExamModal>
      )}

      {modal === "exit" && (
        <ExamModal
          title="Exit the Exam?"
          onClose={() => setModal(null)}
          actions={
            <>
              <button type="button" className="h-11 rounded-full px-5 font-bold hover:bg-black/5" onClick={() => setModal(null)}>
                Keep Testing
              </button>
              <BlueButton
                disabled={busy}
                onClick={() => {
                  setModal(null);
                  void endExam("You ended the test early. Unanswered questions were scored as incorrect.");
                }}
              >
                Submit and Exit
              </BlueButton>
            </>
          }
        >
          <p>
            Your test will be submitted now and scored as it is. Unanswered questions — including any remaining modules — count
            as incorrect, and this attempt still counts toward today&apos;s limit.
          </p>
        </ExamModal>
      )}

      {showLockdown && (
        <LockdownOverlay
          reason={lockdown.warning}
          strikes={lockdown.strikes}
          maxStrikes={MAX_VIOLATIONS}
          needsFullscreen={!lockdown.isFullscreen}
          onResume={async () => {
            if (!lockdown.isFullscreen) await lockdown.resume();
            else lockdown.dismissWarning();
          }}
        />
      )}
    </div>
  );
}
