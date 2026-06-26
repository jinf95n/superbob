"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/modules/users/actions";
import { PasswordResetActionState } from "@/modules/users/types";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: PasswordResetActionState = {};

const INPUT_CLASSES =
  "w-full rounded-[10px] border-[1.5px] border-sb-border px-3.5 py-3 text-[15px] text-sb-text placeholder:text-sb-muted/60 outline-none focus:border-sb-blue focus:ring-2 focus:ring-sb-blue/10";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <div className="w-full max-w-[400px] px-6 py-8 lg:px-8 lg:py-12">
        <h1 className="font-display text-[26px] font-bold text-sb-text">
          Revisá tu email
        </h1>
        <div className="mt-6 rounded-xl border border-sb-border bg-sb-bg p-4">
          <p className="text-sm font-medium text-sb-text">
            Si ese email está registrado, vas a recibir un link en los próximos
            minutos.
          </p>
          <p className="mt-1 text-xs text-sb-muted">
            Revisá también la carpeta de spam.
          </p>
        </div>
        <p className="mt-6 text-[14px] text-sb-muted">
          <Link href="/login" className="text-sb-blue hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <main className="w-full max-w-[400px] px-6 py-8 lg:px-8 lg:py-12">
      <p className="font-display text-[24px] font-extrabold text-sb-blue lg:hidden">
        SUPERBOB
      </p>

      <h1 className="font-display mt-6 text-[26px] font-bold text-sb-text lg:mt-0">
        Recuperar contraseña
      </h1>
      <p className="mt-1.5 text-[14px] text-sb-muted">
        Te enviamos un link para crear una nueva.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
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
            autoComplete="email"
            className={INPUT_CLASSES}
          />
        </div>

        {state.error && (
          <p className="text-sm text-sb-error">{state.error}</p>
        )}

        <SubmitButton
          pendingLabel="Enviando..."
          className="font-display mt-5 w-full rounded-[10px] bg-sb-blue py-[13px] text-[15px] font-semibold text-white transition-colors duration-150 ease-in-out hover:bg-sb-blue/90"
        >
          Enviar link de recuperación
        </SubmitButton>
      </form>

      <p className="mt-6 text-[14px] text-sb-muted">
        <Link href="/login" className="text-sb-blue hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </main>
  );
}
