"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/modules/users/actions";
import { AuthActionState } from "@/modules/users/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GoogleSignInButton } from "@/components/shared/GoogleSignInButton";
import { useToast } from "@/lib/contexts/ToastContext";

const initialState: AuthActionState = {};

const INPUT_CLASSES =
  "w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

const INPUT_WITH_ICON =
  "w-full rounded-[10px] border-[1.5px] border-sb-border pl-3.5 pr-12 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

type CheckKey = "length" | "uppercase" | "number" | "symbol";

const PASSWORD_CHECKS: { key: CheckKey; label: string }[] = [
  { key: "length", label: "Al menos 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "number", label: "Un número" },
  { key: "symbol", label: "Un símbolo (!@#$...)" },
];

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const toastShownRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks: Record<CheckKey, boolean> = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = PASSWORD_CHECKS.every((c) => passwordChecks[c.key]);

  useEffect(() => {
    if (state.success && state.redirectTo && !toastShownRef.current) {
      toastShownRef.current = true;
      setIsNavigating(true);
      toast.success("Cuenta creada. Bienvenido a SUPERBOB.");
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
            <p className="text-[14px] text-sb-muted">Creando cuenta...</p>
          </div>
        </div>
      )}
      <main className="w-full max-w-[400px] px-6 py-8 lg:px-8 lg:py-12">
        <p className="font-display text-[24px] font-extrabold text-sb-blue lg:hidden">
          SUPERBOB
        </p>

        <h1 className="font-display mt-6 text-[26px] font-bold text-sb-text lg:mt-0">
          Creá tu cuenta
        </h1>
        <p className="mt-1.5 text-[14px] text-sb-muted">
          Gratis. Sin tarjeta de crédito.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-[13px] font-medium text-sb-text"
            >
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className={INPUT_CLASSES}
            />
          </div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {password.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {PASSWORD_CHECKS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={passwordChecks[key] ? "#18A058" : "#D1D5DB"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      {passwordChecks[key] ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <circle cx="12" cy="12" r="10" />
                      )}
                    </svg>
                    <span
                      className={`text-xs ${
                        passwordChecks[key] ? "text-sb-success" : "text-sb-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-sb-error">{state.error}</p>
          )}

          <SubmitButton
            disabled={!isPasswordValid}
            pendingLabel="Creando cuenta..."
            className="font-display mt-5 w-full rounded-[10px] bg-sb-blue py-[13px] text-[15px] font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90"
          >
            Crear cuenta
          </SubmitButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-sb-border" />
          <span className="text-sm text-sb-muted">o</span>
          <div className="h-px flex-1 bg-sb-border" />
        </div>

        <GoogleSignInButton />

        <p className="mt-4 text-[14px] text-sb-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-sb-blue hover:underline">
            Ingresá
          </Link>
        </p>
      </main>
    </>
  );
}
