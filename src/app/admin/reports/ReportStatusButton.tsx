"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReportStatus } from "@prisma/client";
import { updateReportStatusAction } from "@/modules/reports/actions";
import { Button } from "@/components/ui/Button";

type ReportStatusButtonProps = {
  reportId: string;
  status: ReportStatus;
};

export function ReportStatusButton({
  reportId,
  status,
}: ReportStatusButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markAs(newStatus: ReportStatus) {
    startTransition(async () => {
      await updateReportStatusAction(reportId, newStatus);
      router.refresh();
    });
  }

  if (status === "resolved") {
    return null;
  }

  return (
    <div className="flex gap-2">
      {status === "pending" && (
        <Button
          variant="secondary"
          className="px-2 py-1 text-xs"
          disabled={isPending}
          onClick={() => markAs("reviewed")}
        >
          Marcar como revisado
        </Button>
      )}
      <Button
        variant="primary"
        className="px-2 py-1 text-xs"
        disabled={isPending}
        onClick={() => markAs("resolved")}
      >
        Marcar como resuelto
      </Button>
    </div>
  );
}
