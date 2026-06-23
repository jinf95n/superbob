"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfessionalActiveStatusAction,
  updateProfessionalVerifiedStatusAction,
} from "@/modules/professionals/actions";
import { Button } from "@/components/ui/Button";

type ProfessionalStatusToggleProps = {
  professionalId: string;
  isActive: boolean;
  isVerified: boolean;
};

export function ProfessionalStatusToggle({
  professionalId,
  isActive,
  isVerified,
}: ProfessionalStatusToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      await updateProfessionalActiveStatusAction(professionalId, !isActive);
      router.refresh();
    });
  }

  function toggleVerified() {
    startTransition(async () => {
      await updateProfessionalVerifiedStatusAction(
        professionalId,
        !isVerified,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        className="px-2 py-1 text-xs"
        disabled={isPending}
        onClick={toggleActive}
      >
        {isActive ? "Desactivar" : "Activar"}
      </Button>
      <Button
        variant="secondary"
        className="px-2 py-1 text-xs"
        disabled={isPending}
        onClick={toggleVerified}
      >
        {isVerified ? "Quitar verificación" : "Verificar"}
      </Button>
    </div>
  );
}
