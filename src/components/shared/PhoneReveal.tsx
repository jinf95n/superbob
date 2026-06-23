"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { revealPhoneAction } from "@/modules/contacts/actions";
import { ContactEventSource } from "@prisma/client";

type PhoneRevealProps = {
  professionalId: string;
  source: ContactEventSource;
};

export function PhoneReveal({ professionalId, source }: PhoneRevealProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRevealing, startReveal] = useTransition();

  if (isPending) {
    return <p className="text-sm text-neutral-500">Cargando...</p>;
  }

  if (phone) {
    return (
      <a href={`tel:${phone}`} className="font-medium text-blue-600">
        {phone}
      </a>
    );
  }

  const handleClick = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    startReveal(async () => {
      const result = await revealPhoneAction({ professionalId, source });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.phone) {
        setPhone(result.phone);
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isRevealing}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {isRevealing ? "Cargando..." : "Ver teléfono"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
