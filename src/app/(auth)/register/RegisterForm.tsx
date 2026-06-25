"use client";

import { useActionState, useEffect, useRef } from "react";
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

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const router = useRouter();
  const { toast } = useToast();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (state.success && state.redirectTo && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Cuenta creada. Bienvenido a SUPERBOB.");
      router.push(state.redirectTo);
    }
  }, [state, router, toast]);

  return (
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
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className={INPUT_CLASSES}
          />
        </div>

        {state.error && <p className="text-sm text-sb-error">{state.error}</p>}

        <SubmitButton
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
  );
}
