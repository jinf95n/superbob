"use client";

import { useRouter } from "next/navigation";
import {
  updateProfessionalActiveStatusAction,
  updateProfessionalVerifiedStatusAction,
} from "@/modules/professionals/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

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

  const activeToggle = useServerAction(updateProfessionalActiveStatusAction, {
    onSuccess: () => router.refresh(),
  });
  const verifiedToggle = useServerAction(
    updateProfessionalVerifiedStatusAction,
    { onSuccess: () => router.refresh() },
  );

  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        isPending={activeToggle.isPending}
        isSuccess={activeToggle.isSuccess}
        onClick={() => activeToggle.execute(professionalId, !isActive)}
      >
        {isActive ? "Desactivar" : "Activar"}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        isPending={verifiedToggle.isPending}
        isSuccess={verifiedToggle.isSuccess}
        onClick={() => verifiedToggle.execute(professionalId, !isVerified)}
      >
        {isVerified ? "Quitar verificación" : "Verificar"}
      </Button>
    </div>
  );
}
