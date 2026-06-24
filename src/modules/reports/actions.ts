"use server";

import { headers } from "next/headers";
import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth, requireAdminSession } from "@/lib/auth";
import {
  CreateReportActionState,
  CreateReportInput,
  CreateReportSchema,
  UpdateReportStatusActionState,
} from "./types";

export async function createReportAction(
  input: CreateReportInput,
): Promise<CreateReportActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Necesitás iniciar sesión" };
  }

  const parsed = CreateReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { reportedUserId, reportedProfessionalId, reason, description } =
    parsed.data;

  if (reportedUserId === session.user.id) {
    return { error: "No podés reportarte a vos mismo" };
  }

  const report = await prisma.report.create({
    data: {
      reporterId: session.user.id,
      reportedUserId,
      reportedProfessionalId,
      reason,
      description,
    },
  });

  // Sin servicio de email configurado en Fase 1: se deja registro en logs
  // para que el admin lo vea hasta que se integre un proveedor real.
  console.log(
    `[reports] Nuevo reporte ${report.id} de ${session.user.id} contra ${reportedUserId}: ${reason}`,
  );

  return { success: true };
}

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
