"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

type ActionState = "idle" | "pending" | "success" | "error";

type UseServerActionOptions = {
  onSuccess?: (result: unknown) => void;
  onError?: (error: string) => void;
  /** ms que dura el estado success antes de volver a idle. Default: 1500 */
  successDuration?: number;
};

type UseServerActionReturn<TArgs extends unknown[]> = {
  execute: (...args: TArgs) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  state: ActionState;
  error: string | null;
  reset: () => void;
};

const DEFAULT_SUCCESS_DURATION_MS = 1500;

/**
 * El resultado de una Server Action en esta app es `{ error: string }`,
 * `{ success: true }`/algo con otros campos, o `void`. Solo el primer caso
 * cuenta como error: cualquier otra cosa (incluido undefined) es éxito.
 */
function extractErrorMessage(result: unknown): string | null {
  if (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string"
  ) {
    return (result as { error: string }).error;
  }
  return null;
}

/**
 * redirect() y notFound() de Next.js funcionan lanzando un error especial
 * con un `digest` ("NEXT_REDIRECT" / "NEXT_NOT_FOUND") que el framework
 * necesita ver propagarse sin que código de la app lo trate como un error
 * de negocio. Varias Server Actions existentes (login, crear/editar perfil
 * profesional) redirigen así internamente — si los tratáramos como error
 * acá, la navegación se rompería y mostraríamos un mensaje de error falso.
 */
function isNextNavigationSignal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    /^(NEXT_REDIRECT|NEXT_NOT_FOUND)/.test((error as { digest: string }).digest)
  );
}

export function useServerAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: UseServerActionOptions,
): UseServerActionReturn<TArgs> {
  const { onSuccess, onError, successDuration = DEFAULT_SUCCESS_DURATION_MS } =
    options ?? {};

  const [isTransitionPending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setError(null);
  }, []);

  const execute = useCallback(
    (...args: TArgs) =>
      new Promise<void>((resolve) => {
        setError(null);

        startTransition(async () => {
          try {
            const result = await action(...args);
            const errorMessage = extractErrorMessage(result);

            if (errorMessage) {
              setPhase("error");
              setError(errorMessage);
              onError?.(errorMessage);
            } else {
              setPhase("success");
              onSuccess?.(result);
            }
          } catch (caught) {
            if (isNextNavigationSignal(caught)) {
              // Dejamos que Next maneje el redirect()/notFound(): no lo
              // tratamos como error de negocio ni resolvemos la promesa,
              // para no interferir con la navegación en curso.
              throw caught;
            }

            const message =
              caught instanceof Error
                ? caught.message
                : "Algo salió mal. Intentá de nuevo.";
            setPhase("error");
            setError(message);
            onError?.(message);
          }

          resolve();
        });
      }),
    [action, onError, onSuccess],
  );

  const state: ActionState = isTransitionPending ? "pending" : phase;

  // El timer de "volver a idle" se arma a partir de que el éxito es
  // *visible* (state realmente vale "success"), no de cuando la action
  // resolvió internamente. Si el éxito quedó tapado por una transición
  // larga (ej. un onSuccess que llama a router.refresh() y tarda en
  // traer datos nuevos), el usuario igual ve "Listo" su successDuration
  // completo en vez de que se lo pierda mientras seguía en pending.
  useEffect(() => {
    if (state !== "success") {
      return;
    }
    const timeout = setTimeout(() => {
      setPhase((current) => (current === "success" ? "idle" : current));
    }, successDuration);
    return () => clearTimeout(timeout);
  }, [state, successDuration]);

  return {
    execute,
    isPending: state === "pending",
    isSuccess: state === "success",
    isError: state === "error",
    state,
    error,
    reset,
  };
}
