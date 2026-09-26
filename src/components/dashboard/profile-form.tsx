"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/dashboard/profile/actions";
import { Button } from "@/components/ui/button";

type Props = { fullName: string; targetScore: number | null; testDate: string | null };

export function ProfileForm({ fullName, targetScore, testDate }: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-5">
      <Field label="Full name" hint="Shown at the bottom of the test screen.">
        <input name="fullName" defaultValue={fullName} required maxLength={80} className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Target score" hint="Total score between 400 and 1600.">
          <input
            name="targetScore"
            type="number"
            min={400}
            max={1600}
            step={10}
            defaultValue={targetScore ?? ""}
            placeholder="e.g. 1400"
            className={inputClass}
          />
        </Field>
        <Field label="SAT date" hint="We'll count down the days for you.">
          <input name="testDate" type="date" defaultValue={testDate ?? ""} className={inputClass} />
        </Field>
      </div>

      {state.error && <p className="rounded-2xl bg-danger/8 px-4 py-3 text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save changes
        </Button>
        {state.ok && !pending && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[0.9375rem] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/12";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
