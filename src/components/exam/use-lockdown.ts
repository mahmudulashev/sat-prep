"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Violation, ViolationType } from "@/lib/exam/types";

/** Violations that count toward the automatic-submission limit. */
export const STRIKE_TYPES: ViolationType[] = ["fullscreen-exit", "tab-hidden", "devtools"];

type KeyboardLock = { lock?: (keys?: string[]) => Promise<void>; unlock?: () => void };

function keyboardApi() {
  return (navigator as Navigator & { keyboard?: KeyboardLock }).keyboard;
}

export async function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (!document.fullscreenElement) {
      await el.requestFullscreen({ navigationUI: "hide" });
    }
    // In Chromium, locking Escape means a quick press no longer exits full screen.
    await keyboardApi()?.lock?.(["Escape"]);
    return true;
  } catch {
    return Boolean(document.fullscreenElement);
  }
}

export async function exitFullscreen() {
  keyboardApi()?.unlock?.();
  if (document.fullscreenElement) {
    await document.exitFullscreen().catch(() => undefined);
  }
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA")
  );
}

/** Keyboard shortcuts that open developer tools, view source, save, print or refresh. */
function isBlockedShortcut(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (key === "f12" || key === "f5") return true;
  if (mod && e.shiftKey && ["i", "j", "c", "k", "e", "m"].includes(key)) return true;
  if (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(key)) return true;
  if (mod && ["u", "s", "p", "r", "o", "f", "g", "h", "j"].includes(key)) return true;
  if (mod && ["c", "x", "a"].includes(key) && !isEditable(e.target)) return true;
  if (mod && key === "v") return true;
  return false;
}

type Options = {
  active: boolean;
  initial?: Violation[];
  maxStrikes: number;
  onLimitReached: () => void;
};

export function useLockdown({ active, initial = [], maxStrikes, onLimitReached }: Options) {
  const [violations, setViolations] = useState<Violation[]>(initial);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [warning, setWarning] = useState<ViolationType | null>(null);
  const limitRef = useRef(onLimitReached);
  const lastRef = useRef<Record<string, number>>({});

  useEffect(() => {
    limitRef.current = onLimitReached;
  }, [onLimitReached]);

  const strikes = violations.filter((v) => STRIKE_TYPES.includes(v.type)).length;

  const record = useCallback((type: ViolationType, detail?: string) => {
    // Collapse bursts of the same event (e.g. blur + hidden on one tab switch).
    const now = Date.now();
    if (now - (lastRef.current[type] ?? 0) < 1500) return;
    lastRef.current[type] = now;

    setViolations((list) => [...list, { type, at: new Date().toISOString(), detail }]);
    if (STRIKE_TYPES.includes(type)) setWarning(type);
  }, []);

  useEffect(() => {
    if (active && strikes >= maxStrikes) limitRef.current();
  }, [active, strikes, maxStrikes]);

  useEffect(() => {
    if (!active) return;

    const onFullscreenChange = () => {
      const on = Boolean(document.fullscreenElement);
      setIsFullscreen(on);
      if (!on) record("fullscreen-exit");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isBlockedShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        record("blocked-shortcut", [e.ctrlKey && "Ctrl", e.metaKey && "Cmd", e.altKey && "Alt", e.shiftKey && "Shift", e.key].filter(Boolean).join("+"));
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      record("context-menu");
    };

    const onClipboard = (e: ClipboardEvent) => {
      if (isEditable(e.target) && e.type !== "paste") return;
      e.preventDefault();
      record("clipboard", e.type);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") record("tab-hidden");
    };

    const onBlur = () => record("window-blur");

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    const onDragStart = (e: DragEvent) => e.preventDefault();

    // Docked developer tools shrink the viewport relative to the window.
    const devtoolsTimer = window.setInterval(() => {
      const gapW = window.outerWidth - window.innerWidth;
      const gapH = window.outerHeight - window.innerHeight;
      if (document.fullscreenElement && (gapW > 200 || gapH > 250)) record("devtools");
    }, 1500);

    // In production, pause execution whenever developer tools are open: a
    // `debugger` statement only halts (and takes time) while they are attached.
    let trapTimer: number | undefined;
    if (process.env.NODE_ENV === "production") {
      trapTimer = window.setInterval(() => {
        const start = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        if (performance.now() - start > 120) record("devtools");
      }, 1000);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("dragstart", onDragStart);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(devtoolsTimer);
      if (trapTimer) window.clearInterval(trapTimer);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, record]);

  const resume = useCallback(async () => {
    const ok = await enterFullscreen();
    setIsFullscreen(ok);
    if (ok) setWarning(null);
    return ok;
  }, []);

  return {
    violations,
    strikes,
    isFullscreen,
    warning,
    dismissWarning: () => setWarning(null),
    resume,
  };
}
