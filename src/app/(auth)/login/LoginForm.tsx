"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/modules/users/actions";
import { AuthActionState } from "@/modules/users/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { useToast } from "@/lib/contexts/ToastContext";

const initialState: AuthActionState = {};

const INPUT_CLASSES =
  "w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

const INPUT_WITH_ICON =
  "w-full rounded-[10px] border-[1.5px] border-sb-border pl-3.5 pr-12 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success && state.redirectTo && !toastShownRef.current) {
      toastShownRef.current = true;
      setIsNavigating(true);
      toast.success("Bienvenido de nuevo.");
      router.push(state.redirectTo);
    }
  }, [state, router, toast]);

  return (
    <>
    {isNavigating && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-sb-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[14px] text-sb-muted">Ingresando...</p>
        </div>
      </div>
    )}
    <main className="w-full max-w-[400px] px-6 py-6 lg:px-8">
      <p className="font-display text-[24px] font-extrabold text-sb-blue lg:hidden">
        SUPERBOB
      </p>

      <h1 className="font-display mt-4 text-[24px] font-bold text-sb-text lg:mt-0">
        Bienvenido de nuevo
      </h1>
      <p className="mt-1 text-[14px] text-sb-muted">
        Ingresá con tu cuenta para continuar.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-3.5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[13px] font-medium text-sb-text"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={INPUT_CLASSES}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-[13px] font-medium text-sb-text"
          >
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className={INPUT_WITH_ICON}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sb-muted transition-colors hover:text-sb-text"
              aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {state.error && <p className="text-sm text-sb-error">{state.error}</p>}

        <SubmitButton
          pendingLabel="Ingresando..."
          className="font-display mt-2 w-full rounded-[10px] bg-sb-blue py-3 text-[15px] font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90"
        >
          Ingresar
        </SubmitButton>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-[13px] text-sb-muted transition-colors hover:text-sb-blue"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-sb-border" />
        <span className="text-sm text-sb-muted">o</span>
        <div className="h-px flex-1 bg-sb-border" />
      </div>

      <GoogleSignInButton />

      <p className="mt-3 text-[14px] text-sb-muted">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="text-sb-blue hover:underline">
          Creá una cuenta
        </Link>
      </p>
    </main>
    </>
  );
}
