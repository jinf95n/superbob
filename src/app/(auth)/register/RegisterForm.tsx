"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/modules/users/actions";
import { AuthActionState } from "@/modules/users/types";
import { authClient } from "@/lib/auth-client";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <main className="w-full max-w-sm p-8">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="fullName" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>

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
            minLength={8}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
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
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="underline">
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}
