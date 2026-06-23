"use server";

import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { UpdateReportStatusActionState } from "./types";

export async function updateReportStatusAction(
  reportId: string,
  status: ReportStatus,
): Promise<UpdateReportStatusActionState> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status },
  });

  return {};
}
