"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReportStatus } from "@prisma/client";
import { updateReportStatusAction } from "@/modules/reports/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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
  const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(
    null,
  );

  function markAs(newStatus: ReportStatus) {
    setPendingStatus(newStatus);
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
          className="flex items-center gap-1.5 px-2 py-1 text-xs"
          disabled={isPending}
          onClick={() => markAs("reviewed")}
        >
          {isPending && pendingStatus === "reviewed" && (
            <Spinner className="h-3 w-3" />
          )}
          Marcar como revisado
        </Button>
      )}
      <Button
        variant="primary"
        className="flex items-center gap-1.5 px-2 py-1 text-xs"
        disabled={isPending}
        onClick={() => markAs("resolved")}
      >
        {isPending && pendingStatus === "resolved" && (
          <Spinner className="h-3 w-3" />
        )}
        Marcar como resuelto
      </Button>
    </div>
  );
}
