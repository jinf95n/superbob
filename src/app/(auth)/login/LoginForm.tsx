"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/modules/users/actions";
import { AuthActionState } from "@/modules/users/types";
import { authClient } from "@/lib/auth-client";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <main className="w-full max-w-sm p-8">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <SubmitButton
          pendingLabel="Ingresando..."
          className="rounded bg-neutral-900 px-4 py-2 text-white"
        >
          Ingresar
        </SubmitButton>
      </form>

      <button
        type="button"
        onClick={() =>
          authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
        }
        className="mt-4 w-full rounded border border-neutral-300 px-4 py-2"
      >
        Continuar con Google
      </button>

      <p className="mt-4 text-sm text-neutral-600">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="underline">
          Creá una
        </Link>
      </p>
    </main>
  );
}
