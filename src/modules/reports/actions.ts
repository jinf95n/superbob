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
    include: {
      reporter: { select: { fullName: true } },
      reportedUser: { select: { fullName: true } },
    },
  });

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      await resendClient.emails.send({
        from: "SUPERBOB <noreply@superbob.com.ar>",
        to: process.env.ADMIN_EMAIL ?? "admin@superbob.com.ar",
        subject: `[REPORTE] Nuevo reporte pendiente — SUPERBOB`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#1A6FE0;margin:0 0 16px;">Nuevo reporte recibido</h2>
            <p style="color:#1A1A18;margin:0 0 8px;">
              <strong>Reportado:</strong> ${report.reportedUser.fullName}
            </p>
            <p style="color:#1A1A18;margin:0 0 8px;">
              <strong>Motivo:</strong> ${report.reason}
            </p>
            <p style="color:#1A1A18;margin:0 0 8px;">
              <strong>Descripción:</strong> ${report.description ?? "Sin descripción"}
            </p>
            <p style="color:#1A1A18;margin:0 0 24px;">
              <strong>Reportado por:</strong> ${report.reporter.fullName}
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reports"
              style="background:#1A6FE0;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
              Ver en el panel →
            </a>
          </div>
        `,
      });
    }
  } catch (emailError) {
    console.error("[ADMIN EMAIL] Error enviando notificación:", emailError);
  }

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
