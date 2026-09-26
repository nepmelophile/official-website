"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { Button } from "@/components/admin/Button";
import { inputClass, labelClass } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

const initialState: LoginState = {};

export function LoginForm({ next, disabled }: { next: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const error = state.error;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {error ? (
        <div
          role="alert"
          id="login-error"
          className="flex items-start gap-3 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-fg"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className={labelClass}>
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          defaultValue={state.email}
          key={state.email ?? "email"}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-error" : undefined}
          className={cn(inputClass, "py-2.5")}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className={labelClass}>
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className={cn(inputClass, "py-2.5 pr-11")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-xs text-fg-subtle hover:text-fg"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-4" strokeWidth={1.75} />
            ) : (
              <Eye aria-hidden className="size-4" strokeWidth={1.75} />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        </div>
      </div>

      <Button type="submit" variant="primary" loading={pending} disabled={disabled} className="w-full py-3">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
