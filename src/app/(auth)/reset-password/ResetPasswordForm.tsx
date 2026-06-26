"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/modules/users/actions";
import { useToast } from "@/lib/contexts/ToastContext";

const INPUT_WITH_ICON =
  "w-full rounded-[10px] border-[1.5px] border-sb-border pl-3.5 pr-12 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

type CheckKey = "length" | "uppercase" | "number" | "symbol";

const PASSWORD_CHECKS: { key: CheckKey; label: string }[] = [
  { key: "length", label: "Al menos 8 caracteres" },
  { key: "uppercase", label: "Una mayúscula" },
  { key: "number", label: "Un número" },
  { key: "symbol", label: "Un símbolo (!@#$...)" },
];

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const passwordChecks: Record<CheckKey, boolean> = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword),
  };

  const isPasswordValid = PASSWORD_CHECKS.every((c) => passwordChecks[c.key]);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isPasswordValid && passwordsMatch;

  if (!token) {
    return (
      <main className="w-full max-w-[400px] px-6 py-8 lg:px-8 lg:py-12">
        <h1 className="font-display text-[26px] font-bold text-sb-text">
          Link inválido
        </h1>
        <p className="mt-3 text-[14px] text-sb-muted">
          Este link no es válido o ya expiró.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-[14px] text-sb-blue hover:underline"
        >
          Solicitá un nuevo link
        </Link>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setServerError(null);

    const result = await resetPasswordAction({ token: token!, newPassword });

    setIsLoading(false);
    if ("error" in result) {
      setServerError(result.error);
    } else {
      toast.success("Contraseña actualizada.");
      router.push("/login");
    }
  }

  return (
    <main className="w-full max-w-[400px] px-6 py-8 lg:px-8 lg:py-12">
      <p className="font-display text-[24px] font-extrabold text-sb-blue lg:hidden">
        SUPERBOB
      </p>

      <h1 className="font-display mt-6 text-[26px] font-bold text-sb-text lg:mt-0">
        Nueva contraseña
      </h1>
      <p className="mt-1.5 text-[14px] text-sb-muted">
        Creá una contraseña segura para tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-[13px] font-medium text-sb-text"
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={INPUT_WITH_ICON}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sb-muted transition-colors hover:text-sb-text"
              aria-label={showNew ? "Ocultar contraseña" : "Ver contraseña"}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>

          {newPassword.length > 0 && (
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-[13px] font-medium text-sb-text"
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT_WITH_ICON}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-sb-muted transition-colors hover:text-sb-text"
              aria-label={showConfirm ? "Ocultar contraseña" : "Ver contraseña"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="mt-1.5 text-xs text-sb-error">
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        {serverError && (
          <div className="rounded-xl border border-sb-border bg-sb-bg p-4">
            <p className="text-sm text-sb-error">{serverError}</p>
            <Link
              href="/forgot-password"
              className="mt-1 inline-block text-xs text-sb-blue hover:underline"
            >
              Solicitá un nuevo link
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="font-display mt-5 w-full rounded-[10px] bg-sb-blue py-[13px] text-[15px] font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </main>
  );
}
