"use client";

import { useRouter } from "next/navigation";
import { ReportStatus } from "@prisma/client";
import { updateReportStatusAction } from "@/modules/reports/actions";
import { Button } from "@/components/ui/Button";
import { useServerAction } from "@/lib/hooks/useServerAction";

type ReportStatusButtonProps = {
  reportId: string;
  status: ReportStatus;
};

export function ReportStatusButton({
  reportId,
  status,
}: ReportStatusButtonProps) {
  const router = useRouter();
  const reviewedAction = useServerAction(updateReportStatusAction, {
    onSuccess: () => router.refresh(),
  });
  const resolvedAction = useServerAction(updateReportStatusAction, {
    onSuccess: () => router.refresh(),
  });

  if (status === "resolved") {
    return null;
  }

  return (
    <div className="flex gap-2">
      {status === "pending" && (
        <Button
          variant="secondary"
          size="sm"
          isPending={reviewedAction.isPending}
          isSuccess={reviewedAction.isSuccess}
          onClick={() => reviewedAction.execute(reportId, "reviewed")}
        >
          Marcar como revisado
        </Button>
      )}
      <Button
        variant="primary"
        size="sm"
        isPending={resolvedAction.isPending}
        isSuccess={resolvedAction.isSuccess}
        onClick={() => resolvedAction.execute(reportId, "resolved")}
      >
        Marcar como resuelto
      </Button>
    </div>
  );
}
