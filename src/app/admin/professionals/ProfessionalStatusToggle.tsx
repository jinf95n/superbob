"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateProfessionalActiveStatusAction,
  updateProfessionalVerifiedStatusAction,
} from "@/modules/professionals/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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
  const [pendingAction, setPendingAction] = useState<
    "active" | "verified" | null
  >(null);

  function toggleActive() {
    setPendingAction("active");
    startTransition(async () => {
      await updateProfessionalActiveStatusAction(professionalId, !isActive);
      router.refresh();
    });
  }

  function toggleVerified() {
    setPendingAction("verified");
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
        className="flex items-center gap-1.5 px-2 py-1 text-xs"
        disabled={isPending}
        onClick={toggleActive}
      >
        {isPending && pendingAction === "active" && (
          <Spinner className="h-3 w-3" />
        )}
        {isActive ? "Desactivar" : "Activar"}
      </Button>
      <Button
        variant="secondary"
        className="flex items-center gap-1.5 px-2 py-1 text-xs"
        disabled={isPending}
        onClick={toggleVerified}
      >
        {isPending && pendingAction === "verified" && (
          <Spinner className="h-3 w-3" />
        )}
        {isVerified ? "Quitar verificación" : "Verificar"}
      </Button>
    </div>
  );
}
