"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { deleteAttempt } from "@/app/dashboard/history/actions";
import { Button } from "@/components/ui/button";

export function DeleteAttemptButton({ attemptId, title, score }: { attemptId: string; title: string; score: number | null }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const confirm = () =>
    startTransition(async () => {
      const result = await deleteAttempt(attemptId);
      if (result.ok) setOpen(false);
      else setFailed(true);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger"
        aria-label={`Delete result for ${title}`}
        title="Delete result"
      >
        <Trash2 className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-${attemptId}`}
            className="w-full max-w-sm animate-fade-up rounded-3xl bg-surface p-6 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-danger/10 text-danger">
              <Trash2 className="size-5" />
            </span>
            <h2 id={`delete-${attemptId}`} className="mt-4 text-lg font-bold">
              Delete this result?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {title}
              {score !== null && <> · score {score}</>} will be removed from your history, charts and stats. This
              can&apos;t be undone, and it still counts toward the day&apos;s test limit.
            </p>
            {failed && <p className="mt-3 text-sm text-danger">Couldn&apos;t delete this result. Please try again.</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirm} disabled={pending} className="bg-danger shadow-none hover:bg-danger/90">
                {pending && <Loader2 className="size-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
