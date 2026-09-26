"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

type Mode = "login" | "signup";

export function AuthForm({ mode, next, notice }: { mode: Mode; next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signIn : signUp,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Take up to 3 tests a day and keep every result."
          : "Sign in to continue your SAT practice."}
      </p>

      {(state.error || notice) && !state.message && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl bg-danger/8 px-4 py-3 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.error ?? notice}
        </p>
      )}

      {state.message ? (
        <div className="mt-6 rounded-2xl bg-english-soft p-5 text-sm text-ink-2">
          <CheckCircle2 className="mb-2 size-6 text-english" />
          {state.message}
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          {isSignup && (
            <Field label="Full name" name="fullName" autoComplete="name" defaultValue={state.fields?.fullName} />
          )}
          <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.fields?.email} />
          <div className="relative">
            <Field
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 bottom-3 rounded-lg p-1 text-muted hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <Button type="submit" disabled={pending} className="mt-2 w-full" size="lg">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link
          href={isSignup ? "/login" : `/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand hover:underline"
        >
          {isSignup ? "Sign in" : "Create a free account"}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, ...props }: React.ComponentProps<"input"> & { label: string; name: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-2">{label}</span>
      <input
        required
        className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[0.9375rem] transition outline-none placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/12"
        {...props}
      />
    </label>
  );
}
